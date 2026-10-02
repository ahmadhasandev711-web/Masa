import { describe, it, expect } from 'vitest';
import { JwtService } from '../../src/infrastructure/auth/jwt.service';
import { UnauthorizedError } from '../../src/domain/shared/errors/domain-error';

describe('JwtService', () => {
  it('signs and verifies a valid JWT payload', async () => {
    const payload = {
      userId: 'user_123',
      role: 'ADMIN',
      branchId: 'branch_abc',
    };

    const token = await JwtService.sign(payload, '1h');
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const verified = await JwtService.verify(token);
    expect(verified.userId).toBe('user_123');
    expect(verified.role).toBe('ADMIN');
    expect(verified.branchId).toBe('branch_abc');
  });

  it('rejects an invalid or tampered token', async () => {
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
    await expect(JwtService.verify(invalidToken)).rejects.toThrow(UnauthorizedError);
  });
});
