import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import Controls from './components/Controls';
import Chessboard from './components/Chessboard';
import MoveLogsPanel from './components/MoveLogsPanel';
import ConflictExplainer from './components/ConflictExplainer';

export default function App() {
  const [n, setN] = useState(8);
  const [modelType, setModelType] = useState('supervised');
  const [speed, setSpeed] = useState('normal');
  const [isPlaying, setIsPlaying] = useState(false);

  // Solving & playback states
  const [isUserTurn, setIsUserTurn] = useState(true);
  const [isSolving, setIsSolving] = useState(false);
  const [events, setEvents] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(-1);
  const [runStats, setRunStats] = useState(null);
  const [boardQueens, setBoardQueens] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  const timerRef = useRef(null);

  // Speed delay mapping
  const speedDelays = {
    slow: 800,
    normal: 350,
    fast: 120,
    instant: 0
  };

  // Reset board
  const handleReset = () => {
    setIsPlaying(false);
    clearTimeout(timerRef.current);
    setIsUserTurn(true);
    setIsSolving(false);
    setEvents([]);
    setCurrentEventIndex(-1);
    setRunStats(null);
    setBoardQueens([]);
    setErrorMsg(null);
  };

  useEffect(() => {
    handleReset();
  }, [n, modelType]);

  // Primary Solver Invocation
  const triggerSolve = async (initialRow = null, initialCol = null) => {
    setIsUserTurn(false);
    setIsSolving(true);
    setErrorMsg(null);

    if (initialRow !== null && initialCol !== null) {
      setBoardQueens([[initialRow, initialCol]]);
    }

    try {
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          n,
          initial_row: initialRow,
          initial_col: initialCol,
          model_type: modelType,
          temperature: 0.8,
          max_steps: 1200
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setEvents(data.events || []);
      setRunStats(data);
      setCurrentEventIndex(0);
      setIsPlaying(true);
    } catch (err) {
      console.error("Solving error:", err);
      setErrorMsg(`Failed to solve: ${err.message}. Make sure the FastAPI backend is running.`);
      setIsSolving(false);
      setIsUserTurn(true);
    }
  };

  // Handle cell click on empty board
  const handleCellClick = (row, col) => {
    if (!isUserTurn) return;
    triggerSolve(row, col);
  };

  // Handle Auto Solve button
  const handleAutoSolve = () => {
    if (isSolving) return;
    handleReset();
    const r = Math.floor(Math.random() * n);
    const c = Math.floor(Math.random() * n);
    triggerSolve(r, c);
  };

  // Step Advance
  const advanceStep = () => {
    setCurrentEventIndex((prev) => {
      const next = prev + 1;
      if (next >= events.length) {
        setIsPlaying(false);
        return prev;
      }
      return next;
    });
  };

  // Update board when currentEventIndex changes
  useEffect(() => {
    if (currentEventIndex < 0 || currentEventIndex >= events.length) return;

    const ev = events[currentEventIndex];
    if (ev) {
      setBoardQueens(ev.board_state || []);

      if (ev.event_type === 'SOLUTION_FOUND') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#6366f1', '#f59e0b', '#06b6d4']
        });
      }
    }
  }, [currentEventIndex, events]);

  // Autoplay loop
  useEffect(() => {
    if (!isPlaying) {
      clearTimeout(timerRef.current);
      return;
    }

    if (currentEventIndex >= events.length - 1) {
      setIsPlaying(false);
      return;
    }

    const delay = speedDelays[speed];
    if (delay === 0) {
      setCurrentEventIndex(events.length - 1);
      setIsPlaying(false);
    } else {
      timerRef.current = setTimeout(() => {
        advanceStep();
      }, delay);
    }

    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentEventIndex, events, speed]);

  const currentEvent = currentEventIndex >= 0 ? events[currentEventIndex] : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#080c16' }}>
      {/* Navbar with only the name */}
      <Header />

      {/* Main Single-Page Workspace */}
      <main style={{
        flex: 1,
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {/* Error Banner if any */}
        {errorMsg && (
          <div style={{
            padding: '0.6rem 0.9rem',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '0.8rem'
          }}>
            {errorMsg}
          </div>
        )}

        {/* Unified 2-Column Layout: Left (Board & Controls) | Right (Good & Bad Move Logs) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 440px) minmax(320px, 1fr)',
          gap: '1rem',
          alignItems: 'start',
          justifyContent: 'center'
        }}>
          {/* Left Column: Controls + Completely Visible Chessboard */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <Controls
              n={n}
              setN={setN}
              modelType={modelType}
              setModelType={setModelType}
              speed={speed}
              setSpeed={setSpeed}
              onReset={handleReset}
              onAutoSolve={handleAutoSolve}
              isSolving={isPlaying}
            />

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '0.85rem',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle)'
            }}>
              <Chessboard
                n={n}
                queens={boardQueens}
                onCellClick={handleCellClick}
                isUserTurn={isUserTurn}
                currentEvent={currentEvent}
              />

              {isUserTurn && (
                <p style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.5rem',
                  marginBottom: 0,
                  textAlign: 'center'
                }}>
                  👉 <strong>Click any cell</strong> to place the first queen, or click <strong>Auto Solve</strong>.
                </p>
              )}
            </div>

            {/* Geometric Conflict Explainer */}
            <ConflictExplainer currentEvent={currentEvent} />
          </div>

          {/* Right Column: Dedicated Good & Bad Move Logs */}
          <div style={{ height: '100%' }}>
            <MoveLogsPanel
              allEvents={events}
              currentIndex={currentEventIndex}
              onSelectStep={(idx) => {
                setIsPlaying(false);
                setCurrentEventIndex(idx);
              }}
              runStats={runStats}
              isSolving={isPlaying}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
