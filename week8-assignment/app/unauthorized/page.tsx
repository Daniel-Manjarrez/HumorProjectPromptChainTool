import SignOutButton from '@/components/SignOutButton';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold text-red-600 dark:text-red-500">Unauthorized</h1>
        <p className="text-gray-600 dark:text-gray-400">
          You do not have permission to access this page. You must be a Superadmin or Matrix Admin.
        </p>
        <div className="flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
