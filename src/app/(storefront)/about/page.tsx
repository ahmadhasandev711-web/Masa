import { prisma } from '../../../infrastructure/db/prisma';
import { AboutClient } from './about-client';

export default async function AboutPage() {
  const setting = await prisma.restaurantSetting.findFirst();
  return (
    <AboutClient
      restaurantNameAr={setting?.nameAr ?? 'قهوة كايرو'}
      restaurantNameEn={setting?.nameEn ?? 'Qahwet Cairo'}
    />
  );
}
