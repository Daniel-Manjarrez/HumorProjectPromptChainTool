import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Props = {
  fallbackUrl: string;
  label: string;
};

export default function BackButton({ fallbackUrl, label }: Props) {
  return (
    <Link
      href={fallbackUrl}
      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2 font-medium"
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </Link>
  );
}
