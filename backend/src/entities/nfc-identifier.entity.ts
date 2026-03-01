import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('nfc_identifiers')
export class NFCIdentifier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @Column()
  tagUid: string;

  @Column({ nullable: true })
  label: string;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Customer, (c) => c.nfcIdentifiers)
  @JoinColumn()
  customer: Customer;
}
