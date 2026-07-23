import { useState, useEffect, useCallback } from 'react';
import { restaurantService } from '../services/restaurantService';

export function useSnapshot(options?: { tableToken?: string; enabled?: boolean }) {
  const tableToken = options?.tableToken;
  const enabled = options?.enabled ?? true;
  const [snapshot, setSnapshot] = useState(restaurantService.getTenantSnapshot());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!enabled) {
      restaurantService.clearTenantSnapshot();
      setSnapshot(restaurantService.getTenantSnapshot());
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const fresh = await restaurantService.fetchTenantSnapshot(undefined, tableToken);
      setSnapshot({ ...fresh });
    } catch (err) {
      console.error('Error refreshing tenant snapshot:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled, tableToken]);

  useEffect(() => {
    refresh();

    if (!enabled || tableToken) {
      return;
    }

    const unsubscribe = restaurantService.subscribeToOrders(() => {
      refresh();
    });
    return () => unsubscribe();
  }, [enabled, refresh, tableToken]);

  return { ...snapshot, loading, refresh };
}
