'use client';

import { SignInButton, UserButton, useAuth } from '@clerk/nextjs';

export function NavAuth() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return null;
  }

  if (!isLoaded) {
    return <div className="w-8 h-8 shrink-0" aria-hidden />;
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {!isSignedIn ? (
        <SignInButton mode="modal">
          <button
            type="button"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-50"
          >
            Entrar
          </button>
        </SignInButton>
      ) : (
        <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />
      )}
    </div>
  );
}
