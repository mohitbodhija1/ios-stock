import { useState, useEffect } from 'react';
import { restaurantService } from '../services/restaurantService';

export function useSnapshot() {
  const [snapshot, setSnapshot] = useState(restaurantService.getTenantSnapshot());
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const fresh = await restaurantService.fetchTenantSnapshot();
      setSnapshot({ ...fresh });
    } catch (err) {
      console.error('Error refreshing tenant snapshot:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const unsubscribe = restaurantService.subscribeToOrders(() => {
      refresh();
    });
    return () => unsubscribe();
  }, []);

  return { ...snapshot, loading, refresh };
}
