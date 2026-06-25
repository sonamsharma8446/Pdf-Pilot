export type RotationAngle = 90 | 180 | 270;
export type RotationTarget = "all" | "selected" | "odd" | "even";

export interface RotateRequest {
  buffer: Buffer;
  originalName: string;
  angle: RotationAngle;
  target: RotationTarget;
  selectedPages?: number[]; // 1-indexed
}
