import mongoose, { Schema, Document } from "mongoose";

export interface IIdempotencyKeyDocument extends Document {
  key: string;
  response: Record<string, unknown>;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * IdempotencyKey Schema.
 *
 * This collection stores the results of idempotent API operations so that
 * if the same request is replayed (same idempotency key), we return the
 * original response instead of creating a duplicate.
 *
 * LIFECYCLE:
 * 1. Client sends POST /v1/shorten with Idempotency-Key: "abc-123"
 * 2. Service checks this collection — key "abc-123" not found → proceed
 * 3. Service creates the URL, stores the response here with key "abc-123"
 * 4. Client retries (network error) with same Idempotency-Key: "abc-123"
 * 5. Service finds key "abc-123" → returns stored response (no duplicate URL created)
 * 6. After 24 hours, TTL index automatically deletes the key
 *
 * WHY store the full response and not just a flag?
 * The idempotency contract is: "same request → same response."
 * Storing just a flag would tell us "this was already processed" but we'd
 * have no way to return the same response. We'd have to look up the created
 * URL, which adds complexity and might fail if the URL has been modified
 * since creation.
 */
const idempotencyKeySchema = new Schema<IIdempotencyKeyDocument>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },

    response: {
      type: Schema.Types.Mixed,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

/**
 * TTL index — auto-delete idempotency keys after they expire.
 *
 * WHY 24 hours?
 * Idempotency keys protect against retries. In practice, retries happen
 * within seconds or minutes (client timeout → retry). 24 hours is
 * very generous — it covers extreme cases like:
 * - A queued/scheduled retry system with long backoff
 * - A user manually retrying the next day
 *
 * After 24 hours, we can safely assume the original request is no longer
 * being retried, and the key can be recycled.
 */
idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IdempotencyKeyModel = mongoose.model<IIdempotencyKeyDocument>(
  "IdempotencyKey",
  idempotencyKeySchema,
);
