import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Booking } from '../entities/booking.entity';
import { WalletLedger } from '../entities/wallet-ledger.entity';
import { CustomersService } from '../customers/customers.service';
import { WalletService } from '../wallet/wallet.service';
import { HotelsService } from '../catalog/hotels.service';
import { FlightsService } from '../catalog/flights.service';

describe('BookingsService', () => {
  let service: BookingsService;
  const mockBookingRepo = {
    create: jest.fn((dto) => dto),
    save: jest.fn((x) => Promise.resolve({ ...x, id: 'booking-1' })),
  };
  const mockLedgerRepo = { save: jest.fn(), create: jest.fn((x) => x) };
  const mockCustomersService = { findById: jest.fn().mockResolvedValue({ id: 'cust-1' }) };
  const mockWalletService = { getBalance: jest.fn().mockResolvedValue({ balance: 500 }) };
  const mockHotelsService = {
    findById: jest.fn().mockResolvedValue({ id: 'h1', name: 'Safari Lodge', pricePerNight: 150, currency: 'USD' }),
  };
  const mockFlightsService = {
    findById: jest.fn().mockResolvedValue({ id: 'f1', origin: 'NBO', destination: 'DXB', price: 350, currency: 'USD' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useValue: mockBookingRepo },
        { provide: getRepositoryToken(WalletLedger), useValue: mockLedgerRepo },
        { provide: CustomersService, useValue: mockCustomersService },
        { provide: WalletService, useValue: mockWalletService },
        { provide: HotelsService, useValue: mockHotelsService },
        { provide: FlightsService, useValue: mockFlightsService },
      ],
    }).compile();
    service = module.get<BookingsService>(BookingsService);
  });

  it('should reject createFromCatalog when neither hotelId nor flightId', async () => {
    await expect(service.createFromCatalog('cust-1')).rejects.toThrow(BadRequestException);
    await expect(service.createFromCatalog('cust-1', undefined, undefined)).rejects.toThrow(BadRequestException);
  });

  it('should reject createFromCatalog when both hotelId and flightId', async () => {
    await expect(service.createFromCatalog('cust-1', 'h1', 'f1')).rejects.toThrow(BadRequestException);
  });

  it('should create booking from hotel catalog', async () => {
    const booking = await service.createFromCatalog('cust-1', 'h1');
    expect(mockCustomersService.findById).toHaveBeenCalledWith('cust-1');
    expect(mockHotelsService.findById).toHaveBeenCalledWith('h1');
    expect(mockBookingRepo.save).toHaveBeenCalled();
    expect(booking.bookingType).toBe('hotel');
    expect(booking.title).toBe('Safari Lodge');
    expect(booking.hotelId).toBe('h1');
    expect(booking.totalAmount).toBe(150);
  });

  it('should create booking from flight catalog', async () => {
    const booking = await service.createFromCatalog('cust-1', undefined, 'f1');
    expect(mockFlightsService.findById).toHaveBeenCalledWith('f1');
    expect(mockBookingRepo.save).toHaveBeenCalled();
    expect(booking.bookingType).toBe('flight');
    expect(booking.title).toBe('NBO → DXB');
    expect(booking.flightId).toBe('f1');
    expect(booking.totalAmount).toBe(350);
  });
});
