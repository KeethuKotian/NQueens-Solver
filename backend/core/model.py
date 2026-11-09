import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple

class ResidualBlock(nn.Module):
    def __init__(self, channels: int, dilation: int = 1):
        super().__init__()
        padding = dilation
        self.conv1 = nn.Conv2d(channels, channels, kernel_size=3, padding=padding, dilation=dilation, bias=False)
        self.bn1 = nn.BatchNorm2d(channels)
        self.conv2 = nn.Conv2d(channels, channels, kernel_size=3, padding=1, dilation=1, bias=False)
        self.bn2 = nn.BatchNorm2d(channels)
        self.act = nn.LeakyReLU(0.1, inplace=True)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        residual = x
        out = self.act(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out += residual
        return self.act(out)

class NQueensFCN(nn.Module):
    """
    Fully Convolutional Policy & Value Network (FCN-PV) for the N-Queens Problem.
    
    Properties:
    - Input: Tensor of shape (Batch, 3, N, N) for any board dimension N >= 4.
    - Policy Head: Outputs logits for all N * N board coordinates.
    - Value Head: Outputs scalar solvability probability in [0, 1].
    - Variable Grid Support: Due to fully convolutional structure and adaptive pooling,
      the exact same trained weights execute on any board dimension N (enabling cross-N evaluation).
    """

    def __init__(self, in_channels: int = 3, hidden_dim: int = 64):
        super().__init__()
        # Initial projection
        self.init_conv = nn.Sequential(
            nn.Conv2d(in_channels, hidden_dim, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(hidden_dim),
            nn.LeakyReLU(0.1, inplace=True)
        )

        # Residual backbone with standard and dilated receptive fields
        self.res1 = ResidualBlock(hidden_dim, dilation=1)
        self.res2 = ResidualBlock(hidden_dim, dilation=2)  # Captures multi-square diagonals
        self.res3 = ResidualBlock(hidden_dim, dilation=1)

        # Policy Head (Outputs spatial action map 1 x N x N)
        self.policy_conv = nn.Sequential(
            nn.Conv2d(hidden_dim, 32, kernel_size=1),
            nn.LeakyReLU(0.1, inplace=True),
            nn.Conv2d(32, 1, kernel_size=1)
        )

        # Value Head (Outputs state solvability score)
        self.value_conv = nn.Sequential(
            nn.Conv2d(hidden_dim, 16, kernel_size=1),
            nn.LeakyReLU(0.1, inplace=True),
            nn.AdaptiveAvgPool2d((1, 1))
        )
        self.value_fc = nn.Sequential(
            nn.Linear(16, 32),
            nn.LeakyReLU(0.1, inplace=True),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Args:
            x: Input tensor of shape (Batch, 3, N, N)
        Returns:
            policy_logits: (Batch, N * N)
            value: (Batch, 1)
        """
        B, C, N, _ = x.shape
        feat = self.init_conv(x)
        feat = self.res1(feat)
        feat = self.res2(feat)
        feat = self.res3(feat)

        # Policy logits
        p_map = self.policy_conv(feat)  # (B, 1, N, N)
        policy_logits = p_map.view(B, N * N)

        # State value
        v_pool = self.value_conv(feat).view(B, 16)
        value = self.value_fc(v_pool)

        return policy_logits, value

    def predict_move_distribution(self, x: torch.Tensor, temperature: float = 1.0) -> Tuple[torch.Tensor, float]:
        """
        Inference helper for a single board state tensor (1, 3, N, N) or (3, N, N).
        Returns:
            probs: Tensor of shape (N, N) with softmax probabilities
            solvability: Float value estimate
        """
        self.eval()
        if x.dim() == 3:
            x = x.unsqueeze(0)
        
        with torch.no_grad():
            logits, val = self.forward(x)
            N = x.shape[-1]
            temp = max(1e-4, temperature)
            scaled_logits = logits / temp
            probs = F.softmax(scaled_logits, dim=-1).view(N, N)
            return probs, val.item()
