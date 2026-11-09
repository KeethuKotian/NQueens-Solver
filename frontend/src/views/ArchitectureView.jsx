import React from 'react';
import { 
  Layers, 
  Cpu, 
  ShieldCheck, 
  RotateCcw, 
  GitBranch, 
  HelpCircle,
  FileCode,
  CheckCircle2
} from 'lucide-react';

export default function ArchitectureView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Layers size={22} color="#38bdf8" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
            System Architecture & Deep Learning Methodology
          </h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Comprehensive architectural decoupling: Neural Policy Network, Deterministic Constraint Verification, and AI-Guided Recovery.
        </p>
      </div>

      {/* 3 Pillars of the System */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Pillar 1 */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', marginBottom: '0.6rem' }}>
            <Cpu size={20} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>1. Learned Neural Component</h3>
          </div>
          <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '1.1rem' }}>
            <li><strong>Model:</strong> Fully Convolutional Policy & Value Network (FCN-PV) with residual blocks and dilated kernels.</li>
            <li><strong>Variable Grid Agnostic:</strong> Convolutional operations accept any input tensor shape $(3, N, N)$ without spatial resampling.</li>
            <li><strong>Output:</strong> Spatial logits over all $N \times N$ cells and board solvability score $V(s) \in [0, 1]$.</li>
          </ul>
        </div>

        {/* Pillar 2 */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '0.6rem' }}>
            <ShieldCheck size={20} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>2. Deterministic Constraint Checker</h3>
          </div>
          <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '1.1rem' }}>
            <li><strong>Exact Physical Rules:</strong> Verifies row, column, main-diagonal (r - c = const), and anti-diagonal (r + c = const) non-interference.</li>
            <li><strong>Transparency:</strong> Pins down exact conflicting queens and explains the conflict geometrically.</li>
            <li><strong>No Fake Reasoning:</strong> Board rules never guess—they deterministically reject invalid placements.</li>
          </ul>
        </div>

        {/* Pillar 3 */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', marginBottom: '0.6rem' }}>
            <RotateCcw size={20} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>3. AI-Guided Search Recovery</h3>
          </div>
          <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '1.1rem' }}>
            <li><strong>Heuristic Branching:</strong> Candidates are prioritized according to the model's ranked probabilities $P(a|s)$.</li>
            <li><strong>Visible Recovery:</strong> When a path dead-ends, the system animates queen removal and attempts the model's next-best candidate.</li>
            <li><strong>Complete Audit Trail:</strong> Every action produces a timestamped event with probability and deterministic justification.</li>
          </ul>
        </div>
      </div>

      {/* Input Representation Detailed breakdown */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.8rem' }}>
          Input Tensor Representation: Shape (3, N, N)
        </h3>


        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'rgba(8, 12, 22, 0.6)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fbbf24', marginBottom: '0.3rem' }}>
              Channel 0: Queen Occupancy Map
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              A binary matrix where cell value is 1.0 if a queen currently occupies square (r, c), and 0.0 otherwise.
            </p>

          </div>

          <div style={{ background: 'rgba(8, 12, 22, 0.6)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ef4444', marginBottom: '0.3rem' }}>
              Channel 1: Threat Field Density
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              A continuous spatial map counting how many existing queens attack square $(r, c)$, normalized to $[0, 1]$.
            </p>
          </div>

          <div style={{ background: 'rgba(8, 12, 22, 0.6)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8', marginBottom: '0.3rem' }}>
              Channel 2: Unoccupied Row Mask
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Indicator mask highlighting remaining unassigned rows that still require queen placement.
            </p>
          </div>
        </div>
      </div>

      {/* Scientific Transparency Statement */}
      <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(99, 102, 241, 0.07)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
          <CheckCircle2 size={18} color="#38bdf8" />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e0e7ff' }}>
            Academic & Scientific Integrity Statement
          </h4>
        </div>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          This project strictly investigates whether a trained Deep Neural Network can learn useful heuristic guidance for NP-hard combinatorial constraint problems. The neural network is not faked; all move recommendations and confidence values originate from live PyTorch tensor forward passes. Where the model commits an error, that error is transparently demonstrated and recovered from via search backtracking.
        </p>
      </div>
    </div>
  );
}
