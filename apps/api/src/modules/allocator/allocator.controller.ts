import { Controller, Post, Body } from '@nestjs/common';
import { DbUserId } from '../../auth/db-user.decorator';
import { AllocatorService } from './allocator.service';
import { AllocatorInput, AllocatorResult } from './allocator.contracts';

@Controller('allocator')
export class AllocatorController {
  constructor(private readonly allocatorService: AllocatorService) {}

  @Post('plan')
  async generatePlan(
    @DbUserId() userId: string,
    @Body() input: AllocatorInput,
  ): Promise<AllocatorResult> {
    return this.allocatorService.generateAllocationPlan(userId, input.availableCapital);
  }
}
