import { randomBytes } from 'crypto';

/**
 * @description Secure API key generator
 */
export class KeyHelper {
  /**
   * @description Generates a cryptographically secure API key
   * 256 bits entropy
   */
  static generate(): string {
    return randomBytes(32).toString('hex');
  }
}
