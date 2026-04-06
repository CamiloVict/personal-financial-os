import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DbUserId } from '../../auth/db-user.decorator';
import { SimulatorService } from './simulator.service';
import {
  SimulatePropertyPurchaseInput,
  SimulationResult,
  SimulateDebtVsInvestInput,
  SimulateTaxAdvantagedInput,
  SimulateBusinessInput,
  SimulateCustomInput,
} from './simulator.contracts';

@Controller('simulator')
export class SimulatorController {
  constructor(private readonly simulatorService: SimulatorService) {}

  /** Última simulación guardada (30 días). `scenarioType` opcional filtra por pestaña. */
  @Get('saved/latest')
  getSavedLatest(
    @DbUserId() userId: string,
    @Query('scenarioType') scenarioType?: string,
  ) {
    return this.simulatorService.getLatestSimulationSnapshot(
      userId,
      scenarioType,
    );
  }

  @Post('saved')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  saveSnapshot(
    @DbUserId() userId: string,
    @Body()
    body: {
      scenarioType: string;
      inputs: Record<string, unknown>;
      result: SimulationResult;
    },
  ) {
    return this.simulatorService.saveSimulationSnapshot(
      userId,
      body.scenarioType,
      body.inputs,
      body.result,
    );
  }

  @Delete('saved')
  deleteSaved(
    @DbUserId() userId: string,
    @Query('scenarioType') scenarioType: string,
  ) {
    return this.simulatorService.deleteSimulationSnapshot(
      userId,
      scenarioType,
    );
  }

  @Post('what-if/property')
  @Throttle({ default: { limit: 25, ttl: 60_000 } })
  async simulatePropertyPurchase(
    @DbUserId() userId: string,
    @Body() input: SimulatePropertyPurchaseInput,
  ): Promise<SimulationResult> {
    return this.simulatorService.simulatePropertyPurchase(userId, input);
  }

  @Post('what-if/debt-vs-invest')
  @Throttle({ default: { limit: 25, ttl: 60_000 } })
  async simulateDebtVsInvest(
    @DbUserId() userId: string,
    @Body() input: SimulateDebtVsInvestInput,
  ): Promise<SimulationResult> {
    return this.simulatorService.simulateDebtVsInvest(userId, input);
  }

  @Post('what-if/tax-advantaged')
  @Throttle({ default: { limit: 25, ttl: 60_000 } })
  async simulateTaxAdvantaged(
    @DbUserId() userId: string,
    @Body() input: SimulateTaxAdvantagedInput,
  ): Promise<SimulationResult> {
    return this.simulatorService.simulateTaxAdvantaged(userId, input);
  }

  @Post('what-if/business')
  @Throttle({ default: { limit: 25, ttl: 60_000 } })
  async simulateBusiness(
    @DbUserId() userId: string,
    @Body() input: SimulateBusinessInput,
  ): Promise<SimulationResult> {
    return this.simulatorService.simulateBusiness(userId, input);
  }

  @Post('what-if/custom')
  @Throttle({ default: { limit: 25, ttl: 60_000 } })
  async simulateCustom(
    @DbUserId() userId: string,
    @Body() input: SimulateCustomInput,
  ): Promise<SimulationResult> {
    return this.simulatorService.simulateCustom(userId, input);
  }
}
