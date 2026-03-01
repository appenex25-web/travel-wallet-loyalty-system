import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Redemption } from '../entities/redemption.entity';
import { WalletLedger } from '../entities/wallet-ledger.entity';
import { PointsLedger } from '../entities/points-ledger.entity';
import { Offer } from '../entities/offer.entity';
import { WalletService } from '../wallet/wallet.service';
import { PointsService } from '../points/points.service';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class PosService {
  constructor(
    @InjectRepository(Redemption)
    private redemptionRepo: Repository<Redemption>,
    @InjectRepository(WalletLedger)
    private walletLedgerRepo: Repository<WalletLedger>,
    @InjectRepository(PointsLedger)
    private pointsLedgerRepo: Repository<PointsLedger>,
    @InjectRepository(Offer)
    private offerRepo: Repository<Offer>,
    private walletService: WalletService,
    private pointsService: PointsService,
    private customersService: CustomersService,
  ) {}

  async identifyByNfc(tagUid: string) {
    const customer = await this.customersService.findByNfcUid(tagUid);
    if (!customer) return { customer: null, balance: 0, points: 0 };
    return this.getCustomerSummary(customer.id);
  }

  async identifyByCustomerId(customerId: string) {
    const customer = await this.customersService.findById(customerId);
    return this.getCustomerSummary(customer.id);
  }

  private async getCustomerSummary(customerId: string) {
    const customer = await this.customersService.findById(customerId);
    const [balance, points] = await Promise.all([
      this.walletService.getBalance(customerId),
      this.pointsService.getPoints(customerId),
    ]);
    return {
      customer: { id: customer.id, name: customer.name, tier: customer.tier },
      balance: balance.balance,
      points,
    };
  }

  async createRedemption(
    customerId: string,
    agentId: string,
    branchId: string,
    walletAmount: number,
    pointsUsed: number,
    bookingId?: string,
  ): Promise<Redemption> {
    if (walletAmount < 0 || pointsUsed < 0) throw new BadRequestException('Amounts must be non-negative');
    const { balance } = await this.walletService.getBalance(customerId);
    const points = await this.pointsService.getPoints(customerId);
    if (walletAmount > balance) throw new BadRequestException('Insufficient wallet balance');
    if (pointsUsed > points) throw new BadRequestException('Insufficient points');

    if (walletAmount > 0) {
      await this.walletLedgerRepo.save(
        this.walletLedgerRepo.create({
          customerId,
          amount: -walletAmount,
          currency: 'USD',
          source: 'redemption',
          reference: bookingId || undefined,
        }),
      );
    }
    if (pointsUsed > 0) {
      await this.pointsLedgerRepo.save(
        this.pointsLedgerRepo.create({
          customerId,
          pointsDelta: -pointsUsed,
          reason: 'redeem',
        }),
      );
    }

    const redemption = this.redemptionRepo.create({
      customerId,
      agentId,
      branchId,
      walletAmountUsed: walletAmount,
      pointsUsed,
      bookingId: bookingId || null,
    });
    return this.redemptionRepo.save(redemption);
  }

  /** Points per dollar from first active bonus_points offer, else 1 */
  async getPointsPerDollar(): Promise<number> {
    const now = new Date();
    const offer = await this.offerRepo.findOne({
      where: {
        type: 'bonus_points',
        status: 'active',
        startAt: LessThanOrEqual(now),
        endAt: MoreThanOrEqual(now),
      },
      order: { endAt: 'ASC' },
    });
    if (!offer?.conditions?.pointsPerDollar) return 1;
    const rate = Number((offer.conditions as { pointsPerDollar?: number }).pointsPerDollar);
    return Number.isFinite(rate) && rate > 0 ? rate : 1;
  }

  /** Record a purchase: deduct from wallet, award points per admin rewards (bonus_points offer). */
  async createPurchase(
    customerId: string,
    amount: number,
    reference?: string,
  ): Promise<{ balance: number; pointsAwarded: number }> {
    if (amount <= 0) throw new BadRequestException('Purchase amount must be positive');
    const { balance } = await this.walletService.getBalance(customerId);
    if (amount > balance) throw new BadRequestException('Insufficient wallet balance');

    await this.walletLedgerRepo.save(
      this.walletLedgerRepo.create({
        customerId,
        amount: -amount,
        currency: 'USD',
        source: 'purchase',
        reference: reference || undefined,
      }),
    );

    const pointsPerDollar = await this.getPointsPerDollar();
    const pointsAwarded = Math.floor(amount * pointsPerDollar);
    if (pointsAwarded > 0) {
      await this.pointsLedgerRepo.save(
        this.pointsLedgerRepo.create({
          customerId,
          pointsDelta: pointsAwarded,
          reason: 'purchase',
        }),
      );
    }

    const { balance: newBalance } = await this.walletService.getBalance(customerId);
    return { balance: newBalance, pointsAwarded };
  }
}
