"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2, Users, Eye, Film, Activity, RefreshCw, Crown, CreditCard } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Statistics {
  total_views: number;
  total_users: number;
  active_users: number;
  total_dramas: number;
}

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading, userRole } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log('[AdminDashboard] Auth state:', { 
      authLoading, 
      user: user?.email, 
      userRole,
      isAdmin 
    });

    // Only redirect if auth is fully loaded and user is confirmed not admin
    if (!authLoading) {
      if (!user) {
        console.log('[AdminDashboard] No user, redirecting to home');
        router.push('/');
      } else if (!isAdmin) {
        console.log('[AdminDashboard] User is not admin, redirecting to home');
        router.push('/');
      } else {
        console.log('[AdminDashboard] User is admin, staying on page');
      }
    }
  }, [authLoading, user, isAdmin, userRole, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchStatistics();
      
      // Realtime subscription
      const channel = supabase
        .channel('statistics-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'statistics' },
          () => {
            fetchStatistics();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);

  const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase
        .from('statistics')
        .select('*')
        .single();

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStatistics = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/admin/update-stats', { method: 'POST' });
      const data = await response.json();
      if (data.stats) {
        setStats(data.stats);
      } else {
        await fetchStatistics();
      }
    } catch (error) {
      console.error('Error refreshing statistics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const chartData = [
    { name: 'Mon', views: 4000, users: 240 },
    { name: 'Tue', views: 3000, users: 139 },
    { name: 'Wed', views: 2000, users: 980 },
    { name: 'Thu', views: 2780, users: 390 },
    { name: 'Fri', views: 1890, users: 480 },
    { name: 'Sat', views: 2390, users: 380 },
    { name: 'Sun', views: 3490, users: 430 },
  ];

  return (
    <div className="min-h-screen pt-20 md:pt-24 px-3 md:px-4 pb-6 md:pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-sm md:text-base text-muted-foreground">Live statistics and management</p>
          </div>
          <button
            onClick={refreshStatistics}
            disabled={refreshing}
            className="btn-secondary gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Stats'}
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <div className="card-corporate p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-1">
              {stats?.total_views.toLocaleString() || 0}
            </h3>
            <p className="text-sm text-muted-foreground">Total Views</p>
          </div>

          <div className="card-corporate p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-1">
              {stats?.total_users.toLocaleString() || 0}
            </h3>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </div>

          <div className="card-corporate p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <Activity className="w-5 h-5 text-green-500 animate-pulse" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-1">
              {stats?.active_users.toLocaleString() || 0}
            </h3>
            <p className="text-sm text-muted-foreground">Active Users</p>
          </div>

          <div className="card-corporate p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Film className="w-6 h-6 text-primary" />
              </div>
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-1">
              {stats?.total_dramas.toLocaleString() || 0}
            </h3>
            <p className="text-sm text-muted-foreground">Total Dramas</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                <div className="card-corporate p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6">Views Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

            <div className="card-corporate p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6">Users Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <button
            onClick={() => router.push('/admin/ads')}
            className="card-corporate p-4 md:p-6 hover:border-primary/50 transition-colors text-left"
          >
            <h3 className="text-base md:text-lg font-bold mb-2">Manage Ads</h3>
            <p className="text-sm text-muted-foreground">
              Create and manage advertisement placements
            </p>
          </button>

          <button
            onClick={() => router.push('/admin/maintenance')}
            className="card-corporate p-4 md:p-6 hover:border-primary/50 transition-colors text-left"
          >
            <h3 className="text-base md:text-lg font-bold mb-2">Maintenance Mode</h3>
            <p className="text-sm text-muted-foreground">
              Enable or disable site maintenance
            </p>
          </button>

          <button
            onClick={() => router.push('/admin/vip')}
            className="card-corporate p-4 md:p-6 hover:border-primary/50 transition-colors text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h3 className="text-base md:text-lg font-bold">VIP Plans</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Kelola paket VIP dan metode pembayaran
            </p>
          </button>

          <button
            onClick={() => router.push('/admin/payments')}
            className="card-corporate p-4 md:p-6 hover:border-primary/50 transition-colors text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3 className="text-base md:text-lg font-bold">Pembayaran</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Approve atau reject pembayaran VIP
            </p>
          </button>

          <button
            onClick={() => router.push('/admin/users')}
            className="card-corporate p-4 md:p-6 hover:border-primary/50 transition-colors text-left"
          >
            <h3 className="text-base md:text-lg font-bold mb-2">User Management</h3>
            <p className="text-sm text-muted-foreground">
              View and manage registered users
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
