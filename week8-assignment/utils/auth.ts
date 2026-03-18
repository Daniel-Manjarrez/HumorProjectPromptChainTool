import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Check if user is superadmin OR matrix_admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_superadmin, is_matrix_admin')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
  }

  if (profileError || (!profile?.is_superadmin && !profile?.is_matrix_admin)) {
    redirect('/unauthorized');
  }

  return user;
}
