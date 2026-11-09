export type VideoState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

/**
 * Owns ONE reusable <video> element. Reusing a single element means:
 *  - only one animation can ever play at a time,
 *  - iOS autoplay permission earned by the first user-initiated play carries over,
 *  - only the video for the currently detected target is ever downloaded.
 */
export class VideoManager {
  readonly element: HTMLVideoElement;
  private currentUrl: string | null = null;
  /** True when the user explicitly paused; we must not auto-resume then. */
  userPaused = false;
  onStateChange: (s: VideoState) => void = () => {};

  constructor() {
    const v = document.createElement('video');
    v.muted = true; // required for autoplay on iOS/Android
    v.playsInline = true; // iOS: do not force fullscreen
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.loop = true;
    v.preload = 'auto';
    v.crossOrigin = 'anonymous';
    this.element = v;
  }

  /** Load a video. Resolves when enough data is buffered to start playing. */
  async load(url: string): Promise<void> {
    if (this.currentUrl === url && this.element.readyState >= 3) return;
    this.onStateChange('loading');
    this.userPaused = false;
    const v = this.element;
    v.pause();
    this.currentUrl = url;
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        v.removeEventListener('canplay', done);
        v.removeEventListener('error', fail);
      };
      const done = () => {
        cleanup();
        resolve();
      };
      const fail = () => {
        cleanup();
        this.onStateChange('error');
        reject(new Error(`Video failed to load: ${url}`));
      };
      v.addEventListener('canplay', done);
      v.addEventListener('error', fail);
      v.src = url;
      v.load();
    });
  }

  async play(): Promise<void> {
    try {
      await this.element.play();
      this.onStateChange('playing');
    } catch {
      // Autoplay blocked or interrupted by a new load(): show as paused, user can tap Play.
      this.onStateChange('paused');
    }
  }

  pause(): void {
    this.element.pause();
    this.onStateChange('paused');
  }

  userTogglePlay(): void {
    if (this.element.paused) {
      this.userPaused = false;
      void this.play();
    } else {
      this.userPaused = true;
      this.pause();
    }
  }

  replay(): void {
    this.userPaused = false;
    this.element.currentTime = 0;
    void this.play();
  }

  /** Release the video data (call when leaving the scanner). */
  dispose(): void {
    this.element.pause();
    this.element.removeAttribute('src');
    this.element.load();
    this.currentUrl = null;
  }
}
