/** Rectangle in target-image fractions (0..1), origin top-left. */
export interface VideoRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Scheme {
  id: string;
  /** Index of the image inside the compiled .mind file (order of compilation). */
  targetIndex: number;
  name: string;
  /** Reference image used to compile the target (documentation only at runtime). */
  image: string;
  video: string;
  /** Pixel size of the image that was compiled into the .mind file. Only the ratio matters. */
  imageWidth: number;
  imageHeight: number;
  /**
   * Part of the target the video covers. Default: whole target.
   * Use a smaller rect if the printed page has a tracking border outside the diagram.
   */
  videoRect?: VideoRect;
}

export interface SchemeConfig {
  targetFile: string;
  /** What happens when a target is lost and found again. */
  onReacquire: 'resume' | 'restart';
  schemes: Scheme[];
}
