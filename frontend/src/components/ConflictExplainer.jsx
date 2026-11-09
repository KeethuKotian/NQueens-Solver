import React from 'react';
import { AlertTriangle, XCircle, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';

export default function ConflictExplainer({ currentEvent }) {
  if (!currentEvent || currentEvent.event_type !== 'CONFLICT_DETECTED') {
    return null;
  }

  const data = currentEvent.data || {};
  const rejectedPos = data.rejected_position;
  const conflictingQueen = data.conflicting_queen;
  const conflictType = data.conflict_type;
  const reason = data.reason;
  const confidence = data.confidence_was;

  return (
    <div style={{
      marginTop: '1rem',
      padding: '1.1rem 1.4rem',
      borderRadius: '16px',
      background: 'rgba(239, 68, 68, 0.08)',
      border: '1px solid rgba(239, 68, 68, 0.35)',
      boxShadow: '0 8px 30px rgba(239, 68, 68, 0.15)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      animation: 'conflict-pulse 2s infinite ease-in-out'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldAlert size={20} color="#ef4444" />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fca5a5' }}>
            Deterministic Constraint Violation Detected
          </h4>
        </div>
        <span className="badge badge-crimson">
          Rule: {conflictType?.replace('_', ' ')}
        </span>
      </div>

      {/* Two-column Comparison: Neural Net vs Chess Rule */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '0.9rem',
        marginTop: '0.2rem'
      }}>
        {/* Left: What the Neural Network Believed */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          border: '1px solid rgba(99, 102, 241, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <Cpu size={14} color="#38bdf8" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#93c5fd' }}>
              Neural Network Policy Prediction
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#e2e8f0', lineHeight: 1.4 }}>
            Model evaluated the board and selected <strong>Row {rejectedPos ? rejectedPos[0] + 1 : '?'}, Col {rejectedPos ? rejectedPos[1] + 1 : '?'}</strong> with <strong>{confidence}%</strong> confidence.
          </p>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', display: 'block', marginTop: '0.25rem' }}>
            The neural net has not yet mastered this specific diagonal/line constraint for this state.
          </span>
        </div>

        {/* Right: Why the Board Rules Rejected It */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          border: '1px solid rgba(239, 68, 68, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <XCircle size={14} color="#ef4444" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fca5a5' }}>
              Board Constraint Checker (Ground Truth)
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#fecaca', lineHeight: 1.4 }}>
            {reason}
          </p>
          {conflictingQueen && (
            <span style={{ fontSize: '0.7rem', color: '#fca5a5', fontWeight: 600, display: 'block', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
              Attacking Queen at ({conflictingQueen[0] + 1}, {conflictingQueen[1] + 1}) → Highlighted in Red on Chessboard.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
