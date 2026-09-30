import ApiError from "../utils/apiError.js";

const SEGMENTS = ["params", "query", "body"];

const validateRequest =
  (schemas = {}) =>
  (req, res, next) => {
    const errors = [];

    for (const segment of SEGMENTS) {
      const schema = schemas[segment];
      if (!schema) continue;

      const { value, error } = schema.validate(req[segment], {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        error.details.forEach((detail) => {
          errors.push({
            location: segment,
            field: detail.path.join("."),
            message: detail.message.replace(/"/g, ""),
          });
        });
      } else {
        req[segment] = value;
      }
    }

    if (errors.length > 0) {
      return next(ApiError.badRequest("Validation failed", errors));
    }

    return next();
  };

export default validateRequest;
