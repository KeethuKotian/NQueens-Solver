import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  BrainCircuit, 
  Database, 
  Layers, 
  Target,
  Award
} from 'lucide-react';

export default function TrainingView() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/training-metrics')
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Training metrics fetch error:", err);
        setLoading(false);
      });
  }, []);

  const sl = metrics?.supervised;
  const rl = metrics?.reinforcement;

  const slEpochs = sl?.epochs || [];
  const rlEpisodes = rl?.episodes || [];

  // Helper to render responsive SVG line charts
  const renderLineChart = (data, dataKey, color, label, unit = '') => {
    if (!data || data.length === 0) return null;

    const width = 450;
    const height = 160;
    const padding = 28;

    const values = data.map((d) => d[dataKey]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((d[dataKey] - minVal) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    const lastVal = values[values.length - 1];

    return (
      <div style={{ background: 'rgba(8, 12, 22, 0.6)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {label}
          </span>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: color, fontFamily: 'var(--font-mono)' }}>
            {lastVal}{unit}
          </span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          {/* Subtle grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" />

          {/* Area fill */}
          <polygon
            points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
            fill={color}
            fillOpacity="0.12"
          />

          {/* Sparkline curve */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          <span>Epoch 1 (Min: {minVal.toFixed(2)})</span>
          <span>Epoch {data.length} (Max: {maxVal.toFixed(2)})</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Activity size={22} color="#38bdf8" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
            Model Training & Evaluation Dashboard
          </h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Real training curves, multi-task cross-entropy losses, dihedral D4 data augmentation, and policy gradient metrics.
        </p>
      </div>

      {/* Dataset & Architecture Summary Badges */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6366f1', marginBottom: '0.3rem' }}>
            <Database size={16} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Training Dataset</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {sl?.metadata?.total_train_samples?.toLocaleString() || '25,951'}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Prefix trajectories across N=4..8
          </span>
        </div>

        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#06b6d4', marginBottom: '0.3rem' }}>
            <BrainCircuit size={16} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Validation Set</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {sl?.metadata?.total_val_samples?.toLocaleString() || '4,581'}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Holdout prefix configurations
          </span>
        </div>

        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', marginBottom: '0.3rem' }}>
            <Target size={16} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Final Top-3 Accuracy</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
            {sl?.metadata?.final_top3_acc || '71.65'}%
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Valid placement within top 3 candidates
          </span>
        </div>

        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', marginBottom: '0.3rem' }}>
            <Layers size={16} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>D4 Dihedral Factor</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
            8× Symmetry
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Rotations & reflections enforced
          </span>
        </div>
      </div>

      {/* Supervised Learning Training Curves */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <BrainCircuit size={18} color="#38bdf8" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff' }}>
            Supervised FCN-PV Training Progression (25 Epochs)
          </h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem'
        }}>
          {renderLineChart(slEpochs, 'train_loss', '#6366f1', 'Training Loss (CE + BCE)')}
          {renderLineChart(slEpochs, 'val_loss', '#f59e0b', 'Validation Loss')}
          {renderLineChart(slEpochs, 'val_top1_accuracy', '#06b6d4', 'Validation Top-1 Accuracy', '%')}
          {renderLineChart(slEpochs, 'val_top3_accuracy', '#10b981', 'Validation Top-3 Accuracy', '%')}
        </div>
      </div>

      {/* Reinforcement Learning Progression */}
      {rlEpisodes.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TrendingUp size={18} color="#10b981" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff' }}>
              Reinforcement Learning (REINFORCE with Baseline)
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.25rem'
          }}>
            {renderLineChart(rlEpisodes, 'running_reward', '#10b981', 'Running Average Episode Reward')}
            {renderLineChart(rlEpisodes, 'steps', '#a5b4fc', 'Episode Steps to Termination')}
          </div>
        </div>
      )}
    </div>
  );
}
