import { useCallback, useEffect, useRef, useState } from 'react';
import type { SchemeConfig } from '../data/SchemeTypes';
import { TargetManager } from '../ar/TargetManager';
import type { MindARController } from '../ar/MindARController';
import type { OverlayMode, VideoOverlay } from '../ar/VideoOverlay';
import { VideoManager, type VideoState } from '../video/VideoManager';
import { StartScreen } from './StartScreen';
import { ScannerControls } from './ScannerControls';
import { VideoControls } from './VideoControls';
import { ErrorMessage } from './ErrorMessage';

type Phase = 'idle' | 'starting' | 'scanning' | 'tracking' | 'error';
interface Failure { title: string; detail: string }

// Heavy AR code (TensorFlow, Three) is loaded lazily so the start screen appears fast.
const loadAR = () => Promise.all([import('../ar/MindARController'), import('../ar/VideoOverlay')]);

/** Top-level coordinator: wires tracking events to video + overlay. */
export function Scanner({ config }: { config: SchemeConfig }) {
  const targets = useRef(new TargetManager(config)).current;
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<MindARController | null>(null);
  const overlayRef = useRef<VideoOverlay | null>(null);
  const videoRef = useRef<VideoManager | null>(null);
  /** Incremented on every found/lost event so stale async work can bail out. */
  const token = useRef(0);

  const [phase, setPhase] = useState<Phase>('idle');
  const [failure, setFailure] = useState<Failure | null>(null);
  const [videoState, setVideoState] = useState<VideoState>('idle');
  const [schemeName, setSchemeName] = useState<string | null>(null);
  const [mode, setMode] = useState<OverlayMode>('opaque');

  useEffect(() => { void loadAR(); }, []); // warm the chunk cache while the user reads the start screen

  const teardown = useCallback(() => {
    token.current++;
    controllerRef.current?.stop();
    controllerRef.current = null;
    overlayRef.current?.dispose();
    overlayRef.current = null;
    videoRef.current?.dispose();
    videoRef.current = null;
    containerRef.current?.replaceChildren(); // remove MindAR's canvas + camera <video>
  }, []);

  useEffect(() => teardown, [teardown]);

  const fail = useCallback((title: string, detail: string) => {
    teardown();
    setFailure({ title, detail });
    setPhase('error');
  }, [teardown]);

  const handleFound = useCallback(async (idx: number, group: import('three').Group) => {
    const scheme = targets.get(idx);
    const vm = videoRef.current;
    const overlay = overlayRef.current;
    if (!scheme || !vm || !overlay) return;
    const my = ++token.current;
    setPhase('tracking');
    setSchemeName(scheme.name);
    try {
      await vm.load(scheme.video);
    } catch {
      return; // VideoManager already reported 'error' state
    }
    if (my !== token.current) return; // target lost or changed while loading
    overlay.attach(group, scheme);
    if (config.onReacquire === 'restart') vm.element.currentTime = 0;
    if (!vm.userPaused) await vm.play();
  }, [targets, config.onReacquire]);

  const handleLost = useCallback(() => {
    token.current++;
    overlayRef.current?.detach();
    videoRef.current?.pause(); // auto-pause; does not set userPaused
    setPhase('scanning');
  }, []);

  const start = useCallback(async () => {
    setFailure(null);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      return fail('Browser not supported', 'Camera access needs a modern browser and an HTTPS connection.');
    }
    setPhase('starting');

    // MindAR hangs forever if the .mind file is missing, so check it first.
    // (Vite's dev server answers missing files with index.html, hence the content-type check.)
    try {
      const res = await fetch(config.targetFile, { method: 'HEAD' });
      if (!res.ok || (res.headers.get('content-type') ?? '').includes('text/html')) throw new Error();
    } catch {
      return fail('Target file not found', `Could not load ${config.targetFile}. Compile your images into a .mind file and place it there.`);
    }

    const [{ MindARController }, { VideoOverlay }] = await loadAR();
    const vm = new VideoManager();
    vm.onStateChange = setVideoState;
    const overlay = new VideoOverlay(vm.element, mode);
    const controller = new MindARController(
      containerRef.current!,
      config.targetFile,
      targets.schemes.map((s) => s.targetIndex),
      { onFound: (i, g) => void handleFound(i, g), onLost: handleLost },
    );
    videoRef.current = vm;
    overlayRef.current = overlay;
    controllerRef.current = controller;

    try {
      await controller.start();
      setPhase('scanning');
    } catch {
      fail('Camera unavailable',
        'The camera could not be started. Allow camera access for this site in your browser settings, close other apps that use the camera, then try again.');
    }
  }, [config.targetFile, fail, handleFound, handleLost, mode, targets]);

  const toggleMode = () => {
    const next: OverlayMode = mode === 'opaque' ? 'keyed' : 'opaque';
    setMode(next);
    overlayRef.current?.setMode(next);
  };

  const stop = () => {
    teardown();
    setPhase('idle');
    setVideoState('idle');
  };

  const active = phase === 'scanning' || phase === 'tracking';
  return (
    <>
      {/* Always mounted and sized (MindAR measures it on start); the start/error screens cover it. */}
      <div ref={containerRef} className="ar-root" />
      {(phase === 'idle' || phase === 'starting') && <StartScreen onStart={() => void start()} busy={phase === 'starting'} />}
      {phase === 'error' && failure && <ErrorMessage {...failure} onRetry={() => setPhase('idle')} />}
      {active && (
        <>
          <ScannerControls tracking={phase === 'tracking'} mode={mode} onToggleMode={toggleMode} onStop={stop} />
          {phase === 'tracking' && (
            <VideoControls
              state={videoState}
              schemeName={schemeName}
              onToggle={() => videoRef.current?.userTogglePlay()}
              onReplay={() => videoRef.current?.replay()}
            />
          )}
        </>
      )}
    </>
  );
}
