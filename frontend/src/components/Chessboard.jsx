import React, { useRef, useEffect } from 'react';
import { Crown, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';

export default function Chessboard({
  n,
  queens,
  onCellClick,
  isUserTurn,
  currentEvent,
  heatmap,
  showHeatmap
}) {
  const boardRef = useRef(null);

  // Extract event details
  const eventType = currentEvent?.event_type;
  const eventData = currentEvent?.data || {};

  // Positions of interest in current step
  const predictedPos = (eventType === 'MOVE_PREDICTED' || eventType === 'ALTERNATIVE_SELECTED') 
    ? eventData.position : null;
  const rejectedPos = eventType === 'CONFLICT_DETECTED' 
    ? eventData.rejected_position : null;
  const conflictingQueen = eventType === 'CONFLICT_DETECTED' 
    ? eventData.conflicting_queen : null;
  const deadEndPos = eventType === 'DEAD_END'
    ? eventData.position : null;
  const backtrackedQueen = eventType === 'BACKTRACK_STARTED' 
    ? eventData.removed_queen : null;
  const isSolved = eventType === 'SOLUTION_FOUND';

  // Calculate cell sizes based on N so board is 100% visible
  const maxBoardPx = 400;
  const cellSize = Math.floor(maxBoardPx / n);

  // Coordinates helper
  const isQueenAt = (r, c) => queens.some(([qr, qc]) => qr === r && qc === c);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      {/* Board Container */}
      <div 
        ref={boardRef}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${n}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${n}, ${cellSize}px)`,
          border: '2px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: isSolved 
            ? '0 0 50px rgba(16, 185, 129, 0.45)' 
            : rejectedPos 
            ? '0 0 40px rgba(239, 68, 68, 0.35)' 
            : '0 12px 40px rgba(0, 0, 0, 0.6)',
          position: 'relative',
          transition: 'box-shadow 0.3s ease',
          backgroundColor: '#0b1120'
        }}
      >
        {Array.from({ length: n }).map((_, r) =>
          Array.from({ length: n }).map((_, c) => {
            const isDark = (r + c) % 2 === 1;
            const hasQueen = isQueenAt(r, c);
            const isPredicted = predictedPos && predictedPos[0] === r && predictedPos[1] === c;
            const isRejected = rejectedPos && rejectedPos[0] === r && rejectedPos[1] === c;
            const isAttacking = conflictingQueen && conflictingQueen[0] === r && conflictingQueen[1] === c;
            const isBacktrackCell = backtrackedQueen && backtrackedQueen[0] === r && backtrackedQueen[1] === c;
            const isDeadEnd = deadEndPos && deadEndPos[0] === r && deadEndPos[1] === c;

            // Heatmap probability
            const heatVal = heatmap && heatmap[r] ? heatmap[r][c] : 0;

            // Background color computation
            let bg = isDark ? '#141c2e' : '#1e293b';

            if (showHeatmap && heatVal > 0) {
              const alpha = Math.min(0.7, heatVal / 60);
              bg = `rgba(6, 182, 212, ${alpha})`;
            }

            if (hasQueen) {
              bg = isSolved ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.18)';
            }
            if (isPredicted) bg = 'rgba(99, 102, 241, 0.35)';
            if (isRejected) bg = 'rgba(239, 68, 68, 0.4)';
            if (isAttacking) bg = 'rgba(239, 68, 68, 0.3)';

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => isUserTurn && onCellClick(r, c)}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  backgroundColor: bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  cursor: isUserTurn ? 'pointer' : 'default',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: isAttacking 
                    ? '2px solid #ef4444' 
                    : isRejected 
                    ? '2px dashed #f87171' 
                    : isPredicted 
                    ? '2px solid #38bdf8' 
                    : '1px solid rgba(255, 255, 255, 0.03)',
                  boxShadow: isAttacking ? 'inset 0 0 16px rgba(239, 68, 68, 0.6)' : 'none'
                }}
                className={
                  isRejected ? 'anim-conflict' :
                  isSolved && hasQueen ? 'anim-victory' :
                  ''
                }
              >
                {/* Cell Coordinate Label (corner) */}
                {r === n - 1 && (
                  <span style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 4,
                    fontSize: '9px',
                    color: 'rgba(255, 255, 255, 0.25)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {String.fromCharCode(97 + c)}
                  </span>
                )}
                {c === 0 && (
                  <span style={{
                    position: 'absolute',
                    top: 2,
                    left: 4,
                    fontSize: '9px',
                    color: 'rgba(255, 255, 255, 0.25)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {n - r}
                  </span>
                )}

                {/* Heatmap Probability Badge */}
                {showHeatmap && heatVal > 1.0 && !hasQueen && (
                  <span style={{
                    fontSize: `${Math.max(8, cellSize * 0.22)}px`,
                    color: heatVal > 15 ? '#67e8f9' : 'rgba(255, 255, 255, 0.4)',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {heatVal.toFixed(0)}%
                  </span>
                )}

                {/* Placed Queen */}
                {hasQueen && (
                  <div className="anim-queen-drop" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10
                  }}>
                    <Crown 
                      size={Math.max(18, cellSize * 0.58)} 
                      color={isSolved ? '#34d399' : '#fbbf24'} 
                      fill={isSolved ? 'rgba(52, 211, 153, 0.4)' : 'rgba(251, 191, 36, 0.4)'}
                      style={{
                        filter: isSolved 
                          ? 'drop-shadow(0 0 10px rgba(52, 211, 153, 0.8))' 
                          : 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.7))'
                      }}
                    />
                  </div>
                )}

                {/* AI Predicted Candidate (Ghost) */}
                {isPredicted && !hasQueen && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pulse-glow 1.5s infinite ease-in-out'
                  }}>
                    <Crown 
                      size={Math.max(16, cellSize * 0.48)} 
                      color="#38bdf8" 
                      style={{ opacity: 0.8, filter: 'drop-shadow(0 0 8px #0284c7)' }}
                    />
                  </div>
                )}

                {/* Rejected Candidate with Red Cross */}
                {isRejected && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <XCircle 
                      size={Math.max(18, cellSize * 0.55)} 
                      color="#ef4444" 
                      style={{ filter: 'drop-shadow(0 0 10px #ef4444)' }}
                    />
                  </div>
                )}

                {/* Attacking Queen Warning Indicator */}
                {isAttacking && (
                  <div style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: '#ef4444',
                    borderRadius: '50%',
                    padding: '2px',
                    display: 'flex',
                    boxShadow: '0 0 8px #ef4444',
                    zIndex: 20
                  }}>
                    <AlertTriangle size={12} color="#ffffff" />
                  </div>
                )}

                {/* Backtrack Ghost Ripple */}
                {isBacktrackCell && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    border: '2px solid #f97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.25)',
                    animation: 'backtrack-vanish 0.6s ease-out forwards'
                  }} />
                )}

                {/* User Turn Hover Invitation */}
                {isUserTurn && !hasQueen && (
                  <div 
                    className="hover-invite"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(99, 102, 241, 0.15)',
                      transition: 'opacity 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                  >
                    <Crown size={cellSize * 0.35} color="rgba(255, 255, 255, 0.5)" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* SVG Attack Vector Line Overlay */}
        {rejectedPos && conflictingQueen && (
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 30
            }}
          >
            <defs>
              <linearGradient id="attackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#f87171" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <line
              x1={(conflictingQueen[1] + 0.5) * cellSize}
              y1={(conflictingQueen[0] + 0.5) * cellSize}
              x2={(rejectedPos[1] + 0.5) * cellSize}
              y2={(rejectedPos[0] + 0.5) * cellSize}
              stroke="url(#attackGrad)"
              strokeWidth="3.5"
              strokeDasharray="6,4"
              style={{ filter: 'drop-shadow(0 0 6px #ef4444)' }}
            />
            {/* Circle on conflicting queen */}
            <circle
              cx={(conflictingQueen[1] + 0.5) * cellSize}
              cy={(conflictingQueen[0] + 0.5) * cellSize}
              r={cellSize * 0.3}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              style={{ filter: 'drop-shadow(0 0 8px #ef4444)' }}
            />
          </svg>
        )}
      </div>

      {/* User Turn Prompt Banner */}
      {isUserTurn && (
        <div style={{
          marginTop: '1rem',
          padding: '0.65rem 1.25rem',
          borderRadius: '12px',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.875rem',
          color: '#e0e7ff',
          animation: 'pulse-glow 2s infinite'
        }}>
          <Crown size={18} color="#fbbf24" />
          <span><strong>Human Interaction Required:</strong> Click any cell to place the 1st Queen. The Deep Learning model will take over immediately.</span>
        </div>
      )}
    </div>
  );
}
