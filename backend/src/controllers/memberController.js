import { MEMBER_STATUSES } from "../constants/memberStatuses.js";
import * as memberService from "../services/memberService.js";
import * as notificationEventService from "../services/notificationEventService.js";
import { sendCreated, sendSuccess } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const joinGroup = asyncHandler(async (req, res) => {
  const result = await memberService.joinGroup(req.user, req.body.inviteCode);
  const isPending = result.membership.status === MEMBER_STATUSES.PENDING;

  await notificationEventService.notifyMembershipRequested({
    groupId: result.group.id,
    applicantId: req.user.id,
    status: result.membership.status,
  });

  const message = isPending
    ? "Membership request sent, awaiting organizer approval"
    : "Joined group successfully";

  return sendCreated(res, { message, data: result });
});

export const listMembers = asyncHandler(async (req, res) => {
  const { items, meta } = await memberService.listMembers(
    req.user,
    req.params.groupId,
    req.query,
  );

  return sendSuccess(res, {
    message: "Members retrieved successfully",
    data: { members: items },
    meta,
  });
});

export const approveMember = asyncHandler(async (req, res) => {
  const member = await memberService.approveMember(
    req.user,
    req.params.groupId,
    req.params.memberId,
  );

  await notificationEventService.notifyMembershipReviewed(
    req.params.memberId,
    true,
  );

  return sendSuccess(res, {
    message: "Member approved successfully",
    data: { member },
  });
});

export const rejectMember = asyncHandler(async (req, res) => {
  const member = await memberService.rejectMember(
    req.user,
    req.params.groupId,
    req.params.memberId,
  );

  await notificationEventService.notifyMembershipReviewed(
    req.params.memberId,
    false,
  );

  return sendSuccess(res, {
    message: "Membership request rejected",
    data: { member },
  });
});

export const removeMember = asyncHandler(async (req, res) => {
  await memberService.removeMember(
    req.user,
    req.params.groupId,
    req.params.memberId,
  );

  await notificationEventService.notifyMemberRemoved(
    req.params.groupId,
    req.params.memberId,
  );

  return sendSuccess(res, { message: "Member removed successfully" });
});

export const leaveGroup = asyncHandler(async (req, res) => {
  await memberService.leaveGroup(req.user, req.params.groupId);

  await notificationEventService.notifyMemberLeft(
    req.params.groupId,
    req.user.id,
  );

  return sendSuccess(res, { message: "You have left the group" });
});
