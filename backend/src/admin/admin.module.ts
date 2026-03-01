import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Customer } from '../entities/customer.entity';
import { WalletLedger } from '../entities/wallet-ledger.entity';
import { PointsLedger } from '../entities/points-ledger.entity';
import { Redemption } from '../entities/redemption.entity';
import { Offer } from '../entities/offer.entity';
import { Branch } from '../entities/branch.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { CampaignsModule } from '../campaigns/campaigns.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Customer, WalletLedger, PointsLedger, Redemption, Offer, Branch]),
    CampaignsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
