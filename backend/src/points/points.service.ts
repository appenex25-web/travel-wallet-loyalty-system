import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { PointsLedger } from '../entities/points-ledger.entity';
import { Offer } from '../entities/offer.entity';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(PointsLedger)
    private ledgerRepo: Repository<PointsLedger>,
    @InjectRepository(Offer)
    private offerRepo: Repository<Offer>,
    private customersService: CustomersService,
  ) {}

  async getPoints(customerId: string): Promise<number> {
    await this.customersService.findById(customerId);
    const result = await this.ledgerRepo
      .createQueryBuilder('p')
      .select('SUM(p.pointsDelta)', 'total')
      .where('p.customerId = :id', { id: customerId })
      .andWhere('(p.expiresAt IS NULL OR p.expiresAt > :now)', { now: new Date() })
      .getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }

  async getHistory(customerId: string, limit = 50): Promise<PointsLedger[]> {
    await this.customersService.findById(customerId);
    return this.ledgerRepo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getActiveOffers(): Promise<Offer[]> {
    const now = new Date();
    return this.offerRepo.find({
      where: {
        status: 'active',
        startAt: LessThanOrEqual(now),
        endAt: MoreThanOrEqual(now),
      },
      order: { endAt: 'ASC' },
    });
  }
}
