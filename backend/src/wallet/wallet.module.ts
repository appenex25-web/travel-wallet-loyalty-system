import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletLedger } from '../entities/wallet-ledger.entity';
import { Customer } from '../entities/customer.entity';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletLedger, Customer]),
    CustomersModule,
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
