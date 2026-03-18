import { requireAdmin } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function CaptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const supabase = await createClient();
  const { id } = await params;

  const { data: caption, error } = await supabase
    .from('captions')
    .select(`
      *,
      images (
        url
      ),
      profiles (
        email
      ),
      humor_flavors (
        slug
      )
    `)
    .eq('id', id)
    .single();

  if (error || !caption) {
    notFound();
  }

  // Handle image URL (array or object)
  const imageUrl = Array.isArray(caption.images)
    ? caption.images[0]?.url
    : (caption.images as any)?.url;

  // Handle profile email
  const userEmail = Array.isArray(caption.profiles)
    ? caption.profiles[0]?.email
    : (caption.profiles as any)?.email;

  // Handle flavor slug
  const flavorSlug = Array.isArray(caption.humor_flavors)
    ? caption.humor_flavors[0]?.slug
    : (caption.humor_flavors as any)?.slug;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/captions" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2 font-medium">
            <ArrowLeft className="h-4 w-4" /> Back to Captions
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Caption Details</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">ID: {caption.id}</p>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/2">
                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-700 min-h-[300px]">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Context" className="w-full h-auto object-contain max-h-[500px]" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                      <span>No image available</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full md:w-1/2 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Content</label>
                  <p className="mt-1 text-xl font-serif text-gray-900 dark:text-white italic">
                    "{caption.content}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Created At</label>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(caption.created_datetime_utc).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Likes</label>
                    <div className="mt-1 flex items-center text-pink-500 font-bold">
                      {caption.like_count}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Author</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {userEmail || caption.profile_id}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Humor Flavor</label>
                    <div className="mt-1">
                      {flavorSlug ? (
                        <Link href={`/flavors`} className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 hover:underline">
                          {flavorSlug}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-500">{caption.humor_flavor_id || 'None'}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Raw Data</h3>
                  <pre className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-300 p-4 rounded-lg overflow-x-auto text-xs border border-gray-200 dark:border-gray-700">
                    {JSON.stringify(caption, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
