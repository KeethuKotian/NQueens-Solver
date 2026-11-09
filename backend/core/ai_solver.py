import time
import torch
import numpy as np
from typing import List, Tuple, Dict, Any, Optional
from .board import NQueensBoard
from .model import NQueensFCN

class AISolverEvent:
    """Represents a single step in the AI reasoning and search timeline."""
    def __init__(
        self, 
        step_index: int, 
        event_type: str, 
        board_state: List[Tuple[int, int]], 
        data: Dict[str, Any], 
        timestamp: float,
        category: str = "info",
        is_good_move: bool = False
    ):
        self.step_index = step_index
        self.event_type = event_type
        self.category = category  # 'good' | 'bad' | 'info'
        self.is_good_move = is_good_move
        self.board_state = board_state
        self.data = data
        self.timestamp = timestamp

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step_index": self.step_index,
            "event_type": self.event_type,
            "category": self.category,
            "is_good_move": self.is_good_move,
            "board_state": [list(q) for q in self.board_state],
            "data": self.data,
            "timestamp": round(self.timestamp, 4)
        }

class AINQueensSolver:
    """
    Deep Learning-Guided N-Queens Solver with AI-Guided Search Recovery and MRV.
    
    Principles:
    - Minimum Remaining Values (MRV): Prioritizes the most constrained row dynamically.
    - Neural Policy Guidance: Ranks column choices using P(a | s) from the FCN-PV network.
    - Deterministic Verification: Catches conflicts and lookahead dead ends with precise geometric explanations.
    - Clear Good and Bad Move Auditing: Categorizes every action so users can clearly see good progress vs conflicts.
    """

    def __init__(self, model: NQueensFCN, device: str = "cpu"):
        self.model = model
        self.device = device
        self.model.to(self.device)
        self.model.eval()

    def solve(
        self,
        n: int,
        initial_queen: Tuple[int, int],
        temperature: float = 0.8,
        max_steps: int = 1200,
        candidate_top_k: int = 5
    ) -> Dict[str, Any]:
        """
        Executes AI solving starting from the user's initial queen placement.
        Returns a complete audit trail of structured events, move history, and performance metrics.
        """
        start_time = time.perf_counter()
        events: List[Dict[str, Any]] = []
        step_counter = 0

        board = NQueensBoard(n)
        r0, c0 = initial_queen
        board.place_queen(r0, c0)

        step_counter += 1
        good_moves_count = 1
        bad_moves_count = 0
        total_ai_moves = 0
        invalid_predictions = 0
        backtracks = 0
        confidence_history = []
        max_search_depth = 1

        events.append(AISolverEvent(
            step_index=step_counter,
            event_type="USER_MOVE",
            category="good",
            is_good_move=True,
            board_state=list(board.queens),
            data={
                "position": [r0, c0],
                "description": f"User placed first queen at Row {r0 + 1}, Col {c0 + 1}."
            },
            timestamp=time.perf_counter() - start_time
        ).to_dict())

        # Stack entries:
        # {
        #   "row": row_index,
        #   "candidates": [(col, prob)],
        #   "cand_idx": current_index,
        #   "current_col": selected_col,
        #   "solvability": solvability_score,
        #   "top_k_board": [...]
        # }
        stack: List[Dict[str, Any]] = []

        while step_counter < max_steps:
            if board.is_solved():
                step_counter += 1
                good_moves_count += 1
                events.append(AISolverEvent(
                    step_index=step_counter,
                    event_type="SOLUTION_FOUND",
                    category="good",
                    is_good_move=True,
                    board_state=list(board.queens),
                    data={
                        "message": f"Successfully placed all {n} queens with 0 conflicts!",
                        "queens": [list(q) for q in board.queens]
                    },
                    timestamp=time.perf_counter() - start_time
                ).to_dict())
                break

            unassigned_rows = [r for r in range(n) if r not in board.get_occupied_rows()]
            if not unassigned_rows:
                if board.is_solved():
                    step_counter += 1
                    good_moves_count += 1
                    events.append(AISolverEvent(
                        step_index=step_counter,
                        event_type="SOLUTION_FOUND",
                        category="good",
                        is_good_move=True,
                        board_state=list(board.queens),
                        data={
                            "message": f"Successfully placed all {n} queens with 0 conflicts!",
                            "queens": [list(q) for q in board.queens]
                        },
                        timestamp=time.perf_counter() - start_time
                    ).to_dict())
                break

            # Need to pick the next variable (row) to assign:
            # We use MRV (row with fewest safe squares left)
            if len(stack) == len(board.queens) - 1:
                mrv_row = min(unassigned_rows, key=lambda r: len(board.get_valid_squares_for_row(r)))

                # Neural Network inference on current board configuration
                feat_tensor = torch.from_numpy(board.get_feature_tensor()).float().unsqueeze(0).to(self.device)
                with torch.no_grad():
                    logits, val = self.model(feat_tensor)
                    temp = max(1e-4, temperature)
                    probs = torch.softmax(logits / temp, dim=-1).squeeze(0).cpu().numpy().reshape(n, n)
                    solvability = val.item()

                row_probs = probs[mrv_row, :]
                ranked_cols = np.argsort(-row_probs)
                candidates = [(int(c), float(row_probs[c])) for c in ranked_cols]

                # Board top-K for reasoning view
                flat_ranked_indices = np.argsort(-probs.flatten())
                top_k_board = []
                for idx in flat_ranked_indices[:candidate_top_k]:
                    kr = int(idx // n)
                    kc = int(idx % n)
                    top_k_board.append({
                        "position": [kr, kc],
                        "confidence": round(float(probs[kr, kc]) * 100, 1),
                        "row": kr,
                        "col": kc
                    })

                stack.append({
                    "row": mrv_row,
                    "candidates": candidates,
                    "cand_idx": 0,
                    "current_col": None,
                    "solvability": round(solvability * 100, 1),
                    "top_k_board": top_k_board
                })

            current_frame = stack[-1]
            c_row = current_frame["row"]
            candidates = current_frame["candidates"]
            cand_idx = current_frame["cand_idx"]

            # If all candidates for this row have been tried:
            if cand_idx >= len(candidates):
                step_counter += 1
                backtracks += 1
                bad_moves_count += 1
                events.append(AISolverEvent(
                    step_index=step_counter,
                    event_type="DEAD_END",
                    category="bad",
                    is_good_move=False,
                    board_state=list(board.queens),
                    data={
                        "row": c_row,
                        "message": f"Dead end reached: All {n} candidate columns for Row {c_row + 1} exhausted."
                    },
                    timestamp=time.perf_counter() - start_time
                ).to_dict())

                stack.pop()

                if not stack:
                    # Search space fully exhausted
                    step_counter += 1
                    bad_moves_count += 1
                    events.append(AISolverEvent(
                        step_index=step_counter,
                        event_type="SEARCH_EXHAUSTED",
                        category="bad",
                        is_good_move=False,
                        board_state=list(board.queens),
                        data={
                            "message": f"No valid configuration exists with first queen placed at ({r0 + 1}, {c0 + 1})."
                        },
                        timestamp=time.perf_counter() - start_time
                    ).to_dict())
                    break

                # Backtrack parent level
                parent = stack[-1]
                p_row = parent["row"]
                p_col = parent["current_col"]

                board.remove_queen(p_row, p_col)
                parent["cand_idx"] += 1

                step_counter += 1
                bad_moves_count += 1
                events.append(AISolverEvent(
                    step_index=step_counter,
                    event_type="BACKTRACK_STARTED",
                    category="bad",
                    is_good_move=False,
                    board_state=list(board.queens),
                    data={
                        "removed_queen": [p_row, p_col],
                        "message": f"Backtracking: Removed Queen from Row {p_row + 1}, Col {p_col + 1} to try model's next candidate."
                    },
                    timestamp=time.perf_counter() - start_time
                ).to_dict())
                continue

            # Pick next candidate column
            selected_col, conf = candidates[cand_idx]
            current_frame["current_col"] = selected_col
            total_ai_moves += 1
            conf_pct = round(conf * 100, 1)
            confidence_history.append(conf_pct)

            is_alt = (cand_idx > 0)
            step_counter += 1
            events.append(AISolverEvent(
                step_index=step_counter,
                event_type="ALTERNATIVE_SELECTED" if is_alt else "MOVE_PREDICTED",
                category="info",
                is_good_move=False,
                board_state=list(board.queens),
                data={
                    "position": [c_row, selected_col],
                    "confidence": conf_pct,
                    "candidate_rank": cand_idx + 1,
                    "total_candidates": len(candidates),
                    "top_candidates": [
                        {"col": c, "confidence": round(p * 100, 1), "position": [c_row, c]}
                        for c, p in candidates[:4]
                    ],
                    "solvability_estimate": current_frame["solvability"],
                    "description": f"AI selected Row {c_row + 1}, Col {selected_col + 1} (Rank #{cand_idx + 1}, Confidence: {conf_pct}%)."
                },
                timestamp=time.perf_counter() - start_time
            ).to_dict())

            # Deterministic conflict check
            has_conflict, reason_text, attacking_queen, conflict_type = board.check_conflict(c_row, selected_col)

            if has_conflict:
                invalid_predictions += 1
                bad_moves_count += 1
                step_counter += 1
                events.append(AISolverEvent(
                    step_index=step_counter,
                    event_type="CONFLICT_DETECTED",
                    category="bad",
                    is_good_move=False,
                    board_state=list(board.queens),
                    data={
                        "rejected_position": [c_row, selected_col],
                        "conflicting_queen": list(attacking_queen) if attacking_queen else None,
                        "conflict_type": conflict_type,
                        "reason": reason_text,
                        "confidence_was": conf_pct,
                        "explanation": f"Bad move rejected: {reason_text} (AI confidence was {conf_pct}%)."
                    },
                    timestamp=time.perf_counter() - start_time
                ).to_dict())

                current_frame["cand_idx"] += 1
                continue

            # Move is valid!
            board.place_queen(c_row, selected_col)
            good_moves_count += 1
            max_search_depth = max(max_search_depth, len(board.queens))

            step_counter += 1
            events.append(AISolverEvent(
                step_index=step_counter,
                event_type="MOVE_VALIDATED",
                category="good",
                is_good_move=True,
                board_state=list(board.queens),
                data={
                    "position": [c_row, selected_col],
                    "confidence": conf_pct,
                    "current_queens_count": len(board.queens),
                    "target_queens": n,
                    "description": f"Good move! Queen placed at Row {c_row + 1}, Col {selected_col + 1}. Total queens on board: {len(board.queens)}/{n}."
                },
                timestamp=time.perf_counter() - start_time
            ).to_dict())

            # Forward lookahead: does this placement cause any remaining unassigned row to have 0 safe squares?
            if board.is_dead_end() and len(board.queens) < n:
                step_counter += 1
                backtracks += 1
                bad_moves_count += 1
                events.append(AISolverEvent(
                    step_index=step_counter,
                    event_type="DEAD_END",
                    category="bad",
                    is_good_move=False,
                    board_state=list(board.queens),
                    data={
                        "position": [c_row, selected_col],
                        "message": f"Forward constraint lookahead: Placement at ({c_row + 1}, {selected_col + 1}) leaves an unassigned row with zero safe squares."
                    },
                    timestamp=time.perf_counter() - start_time
                ).to_dict())

                # Undo placement
                board.remove_queen(c_row, selected_col)
                current_frame["cand_idx"] += 1

                step_counter += 1
                bad_moves_count += 1
                events.append(AISolverEvent(
                    step_index=step_counter,
                    event_type="BACKTRACK_STARTED",
                    category="bad",
                    is_good_move=False,
                    board_state=list(board.queens),
                    data={
                        "removed_queen": [c_row, selected_col],
                        "message": f"Undoing ({c_row + 1}, {selected_col + 1}) due to dead end. Trying model's next candidate."
                    },
                    timestamp=time.perf_counter() - start_time
                ).to_dict())
                continue

        elapsed = time.perf_counter() - start_time
        solved = board.is_solved()
        avg_confidence = round(float(np.mean(confidence_history)), 1) if confidence_history else 0.0

        # Total moves = good moves + bad moves
        total_moves = good_moves_count + bad_moves_count

        return {
            "success": solved,
            "n": n,
            "initial_queen": [r0, c0],
            "final_queens": [list(q) for q in board.queens],
            "total_steps": len(events),
            "total_moves": total_moves,
            "good_moves_count": good_moves_count,
            "bad_moves_count": bad_moves_count,
            "total_ai_moves": total_ai_moves,
            "invalid_predictions": invalid_predictions,
            "backtracks": backtracks,
            "max_search_depth": max_search_depth,
            "average_confidence": avg_confidence,
            "solving_time_seconds": round(elapsed, 4),
            "events": events
        }
