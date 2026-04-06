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

  @Get(':id/projection')
  getProjection(@Param('id') id: string, @DbUserId() userId: string) {
    return this.goalsService.getGoalProjection(id, userId);
  }

  @Get(':id/scenarios')
  getScenarios(@Param('id') id: string) {
    return this.goalsService.getLatestScenarioSnapshot(id);
  }

  @Post(':id/scenarios/simulate')
  simulateScenarios(@Param('id') id: string, @Body() _input: Record<string, unknown>) {
    return this.goalsService.simulateGoalScenarios(id);
  }
}
