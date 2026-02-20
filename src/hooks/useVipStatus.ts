"use client";

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export interface VipStatus {
  isVip: boolean;
  plan: {
    id: string;
    name: string;
    max_quality: number;
  } | null;
  subscription: {
    id: string;
    status: string;
    starts_at: string;
    ends_at: string;
  } | null;
  pendingPayment: boolean;
}

async function fetchVipStatus(userId: string): Promise<VipStatus> {
  const res = await fetch(`/api/vip/status?userId=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch VIP status');
  return res.json();
}

export function useVipStatus() {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['vip-status', user?.id],
    queryFn: () => fetchVipStatus(user!.id),
    enabled: !!user?.id,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  return {
    isVip: data?.isVip ?? false,
    vipPlan: data?.plan ?? null,
    subscription: data?.subscription ?? null,
    pendingPayment: data?.pendingPayment ?? false,
    maxQuality: data?.plan?.max_quality ?? 480,
    loading: isLoading,
    refetch,
  };
}
