import { UrlRepository } from "../repositories/url.repository";
import { ClickRepository } from "../repositories/click.repository";
import { IdempotencyKeyRepository } from "../repositories/idempotency-key.repository";
import { UrlService } from "./url.service";

const urlRepository = new UrlRepository();
const clickRepository = new ClickRepository();
const idempotencyKeyRepository = new IdempotencyKeyRepository();

export const urlService = new UrlService(urlRepository);

export { clickRepository, idempotencyKeyRepository };
