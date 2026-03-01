import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsLedger } from '../entities/points-ledger.entity';
import { Offer } from '../entities/offer.entity';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PointsLedger, Offer]),
    CustomersModule,
  ],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
