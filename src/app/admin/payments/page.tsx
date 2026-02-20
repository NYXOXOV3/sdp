"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle2, XCircle, Clock, ArrowLeft, CreditCard, Eye } from 'lucide-react';

interface Payment {
  id: string;
  user_id: string;
  user_email: string;
  plan_name: string;
  plan_price: number;
  duration_days: number;
  method_label: string;
  method_type: string;
  amount: number;
  status: string;
  proof_url: string;
  sender_name: string;
  notes: string;
  admin_notes: string;
  created_at: string;
  reviewed_at: string;
}

export default function AdminPaymentsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) fetchPayments();
  }, [isAdmin, filter]);

  const fetchPayments = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/admin/vip/payments?status=${filter}&adminId=${user.id}`);
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (paymentId: string, action: 'approve' | 'reject') => {
    if (!user) return;
    setProcessingId(paymentId);
    try {
      const res = await fetch('/api/admin/vip/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, action, adminId: user.id, adminNotes }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedPayment(null);
        setAdminNotes('');
        fetchPayments();
      } else {
        alert(data.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    } finally {
      setProcessingId(null);
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const pendingCount = payments.filter(p => p.status === 'pending').length;

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen pt-20 md:pt-24 px-3 md:px-4 pb-6 md:pb-12">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Admin Dashboard</span>
        </button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Pembayaran VIP</h1>
            {pendingCount > 0 && filter !== 'pending' && (
              <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">{pendingCount} menunggu</span>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: 'pending', label: 'Menunggu', icon: Clock, color: 'text-yellow-400' },
            { value: 'approved', label: 'Disetujui', icon: CheckCircle2, color: 'text-green-400' },
            { value: 'rejected', label: 'Ditolak', icon: XCircle, color: 'text-red-400' },
            { value: 'all', label: 'Semua', icon: CreditCard, color: 'text-primary' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setLoading(true); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                filter === f.value ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground bg-muted/30'
              }`}
            >
              <f.icon className={`w-4 h-4 ${filter === f.value ? 'text-white' : f.color}`} />
              {f.label}
            </button>
          ))}
        </div>

        {payments.length === 0 ? (
          <div className="card-corporate p-12 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Tidak ada pembayaran {filter === 'pending' ? 'yang menunggu' : ''}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="card-corporate p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{payment.user_email || payment.user_id.slice(0, 8)}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        payment.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        payment.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {payment.status === 'approved' ? 'Disetujui' : payment.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <p>Paket: <span className="text-foreground">{payment.plan_name}</span> - {formatPrice(payment.amount)}</p>
                      <p>Metode: <span className="text-foreground">{payment.method_label}</span></p>
                      {payment.sender_name && <p>Pengirim: <span className="text-foreground">{payment.sender_name}</span></p>}
                      <p className="text-xs">{formatDate(payment.created_at)}</p>
                    </div>
                    {payment.notes && (
                      <p className="text-xs text-muted-foreground mt-2 p-2 rounded bg-muted/30">Catatan: {payment.notes}</p>
                    )}
                    {payment.admin_notes && (
                      <p className="text-xs text-muted-foreground mt-1 p-2 rounded bg-primary/5">Admin: {payment.admin_notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {payment.proof_url && (
                      <a href={payment.proof_url} target="_blank" rel="noopener noreferrer" className="btn-icon" title="Lihat Bukti">
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                    {payment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => { setSelectedPayment(payment); setAdminNotes(''); }}
                          className="btn-icon"
                          title="Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAction(payment.id, 'approve')}
                          disabled={processingId === payment.id}
                          className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {processingId === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleAction(payment.id, 'reject')}
                          disabled={processingId === payment.id}
                          className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="card-corporate p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <h3 className="font-bold text-lg mb-4">Detail Pembayaran</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">User</span><span>{selectedPayment.user_email}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Paket</span><span>{selectedPayment.plan_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Jumlah</span><span className="font-bold text-primary">{formatPrice(selectedPayment.amount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Metode</span><span>{selectedPayment.method_label}</span></div>
                {selectedPayment.sender_name && <div className="flex justify-between"><span className="text-muted-foreground">Pengirim</span><span>{selectedPayment.sender_name}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Tanggal</span><span>{formatDate(selectedPayment.created_at)}</span></div>
                {selectedPayment.proof_url && (
                  <div>
                    <span className="text-muted-foreground block mb-2">Bukti Transfer:</span>
                    <a href={selectedPayment.proof_url} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all text-xs">{selectedPayment.proof_url}</a>
                  </div>
                )}
                {selectedPayment.notes && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Catatan User:</span>
                    <p className="text-xs p-2 rounded bg-muted/30">{selectedPayment.notes}</p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Catatan Admin</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="input-base w-full min-h-[60px] resize-none"
                  placeholder="Catatan opsional..."
                />
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleAction(selectedPayment.id, 'approve')}
                  disabled={processingId === selectedPayment.id}
                  className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingId === selectedPayment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Setujui
                </button>
                <button
                  onClick={() => handleAction(selectedPayment.id, 'reject')}
                  disabled={processingId === selectedPayment.id}
                  className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Tolak
                </button>
                <button onClick={() => setSelectedPayment(null)} className="btn-secondary text-sm">Tutup</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
