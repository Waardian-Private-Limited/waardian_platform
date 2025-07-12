import crypto from 'crypto';

const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPT_KEY || '0123456789abcdef0123456789abcdef'; // 32-byte
const IV_LENGTH = 16;

export function encryptPayload(data: object): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(SECRET_KEY), iv);

  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

export function decryptPayload(encryptedData: string): object {
  const [iv, encrypted] = encryptedData.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(SECRET_KEY), Buffer.from(iv, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}