import os
import json
import time
import random
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from typing import Dict, Any, List

from .board import NQueensBoard
from .model import NQueensFCN
from .dataset import DatasetGenerator, NQueensDataset

def train_supervised_model(
    epochs: int = 35,
    batch_size: int = 128,
    learning_rate: float = 1e-3,
    save_dir: str = "backend/models",
    metrics_path: str = "backend/data/sl_training_history.json",
    sizes: List[int] = [4, 5, 6, 7, 8, 9, 10]
) -> Dict[str, Any]:
    """
    Trains the Fully Convolutional Policy & Value Network (FCN-PV) on exact N-Queens prefix trajectories.
    """
    os.makedirs(save_dir, exist_ok=True)
    os.makedirs(os.path.dirname(metrics_path), exist_ok=True)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[SL Training] Using device: {device}")

    # 1. Dataset Generation
    print(f"[SL Training] Generating dataset across board sizes N={sizes} with D4 augmentation...")
    data_by_size = DatasetGenerator.generate_multisize_dataset(sizes=sizes, max_per_size=120)
    
    all_train_samples = []
    all_val_samples = []

    for n, samples in data_by_size.items():
        random.shuffle(samples)
        split_idx = int(0.85 * len(samples))
        train_part = samples[:split_idx]
        val_part = samples[split_idx:]
        all_train_samples.extend(train_part)
        all_val_samples.extend(val_part)
        print(f"  N={n}: {len(samples)} samples (Train: {len(train_part)}, Val: {len(val_part)})")

    random.shuffle(all_train_samples)
    random.shuffle(all_val_samples)

    print(f"[SL Training] Total Train: {len(all_train_samples)}, Val: {len(all_val_samples)}")

    # Since samples have varying N (4..8), we group batches by size or train in mini-batches per size
    # We will build size-specific loaders for clean batching
    train_loaders = {}
    val_loaders = {}
    for n in sizes:
        s_train = [s for s in all_train_samples if s[0].shape[-1] == n]
        s_val = [s for s in all_val_samples if s[0].shape[-1] == n]
        if s_train:
            train_loaders[n] = DataLoader(NQueensDataset(s_train), batch_size=min(batch_size, len(s_train)), shuffle=True)
        if s_val:
            val_loaders[n] = DataLoader(NQueensDataset(s_val), batch_size=min(batch_size, len(s_val)), shuffle=False)

    model = NQueensFCN(in_channels=3, hidden_dim=64).to(device)
    optimizer = optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=1e-4)
    lr_scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    ce_loss_fn = nn.CrossEntropyLoss()
    bce_loss_fn = nn.BCELoss()

    history = {
        "metadata": {
            "model_type": "FCN-PV (Fully Convolutional Policy & Value Net)",
            "trained_sizes": sizes,
            "total_train_samples": len(all_train_samples),
            "total_val_samples": len(all_val_samples),
            "epochs": epochs,
            "device": str(device)
        },
        "epochs": []
    }

    start_train_time = time.time()

    for epoch in range(1, epochs + 1):
        model.train()
        epoch_policy_loss = 0.0
        epoch_val_loss = 0.0
        total_batches = 0

        # Iterate over all board sizes
        for n in sizes:
            if n not in train_loaders:
                continue
            for feats, targets, vals in train_loaders[n]:
                feats = feats.to(device)
                targets = targets.to(device)
                vals = vals.to(device)

                optimizer.zero_grad()
                logits, pred_vals = model(feats)

                # Policy loss only for positive states (val > 0.5)
                pos_mask = (vals > 0.5)
                if pos_mask.sum() > 0:
                    loss_policy = ce_loss_fn(logits[pos_mask], targets[pos_mask])
                else:
                    loss_policy = torch.tensor(0.0, device=device)

                # Solvability value loss
                loss_value = bce_loss_fn(pred_vals.squeeze(-1), vals)

                total_loss = loss_policy + 0.5 * loss_value
                total_loss.backward()
                optimizer.step()

                epoch_policy_loss += loss_policy.item()
                epoch_val_loss += loss_value.item()
                total_batches += 1

        lr_scheduler.step()
        avg_train_loss = (epoch_policy_loss + 0.5 * epoch_val_loss) / max(1, total_batches)

        # Validation Phase
        model.eval()
        val_policy_loss = 0.0
        val_value_loss = 0.0
        val_correct_top1 = 0
        val_correct_top3 = 0
        val_total = 0
        val_batches = 0

        with torch.no_grad():
            for n in sizes:
                if n not in val_loaders:
                    continue
                for feats, targets, vals in val_loaders[n]:
                    feats = feats.to(device)
                    targets = targets.to(device)
                    vals = vals.to(device)

                    logits, pred_vals = model(feats)
                    
                    pos_mask = (vals > 0.5)
                    if pos_mask.sum() > 0:
                        v_loss_p = ce_loss_fn(logits[pos_mask], targets[pos_mask])
                        val_policy_loss += v_loss_p.item()
                        
                        # Top-1 and Top-3 accuracy
                        pos_logits = logits[pos_mask]
                        pos_targets = targets[pos_mask]
                        _, top_indices = pos_logits.topk(min(3, pos_logits.shape[-1]), dim=-1)
                        
                        val_correct_top1 += (top_indices[:, 0] == pos_targets).sum().item()
                        val_correct_top3 += (top_indices == pos_targets.unsqueeze(1)).any(dim=-1).sum().item()
                        val_total += pos_targets.size(0)

                    v_loss_v = bce_loss_fn(pred_vals.squeeze(-1), vals)
                    val_value_loss += v_loss_v.item()
                    val_batches += 1

        avg_val_loss = (val_policy_loss + 0.5 * val_value_loss) / max(1, val_batches)
        top1_acc = round((val_correct_top1 / max(1, val_total)) * 100, 2)
        top3_acc = round((val_correct_top3 / max(1, val_total)) * 100, 2)

        epoch_record = {
            "epoch": epoch,
            "train_loss": round(avg_train_loss, 4),
            "val_loss": round(avg_val_loss, 4),
            "val_top1_accuracy": top1_acc,
            "val_top3_accuracy": top3_acc,
            "lr": round(optimizer.param_groups[0]["lr"], 6)
        }
        history["epochs"].append(epoch_record)

        if epoch % 5 == 0 or epoch == 1 or epoch == epochs:
            print(f"[Epoch {epoch:2d}/{epochs:2d}] Train Loss: {avg_train_loss:.4f} | Val Loss: {avg_val_loss:.4f} | Top-1 Acc: {top1_acc}% | Top-3 Acc: {top3_acc}%")

    total_time = round(time.time() - start_train_time, 2)
    history["metadata"]["total_time_seconds"] = total_time
    history["metadata"]["final_top1_acc"] = top1_acc
    history["metadata"]["final_top3_acc"] = top3_acc

    # Save trained model weights
    save_model_path = os.path.join(save_dir, "fcn_pv_model.pt")
    torch.save(model.state_dict(), save_model_path)
    print(f"[SL Training] Model saved to {save_model_path}")

    # Save metrics history
    with open(metrics_path, "w") as f:
        json.dump(history, f, indent=2)
    print(f"[SL Training] Metrics history saved to {metrics_path} (Elapsed: {total_time}s)")

    return history

if __name__ == "__main__":
    train_supervised_model(epochs=25)
