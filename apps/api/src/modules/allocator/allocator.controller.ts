import { Controller, Post, Param, Body } from '@nestjs/common';
import { AllocatorService } from './allocator.service';
import { AllocatorInput, AllocatorResult } from './allocator.contracts';

@Controller('allocator')
export class AllocatorController {
  constructor(private readonly allocatorService: AllocatorService) {}

  @Post('plan/:userId')
  async generatePlan(
    @Param('userId') userId: string,
    @Body() input: AllocatorInput
  ): Promise<AllocatorResult> {
    return this.allocatorService.generateAllocationPlan(userId, input.availableCapital);
  }
}
