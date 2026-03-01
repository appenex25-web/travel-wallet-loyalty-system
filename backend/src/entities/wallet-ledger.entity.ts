import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('wallet_ledger')
export class WalletLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  customerId: string;

  /** Positive = credit, negative = debit */
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column()
  source: string; // cash, card, online, redemption_refund

  @Column({ nullable: true })
  reference: string; // booking_id or external_tx_id

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Customer, (c) => c.walletLedger)
  @JoinColumn()
  customer: Customer;
}
