import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT * FROM payment_methods WHERE is_active = true ORDER BY sort_order ASC'
    );
    return NextResponse.json({ methods: result.rows });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json({ methods: [] });
  }
}
