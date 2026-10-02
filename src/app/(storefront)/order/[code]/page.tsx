import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { prisma } from '../../../../infrastructure/db/prisma';
import { GetOrderTrackerUseCase } from '../../../../application/ordering/use-cases/get-order-tracker.use-case';
import { OrderTrackerClient } from './order-tracker-client';
import { NotFoundError } from '../../../../domain/shared/errors/domain-error';
import { RateLimiter } from '../../../../infrastructure/security/rate-limiter';
import { RateLimiterKeys, RateLimitPolicies } from '../../../../infrastructure/security/rate-limiter-keys';

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function OrderTrackerPage({ params }: PageProps) {
  const { code } = await params;
  if (!code) {
    notFound();
  }

  let clientIp = '127.0.0.1';
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get('x-forwarded-for');
    const realIp = headerList.get('x-real-ip');
    clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || '127.0.0.1';
  } catch {
    // Fallback if headers not available
  }

  const rateCheck = RateLimiter.check(
    RateLimiterKeys.ORDER_TRACKER(clientIp),
    RateLimitPolicies.ORDER_TRACKER.limit,
    RateLimitPolicies.ORDER_TRACKER.windowMs
  );

  if (!rateCheck.allowed) {
    notFound();
  }

  const decodedCode = decodeURIComponent(code);
  const trackerUseCase = new GetOrderTrackerUseCase();
  const setting = await prisma.restaurantSetting.findFirst();

  let orderData;
  try {
    orderData = await trackerUseCase.execute(decodedCode);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  return (
    <OrderTrackerClient
      order={orderData}
      currencySymbol={setting?.currencySymbol ?? 'ج.م'}
    />
  );
}
