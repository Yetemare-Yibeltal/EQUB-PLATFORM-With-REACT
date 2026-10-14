import Draw from "../models/Draw.js";
import { paginate } from "../utils/pagination.js";

export const create = async (data, { session } = {}) => {
  const [draw] = await Draw.create([data], { session });
  return draw;
};

export const findById = (id, { session } = {}) =>
  Draw.findById(id)
    .session(session || null)
    .exec();

export const list = (filter, options) => paginate(Draw, filter, options);
