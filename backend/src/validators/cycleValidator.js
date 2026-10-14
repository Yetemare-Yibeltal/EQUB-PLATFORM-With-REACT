import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const groupParamSchema = Joi.object({
  groupId: objectId.required(),
});

export const cycleParamsSchema = Joi.object({
  groupId: objectId.required(),
  cycleId: objectId.required(),
});
