import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Customer } from './customer.entity';
import { TripCampaign } from './trip-campaign.entity';

@Entity('customer_saved_campaigns')
@Unique(['customerId', 'campaignId'])
export class CustomerSavedCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @Column({ type: 'uuid' })
  campaignId: string;

  @ManyToOne(() => Customer)
  @JoinColumn()
  customer: Customer;

  @ManyToOne(() => TripCampaign)
  @JoinColumn()
  campaign: TripCampaign;
}
