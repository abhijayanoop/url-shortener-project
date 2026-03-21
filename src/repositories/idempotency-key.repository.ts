import {
  IdempotencyKeyModel,
  IIdempotencyKeyDocument,
} from "../models/idempotency-key.model";

export interface CreateIdempotencyKeyData {
  key: string;
  response: Record<string, unknown>;
  expiresAt: Date;
}

export class IdempotencyKeyRepository {
  async findByKey(key: string): Promise<IIdempotencyKeyDocument | null> {
    return IdempotencyKeyModel.findOne({
      key,
      expiresAt: { $gt: new Date() },
    }).lean();
  }

  async create(data: CreateIdempotencyKeyData): Promise<void> {
    try {
      await IdempotencyKeyModel.create(data);
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: unknown }).code === 11000
      ) {
        return;
      }
      throw error;
    }
  }
}
