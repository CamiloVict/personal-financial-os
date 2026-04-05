import { Module } from '@nestjs/common';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { ClerkAuthService } from './clerk-auth.service';
import { ClerkAuthGuard } from './clerk-auth.guard';

@Module({
  imports: [PrismaModule],
  providers: [ClerkAuthService, ClerkAuthGuard],
  exports: [ClerkAuthService, ClerkAuthGuard],
})
export class AuthModule {}
