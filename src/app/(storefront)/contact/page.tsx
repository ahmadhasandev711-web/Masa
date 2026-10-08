import { prisma } from '../../../infrastructure/db/prisma';
import { ContactClient } from './contact-client';

export const metadata = {
  title: 'تواصل معنا | قهوة كايرو - ستريب مول العاشر من رمضان',
  description: 'تواصل مع قهوة كايرو، ستريب مول - العاشر من رمضان. خدمة وضيافة على مدار 24 ساعة يومياً.',
};

export default async function ContactPage() {
  const [branches, setting] = await Promise.all([
    prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, nameAr: true, nameEn: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.restaurantSetting.findFirst(),
  ]);

  return (
    <ContactClient
      branches={branches}
      restaurantNameAr={setting?.nameAr ?? 'قهوة كايرو'}
      restaurantNameEn={setting?.nameEn ?? 'Qahwet Cairo'}
      phone={setting?.phone}
      address={setting?.address}
    />
  );
}
