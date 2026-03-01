import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletLedger } from '../entities/wallet-ledger.entity';
import { Customer } from '../entities/customer.entity';
import { CustomersService } from '../customers/customers.service';

describe('WalletService', () => {
  let service: WalletService;
  const mockLedgerRepo = {
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '100' }),
    })),
    create: jest.fn((x) => x),
    save: jest.fn((x) => ({ ...x, id: 'ledger-1' })),
    find: jest.fn().mockResolvedValue([]),
  };
  const mockCustomerRepo = {};
  const mockCustomersService = { findById: jest.fn().mockResolvedValue({ id: 'cust-1' }) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: getRepositoryToken(WalletLedger), useValue: mockLedgerRepo },
        { provide: getRepositoryToken(Customer), useValue: mockCustomerRepo },
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();
    service = module.get<WalletService>(WalletService);
  });

  it('should return balance from ledger sum', async () => {
    const result = await service.getBalance('cust-1');
    expect(result).toEqual({ balance: 100, currency: 'USD' });
  });

  it('should reject topUp with non-positive amount', async () => {
    await expect(service.topUp('cust-1', 0, 'cash')).rejects.toThrow(BadRequestException);
    await expect(service.topUp('cust-1', -10, 'cash')).rejects.toThrow(BadRequestException);
  });

  it('should create ledger entry on topUp', async () => {
    const entry = await service.topUp('cust-1', 50, 'cash', 'ref1');
    expect(mockLedgerRepo.save).toHaveBeenCalled();
    expect(entry.amount).toBe(50);
  });
});
