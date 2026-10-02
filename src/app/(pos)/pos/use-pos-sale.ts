'use client';

import { useRef, useState, useTransition } from 'react';
import { createPosOrderAction } from '../../actions/pos.actions';
import { CreatePosOrderDto } from '../../../application/pos/dto/pos.dto';
import { PosReceipt } from '../../../domain/pos/contracts/pos.repository';

export function usePosSale(onSuccess: (receipt: PosReceipt) => void) {
  const [pending, startTransition] = useTransition();
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState('');
  const attempt = useRef<CreatePosOrderDto | null>(null);
  const sending = useRef(false);
  function submit(makeRequest: () => CreatePosOrderDto) {
    if (sending.current) return;
    try { attempt.current ??= makeRequest(); } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'تحقق من بيانات الطلب'); return;
    }
    sending.current = true;
    startTransition(async () => {
      try {
        const result = await createPosOrderAction(attempt.current!);
        if (result.success) { attempt.current = null; setUncertain(false); setError(''); onSuccess(result.data); }
        else { const unknown = result.code === 'INTERNAL_ERROR'; setUncertain(unknown);
          if (!unknown) attempt.current = null; setError(result.error); }
      } catch { setUncertain(true); setError('تعذر تأكيد نتيجة البيع. أعد المحاولة بنفس العملية لتجنب التكرار.'); }
      finally { sending.current = false; }
    });
  }
  return { pending, uncertain, error, submit, locked: pending || uncertain };
}
