import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isAdminById } from '@/lib/auth-check';

export async function GET(req: NextRequest) {
  const adminId = req.nextUrl.searchParams.get('adminId');
  if (!adminId || !(await isAdminById(adminId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const result = await pool.query('SELECT * FROM payment_methods ORDER BY sort_order ASC');
    return NextResponse.json({ methods: result.rows });
  } catch (error) {
    console.error('Error fetching methods:', error);
    return NextResponse.json({ methods: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminId, type, label, account_name, account_number, qr_image_url, instructions, is_active, sort_order } = body;

    if (!adminId || !(await isAdminById(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await pool.query(
      `INSERT INTO payment_methods (type, label, account_name, account_number, qr_image_url, instructions, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [type, label, account_name || '', account_number || '', qr_image_url || '', instructions || '', is_active !== false, sort_order || 0]
    );

    return NextResponse.json({ method: result.rows[0] });
  } catch (error) {
    console.error('Error creating method:', error);
    return NextResponse.json({ error: 'Failed to create method' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminId, id, type, label, account_name, account_number, qr_image_url, instructions, is_active, sort_order } = body;

    if (!adminId || !(await isAdminById(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await pool.query(
      `UPDATE payment_methods SET type=$1, label=$2, account_name=$3, account_number=$4, qr_image_url=$5, instructions=$6, is_active=$7, sort_order=$8
       WHERE id=$9 RETURNING *`,
      [type, label, account_name || '', account_number || '', qr_image_url || '', instructions || '', is_active !== false, sort_order || 0, id]
    );

    return NextResponse.json({ method: result.rows[0] });
  } catch (error) {
    console.error('Error updating method:', error);
    return NextResponse.json({ error: 'Failed to update method' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminId, id } = body;

    if (!adminId || !(await isAdminById(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await pool.query('DELETE FROM payment_methods WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting method:', error);
    return NextResponse.json({ error: 'Failed to delete method' }, { status: 500 });
  }
}
