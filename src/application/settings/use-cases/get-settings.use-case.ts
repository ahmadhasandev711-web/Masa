import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError } from '../../../domain/shared/errors/domain-error';

export class GetSettingsUseCase {
  public async execute() {
    const settings = await prisma.restaurantSetting.findFirst();

    if (!settings) {
      throw new NotFoundError('RestaurantSetting');
    }

    return {
      ...settings,
      taxRatePercent: Number(settings.taxRatePercent),
    };
  }
}
