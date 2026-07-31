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
      background: 'var(--gx-surface)',
      border: '1px solid var(--gx-border)',
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
          style={btnStyle('var(--gx-text-muted)')}>
          ⏮
        </button>
        {/* Play/Pause */}
        <button onClick={onPlayPause}
          style={{
            ...btnStyle('var(--gx-accent)'),
            background: 'var(--gx-accent-soft)',
            border: '1px solid var(--gx-accent-border)',
            color: 'var(--gx-accent)',
            minWidth: 80,
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
          }}>
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        {/* Step fwd */}
        <button onClick={onStepForward} title="Step Forward"
          style={btnStyle('var(--gx-text-muted)')}>
          ⏭
        </button>
        {/* Reset */}
        <button onClick={onReset}
          style={{
            ...btnStyle('var(--gx-danger)'),
            background: 'var(--gx-danger-soft)',
            border: '1px solid var(--gx-danger-border)',
            color: 'var(--gx-danger)',
            fontFamily: 'var(--font-body)',
          }}>
          ↺ Reset
        </button>

        {/* Step counter */}
        {totalSteps > 0 && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--gx-text-muted)',
            marginLeft: 'auto',
          }}>
            Step <span style={{ color: 'var(--gx-accent)' }}>{currentStep}</span> / {totalSteps}
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
                border: speed === s ? '1px solid var(--gx-accent)' : '1px solid var(--gx-border)',
                background: speed === s ? 'var(--gx-accent-soft)' : 'transparent',
                color: speed === s ? 'var(--gx-accent)' : 'var(--gx-text-muted)',
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
                style={{ width: 80, accentColor: 'var(--gx-accent)', cursor: 'pointer' }} />
              <span style={{ ...labelStyle, color: 'var(--gx-accent)', minWidth: 14 }}>{arraySize}</span>
            </div>
            <button onClick={onRandomize}
              style={{
                ...btnStyle('var(--gx-success)'),
                background: 'var(--gx-success-soft)',
                border: '1px solid var(--gx-success-border)',
                color: 'var(--gx-success)',
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
  border: `1px solid color-mix(in srgb, ${color} 19%, transparent)`,
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
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  color: 'var(--gx-text-muted)',
  letterSpacing: 1,
  textTransform: 'uppercase',
};
