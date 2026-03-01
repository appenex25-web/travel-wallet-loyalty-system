import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { WalletModule } from './wallet/wallet.module';
import { PointsModule } from './points/points.module';
import { QrModule } from './qr/qr.module';
import { PosModule } from './pos/pos.module';
import { AdminModule } from './admin/admin.module';
import { BookingsModule } from './bookings/bookings.module';
import { CatalogModule } from './catalog/catalog.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { MessagesModule } from './messages/messages.module';
import { PostsModule } from './posts/posts.module';
import { UploadsModule } from './uploads/uploads.module';
import {
  User,
  Branch,
  Agent,
  Customer,
  NFCIdentifier,
  WalletLedger,
  PointsLedger,
  Offer,
  Redemption,
} from './entities';
import { Booking } from './entities/booking.entity';
import { Hotel } from './entities/hotel.entity';
import { Flight } from './entities/flight.entity';
import { TripCampaign } from './entities/trip-campaign.entity';
import { CampaignAddOn } from './entities/campaign-addon.entity';
import { MessageThread } from './entities/message-thread.entity';
import { Message } from './entities/message.entity';
import { Post } from './entities/post.entity';
import { CustomerSavedCampaign } from './entities/customer-saved-campaign.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/travel_wallet',
      entities: [User, Branch, Agent, Customer, NFCIdentifier, WalletLedger, PointsLedger, Offer, Redemption, Booking, Hotel, Flight, TripCampaign, CampaignAddOn, MessageThread, Message, Post, CustomerSavedCampaign],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    CustomersModule,
    WalletModule,
    PointsModule,
    QrModule,
    PosModule,
    AdminModule,
    BookingsModule,
    CatalogModule,
    CampaignsModule,
    MessagesModule,
    PostsModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
