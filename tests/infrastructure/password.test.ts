import { describe, it, expect } from 'vitest';
import { PasswordService } from '../../src/infrastructure/auth/password.service';

describe('PasswordService', () => {
  it('hashes and securely verifies matching passwords', async () => {
    const raw = 'SuperSecret123!';
    const hash = await PasswordService.hash(raw);

    expect(hash).not.toBe(raw);
    expect(hash.startsWith('$2')).toBe(true);

    const isMatch = await PasswordService.compare(raw, hash);
    expect(isMatch).toBe(true);
  });

  it('rejects incorrect passwords', async () => {
    const hash = await PasswordService.hash('CorrectPassword');
    const isMatch = await PasswordService.compare('WrongPassword', hash);
    expect(isMatch).toBe(false);
  });
});
