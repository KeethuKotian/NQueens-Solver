import time
from typing import List, Tuple, Optional, Dict, Any
from .board import NQueensBoard

class TraditionalBacktrackingSolver:
    """
    Standard deterministic backtracking solver for the N-Queens problem.
    Used for:
    1. Ground-truth solution generation (dataset construction)
    2. Scientific benchmarking against the Deep Learning solver
    """

    def __init__(self, n: int):
        self.n = n
        self.nodes_explored = 0
        self.backtracks = 0
        self.start_time = 0.0
        self.elapsed_time = 0.0

    def solve(self, initial_queen: Optional[Tuple[int, int]] = None, timeout: float = 30.0) -> Dict[str, Any]:
        """
        Solves the N-Queens problem with an optional initial fixed queen.
        Returns a dictionary with success, solution, nodes_explored, backtracks, and elapsed_time.
        """
        self.nodes_explored = 0
        self.backtracks = 0
        board = NQueensBoard(self.n)
        
        assigned_rows = set()
        if initial_queen is not None:
            r0, c0 = initial_queen
            board.place_queen(r0, c0)
            assigned_rows.add(r0)

        unassigned_rows = [r for r in range(self.n) if r not in assigned_rows]
        
        self.start_time = time.perf_counter()
        solved = self._backtrack(board, unassigned_rows, 0, timeout)
        self.elapsed_time = time.perf_counter() - self.start_time

        return {
            "success": solved,
            "solution": list(board.queens) if solved else None,
            "nodes_explored": self.nodes_explored,
            "backtracks": self.backtracks,
            "elapsed_time": self.elapsed_time,
            "n": self.n
        }

    def _backtrack(self, board: NQueensBoard, rows_to_place: List[int], idx: int, timeout: float) -> bool:
        if time.perf_counter() - self.start_time > timeout:
            return False  # Timed out
        
        if idx == len(rows_to_place):
            return True  # All queens successfully placed

        current_row = rows_to_place[idx]
        for col in range(self.n):
            self.nodes_explored += 1
            if board.is_valid_placement(current_row, col):
                board.place_queen(current_row, col)
                if self._backtrack(board, rows_to_place, idx + 1, timeout):
                    return True
                # Backtrack
                board.remove_queen(current_row, col)
                self.backtracks += 1

        return False

    @staticmethod
    def find_all_solutions(n: int, max_solutions: int = 1000) -> List[List[Tuple[int, int]]]:
        """
        Finds all valid N-Queens solutions (or up to max_solutions).
        Returns a list of solutions, where each solution is a list of (row, col) coordinates.
        """
        solutions = []
        cols = [-1] * n

        def can_place(row: int, col: int) -> bool:
            for prev_r in range(row):
                prev_c = cols[prev_r]
                if prev_c == col or abs(prev_r - row) == abs(prev_c - col):
                    return False
            return True

        def search(row: int):
            if len(solutions) >= max_solutions:
                return
            if row == n:
                solution = [(r, cols[r]) for r in range(n)]
                solutions.append(solution)
                return

            for col in range(n):
                if can_place(row, col):
                    cols[row] = col
                    search(row + 1)
                    cols[row] = -1

        search(0)
        return solutions
