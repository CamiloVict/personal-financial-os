import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { GoalsService } from './goals.service';

@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  getGoals(@Query('userId') userId?: string) {
    return this.goalsService.findAllGoals(userId);
  }

  @Post()
  createGoal(@Body() body: any) {
    return this.goalsService.createGoal(body);
  }

  @Get(':id/recommendations')
  getRecommendations(@Param('id') id: string) {
    return this.goalsService.getGoalRecommendations(id);
  }

  @Post(':id/recommendations/recalculate')
  recalculateRecommendations(@Param('id') id: string) {
    return this.goalsService.recalculateRecommendations(id);
  }
}