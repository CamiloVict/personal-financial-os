import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest, type NextFetchEvent } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/glossary(.*)',
]);

const clerk = clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) return;
  await auth.protect();
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return NextResponse.next();
  }
  return clerk(request, event);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
