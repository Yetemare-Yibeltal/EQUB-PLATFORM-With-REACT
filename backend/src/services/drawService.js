import { AUDIT_ACTIONS } from "../constants/auditActions.js";
import { CYCLE_STATUSES } from "../constants/cycleStatuses.js";
import { GROUP_STATUSES } from "../constants/groupStatuses.js";
import { PAYOUT_ORDER_METHODS } from "../constants/payoutOrderMethods.js";
import * as cycleRepository from "../repositories/cycleRepository.js";
import * as drawRepository from "../repositories/drawRepository.js";
import * as memberRepository from "../repositories/memberRepository.js";
import * as payoutRepository from "../repositories/payoutRepository.js";
import ApiError from "../utils/apiError.js";
import { generateSeed, selectIndex, verifySelection } from "../utils/draw.js";
import { parsePagination, parseSort } from "../utils/pagination.js";
import withTransaction from "../utils/transaction.js";
import * as auditService from "./auditService.js";
import { requireAccess } from "./groupService.js";

const SORTABLE_FIELDS = ["drawnAt", "createdAt"];
const USER_FIELDS = "fullName avatarUrl";
const DRAW_POPULATE = [
  { path: "winnerUser", select: USER_FIELDS },
  { path: "participants.user", select: USER_FIELDS },
];

const presentDraw = (draw) => ({
  ...draw.toJSON(),
  verified: verifySelection({
    method: draw.method,
    seed: draw.seed,
    cycleId: String(draw.cycle),
    participantIds: draw.participants.map((participant) =>
      String(participant.member),
    ),
    winnerId: String(draw.winner),
  }),
});

export const performDraw = async (actor, groupId, cycleId) => {
  const { group } = await requireAccess(actor, groupId, {
    organizerOnly: true,
  });

  if (group.status !== GROUP_STATUSES.ACTIVE) {
    throw ApiError.conflict(
      "Draws can only be performed while the group is active",
    );
  }

  const cycle = await cycleRepository.findById(cycleId);

  if (!cycle || String(cycle.group) !== String(groupId)) {
    throw ApiError.notFound("Cycle not found");
  }

  if (cycle.status !== CYCLE_STATUSES.COLLECTED || cycle.recipient) {
    throw ApiError.conflict(
      cycle.recipient
        ? "A draw has already been performed for this cycle"
        : "A draw can only be performed after every contribution for the cycle is resolved",
    );
  }

  if (cycle.collectedAmount < 1) {
    throw ApiError.conflict(
      "Nothing was collected in this cycle, so there is nothing to pay out",
    );
  }

  const result = await withTransaction(async (session) => {
    const current = await cycleRepository.findById(cycleId, { session });

    if (
      !current ||
      current.status !== CYCLE_STATUSES.COLLECTED ||
      current.recipient
    ) {
      throw ApiError.conflict(
        "A draw has already been performed for this cycle",
      );
    }

    const eligible = await memberRepository.findEligibleRecipients(groupId, {
      session,
    });

    if (eligible.length === 0) {
      throw ApiError.conflict("No eligible members remain for this cycle");
    }

    const method = group.payoutOrderMethod;
    const seed =
      method === PAYOUT_ORDER_METHODS.RANDOM_DRAW ? generateSeed() : null;
    const participantIds = eligible.map((member) => String(member._id));
    const winnerIndex = selectIndex({
      method,
      seed,
      cycleId: String(current._id),
      participantIds,
    });
    const winner = eligible[winnerIndex];

    const claimed = await cycleRepository.assignRecipient(
      current._id,
      winner._id,
      { session },
    );

    if (!claimed) {
      throw ApiError.conflict(
        "A draw has already been performed for this cycle",
      );
    }

    const positioned = await memberRepository.assignPayoutPosition(
      winner._id,
      current.number,
      {
        session,
      },
    );

    if (!positioned) {
      throw ApiError.conflict(
        "The selected member is no longer eligible, please try again",
      );
    }

    const draw = await drawRepository.create(
      {
        group: groupId,
        cycle: current._id,
        cycleNumber: current.number,
        method,
        seed,
        participants: eligible.map((member) => ({
          member: member._id,
          user: member.user,
        })),
        winner: winner._id,
        winnerUser: winner.user,
        winnerIndex,
        conductedBy: actor.id,
      },
      { session },
    );

    const payout = await payoutRepository.create(
      {
        group: groupId,
        cycle: current._id,
        draw: draw._id,
        member: winner._id,
        user: winner.user,
        amount: current.collectedAmount,
      },
      { session },
    );

    await auditService.record(
      {
        actorId: actor.id,
        action: AUDIT_ACTIONS.DRAW_PERFORMED,
        groupId,
        cycleId: current._id,
        entityType: "Draw",
        entityId: draw._id,
        metadata: {
          method,
          cycleNumber: current.number,
          participantCount: eligible.length,
          winnerMember: String(winner._id),
          winnerUser: String(winner.user),
          payoutAmount: current.collectedAmount,
        },
      },
      { session },
    );

    return { draw, payout, cycle: claimed };
  });

  await result.draw.populate(DRAW_POPULATE);

  return {
    draw: presentDraw(result.draw),
    payout: result.payout.toJSON(),
    cycle: result.cycle.toJSON(),
  };
};

export const listDraws = async (actor, groupId, query = {}) => {
  await requireAccess(actor, groupId);

  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const sort = parseSort(query.sort, SORTABLE_FIELDS, "drawnAt");

  const filter = { group: groupId };

  if (query.cycleId) filter.cycle = query.cycleId;

  const { items, meta } = await drawRepository.list(filter, {
    page,
    limit,
    skip,
    sort,
    populate: DRAW_POPULATE,
  });

  return { items: items.map(presentDraw), meta };
};

export const getDraw = async (actor, groupId, drawId) => {
  await requireAccess(actor, groupId);

  const draw = await drawRepository.findById(drawId);

  if (!draw || String(draw.group) !== String(groupId)) {
    throw ApiError.notFound("Draw not found");
  }

  await draw.populate(DRAW_POPULATE);

  return presentDraw(draw);
};
