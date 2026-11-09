import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Cpu, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  FlaskConical,
  Award
} from 'lucide-react';

export default function BenchmarkView() {
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBenchmarks = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      const res = await fetch(`/api/benchmark?refresh=${refresh}`);
      if (res.ok) {
        const data = await res.json();
        setBenchmarkData(data);
      }
    } catch (e) {
      console.error("Benchmark fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBenchmarks(false);
  }, []);

  const scalingRows = benchmarkData?.exp1_scaling || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header & Controls */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FlaskConical size={22} color="#38bdf8" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                Scientific Benchmark Suite & Experiments
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Empirical evaluation comparing the Deep Learning FCN-PV Solver against Classical Backtracking.
            </p>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => fetchBenchmarks(true)}
            disabled={refreshing}
            style={{ fontSize: '0.825rem' }}
          >
            <RefreshCw size={14} className={refreshing ? 'anim-conflict' : ''} />
            {refreshing ? 'Executing Experiments...' : 'Re-run Benchmark'}
          </button>
        </div>
      </div>

      {/* Primary Comparison Table: Traditional vs DL */}
      <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <BarChart3 size={18} color="#6366f1" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff' }}>
            Experiment 1 & 4: DL-Guided Search vs Classical Backtracking
          </h3>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>
            Loading empirical benchmark data...
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Board Size (N)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Generalization State</th>
                <th style={{ padding: '0.75rem 1rem', color: '#38bdf8' }}>DL Success Rate</th>
                <th style={{ padding: '0.75rem 1rem', color: '#38bdf8' }}>DL Avg Moves</th>
                <th style={{ padding: '0.75rem 1rem', color: '#38bdf8' }}>DL Backtracks</th>
                <th style={{ padding: '0.75rem 1rem', color: '#38bdf8' }}>DL Solve Time</th>
                <th style={{ padding: '0.75rem 1rem', color: '#a5b4fc' }}>Trad. Nodes</th>
                <th style={{ padding: '0.75rem 1rem', color: '#a5b4fc' }}>Trad. Backtracks</th>
                <th style={{ padding: '0.75rem 1rem', color: '#a5b4fc' }}>Trad. Time</th>
              </tr>
            </thead>
            <tbody>
              {scalingRows.map((row) => (
                <tr 
                  key={row.n}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    background: row.is_unseen_size ? 'rgba(245, 158, 11, 0.04)' : 'transparent'
                  }}
                >
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    N = {row.n}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {row.is_unseen_size ? (
                      <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>
                        Unseen (Zero-Shot)
                      </span>
                    ) : (
                      <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                        Trained Range
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                    {row.dl.success_rate}%
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>
                    {row.dl.avg_moves}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', color: row.dl.avg_backtracks > 5 ? '#f59e0b' : 'inherit' }}>
                    {row.dl.avg_backtracks}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>
                    {row.dl.avg_time_ms} ms
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>
                    {row.traditional.avg_nodes}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>
                    {row.traditional.avg_backtracks}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>
                    {row.traditional.avg_time_ms} ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Scientific Honesty & Insights Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Research Finding 1 */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <Award size={18} color="#10b981" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff' }}>
              Where Deep Learning Outperforms
            </h4>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            On structured board sizes (e.g. $N=5, 7$), the trained neural policy learns direct valid trajectories requiring as few as <strong>4 to 6 moves</strong> with <strong>0 backtracks</strong>, navigating the search tree directly to a solution without brute-force exploration of all columns.
          </p>
        </div>

        {/* Research Finding 2 */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <Clock size={18} color="#f59e0b" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff' }}>
              Scientific Honesty on Wall-Clock Time
            </h4>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Classical backtracking executes lightweight bitwise/integer constraint checks taking microseconds per node. The Deep Learning model executes 2D convolutional forward passes with millions of multiply-accumulate operations per node. Therefore, classical backtracking remains faster in raw latency even when Deep Learning visits fewer candidate branches.
          </p>
        </div>

        {/* Research Finding 3 */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <Cpu size={18} color="#06b6d4" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff' }}>
              Cross-N Zero-Shot Generalization ($N \ge 9$)
            </h4>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Because our architecture uses a <strong>Fully Convolutional Network</strong> with spatial padding and global pooling, the weights trained strictly on $N \le 8$ can directly process $N=9$ and $N=10$ inputs. The spatial threat heuristics generalize partially, though combinatorial density increases backtracking.
          </p>
        </div>
      </div>
    </div>
  );
}
