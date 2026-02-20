import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ payments: [] });
  }

  try {
    const result = await pool.query(
      `SELECT pr.*, vp.name as plan_name, vp.duration_days, pm.label as method_label
       FROM payment_requests pr
       JOIN vip_plans vp ON pr.plan_id = vp.id
       JOIN payment_methods pm ON pr.method_id = pm.id
       WHERE pr.user_id = $1
       ORDER BY pr.created_at DESC`,
      [userId]
    );

    return NextResponse.json({ payments: result.rows });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ payments: [] });
  }
}
