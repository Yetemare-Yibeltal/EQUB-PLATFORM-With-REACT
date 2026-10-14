import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const groupDrawsParamsSchema = Joi.object({
  groupId: objectId.required(),
});

export const drawParamsSchema = Joi.object({
  groupId: objectId.required(),
  drawId: objectId.required(),
});

export const performDrawSchema = Joi.object({
  cycleId: objectId.required(),
});

export const listDrawsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  cycleId: objectId,
  sort: Joi.string().trim().max(100),
});
