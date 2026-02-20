import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isAdminById } from '@/lib/auth-check';

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') || 'all';
  const adminId = req.nextUrl.searchParams.get('adminId');

  if (!adminId || !(await isAdminById(adminId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    let query = `
      SELECT pr.*, vp.name as plan_name, vp.duration_days, vp.price as plan_price,
             pm.label as method_label, pm.type as method_type
      FROM payment_requests pr
      JOIN vip_plans vp ON pr.plan_id = vp.id
      JOIN payment_methods pm ON pr.method_id = pm.id
    `;
    const params: string[] = [];

    if (status !== 'all') {
      query += ' WHERE pr.status = $1';
      params.push(status);
    }

    query += ' ORDER BY pr.created_at DESC';

    const result = await pool.query(query, params);
    return NextResponse.json({ payments: result.rows });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ payments: [] });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId, action, adminId, adminNotes } = body;

    if (!paymentId || !action || !adminId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!(await isAdminById(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (action === 'approve') {
      const paymentResult = await pool.query(
        'SELECT * FROM payment_requests WHERE id = $1',
        [paymentId]
      );

      if (paymentResult.rows.length === 0) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

      const payment = paymentResult.rows[0];

      const planResult = await pool.query('SELECT * FROM vip_plans WHERE id = $1', [payment.plan_id]);
      if (planResult.rows.length === 0) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }

      const plan = planResult.rows[0];

      await pool.query(
        `UPDATE payment_requests SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), admin_notes = $2 WHERE id = $3`,
        [adminId, adminNotes || '', paymentId]
      );

      const existingSub = await pool.query(
        `SELECT * FROM vip_subscriptions WHERE user_id = $1 AND status = 'active' AND ends_at > NOW() ORDER BY ends_at DESC LIMIT 1`,
        [payment.user_id]
      );

      let startsAt = new Date();
      if (existingSub.rows.length > 0) {
        startsAt = new Date(existingSub.rows[0].ends_at);
      }

      const endsAt = new Date(startsAt);
      endsAt.setDate(endsAt.getDate() + plan.duration_days);

      await pool.query(
        `INSERT INTO vip_subscriptions (user_id, plan_id, status, starts_at, ends_at)
         VALUES ($1, $2, 'active', $3, $4)`,
        [payment.user_id, payment.plan_id, startsAt.toISOString(), endsAt.toISOString()]
      );

      return NextResponse.json({ success: true, message: 'Payment approved and subscription activated' });
    } else if (action === 'reject') {
      await pool.query(
        `UPDATE payment_requests SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), admin_notes = $2 WHERE id = $3`,
        [adminId, adminNotes || '', paymentId]
      );

      return NextResponse.json({ success: true, message: 'Payment rejected' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
