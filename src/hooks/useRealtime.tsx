import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useRealtimeUpdates = () => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('car-rental-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cars'
        },
        (payload) => {
          console.log('Car availability updated:', payload);
          // Broadcast to other components that cars have been updated
          window.dispatchEvent(new CustomEvent('cars-updated', { detail: payload }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('Booking updated:', payload);
          window.dispatchEvent(new CustomEvent('bookings-updated', { detail: payload }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification:', payload);
          window.dispatchEvent(new CustomEvent('notification-received', { detail: payload }));
        }
      )
      .subscribe((status) => {
        console.log('Realtime connection status:', status);
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'connecting');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { connectionStatus };
};

export const useCarAvailability = () => {
  const [cars, setCars] = useState<any[]>([]);

  useEffect(() => {
    const handleCarsUpdate = (event: any) => {
      console.log('Cars updated event received:', event.detail);
      // Refetch cars data
      fetchCars();
    };

    const fetchCars = async () => {
      const { data } = await supabase
        .from('cars')
        .select('*')
        .eq('available', true)
        .order('name');
      
      if (data) setCars(data);
    };

    fetchCars();
    window.addEventListener('cars-updated', handleCarsUpdate);

    return () => {
      window.removeEventListener('cars-updated', handleCarsUpdate);
    };
  }, []);

  return cars;
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    };

    const handleNewNotification = (event: any) => {
      console.log('New notification received:', event.detail);
      fetchNotifications();
    };

    fetchNotifications();
    window.addEventListener('notification-received', handleNewNotification);

    return () => {
      window.removeEventListener('notification-received', handleNewNotification);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => prev - 1);
  };

  return { notifications, unreadCount, markAsRead };
};