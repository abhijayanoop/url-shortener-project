import { customAlphabet } from "nanoid";

const BASE62_ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const DEFAULT_LENGTH = 7;

const nanoidGenerator = customAlphabet(BASE62_ALPHABET, DEFAULT_LENGTH);

export function generateShortCode(): string {
  return nanoidGenerator();
}

export function isValidCustomAlias(alias: string): boolean {
  if (alias.length < 4 || alias.length > 20) return false;
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(alias);
}
