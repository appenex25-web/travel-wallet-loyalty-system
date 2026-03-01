import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { Customer } from '../entities/customer.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashed'),
}));

describe('AuthService', () => {
  let service: AuthService;
  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn((x) => ({ ...x, id: 'user-1' })),
  };
  const mockCustomerRepo = {
    create: jest.fn((x) => x),
    save: jest.fn((x) => Promise.resolve({ ...x, id: 'cust-1' })),
  };
  const mockJwtService = { sign: jest.fn(() => 'jwt-token') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Customer), useValue: mockCustomerRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it('should return user when credentials valid', async () => {
    const user = { id: '1', email: 'a@b.com', passwordHash: 'hash', role: 'customer', active: true };
    mockUserRepo.findOne.mockResolvedValue(user);
    const result = await service.validateUser('a@b.com', 'password');
    expect(result).toEqual(user);
  });

  it('should throw ConflictException when registering existing email', async () => {
    mockUserRepo.findOne.mockResolvedValue({ id: '1', email: 'a@b.com' });
    await expect(service.registerCustomer('a@b.com', 'pass', 'Name')).rejects.toThrow(ConflictException);
  });

  it('should return access_token on login', async () => {
    const user = { id: '1', email: 'a@b.com', role: 'customer' };
    const result = await service.login(user as never);
    expect(result.access_token).toBe('jwt-token');
    expect(result.user).toEqual(user);
  });
});
