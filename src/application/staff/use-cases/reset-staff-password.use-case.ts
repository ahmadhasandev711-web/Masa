import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError } from '../../../domain/shared/errors/domain-error';
import { PasswordService } from '../../../infrastructure/auth/password.service';
import { ResetStaffPasswordDto, resetStaffPasswordSchema } from '../dto/staff.dto';

export class ResetStaffPasswordUseCase {
  public async execute(dto: ResetStaffPasswordDto) {
    const validated = resetStaffPasswordSchema.parse(dto);

    const user = await prisma.user.findUnique({
      where: { id: validated.userId },
    });

    if (!user) {
      throw new NotFoundError('User', validated.userId);
    }

    const passwordHash = await PasswordService.hash(validated.newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { id: user.id, username: user.username };
  }
}
