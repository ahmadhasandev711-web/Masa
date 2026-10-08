import { headers } from 'next/headers';
import { env } from '../config/env';

const UNKNOWN_CLIENT = 'unknown';

/**
 * Resolves the client IP counting from the right of X-Forwarded-For.
 * Each trusted proxy appends the address it saw, so entries injected by the
 * client always sit to the left of the ones we trust.
 */
export function pickClientIp(
  forwardedFor: string | null,
  realIp: string | null,
  trustedProxyHops: number
): string {
  if (trustedProxyHops <= 0) return UNKNOWN_CLIENT;

  const chain = (forwardedFor ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (chain.length === 0) return realIp?.trim() || UNKNOWN_CLIENT;
  return chain[Math.max(chain.length - trustedProxyHops, 0)];
}

export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    return pickClientIp(
      headerList.get('x-forwarded-for'),
      headerList.get('x-real-ip'),
      env.TRUSTED_PROXY_HOPS
    );
  } catch {
    return UNKNOWN_CLIENT;
  }
}
