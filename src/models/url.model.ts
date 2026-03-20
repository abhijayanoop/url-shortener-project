import mongoose, { Document, Schema } from "mongoose";

export interface IUrlDocument extends Document {
  shortCode: string;
  originalUrl: string;
  userId: string;
  clicks: number;
  expiresAt: Date;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const urlSchema = new Schema<IUrlDocument>(
  {
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      min: 4,
      max: 20,
    },
    originalUrl: {
      type: String,
      required: [true, "Original URL is required"],
      trim: true,
    },

    userId: {
      type: String,
      required: true,
      index: true,
    },

    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

urlSchema.index({ deletedAt: 1 }, { sparse: true });

urlSchema.index({ userId: 1, _id: -1 });

export const UrlModel = mongoose.model<IUrlDocument>("Url", urlSchema);
