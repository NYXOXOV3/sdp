"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useVipStatus } from '@/hooks/useVipStatus';
import { 
  Crown, Check, Loader2, ArrowLeft, Shield, Zap, Star, 
  CreditCard, Upload, Clock, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import Image from 'next/image';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  max_quality: number;
}

interface PaymentMethod {
  id: string;
  type: string;
  label: string;
  account_name: string;
  account_number: string;
  qr_image_url: string;
  instructions: string;
}

interface MyPayment {
  id: string;
  plan_name: string;
  method_label: string;
  amount: number;
  status: string;
  created_at: string;
  admin_notes: string;
}

export default function UpgradePage() {
  const { user, loading: authLoading } = useAuth();
  const { isVip, subscription, pendingPayment, refetch: refetchVip } = useVipStatus();
  const router = useRouter();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [myPayments, setMyPayments] = useState<MyPayment[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [senderName, setSenderName] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [plansRes, methodsRes] = await Promise.all([
        fetch('/api/vip/plans'),
        fetch('/api/vip/payment-methods'),
      ]);
      const plansData = await plansRes.json();
      const methodsData = await methodsRes.json();
      setPlans(plansData.plans || []);
      setMethods(methodsData.methods || []);

      if (user) {
        const paymentsRes = await fetch(`/api/vip/my-payments?userId=${user.id}`);
        const paymentsData = await paymentsRes.json();
        setMyPayments(paymentsData.payments || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedPlan || !selectedMethod) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/vip/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          planId: selectedPlan,
          methodId: selectedMethod,
          senderName,
          proofUrl,
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStep(4);
        refetchVip();
        fetchData();
      } else {
        alert(data.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      alert('Terjadi kesalahan saat mengirim permintaan');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);
  const selectedMethodData = methods.find(m => m.id === selectedMethod);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 md:pt-24 px-3 md:px-4 pb-24 md:pb-12">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Kembali</span>
        </button>

        {isVip && subscription && (
          <div className="card-corporate p-6 mb-8 border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
            <div className="flex items-center gap-3 mb-3">
              <Crown className="w-6 h-6 text-amber-400" />
              <h2 className="text-lg font-bold text-amber-400">VIP Aktif</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Langganan VIP kamu aktif sampai <span className="text-foreground font-medium">{formatDate(subscription.ends_at)}</span>
            </p>
          </div>
        )}

        {pendingPayment && !isVip && (
          <div className="card-corporate p-6 mb-8 border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-amber-500/5">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-6 h-6 text-yellow-400" />
              <h2 className="text-lg font-bold text-yellow-400">Menunggu Persetujuan</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Pembayaran kamu sedang diproses. Admin akan segera menyetujui.
            </p>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 mb-4">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-violet-300">VIP Premium</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">Upgrade ke VIP</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Nikmati konten dengan resolusi HD terbaik tanpa batasan
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => setShowHistory(false)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!showHistory ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>
            Paket VIP
          </button>
          <button onClick={() => setShowHistory(true)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${showHistory ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>
            Riwayat Pembayaran
          </button>
        </div>

        {showHistory ? (
          <div className="space-y-3">
            {myPayments.length === 0 ? (
              <div className="card-corporate p-12 text-center">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Belum ada riwayat pembayaran</p>
              </div>
            ) : (
              myPayments.map((payment) => (
                <div key={payment.id} className="card-corporate p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{payment.plan_name}</span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      payment.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      payment.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {payment.status === 'approved' ? 'Disetujui' : payment.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{payment.method_label} - {formatPrice(payment.amount)}</span>
                    <span>{formatDate(payment.created_at)}</span>
                  </div>
                  {payment.admin_notes && (
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-white/5">
                      Catatan admin: {payment.admin_notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        ) : step === 4 ? (
          <div className="card-corporate p-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Pembayaran Terkirim!</h2>
            <p className="text-muted-foreground mb-6">
              Pembayaran kamu sedang menunggu persetujuan admin. Kamu akan mendapat akses VIP setelah disetujui.
            </p>
            <button onClick={() => { setStep(1); setShowHistory(true); }} className="btn-primary">
              Lihat Riwayat
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step >= s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {step > s ? <Check className="w-4 h-4" /> : s}
                  </div>
                  <span className={`text-xs hidden sm:block ${step >= s ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {s === 1 ? 'Pilih Paket' : s === 2 ? 'Pembayaran' : 'Konfirmasi'}
                  </span>
                  {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map((plan, i) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      disabled={pendingPayment}
                      className={`card-corporate p-6 text-left transition-all relative overflow-hidden ${
                        selectedPlan === plan.id 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'hover:border-primary/30'
                      } ${pendingPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {i === 1 && (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-[10px] font-bold rounded-bl-xl">
                          POPULER
                        </div>
                      )}
                      <Crown className={`w-8 h-8 mb-3 ${selectedPlan === plan.id ? 'text-amber-400' : 'text-muted-foreground'}`} />
                      <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
                      <div className="text-2xl font-bold text-primary mb-1">
                        {formatPrice(plan.price)}
                      </div>
                      <p className="text-xs text-muted-foreground">{plan.duration_days} hari</p>
                    </button>
                  ))}
                </div>

                <div className="card-corporate p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400" />
                    Keuntungan VIP
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { icon: Zap, text: 'Resolusi HD (720p & 1080p)' },
                      { icon: Shield, text: 'Akses tanpa batasan' },
                      { icon: Star, text: 'Badge VIP eksklusif' },
                      { icon: Crown, text: 'Prioritas dukungan' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <item.icon className="w-4 h-4 text-primary" />
                        </div>
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={() => setStep(2)} 
                    disabled={!selectedPlan || pendingPayment}
                    className="btn-primary px-8 disabled:opacity-50"
                  >
                    Lanjutkan
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="card-corporate p-4 flex items-center gap-3 bg-primary/5 border-primary/20">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="font-medium text-sm">{selectedPlanData?.name}</span>
                    <span className="text-muted-foreground text-sm"> - {formatPrice(selectedPlanData?.price || 0)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-4">Pilih Metode Pembayaran</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {methods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`card-corporate p-4 text-left transition-all ${
                          selectedMethod === method.id 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <CreditCard className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{method.label}</div>
                            {method.account_number && (
                              <div className="text-xs text-muted-foreground">{method.account_name} - {method.account_number}</div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedMethodData && (
                  <div className="card-corporate p-4">
                    <h4 className="font-medium text-sm mb-2">Instruksi Pembayaran</h4>
                    <p className="text-sm text-muted-foreground">{selectedMethodData.instructions}</p>
                    {selectedMethodData.account_number && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Transfer ke:</p>
                        <p className="font-mono font-bold text-lg">{selectedMethodData.account_number}</p>
                        <p className="text-sm text-muted-foreground">a.n. {selectedMethodData.account_name}</p>
                      </div>
                    )}
                    {selectedMethodData.qr_image_url && (
                      <div className="mt-3 flex justify-center">
                        <img src={selectedMethodData.qr_image_url} alt="QR Code" className="w-48 h-48 rounded-lg" />
                      </div>
                    )}
                    <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-xs text-amber-400 font-medium">
                        Total Pembayaran: {formatPrice(selectedPlanData?.price || 0)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nama Pengirim</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Nama sesuai akun pembayaran"
                      className="input-base w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Bukti Transfer (URL gambar)</label>
                    <input
                      type="text"
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      placeholder="https://contoh.com/bukti-transfer.jpg"
                      className="input-base w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Upload gambar bukti transfer ke Imgur atau layanan hosting gambar lainnya</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Catatan (opsional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Catatan tambahan untuk admin..."
                      className="input-base w-full min-h-[80px] resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setStep(1)} className="btn-secondary">
                    Kembali
                  </button>
                  <button 
                    onClick={() => setStep(3)} 
                    disabled={!selectedMethod}
                    className="btn-primary px-8 disabled:opacity-50"
                  >
                    Lanjutkan
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="card-corporate p-6">
                  <h3 className="font-bold mb-4">Ringkasan Pembayaran</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Paket</span>
                      <span className="font-medium">{selectedPlanData?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Durasi</span>
                      <span className="font-medium">{selectedPlanData?.duration_days} hari</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Metode</span>
                      <span className="font-medium">{selectedMethodData?.label}</span>
                    </div>
                    {senderName && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pengirim</span>
                        <span className="font-medium">{senderName}</span>
                      </div>
                    )}
                    <div className="border-t border-white/5 pt-3 flex justify-between">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-primary text-lg">{formatPrice(selectedPlanData?.price || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="card-corporate p-4 border-amber-500/20 bg-amber-500/5">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-400">Penting!</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Setelah mengirim, admin akan memverifikasi pembayaran kamu. 
                        VIP akan diaktifkan setelah pembayaran disetujui.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setStep(2)} className="btn-secondary">
                    Kembali
                  </button>
                  <button 
                    onClick={handleSubmit} 
                    disabled={submitting}
                    className="btn-primary px-8 disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Mengirim...
                      </span>
                    ) : 'Kirim Pembayaran'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
