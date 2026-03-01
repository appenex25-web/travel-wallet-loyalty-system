import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('points_ledger')
export class PointsLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  customerId: string;

  /** Positive = earn, negative = redeem */
  @Column({ type: 'int' })
  pointsDelta: number;

  @Column()
  reason: string; // load, booking, promo, manual_adjust, redeem

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Customer, (c) => c.pointsLedger)
  @JoinColumn()
  customer: Customer;
}
