import React from 'react';
import { RotateCcw, Zap } from 'lucide-react';

export default function Controls({
  n,
  setN,
  modelType,
  setModelType,
  speed,
  setSpeed,
  onReset,
  onAutoSolve,
  isSolving
}) {
  const nOptions = [4, 5, 6, 7, 8, 9, 10, 12];
  const speedOptions = [
    { id: 'slow', label: 'Slow' },
    { id: 'normal', label: 'Normal' },
    { id: 'fast', label: 'Fast' },
    { id: 'instant', label: 'Instant' },
  ];

  return (
    <div className="glass-card" style={{
      padding: '0.65rem 1rem',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '0.65rem'
    }}>
      {/* 1. Board Size N */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Size:
        </span>
        <div style={{ display: 'flex', gap: '0.2rem', background: 'rgba(8, 12, 22, 0.6)', padding: '0.2rem', borderRadius: '8px' }}>
          {nOptions.map((opt) => (
            <button
              key={opt}
              disabled={isSolving}
              onClick={() => setN(opt)}
              style={{
                padding: '0.2rem 0.5rem',
                borderRadius: '6px',
                border: 'none',
                background: n === opt ? 'linear-gradient(135deg, #6366f1, #06b6d4)' : 'transparent',
                color: n === opt ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: n === opt ? 700 : 500,
                fontSize: '0.72rem',
                cursor: isSolving ? 'not-allowed' : 'pointer'
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Model Policy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Policy:
        </span>
        <select
          value={modelType}
          disabled={isSolving}
          onChange={(e) => setModelType(e.target.value)}
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-subtle)',
            color: '#ffffff',
            padding: '0.25rem 0.6rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="supervised">Supervised (Deep FCN-PV)</option>
          <option value="reinforcement">Reinforcement Learning</option>
        </select>
      </div>

      {/* 3. Speed Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Speed:
        </span>
        <div style={{ display: 'flex', gap: '0.15rem', background: 'rgba(8, 12, 22, 0.6)', padding: '0.15rem', borderRadius: '6px' }}>
          {speedOptions.map((s) => (
            <button
              key={s.id}
              onClick={() => setSpeed(s.id)}
              style={{
                padding: '0.2rem 0.45rem',
                borderRadius: '5px',
                border: 'none',
                background: speed === s.id ? 'rgba(99, 102, 241, 0.5)' : 'transparent',
                color: speed === s.id ? '#ffffff' : 'var(--text-muted)',
                fontSize: '0.7rem',
                fontWeight: speed === s.id ? 700 : 400,
                cursor: 'pointer'
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Action Buttons: Auto Solve & Reset */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <button
          className="btn btn-primary"
          onClick={onAutoSolve}
          disabled={isSolving}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.78rem',
            padding: '0.35rem 0.85rem',
            boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)'
          }}
          title="Auto solve board"
        >
          <Zap size={14} /> Auto Solve
        </button>

        <button
          className="btn btn-secondary"
          onClick={onReset}
          style={{
            fontSize: '0.78rem',
            padding: '0.35rem 0.75rem'
          }}
          title="Reset Board"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  );
}
