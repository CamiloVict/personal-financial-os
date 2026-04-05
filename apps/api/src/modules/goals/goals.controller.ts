import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DbUserId } from '../../auth/db-user.decorator';
import { GoalsService } from './goals.service';

@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  getGoals(@DbUserId() userId: string) {
    return this.goalsService.findAllGoals(userId);
  }

  @Post()
  createGoal(@DbUserId() userId: string, @Body() body: Record<string, unknown>) {
    return this.goalsService.createGoal({ ...body, userId });
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
