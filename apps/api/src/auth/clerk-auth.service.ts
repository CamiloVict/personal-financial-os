import { Injectable, UnauthorizedException } from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { PrismaService } from '../infrastructure/database/prisma.service';

export interface ClerkSessionClaims {
  sub: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

@Injectable()
export class ClerkAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async verifyBearerToken(authorizationHeader: string | undefined): Promise<ClerkSessionClaims> {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }
    const token = authorizationHeader.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Empty bearer token');
    }
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new UnauthorizedException('Server missing CLERK_SECRET_KEY');
    }
    try {
      const payload = await verifyToken(token, { secretKey });
      const claims = payload as Record<string, unknown>;
      const email =
        typeof claims.email === 'string'
          ? claims.email
          : typeof claims.primary_email_address === 'string'
            ? claims.primary_email_address
            : undefined;
      const firstName =
        typeof claims.given_name === 'string'
          ? claims.given_name
          : typeof claims.first_name === 'string'
            ? claims.first_name
            : undefined;
      const lastName =
        typeof claims.family_name === 'string'
          ? claims.family_name
          : typeof claims.last_name === 'string'
            ? claims.last_name
            : undefined;
      return {
        sub: payload.sub,
        email,
        firstName,
        lastName,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Returns Prisma User.id for the Clerk user, creating a row on first sign-in.
   */
  async resolveDbUserId(claims: ClerkSessionClaims): Promise<string> {
    const { sub: clerkUserId, email, firstName, lastName } = claims;
    const existing = await this.prisma.user.findUnique({
      where: { clerkUserId },
    });
    if (existing) {
      return existing.id;
    }
    const safeLocalPart = clerkUserId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const resolvedEmail = email ?? `${safeLocalPart}@users.clerk.pfo.local`;
    try {
      const user = await this.prisma.user.create({
        data: {
          email: resolvedEmail,
          clerkUserId,
          firstName: firstName ?? null,
          lastName: lastName ?? null,
        },
      });
      return user.id;
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'P2002') {
        const byEmail = await this.prisma.user.findUnique({
          where: { email: resolvedEmail },
        });
        if (byEmail) {
          return this.prisma.user
            .update({
              where: { id: byEmail.id },
              data: { clerkUserId },
            })
            .then((u) => u.id);
        }
      }
      throw e;
    }
  }
}
