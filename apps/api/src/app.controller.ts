import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getHello() {
    return {
      message: 'Personal Finance OS API (PostgreSQL + Prisma)',
      status: 'OK',
    };
  }
}
