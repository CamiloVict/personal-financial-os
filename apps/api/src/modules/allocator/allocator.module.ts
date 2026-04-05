import { Module } from '@nestjs/common';
import { AllocatorController } from './allocator.controller';
import { AllocatorService } from './allocator.service';

@Module({
  controllers: [AllocatorController],
  providers: [AllocatorService],
})
export class AllocatorModule {}