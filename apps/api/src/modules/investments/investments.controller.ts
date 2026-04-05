import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { DbUserId } from '../../auth/db-user.decorator';
import { InvestmentsService } from './investments.service';

@Controller('investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Get('types')
  getInvestmentTypes(@DbUserId() userId: string) {
    return this.investmentsService.getTypes(userId);
  }

  @Post('types')
  createInvestmentType(@DbUserId() userId: string, @Body() body: Record<string, unknown>) {
    return this.investmentsService.createType({ ...body, userId });
  }

  @Put('types/:id')
  updateInvestmentType(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.investmentsService.updateType(id, body);
  }

  @Delete('types/:id')
  deleteInvestmentType(@Param('id') id: string) {
    return this.investmentsService.deleteType(id);
  }

  @Get('positions')
  getInvestmentPositions(@DbUserId() userId: string) {
    return this.investmentsService.getPositions(userId);
  }

  @Post('positions')
  createPosition(@DbUserId() userId: string, @Body() body: Record<string, unknown>) {
    return this.investmentsService.createPosition({ ...body, userId });
  }

  @Put('positions/:id')
  updatePosition(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.investmentsService.updatePosition(id, body);
  }

  @Delete('positions/:id')
  deletePosition(@Param('id') id: string) {
    return this.investmentsService.deletePosition(id);
  }

  @Get('positions/:id/events')
  getEvents(@Param('id') positionId: string) {
    return this.investmentsService.getEvents(positionId);
  }

  @Post('positions/:id/events')
  createEvent(@Param('id') positionId: string, @Body() body: Record<string, unknown>) {
    return this.investmentsService.createEvent(positionId, body);
  }
}
