import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hotel } from '../entities/hotel.entity';
import { Flight } from '../entities/flight.entity';
import { HotelsService } from './hotels.service';
import { FlightsService } from './flights.service';
import { HotelsController } from './hotels.controller';
import { FlightsController } from './flights.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Hotel, Flight])],
  controllers: [HotelsController, FlightsController],
  providers: [HotelsService, FlightsService],
  exports: [HotelsService, FlightsService],
})
export class CatalogModule {}
