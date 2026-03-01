import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Customer } from '../entities/customer.entity';
import { NFCIdentifier } from '../entities/nfc-identifier.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(NFCIdentifier)
    private nfcRepo: Repository<NFCIdentifier>,
  ) {}

  async findById(id: string): Promise<Customer> {
    const c = await this.customerRepo.findOne({
      where: { id },
      relations: ['user', 'nfcIdentifiers'],
    });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  async findByUserId(userId: string): Promise<Customer> {
    const c = await this.customerRepo.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  async findByNfcUid(tagUid: string): Promise<Customer | null> {
    const nfc = await this.nfcRepo.findOne({
      where: { tagUid, status: 'active' },
      relations: ['customer', 'customer.user'],
    });
    return nfc?.customer ?? null;
  }

  async addNfcIdentifier(customerId: string, tagUid: string, label?: string): Promise<NFCIdentifier> {
    await this.findById(customerId);
    const existing = await this.nfcRepo.findOne({ where: { tagUid } });
    if (existing) throw new Error('NFC tag already linked to another customer');
    const nfc = this.nfcRepo.create({ customerId, tagUid, label });
    return this.nfcRepo.save(nfc);
  }

  async hasPin(customerId: string): Promise<boolean> {
    const c = await this.customerRepo.findOne({ where: { id: customerId }, select: ['pinHash'] });
    return !!c?.pinHash;
  }

  async setPin(customerId: string, pin: string, confirmPin?: string, oldPin?: string): Promise<{ ok: boolean }> {
    const customer = await this.findById(customerId);
    if (typeof pin !== 'string' || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      throw new BadRequestException('PIN must be 6 digits');
    }
    if (confirmPin !== undefined && pin !== confirmPin) {
      throw new BadRequestException('PIN and confirmation do not match');
    }
    if (customer.pinHash) {
      if (!oldPin) throw new BadRequestException('Current PIN required to change');
      const ok = await bcrypt.compare(oldPin, customer.pinHash);
      if (!ok) throw new UnauthorizedException('Current PIN is incorrect');
    }
    customer.pinHash = await bcrypt.hash(pin, 10);
    await this.customerRepo.save(customer);
    return { ok: true };
  }

  async verifyPin(customerId: string, pin: string): Promise<boolean> {
    const customer = await this.customerRepo.findOne({ where: { id: customerId }, select: ['pinHash'] });
    if (!customer?.pinHash) return false;
    return bcrypt.compare(pin, customer.pinHash);
  }

  async resetPinByAdmin(customerId: string): Promise<{ ok: boolean }> {
    const customer = await this.findById(customerId);
    customer.pinHash = null;
    await this.customerRepo.save(customer);
    return { ok: true };
  }
}

