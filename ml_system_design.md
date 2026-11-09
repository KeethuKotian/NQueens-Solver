# Deep Learning N-Queens Solver: System & ML Specification

## 1. Machine Learning Architecture

To solve the N-Queens problem across varying board sizes $N \in \{4, \dots, 12+\}$ without hardcoding a fixed grid dimension, we deploy a **Fully Convolutional Policy & Value Network (FCN-PV)** with dilation and residual connections:

### Network Topology
```
Input Tensor: (Batch, 3, N, N)
   │
   ▼
[Conv2D(3 -> 64, kernel=3, padding=1)] + BatchNorm2D + LeakyReLU(0.1)
   │
   ▼
[ResBlock 1: Conv(64->64, k=3, p=1) -> BN -> LeakyReLU -> Conv(64->64, k=3, p=1) -> BN] + Residual
   │
   ▼
[ResBlock 2 (Dilated): Conv(64->64, k=3, padding=2, dilation=2) -> BN -> LeakyReLU -> Conv(64->64, k=3, p=1) -> BN] + Residual
   │
   ▼
[ResBlock 3: Conv(64->64, k=3, p=1) -> BN -> LeakyReLU -> Conv(64->64, k=3, p=1) -> BN] + Residual
   │
   ├─────────────────────────────────────────────┐
   │ (Spatial Policy Head)                       │ (State Value Head)
   ▼                                             ▼
[Conv2D(64 -> 32, k=1)] + LeakyReLU           [Conv2D(64 -> 16, k=1)] + LeakyReLU
   │                                             │
[Conv2D(32 -> 1, k=1)]                        [GlobalAveragePooling2D] -> (Batch, 16)
   │                                             │
Flatten to (Batch, N * N)                     [Linear(16 -> 32)] + LeakyReLU
   │                                             │
Softmax / Log-Softmax (Logits Z)              [Linear(32 -> 1)] + Sigmoid
   ▼                                             ▼
Action Probabilities P(a | s) ∈ R^(N×N)       Board Solvability V(s) ∈ [0, 1]
```

### Why this Architecture?
1. **Translation & Diagonal Invariance**: Convolutional kernels with dilation $d=2$ capture horizontal, vertical, and diagonal threat patterns across the board.
2. **Dimension Agnostic (Variable $N$)**: Because all operations in the feature extractor and policy head are $1 \times 1$ and $3 \times 3$ convolutions with spatial padding, **the exact same trained weights execute on any $N \times N$ board** (from $N=4$ up to $N=16+$), enabling zero-shot cross-size generalization tests.
3. **Dual Heads**:
   - **Policy Head**: Predicts the next best $(r, c)$ coordinate for queen placement.
   - **Value Head**: Evaluates the solvability / quality of the board state $V(s) \in [0, 1]$.

---

## 2. Input / Output Representation

### Input Tensor: $X \in \mathbb{R}^{3 \times N \times N}$
- **Channel 0 (Occupancy Map)**:
  $$X_{0, r, c} = \begin{cases} 1.0 & \text{if a queen is at } (r, c) \\ 0.0 & \text{otherwise} \end{cases}$$
- **Channel 1 (Attacked Square Threat Field)**:
  $$X_{1, r, c} = \min\left(1.0, \frac{\text{number of existing queens attacking } (r, c)}{3.0}\right)$$
  Provides the neural network with explicit structural awareness of threat density.
- **Channel 2 (Row Status / Spatial Context)**:
  $$X_{2, r, c} = \begin{cases} 1.0 & \text{if row } r \text{ has no queen yet} \\ 0.0 & \text{if row } r \text{ already contains a queen} \end{cases}$$

### Output Tensor: $Z \in \mathbb{R}^{N \times N}$
- Flattened into a probability distribution over the $N^2$ positions:
  $$P(a = (r, c) \mid s) = \frac{\exp(Z_{r, c} / \tau)}{\sum_{r', c'} \exp(Z_{r', c'} / \tau)}$$
  where $\tau$ is the softmax temperature.

---

## 3. Dataset Generation Strategy

