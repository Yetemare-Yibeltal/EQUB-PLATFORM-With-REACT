import Joi from "joi";

export const fileIdParamSchema = Joi.object({
  fileId: Joi.string().hex().length(24).required(),
});
