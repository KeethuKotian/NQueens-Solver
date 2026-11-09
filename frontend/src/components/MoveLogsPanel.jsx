import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  AlertTriangle, 
  Sparkles, 
  BrainCircuit, 
  Filter, 
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Activity
} from 'lucide-react';

export default function MoveLogsPanel({
  allEvents = [],
  currentIndex = -1,
  onSelectStep,
  runStats = null,
  isSolving = false
}) {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'GOOD' | 'BAD'
  const logContainerRef = useRef(null);
  const activeItemRef = useRef(null);

  // Categorize events
  const categorizedEvents = allEvents.map((ev, idx) => {
    const type = ev.event_type;
    const isGood = type === 'USER_MOVE' || type === 'MOVE_VALIDATED' || type === 'SOLUTION_FOUND';
    const isBad = type === 'CONFLICT_DETECTED' || type === 'DEAD_END' || type === 'BACKTRACK_STARTED' || type === 'SEARCH_EXHAUSTED';
    return {
      ...ev,
      originalIndex: idx,
      category: isGood ? 'GOOD' : isBad ? 'BAD' : 'INFO'
    };
  });

  const goodEvents = categorizedEvents.filter((e) => e.category === 'GOOD');
  const badEvents = categorizedEvents.filter((e) => e.category === 'BAD');

  const visibleEvents = activeTab === 'GOOD' 
    ? goodEvents 
    : activeTab === 'BAD' 
    ? badEvents 
    : categorizedEvents.filter(e => e.category !== 'INFO');

  // Auto scroll to active step when it changes
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentIndex]);

  const currentEvent = currentIndex >= 0 ? allEvents[currentIndex] : null;

  return (
    <div className="glass-card" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxHeight: '490px',
      padding: '1rem',
      gap: '0.75rem',
      borderRadius: '14px'
    }}>
      {/* Header & Move Counters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Activity size={16} color="#38bdf8" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>Move Logs</h3>
          </div>
          {/* Compact Total Moves Counter */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            fontSize: '0.72rem',
            color: '#38bdf8',
            fontFamily: 'var(--font-mono)'
          }}>
            <span>Total Moves:</span>
            <strong style={{ fontSize: '0.85rem', color: '#ffffff' }}>
              {runStats?.total_moves ?? (goodEvents.length + badEvents.length)}
            </strong>
          </div>
        </div>

        {/* Compact Summary Pills */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.4rem',
          fontSize: '0.72rem'
        }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '0.35rem 0.6rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#6ee7b7'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <CheckCircle2 size={13} color="#10b981" /> Good Moves
            </span>
            <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#ffffff' }}>
              {goodEvents.length}
            </strong>
          </div>

          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '0.35rem 0.6rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fca5a5'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <XCircle size={13} color="#ef4444" /> Bad Moves
            </span>
            <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#ffffff' }}>
              {badEvents.length}
            </strong>
          </div>
        </div>

        {/* Good vs Bad Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.35rem',
          background: 'rgba(8, 12, 22, 0.7)',
          padding: '0.25rem',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setActiveTab('ALL')}
            style={{
              padding: '0.4rem 0.5rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: activeTab === 'ALL' ? 700 : 500,
              background: activeTab === 'ALL' ? 'rgba(99, 102, 241, 0.35)' : 'transparent',
              color: activeTab === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            <span>All Moves</span>
            <span style={{
              fontSize: '0.65rem',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '0.1rem 0.35rem',
              borderRadius: '9999px'
            }}>
              {goodEvents.length + badEvents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('GOOD')}
            style={{
              padding: '0.4rem 0.5rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: activeTab === 'GOOD' ? 700 : 500,
              background: activeTab === 'GOOD' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
              color: activeTab === 'GOOD' ? '#34d399' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            <CheckCircle2 size={13} color="#10b981" />
            <span>Good Moves</span>
            <span style={{
              fontSize: '0.65rem',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#6ee7b7',
              padding: '0.1rem 0.35rem',
              borderRadius: '9999px'
            }}>
              {goodEvents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('BAD')}
            style={{
              padding: '0.4rem 0.5rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: activeTab === 'BAD' ? 700 : 500,
              background: activeTab === 'BAD' ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
              color: activeTab === 'BAD' ? '#f87171' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            <XCircle size={13} color="#ef4444" />
            <span>Bad Moves</span>
            <span style={{
              fontSize: '0.65rem',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
              padding: '0.1rem 0.35rem',
              borderRadius: '9999px'
            }}>
              {badEvents.length}
            </span>
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div 
        ref={logContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          paddingRight: '0.35rem'
        }}
      >
        {visibleEvents.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted)',
            textAlign: 'center',
            gap: '0.5rem',
            padding: '2rem 1rem'
          }}>
            <HelpCircle size={28} color="#64748b" />
            <p style={{ fontSize: '0.85rem' }}>
              {allEvents.length === 0 
                ? "No moves recorded yet. Click a square or click Auto-Solve to begin."
                : `No ${activeTab.toLowerCase()} moves found in this run.`}
            </p>
          </div>
        ) : (
          visibleEvents.map((ev) => {
            const isSelected = ev.originalIndex === currentIndex;
            const type = ev.event_type;
            const data = ev.data || {};
            const isGood = ev.category === 'GOOD';

            // Visual configuration per event type
            let badgeColor = 'rgba(99, 102, 241, 0.2)';
            let borderColor = 'rgba(255, 255, 255, 0.08)';
            let title = 'Step';
            let Icon = ArrowRight;
            let titleColor = '#ffffff';

            if (type === 'USER_MOVE') {
              badgeColor = 'rgba(245, 158, 11, 0.2)';
              borderColor = 'rgba(245, 158, 11, 0.4)';
              title = 'User Queen Placement';
              titleColor = '#fbbf24';
              Icon = Sparkles;
            } else if (type === 'MOVE_VALIDATED') {
              badgeColor = 'rgba(16, 185, 129, 0.15)';
              borderColor = 'rgba(16, 185, 129, 0.35)';
              title = 'Good Move: Queen Placed';
              titleColor = '#34d399';
              Icon = CheckCircle2;
            } else if (type === 'SOLUTION_FOUND') {
              badgeColor = 'rgba(16, 185, 129, 0.3)';
              borderColor = '#10b981';
              title = 'Goal Reached: Solution Found 🎉';
              titleColor = '#6ee7b7';
              Icon = Sparkles;
            } else if (type === 'CONFLICT_DETECTED') {
              badgeColor = 'rgba(239, 68, 68, 0.15)';
              borderColor = 'rgba(239, 68, 68, 0.4)';
              title = 'Bad Move: Conflict Rejected ✗';
              titleColor = '#f87171';
              Icon = XCircle;
            } else if (type === 'DEAD_END') {
              badgeColor = 'rgba(239, 68, 68, 0.15)';
              borderColor = 'rgba(245, 158, 11, 0.35)';
              title = 'Bad Move: Dead End Encountered ⚠';
              titleColor = '#fbbf24';
              Icon = AlertTriangle;
            } else if (type === 'BACKTRACK_STARTED') {
              badgeColor = 'rgba(245, 158, 11, 0.12)';
              borderColor = 'rgba(245, 158, 11, 0.3)';
              title = 'Search Recovery: Backtrack ↩';
              titleColor = '#fbbf24';
              Icon = RotateCcw;
            } else if (type === 'SEARCH_EXHAUSTED') {
              badgeColor = 'rgba(239, 68, 68, 0.2)';
              borderColor = '#ef4444';
              title = 'Search Exhausted (No Solution)';
              titleColor = '#ef4444';
              Icon = ShieldAlert;
            }

            return (
              <div
                key={ev.originalIndex}
                ref={isSelected ? activeItemRef : null}
                onClick={() => onSelectStep(ev.originalIndex)}
                style={{
                  padding: '0.75rem 0.85rem',
                  borderRadius: '10px',
                  background: isSelected 
                    ? 'rgba(30, 41, 59, 0.9)' 
                    : 'rgba(15, 23, 42, 0.5)',
                  border: isSelected 
                    ? `2px solid ${isGood ? '#10b981' : '#ef4444'}` 
                    : `1px solid ${borderColor}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected 
                    ? `0 0 16px ${isGood ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` 
                    : 'none'
                }}
              >
                {/* Row 1: Step & Type */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Icon size={14} color={titleColor} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: titleColor }}>
                      {title}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px'
                  }}>
                    Step #{ev.step_index}
                  </span>
                </div>

                {/* Row 2: Coordinates & Confidence */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.35rem'
                }}>
                  {data.position && (
                    <span>
                      Target: <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>Row {data.position[0] + 1}, Col {data.position[1] + 1}</strong>
                    </span>
                  )}
                  {data.rejected_position && (
                    <span>
                      Attempted: <strong style={{ color: '#fca5a5', fontFamily: 'var(--font-mono)' }}>Row {data.rejected_position[0] + 1}, Col {data.rejected_position[1] + 1}</strong>
                    </span>
                  )}
                  {data.removed_queen && (
                    <span>
                      Removed: <strong style={{ color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>Row {data.removed_queen[0] + 1}, Col {data.removed_queen[1] + 1}</strong>
                    </span>
                  )}
                  {data.confidence !== undefined && (
                    <span>
                      AI Confidence: <strong style={{ color: isGood ? '#38bdf8' : '#f87171', fontFamily: 'var(--font-mono)' }}>{data.confidence}%</strong>
                    </span>
                  )}
                  {data.confidence_was !== undefined && (
                    <span>
                      AI Confidence: <strong style={{ color: '#f87171', fontFamily: 'var(--font-mono)' }}>{data.confidence_was}%</strong>
                    </span>
                  )}
                </div>

                {/* Row 3: Description / Conflict details */}
                <p style={{
                  fontSize: '0.73rem',
                  lineHeight: 1.4,
                  margin: 0,
                  color: isGood ? '#94a3b8' : '#fca5a5'
                }}>
                  {data.reason || data.explanation || data.description || data.message || ""}
                </p>

                {/* If conflict, display conflict tag */}
                {data.conflict_type && (
                  <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      background: 'rgba(239, 68, 68, 0.25)',
                      color: '#fca5a5',
                      fontWeight: 600,
                      letterSpacing: '0.04em'
                    }}>
                      {data.conflict_type.replace('_', ' ')} ATTACK
                    </span>
                    {data.conflicting_queen && (
                      <span style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>
                        vs Queen at ({data.conflicting_queen[0] + 1}, {data.conflicting_queen[1] + 1})
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer live hint */}
      <div style={{
        paddingTop: '0.5rem',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>💡 Click any move above to jump the board to that step</span>
        {currentEvent && (
          <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            Viewing #{currentIndex + 1} / {allEvents.length}
          </span>
        )}
      </div>
    </div>
  );
}
