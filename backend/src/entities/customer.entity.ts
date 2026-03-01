import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { NFCIdentifier } from './nfc-identifier.entity';
import { WalletLedger } from './wallet-ledger.entity';
import { PointsLedger } from './points-ledger.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ default: 'bronze' })
  tier: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pinHash: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => User, (u) => u.customer)
  @JoinColumn()
  user: User;

  @OneToMany(() => NFCIdentifier, (n) => n.customer)
  nfcIdentifiers: NFCIdentifier[];

  @OneToMany(() => WalletLedger, (w) => w.customer)
  walletLedger: WalletLedger[];

  @OneToMany(() => PointsLedger, (p) => p.customer)
  pointsLedger: PointsLedger[];
}
