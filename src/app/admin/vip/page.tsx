"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Plus, Trash2, Edit, Crown, CreditCard, Eye, EyeOff, ArrowLeft, Users } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  max_quality: number;
  is_active: boolean;
  sort_order: number;
}

interface Method {
  id: string;
  type: string;
  label: string;
  account_name: string;
  account_number: string;
  qr_image_url: string;
  instructions: string;
  is_active: boolean;
  sort_order: number;
}

interface Subscriber {
  id: string;
  user_id: string;
  user_email: string;
  plan_name: string;
  status: string;
  starts_at: string;
  ends_at: string;
}

export default function AdminVipPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'plans' | 'methods' | 'subscribers'>('plans');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showMethodForm, setShowMethodForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editingMethod, setEditingMethod] = useState<Method | null>(null);

  const [planForm, setPlanForm] = useState({ name: '', description: '', price: '', duration_days: '30', max_quality: '1080', is_active: true, sort_order: '0' });
  const [methodForm, setMethodForm] = useState({ type: 'qris', label: '', account_name: '', account_number: '', qr_image_url: '', instructions: '', is_active: true, sort_order: '0' });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  const fetchAll = async () => {
    if (!user) return;
    try {
      const [plansRes, methodsRes, subsRes] = await Promise.all([
        fetch(`/api/admin/vip/plans?adminId=${user.id}`),
        fetch(`/api/admin/vip/methods?adminId=${user.id}`),
        fetch(`/api/admin/vip/subscribers?adminId=${user.id}`),
      ]);
      const plansData = await plansRes.json();
      const methodsData = await methodsRes.json();
      const subsData = await subsRes.json();
      setPlans(plansData.plans || []);
      setMethods(methodsData.methods || []);
      setSubscribers(subsData.subscribers || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    if (!user) return;
    const url = '/api/admin/vip/plans';
    const method = editingPlan ? 'PUT' : 'POST';
    const body = {
      adminId: user.id,
      ...(editingPlan ? { id: editingPlan.id } : {}),
      name: planForm.name,
      description: planForm.description,
      price: parseFloat(planForm.price),
      duration_days: parseInt(planForm.duration_days),
      max_quality: parseInt(planForm.max_quality),
      is_active: planForm.is_active,
      sort_order: parseInt(planForm.sort_order),
    };

    try {
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setShowPlanForm(false);
      setEditingPlan(null);
      setPlanForm({ name: '', description: '', price: '', duration_days: '30', max_quality: '1080', is_active: true, sort_order: '0' });
      fetchAll();
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };

  const deletePlan = async (id: string) => {
    if (!user || !confirm('Hapus paket ini?')) return;
    try {
      await fetch('/api/admin/vip/plans', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId: user.id, id }) });
      fetchAll();
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const saveMethod = async () => {
    if (!user) return;
    const url = '/api/admin/vip/methods';
    const method = editingMethod ? 'PUT' : 'POST';
    const body = {
      adminId: user.id,
      ...(editingMethod ? { id: editingMethod.id } : {}),
      ...methodForm,
      sort_order: parseInt(methodForm.sort_order),
    };

    try {
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setShowMethodForm(false);
      setEditingMethod(null);
      setMethodForm({ type: 'qris', label: '', account_name: '', account_number: '', qr_image_url: '', instructions: '', is_active: true, sort_order: '0' });
      fetchAll();
    } catch (error) {
      console.error('Error saving method:', error);
    }
  };

  const deleteMethod = async (id: string) => {
    if (!user || !confirm('Hapus metode ini?')) return;
    try {
      await fetch('/api/admin/vip/methods', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId: user.id, id }) });
      fetchAll();
    } catch (error) {
      console.error('Error deleting method:', error);
    }
  };

  const editPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      duration_days: plan.duration_days.toString(),
      max_quality: plan.max_quality.toString(),
      is_active: plan.is_active,
      sort_order: plan.sort_order.toString(),
    });
    setShowPlanForm(true);
  };

  const editMethod = (m: Method) => {
    setEditingMethod(m);
    setMethodForm({
      type: m.type,
      label: m.label,
      account_name: m.account_name || '',
      account_number: m.account_number || '',
      qr_image_url: m.qr_image_url || '',
      instructions: m.instructions || '',
      is_active: m.is_active,
      sort_order: m.sort_order.toString(),
    });
    setShowMethodForm(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

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

        <div className="flex items-center gap-3 mb-6">
          <Crown className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-bold">VIP Management</h1>
        </div>

        <div className="flex gap-2 mb-6">
          {(['plans', 'methods', 'subscribers'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground bg-muted/30'}`}>
              {tab === 'plans' ? 'Paket VIP' : tab === 'methods' ? 'Metode Bayar' : 'Subscriber'}
            </button>
          ))}
        </div>

        {activeTab === 'plans' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Paket VIP</h2>
              <button onClick={() => { setEditingPlan(null); setPlanForm({ name: '', description: '', price: '', duration_days: '30', max_quality: '1080', is_active: true, sort_order: '0' }); setShowPlanForm(true); }} className="btn-primary gap-2 text-sm">
                <Plus className="w-4 h-4" /> Tambah Paket
              </button>
            </div>

            {showPlanForm && (
              <div className="card-corporate p-6 mb-4">
                <h3 className="font-bold mb-4">{editingPlan ? 'Edit Paket' : 'Tambah Paket Baru'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nama</label>
                    <input type="text" value={planForm.name} onChange={(e) => setPlanForm({...planForm, name: e.target.value})} className="input-base w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Harga (IDR)</label>
                    <input type="number" value={planForm.price} onChange={(e) => setPlanForm({...planForm, price: e.target.value})} className="input-base w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Durasi (hari)</label>
                    <input type="number" value={planForm.duration_days} onChange={(e) => setPlanForm({...planForm, duration_days: e.target.value})} className="input-base w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Resolusi</label>
                    <input type="number" value={planForm.max_quality} onChange={(e) => setPlanForm({...planForm, max_quality: e.target.value})} className="input-base w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Urutan</label>
                    <input type="number" value={planForm.sort_order} onChange={(e) => setPlanForm({...planForm, sort_order: e.target.value})} className="input-base w-full" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={planForm.is_active} onChange={(e) => setPlanForm({...planForm, is_active: e.target.checked})} />
                    <label className="text-sm">Aktif</label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Deskripsi</label>
                    <textarea value={planForm.description} onChange={(e) => setPlanForm({...planForm, description: e.target.value})} className="input-base w-full min-h-[60px] resize-none" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={savePlan} className="btn-primary text-sm">Simpan</button>
                  <button onClick={() => { setShowPlanForm(false); setEditingPlan(null); }} className="btn-secondary text-sm">Batal</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan.id} className="card-corporate p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Crown className={`w-5 h-5 ${plan.is_active ? 'text-amber-400' : 'text-muted-foreground'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{plan.name}</span>
                        {!plan.is_active && <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Nonaktif</span>}
                      </div>
                      <span className="text-sm text-muted-foreground">{formatPrice(plan.price)} / {plan.duration_days} hari - Max {plan.max_quality}p</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editPlan(plan)} className="btn-icon"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => deletePlan(plan.id)} className="btn-icon text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'methods' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Metode Pembayaran</h2>
              <button onClick={() => { setEditingMethod(null); setMethodForm({ type: 'qris', label: '', account_name: '', account_number: '', qr_image_url: '', instructions: '', is_active: true, sort_order: '0' }); setShowMethodForm(true); }} className="btn-primary gap-2 text-sm">
                <Plus className="w-4 h-4" /> Tambah Metode
              </button>
            </div>

            {showMethodForm && (
              <div className="card-corporate p-6 mb-4">
                <h3 className="font-bold mb-4">{editingMethod ? 'Edit Metode' : 'Tambah Metode Baru'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipe</label>
                    <select value={methodForm.type} onChange={(e) => setMethodForm({...methodForm, type: e.target.value})} className="input-base w-full">
                      <option value="qris">QRIS</option>
                      <option value="gopay">GoPay</option>
                      <option value="dana">DANA</option>
                      <option value="ovo">OVO</option>
                      <option value="shopeepay">ShopeePay</option>
                      <option value="bank_transfer">Transfer Bank</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Label</label>
                    <input type="text" value={methodForm.label} onChange={(e) => setMethodForm({...methodForm, label: e.target.value})} className="input-base w-full" placeholder="contoh: Transfer Bank BCA" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nama Akun</label>
                    <input type="text" value={methodForm.account_name} onChange={(e) => setMethodForm({...methodForm, account_name: e.target.value})} className="input-base w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nomor Akun</label>
                    <input type="text" value={methodForm.account_number} onChange={(e) => setMethodForm({...methodForm, account_number: e.target.value})} className="input-base w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">URL QR Image</label>
                    <input type="text" value={methodForm.qr_image_url} onChange={(e) => setMethodForm({...methodForm, qr_image_url: e.target.value})} className="input-base w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Urutan</label>
                    <input type="number" value={methodForm.sort_order} onChange={(e) => setMethodForm({...methodForm, sort_order: e.target.value})} className="input-base w-full" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Instruksi</label>
                    <textarea value={methodForm.instructions} onChange={(e) => setMethodForm({...methodForm, instructions: e.target.value})} className="input-base w-full min-h-[60px] resize-none" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={methodForm.is_active} onChange={(e) => setMethodForm({...methodForm, is_active: e.target.checked})} />
                    <label className="text-sm">Aktif</label>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={saveMethod} className="btn-primary text-sm">Simpan</button>
                  <button onClick={() => { setShowMethodForm(false); setEditingMethod(null); }} className="btn-secondary text-sm">Batal</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {methods.map((m) => (
                <div key={m.id} className="card-corporate p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CreditCard className={`w-5 h-5 ${m.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{m.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{m.type}</span>
                        {!m.is_active && <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">Nonaktif</span>}
                      </div>
                      <span className="text-sm text-muted-foreground">{m.account_name} {m.account_number && `- ${m.account_number}`}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editMethod(m)} className="btn-icon"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => deleteMethod(m.id)} className="btn-icon text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'subscribers' && (
          <div>
            <h2 className="text-lg font-bold mb-4">Subscriber Aktif</h2>
            {subscribers.length === 0 ? (
              <div className="card-corporate p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Belum ada subscriber aktif</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subscribers.map((sub) => (
                  <div key={sub.id} className="card-corporate p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span className="font-medium text-sm">{sub.user_email || sub.user_id.slice(0, 8)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{sub.plan_name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">Aktif</span>
                      <p className="text-xs text-muted-foreground mt-1">s/d {formatDate(sub.ends_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
