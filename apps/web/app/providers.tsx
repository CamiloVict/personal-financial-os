'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { ClerkApiBootstrap } from '@/shared/ui/ClerkApiBootstrap';

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  const inner = (
    <QueryClientProvider client={queryClient}>
      {publishableKey ? <ClerkApiBootstrap /> : null}
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );

  if (publishableKey) {
    return <ClerkProvider publishableKey={publishableKey}>{inner}</ClerkProvider>;
  }

  return inner;
}
