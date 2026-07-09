'use client';

const SPEED_LABELS = { 1: '0.5×', 2: '1×', 3: '2×', 4: '3×' };

export default function VisualizerControls({
  isPlaying, onPlayPause, onStepForward, onStepBackward,
  onReset, speed, onSpeedChange,
  currentStep, totalSteps,
  onRandomize, arraySize, onArraySizeChange,
  showArrayControls = true,
}) {
  return (
    <div style={{
      background: 'rgba(10,15,30,0.9)',
      border: '1px solid rgba(0,240,255,0.12)',
      borderRadius: 12,
      padding: '14px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {/* Playback row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Step back */}
        <button onClick={onStepBackward} title="Step Backward"
          style={btnStyle('#5a7a9a')}>
          ⏮
        </button>
        {/* Play/Pause */}
        <button onClick={onPlayPause}
          style={{
            ...btnStyle('#00f0ff'),
            background: 'rgba(0,240,255,0.12)',
            border: '1px solid rgba(0,240,255,0.35)',
            color: '#00f0ff',
            minWidth: 80,
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
          }}>
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        {/* Step fwd */}
        <button onClick={onStepForward} title="Step Forward"
          style={btnStyle('#5a7a9a')}>
          ⏭
        </button>
        {/* Reset */}
        <button onClick={onReset}
          style={{
            ...btnStyle('#ff2d78'),
            background: 'rgba(255,45,120,0.08)',
            border: '1px solid rgba(255,45,120,0.25)',
            color: '#ff2d78',
            fontFamily: 'var(--font-body)',
          }}>
          ↺ Reset
        </button>

        {/* Step counter */}
        {totalSteps > 0 && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: '#5a7a9a',
            marginLeft: 'auto',
          }}>
            Step <span style={{ color: '#00f0ff' }}>{currentStep}</span> / {totalSteps}
          </span>
        )}
      </div>

      {/* Speed + array controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {/* Speed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={labelStyle}>Speed</span>
          {[1, 2, 3, 4].map(s => (
            <button key={s} onClick={() => onSpeedChange(s)}
              style={{
                padding: '3px 10px',
                borderRadius: 6,
                border: speed === s ? '1px solid #00f0ff' : '1px solid rgba(0,240,255,0.15)',
                background: speed === s ? 'rgba(0,240,255,0.12)' : 'transparent',
                color: speed === s ? '#00f0ff' : '#5a7a9a',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
              {SPEED_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Array controls */}
        {showArrayControls && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={labelStyle}>Size</span>
              <input type="range" min={5} max={12} value={arraySize}
                onChange={e => onArraySizeChange(Number(e.target.value))}
                style={{ width: 80, accentColor: '#00f0ff', cursor: 'pointer' }} />
              <span style={{ ...labelStyle, color: '#00f0ff', minWidth: 14 }}>{arraySize}</span>
            </div>
            <button onClick={onRandomize}
              style={{
                ...btnStyle('#1D9E75'),
                background: 'rgba(29,158,117,0.1)',
                border: '1px solid rgba(29,158,117,0.25)',
                color: '#1D9E75',
                fontFamily: 'var(--font-body)',
                fontSize: 12,
              }}>
              🎲 Randomize
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const btnStyle = (color) => ({
  padding: '6px 14px',
  borderRadius: 8,
  border: `1px solid ${color}30`,
  background: 'transparent',
  color: color,
  fontSize: 13,
  cursor: 'pointer',
  transition: 'all 0.15s',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
});

const labelStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: '#5a7a9a',
  letterSpacing: 1,
  textTransform: 'uppercase',
};
