import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  @Public()
  @SkipThrottle()
  @Get()
  getHello() {
    return {
      message: 'Personal Finance OS API (PostgreSQL + Prisma)',
      status: 'OK',
    };
  }
}
