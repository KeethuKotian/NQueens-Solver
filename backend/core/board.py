import numpy as np
from typing import List, Tuple, Optional, Dict, Any

class NQueensBoard:
    """
    Deterministic N-Queens Board & Constraint Validator.
    
    Responsibilities:
    - Maintains the physical board state (queens placement)
    - Validates moves deterministically according to chess rules
    - Identifies exact conflicting queens and generates human-readable explanations
    - Computes spatial feature channels for Deep Learning inference
    """

    def __init__(self, n: int):
        if n < 4:
            raise ValueError("N must be at least 4 for the N-Queens problem.")
        self.n = n
        self.queens: List[Tuple[int, int]] = []  # List of (row, col) coordinates

    def copy(self) -> 'NQueensBoard':
        new_board = NQueensBoard(self.n)
        new_board.queens = list(self.queens)
        return new_board

    def clear(self):
        self.queens.clear()

    def place_queen(self, row: int, col: int) -> bool:
        """
        Places a queen unconditionally on the board.
        Returns True if successful.
        """
        if not (0 <= row < self.n and 0 <= col < self.n):
            raise ValueError(f"Coordinate ({row}, {col}) out of bounds for N={self.n}.")
        if (row, col) in self.queens:
            return False
        self.queens.append((row, col))
        return True

    def remove_queen(self, row: int, col: int) -> bool:
        """Removes a queen from the board if present."""
        if (row, col) in self.queens:
            self.queens.remove((row, col))
            return True
        return False

    def pop_last_queen(self) -> Optional[Tuple[int, int]]:
        """Removes and returns the most recently placed queen (for backtracking)."""
        if self.queens:
            return self.queens.pop()
        return None

    def get_grid(self) -> np.ndarray:
        """Returns an N x N binary matrix where 1 = queen, 0 = empty."""
        grid = np.zeros((self.n, self.n), dtype=np.float32)
        for r, c in self.queens:
            grid[r, c] = 1.0
        return grid

    def get_occupied_rows(self) -> set:
        return {r for r, _ in self.queens}

    def get_occupied_cols(self) -> set:
        return {c for _, c in self.queens}

    def check_conflict(self, row: int, col: int) -> Tuple[bool, Optional[str], Optional[Tuple[int, int]], Optional[str]]:
        """
        Deterministically checks if placing a queen at (row, col) conflicts with any existing queen.
        Returns:
            (has_conflict, reason_text, conflicting_queen_coord, conflict_type)
        """
        # 1. Occupied check
        for qr, qc in self.queens:
            if qr == row and qc == col:
                return (
                    True,
                    f"Position ({row + 1}, {col + 1}) is already occupied by a queen.",
                    (qr, qc),
                    "OCCUPIED"
                )

        # 2. Row check
        for qr, qc in self.queens:
            if qr == row:
                return (
                    True,
                    f"Row conflict: Queen at Row {qr + 1}, Col {qc + 1} already occupies Row {row + 1}.",
                    (qr, qc),
                    "ROW"
                )

        # 3. Column check
        for qr, qc in self.queens:
            if qc == col:
                return (
                    True,
                    f"Column conflict: Queen at Row {qr + 1}, Col {qc + 1} already occupies Column {col + 1}.",
                    (qr, qc),
                    "COLUMN"
                )

        # 4. Diagonal check
        for qr, qc in self.queens:
            # Major diagonal: qr - qc == row - col
            if qr - qc == row - col:
                return (
                    True,
                    f"Diagonal conflict: Queen at ({qr + 1}, {qc + 1}) attacks ({row + 1}, {col + 1}) along the main diagonal (difference = {row - col}).",
                    (qr, qc),
                    "MAIN_DIAGONAL"
                )
            # Minor diagonal: qr + qc == row + col
            if qr + qc == row + col:
                return (
                    True,
                    f"Diagonal conflict: Queen at ({qr + 1}, {qc + 1}) attacks ({row + 1}, {col + 1}) along the anti-diagonal (sum = {row + col}).",
                    (qr, qc),
                    "ANTI_DIAGONAL"
                )

        return (False, None, None, None)

    def is_valid_placement(self, row: int, col: int) -> bool:
        """Returns True if (row, col) can legally accept a queen without any conflict."""
        has_conflict, _, _, _ = self.check_conflict(row, col)
        return not has_conflict

    def get_valid_squares(self) -> List[Tuple[int, int]]:
        """Returns all squares on the board that currently have no conflicts."""
        valid_squares = []
        for r in range(self.n):
            for c in range(self.n):
                if self.is_valid_placement(r, c):
                    valid_squares.append((r, c))
        return valid_squares

    def get_valid_squares_for_row(self, row: int) -> List[int]:
        """Returns a list of column indices where a queen can be safely placed in the given row."""
        valid_cols = []
        for c in range(self.n):
            if self.is_valid_placement(row, c):
                valid_cols.append(c)
        return valid_cols

    def is_dead_end(self) -> bool:
        """
        A dead end occurs when there exists at least one unassigned row
        that has ZERO valid squares remaining.
        """
        occupied_rows = self.get_occupied_rows()
        for r in range(self.n):
            if r not in occupied_rows:
                if len(self.get_valid_squares_for_row(r)) == 0:
                    return True
        return False

    def is_solved(self) -> bool:
        """Checks if all N queens are placed and none attack each other."""
        if len(self.queens) != self.n:
            return False
        # Verify all pairs
        for i in range(self.n):
            for j in range(i + 1, self.n):
                r1, c1 = self.queens[i]
                r2, c2 = self.queens[j]
                if r1 == r2 or c1 == c2 or abs(r1 - r2) == abs(c1 - c2):
                    return False
        return True

    def get_threat_field(self) -> np.ndarray:
        """
        Computes an N x N matrix counting how many existing queens attack each cell.
        Values normalized by dividing by 3.0 (capped at 1.0).
        """
        threats = np.zeros((self.n, self.n), dtype=np.float32)
        for r in range(self.n):
            for c in range(self.n):
                count = 0
                for qr, qc in self.queens:
                    if qr == r and qc == c:
                        continue
                    if qr == r or qc == c or abs(qr - r) == abs(qc - c):
                        count += 1
                threats[r, c] = min(1.0, count / 3.0)
        return threats

    def get_feature_tensor(self) -> np.ndarray:
        """
        Constructs the 3-channel input tensor for the Deep Learning model:
        Channel 0: Queen Occupancy Map (1.0 for placed queens, 0.0 otherwise)
        Channel 1: Threat Field (Normalized density of attacks)
        Channel 2: Unoccupied Row Mask (1.0 for rows needing a queen, 0.0 for completed rows)
        Returns:
            np.ndarray of shape (3, N, N)
        """
        tensor = np.zeros((3, self.n, self.n), dtype=np.float32)
        # Channel 0
        for r, c in self.queens:
            tensor[0, r, c] = 1.0
        # Channel 1
        tensor[1] = self.get_threat_field()
        # Channel 2
        occupied_rows = self.get_occupied_rows()
        for r in range(self.n):
            if r not in occupied_rows:
                tensor[2, r, :] = 1.0
        return tensor

    def to_dict(self) -> Dict[str, Any]:
        return {
            "n": self.n,
            "queens": list(self.queens),
            "num_queens": len(self.queens),
            "is_solved": self.is_solved(),
            "is_dead_end": self.is_dead_end()
        }
