import mongoose, { Document, Schema } from "mongoose";

export interface IClickDocument extends Document {
  shortCode: string;
  timestamp: Date;
  hashedIp: string;
  referrer: string | null;
  userAgent: string | null;
}

const clickSchema = new Schema<IClickDocument>(
  {
    shortCode: {
      type: String,
      required: true,
    },

    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },

    hashedIp: {
      type: String,
      required: true,
    },

    referrer: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: false,
  },
);

clickSchema.index({ shortCode: 1, timestamp: -1 });

export const ClickModel = mongoose.model<IClickDocument>("Click", clickSchema);
