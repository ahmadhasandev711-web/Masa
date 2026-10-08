import { SignJWT, jwtVerify } from 'jose';
import { env } from '../config/env';
import { UnauthorizedError } from '../../domain/shared/errors/domain-error';
import { SESSION_TTL_SECONDS } from './auth.constants';

export interface TokenPayload {
  userId: string;
  role: string;
  branchId?: string | null;
  [key: string]: unknown;
}

export class JwtService {
  private static getSecretKey(): Uint8Array {
    return new TextEncoder().encode(env.JWT_SECRET);
  }

  /**
   * Generates a signed JWT with expiration (default: session lifetime).
   */
  public static async sign(
    payload: TokenPayload,
    expiresIn: string = `${SESSION_TTL_SECONDS}s`
  ): Promise<string> {
    const key = this.getSecretKey();
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(key);
  }

  /**
   * Verifies and decodes a JWT token. Throws UnauthorizedError if invalid or expired.
   */
  public static async verify<T extends TokenPayload = TokenPayload>(token: string): Promise<T> {
    try {
      const key = this.getSecretKey();
      const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
      return payload as T;
    } catch {
      throw new UnauthorizedError('Invalid, corrupted, or expired authentication token');
    }
  }
}
