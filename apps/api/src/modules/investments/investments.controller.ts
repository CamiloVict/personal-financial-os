import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { InvestmentsService } from './investments.service';

@Controller('investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  // --- TYPES ---
  @Get('types')
  getInvestmentTypes(@Query('userId') userId?: string) {
    return this.investmentsService.getTypes(userId);
  }

  @Post('types')
  createInvestmentType(@Body() body: any) {
    return this.investmentsService.createType(body);
  }

  @Put('types/:id')
  updateInvestmentType(@Param('id') id: string, @Body() body: any) {
    return this.investmentsService.updateType(id, body);
  }

  @Delete('types/:id')
  deleteInvestmentType(@Param('id') id: string) {
    return this.investmentsService.deleteType(id);
  }

  // --- POSITIONS ---
  @Get('positions')
  getInvestmentPositions(@Query('userId') userId?: string) {
    return this.investmentsService.getPositions(userId);
  }

  @Post('positions')
  createPosition(@Body() body: any) {
    return this.investmentsService.createPosition(body);
  }

  @Put('positions/:id')
  updatePosition(@Param('id') id: string, @Body() body: any) {
    return this.investmentsService.updatePosition(id, body);
  }

  @Delete('positions/:id')
  deletePosition(@Param('id') id: string) {
    return this.investmentsService.deletePosition(id);
  }

  // --- EVENTS ---
  @Get('positions/:id/events')
  getEvents(@Param('id') positionId: string) {
    return this.investmentsService.getEvents(positionId);
  }

  @Post('positions/:id/events')
  createEvent(@Param('id') positionId: string, @Body() body: any) {
    return this.investmentsService.createEvent(positionId, body);
  }
}