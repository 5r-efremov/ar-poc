import { useCallback, useEffect, useState } from 'react';
import { Scanner } from './components/Scanner';
import { ErrorMessage } from './components/ErrorMessage';
import type { SchemeConfig } from './data/SchemeTypes';

/**
 * Loads /schemes.json (generated at build time from the files in public/images
 * and public/videos by scripts/build-targets.mjs) and starts the scanner.
 */
export default function App() {
  const [config, setConfig] = useState<SchemeConfig | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    fetch('/schemes.json', { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<SchemeConfig>;
      })
      .then(setConfig)
      .catch(() => setError(true));
  }, []);

  useEffect(load, [load]);

  if (error) {
    return (
      <ErrorMessage
        title="Could not load the scheme list"
        detail="Check your internet connection and try again."
        onRetry={load}
      />
    );
  }
  if (!config) {
    return <div className="screen"><p>Loading…</p></div>;
  }
  return <Scanner config={config} />;
}
