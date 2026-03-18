'use client';

import { useRouter } from 'next/navigation';

export default function FlavorFilter({
  flavors,
  currentFlavor
}: {
  flavors: { id: number, slug: string }[],
  currentFlavor: string
}) {
  const router = useRouter();

  return (
    <select
      value={currentFlavor}
      onChange={(e) => {
        const val = e.target.value;
        if (val) {
          router.push(`/captions?flavor=${val}`);
        } else {
          router.push(`/captions`);
        }
      }}
      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
    >
      <option value="">All Flavors</option>
      {flavors?.map(f => (
        <option key={f.id} value={f.id}>{f.slug}</option>
      ))}
    </select>
  );
}
