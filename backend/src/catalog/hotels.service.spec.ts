import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { Hotel } from '../entities/hotel.entity';

describe('HotelsService', () => {
  let service: HotelsService;
  const mockHotelRepo = {
    find: jest.fn().mockResolvedValue([{ id: 'h1', name: 'Test Hotel', location: 'Nairobi' }]),
    findOne: jest.fn().mockResolvedValue({ id: 'h1', name: 'Test Hotel', pricePerNight: 100, currency: 'USD' }),
    create: jest.fn((dto) => ({ ...dto, id: 'h1' })),
    save: jest.fn((x) => Promise.resolve({ ...x, id: 'h1' })),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotelsService,
        { provide: getRepositoryToken(Hotel), useValue: mockHotelRepo },
      ],
    }).compile();
    service = module.get<HotelsService>(HotelsService);
  });

  it('should list hotels ordered by name', async () => {
    const list = await service.findAll();
    expect(mockHotelRepo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Test Hotel');
  });

  it('should return hotel by id', async () => {
    const hotel = await service.findById('h1');
    expect(mockHotelRepo.findOne).toHaveBeenCalledWith({ where: { id: 'h1' } });
    expect(hotel.name).toBe('Test Hotel');
  });

  it('should throw when hotel not found', async () => {
    mockHotelRepo.findOne.mockResolvedValueOnce(null);
    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });

  it('should create hotel', async () => {
    const created = await service.create({ name: 'New Hotel', location: 'Dubai', pricePerNight: 200 });
    expect(mockHotelRepo.create).toHaveBeenCalled();
    expect(mockHotelRepo.save).toHaveBeenCalled();
    expect(created.name).toBe('New Hotel');
  });
});
