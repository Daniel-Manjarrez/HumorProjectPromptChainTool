'use client';

import { useRouter } from 'next/navigation';

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
    <a
      href={fallbackUrl}
      onClick={handleBack}
      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2 cursor-pointer font-medium"
    >
      ← {label}
    </a>
  );
}
