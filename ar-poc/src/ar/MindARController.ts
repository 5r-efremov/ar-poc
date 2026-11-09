import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js';
import type { MindARAnchor } from 'mind-ar/dist/mindar-image-three.prod.js';
import type * as THREE from 'three';

export interface TrackingEvents {
  onFound: (targetIndex: number, group: THREE.Group) => void;
  onLost: (targetIndex: number) => void;
}

/** Camera + image tracking. Knows nothing about schemes or videos. */
export class MindARController {
  private mindar: MindARThree;
  private anchors: MindARAnchor[] = [];
  private running = false;

  constructor(
    container: HTMLElement,
    targetFile: string,
    targetIndices: number[],
    events: TrackingEvents,
  ) {
    this.mindar = new MindARThree({
      container,
      imageTargetSrc: targetFile,
      maxTrack: 1, // we only ever show one animation at a time
      // We draw our own UI instead of MindAR's.
      uiLoading: 'no',
      uiScanning: 'no',
      uiError: 'no',
      // Frames to wait before declaring found / lost (reduces flicker). Tune in testing.
      warmupTolerance: 5,
      missTolerance: 10,
    });

    // One lightweight anchor (an empty Group) per target; the single shared
    // overlay is moved to whichever anchor is currently found.
    for (const idx of targetIndices) {
      const anchor = this.mindar.addAnchor(idx);
      anchor.onTargetFound = () => events.onFound(idx, anchor.group);
      anchor.onTargetLost = () => events.onLost(idx);
      this.anchors.push(anchor);
    }
  }

  /** Call from a user-gesture handler (triggers the camera permission prompt). */
  async start(): Promise<void> {
    const { renderer, scene, camera } = this.mindar;
    // MindAR rejects with no error object when the camera fails (see its _startVideo).
    await this.mindar.start();
    this.running = true;
    renderer.setAnimationLoop(() => renderer.render(scene, camera));
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.mindar.renderer.setAnimationLoop(null);
    try {
      this.mindar.stop();
    } catch {
      /* camera may already be stopped */
    }
    this.mindar.renderer.dispose();
  }
}
