import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      message: 'Personal Finance OS API (PostgreSQL + Prisma)',
      status: 'OK',
    };
  }
}
