import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ isVip: false, plan: null, subscription: null, pendingPayment: false });
  }

  try {
    const subResult = await pool.query(
      `SELECT vs.*, vp.name as plan_name, vp.max_quality, vp.description as plan_description
       FROM vip_subscriptions vs 
       JOIN vip_plans vp ON vs.plan_id = vp.id 
       WHERE vs.user_id = $1 AND vs.status = 'active' AND vs.ends_at > NOW()
       ORDER BY vs.ends_at DESC LIMIT 1`,
      [userId]
    );

    const pendingResult = await pool.query(
      `SELECT COUNT(*) as count FROM payment_requests WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    );

    const activeSub = subResult.rows[0] || null;
    const hasPending = parseInt(pendingResult.rows[0]?.count || '0') > 0;

    if (activeSub) {
      return NextResponse.json({
        isVip: true,
        plan: {
          id: activeSub.plan_id,
          name: activeSub.plan_name,
          max_quality: activeSub.max_quality,
        },
        subscription: {
          id: activeSub.id,
          status: activeSub.status,
          starts_at: activeSub.starts_at,
          ends_at: activeSub.ends_at,
        },
        pendingPayment: hasPending,
      });
    }

    return NextResponse.json({
      isVip: false,
      plan: null,
      subscription: null,
      pendingPayment: hasPending,
    });
  } catch (error) {
    console.error('Error fetching VIP status:', error);
    return NextResponse.json({ isVip: false, plan: null, subscription: null, pendingPayment: false });
  }
}
