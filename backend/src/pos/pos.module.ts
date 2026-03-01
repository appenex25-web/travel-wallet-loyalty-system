import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Redemption } from '../entities/redemption.entity';
import { WalletLedger } from '../entities/wallet-ledger.entity';
import { PointsLedger } from '../entities/points-ledger.entity';
import { Offer } from '../entities/offer.entity';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { CustomersModule } from '../customers/customers.module';
import { WalletModule } from '../wallet/wallet.module';
import { PointsModule } from '../points/points.module';
import { QrModule } from '../qr/qr.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Redemption, WalletLedger, PointsLedger, Offer]),
    CustomersModule,
    WalletModule,
    PointsModule,
    QrModule,
  ],
  controllers: [PosController],
  providers: [PosService],
})
export class PosModule {}
