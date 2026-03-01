import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletLedger } from '../entities/wallet-ledger.entity';
import { Customer } from '../entities/customer.entity';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletLedger)
    private ledgerRepo: Repository<WalletLedger>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    private customersService: CustomersService,
  ) {}

  async getBalance(customerId: string): Promise<{ balance: number; currency: string }> {
    await this.customersService.findById(customerId);
    const result = await this.ledgerRepo
      .createQueryBuilder('w')
      .select('SUM(w.amount)', 'total')
      .where('w.customerId = :id', { id: customerId })
      .getRawOne<{ total: string }>();
    const balance = Number(result?.total ?? 0);
    return { balance, currency: 'USD' };
  }

  async topUp(customerId: string, amount: number, source: string, reference?: string): Promise<WalletLedger> {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    await this.customersService.findById(customerId);
    const entry = this.ledgerRepo.create({
      customerId,
      amount,
      currency: 'USD',
      source: source || 'cash',
      reference,
    });
    return this.ledgerRepo.save(entry);
  }

  async getHistory(customerId: string, limit = 50): Promise<WalletLedger[]> {
    await this.customersService.findById(customerId);
    return this.ledgerRepo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
