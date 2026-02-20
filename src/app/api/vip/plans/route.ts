import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT * FROM vip_plans WHERE is_active = true ORDER BY sort_order ASC'
    );
    return NextResponse.json({ plans: result.rows });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ plans: [] });
  }
}
