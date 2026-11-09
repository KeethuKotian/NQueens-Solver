import os
import sys
import json
import torch
import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List, Tuple, Optional, Dict, Any

# Ensure both backend dir and project root are in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

try:
    from core.board import NQueensBoard
    from core.model import NQueensFCN
    from core.ai_solver import AINQueensSolver
    from core.solver_traditional import TraditionalBacktrackingSolver
    from core.benchmark import BenchmarkSuite
except (ImportError, ValueError):
    from .core.board import NQueensBoard
    from .core.model import NQueensFCN
    from .core.ai_solver import AINQueensSolver
    from .core.solver_traditional import TraditionalBacktrackingSolver
    from .core.benchmark import BenchmarkSuite

app = FastAPI(
    title="Deep Learning N-Queens Solver API",
    description="Interactive AI Reasoning, Policy Prediction, and Backtracking Recovery for N-Queens",
    version="2.0.0"
)

# Enable CORS for local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models and Solver Cache
MODELS: Dict[str, NQueensFCN] = {}
SOLVERS: Dict[str, AINQueensSolver] = {}
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

def load_or_init_models():
    """Initializes and loads available model weights."""
    sl_path = os.path.join(BASE_DIR, "models", "fcn_pv_model.pt")
    rl_path = os.path.join(BASE_DIR, "models", "rl_policy_model.pt")

    # 1. Supervised Learning Model
    sl_model = NQueensFCN(in_channels=3, hidden_dim=64).to(DEVICE)
    if os.path.exists(sl_path):
        try:
            sl_model.load_state_dict(torch.load(sl_path, map_location=DEVICE, weights_only=True))
            print(f"[API] Loaded Supervised model from {sl_path}")
        except Exception as e:
            print(f"[API] Error loading {sl_path}: {e}")
    else:
        print(f"[API] Note: {sl_path} not yet generated; using initialized weights.")
    sl_model.eval()
    MODELS["supervised"] = sl_model
    SOLVERS["supervised"] = AINQueensSolver(sl_model, device=DEVICE)

    # 2. Reinforcement Learning Model
    rl_model = NQueensFCN(in_channels=3, hidden_dim=64).to(DEVICE)
    if os.path.exists(rl_path):
        try:
            rl_model.load_state_dict(torch.load(rl_path, map_location=DEVICE, weights_only=True))
            print(f"[API] Loaded RL model from {rl_path}")
        except Exception as e:
            print(f"[API] Error loading {rl_path}: {e}")
    else:
        # Fall back to sl_model or initialized
        rl_model.load_state_dict(sl_model.state_dict())
    rl_model.eval()
    MODELS["reinforcement"] = rl_model
    SOLVERS["reinforcement"] = AINQueensSolver(rl_model, device=DEVICE)

load_or_init_models()

# Request & Response Schemas
class SolveRequest(BaseModel):
    n: int = Field(8, ge=4, le=16, description="Chessboard size N x N")
    initial_row: Optional[int] = Field(None, ge=0, description="Row index for the first queen (optional, auto-picks if omitted)")
    initial_col: Optional[int] = Field(None, ge=0, description="Col index for the first queen (optional, auto-picks if omitted)")
    model_type: str = Field("supervised", description="'supervised' or 'reinforcement'")
    temperature: float = Field(0.8, ge=0.01, le=2.0, description="Softmax temperature for candidate probabilities")
    max_steps: int = Field(1200, ge=10, le=2500, description="Maximum search recovery steps before termination")

class EvaluateRequest(BaseModel):
    n: int = Field(8, ge=4, le=16)
    queens: List[List[int]] = Field(default_factory=list, description="List of [row, col] coordinates placed so far")
    model_type: str = Field("supervised")
    temperature: float = Field(1.0)

# Endpoints
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "device": DEVICE,
        "models_loaded": list(MODELS.keys())
    }

@app.post("/api/reload-models")
def reload_models():
    """Reloads model weights from disk."""
    load_or_init_models()
    return {"status": "models_reloaded"}

