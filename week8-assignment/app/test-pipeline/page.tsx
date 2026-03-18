import { requireAdmin } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import TesterClient from './TesterClient';
import { TestTube2, ArrowLeft } from 'lucide-react';

export default async function TestPipelinePage() {
  await requireAdmin();
  const supabase = await createClient();

  // Fetch available flavors
  const { data: flavors, error: flavorsError } = await supabase
    .from('humor_flavors')
    .select('*')
    .order('id', { ascending: true });

  // Fetch some recent images to use as a test set
  const { data: images, error: imagesError } = await supabase
    .from('images')
    .select('*')
    .not('url', 'is', null)
    .order('created_datetime_utc', { ascending: false })
    .limit(24);

  if (flavorsError || imagesError) {
    return <div>Error loading data for tester.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2 font-medium">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <TestTube2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Pipeline Tester
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Select an image and a humor flavor to test your prompt chains via the live API.
          </p>
        </div>

        <TesterClient flavors={flavors || []} initialImages={images || []} />
      </div>
    </div>
  );
}
