import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Customer } from '../entities/customer.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || !user.active) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    return ok ? user : null;
  }

  async registerCustomer(email: string, password: string, name: string, phone?: string) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ email, passwordHash, role: 'customer' });
    const savedUser = await this.userRepo.save(user);
    const customer = this.customerRepo.create({ userId: savedUser.id, name, phone: phone ?? undefined });
    await this.customerRepo.save(customer);
    return this.login(savedUser);
  }

  async login(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword === true,
      },
    };
  }

  /** Customer changes password (e.g. after first login with default password). */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ ok: boolean }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new (await import('@nestjs/common')).NotFoundException('User not found');
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new (await import('@nestjs/common')).UnauthorizedException('Current password is incorrect');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    user.mustChangePassword = false;
    await this.userRepo.save(user);
    return { ok: true };
  }
}
