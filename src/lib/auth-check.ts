import pool from './db';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function isAdminById(userId: string): Promise<boolean> {
  if (!userId) return false;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  
  return data?.role === 'admin';
}
