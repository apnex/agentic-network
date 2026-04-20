/**
 * Phase 2d CP2 C4 (task-307) — Validator for `update_mission_status`.
 *
 * Fails the convergence gate when the target Mission:
 *   - does not exist (→ `stale_reference`)
 *   - is already at the requested `status` (→ ok, but `isNoOp=true`, bug-14 absorption)
 *   - is in a status that does not permit the staged transition under
 *     MISSION_FSM (→ `invalid_transition`)
 *
 * Reuses MISSION_FSM + isValidTransition from mission-policy to avoid
 * re-implementing transition logic (architect recommendation §3 on
 * thread-232).
 */
import type { IActionValidator, ValidationContext, ValidationResult } from "./types.js";
import { MISSION_FSM } from "../mission-policy.js";
import { isValidTransition } from "../types.js";
import type { MissionStatus } from "../../entities/mission.js";

interface UpdateMissionStatusPayload {
  missionId: string;
  status: MissionStatus | string;
}

export const updateMissionStatusValidator: IActionValidator = {
  validate: async (payload: unknown, ctx: ValidationContext): Promise<ValidationResult> => {
    const p = payload as UpdateMissionStatusPayload;
    const mission = await ctx.mission.getMission(p.missionId);
    if (!mission) {
      return {
        ok: false,
        error: `Mission ${p.missionId} referenced by update_mission_status no longer exists.`,
        subtype: "stale_reference",
        metadata: { entityType: "mission", entityId: p.missionId },
      };
    }
    // Idempotent: already at target.
    if (mission.status === p.status) {
      return { ok: true, isNoOp: true };
    }
    if (!isValidTransition(MISSION_FSM, mission.status, p.status)) {
      return {
        ok: false,
        error: `Mission ${p.missionId} cannot transition from '${mission.status}' to '${p.status}' — not a permitted MISSION_FSM edge.`,
        subtype: "invalid_transition",
        metadata: {
          entityType: "mission",
          entityId: p.missionId,
          currentStatus: mission.status,
          attemptedStatus: p.status,
        },
      };
    }
    return { ok: true };
  },
};
