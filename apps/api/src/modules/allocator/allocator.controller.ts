import { Controller, Post, Body } from '@nestjs/common';
import { DbUserId } from '../../auth/db-user.decorator';
import { AllocatorService } from './allocator.service';
import { AllocatorInput, AllocatorResult } from './allocator.contracts';

@Controller('allocator')
export class AllocatorController {
  constructor(private readonly allocatorService: AllocatorService) {}

  /** Simula escenarios de asignación a partir del capital indicado (salida ilustrativa). */
  @Post('scenarios/simulate')
  async simulateScenarios(
    @DbUserId() userId: string,
    @Body() input: AllocatorInput,
  ): Promise<AllocatorResult> {
    return this.allocatorService.simulateCapitalAllocation(
      userId,
      input.availableCapital,
    );
  }
}
