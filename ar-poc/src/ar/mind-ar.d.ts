// MindAR ships no TypeScript types; this declares only what we use (checked against mind-ar 1.2.5 source).
declare module 'mind-ar/dist/mindar-image-three.prod.js' {
  import type { Group, Scene, WebGLRenderer, PerspectiveCamera } from 'three';

  export interface MindARAnchor {
    group: Group;
    targetIndex: number;
    onTargetFound: (() => void) | null;
    onTargetLost: (() => void) | null;
    onTargetUpdate: (() => void) | null;
  }

  export interface MindARThreeOptions {
    container: HTMLElement;
    imageTargetSrc: string;
    maxTrack?: number;
    uiLoading?: 'yes' | 'no';
    uiScanning?: 'yes' | 'no';
    uiError?: 'yes' | 'no';
    filterMinCF?: number | null;
    filterBeta?: number | null;
    warmupTolerance?: number | null;
    missTolerance?: number | null;
  }

  export class MindARThree {
    constructor(options: MindARThreeOptions);
    renderer: WebGLRenderer;
    scene: Scene;
    camera: PerspectiveCamera;
    addAnchor(targetIndex: number): MindARAnchor;
    start(): Promise<void>;
    stop(): void;
  }
}
