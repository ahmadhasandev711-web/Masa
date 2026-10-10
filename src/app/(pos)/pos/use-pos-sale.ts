'use client';

import { useRef, useState, useTransition } from 'react';
import { createPosOrderAction } from '../../actions/pos.actions';
import { CreatePosOrderDto } from '../../../application/pos/dto/pos.dto';
import { PosReceipt, PosResolvedLine, PosTotals } from '../../../domain/pos/contracts/pos.repository';
import { PosOfflineQueue } from '../../../infrastructure/pos/pos-offline-queue';

export interface PosOfflineReceiptMeta {
  branchName: string;
  cashierId: string;
  currency: string;
  locale: string;
  totals: PosTotals;
  lines: PosResolvedLine[];
}

export function usePosSale(
  onSuccess: (receipt: PosReceipt) => void,
  onQueueUpdate?: () => void
) {
  const [pending, startTransition] = useTransition();
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState('');
  const attempt = useRef<CreatePosOrderDto | null>(null);
  const sending = useRef(false);

  function submit(
    makeRequest: () => CreatePosOrderDto,
    getOfflineMeta?: () => PosOfflineReceiptMeta
  ) {
    if (sending.current) return;

    try {
      attempt.current ??= makeRequest();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'تحقق من بيانات الطلب');
      return;
    }

    // Check if browser is actively offline
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    if (isOffline && getOfflineMeta) {
      try {
        const meta = getOfflineMeta();
        const offlineReceipt = PosOfflineQueue.createOfflineReceipt({
          request: attempt.current!,
          branchName: meta.branchName,
          cashierId: meta.cashierId,
          totals: meta.totals,
          lines: meta.lines,
          currency: meta.currency,
          locale: meta.locale,
        });
        PosOfflineQueue.enqueueSale(attempt.current!, offlineReceipt);
        attempt.current = null;
        setUncertain(false);
        setError('');
        onQueueUpdate?.();
        onSuccess(offlineReceipt);
        return;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'تعذر حفظ الفاتورة في وضع عدم الاتصال');
        return;
      }
    }

    sending.current = true;
    startTransition(async () => {
      try {
        const result = await createPosOrderAction(attempt.current!);
        if (result.success) {
          attempt.current = null;
          setUncertain(false);
          setError('');
          onSuccess(result.data);
        } else {
          const unknown = result.code === 'INTERNAL_ERROR';
          setUncertain(unknown);
          if (!unknown) attempt.current = null;
          setError(result.error);
        }
      } catch (networkError) {
        // Fallback to offline queue if network connection dropped during submission
        if (getOfflineMeta) {
          try {
            const meta = getOfflineMeta();
            const offlineReceipt = PosOfflineQueue.createOfflineReceipt({
              request: attempt.current!,
              branchName: meta.branchName,
              cashierId: meta.cashierId,
              totals: meta.totals,
              lines: meta.lines,
              currency: meta.currency,
              locale: meta.locale,
            });
            PosOfflineQueue.enqueueSale(attempt.current!, offlineReceipt);
            attempt.current = null;
            setUncertain(false);
            setError('');
            onQueueUpdate?.();
            onSuccess(offlineReceipt);
            return;
          } catch (offlineErr) {
            console.error('POS offline queuing failed:', offlineErr);
          }
        }
        setUncertain(true);
        setError('تعذر الاتصال بالخادم. أعد المحاولة بنفس العملية لتجنب التكرار.');
      } finally {
        sending.current = false;
      }
    });
  }

  return { pending, uncertain, error, submit, locked: pending || uncertain };
}
