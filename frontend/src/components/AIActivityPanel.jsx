import React, { useState, useRef, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RotateCcw, 
  ArrowRight, 
  Sparkles, 
  Filter, 
  BrainCircuit,
  Info
} from 'lucide-react';

export default function AIActivityPanel({
  currentEvent,
  allEvents,
  currentIndex,
  onSelectEvent,
  isSolving
}) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'CONFLICTS' | 'BACKTRACKS'
  const timelineEndRef = useRef(null);

  // Auto-scroll timeline to active step
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentIndex, allEvents]);

  const eventType = currentEvent?.event_type;
  const eventData = currentEvent?.data || {};

  // Status Badge config
  const getStatusBadge = () => {
    switch (eventType) {
      case 'USER_MOVE':
        return { label: 'User Placement', color: 'badge-gold', icon: Sparkles };
      case 'MOVE_PREDICTED':
        return { label: 'AI Policy Selected', color: 'badge-cyan', icon: BrainCircuit };
      case 'MOVE_VALIDATED':
        return { label: 'Move Validated ✓', color: 'badge-emerald', icon: CheckCircle2 };
      case 'CONFLICT_DETECTED':
        return { label: 'Conflict Detected ✗', color: 'badge-crimson', icon: XCircle };
      case 'DEAD_END':
        return { label: 'Dead End Encountered ⚠', color: 'badge-crimson', icon: AlertTriangle };
      case 'BACKTRACK_STARTED':
        return { label: 'AI-Guided Backtracking ↩', color: 'badge-gold', icon: RotateCcw };
      case 'ALTERNATIVE_SELECTED':
        return { label: 'Alternative Candidate →', color: 'badge-indigo', icon: ArrowRight };
      case 'SOLUTION_FOUND':
        return { label: 'Solution Discovered 🎉', color: 'badge-emerald', icon: Sparkles };
      default:
        return { label: 'Awaiting Action', color: 'badge-indigo', icon: Activity };
    }
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  // Filtered timeline
  const visibleEvents = allEvents.slice(0, currentIndex + 1).filter((ev) => {
    if (filter === 'CONFLICTS') return ev.event_type === 'CONFLICT_DETECTED' || ev.event_type === 'DEAD_END';
    if (filter === 'BACKTRACKS') return ev.event_type === 'BACKTRACK_STARTED';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      {/* 1. Live Decision Card */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff' }}>AI Reasoning & Decision</h3>
          </div>
          <span className={`badge ${status.color}`}>
            <StatusIcon size={12} />
            {status.label}
          </span>
        </div>

        {/* Current Move Details */}
        <div style={{ background: 'rgba(8, 12, 22, 0.6)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          {currentEvent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current Step:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                  #{currentEvent.step_index} / {allEvents.length}
                </span>
              </div>

              {eventData.position && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Target Coordinate:</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>
                    Row {eventData.position[0] + 1}, Col {eventData.position[1] + 1}
                  </span>
                </div>
              )}

              {eventData.confidence !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Model Confidence:</span>
                  <span style={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: eventType === 'CONFLICT_DETECTED' ? '#ef4444' : '#38bdf8'
                  }}>
                    {eventData.confidence}%
                  </span>
                </div>
              )}

              {eventData.solvability_estimate !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>State Solvability V(s):</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                    {eventData.solvability_estimate}%
                  </span>
                </div>
              )}

              <p style={{
                fontSize: '0.8rem',
                color: eventType === 'CONFLICT_DETECTED' ? '#fca5a5' : 'var(--text-secondary)',
                lineHeight: 1.4,
                marginTop: '0.2rem'
              }}>
                {eventData.description || eventData.message || eventData.explanation || "Evaluating current board configuration..."}
              </p>
            </div>
          ) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Board is empty. Place the first queen to start AI inference.
            </p>
          )}
        </div>

        {/* Top Candidate Distribution Bars */}
        {eventData.top_candidates && eventData.top_candidates.length > 0 && (
          <div style={{ marginTop: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Neural Policy Ranking P(a | s):
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Row {eventData.position ? eventData.position[0] + 1 : ''} Candidates
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {eventData.top_candidates.map((cand, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <span style={{ width: '45px', fontFamily: 'var(--font-mono)', color: idx === 0 ? '#38bdf8' : 'var(--text-muted)' }}>
                    Col {cand.col + 1}
                  </span>
                  <div style={{
                    flex: 1,
                    height: '10px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${Math.min(100, cand.confidence)}%`,
                      height: '100%',
                      borderRadius: '4px',
                      background: idx === 0 
                        ? 'linear-gradient(90deg, #6366f1, #38bdf8)' 
                        : 'rgba(99, 102, 241, 0.45)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <span style={{ width: '42px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: idx === 0 ? '#ffffff' : 'var(--text-secondary)' }}>
                    {cand.confidence}%
                  </span>
                </div>
              ))}
            </div>

            {/* Scientific Transparency Callout */}
            <div style={{
              marginTop: '0.65rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.4rem',
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '0.4rem 0.6rem',
              borderRadius: '8px'
            }}>
              <Info size={12} color="#94a3b8" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>Scientific Note: High model confidence does <strong>not</strong> guarantee correctness. The board constraint validator enforces deterministic rules.</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Move-by-Move Timeline */}
      <div className="glass-card" style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', minHeight: '260px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff' }}>Search & Reasoning Timeline</h3>

          {/* Filter options */}
          <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(8, 12, 22, 0.6)', padding: '0.2rem', borderRadius: '8px' }}>
            {['ALL', 'CONFLICTS', 'BACKTRACKS'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  fontSize: '0.68rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: filter === f ? 'rgba(99, 102, 241, 0.4)' : 'transparent',
                  color: filter === f ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: filter === f ? 600 : 400
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Event List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: '280px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          paddingRight: '0.3rem'
        }}>
          {visibleEvents.length === 0 ? (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
              No events recorded yet.
            </p>
          ) : (
            visibleEvents.map((ev, idx) => {
              const isSelected = ev.step_index === currentEvent?.step_index;
              const type = ev.event_type;
              const data = ev.data || {};

              let icon = <CheckCircle2 size={13} color="#10b981" />;
              let borderColor = 'rgba(255, 255, 255, 0.05)';
              let label = 'Valid';

              if (type === 'USER_MOVE') {
                icon = <Sparkles size={13} color="#fbbf24" />;
                label = 'User Move';
              } else if (type === 'MOVE_PREDICTED') {
                icon = <BrainCircuit size={13} color="#38bdf8" />;
                label = 'Predicted';
              } else if (type === 'CONFLICT_DETECTED') {
                icon = <XCircle size={13} color="#ef4444" />;
                borderColor = 'rgba(239, 68, 68, 0.3)';
                label = 'Conflict';
              } else if (type === 'DEAD_END') {
                icon = <AlertTriangle size={13} color="#f97316" />;
                borderColor = 'rgba(249, 115, 22, 0.3)';
                label = 'Dead End';
              } else if (type === 'BACKTRACK_STARTED') {
                icon = <RotateCcw size={13} color="#f59e0b" />;
                borderColor = 'rgba(245, 158, 11, 0.3)';
                label = 'Backtrack';
              } else if (type === 'ALTERNATIVE_SELECTED') {
                icon = <ArrowRight size={13} color="#a5b4fc" />;
                label = 'Alternative';
              } else if (type === 'SOLUTION_FOUND') {
                icon = <Sparkles size={13} color="#34d399" />;
                borderColor = 'rgba(16, 185, 129, 0.4)';
                label = 'Solved!';
              }

              return (
                <div
                  key={idx}
                  onClick={() => onSelectEvent(ev.step_index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0.65rem',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.4)',
                    border: isSelected ? '1px solid #6366f1' : `1px solid ${borderColor}`,
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      {String(ev.step_index).padStart(2, '0')}
                    </span>
                    {icon}
                    <span style={{ fontWeight: 500, color: '#f1f5f9' }}>
                      {label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {data.position && (
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#fbbf24', fontSize: '0.7rem' }}>
                        ({data.position[0] + 1}, {data.position[1] + 1})
                      </span>
                    )}
                    {data.confidence !== undefined && (
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        color: type === 'CONFLICT_DETECTED' ? '#ef4444' : '#38bdf8'
                      }}>
                        {data.confidence}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={timelineEndRef} />
        </div>
      </div>
    </div>
  );
}
