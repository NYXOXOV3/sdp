import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isAdminById } from '@/lib/auth-check';

export async function GET(req: NextRequest) {
  const adminId = req.nextUrl.searchParams.get('adminId');
  if (!adminId || !(await isAdminById(adminId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const result = await pool.query('SELECT * FROM vip_plans ORDER BY sort_order ASC');
    return NextResponse.json({ plans: result.rows });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ plans: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminId, name, description, price, duration_days, max_quality, is_active, sort_order } = body;

    if (!adminId || !(await isAdminById(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await pool.query(
      `INSERT INTO vip_plans (name, description, price, duration_days, max_quality, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description || '', price, duration_days, max_quality || 1080, is_active !== false, sort_order || 0]
    );

    return NextResponse.json({ plan: result.rows[0] });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminId, id, name, description, price, duration_days, max_quality, is_active, sort_order } = body;

    if (!adminId || !(await isAdminById(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await pool.query(
      `UPDATE vip_plans SET name=$1, description=$2, price=$3, duration_days=$4, max_quality=$5, is_active=$6, sort_order=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [name, description || '', price, duration_days, max_quality || 1080, is_active !== false, sort_order || 0, id]
    );

    return NextResponse.json({ plan: result.rows[0] });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminId, id } = body;

    if (!adminId || !(await isAdminById(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await pool.query('DELETE FROM vip_plans WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
