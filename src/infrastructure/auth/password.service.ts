import bcrypt from 'bcryptjs';

export class PasswordService {
  private static readonly SALT_ROUNDS = 12;
  private static dummyHash: Promise<string> | null = null;

  public static async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  public static async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Spends the same CPU time as a real comparison so response timing does not
   * reveal whether a username exists.
   */
  public static async burnComparisonTime(password: string): Promise<void> {
    this.dummyHash ??= bcrypt.hash('timing-equalizer', this.SALT_ROUNDS);
    await bcrypt.compare(password, await this.dummyHash);
  }
}
