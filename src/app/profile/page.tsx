"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2, User, Mail, Calendar, History, Bookmark, Settings, LogOut, Trash2, Play, Crown, Shield } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useVipStatus } from '@/hooks/useVipStatus';

interface WatchHistoryItem {
  id: string;
  drama_title: string;
  drama_image: string | null;
  drama_source: string;
  drama_id: string;
  episode: string;
  progress: number;
  duration: number;
  last_watched_at: string;
}

interface BookmarkItem {
  id: string;
  drama_title: string;
  drama_image: string | null;
  drama_source: string;
  drama_id: string;
  created_at: string;
}

export default function ProfilePage() {
  const { user, signOut, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const { isVip, vipPlan, subscription, pendingPayment } = useVipStatus();
  const [activeTab, setActiveTab] = useState<'history' | 'bookmarks'>('history');
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'history') {
        const { data, error } = await supabase
          .from('watch_history')
          .select('*')
          .eq('user_id', user?.id)
          .order('last_watched_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setWatchHistory(data || []);
      } else {
        const { data, error } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBookmarks(data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting history:', error);
    }
  };

  const deleteBookmark = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    }
  };

  const clearAllHistory = async () => {
    if (!confirm('Hapus semua riwayat tonton?')) return;
    
    try {
      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getProgressPercentage = (progress: number, duration: number) => {
    if (!duration) return 0;
    return Math.min(Math.round((progress / duration) * 100), 100);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 md:pt-24 px-4 pb-24 md:pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="card-corporate p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-10 h-10 md:w-12 md:h-12 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">Profile</h1>
                {isVip && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold">
                    <Crown className="w-3 h-3" /> VIP
                  </span>
                )}
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-bold">
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2 text-sm md:text-base text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Bergabung {formatDate(user.created_at)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full md:w-auto px-6 py-3 rounded-lg border border-destructive/20 hover:bg-destructive/10 text-destructive transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </div>

        {isVip && subscription ? (
          <div className="card-corporate p-5 mb-6 border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="font-bold text-amber-400">{vipPlan?.name || 'VIP'}</h3>
                  <p className="text-xs text-muted-foreground">
                    Aktif sampai {new Date(subscription.ends_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <Link href="/upgrade" className="text-xs text-primary hover:underline">Perpanjang</Link>
            </div>
          </div>
        ) : (
          <Link href="/upgrade" className="block card-corporate p-5 mb-6 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-muted-foreground" />
                <div>
                  <h3 className="font-bold">Upgrade ke VIP</h3>
                  <p className="text-xs text-muted-foreground">Nikmati resolusi HD tanpa batasan</p>
                </div>
              </div>
              {pendingPayment ? (
                <span className="text-xs px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 font-medium">Menunggu</span>
              ) : (
                <span className="text-xs text-primary font-medium">Upgrade</span>
              )}
            </div>
          </Link>
        )}

        {isAdmin && (
          <Link href="/admin" className="block card-corporate p-5 mb-6 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-violet-400" />
              <div>
                <h3 className="font-bold">Admin Panel</h3>
                <p className="text-xs text-muted-foreground">Kelola aplikasi</p>
              </div>
            </div>
          </Link>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card hover:bg-accent'
            }`}
          >
            <History className="w-4 h-4" />
            Riwayat Tonton
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'bookmarks'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card hover:bg-accent'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Bookmark
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {activeTab === 'history' && (
              <div>
                {watchHistory.length > 0 && (
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={clearAllHistory}
                      className="px-4 py-2 text-sm rounded-lg border border-destructive/20 hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Hapus Semua
                    </button>
                  </div>
                )}
                
                {watchHistory.length === 0 ? (
                  <div className="card-corporate p-12 text-center">
                    <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Belum ada riwayat tonton</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {watchHistory.map((item) => (
                      <div key={item.id} className="card-corporate p-4 group">
                        <Link href={`/watch/${item.drama_source}/${item.drama_id}/${item.episode}`}>
                          <div className="relative aspect-video mb-3 rounded-lg overflow-hidden bg-accent">
                            {item.drama_image ? (
                              <Image
                                src={item.drama_image}
                                alt={item.drama_title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="w-12 h-12 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-2 left-2 right-2">
                              <div className="w-full bg-background/20 rounded-full h-1 mb-1">
                                <div
                                  className="bg-primary h-full rounded-full"
                                  style={{ width: `${getProgressPercentage(item.progress, item.duration)}%` }}
                                />
                              </div>
                              <p className="text-xs text-white">
                                {getProgressPercentage(item.progress, item.duration)}% selesai
                              </p>
                            </div>
                          </div>
                        </Link>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm mb-1 truncate">{item.drama_title}</h3>
                            <p className="text-xs text-muted-foreground mb-1">Episode {item.episode}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(item.last_watched_at)}</p>
                          </div>
                          <button
                            onClick={() => deleteHistoryItem(item.id)}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bookmarks' && (
              <div>
                {bookmarks.length === 0 ? (
                  <div className="card-corporate p-12 text-center">
                    <Bookmark className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Belum ada bookmark</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {bookmarks.map((item) => (
                      <div key={item.id} className="card-corporate p-3 group">
                        <Link href={`/drama/${item.drama_source}/${item.drama_id}`}>
                          <div className="relative aspect-[2/3] mb-3 rounded-lg overflow-hidden bg-accent">
                            {item.drama_image ? (
                              <Image
                                src={item.drama_image}
                                alt={item.drama_title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="w-12 h-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm mb-1 line-clamp-2">{item.drama_title}</h3>
                            <p className="text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
                          </div>
                          <button
                            onClick={() => deleteBookmark(item.id)}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
