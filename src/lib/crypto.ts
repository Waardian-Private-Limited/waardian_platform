import crypto from 'crypto';

const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPT_KEY || '0123456789abcdef0123456789abcdef'; // 32-byte
const IV_LENGTH = 16;

export function encryptPayload(data: object): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(SECRET_KEY), iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt payload');
  }
}

export function decryptPayload(encryptedData: any): object | null {
  try {
    // Handle non-encrypted data that is already an object
    if (typeof encryptedData === 'object' && encryptedData !== null) {
      return encryptedData;
    }

    // Validate encrypted data is a string
    if (typeof encryptedData !== 'string') {
      console.error('Invalid encrypted data: not a string', encryptedData);
      return null;
    }

    // Validate and extract IV and encrypted content
    const [iv, encrypted] = encryptedData.split(':');
    if (!iv || !encrypted) {
      console.error('Invalid encrypted data: missing iv or encrypted content', encryptedData);
      return null;
    }

    // Decrypt the data
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc', 
      Buffer.from(SECRET_KEY), 
      Buffer.from(iv, 'hex')
    );

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}