We generate high-quality training and validation datasets using exact combinatorial methods for $N \in [4, 8]$:

1. **Exact Complete Solutions**:
   Compute all valid $N$-Queens solutions (e.g., 92 solutions for $N=8$, 40 for $N=7$, 10 for $N=5$, 2 for $N=4$).
2. **Sequential & Permuted Solution Prefixes**:
   - For each complete solution $Q = \{(r_0, c_0), (r_1, c_1), \dots, (r_{N-1}, c_{N-1})\}$:
   - Generate prefix trajectories for $k = 1, \dots, N-1$:
     - State $S_k$: Queens placed at the first $k$ positions.
     - Target Action $a_k^*$: The $(k+1)$-th queen position.
   - **Arbitrary First Move Augmentation**: To handle arbitrary human first moves at any row $r$ and col $c$, we sample permutations of queen placements so the model learns to solve from *any* initial placement, not just row 0.
3. **Negative / Dead-End Samples**:
   - Generate partial configurations with 2–4 queens that have zero legal continuation moves (dead ends), labeled with target value $V(s) = 0.0$.
   - Solvable prefix configurations are labeled with target value $V(s) = 1.0$.

---

## 4. Training Methodology

We implement both **Supervised Learning** (primary robust heuristic learner) and **Reinforcement Learning** (policy gradient comparison):

### Supervised Learning (SL)
- **Batch Size**: 64
- **Optimizer**: AdamW (Learning rate $10^{-3}$, weight decay $10^{-4}$)
- **Epochs**: 40–50 with early stopping on validation loss.
- **Data Augmentation**: 8-fold dihedral symmetry group $D_4$ of the chessboard (rotations by 90°, 180°, 270°, horizontal flips, vertical flips). This multiplies the effective dataset by $8\times$ and enforces physical chess board symmetries.

### Reinforcement Learning (RL) Mode (Policy Gradient / REINFORCE with Baseline)
- Environment gives step rewards:
  - Valid queen placed: $+1.0$
  - Successful full $N$-queens placement: $+10.0$
  - Invalid queen placed (conflict): $-1.0$
  - Dead end reached: $-3.0$
- Episode terminates on full solution or after max invalid attempts.

---

## 5. Loss & Reward Functions

### Supervised Multi-Task Loss:
$$\mathcal{L}_{total} = \mathcal{L}_{policy} + \lambda_{value} \mathcal{L}_{value}$$
where:
- $\mathcal{L}_{policy} = -\sum_{a} y_a \log P(a \mid s)$ (Categorical Cross-Entropy over valid placement coordinates)
- $\mathcal{L}_{value} = \text{BCE}(V(s), y_{solvable})$ (Binary Cross-Entropy for state solvability)
- $\lambda_{value} = 0.5$

---

## 6. Inference Strategy

1. User places queen at arbitrary cell $(r_{init}, c_{init})$.
2. Active board state $S_1$ is converted to tensor $(1, 3, N, N)$.
3. Model forward pass generates:
   - Logits $Z \in \mathbb{R}^{N \times N}$
   - Probabilities $P(r, c) = \text{softmax}(Z / \tau)$
   - State value estimate $V(S) \in [0, 1]$
4. Model ranks all candidate positions $(r, c)$ by descending probability $P(r, c)$.
5. Model selects candidate $a_1 = \arg\max P(a \mid s)$.

---

## 7. Backtracking & Recovery Strategy (AI-Guided Search Recovery)

The system does NOT use classical backtracking as a black box. Instead, it performs **AI-Guided Search Recovery**:

```
Model predicts candidate move a_k = (r, c) with confidence P(a_k | S)
                     │
                     ▼
       Deterministic Constraint Checker
                     │
       ┌─────────────┴─────────────┐
       ▼                           ▼
[Conflict Detected]         [Move is Valid]
       │                           │
  Record event:               Record event:
  MOVE_REJECTED               MOVE_VALIDATED
  Explain reason &            Place queen on board.
  highlight attacking queen.       │
       │                           ▼
  Suppress candidate a_k.     Does current board have
  Select model's next-best    at least one valid square
  candidate a_k' for state.   for every remaining row?
       │                           │
       │                     ┌─────┴─────┐
       │                     ▼           ▼
       │                  [YES]        [NO - DEAD END]
       │                    │            │
       │                    ▼            ▼
       │              Push to stack.   Record event: DEAD_END
       │              Proceed to       Record event: BACKTRACK_STARTED
       │              next queen.      Pop last queen from stack.
       │                               Highlight removed queen.
       │                               Resume search from parent
       │                               using model's alternative
       │                               ranked predictions.
       └───────────────────────────────┘
```

