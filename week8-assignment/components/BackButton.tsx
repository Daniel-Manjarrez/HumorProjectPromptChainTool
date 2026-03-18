'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

type Props = {
  fallbackUrl: string;
  label: string;
};

export default function BackButton({ fallbackUrl, label }: Props) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2 font-medium cursor-pointer"
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </button>
  );
}
