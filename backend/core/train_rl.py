import os
import json
import time
import random
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from typing import Dict, Any, List

from .board import NQueensBoard
from .model import NQueensFCN

def train_reinforcement_learning(
    episodes: int = 300,
    learning_rate: float = 1e-3,
    gamma: float = 0.95,
    save_dir: str = "backend/models",
    metrics_path: str = "backend/data/rl_training_history.json",
    train_sizes: List[int] = [4, 5, 6, 8]
) -> Dict[str, Any]:
    """
    Trains a policy-gradient (REINFORCE with moving average baseline) agent on the N-Queens environment.
    """
    os.makedirs(save_dir, exist_ok=True)
    os.makedirs(os.path.dirname(metrics_path), exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[RL Training] Using device: {device}")

    model = NQueensFCN(in_channels=3, hidden_dim=64).to(device)
    optimizer = optim.Adam(model.parameters(), lr=learning_rate)

    history = {
        "metadata": {
            "algorithm": "REINFORCE (Policy Gradient) with Baseline",
            "episodes": episodes,
            "gamma": gamma,
            "train_sizes": train_sizes,
            "device": str(device)
        },
        "episodes": []
    }

    start_time = time.time()
    baseline = 0.0
    running_reward = 0.0

    for ep in range(1, episodes + 1):
        # Sample board size
        n = random.choice(train_sizes)
        board = NQueensBoard(n)

        # Place initial random queen (simulating user or random start)
        r0 = random.randint(0, n - 1)
        c0 = random.randint(0, n - 1)
        board.place_queen(r0, c0)

        states = []
        actions = []
        rewards = []
        log_probs = []

        done = False
        max_steps_ep = n * 2
        step = 0
        invalid_count = 0

        while not done and step < max_steps_ep:
            step += 1
            feat = torch.from_numpy(board.get_feature_tensor()).float().unsqueeze(0).to(device)
            logits, _ = model(feat)
            
            # Action distribution
            dist = torch.distributions.Categorical(logits=logits)
            action = dist.sample()
            log_prob = dist.log_prob(action)

            action_idx = action.item()
            r = action_idx // n
            c = action_idx % n

            states.append(feat)
            actions.append(action)
            log_probs.append(log_prob)

            # Environment step
            has_conflict, _, _, _ = board.check_conflict(r, c)
            if has_conflict:
                reward = -1.0
                invalid_count += 1
                done = (invalid_count >= 3)  # Terminate early if too many conflicts
            else:
                board.place_queen(r, c)
                if board.is_solved():
                    reward = 15.0
                    done = True
                elif board.is_dead_end():
                    reward = -3.0
                    done = True
                else:
                    reward = 1.0

            rewards.append(reward)

            if len(board.queens) >= n:
                done = True

        # Compute discounted returns
        discounted_returns = []
        G = 0.0
        for r_val in reversed(rewards):
            G = r_val + gamma * G
            discounted_returns.insert(0, G)

        returns_t = torch.tensor(discounted_returns, dtype=torch.float32, device=device)
        total_ep_reward = sum(rewards)

        # Update baseline
        baseline = 0.95 * baseline + 0.05 * total_ep_reward
        advantages = returns_t - baseline

        # Policy Gradient loss: - sum_t (log_prob * advantage)
        policy_loss = []
        for lp, adv in zip(log_probs, advantages):
            policy_loss.append(-lp * adv)
        
        if policy_loss:
            optimizer.zero_grad()
            total_loss = torch.stack(policy_loss).sum()
            total_loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

        running_reward = 0.9 * running_reward + 0.1 * total_ep_reward if ep > 1 else total_ep_reward
        is_success = board.is_solved()

        ep_record = {
            "episode": ep,
            "n": n,
            "total_reward": round(total_ep_reward, 2),
            "running_reward": round(running_reward, 2),
            "steps": step,
            "invalid_count": invalid_count,
            "success": is_success
        }
        history["episodes"].append(ep_record)

        if ep % 50 == 0 or ep == 1 or ep == episodes:
            print(f"[RL Ep {ep:3d}/{episodes:3d}] N={n} | Reward: {total_ep_reward:5.1f} | Running Avg: {running_reward:5.1f} | Success: {is_success}")

    total_time = round(time.time() - start_time, 2)
    history["metadata"]["total_time_seconds"] = total_time

    # Save RL model weights
    save_model_path = os.path.join(save_dir, "rl_policy_model.pt")
    torch.save(model.state_dict(), save_model_path)
    print(f"[RL Training] RL Model saved to {save_model_path}")

    with open(metrics_path, "w") as f:
        json.dump(history, f, indent=2)
    print(f"[RL Training] RL metrics saved to {metrics_path}")

    return history

if __name__ == "__main__":
    train_reinforcement_learning(episodes=300)
