import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY is not set');
  }

  const decoded = Buffer.from(key, 'base64');
  if (decoded.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (base64-encoded)');
  }

  return decoded;
}

export interface EncryptedPayload {
  cipherText: string;
  iv: string;
  tag: string;
}

export function encryptText(plainText: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    cipherText: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

export function decryptText(payload: EncryptedPayload): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const cipherText = Buffer.from(payload.cipherText, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
  return decrypted.toString('utf8');
}

export function isEncryptedPayload(payload: {
  iv?: string | null;
  tag?: string | null;
}): payload is { iv: string; tag: string } {
  return !!payload.iv && !!payload.tag;
}
