import { groupRoom } from "../config/socket.js";
import { MEMBER_STATUSES } from "../constants/memberStatuses.js";
import { SOCKET_EVENTS } from "../constants/socketEvents.js";
import * as memberRepository from "../repositories/memberRepository.js";
import { requireAccess } from "../services/groupService.js";
import logger from "../utils/logger.js";
import { failure, isObjectId, normalizeArgs } from "./helpers.js";

const MAX_AUTO_ROOMS = 200;

export const registerDrawHandlers = (socket) => {
  const actor = socket.data.user;

  memberRepository
    .findByUser(actor.id, { statuses: [MEMBER_STATUSES.ACTIVE] })
    .then((memberships) => {
      memberships.slice(0, MAX_AUTO_ROOMS).forEach((membership) => {
        socket.join(groupRoom(String(membership.group)));
      });
    })
    .catch((error) =>
      logger.error(`Group room subscription failed: ${error.message}`),
    );

  socket.on(SOCKET_EVENTS.GROUP_SUBSCRIBE, async (payload, ack) => {
    const { data, reply } = normalizeArgs(payload, ack);

    if (!isObjectId(data?.groupId)) {
      reply({ ok: false, message: "Invalid group id" });
      return;
    }

    try {
      await requireAccess(actor, data.groupId);
      await socket.join(groupRoom(data.groupId));
      reply({ ok: true, groupId: data.groupId });
    } catch (error) {
      reply(failure(error));
    }
  });

  socket.on(SOCKET_EVENTS.GROUP_UNSUBSCRIBE, async (payload, ack) => {
    const { data, reply } = normalizeArgs(payload, ack);

    if (!isObjectId(data?.groupId)) {
      reply({ ok: false, message: "Invalid group id" });
      return;
    }

    await socket.leave(groupRoom(data.groupId));
    reply({ ok: true, groupId: data.groupId });
  });
};
