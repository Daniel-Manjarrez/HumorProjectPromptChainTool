'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function FlavorFilter({
  flavors,
  currentFlavor
}: {
  flavors: { id: number, slug: string }[],
  currentFlavor: string
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <select
      value={currentFlavor}
      onChange={(e) => {
        const val = e.target.value;
        const params = new URLSearchParams(searchParams.toString());

        if (val) {
          params.set('flavor', val);
        } else {
          params.delete('flavor');
        }

        // Reset page when filter changes
        params.delete('page');

        // Use replace instead of push to avoid cluttering history
        router.replace(`${pathname}?${params.toString()}`);
      }}
      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 cursor-pointer"
    >
      <option value="">All Flavors</option>
      {flavors?.map(f => (
        <option key={f.id} value={f.id}>{f.slug}</option>
      ))}
    </select>
  );
}
