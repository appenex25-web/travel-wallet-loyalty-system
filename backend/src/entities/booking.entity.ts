import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Hotel } from './hotel.entity';
import { Flight } from './flight.entity';
import { TripCampaign } from './trip-campaign.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @Column({ type: 'uuid', nullable: true })
  hotelId: string | null;

  @Column({ type: 'uuid', nullable: true })
  flightId: string | null;

  @Column({ type: 'uuid', nullable: true })
  campaignId: string | null;

  /** flight | hotel | trip_package | other */
  @Column({ default: 'other' })
  bookingType: string;

  /** Display title e.g. "Nairobi–Dubai return", "Victoria Falls 3-day package" */
  @Column({ type: 'varchar', length: 500, nullable: true })
  title: string | null;

  @Column({ default: 'pending_confirmation' })
  status: string; // pending_confirmation, quote, pending_payment, confirmed, cancelled, denied

  @Column({ type: 'varchar', length: 500, nullable: true })
  denialReason: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  totalAmount: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  walletApplied: number;

  @Column({ nullable: true })
  externalReference: string;

  @Column({ type: 'timestamptz', nullable: true })
  checkInAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  checkOutAt: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  roomType: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Customer)
  @JoinColumn()
  customer: Customer;

  @ManyToOne(() => Hotel, { nullable: true })
  @JoinColumn()
  hotel: Hotel | null;

  @ManyToOne(() => Flight, { nullable: true })
  @JoinColumn()
  flight: Flight | null;

  @ManyToOne(() => TripCampaign, { nullable: true })
  @JoinColumn()
  campaign: TripCampaign | null;
}
