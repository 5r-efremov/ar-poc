import type { VideoState } from '../video/VideoManager';

interface Props {
  state: VideoState;
  schemeName: string | null;
  onToggle: () => void;
  onReplay: () => void;
}

export function VideoControls({ state, schemeName, onToggle, onReplay }: Props) {
  if (state === 'loading') {
    return <div className="hud bottom"><span className="pill">Loading animation…</span></div>;
  }
  if (state === 'error') {
    return <div className="hud bottom"><span className="pill error">Animation could not be loaded.</span></div>;
  }
  return (
    <div className="hud bottom">
      {schemeName && <span className="pill ok">{schemeName}</span>}
      <button className="btn secondary" onClick={onToggle}>{state === 'playing' ? 'Pause' : 'Play'}</button>
      <button className="btn secondary" onClick={onReplay}>Replay</button>
    </div>
  );
}
