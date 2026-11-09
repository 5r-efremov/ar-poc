import type { OverlayMode } from '../ar/VideoOverlay';

interface Props {
  tracking: boolean;
  mode: OverlayMode;
  onToggleMode: () => void;
  onStop: () => void;
}

export function ScannerControls({ tracking, mode, onToggleMode, onStop }: Props) {
  return (
    <>
      <div className="hud top">
        <button className="btn secondary" onClick={onStop}>Close</button>
        <span className={tracking ? 'pill ok' : 'pill'}>
          {tracking ? 'Scheme recognised' : (<><span className="dot" />Scanning</>)}
        </span>
        {/* PoC-only switch: compare opaque vs white-keyed rendering on a real print. */}
        <button className="btn secondary" onClick={onToggleMode}>{mode === 'opaque' ? 'Opaque' : 'Keyed'}</button>
      </div>
      {!tracking && (
        <div className="hint pill">Point your camera at a registered pneumatic diagram.</div>
      )}
    </>
  );
}
