import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { WalletLedger } from '../entities/wallet-ledger.entity';
import { CustomersService } from '../customers/customers.service';
import { WalletService } from '../wallet/wallet.service';
import { HotelsService } from '../catalog/hotels.service';
import { FlightsService } from '../catalog/flights.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    @InjectRepository(WalletLedger)
    private walletLedgerRepo: Repository<WalletLedger>,
    private customersService: CustomersService,
    private walletService: WalletService,
    private hotelsService: HotelsService,
    private flightsService: FlightsService,
    private campaignsService: CampaignsService,
    private messagesService: MessagesService,
  ) {}

  async create(
    customerId: string,
    totalAmount: number,
    currency = 'USD',
    options?: {
      externalReference?: string;
      bookingType?: string;
      title?: string;
      hotelId?: string;
      flightId?: string;
      campaignId?: string;
      paymentMethod?: string;
      payByAt?: Date;
      numberOfPeople?: number;
    },
  ) {
    await this.customersService.findById(customerId);
    const isPayLater = options?.paymentMethod === 'pay_later';
    const status = isPayLater ? 'pending_payment' : 'pending_confirmation';
    const booking = this.bookingRepo.create({
      customerId,
      totalAmount,
      currency,
      status,
      walletApplied: 0,
      paidInOffice: false,
      externalReference: options?.externalReference ?? undefined,
      bookingType: options?.bookingType ?? 'other',
      title: options?.title ?? undefined,
      hotelId: options?.hotelId ?? null,
      flightId: options?.flightId ?? null,
      campaignId: options?.campaignId ?? null,
      paymentMethod: options?.paymentMethod ?? null,
      payByAt: options?.payByAt ?? null,
      numberOfPeople: options?.numberOfPeople ?? null,
    });
    const saved = await this.bookingRepo.save(booking);
    const msg = isPayLater
      ? `Your booking "${saved.title || 'Booking'}" has been created. Pay in person within 48 hours.`
      : `Your booking "${saved.title || 'Booking'}" has been created.`;
    this.messagesService.createBookingNotification(customerId, saved.id, msg).catch(() => {});
    return saved;
  }

  /** Customer books from trip campaign (mobile): base price + selected add-ons. */
  async createFromCampaign(
    customerId: string,
    campaignId: string,
    options: { startDate?: string; endDate?: string; addOnIds?: string[]; paymentMethod?: string; numberOfPeople?: number },
  ) {
    await this.customersService.findById(customerId);
    const campaign = await this.campaignsService.findById(campaignId);
    if (campaign.status !== 'active') throw new BadRequestException('Campaign is not available');
    let total = Number(campaign.basePrice);
    const currency = campaign.currency || 'USD';
    if (options.addOnIds?.length) {
      const addOns = await this.campaignsService.getAddOnsByIds(campaignId, options.addOnIds);
      for (const a of addOns) total += Number(a.priceDelta);
    }
    const title = campaign.title + (campaign.shortDescription ? ` · ${campaign.shortDescription}` : '');
    const payByAt = options.paymentMethod === 'pay_later' ? new Date(Date.now() + 48 * 60 * 60 * 1000) : undefined;
    return this.create(customerId, total, currency, {
      bookingType: 'trip_package',
      title: title.slice(0, 500),
      campaignId: campaign.id,
      paymentMethod: options.paymentMethod ?? undefined,
      payByAt,
      numberOfPeople: options.numberOfPeople ?? undefined,
    });
  }

  /** Customer books from catalog (mobile app): creates booking linked to hotel or flight. */
  async createFromCatalog(
    customerId: string,
    hotelId?: string,
    flightId?: string,
    options?: { checkInAt?: string; checkOutAt?: string; roomType?: string; paymentMethod?: string; numberOfPeople?: number },
  ) {
    await this.customersService.findById(customerId);
    if (hotelId && flightId) throw new BadRequestException('Provide either hotelId or flightId, not both');
    if (!hotelId && !flightId) throw new BadRequestException('Provide hotelId or flightId');

    if (hotelId) {
      const hotel = await this.hotelsService.findById(hotelId);
      const roomTypes = (hotel as { roomTypes?: { name: string; pricePerNight?: number; priceDelta?: number }[] }).roomTypes;
      let pricePerNight = Number(hotel.pricePerNight) || 0;
      if (options?.roomType && Array.isArray(roomTypes)) {
        const rt = roomTypes.find((r) => r.name === options.roomType);
        if (rt) {
          if (rt.pricePerNight != null) pricePerNight = Number(rt.pricePerNight);
          else pricePerNight += Number(rt.priceDelta ?? 0);
        }
      }
      let totalAmount = pricePerNight;
      if (options?.checkInAt && options?.checkOutAt) {
        const checkIn = new Date(options.checkInAt);
        const checkOut = new Date(options.checkOutAt);
        const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (24 * 60 * 60 * 1000)));
        totalAmount = pricePerNight * nights;
      }
      const payByAt = options?.paymentMethod === 'pay_later' ? new Date(Date.now() + 48 * 60 * 60 * 1000) : undefined;
      const booking = await this.create(customerId, totalAmount, hotel.currency || 'USD', {
        bookingType: 'hotel',
        title: hotel.name,
        hotelId: hotel.id,
        paymentMethod: options?.paymentMethod,
        payByAt,
        numberOfPeople: options?.numberOfPeople,
      });
      const updatePayload: Record<string, unknown> = {};
      if (options?.checkInAt) updatePayload.checkInAt = new Date(options.checkInAt);
      if (options?.checkOutAt) updatePayload.checkOutAt = new Date(options.checkOutAt);
      if (options?.roomType != null) updatePayload.roomType = options.roomType;
      if (Object.keys(updatePayload).length > 0) {
        await this.bookingRepo.update(booking.id, updatePayload);
        return this.findById(booking.id);
      }
      return booking;
    } else {
      const flight = await this.flightsService.findById(flightId!);
      const totalAmount = Number(flight.price);
      const payByAt = options?.paymentMethod === 'pay_later' ? new Date(Date.now() + 48 * 60 * 60 * 1000) : undefined;
      return this.create(customerId, totalAmount, flight.currency || 'USD', {
        bookingType: 'flight',
        title: `${flight.origin} → ${flight.destination}`,
        flightId: flight.id,
        paymentMethod: options?.paymentMethod,
        payByAt,
        numberOfPeople: options?.numberOfPeople,
      });
    }
  }

  async findById(id: string) {
    const b = await this.bookingRepo.findOne({
      where: { id },
      relations: ['customer', 'hotel', 'flight', 'campaign'],
    });
    if (!b) throw new NotFoundException('Booking not found');
    return b;
  }

  async listByCustomer(customerId: string) {
    await this.customersService.findById(customerId);
    return this.bookingRepo.find({
      where: { customerId },
      relations: ['hotel', 'flight', 'campaign'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async listAll(customerId?: string, bookingType?: string) {
    const where: Record<string, unknown> = {};
    if (customerId) where.customerId = customerId;
    if (bookingType) where.bookingType = bookingType;
    return this.bookingRepo.find({
      where,
      relations: ['customer', 'hotel', 'flight', 'campaign'],
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async applyWallet(bookingId: string, amount: number) {
    const booking = await this.findById(bookingId);
    if (booking.status !== 'quote' && booking.status !== 'pending_payment' && booking.status !== 'pending_confirmation') {
      throw new BadRequestException('Booking not in a payable state');
    }
    const { balance } = await this.walletService.getBalance(booking.customerId);
    if (amount > balance) throw new BadRequestException('Insufficient wallet balance');
    const toApply = Math.min(amount, Number(booking.totalAmount) - Number(booking.walletApplied));
    if (toApply <= 0) return booking;
    await this.walletLedgerRepo.save(
      this.walletLedgerRepo.create({
        customerId: booking.customerId,
        amount: -toApply,
        currency: booking.currency,
        source: 'booking',
        reference: bookingId,
      }),
    );
    booking.walletApplied = Number(booking.walletApplied) + toApply;
    if (Number(booking.walletApplied) >= Number(booking.totalAmount)) booking.status = 'pending_confirmation';
    else booking.status = 'pending_payment';
    return this.bookingRepo.save(booking);
  }

  /** Agent marks booking as paid in office (for pay_later). Enables Confirm. */
  async markPaidInOffice(bookingId: string) {
    const booking = await this.findById(bookingId);
    booking.paidInOffice = true;
    return this.bookingRepo.save(booking);
  }

  async updateStatus(bookingId: string, status: string, denialReason?: string) {
    const booking = await this.findById(bookingId);
    const allowed = ['confirmed', 'cancelled', 'denied', 'quote', 'pending_payment'];
    if (!allowed.includes(status)) throw new BadRequestException('Invalid status');
    if (status === 'confirmed') {
      const total = Number(booking.totalAmount);
      const applied = Number(booking.walletApplied);
      const paidInOffice = !!booking.paidInOffice;
      const isFullyPaid = applied >= total || paidInOffice;
      if (!isFullyPaid) {
        throw new BadRequestException(
          'Mark payment first: customer must pay with wallet (My Trips) or click "Paid in office" before confirming.',
        );
      }
    }
    booking.status = status;
    if (status === 'denied' || status === 'cancelled') booking.denialReason = denialReason ?? null;
    else booking.denialReason = null;
    const saved = await this.bookingRepo.save(booking);
    let thread = await this.messagesService.findThreadByBookingId(bookingId).catch(() => null);
    if (status === 'confirmed') {
      const confirmMsg = `Your trip "${booking.title || 'Booking'}" has been confirmed.`;
      if (thread) {
        await this.messagesService.addMessage(thread.id, 'support', confirmMsg, undefined);
      } else {
        await this.messagesService.createBookingNotification(booking.customerId, bookingId, confirmMsg).catch(() => {});
      }
    } else if (thread && (status === 'cancelled' || status === 'denied')) {
      const reason = denialReason ? ` Reason: ${denialReason}` : '';
      await this.messagesService.addMessage(thread.id, 'support', `Your reservation "${booking.title || 'Booking'}" has been ${status}.${reason}`, undefined);
    }
    return saved;
  }
}
