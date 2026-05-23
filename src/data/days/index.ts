/**
 * KAIZEN.SYS - Branch curriculum registry.
 * Maps branch codes to their 30-day curriculum.
 */
import type { BranchDay } from "./types";
import { aimlDays }  from "./aiml-days";
import { dsDays }    from "./ds-days";
import { eceDays }   from "./ece-days";
import { eeeDays }   from "./eee-days";
import { mechDays }  from "./mech-days";
import { civilDays } from "./civil-days";
import { cseDays }   from "@/data/cse-days";

export type { BranchDay };

/**
 * Look up the day-by-day curriculum for a given branch code.
 * Defaults to CSE if branch is null/unknown.
 */
export function getCurriculumForBranch(branch: string | null | undefined): BranchDay[] {
  const code = (branch ?? "CSE").toUpperCase();
  switch (code) {
    case "CSE":   return cseDays as unknown as BranchDay[];
    case "AIML":  return aimlDays;
    case "DS":    return dsDays;
    case "ECE":   return eceDays;
    case "EEE":   return eeeDays;
    case "MECH":  return mechDays;
    case "CIVIL": return civilDays;
    default:      return cseDays as unknown as BranchDay[];
  }
}
