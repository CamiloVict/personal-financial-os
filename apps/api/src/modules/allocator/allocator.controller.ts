import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DbUserId } from '../../auth/db-user.decorator';
import { AllocatorService } from './allocator.service';
import { AllocatorInput, AllocatorResult } from './allocator.contracts';

@Controller('allocator')
export class AllocatorController {
  constructor(private readonly allocatorService: AllocatorService) {}

  /** Simula escenarios de asignación a partir del capital indicado (salida ilustrativa). */
  @Post('scenarios/simulate')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async simulateScenarios(
    @DbUserId() userId: string,
    @Body() input: AllocatorInput,
  ): Promise<AllocatorResult> {
    return this.allocatorService.simulateCapitalAllocation(
      userId,
      input.availableCapital,
    );
  }

  /** Última asignación guardada (vigente hasta 30 días). */
  @Get('saved/latest')
  getSavedLatest(@DbUserId() userId: string) {
    return this.allocatorService.getLatestAllocatorSnapshot(userId);
  }

  /** Guarda el plan actual; sustituye cualquier guardado anterior del usuario. */
  @Post('saved')
  saveSnapshot(
    @DbUserId() userId: string,
    @Body() body: { plan: AllocatorResult },
  ) {
    return this.allocatorService.saveAllocatorSnapshot(userId, body.plan);
  }

  @Delete('saved')
  deleteSaved(@DbUserId() userId: string) {
    return this.allocatorService.deleteAllocatorSnapshot(userId);
  }
}
