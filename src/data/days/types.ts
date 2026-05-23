/**
 * Shared shape for branch-specific 30-day curriculum days.
 */
export interface BranchDay {
  day: number;
  title: string;
  concept: string;
  prepare: string;
  learn: string;
  practice: string[];
  build: string;
  discipline: string;
}
