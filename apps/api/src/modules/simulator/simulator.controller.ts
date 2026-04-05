import { Controller, Post, Param, Body } from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import { 
  SimulatePropertyPurchaseInput, 
  SimulationResult,
  SimulateDebtVsInvestInput,
  SimulateTaxAdvantagedInput,
  SimulateBusinessInput,
  SimulateCustomInput
} from './simulator.contracts';

@Controller('simulator')
export class SimulatorController {
  constructor(private readonly simulatorService: SimulatorService) {}

  @Post('what-if/property/:userId')
  async simulatePropertyPurchase(
    @Param('userId') userId: string,
    @Body() input: SimulatePropertyPurchaseInput
  ): Promise<SimulationResult> {
    return this.simulatorService.simulatePropertyPurchase(userId, input);
  }

  @Post('what-if/debt-vs-invest/:userId')
  async simulateDebtVsInvest(
    @Param('userId') userId: string,
    @Body() input: SimulateDebtVsInvestInput
  ): Promise<SimulationResult> {
    return this.simulatorService.simulateDebtVsInvest(userId, input);
  }

  @Post('what-if/tax-advantaged/:userId')
  async simulateTaxAdvantaged(
    @Param('userId') userId: string,
    @Body() input: SimulateTaxAdvantagedInput
  ): Promise<SimulationResult> {
    return this.simulatorService.simulateTaxAdvantaged(userId, input);
  }

  @Post('what-if/business/:userId')
  async simulateBusiness(
    @Param('userId') userId: string,
    @Body() input: SimulateBusinessInput
  ): Promise<SimulationResult> {
    return this.simulatorService.simulateBusiness(userId, input);
  }

  @Post('what-if/custom/:userId')
  async simulateCustom(
    @Param('userId') userId: string,
    @Body() input: SimulateCustomInput
  ): Promise<SimulationResult> {
    return this.simulatorService.simulateCustom(userId, input);
  }
}