import { requireAdmin } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import FlavorListClient from './FlavorListClient';

export default async function FlavorsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: flavors, error } = await supabase
    .from('humor_flavors')
    .select('*, humor_flavor_steps(count)')
    .order('id', { ascending: true });

  if (error) {
    return <div>Error loading flavors: {error.message}</div>;
  }

  // Transform data to make count easier to access
  const processedFlavors = flavors.map(f => ({
    ...f,
    step_count: f.humor_flavor_steps?.[0]?.count || 0
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2">
            ← Back to Dashboard
          </Link>
        </div>

        <FlavorListClient initialFlavors={processedFlavors} />
      </div>
    </div>
  );
}
