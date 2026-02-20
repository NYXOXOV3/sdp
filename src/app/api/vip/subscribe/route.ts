import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userEmail, planId, methodId, senderName, proofUrl, notes } = body;

    if (!userId || !planId || !methodId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const planResult = await pool.query('SELECT * FROM vip_plans WHERE id = $1 AND is_active = true', [planId]);
    if (planResult.rows.length === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const plan = planResult.rows[0];

    const existingPending = await pool.query(
      `SELECT COUNT(*) as count FROM payment_requests WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    );
    if (parseInt(existingPending.rows[0]?.count || '0') > 0) {
      return NextResponse.json({ error: 'Kamu sudah memiliki pembayaran yang sedang menunggu persetujuan' }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO payment_requests (user_id, user_email, plan_id, method_id, amount, sender_name, proof_url, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, userEmail, planId, methodId, plan.price, senderName || '', proofUrl || '', notes || '']
    );

    return NextResponse.json({ success: true, message: 'Pembayaran berhasil diajukan. Menunggu persetujuan admin.' });
  } catch (error) {
    console.error('Error creating payment request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
