import random
import torch
from torch.utils.data import Dataset, DataLoader
import numpy as np
from typing import List, Tuple, Dict, Any
from .board import NQueensBoard
from .solver_traditional import TraditionalBacktrackingSolver

def apply_d4_symmetry(feature_tensor: np.ndarray, target_r: int, target_c: int, n: int) -> List[Tuple[np.ndarray, int]]:
    """
    Applies the 8 dihedral symmetries (4 rotations x 2 reflections) of the chessboard
    to augment feature tensors and target coordinates.
    """
    augmented = []
    # Base transforms
    for flip in [False, True]:
        for rot_k in [0, 1, 2, 3]:
            # Feature tensor has shape (3, N, N)
            feat = feature_tensor.copy()
            tr, tc = target_r, target_c
            
            if flip:
                feat = np.flip(feat, axis=2)  # Flip columns
                tc = n - 1 - tc
                
            if rot_k > 0:
                feat = np.rot90(feat, k=rot_k, axes=(1, 2))
                for _ in range(rot_k):
                    # 90 deg counter-clockwise rotation of (r, c):
                    # new_r = n - 1 - c, new_c = r
                    new_r = n - 1 - tc
                    new_c = tr
                    tr, tc = new_r, new_c
                    
            target_idx = tr * n + tc
            augmented.append((np.ascontiguousarray(feat), target_idx))
    return augmented

class NQueensDataset(Dataset):
    """
    PyTorch Dataset of (state_tensor, target_action_idx, target_value) tuples.
    """
    def __init__(self, samples: List[Tuple[np.ndarray, int, float]]):
        self.samples = samples

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        feat, target_idx, val = self.samples[idx]
        return (
            torch.from_numpy(feat).float(),
            torch.tensor(target_idx, dtype=torch.long),
            torch.tensor(val, dtype=torch.float32)
        )

class DatasetGenerator:
    """
    Generates training and validation datasets of N-Queens state-action trajectories.
    Supports random initial moves, dead-end states, and D4 symmetries.
    """

    @staticmethod
    def generate_data_for_n(n: int, max_solutions: int = 120, augment_d4: bool = True) -> List[Tuple[np.ndarray, int, float]]:
        """
        Extracts partial prefix states and target next placements from valid solutions of size n.
        """
        solutions = TraditionalBacktrackingSolver.find_all_solutions(n, max_solutions=max_solutions)
        samples = []

        for sol in solutions:
            # We sample multiple random orderings of queen placements to ensure
            # the model learns to place next queens regardless of which queen was placed first!
            orderings = [list(sol)]  # Standard sequential
            num_perms = 3 if n <= 8 else 2
            for _ in range(num_perms):
                perm = list(sol)
                random.shuffle(perm)
                orderings.append(perm)

            for queen_seq in orderings:
                board = NQueensBoard(n)
                for step_idx in range(len(queen_seq) - 1):
                    # Current placed queens
                    board.place_queen(queen_seq[step_idx][0], queen_seq[step_idx][1])
                    
                    target_r, target_c = queen_seq[step_idx + 1]
                    feat = board.get_feature_tensor()
                    target_idx = target_r * n + target_c

                    if augment_d4 and n <= 8:
                        d4_samples = apply_d4_symmetry(feat, target_r, target_c, n)
                        for d_feat, d_idx in d4_samples:
                            samples.append((d_feat, d_idx, 1.0))
                    else:
                        samples.append((feat, target_idx, 1.0))

        # Add dead-end negative samples
        dead_end_count = 0
        target_dead_ends = min(max(len(samples) // 15, 20), 80)
        attempts = 0
        while dead_end_count < target_dead_ends and attempts < 600:
            attempts += 1
            board = NQueensBoard(n)
            num_q = random.randint(2, max(2, n - 2))
            for _ in range(num_q):
                r = random.randint(0, n - 1)
                c = random.randint(0, n - 1)
                if board.is_valid_placement(r, c):
                    board.place_queen(r, c)
            if board.is_dead_end() and len(board.queens) >= 2:
                feat = board.get_feature_tensor()
                samples.append((feat, 0, 0.0))
                dead_end_count += 1

        random.shuffle(samples)
        return samples

    @staticmethod
    def generate_multisize_dataset(sizes: List[int] = [4, 5, 6, 7, 8, 9, 10], max_per_size: int = 100) -> Dict[int, List[Tuple[np.ndarray, int, float]]]:
        """
        Generates dataset grouped by board size N.
        """
        data_by_size = {}
        for n in sizes:
            limit = max_per_size
            if n >= 9:
                limit = min(max_per_size, 80)
            samples = DatasetGenerator.generate_data_for_n(n, max_solutions=limit, augment_d4=True)
            data_by_size[n] = samples
        return data_by_size