### Deterministic Explanation Rules:
- **Row Conflict**: "Square $(r, c)$ shares Row $r$ with existing Queen at $(r, c_{prev})$."
- **Column Conflict**: "Square $(r, c)$ shares Column $c$ with existing Queen at $(r_{prev}, c)$."
- **Major Diagonal**: "Square $(r, c)$ attacked along primary diagonal ($r - c = r_{prev} - c_{prev}$) by Queen at $(r_{prev}, c_{prev})$."
- **Minor Diagonal**: "Square $(r, c)$ attacked along anti-diagonal ($r + c = r_{prev} + c_{prev}$) by Queen at $(r_{prev}, c_{prev})$."

---

## 8. Evaluation & Experimentation Methodology

The project includes an **Experimentation & Benchmark Suite** measuring:
1. **Experiment 1 (Scaling with N)**: Success rate, move count, and solving time for $N \in [4, 12]$.
2. **Experiment 2 (First Move Sensitivity)**: Solve rate when queen #1 is placed at corner $(0,0)$, edge $(0, \lfloor N/2 \rfloor)$, center, and off-center.
3. **Experiment 3 (Unseen First Moves)**: Performance on initial placements excluded from training data.
4. **Experiment 4 (DL-Guided vs Traditional Backtracking)**: Direct comparison of:
   - Nodes explored / Moves attempted
   - Number of backtracks
   - Wall-clock time (seconds)
   - Search tree depth efficiency
5. **Experiment 5 (Error & False Confidence Rate)**: Percentage of model top-1 predictions that were conflicts, and distribution of confidence scores on incorrect vs correct moves.
6. **Experiment 6 (Cross-N Zero-Shot Generalization)**: Model trained on $N \in [4, 8]$ evaluated directly on $N \in [9, 12]$.

---

## 9. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (Web)                        │
│  - Interactive Chessboard with Attack Lines & Heatmaps       │
│  - AI Reasoning Activity Feed & Live Confidence Bars        │
│  - Move-by-Move Timeline & Conflict Explainer Dialog        │
│  - Experimentation & Benchmark Comparison Suite             │
│  - Model Training & Loss Curves Dashboard                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / WebSocket Event Stream
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI Backend Engine                   │
│                                                             │
│  ┌────────────────────┐            ┌─────────────────────┐  │
│  │  N-Queens Board    │            │     Constraint      │  │
│  │    Environment     ├───────────►│      Validator      │  │
│  └─────────┬──────────┘            └──────────┬──────────┘  │
│            │                                  │             │
│            ▼                                  ▼             │
│  ┌────────────────────┐            ┌─────────────────────┐  │
│  │ AI-Guided Search & │◄───────────┤  Neural Policy &    │  │
│  │  Recovery Manager  │            │  Value Model (Torch)│  │
│  └─────────┬──────────┘            └─────────────────────┘  │
│            │                                                │
│            ▼                                                │
│  ┌────────────────────┐            ┌─────────────────────┐  │
│  │ AI Structured      │            │  Benchmark &        │  │
│  │ Event Streamer     │            │  Metrics Engine     │  │
│  └────────────────────┘            └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Technology Stack
- **Deep Learning Core**: PyTorch 2.x, NumPy, SciPy (Already available in Python 3.12 environment)
- **Backend API**: FastAPI + Uvicorn (Already available)
- **Frontend**: Vite + React, modern Vanilla CSS styling, Lucide icons, Chart.js / Canvas for loss curves and heatmaps.
- **Protocol**: REST + WebSocket / Server-Sent Events for real-time step streaming.
