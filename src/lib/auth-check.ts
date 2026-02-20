import pool from './db';

export async function isAdminById(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const result = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    return result.rows.length > 0 && result.rows[0].role === 'admin';
  } catch (error) {
    console.error('[auth-check] Error checking admin status:', error);
    return false;
  }
}
