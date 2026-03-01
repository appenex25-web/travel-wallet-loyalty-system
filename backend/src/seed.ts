/**
 * Seed script: creates default admin user, branch, and agent.
 * Run: npm run seed
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Branch } from './entities/branch.entity';
import { Agent } from './entities/agent.entity';
import { Customer } from './entities/customer.entity';
import { NFCIdentifier } from './entities/nfc-identifier.entity';
import { WalletLedger } from './entities/wallet-ledger.entity';
import { PointsLedger } from './entities/points-ledger.entity';
import { Offer } from './entities/offer.entity';
import { Redemption } from './entities/redemption.entity';
import { Booking } from './entities/booking.entity';
import { Hotel } from './entities/hotel.entity';
import { Flight } from './entities/flight.entity';
import { TripCampaign } from './entities/trip-campaign.entity';
import { CampaignAddOn } from './entities/campaign-addon.entity';
import { MessageThread } from './entities/message-thread.entity';
import { Message } from './entities/message.entity';
import { Post } from './entities/post.entity';
import { CustomerSavedCampaign } from './entities/customer-saved-campaign.entity';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/travel_wallet',
  entities: [User, Branch, Agent, Customer, NFCIdentifier, WalletLedger, PointsLedger, Offer, Redemption, Booking, Hotel, Flight, TripCampaign, CampaignAddOn, MessageThread, Message, Post, CustomerSavedCampaign],
  synchronize: false,
});

async function seed() {
  await dataSource.initialize();
  const userRepo = dataSource.getRepository(User);
  const branchRepo = dataSource.getRepository(Branch);
  const agentRepo = dataSource.getRepository(Agent);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@travel.local';
  let user = await userRepo.findOne({ where: { email: adminEmail } });
  if (!user) {
    const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'admin123', 10);
    user = userRepo.create({
      email: adminEmail,
      passwordHash,
      role: 'admin',
      active: true,
    });
    user = await userRepo.save(user);
    console.log('Created admin user:', adminEmail);
  }

  let branch = await branchRepo.findOne({ where: { name: 'Main Branch' } });
  if (!branch) {
    branch = branchRepo.create({ name: 'Main Branch', location: 'Head Office', active: true });
    branch = await branchRepo.save(branch);
    console.log('Created branch: Main Branch');
  }

  let agent = await agentRepo.findOne({ where: { userId: user.id } });
  if (!agent) {
    agent = agentRepo.create({
      userId: user.id,
      branchId: branch.id,
      displayName: 'Admin Agent',
      active: true,
    });
    agent = await agentRepo.save(agent);
    console.log('Created agent for admin');
  }

  await dataSource.destroy();
  console.log('Seed done. Login at /auth/agent/login with', adminEmail);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
