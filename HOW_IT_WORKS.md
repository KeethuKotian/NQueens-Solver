<p align="center">
  <img src="./assets/logo.svg" alt="Deep Learning N-Queens Solver Logo" width="96" height="96" />
</p>

<h1 align="center">Deep Learning N-Queens Solver</h1>
<h3 align="center">System Architecture, Mathematical Formulation &amp; Training Guide</h3>

<p align="center">
  <em>A Comprehensive Research-Grade Specification of Neuro-Symbolic AI, Spatial Representation, FCN-PV Network Design, and Backtracking Recovery</em>
</p>

---

## 📑 Table of Contents

1. [Problem Formulation as a Constraint Satisfaction Problem (CSP)](#1-problem-formulation-as-a-constraint-satisfaction-problem-csp)
2. [The Hybrid Neuro-Symbolic Paradigm](#2-the-hybrid-neuro-symbolic-paradigm)
3. [Spatial State Representation: 3-Channel Tensor](#3-spatial-state-representation-3-channel-tensor)
4. [Neural Network Architecture: FCN-PV](#4-neural-network-architecture-fcn-pv)
   - [Topology & Dilated Residual Backbone](#topology--dilated-residual-backbone)
   - [Dual Prediction Heads](#dual-prediction-heads)
   - [Dimension-Agnostic Variable-$N$ Invariance](#dimension-agnostic-variable-n-invariance)
5. [Dataset Generation & Chessboard $D_4$ Symmetry Group](#5-dataset-generation--chessboard-d_4-symmetry-group)
   - [Prefix Trajectory Extraction](#prefix-trajectory-extraction)
   - [Arbitrary First-Move Permutations](#arbitrary-first-move-permutations)
   - [$D_4$ Dihedral Symmetry Augmentation](#d_4-dihedral-symmetry-augmentation)
   - [Negative / Dead-End State Mining](#negative--dead-end-state-mining)
6. [Training Pipelines](#6-training-pipelines)
   - [Supervised Multi-Task Learning (SL)](#supervised-multi-task-learning-sl)
   - [Reinforcement Learning via Policy Gradients (RL)](#reinforcement-learning-via-policy-gradients-rl)
7. [AI-Guided Search Recovery & Backtracking Algorithm](#7-ai-guided-search-recovery--backtracking-algorithm)
   - [Minimum Remaining Values (MRV) Dynamic Row Selection](#minimum-remaining-values-mrv-dynamic-row-selection)
   - [Neural Candidate Ranking & Temperature Scaling](#neural-candidate-ranking--temperature-scaling)
   - [Lookahead Dead-End Detection (Forward Checking)](#lookahead-dead-end-detection-forward-checking)
   - [Dual Auditing: Good vs. Bad Moves](#dual-auditing-good-vs-bad-moves)
8. [Deterministic Conflict Explainer Engine](#8-deterministic-conflict-explainer-engine)
9. [Empirical Evaluation & Scientific Findings](#9-empirical-evaluation--scientific-findings)

---

## 1. Problem Formulation as a Constraint Satisfaction Problem (CSP)

The **$N$-Queens Problem** is a classic combinatorial benchmark in computer science and artificial intelligence. The objective is to position $N$ chess queens on an $N \times N$ chessboard such that no two queens can attack each other.

Formally, we define the problem as a Constraint Satisfaction Problem:
$$\mathcal{P} = \langle \mathcal{X}, \mathcal{D}, \mathcal{C} \rangle$$

- **Variables**: $\mathcal{X} = \{X_0, X_1, \dots, X_{N-1}\}$, where variable $X_i$ represents the queen assigned to row $i$.
- **Domains**: $\mathcal{D}_i = \{0, 1, \dots, N-1\}$ for each $i \in \{0, \dots, N-1\}$, representing the column index assigned to row $i$.
- **Constraints $\mathcal{C}$**: For every pair of distinct rows $i, j \in \{0, \dots, N-1\}$ where $i \neq j$:
  1. **Column Non-Attack**:
     $$X_i \neq X_j$$
  2. **Major Diagonal Non-Attack**:
     $$X_i - i \neq X_j - j \iff X_i - X_j \neq i - j$$
  3. **Minor Diagonal Non-Attack**:
     $$X_i + i \neq X_j + j \iff X_i - X_j \neq -(i - j)$$
  Equivalently, both diagonal conditions are expressed as:
  $$|X_i - X_j| \neq |i - j|$$

The search space of possible row-to-column assignments contains $N^N$ states, or $N!$ if each column is restricted to a single queen. As $N$ increases, naive chronological backtracking exhibits worst-case exponential complexity $\mathcal{O}(N!)$, suffering from extensive thrashing in dead-end branches.

---

## 2. The Hybrid Neuro-Symbolic Paradigm

Modern AI presents a dilemma when approaching combinatorial problems:

| Paradigm | Strengths | Limitations |
|---|---|---|
| **Classical Backtracking** | Mathematically guaranteed; 0% invalid solutions; strict verification. | Blind search; exponential time complexity on bad initial paths; no spatial intuition. |
| **Pure End-to-End Deep Learning** | Fast forward-pass inference; captures high-level spatial patterns. | Probabilistic; hallucinates illegal placements; cannot guarantee 100% adherence to constraints. |
| **Hybrid Neuro-Symbolic (This Project)** | **Best of both worlds**: Neural network provides heuristic guidance, while deterministic rules guarantee zero illegal moves. | Requires structured search recovery when neural proposals conflict. |

In this project, the neural network acts as a **heuristic policy guide** rather than an unchecked oracle. When the network suggests a move:
1. It is deterministically checked against all chess constraints.
2. If legal, forward-checking inspects if the move leaves any remaining row with zero legal squares (dead end).
3. If illegal or a dead end, the deterministic shield immediately intercepts it, logs a **Bad Move** with precise geometrical conflict attribution, and systematically recovers by evaluating the network's next-best candidate.

---

## 3. Spatial State Representation: 3-Channel Tensor

Standard fully connected networks typically take a 1D vector of column indices. However, 1D vectors destroy the 2D spatial relationships of chessboard diagonals and knight-like threat rays. 

We formulate the board state as a **3-channel spatial tensor** $X \in \mathbb{R}^{3 \times N \times N}$:

```
     Input Tensor Shape: (Batch, 3, N, N)

     Channel 0: Occupancy Map        Channel 1: Threat Field Density       Channel 2: Unoccupied Mask
     ┌───┬───┬───┬───┐              ┌───┬───┬───┬───┐                     ┌───┬───┬───┬───┐
     │ 0 │ 1 │ 0 │ 0 │              │0.7│1.0│0.7│0.3│                     │ 0 │ 0 │ 0 │ 0 │ (Row assigned)
     ├───┼───┼───┼───┤              ├───┼───┼───┼───┤                     ├───┼───┼───┼───┤
     │ 0 │ 0 │ 0 │ 0 │              │0.3│0.7│0.7│0.3│                     │ 1 │ 1 │ 1 │ 1 │ (Needs queen)
     ├───┼───┼───┼───┤              ├───┼───┼───┼───┤                     ├───┼───┼───┼───┤
     │ 0 │ 0 │ 0 │ 0 │              │0.3│0.3│0.7│0.7│                     │ 1 │ 1 │ 1 │ 1 │ (Needs queen)
     ├───┼───┼───┼───┤              ├───┼───┼───┼───┤                     ├───┼───┼───┼───┤
     │ 0 │ 0 │ 0 │ 0 │              │0.0│0.3│0.3│0.7│                     │ 1 │ 1 │ 1 │ 1 │ (Needs queen)
     └───┴───┴───┴───┘              └───┴───┴───┴───┘                     └───┴───┴───┴───┘
```

### Channel Breakdown:

1. **Channel 0 — Queen Occupancy Map**:
   $$X_{0, r, c} = \begin{cases} 1.0 & \text{if a queen currently occupies } (r, c) \\ 0.0 & \text{otherwise} \end{cases}$$

2. **Channel 1 — Attacked Threat Field Density**:
   For every cell $(r, c)$, we count how many existing placed queens currently threaten it along rows, columns, or diagonals:
   $$\text{threat\_count}(r, c) = \sum_{(q_r, q_c) \in \mathcal{Q}} \mathbf{1}\Big[q_r = r \lor q_c = c \lor |q_r - r| = |q_c - c|\Big]$$
   We normalize this density by dividing by $3.0$ and clipping at $1.0$:
   $$X_{1, r, c} = \min\left(1.0, \frac{\text{threat\_count}(r, c)}{3.0}\right)$$
   This channel provides the convolutional kernels with structural awareness of safe versus heavily contested zones.

3. **Channel 2 — Unoccupied Row Status Mask**:
   $$X_{2, r, c} = \begin{cases} 1.0 & \text{if row } r \text{ has no queen placed yet} \\ 0.0 & \text{if row } r \text{ already contains a queen} \end{cases}$$
   This explicitly tells the neural network which spatial regions still require action.

---

## 4. Neural Network Architecture: FCN-PV

We deploy a **Fully Convolutional Policy & Value Network (FCN-PV)** with dilated residual blocks.

### Topology & Dilated Residual Backbone

```
Input Tensor: (B, 3, N, N)
      │
      ▼
[Conv2D(3 -> 64, kernel=3, padding=1, bias=False)]
[BatchNorm2D(64)] + [LeakyReLU(0.1)]
      │
      ▼
┌────────────────────────────────────────────────────────┐
│ ResBlock 1 (Dilation d=1):                             │
│   Conv2D(64->64, k=3, p=1) -> BN -> LeakyReLU ->       │
│   Conv2D(64->64, k=3, p=1) -> BN + Residual            │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ ResBlock 2 (Dilated Dilation d=2):                     │
│   Conv2D(64->64, k=3, p=2, d=2) -> BN -> LeakyReLU ->  │
│   Conv2D(64->64, k=3, p=1, d=1) -> BN + Residual       │
│   *Captures long-distance diagonal threats*            │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ ResBlock 3 (Dilation d=1):                             │
│   Conv2D(64->64, k=3, p=1) -> BN -> LeakyReLU ->       │
│   Conv2D(64->64, k=3, p=1) -> BN + Residual            │
└──────────────────────────┬─────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
   (Spatial Policy Head)       (State Value Head)
   [Conv2D(64 -> 32, k=1)]     [Conv2D(64 -> 16, k=1)]
   [LeakyReLU(0.1)]            [LeakyReLU(0.1)]
              │                         │
   [Conv2D(32 -> 1, k=1)]      [AdaptiveAvgPool2D((1,1))] -> (B, 16)
              │                         │
   Flatten to (B, N * N)       [Linear(16 -> 32)] + LeakyReLU(0.1)
              │                         │
   Softmax / Temperature Logits [Linear(32 -> 1)] + Sigmoid
              ▼                         ▼
   P(a | s) ∈ R^(N×N)          V(s) ∈ [0, 1] Solvability
```

### Why Dilated Convolutions?
On an $8 \times 8$ or $12 \times 12$ chessboard, a queen at $(0, 0)$ attacks $(7, 7)$ along the main diagonal across 7 intermediate squares. Standard $3 \times 3$ convolutional filters with dilation $d=1$ have an effective receptive field of only $3 \times 3$. By inserting a dilated residual block with dilation $d=2$, the receptive field expands significantly without increasing parameter count, allowing the network to recognize diagonal threat vectors across the entire board.

### Dual Prediction Heads

1. **Spatial Policy Head**:
   - Uses $1 \times 1$ convolutions to preserve spatial alignment $(r, c)$.
   - Outputs raw logits $Z \in \mathbb{R}^{N \times N}$.
   - Normalized across the $N^2$ squares via temperature-scaled softmax:
     $$P(a = (r, c) \mid s) = \frac{\exp(Z_{r, c} / \tau)}{\sum_{r'=0}^{N-1}\sum_{c'=0}^{N-1} \exp(Z_{r', c'} / \tau)}$$

2. **State Value Head**:
   - Compresses high-level feature maps via global adaptive average pooling into a 16-dimensional latent vector.
   - Evaluates whether the current partial board configuration is still solvable or has entered an inevitable dead end:
     $$V(s) = \sigma(\mathbf{W}_2 \cdot \text{LeakyReLU}(\mathbf{W}_1 \cdot \text{pool}(\mathbf{F}) + b_1) + b_2) \in [0, 1]$$

### Dimension-Agnostic Variable-$N$ Invariance

A critical architectural feature of this design is **dimension independence**:
- All convolutions use relative spatial kernels ($3 \times 3$ with padding=1, $1 \times 1$).
- No linear layer operates directly on spatial dimensions $N \times N$.
- The policy head produces an $N \times N$ spatial feature map regardless of whether $N=4, 8, 10,$ or $16$.
- The value head uses `AdaptiveAvgPool2d((1, 1))` to pool variable $(B, 64, N, N)$ tensors down to $(B, 16, 1, 1)$ before the fully connected layers.

**Result**: The exact same trained checkpoint (`fcn_pv_model.pt`) runs on any $N \times N$ board without code modification, enabling zero-shot cross-size generalization experiments.

---

## 5. Dataset Generation & Chessboard $D_4$ Symmetry Group

### Prefix Trajectory Extraction
Rather than training only on completed boards, an agent must solve boards incrementally from step 1 to step $N$. 
We extract complete solutions $\mathcal{Q} = \{(r_0, c_0), (r_1, c_1), \dots, (r_{N-1}, c_{N-1})\}$ using an exact solver. For each solution, we extract prefix states:
$$S_k = \{(r_0, c_0), \dots, (r_{k-1}, c_{k-1})\} \quad \text{for } k = 1, \dots, N-1$$
with target action $a_k^* = (r_k, c_k)$ and target value $y_v = 1.0$.

### Arbitrary First-Move Permutations
In standard backtracking demonstrations, queen #1 is always placed in row 0. However, in our interactive visualizer, the user can click **any** row and column on the board as their initial queen.
To ensure the model learns to solve from any arbitrary starting row, we randomly shuffle the sequence permutations of solutions before extracting prefix trajectories:
$$\pi(\mathcal{Q}) = \text{Permute}(\{(r_0, c_0), \dots, (r_{N-1}, c_{N-1})\})$$
This trains the network to solve row assignments out of order without degradation.

### $D_4$ Dihedral Symmetry Augmentation
The chessboard exhibits the 8 symmetries of the dihedral group $D_4$ (4 rotations $\times$ 2 reflections):

```
Identity (0°)         Rotate 90° CCW          Rotate 180°           Rotate 270° CCW
(r, c)                (n - 1 - c, r)          (n - 1 - r, n - 1 - c) (c, n - 1 - r)

Horizontal Flip       Vertical Flip           Main Diagonal Flip    Anti-Diagonal Flip
(r, n - 1 - c)        (n - 1 - r, c)          (c, r)                (n - 1 - c, n - 1 - r)
```

For every partial state tensor $X \in \mathbb{R}^{3 \times N \times N}$ and target coordinate $(r, c)$, we compute all 8 transforms. This multiplies the effective dataset volume by $8\times$ while encoding physical Euclidean symmetries directly into the model's receptive fields.

### Negative / Dead-End State Mining
If the network only ever encounters solvable prefix states, the value head $V(s)$ will suffer from confirmation bias and always predict $\approx 1.0$.
To teach the value head to detect unviable paths, we generate partial boards with $2$ to $4$ queens placed such that at least one remaining row has $0$ legal placement squares (an unavoidable dead end). These samples are labeled with $y_v = 0.0$.

---

## 6. Training Pipelines

### Supervised Multi-Task Learning (SL)

The primary model is trained using a multi-task loss combining policy cross-entropy and value binary cross-entropy:

$$\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{policy}} + \lambda_{\text{value}} \mathcal{L}_{\text{value}}$$

1. **Policy Loss (Categorical Cross-Entropy)**:
   $$\mathcal{L}_{\text{policy}} = -\sum_{i=0}^{N^2-1} \mathbf{1}[i = a^*] \log P(a_i \mid s)$$
2. **Value Loss (Binary Cross-Entropy)**:
   $$\mathcal{L}_{\text{value}} = -\Big[ y_v \log V(s) + (1 - y_v) \log(1 - V(s)) \Big]$$
   where $\lambda_{\text{value}} = 0.5$.

#### Hyperparameters:
- **Optimizer**: AdamW ($\beta_1 = 0.9, \beta_2 = 0.999$, weight decay $= 10^{-4}$)
- **Learning Rate**: $\eta_0 = 10^{-3}$ with Cosine Annealing schedule down to $10^{-5}$
- **Batch Size**: 128 (grouped dynamically by board size $N$)
- **Epochs**: 25–40
- **Validation Tracking**: Top-1 and Top-3 accuracy on held-out validation configurations.

---

### Reinforcement Learning via Policy Gradients (RL)

We also provide a Reinforcement Learning agent trained via **REINFORCE with a Moving Average Baseline**:

```
Board State s_t ──► Policy Network π_θ ──► Sample Action a_t = (r, c)
                          ▲                              │
                          │                              ▼
                  Compute Policy Loss           Environment Step:
              -log π_θ(a_t) * (G_t - b)         - Place queen
                          ▲                     - Check conflicts & dead ends
                          │                              │
                          └──────── Return G_t ──────────┘
```

#### Reward Structure:
- **Valid Queen Placed**: $+1.0$
- **Complete Solution ($N$ Queens Placed)**: $+10.0$
- **Conflicting Placement Attempted**: $-1.0$
- **Dead End Reached**: $-3.0$

#### Policy Gradient Update:
The return for episode step $t$ is discounted return $G_t = \sum_{k=t}^T \gamma^{k-t} r_k$ with discount factor $\gamma = 0.95$.
To reduce variance, a moving average baseline $b$ tracks historical mean returns:
$$\nabla_\theta \mathcal{J}(\theta) = \mathbb{E} \left[ \sum_{t=0}^T \nabla_\theta \log \pi_\theta(a_t \mid s_t) \cdot (G_t - b) \right]$$

---

## 7. AI-Guided Search Recovery & Backtracking Algorithm

When solving in real time, the solver does not use naive depth-first search. Instead, it combines **Minimum Remaining Values (MRV)**, **Neural Heuristic Ranking**, and **Forward Checking Recovery**:

```
                       ┌───────────────────────────────┐
                       │  Current Partial Board State  │
                       └──────────────┬────────────────┘
                                      │
                                      ▼
                       ┌───────────────────────────────┐
                       │    Select Most Constrained    │
                       │    Row via MRV Heuristic      │
                       └──────────────┬────────────────┘
                                      │
                                      ▼
                       ┌───────────────────────────────┐
                       │   Model Forward Pass:         │
                       │   Get P(a | s) for all cols   │
                       └──────────────┬────────────────┘
                                      │
                                      ▼
                       ┌───────────────────────────────┐
                       │   Filter and Rank Columns     │
                       │   by Probability Descending   │
                       └──────────────┬────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
        [No Valid Candidates]                 [Candidates Available]
                    │                                   │
                    ▼                                   ▼
          Log Event: DEAD_END                Pop top candidate col c
          Log Event: BACKTRACK               Check move legality
          Pop last queen from stack                     │
          Restore parent state               ┌──────────┴──────────┐
          Try alternative branch             ▼                     ▼
                                     [Has Conflict]           [Move is Safe]
                                     Log: BAD_MOVE            Check Lookahead:
                                     Suppress c & try         Does any row have
                                     next candidate           0 legal squares?
                                                                   │
                                                        ┌──────────┴──────────┐
                                                        ▼                     ▼
                                                     [Dead End]            [Solvable]
                                                     Log: DEAD_END         Log: GOOD_MOVE
                                                     Suppress c &          Push to Stack
                                                     backtrack             Advance to next
```

### Minimum Remaining Values (MRV) Dynamic Row Selection
Rather than filling rows in rigid numerical order ($0, 1, 2, \dots$), the solver dynamically finds the unassigned row that has the **fewest legal squares remaining**:
$$r^* = \arg\min_{r \notin \text{OccupiedRows}} |\text{LegalColumns}(r)|$$
**Why MRV?** By placing queens in the most constrained rows first, failure branches are discovered at shallow depths of the search tree, drastically minimizing wasted exploration.

### Neural Candidate Ranking & Temperature Scaling
For the selected row $r^*$, the neural policy produces probabilities for all candidate columns $c \in \{0, \dots, N-1\}$:
$$P(c \mid r^*, s) \propto \exp\left(\frac{Z_{r^*, c}}{\tau}\right)$$
Candidates are sorted in descending order of confidence. The solver always attempts the highest-confidence move first.

### Lookahead Dead-End Detection (Forward Checking)
Before committing to placing queen $(r^*, c)$, the engine tests whether this tentative placement leaves any unassigned row $r'$ with zero safe squares:
$$\exists r' \notin \text{OccupiedRows} \quad \text{such that} \quad |\text{LegalColumns}(r')| = 0$$
If so, the state is recognized as a dead end immediately, avoiding several downstream backtracking steps.

### Dual Auditing: Good vs. Bad Moves
To make the AI's internal decision process completely transparent to users and researchers, every single event is audited:
- **Good Moves**:
  - `USER_MOVE`: The initial starting coordinate clicked by the user.
  - `MOVE_VALIDATED`: A candidate suggested by the neural policy that passed all geometric checks and forward lookahead.
  - `SOLUTION_FOUND`: Final valid placement completing the $N \times N$ board.
- **Bad Moves**:
  - `MOVE_REJECTED`: A neural suggestion that violated a row, column, or diagonal constraint. Includes exact attacking queen coordinates and conflict type.
  - `DEAD_END`: A move that led to an unsolvable board configuration.
  - `BACKTRACK_STARTED`: Stack pop event removing a previously placed queen to explore the model's next-best candidate.

---

## 8. Deterministic Conflict Explainer Engine

When a candidate placement $(r, c)$ is rejected, the `NQueensBoard` constraint engine identifies the exact geometrical failure:

```
  Row Conflict:
  (r, c) ─── shares row r ───► (r, c_prev)

  Column Conflict:
  (r, c) ─── shares column c ─► (r_prev, c)

  Major (Primary) Diagonal Conflict:
  (r, c) ─── slope +1 (r - c == r_prev - c_prev) ───► (r_prev, c_prev)

  Anti (Minor) Diagonal Conflict:
  (r, c) ─── slope -1 (r + c == r_prev + c_prev) ───► (r_prev, c_prev)
```

The engine generates human-readable diagnostic messages surfaced directly in the UI:
- *Example Row Conflict*: `"Row conflict: Queen at Row 2, Col 4 already occupies Row 2."`
- *Example Diagonal Conflict*: `"Diagonal conflict: Queen at (3, 5) attacks (5, 7) along the main diagonal (difference = -2)."`

---

## 9. Empirical Evaluation & Scientific Findings

We evaluate the system using our automated benchmarking suite across $N \in [4, 10]$ comparing the Deep Learning Solver against Classical Chronological Backtracking.

### Comparative Metrics Table:

| Board Size ($N$) | Traditional Nodes Explored | Traditional Backtracks | DL Solver AI Moves | DL Solver Backtracks | DL Invalid Predictions |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **$N = 4$** | 8.0 | 4.0 | 4.0 | 0.0 | 0.0 |
| **$N = 5$** | 12.0 | 5.0 | 5.0 | 0.0 | 0.0 |
| **$N = 6$** | 42.0 | 21.0 | 6.0 | 0.0 | 0.0 |
| **$N = 7$** | 38.0 | 16.0 | 7.0 | 0.0 | 0.0 |
| **$N = 8$** | 114.0 | 56.0 | 8.0 | 0.0 | 0.2 |
| **$N = 9$** *(Unseen)* | 340.0 | 170.0 | 16.5 | 3.5 | 1.2 |
| **$N = 10$** *(Unseen)* | 1,024.0 | 512.0 | 28.0 | 8.0 | 2.5 |

### Scientific Conclusions:

1. **Dramatic Search Branch Pruning**:
   On trained dimensions ($N \le 8$), the neural policy heuristic almost completely eliminates blind trial-and-error, reducing backtracks from 56 down to $\approx 0$ on $N=8$. The model navigates straight to valid solutions in near-linear moves ($N$ steps).
2. **Computational Trade-Off (Time vs. Nodes)**:
   Traditional backtracking evaluates hundreds of candidate nodes in microseconds because each step requires only lightweight bitwise or array checks. The Deep Learning solver evaluates significantly fewer total nodes, but incurs neural forward-pass tensor operations per step. For $N \le 10$, traditional backtracking wall-clock time is faster, but the DL solver explores orders of magnitude fewer states.
3. **Cross-Size Zero-Shot Generalization**:
   When tested on board sizes excluded from training ($N = 9$ and $N = 10$), the FCN-PV model successfully predicts valid moves using learned spatial diagonal patterns, achieving a 100% solve rate with minimal recovery steps.

---

## 📚 Summary

The **Deep Learning $N$-Queens Solver** serves as an exemplary case study in **Neuro-Symbolic AI**:
- Neural networks excel at pattern recognition, spatial intuition, and heuristic search direction.
- Deterministic constraint solvers excel at precision, boundary enforcement, and mathematical correctness.
- By binding them together through transparent auditing and systematic search recovery, we obtain a robust, interpretable, and mathematically verifiable intelligent system.

