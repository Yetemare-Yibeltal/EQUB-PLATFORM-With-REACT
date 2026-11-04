import StoredFile from "../models/StoredFile.js";

export const create = async (data, { session } = {}) => {
  const [file] = await StoredFile.create([data], { session });
  return file;
};

export const findWithData = (id) => StoredFile.findById(id).select("+data");

export const deleteOwned = (id, owner) =>
  StoredFile.deleteOne({ _id: id, owner });
