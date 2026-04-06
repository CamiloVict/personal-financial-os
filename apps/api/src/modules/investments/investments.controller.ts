import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { DbUserId } from '../../auth/db-user.decorator';
import { ConfidenceService } from '../confidence/confidence.service';
import { InvestmentsService } from './investments.service';

@Controller('investments')
export class InvestmentsController {
  constructor(
    private readonly investmentsService: InvestmentsService,
    private readonly confidenceService: ConfidenceService,
  ) {}

  @Get('portfolio-analytics')
  getPortfolioAnalytics(@DbUserId() userId: string) {
    return this.investmentsService.getPortfolioAnalytics(userId);
  }

  @Get('types')
  getInvestmentTypes(@DbUserId() userId: string) {
    return this.investmentsService.getTypes(userId);
  }

  @Post('types')
  createInvestmentType(@DbUserId() userId: string, @Body() body: Record<string, unknown>) {
    return this.investmentsService.createType({ ...body, userId });
  }

  @Put('types/:id')
  updateInvestmentType(
    @DbUserId() userId: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.investmentsService.updateType(userId, id, body);
  }

  @Delete('types/:id')
  deleteInvestmentType(@DbUserId() userId: string, @Param('id') id: string) {
    return this.investmentsService.deleteType(userId, id);
  }

  @Get('positions')
  async getInvestmentPositions(@DbUserId() userId: string) {
    const [positions, confidence] = await Promise.all([
      this.investmentsService.getPositions(userId),
      this.confidenceService.evaluateInvestments(userId),
    ]);
    return { positions, confidence };
  }

  @Post('positions')
  createPosition(@DbUserId() userId: string, @Body() body: Record<string, unknown>) {
    return this.investmentsService.createPosition({ ...body, userId });
  }

  @Put('positions/:id')
  updatePosition(
    @DbUserId() userId: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.investmentsService.updatePosition(userId, id, body);
  }

  @Delete('positions/:id')
  deletePosition(@DbUserId() userId: string, @Param('id') id: string) {
    return this.investmentsService.deletePosition(userId, id);
  }

  @Get('positions/:id/events')
  getEvents(@DbUserId() userId: string, @Param('id') positionId: string) {
    return this.investmentsService.getEvents(userId, positionId);
  }

  @Post('positions/:id/events')
  createEvent(
    @DbUserId() userId: string,
    @Param('id') positionId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.investmentsService.createEvent(userId, positionId, body);
  }
}
