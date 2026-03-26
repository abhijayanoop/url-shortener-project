import { IdempotencyKeyRepository } from "../repositories/idempotency-key.repository";

export type StoredResponse = Record<string, unknown>;

const IDEMPOTENCY_KEY_TTL = 24 * 60 * 60 * 1000;

export class IdempotencyService {
  constructor(private idempotencyKeyRepo: IdempotencyKeyRepository) {}

  async checkExisting(key: string): Promise<StoredResponse | null> {
    const existing = await this.idempotencyKeyRepo.findByKey(key);

    if (existing) {
      return existing.response;
    }

    return null;
  }

  async storeResponse(key: string, response: StoredResponse): Promise<void> {
    const expiresAt = new Date(Date.now() + IDEMPOTENCY_KEY_TTL);
    await this.idempotencyKeyRepo.create({ key, response, expiresAt });
  }
}
