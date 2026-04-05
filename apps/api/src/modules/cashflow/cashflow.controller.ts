import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { CashflowService } from './cashflow.service';

@Controller()
export class CashflowController {
  constructor(private readonly cashflowService: CashflowService) {}

  // --- CATEGORIES ---
  @Get('categories')
  getCategories(@Query('userId') userId?: string) {
    return this.cashflowService.getCategories(userId);
  }

  @Post('categories')
  createCategory(@Body() body: any) {
    return this.cashflowService.createCategory(body);
  }

  // --- CASHFLOW STREAMS ---
  @Get('cashflow/streams')
  getCashflowStreams(@Query('userId') userId?: string) {
    return this.cashflowService.getStreams(userId);
  }

  @Post('cashflow/streams')
  createCashflowStream(@Body() body: any) {
    return this.cashflowService.createStream(body);
  }

  @Put('cashflow/streams/:id')
  updateCashflowStream(@Param('id') id: string, @Body() body: any) {
    return this.cashflowService.updateStream(id, body);
  }

  @Delete('cashflow/streams/:id')
  deleteCashflowStream(@Param('id') id: string) {
    return this.cashflowService.deleteStream(id);
  }

  // --- CASHFLOW EVENTS ---
  @Get('cashflow/streams/:id/events')
  getCashflowEvents(@Param('id') streamId: string) {
    return this.cashflowService.getEvents(streamId);
  }

  @Post('cashflow/streams/:id/events')
  createCashflowEvent(@Param('id') streamId: string, @Body() body: any) {
    return this.cashflowService.createEvent(streamId, body);
  }
}