@app.post("/api/solve")
def solve_nqueens(req: SolveRequest):
    """
    Primary solving endpoint:
    Receives user initial queen placement (or auto-generates one) -> executes AI-guided search recovery.
    Returns complete structured timeline, good and bad move logs, confidence metrics, and deterministic conflict explanations.
    """
    import random
    r0 = req.initial_row if req.initial_row is not None else random.randint(0, req.n - 1)
    c0 = req.initial_col if req.initial_col is not None else random.randint(0, req.n - 1)

    if r0 >= req.n or c0 >= req.n:
        raise HTTPException(status_code=400, detail="Initial queen coordinate out of board bounds.")

    model_key = req.model_type if req.model_type in SOLVERS else "supervised"
    solver = SOLVERS[model_key]

    result = solver.solve(
        n=req.n,
        initial_queen=(r0, c0),
        temperature=req.temperature,
        max_steps=req.max_steps
    )
    result["model_used"] = model_key
    return result

@app.post("/api/evaluate-position")
def evaluate_position(req: EvaluateRequest):
    """
    Evaluates an arbitrary board state using the Deep Learning model:
    Returns the N x N spatial probability heatmap, top candidate placements, and state solvability value V(s).
    """
    board = NQueensBoard(req.n)
    for r, c in req.queens:
        if 0 <= r < req.n and 0 <= c < req.n:
            board.place_queen(r, c)

    model_key = req.model_type if req.model_type in MODELS else "supervised"
    model = MODELS[model_key]

    feat = torch.from_numpy(board.get_feature_tensor()).float().unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        logits, val = model(feat)
        temp = max(1e-4, req.temperature)
        probs = torch.softmax(logits / temp, dim=-1).squeeze(0).cpu().numpy().reshape(req.n, req.n)
        solvability = val.item()

    # Formulate heatmap as list of lists
    heatmap = [[round(float(probs[r, c]) * 100, 2) for c in range(req.n)] for r in range(req.n)]

    # Compute top-5 candidates across unassigned rows
    occupied_rows = board.get_occupied_rows()
    candidate_list = []
    for r in range(req.n):
        if r not in occupied_rows:
            for c in range(req.n):
                has_conflict, reason, attacking_queen, _ = board.check_conflict(r, c)
                candidate_list.append({
                    "row": r,
                    "col": c,
                    "probability": round(float(probs[r, c]) * 100, 2),
                    "is_valid": not has_conflict,
                    "conflict_reason": reason,
                    "attacking_queen": list(attacking_queen) if attacking_queen else None
                })

    candidate_list.sort(key=lambda x: x["probability"], reverse=True)

    return {
        "n": req.n,
        "queens": [list(q) for q in board.queens],
        "is_solved": board.is_solved(),
        "is_dead_end": board.is_dead_end(),
        "solvability_score": round(solvability * 100, 1),
        "heatmap": heatmap,
        "top_candidates": candidate_list[:8]
    }

@app.get("/api/training-metrics")
def get_training_metrics():
    """
    Returns recorded training histories for both Supervised Learning and Reinforcement Learning models.
    """
    sl_file = os.path.join(BASE_DIR, "data", "sl_training_history.json")
    rl_file = os.path.join(BASE_DIR, "data", "rl_training_history.json")

    sl_data = None
    if os.path.exists(sl_file):
        try:
            with open(sl_file, "r") as f:
                sl_data = json.load(f)
        except Exception as e:
            print(f"Error reading {sl_file}: {e}")

    rl_data = None
    if os.path.exists(rl_file):
        try:
            with open(rl_file, "r") as f:
                rl_data = json.load(f)
        except Exception as e:
            print(f"Error reading {rl_file}: {e}")

    return {
        "supervised": sl_data,
        "reinforcement": rl_data
    }

@app.get("/api/benchmark")
def get_benchmark_results(refresh: bool = Query(False)):
    """
    Returns scientific benchmark comparison between Traditional Backtracking and the Deep Learning Solver.
    """
    cache_path = os.path.join(BASE_DIR, "data", "benchmark_results.json")
    if not refresh and os.path.exists(cache_path):
        try:
            with open(cache_path, "r") as f:
                return json.load(f)
        except Exception:
            pass

    # Run benchmark
    suite = BenchmarkSuite()
    return suite.run_comprehensive_benchmark(n_values=[4, 5, 6, 7, 8, 9, 10])

# Serve Frontend static build if it exists
frontend_dist = os.path.join(PROJECT_ROOT, "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
