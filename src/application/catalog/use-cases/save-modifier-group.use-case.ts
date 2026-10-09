import { prisma } from '../../../infrastructure/db/prisma';
import { ModifierGroupInput, modifierGroupSchema, toMinorUnits } from '../dto/catalog.dto';

export class SaveModifierGroupUseCase {
  public async execute(input: ModifierGroupInput) {
    const value = modifierGroupSchema.parse(input);
    const { modifiers, ...fields } = value;
    const baseData = {
      nameAr: fields.nameAr,
      nameEn: fields.nameEn,
      minSelect: fields.minSelect,
      maxSelect: fields.maxSelect,
    };

    const modifiersCreate = modifiers.map((modifier, sortOrder) => ({
      nameAr: modifier.nameAr,
      nameEn: modifier.nameEn,
      priceDelta: toMinorUnits(modifier.price),
      sortOrder,
    }));

    if (fields.id) {
      return prisma.modifierGroup.update({
        where: { id: fields.id },
        data: {
          ...baseData,
          modifiers: {
            deleteMany: {},
            create: modifiersCreate,
          },
        },
        include: { modifiers: true },
      });
    }

    return prisma.modifierGroup.create({
      data: {
        ...baseData,
        modifiers: {
          create: modifiersCreate,
        },
      },
      include: { modifiers: true },
    });
  }
}
