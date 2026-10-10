'use client';

import { useState, useEffect, useCallback } from 'react';
import { PosOfflineQueue, QueuedPosSale } from '../../../infrastructure/pos/pos-offline-queue';
import { createPosOrderAction } from '../../actions/pos.actions';

export function usePosOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [queuedSales, setQueuedSales] = useState<QueuedPosSale[]>([]);
  const [lastSyncResult, setLastSyncResult] = useState<{
    synced: number;
    failed: number;
    timestamp: number;
  } | null>(null);

  const refreshQueue = useCallback(() => {
    setQueuedSales(PosOfflineQueue.getQueuedSales());
  }, []);

  // Process offline mutation sync queue
  const syncQueue = useCallback(async (): Promise<{ synced: number; failed: number }> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    const currentQueue = PosOfflineQueue.getQueuedSales();
    if (currentQueue.length === 0) {
      return { synced: 0, failed: 0 };
    }

    setIsSyncing(true);
    let synced = 0;
    let failed = 0;

    for (const item of currentQueue) {
      try {
        PosOfflineQueue.updateSaleStatus(item.id, 'SYNCING');
        const result = await createPosOrderAction(item.request);
        if (result.success) {
          PosOfflineQueue.removeQueuedSale(item.id);
          synced++;
        } else {
          // If already exists or completed, consider synced (idempotent recovery)
          if (result.code === 'DUPLICATE_ORDER' || result.error?.includes('مكرر')) {
            PosOfflineQueue.removeQueuedSale(item.id);
            synced++;
          } else {
            PosOfflineQueue.updateSaleStatus(item.id, 'FAILED', result.error);
            failed++;
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Network error during sync';
        PosOfflineQueue.updateSaleStatus(item.id, 'FAILED', errorMsg);
        failed++;
      }
    }

    refreshQueue();
    setIsSyncing(false);
    setLastSyncResult({ synced, failed, timestamp: Date.now() });

    return { synced, failed };
  }, [refreshQueue]);

  // Setup online/offline event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    refreshQueue();

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when network reconnects
      syncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic sync interval if there are pending sales
    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const count = PosOfflineQueue.getQueuedSales().length;
        if (count > 0) {
          syncQueue();
        }
      }
    }, 45000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [refreshQueue, syncQueue]);

  return {
    isOnline,
    isSyncing,
    pendingCount: queuedSales.length,
    queuedSales,
    refreshQueue,
    syncNow: syncQueue,
    lastSyncResult,
  };
}
