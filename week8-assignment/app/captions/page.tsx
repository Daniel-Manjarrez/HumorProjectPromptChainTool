import { requireAdmin } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import FlavorFilter from './FlavorFilter';

export default async function CaptionsPage({ searchParams }: { searchParams: Promise<{ flavor?: string }> }) {
  await requireAdmin();
  const supabase = await createClient();
  const params = await searchParams;
  const flavorFilter = params.flavor;

  // Fetch Flavors for Filter Dropdown
  const { data: flavors } = await supabase.from('humor_flavors').select('id, slug').order('slug');

  // Fetch Captions
  let query = supabase
    .from('captions')
    .select(`
      *,
      humor_flavors ( slug ),
      profiles ( email )
    `)
    .order('created_datetime_utc', { ascending: false })
    .limit(50); // Limit for simple view, could add pagination later

  if (flavorFilter) {
    query = query.eq('humor_flavor_id', flavorFilter);
  }

  const { data: captions, error } = await query;

  if (error) return <div>Error loading captions: {error.message}</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2 font-medium">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          {/* Flavor Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Flavor:</label>
            <FlavorFilter flavors={flavors || []} currentFlavor={flavorFilter || ''} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Generated Captions</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Content</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Flavor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {captions?.map((caption) => {
                  const flavorSlug = Array.isArray(caption.humor_flavors) ? caption.humor_flavors[0]?.slug : (caption.humor_flavors as any)?.slug;
                  const authorEmail = Array.isArray(caption.profiles) ? caption.profiles[0]?.email : (caption.profiles as any)?.email;

                  return (
                    <tr key={caption.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white font-serif italic">"{caption.content}"</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                          {flavorSlug || `ID: ${caption.humor_flavor_id}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {authorEmail || caption.profile_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(caption.created_datetime_utc).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
                {captions?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 italic">
                      No captions found for this flavor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
