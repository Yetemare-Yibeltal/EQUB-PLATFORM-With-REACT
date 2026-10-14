import { CYCLE_STATUSES } from "../constants/cycleStatuses.js";
import { GROUP_STATUSES } from "../constants/groupStatuses.js";
import * as contributionRepository from "../repositories/contributionRepository.js";
import * as cycleRepository from "../repositories/cycleRepository.js";
import * as groupRepository from "../repositories/groupRepository.js";
import * as memberRepository from "../repositories/memberRepository.js";
import ApiError from "../utils/apiError.js";
import {
  buildCycleDates,
  lateThreshold,
  toUtcDate,
} from "../utils/schedule.js";
import withTransaction from "../utils/transaction.js";
import { presentGroup, requireAccess } from "./groupService.js";

const presentCycle = (cycle, extra = {}) => ({ ...cycle.toJSON(), ...extra });

const loadCycle = async (groupId, cycleId) => {
  const cycle = await cycleRepository.findById(cycleId);

  if (!cycle || String(cycle.group) !== String(groupId)) {
    throw ApiError.notFound("Cycle not found");
  }

  return cycle;
};

const presentCycleWithOverdue = async (cycle) =>
  presentCycle(cycle, {
    overdueCount: await contributionRepository.countOverdue(cycle._id),
  });

export const startGroup = async (actor, groupId) => {
  const { group, membership } = await requireAccess(actor, groupId, {
    organizerOnly: true,
  });

  if (group.status !== GROUP_STATUSES.OPEN) {
    throw ApiError.conflict("Only open groups can be started");
  }

  if (group.memberCount < 2) {
    throw ApiError.badRequest(
      "A group needs at least 2 active members to start",
    );
  }

  const result = await withTransaction(async (session) => {
    const current = await groupRepository.findById(groupId, { session });

    if (!current || current.status !== GROUP_STATUSES.OPEN) {
      throw ApiError.conflict("Only open groups can be started");
    }

    const members = await memberRepository.listActiveByGroup(groupId, {
      session,
    });

    if (members.length < 2 || members.length !== current.memberCount) {
      throw ApiError.conflict("Group membership changed, please try again");
    }

    const activated = await groupRepository.activate(groupId, members.length, {
      session,
    });

    if (!activated) {
      throw ApiError.conflict("Group could not be started, please try again");
    }

    await memberRepository.rejectPendingByGroup(groupId, { session });

    const today = toUtcDate(new Date());
    const requestedStart = toUtcDate(current.startDate);
    const firstDueDate =
      requestedStart.getTime() < today.getTime() ? today : requestedStart;
    const dueDates = buildCycleDates(
      firstDueDate,
      current.frequency,
      members.length,
    );

    const cycles = await cycleRepository.createMany(
      dueDates.map((dueDate, index) => ({
        group: groupId,
        number: index + 1,
        dueDate,
        status:
          index === 0 ? CYCLE_STATUSES.COLLECTING : CYCLE_STATUSES.UPCOMING,
        expectedCount: members.length,
        potAmount: current.contributionAmount * members.length,
      })),
      { session },
    );

    const firstCycle = cycles[0];

    await contributionRepository.createMany(
      members.map((member) => ({
        group: groupId,
        cycle: firstCycle._id,
        member: member._id,
        user: member.user,
        amount: current.contributionAmount,
        latePenaltyAmount: current.latePenaltyAmount,
        dueDate: firstCycle.dueDate,
        lateAfter: lateThreshold(firstCycle.dueDate, current.gracePeriodDays),
      })),
      { session },
    );

    return { group: activated, cycle: firstCycle };
  });

  return {
    group: presentGroup(result.group, { membership, actor }),
    currentCycle: presentCycle(result.cycle),
  };
};

export const listCycles = async (actor, groupId) => {
  await requireAccess(actor, groupId);

  const cycles = await cycleRepository.findByGroup(groupId);

  return cycles.map((cycle) => presentCycle(cycle));
};

export const getCurrentCycle = async (actor, groupId) => {
  await requireAccess(actor, groupId);

  const cycle = await cycleRepository.findCurrent(groupId);

  if (!cycle) {
    throw ApiError.notFound("This group has no active cycle");
  }

  return presentCycleWithOverdue(cycle);
};

export const getCycle = async (actor, groupId, cycleId) => {
  await requireAccess(actor, groupId);

  const cycle = await loadCycle(groupId, cycleId);

  return presentCycleWithOverdue(cycle);
};
