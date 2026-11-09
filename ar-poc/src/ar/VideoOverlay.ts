import * as THREE from 'three';
import type { Scheme } from '../data/SchemeTypes';

export type OverlayMode = 'opaque' | 'keyed';

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// 'opaque': video replaces the printed diagram.
// 'keyed' : near-white pixels become transparent, so the paper shows through.
//           (Works only if the video is registered to the print almost perfectly.)
const FRAG = /* glsl */ `
  uniform sampler2D map;
  uniform float keyed;
  uniform float lo;
  uniform float hi;
  varying vec2 vUv;
  void main() {
    vec4 c = texture2D(map, vUv);
    float luma = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    float a = keyed > 0.5 ? 1.0 - smoothstep(lo, hi, luma) : 1.0;
    gl_FragColor = vec4(c.rgb, a);
  }
`;

/**
 * One reusable plane + one VideoTexture, re-parented to whichever anchor is active.
 * MindAR anchor space: origin = target centre, target WIDTH = 1 unit,
 * target height = imageHeight / imageWidth units, +y up.
 */
export class VideoOverlay {
  private mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private texture: THREE.VideoTexture;
  private geometry = new THREE.PlaneGeometry(1, 1);

  constructor(video: HTMLVideoElement, mode: OverlayMode = 'opaque') {
    this.texture = new THREE.VideoTexture(video);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
    // The shader outputs the video's sRGB values untouched, so no colour conversion.
    this.texture.colorSpace = THREE.NoColorSpace;

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        map: { value: this.texture },
        keyed: { value: mode === 'keyed' ? 1 : 0 },
        lo: { value: 0.8 }, // luma below this: fully opaque
        hi: { value: 0.96 }, // luma above this: fully transparent
      },
      transparent: true,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false; // matrix is driven by MindAR
    this.mesh.visible = false;
  }

  setMode(mode: OverlayMode): void {
    this.material.uniforms.keyed.value = mode === 'keyed' ? 1 : 0;
  }

  /** Size/position the plane for a scheme and attach it to the anchor group. */
  attach(group: THREE.Group, scheme: Scheme): void {
    const aspect = scheme.imageHeight / scheme.imageWidth; // target height in anchor units
    const r = scheme.videoRect ?? { x: 0, y: 0, width: 1, height: 1 };
    const w = r.width;
    const h = r.height * aspect;
    this.mesh.scale.set(w, h, 1);
    // image y grows downward, anchor y grows upward
    this.mesh.position.set(r.x + r.width / 2 - 0.5, -((r.y + r.height / 2 - 0.5) * aspect), 0.001);
    group.add(this.mesh);
    this.mesh.visible = true;
  }

  detach(): void {
    this.mesh.visible = false;
    this.mesh.removeFromParent();
  }

  dispose(): void {
    this.detach();
    this.texture.dispose();
    this.material.dispose();
    this.geometry.dispose();
  }
}
