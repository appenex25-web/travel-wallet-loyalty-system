import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../entities/booking.entity';
import { WalletLedger } from '../entities/wallet-ledger.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { CustomersModule } from '../customers/customers.module';
import { WalletModule } from '../wallet/wallet.module';
import { CatalogModule } from '../catalog/catalog.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, WalletLedger]),
    CustomersModule,
    WalletModule,
    CatalogModule,
    CampaignsModule,
    MessagesModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
