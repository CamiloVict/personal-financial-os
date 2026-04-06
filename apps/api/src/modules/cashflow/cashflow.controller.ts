import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { DbUserId } from '../../auth/db-user.decorator';
import { CashflowService } from './cashflow.service';

@Controller()
export class CashflowController {
  constructor(private readonly cashflowService: CashflowService) {}

  @Get('categories')
  getCategories(@DbUserId() userId: string) {
    return this.cashflowService.getCategories(userId);
  }

  @Post('categories')
  createCategory(@DbUserId() userId: string, @Body() body: Record<string, unknown>) {
    return this.cashflowService.createCategory({ ...body, userId });
  }

  @Get('cashflow/streams')
  getCashflowStreams(@DbUserId() userId: string) {
    return this.cashflowService.getStreams(userId);
  }

  @Post('cashflow/streams')
  createCashflowStream(@DbUserId() userId: string, @Body() body: Record<string, unknown>) {
    return this.cashflowService.createStream({ ...body, userId });
  }

  @Put('cashflow/streams/:id')
  updateCashflowStream(
    @DbUserId() userId: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.cashflowService.updateStream(userId, id, body);
  }

  @Delete('cashflow/streams/:id')
  deleteCashflowStream(@DbUserId() userId: string, @Param('id') id: string) {
    return this.cashflowService.deleteStream(userId, id);
  }

  @Get('cashflow/streams/:id/events')
  getCashflowEvents(@DbUserId() userId: string, @Param('id') streamId: string) {
    return this.cashflowService.getEvents(userId, streamId);
  }

  @Post('cashflow/streams/:id/events')
  createCashflowEvent(
    @DbUserId() userId: string,
    @Param('id') streamId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.cashflowService.createEvent(userId, streamId, body);
  }
}
