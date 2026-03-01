import { Module } from '@nestjs/common';
import { QrService } from './qr.service';
import { QrController } from './qr.controller';
import { CustomersModule } from '../customers/customers.module';
import { WalletModule } from '../wallet/wallet.module';
import { PointsModule } from '../points/points.module';

@Module({
  imports: [CustomersModule, WalletModule, PointsModule],
  controllers: [QrController],
  providers: [QrService],
  exports: [QrService],
})
export class QrModule {}
