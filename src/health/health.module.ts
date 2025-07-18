import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from 'prisma/prisma.module';
import { HealthController } from './health.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TerminusModule, PrismaModule, HttpModule],
  controllers: [HealthController],
})
export class HealthModule {}
