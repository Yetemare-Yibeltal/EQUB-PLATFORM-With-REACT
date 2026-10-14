import * as auditLogRepository from "../repositories/auditLogRepository.js";

export const record = (
  { actorId, action, groupId, cycleId, entityType, entityId, metadata = {} },
  { session } = {},
) =>
  auditLogRepository.create(
    {
      actor: actorId,
      action,
      group: groupId,
      cycle: cycleId,
      entityType,
      entityId,
      metadata,
    },
    { session },
  );
