import mongoose from "mongoose";
import { STORED_FILE_KIND_VALUES } from "../constants/storedFileKinds.js";

const storedFileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    kind: {
      type: String,
      enum: STORED_FILE_KIND_VALUES,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
      min: 1,
    },
    data: {
      type: Buffer,
      required: true,
      select: false,
    },
  },
  { timestamps: true },
);

storedFileSchema.index({ owner: 1, kind: 1 });

const StoredFile =
  mongoose.models.StoredFile || mongoose.model("StoredFile", storedFileSchema);

export default StoredFile;
