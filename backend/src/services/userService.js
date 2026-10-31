import { AUDIT_ACTIONS } from "../constants/auditActions.js";
import { USER_STATUSES } from "../constants/userStatuses.js";
import * as userRepository from "../repositories/userRepository.js";
import ApiError from "../utils/apiError.js";
import { parsePagination, parseSort } from "../utils/pagination.js";
import { normalizePhone } from "../utils/phone.js";
import withTransaction from "../utils/transaction.js";
import * as auditService from "./auditService.js";

const SORTABLE_FIELDS = ["createdAt", "fullName", "lastLoginAt"];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const EMAIL_VERIFICATION_FIELDS = {
  emailVerificationTokenHash: "",
  emailVerificationExpiresAt: "",
};

export const getProfile = async (userId) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return user;
};

export const updateProfile = async (
  userId,
  { fullName, email, avatarUrl, language },
) => {
  const current = await getProfile(userId);
  const set = {};
  const unset = {};

  if (fullName !== undefined) set.fullName = fullName;
  if (avatarUrl !== undefined) set.avatarUrl = avatarUrl;
  if (language !== undefined) set.language = language;

  if (email === null) {
    if (current.email) {
      unset.email = "";
      set.emailVerified = false;
      Object.assign(unset, EMAIL_VERIFICATION_FIELDS);
    }
  } else if (email !== undefined && email !== current.email) {
    const existing = await userRepository.findByEmail(email);

    if (existing && String(existing._id) !== String(userId)) {
      throw ApiError.conflict("Email is already registered", [
        { field: "email", message: "Email is already registered" },
      ]);
    }

    set.email = email;
    set.emailVerified = false;
    Object.assign(unset, EMAIL_VERIFICATION_FIELDS);
  }

  const update = {};
  if (Object.keys(set).length > 0) update.$set = set;
  if (Object.keys(unset).length > 0) update.$unset = unset;

  if (Object.keys(update).length === 0) {
    return current;
  }

  const user = await userRepository.updateById(userId, update);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return user;
};

export const listUsers = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query.sort, SORTABLE_FIELDS, "-createdAt");
  const filter = {};

  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;

  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), "i");
    const conditions = [
      { fullName: pattern },
      { phone: pattern },
      { email: pattern },
    ];
    const normalizedPhone = normalizePhone(query.search);

    if (normalizedPhone) conditions.push({ phone: normalizedPhone });

    filter.$or = conditions;
  }

  return userRepository.list(filter, { page, limit, skip, sort });
};

export const getUserById = async (userId) => getProfile(userId);

export const updateUserStatus = async (actorId, targetId, status) => {
  if (String(actorId) === String(targetId)) {
    throw ApiError.badRequest("You cannot change your own account status");
  }

  const existing = await userRepository.findById(targetId);

  if (!existing) {
    throw ApiError.notFound("User not found");
  }

  const user = await withTransaction(async (session) => {
    const updated = await userRepository.updateById(
      targetId,
      { $set: { status } },
      { session },
    );

    if (!updated) {
      throw ApiError.notFound("User not found");
    }

    await auditService.record(
      {
        actorId,
        action: AUDIT_ACTIONS.USER_STATUS_CHANGED,
        entityType: "User",
        entityId: updated._id,
        metadata: { from: existing.status, to: status },
      },
      { session },
    );

    return updated;
  });

  if (status === USER_STATUSES.SUSPENDED) {
    await userRepository.clearRefreshTokens(targetId);
  }

  return user;
};

export const updateUserRole = async (actorId, targetId, role) => {
  if (String(actorId) === String(targetId)) {
    throw ApiError.badRequest("You cannot change your own role");
  }

  const existing = await userRepository.findById(targetId);

  if (!existing) {
    throw ApiError.notFound("User not found");
  }

  return withTransaction(async (session) => {
    const updated = await userRepository.updateById(
      targetId,
      { $set: { role } },
      { session },
    );

    if (!updated) {
      throw ApiError.notFound("User not found");
    }

    await auditService.record(
      {
        actorId,
        action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
        entityType: "User",
        entityId: updated._id,
        metadata: { from: existing.role, to: role },
      },
      { session },
    );

    return updated;
  });
};
