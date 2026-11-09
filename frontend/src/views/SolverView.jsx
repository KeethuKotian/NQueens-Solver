import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import Chessboard from '../components/Chessboard';
import AIActivityPanel from '../components/AIActivityPanel';
import Controls from '../components/Controls';
import StatsBar from '../components/StatsBar';
import ConflictExplainer from '../components/ConflictExplainer';

export default function SolverView() {
  const [n, setN] = useState(8);
  const [modelType, setModelType] = useState('supervised');
  const [speed, setSpeed] = useState('normal');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Solving State
  const [isUserTurn, setIsUserTurn] = useState(true);
  const [isSolving, setIsSolving] = useState(false);
  const [events, setEvents] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(-1);
  const [runStats, setRunStats] = useState(null);
  const [boardQueens, setBoardQueens] = useState([]);
  const [heatmap, setHeatmap] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const timerRef = useRef(null);

  // Speed delay mapping
  const speedDelays = {
    slow: 800,
    normal: 350,
    fast: 120,
    instant: 0
  };

  // Reset board state when N changes or user clicks reset
  const handleReset = () => {
    setIsPlaying(false);
    clearTimeout(timerRef.current);
    setIsUserTurn(true);
    setIsSolving(false);
    setEvents([]);
    setCurrentEventIndex(-1);
    setRunStats(null);
    setBoardQueens([]);
    setHeatmap(null);
    setErrorMsg(null);
  };

  useEffect(() => {
    handleReset();
  }, [n, modelType]);

  // Handle User Click on Empty Board (First Move)
  const handleCellClick = async (row, col) => {
    if (!isUserTurn) return;

    setIsUserTurn(false);
    setIsSolving(true);
    setErrorMsg(null);

    // Initial placed queen by user
    setBoardQueens([[row, col]]);

    try {
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          n,
          initial_row: row,
          initial_col: col,
          model_type: modelType,
          temperature: 0.85,
          max_steps: 400
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setEvents(data.events || []);
      setRunStats(data);
      setCurrentEventIndex(0); // Start at first event (user placement)
      setIsPlaying(true);      // Begin animated solving!

    } catch (err) {
      console.error("Solving error:", err);
      setErrorMsg(`Failed to solve: ${err.message}. Make sure the FastAPI backend is running.`);
      setIsSolving(false);
      setIsUserTurn(true);
    }
  };

  // Playback Step Processor
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

  const stepBackward = () => {
    setIsPlaying(false);
    setCurrentEventIndex((prev) => Math.max(0, prev - 1));
  };

  // When currentEventIndex updates, update the board state and trigger effects
  useEffect(() => {
    if (currentEventIndex < 0 || currentEventIndex >= events.length) return;

    const ev = events[currentEventIndex];
    if (ev) {
      setBoardQueens(ev.board_state || []);

      // If solution found, trigger confetti celebration
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
      // Instant mode: Jump directly to the end!
      setCurrentEventIndex(events.length - 1);
      setIsPlaying(false);
    } else {
      timerRef.current = setTimeout(() => {
        advanceStep();
      }, delay);
    }

    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentEventIndex, events, speed]);

  // Fetch Position Heatmap when requested
  useEffect(() => {
    if (!showHeatmap) return;

    const fetchHeatmap = async () => {
      try {
        const res = await fetch('/api/evaluate-position', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            n,
            queens: boardQueens,
            model_type: modelType
          })
        });
        if (res.ok) {
          const data = await res.json();
          setHeatmap(data.heatmap);
        }
      } catch (e) {
        console.warn("Could not evaluate heatmap:", e);
      }
    };

    fetchHeatmap();
  }, [showHeatmap, boardQueens, n, modelType]);

  const currentEvent = currentEventIndex >= 0 ? events[currentEventIndex] : null;
  const isSolved = currentEvent?.event_type === 'SOLUTION_FOUND';
  const isExhausted = currentEvent?.event_type === 'SEARCH_EXHAUSTED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Controls Bar */}
      <Controls
        n={n}
        setN={setN}
        modelType={modelType}
        setModelType={setModelType}
        speed={speed}
        setSpeed={setSpeed}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        onStepForward={advanceStep}
        onStepBackward={stepBackward}
        onReset={handleReset}
        showHeatmap={showHeatmap}
        setShowHeatmap={setShowHeatmap}
        canStepForward={currentEventIndex < events.length - 1}
        canStepBackward={currentEventIndex > 0}
        isSolving={isSolving && isPlaying}
      />

      {/* Error Message banner */}
      {errorMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          fontSize: '0.85rem'
        }}>
          {errorMsg}
        </div>
      )}

      {/* Main Solver Workspace: Chessboard (Left) + AI Activity Panel (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) minmax(340px, 460px)',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        
        {/* Left: Chessboard & Conflict Explainer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Chessboard
            n={n}
            queens={boardQueens}
            onCellClick={handleCellClick}
            isUserTurn={isUserTurn}
            currentEvent={currentEvent}
            heatmap={heatmap}
            showHeatmap={showHeatmap}
          />

          {/* Conflict Explainer Card (Appears whenever AI makes an invalid move) */}
          <div style={{ width: '100%', maxWidth: '540px' }}>
            <ConflictExplainer currentEvent={currentEvent} />
          </div>
        </div>

        {/* Right: AI Activity & Reasoning Panel */}
        <div style={{ height: '100%' }}>
          <AIActivityPanel
            currentEvent={currentEvent}
            allEvents={events}
            currentIndex={currentEventIndex}
            onSelectEvent={(idx) => {
              setIsPlaying(false);
              setCurrentEventIndex(idx - 1);
            }}
            isSolving={isPlaying}
          />
        </div>
      </div>

      {/* Bottom Live Performance Statistics */}
      <StatsBar
        stats={runStats}
        n={n}
        isSolved={isSolved}
        isExhausted={isExhausted}
      />
    </div>
  );
}
