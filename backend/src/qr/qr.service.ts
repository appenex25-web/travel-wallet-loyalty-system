import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { CustomersService } from '../customers/customers.service';

const TTL_SECONDS = 60;
const sessions = new Map<string, { customerId: string; createdAt: number }>();

function prune() {
  const now = Date.now();
  for (const [token, data] of sessions.entries()) {
    if (now - data.createdAt > TTL_SECONDS * 1000) sessions.delete(token);
  }
}

@Injectable()
export class QrService {
  constructor(private customersService: CustomersService) {}

  async createSession(customerId: string): Promise<string> {
    await this.customersService.findById(customerId);
    prune();
    const token = randomBytes(24).toString('hex');
    sessions.set(token, { customerId, createdAt: Date.now() });
    return token;
  }

  resolveSession(token: string): string | null {
    prune();
    const data = sessions.get(token);
    if (!data) return null;
    const age = (Date.now() - data.createdAt) / 1000;
    if (age > TTL_SECONDS) {
      sessions.delete(token);
      return null;
    }
    return data.customerId;
  }
}
