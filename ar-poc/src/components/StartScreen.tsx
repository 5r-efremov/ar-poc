interface Props {
  onStart: () => void;
  busy: boolean;
}

export function StartScreen({ onStart, busy }: Props) {
  return (
    <div className="screen">
      <h1>Pneumatic AR</h1>
      <p>Bring printed pneumatic and electropneumatic schemes to life.</p>
      <ol>
        <li>Allow camera access.</li>
        <li>Point the camera at a printed scheme.</li>
        <li>Hold steady until the animation appears on the page.</li>
      </ol>
      <button className="btn" onClick={onStart} disabled={busy}>
        {busy ? 'Starting camera…' : 'Start Scanning'}
      </button>
    </div>
  );
}
