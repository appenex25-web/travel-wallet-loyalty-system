import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Customer } from '../entities/customer.entity';
import { WalletLedger } from '../entities/wallet-ledger.entity';
import { PointsLedger } from '../entities/points-ledger.entity';
import { Redemption } from '../entities/redemption.entity';
import { Offer } from '../entities/offer.entity';
import { Branch } from '../entities/branch.entity';

export type RecentTransactionDto = {
  date: string;
  customer: string;
  type: string;
  amount: string;
  status: string;
};

export type WeeklyActivityDto = { day: string; walletOps: number; redemptions: number };

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(Branch)
    private branchRepo: Repository<Branch>,
    @InjectRepository(WalletLedger)
    private walletLedgerRepo: Repository<WalletLedger>,
    @InjectRepository(PointsLedger)
    private pointsLedgerRepo: Repository<PointsLedger>,
    @InjectRepository(Redemption)
    private redemptionRepo: Repository<Redemption>,
    @InjectRepository(Offer)
    private offerRepo: Repository<Offer>,
  ) {}

  async getDashboardSummary() {
    const now = new Date();
    const [walletFloatRaw, activeCustomers, redemptionsCount, pointsRaw, weeklyRows] =
      await Promise.all([
        this.walletLedgerRepo
          .createQueryBuilder('w')
          .select('COALESCE(SUM(w.amount), 0)', 'total')
          .getRawOne<{ total: string }>(),
        this.customerRepo.count({ where: { status: 'active' } }),
        this.redemptionRepo.count(),
        this.pointsLedgerRepo
          .createQueryBuilder('p')
          .select('COALESCE(SUM(p.pointsDelta), 0)', 'total')
          .where('(p.expiresAt IS NULL OR p.expiresAt > :now)', { now })
          .getRawOne<{ total: string }>(),
        this.getWeeklyActivityCounts(),
      ]);
    const walletFloat = Number(walletFloatRaw?.total ?? 0);
    const pointsOutstanding = Number(pointsRaw?.total ?? 0);
    return {
      walletFloat,
      activeCustomers,
      redemptionsCount,
      pointsOutstanding,
      weeklyActivity: weeklyRows,
    };
  }

  private async getWeeklyActivityCounts(): Promise<WeeklyActivityDto[]> {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const walletCounts = await this.walletLedgerRepo
      .createQueryBuilder('w')
      .select("DATE_TRUNC('day', w.createdAt)", 'day')
      .addSelect('COUNT(*)', 'cnt')
      .where('w.createdAt >= :start', { start })
      .groupBy("DATE_TRUNC('day', w.createdAt)")
      .getRawMany<{ day: Date; cnt: string }>();
    const redemptionCounts = await this.redemptionRepo
      .createQueryBuilder('r')
      .select("DATE_TRUNC('day', r.createdAt)", 'day')
      .addSelect('COUNT(*)', 'cnt')
      .where('r.createdAt >= :start', { start })
      .groupBy("DATE_TRUNC('day', r.createdAt)")
      .getRawMany<{ day: Date; cnt: string }>();
    const walletByDay = new Map<string, number>();
    const redemptionByDay = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      walletByDay.set(key, 0);
      redemptionByDay.set(key, 0);
    }
    for (const row of walletCounts) {
      const key = new Date(row.day).toISOString().slice(0, 10);
      walletByDay.set(key, Number(row.cnt));
    }
    for (const row of redemptionCounts) {
      const key = new Date(row.day).toISOString().slice(0, 10);
      redemptionByDay.set(key, Number(row.cnt));
    }
    const result: WeeklyActivityDto[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      result.push({
        day: days[d.getDay()],
        walletOps: walletByDay.get(key) ?? 0,
        redemptions: redemptionByDay.get(key) ?? 0,
      });
    }
    return result;
  }

  async getRecentTransactions(limit = 20): Promise<RecentTransactionDto[]> {
    const [walletRows, redemptionRows] = await Promise.all([
      this.walletLedgerRepo.find({
        relations: ['customer'],
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.redemptionRepo.find({
        relations: ['customer'],
        order: { createdAt: 'DESC' },
        take: limit,
      }),
    ]);
    const walletDtos: RecentTransactionDto[] = walletRows.map((w) => ({
      date: new Date(w.createdAt).toISOString().slice(0, 10),
      customer: w.customer?.name ?? '',
      type: w.source === 'redemption_refund' ? 'Refund' : 'Top up',
      amount: Number(w.amount) >= 0 ? `+$${Number(w.amount).toFixed(2)}` : `$${Number(w.amount).toFixed(2)}`,
      status: 'Completed',
    }));
    const redemptionDtos: RecentTransactionDto[] = redemptionRows.map((r) => ({
      date: new Date(r.createdAt).toISOString().slice(0, 10),
      customer: r.customer?.name ?? '',
      type: 'Redemption',
      amount: `-$${Number(r.walletAmountUsed).toFixed(2)}`,
      status: 'Completed',
    }));
    const merged = [...walletDtos, ...redemptionDtos].sort((a, b) => b.date.localeCompare(a.date));
    return merged.slice(0, limit);
  }

  /** Creates a customer. Password defaults to first name (lowercase); customer must change it on first login. */
  async createCustomer(email: string, password: string | undefined, name: string, phone?: string) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');
    const defaultPassword = (name.trim().split(/\s+/)[0] || 'customer').toLowerCase();
    const rawPassword = (password?.trim() || defaultPassword);
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const mustChangePassword = !password?.trim();
    const user = this.userRepo.create({
      email,
      passwordHash,
      role: 'customer',
      mustChangePassword,
    });
    const savedUser = await this.userRepo.save(user);
    const customer = this.customerRepo.create({ userId: savedUser.id, name, phone: phone ?? undefined });
    return this.customerRepo.save(customer);
  }

  async listCustomers(search?: string) {
    const qb = this.customerRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.user', 'u')
      .orderBy('c.createdAt', 'DESC');
    if (search?.trim()) {
      qb.andWhere(
        '(c.name ILIKE :q OR c.phone ILIKE :q OR u.email ILIKE :q)',
        { q: `%${search.trim()}%` },
      );
    }
    const customers = await qb.take(100).getMany();
    if (customers.length === 0) return customers;
    const ids = customers.map((c) => c.id);
    const now = new Date();
    const [pointsRows, lastActivityRows] = await Promise.all([
      this.pointsLedgerRepo
        .createQueryBuilder('p')
        .select('p.customerId', 'customerId')
        .addSelect('COALESCE(SUM(p.pointsDelta), 0)', 'total')
        .where('p.customerId IN (:...ids)', { ids })
        .andWhere('(p.expiresAt IS NULL OR p.expiresAt > :now)', { now })
        .groupBy('p.customerId')
        .getRawMany<{ customerId: string; total: string }>(),
      this.getLastActivityByCustomer(ids),
    ]);
    const pointsMap = new Map(pointsRows.map((r) => [r.customerId, Number(r.total)]));
    const activityMap = new Map(lastActivityRows.map((r) => [r.customerId, r.lastAt]));
    return customers.map((c) => ({
      id: c.id,
      userId: c.userId,
      name: c.name,
      phone: c.phone,
      status: c.status,
      tier: c.tier,
      createdAt: c.createdAt,
      user: c.user ? { id: c.user.id, email: c.user.email } : null,
      points: pointsMap.get(c.id) ?? 0,
      last_activity_at: activityMap.get(c.id) ?? null,
    }));
  }

  private async getLastActivityByCustomer(
    customerIds: string[],
  ): Promise<{ customerId: string; lastAt: string }[]> {
    const walletMax = await this.walletLedgerRepo
      .createQueryBuilder('w')
      .select('w.customerId', 'customerId')
      .addSelect('MAX(w.createdAt)', 'lastAt')
      .where('w.customerId IN (:...ids)', { ids: customerIds })
      .groupBy('w.customerId')
      .getRawMany<{ customerId: string; lastAt: Date }>();
    const pointsMax = await this.pointsLedgerRepo
      .createQueryBuilder('p')
      .select('p.customerId', 'customerId')
      .addSelect('MAX(p.createdAt)', 'lastAt')
      .where('p.customerId IN (:...ids)', { ids: customerIds })
      .groupBy('p.customerId')
      .getRawMany<{ customerId: string; lastAt: Date }>();
    const redemptionMax = await this.redemptionRepo
      .createQueryBuilder('r')
      .select('r.customerId', 'customerId')
      .addSelect('MAX(r.createdAt)', 'lastAt')
      .where('r.customerId IN (:...ids)', { ids: customerIds })
      .groupBy('r.customerId')
      .getRawMany<{ customerId: string; lastAt: Date }>();
    const byCustomer = new Map<string, Date>();
    for (const r of [...walletMax, ...pointsMax, ...redemptionMax]) {
      const d = r.lastAt instanceof Date ? r.lastAt : new Date(r.lastAt);
      const existing = byCustomer.get(r.customerId);
      if (!existing || d > existing) byCustomer.set(r.customerId, d);
    }
    return Array.from(byCustomer.entries()).map(([customerId, lastAt]) => ({
      customerId,
      lastAt: lastAt.toISOString(),
    }));
  }

  async listOffers(activeOnly = false) {
    const qb = this.offerRepo.createQueryBuilder('o').orderBy('o.endAt', 'DESC');
    if (activeOnly) {
      const now = new Date();
      qb.where('o.status = :status', { status: 'active' })
        .andWhere('o.startAt <= :now', { now })
        .andWhere('o.endAt >= :now', { now });
    }
    return qb.take(50).getMany();
  }

  async createOffer(dto: {
    name: string;
    description?: string;
    type: string;
    conditions?: Record<string, unknown>;
    startAt: Date;
    endAt: Date;
    maxRedemptionsPerCustomer?: number;
  }) {
    const offer = this.offerRepo.create(dto);
    return this.offerRepo.save(offer);
  }

  async updateOffer(id: string, dto: Partial<{ name: string; description: string; status: string; endAt: Date }>) {
    await this.offerRepo.update(id, dto as Record<string, unknown>);
    return this.offerRepo.findOne({ where: { id } });
  }

  async listBranches() {
    return this.branchRepo.find({ order: { name: 'ASC' } });
  }

  async resetCustomerPin(customerId: string): Promise<{ ok: boolean }> {
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (!customer) throw new (await import('@nestjs/common')).NotFoundException('Customer not found');
    customer.pinHash = null;
    await this.customerRepo.save(customer);
    return { ok: true };
  }
}
