import { Test, TestingModule } from '@nestjs/testing';
import { QrService } from './qr.service';
import { CustomersService } from '../customers/customers.service';

describe('QrService', () => {
  let service: QrService;
  const mockCustomersService = { findById: jest.fn().mockResolvedValue({ id: 'cust-1' }) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QrService,
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();
    service = module.get<QrService>(QrService);
  });

  it('should create session and return token', async () => {
    const token = await service.createSession('cust-1');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);
  });

  it('should resolve session within TTL', async () => {
    const token = await service.createSession('cust-1');
    const customerId = service.resolveSession(token);
    expect(customerId).toBe('cust-1');
  });

  it('should return null for invalid token', () => {
    expect(service.resolveSession('invalid')).toBeNull();
  });
});
