/**
 * Phase 2d CP2 C4 (task-307) — Validator for `create_task`.
 *
 * Fails the convergence gate when the task's `correlationId` names a
 * Mission that is no longer committable (completed / abandoned). Per
 * architect convention in thread-232: container entities must be in a
 * non-terminal state for new children to spawn against them.
 *
 * When `correlationId` is absent, missing, or doesn't match a Mission,
 * the validator passes — `correlationId` is free-form in the current
 * schema (could be a thread id, task id, or mission id). We only reject
 * the case where it unambiguously points at a terminal-state Mission.
 */
import type { IActionValidator, ValidationContext, ValidationResult } from "./types.js";
import { isMissionCommittable } from "../../entities/mission.js";

interface CreateTaskPayload {
  title: string;
  description: string;
  correlationId?: string;
}

export const createTaskValidator: IActionValidator = {
  validate: async (payload: unknown, ctx: ValidationContext): Promise<ValidationResult> => {
    const p = payload as CreateTaskPayload;
    const correlationId = p.correlationId;
    if (!correlationId || !correlationId.startsWith("mission-")) {
      return { ok: true };
    }
    const mission = await ctx.mission.getMission(correlationId);
    if (!mission) {
      // Not a Mission reference — free-form correlationId, pass through.
      return { ok: true };
    }
    if (!isMissionCommittable(mission)) {
      return {
        ok: false,
        error: `create_task targets Mission ${correlationId} which is in terminal status '${mission.status}'. New tasks cannot be spawned against completed or abandoned missions.`,
        subtype: "invalid_transition",
        metadata: {
          entityType: "mission",
          entityId: correlationId,
          currentStatus: mission.status,
          attemptedAction: "spawn_child_task",
        },
      };
    }
    return { ok: true };
  },
};
