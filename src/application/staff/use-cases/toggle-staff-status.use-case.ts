import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError, ValidationError } from '../../../domain/shared/errors/domain-error';

export class ToggleStaffStatusUseCase {
  public async execute(userId: string, isActive: boolean, currentSessionUserId: string) {
    if (userId === currentSessionUserId) {
      throw new ValidationError('لا يمكنك إيقاف حسابك الشخصي المسجل به حالياً');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    return await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, username: true, isActive: true },
    });
  }
}
