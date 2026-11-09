import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Sparkles,
  Zap, 
  Clock, 
  Crown,
  Layers,
  AlertTriangle
} from 'lucide-react';

export default function StatsBar({
  stats = null,
  n = 8,
  currentQueensCount = 0,
  currentEvent = null,
  isSolving = false,
  allEvents = []
}) {
  const isSolved = currentEvent?.event_type === 'SOLUTION_FOUND';
  const isExhausted = currentEvent?.event_type === 'SEARCH_EXHAUSTED';

  // Calculate live counts from events up to current index or from stats
  const goodCount = stats?.good_moves_count ?? allEvents.filter(e => 
    e.event_type === 'USER_MOVE' || e.event_type === 'MOVE_VALIDATED' || e.event_type === 'SOLUTION_FOUND'
  ).length;

  const badCount = stats?.bad_moves_count ?? allEvents.filter(e => 
    e.event_type === 'CONFLICT_DETECTED' || e.event_type === 'DEAD_END' || e.event_type === 'BACKTRACK_STARTED'
  ).length;

  const totalMoves = stats?.total_moves ?? (goodCount + badCount);

  // Status configuration
  let statusText = 'Ready to Place Queen';
  let statusColor = '#38bdf8';
  let StatusIcon = Crown;

  if (isSolved) {
    statusText = 'Solution Discovered! 🎉';
    statusColor = '#10b981';
    StatusIcon = Sparkles;
  } else if (isExhausted) {
    statusText = 'Search Exhausted';
    statusColor = '#ef4444';
    StatusIcon = XCircle;
  } else if (isSolving) {
    statusText = 'AI Solving...';
    statusColor = '#fbbf24';
    StatusIcon = Zap;
  } else if (allEvents.length > 0) {
    statusText = `Step #${currentEvent?.step_index || 0} / ${allEvents.length}`;
    statusColor = '#a5b4fc';
    StatusIcon = Layers;
  }

  return (
    <div className="glass-card" style={{
      padding: '1rem 1.25rem',
      borderRadius: '16px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
      gap: '1rem',
      alignItems: 'center'
    }}>
      {/* 1. Status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <StatusIcon size={14} color={statusColor} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Solver Status
          </span>
        </div>
        <div style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: statusColor,
          fontFamily: 'var(--font-display)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {statusText}
        </div>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          {isSolving ? 'Neural policy active' : isSolved ? '0 conflicts on board' : 'Click any square or Auto Solve'}
        </span>
      </div>

      {/* 2. Total Moves */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', paddingLeft: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Zap size={14} color="#38bdf8" />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Total Moves
          </span>
        </div>
        <div style={{
          fontSize: '1.4rem',
          fontWeight: 800,
          color: '#ffffff',
          fontFamily: 'var(--font-mono)',
          lineHeight: 1
        }}>
          {totalMoves}
        </div>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          {allEvents.length} reasoning steps
        </span>
      </div>

      {/* 3. Good Moves */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', paddingLeft: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <CheckCircle2 size={14} color="#10b981" />
          <span style={{ fontSize: '0.7rem', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Good Moves
          </span>
        </div>
        <div style={{
          fontSize: '1.4rem',
          fontWeight: 800,
          color: '#34d399',
          fontFamily: 'var(--font-mono)',
          lineHeight: 1
        }}>
          {goodCount}
        </div>
        <span style={{ fontSize: '0.65rem', color: '#6ee7b7' }}>
          Valid safe placements
        </span>
      </div>

      {/* 4. Bad Moves */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', paddingLeft: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <XCircle size={14} color="#ef4444" />
          <span style={{ fontSize: '0.7rem', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Bad Moves
          </span>
        </div>
        <div style={{
          fontSize: '1.4rem',
          fontWeight: 800,
          color: '#f87171',
          fontFamily: 'var(--font-mono)',
          lineHeight: 1
        }}>
          {badCount}
        </div>
        <span style={{ fontSize: '0.65rem', color: '#fca5a5' }}>
          {stats?.invalid_predictions ? `${stats.invalid_predictions} conflicts, ${stats.backtracks} backtracks` : 'Conflicts & recoveries'}
        </span>
      </div>

      {/* 5. Queens Placed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', paddingLeft: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Crown size={14} color="#fbbf24" />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Queens Placed
          </span>
        </div>
        <div style={{
          fontSize: '1.4rem',
          fontWeight: 800,
          color: currentQueensCount === n ? '#10b981' : '#fbbf24',
          fontFamily: 'var(--font-mono)',
          lineHeight: 1
        }}>
          {currentQueensCount} / {n}
        </div>
        <div style={{
          width: '100%',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginTop: '2px'
        }}>
          <div style={{
            width: `${Math.min(100, (currentQueensCount / n) * 100)}%`,
            height: '100%',
            background: currentQueensCount === n ? '#10b981' : 'linear-gradient(90deg, #6366f1, #38bdf8)',
            transition: 'width 0.2s ease'
          }} />
        </div>
      </div>

      {/* 6. Solving Time */}
      {stats?.solving_time_seconds !== undefined && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', paddingLeft: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={14} color="#94a3b8" />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Solve Time
            </span>
          </div>
          <div style={{
            fontSize: '1.2rem',
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: 'var(--font-mono)'
          }}>
            {stats.solving_time_seconds}s
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            Avg conf: {stats.average_confidence}%
          </span>
        </div>
      )}
    </div>
  );
}
