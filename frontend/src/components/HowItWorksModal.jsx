import React from 'react';
import { X, Brain, CheckCircle2, XCircle, RotateCcw, Cpu, Layers, ShieldCheck, Activity } from 'lucide-react';

export default function HowItWorksModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(12px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }} onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className="glass-card"
        style={{
          maxWidth: '840px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem',
          borderRadius: '20px',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          background: 'rgba(15, 23, 42, 0.95)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Brain size={22} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                How the Deep Learning N-Queens System Works
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                MCA Research Architecture: Neural Heuristic Guidance + Deterministic Constraint Verification
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 4 Pillars Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
          
          {/* Pillar 1 */}
          <div style={{
            background: 'rgba(8, 12, 22, 0.6)',
            padding: '1.2rem',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8' }}>
              <Layers size={18} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>1. 3-Channel Board Tensor</h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              The chessboard is encoded as an input tensor of shape <code>(3, N, N)</code>:
            </p>
            <ul style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
              <li><strong>Channel 0 (Occupancy):</strong> 1.0 where queens are placed, 0.0 elsewhere.</li>
              <li><strong>Channel 1 (Threat Density):</strong> Normalized attack rays from existing queens.</li>
              <li><strong>Channel 2 (Unassigned Mask):</strong> 1.0 for rows that still require a queen.</li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div style={{
            background: 'rgba(8, 12, 22, 0.6)',
            padding: '1.2rem',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a5b4fc' }}>
              <Cpu size={18} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>2. FCN-PV Neural Network</h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              A <strong>Fully Convolutional Policy & Value Network</strong> with dilated residual blocks:
            </p>
            <ul style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
              <li><strong>Policy Head:</strong> Outputs softmax probability distribution <code>P(a | s)</code> over all squares.</li>
              <li><strong>Value Head:</strong> Predicts state solvability score <code>V(s) ∈ [0, 1]</code>.</li>
              <li><strong>Grid Invariance:</strong> Supports variable board size N seamlessly.</li>
            </ul>
          </div>

          {/* Pillar 3 */}
          <div style={{
            background: 'rgba(8, 12, 22, 0.6)',
            padding: '1.2rem',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399' }}>
              <CheckCircle2 size={18} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>3. Good Moves Log</h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Records every valid queen placement verified by deterministic rules:
            </p>
            <ul style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
              <li>User's initial starting queen.</li>
              <li>Conflict-free queen placements proposed by AI policy and validated by chess rules.</li>
              <li>Final complete solution placement (all N queens placed safely).</li>
            </ul>
          </div>

          {/* Pillar 4 */}
          <div style={{
            background: 'rgba(8, 12, 22, 0.6)',
            padding: '1.2rem',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
              <XCircle size={18} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>4. Bad Moves & Recovery Log</h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Scientific transparency showing where AI policy made mistakes:
            </p>
            <ul style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
              <li><strong>Conflicts:</strong> Neural suggestions that attacked an existing queen (row, col, or diagonal).</li>
              <li><strong>Dead Ends:</strong> Forward lookahead showing that a move leaves another row with 0 valid squares.</li>
              <li><strong>Backtracking:</strong> Safe systematic recovery to the model's next best candidate.</li>
            </ul>
          </div>
        </div>

        {/* Bottom takeaway note */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          padding: '1rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <ShieldCheck size={24} color="#818cf8" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>
            <strong>Deterministic Safety Guarantee:</strong> The neural network serves as a fast heuristic policy guide, while the deterministic chess rules validator guarantees that no illegal placement is ever accepted. Even if the neural net guesses a conflict, the solver catches it, logs it as a Bad Move, and backtracks to a mathematically verified solution!
          </p>
        </div>
      </div>
    </div>
  );
}
