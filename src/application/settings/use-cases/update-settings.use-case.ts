import { prisma } from '../../../infrastructure/db/prisma';
import { updateSettingsSchema, UpdateSettingsDto } from '../dto/settings.dto';

export class UpdateSettingsUseCase {
  public async execute(input: UpdateSettingsDto) {
    const validated = updateSettingsSchema.parse(input);

    const existing = await prisma.restaurantSetting.findFirst();

    const saved = existing
      ? await prisma.restaurantSetting.update({
          where: { id: existing.id },
          data: { ...validated },
        })
      : await prisma.restaurantSetting.create({
          data: { ...validated },
        });

    return {
      ...saved,
      taxRatePercent: Number(saved.taxRatePercent),
    };
  }
}
