import { Controller, Post, Body } from '@nestjs/common';
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

  @Post('what-if/property')
  async simulatePropertyPurchase(
    @DbUserId() userId: string,
    @Body() input: SimulatePropertyPurchaseInput,
  ): Promise<SimulationResult> {
    return this.simulatorService.simulatePropertyPurchase(userId, input);
  }

  @Post('what-if/debt-vs-invest')
  async simulateDebtVsInvest(
    @DbUserId() userId: string,
    @Body() input: SimulateDebtVsInvestInput,
  ): Promise<SimulationResult> {
    return this.simulatorService.simulateDebtVsInvest(userId, input);
  }

  @Post('what-if/tax-advantaged')
  async simulateTaxAdvantaged(
    @DbUserId() userId: string,
    @Body() input: SimulateTaxAdvantagedInput,
  ): Promise<SimulationResult> {
    return this.simulatorService.simulateTaxAdvantaged(userId, input);
  }

  @Post('what-if/business')
  async simulateBusiness(
    @DbUserId() userId: string,
    @Body() input: SimulateBusinessInput,
  ): Promise<SimulationResult> {
    return this.simulatorService.simulateBusiness(userId, input);
  }

  @Post('what-if/custom')
  async simulateCustom(
    @DbUserId() userId: string,
    @Body() input: SimulateCustomInput,
  ): Promise<SimulationResult> {
    return this.simulatorService.simulateCustom(userId, input);
  }
}
