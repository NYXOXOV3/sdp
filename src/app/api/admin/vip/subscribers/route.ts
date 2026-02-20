import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isAdminById } from '@/lib/auth-check';

export async function GET(req: NextRequest) {
  const adminId = req.nextUrl.searchParams.get('adminId');

  if (!adminId || !(await isAdminById(adminId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const result = await pool.query(
      `SELECT vs.*, vp.name as plan_name, vp.max_quality,
              pr.user_email
       FROM vip_subscriptions vs
       JOIN vip_plans vp ON vs.plan_id = vp.id
       LEFT JOIN payment_requests pr ON pr.user_id = vs.user_id AND pr.status = 'approved'
       WHERE vs.status = 'active' AND vs.ends_at > NOW()
       ORDER BY vs.ends_at DESC`
    );

    return NextResponse.json({ subscribers: result.rows });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json({ subscribers: [] });
  }
}
