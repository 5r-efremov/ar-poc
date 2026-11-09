import type { Scheme, SchemeConfig } from '../data/SchemeTypes';

/** Maps MindAR target indices to schemes. Pure data, no AR dependencies. */
export class TargetManager {
  private byIndex = new Map<number, Scheme>();

  constructor(readonly config: SchemeConfig) {
    for (const s of config.schemes) {
      if (this.byIndex.has(s.targetIndex)) {
        throw new Error(`Duplicate targetIndex ${s.targetIndex} in schemes.json`);
      }
      this.byIndex.set(s.targetIndex, s);
    }
  }

  get(targetIndex: number): Scheme | undefined {
    return this.byIndex.get(targetIndex);
  }

  get schemes(): Scheme[] {
    return this.config.schemes;
  }
}
