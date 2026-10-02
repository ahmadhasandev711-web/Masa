import { prisma } from '../../../infrastructure/db/prisma';
import { ModifierGroupInput, modifierGroupSchema, toMinorUnits } from '../dto/catalog.dto';

export class SaveModifierGroupUseCase {
  public async execute(input: ModifierGroupInput) {
    const value = modifierGroupSchema.parse(input);
    const { modifiers, ...fields } = value;
    const data = {
      nameAr: fields.nameAr,
      nameEn: fields.nameEn,
      minSelect: fields.minSelect,
      maxSelect: fields.maxSelect,
      modifiers: {
        deleteMany: {},
        create: modifiers.map((modifier, sortOrder) => ({
          nameAr: modifier.nameAr,
          nameEn: modifier.nameEn,
          priceDelta: toMinorUnits(modifier.price),
          sortOrder,
        })),
      },
    };

    return fields.id
      ? prisma.modifierGroup.update({ where: { id: fields.id }, data, include: { modifiers: true } })
      : prisma.modifierGroup.create({ data, include: { modifiers: true } });
  }
}
