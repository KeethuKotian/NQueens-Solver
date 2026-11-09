import React from 'react';
import { Crown } from 'lucide-react';

export default function Header() {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(8, 12, 22, 0.9)',
      backdropFilter: 'blur(16px)',
      padding: '0.65rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)'
        }}>
          <Crown size={18} color="#ffffff" />
        </div>
        <h1 style={{
          fontSize: '1.05rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: '#ffffff',
          margin: 0
        }}>
          Deep Learning N-Queens Solver
        </h1>
      </div>
    </header>
  );
}
