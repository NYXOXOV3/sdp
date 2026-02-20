import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ role: 'user' });
  }

  try {
    const result = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length > 0) {
      return NextResponse.json({ role: result.rows[0].role });
    }

    await pool.query(
      'INSERT INTO users (id, role) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
      [userId, 'user']
    );
    return NextResponse.json({ role: 'user' });
  } catch (error) {
    console.error('[user/role] Error:', error);
    return NextResponse.json({ role: 'user' });
  }
}
