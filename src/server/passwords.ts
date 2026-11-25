import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

export type PasswordHash = {
  readonly salt: Buffer;
  readonly key: Buffer;
};

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<PasswordHash> {
  const salt = randomBytes(SALT_LENGTH);
  return { salt, key: await deriveKey(password, salt) };
}

export async function isMatchingPassword(password: string, hash: PasswordHash): Promise<boolean> {
  const key = await deriveKey(password, hash.salt);
  return timingSafeEqual(key, hash.key);
}
