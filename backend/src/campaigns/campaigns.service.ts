import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TripCampaign } from '../entities/trip-campaign.entity';
import { CampaignAddOn } from '../entities/campaign-addon.entity';
import { CustomerSavedCampaign } from '../entities/customer-saved-campaign.entity';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(TripCampaign)
    private campaignRepo: Repository<TripCampaign>,
    @InjectRepository(CampaignAddOn)
    private addOnRepo: Repository<CampaignAddOn>,
    @InjectRepository(CustomerSavedCampaign)
    private savedRepo: Repository<CustomerSavedCampaign>,
  ) {}

  async findAll(activeOnly = true): Promise<TripCampaign[]> {
    const qb = this.campaignRepo.createQueryBuilder('c').leftJoinAndSelect('c.addOns', 'addOns').orderBy('c.createdAt', 'DESC');
    if (activeOnly) {
      qb.where('c.status = :status', { status: 'active' });
    }
    return qb.getMany();
  }

  async findById(id: string): Promise<TripCampaign> {
    const c = await this.campaignRepo.findOne({
      where: { id },
      relations: ['addOns'],
    });
    if (!c) throw new NotFoundException('Campaign not found');
    return c;
  }

  async create(dto: {
    title: string;
    shortDescription?: string;
    description?: string;
    imageUrls?: string[];
    basePrice: number;
    currency?: string;
    status?: string;
    startAt?: string;
    endAt?: string;
    addOns?: { name: string; priceDelta: number; currency?: string }[];
  }): Promise<TripCampaign> {
    const campaign = this.campaignRepo.create({
      title: dto.title,
      shortDescription: dto.shortDescription ?? null,
      description: dto.description ?? null,
      imageUrls: dto.imageUrls ?? null,
      basePrice: dto.basePrice,
      currency: dto.currency ?? 'USD',
      status: dto.status ?? 'active',
      startAt: dto.startAt ? new Date(dto.startAt) : null,
      endAt: dto.endAt ? new Date(dto.endAt) : null,
    });
    const saved = await this.campaignRepo.save(campaign);
    if (dto.addOns?.length) {
      for (const a of dto.addOns) {
        await this.addOnRepo.save(
          this.addOnRepo.create({
            campaignId: saved.id,
            name: a.name,
            priceDelta: a.priceDelta,
            currency: a.currency ?? 'USD',
          }),
        );
      }
    }
    return this.findById(saved.id);
  }

  async update(
    id: string,
    dto: Partial<{
      title: string;
      shortDescription: string;
      description: string;
      imageUrls: string[];
      basePrice: number;
      currency: string;
      status: string;
      startAt: string;
      endAt: string;
      addOns: { name: string; priceDelta: number; currency?: string }[];
    }>,
  ): Promise<TripCampaign> {
    const campaign = await this.findById(id);
    if (dto.title != null) campaign.title = dto.title;
    if (dto.shortDescription != null) campaign.shortDescription = dto.shortDescription;
    if (dto.description != null) campaign.description = dto.description;
    if (dto.imageUrls != null) campaign.imageUrls = dto.imageUrls;
    if (dto.basePrice != null) campaign.basePrice = dto.basePrice;
    if (dto.currency != null) campaign.currency = dto.currency;
    if (dto.status != null) campaign.status = dto.status;
    if (dto.startAt != null) campaign.startAt = new Date(dto.startAt);
    if (dto.endAt != null) campaign.endAt = new Date(dto.endAt);
    await this.campaignRepo.save(campaign);
    if (dto.addOns != null) {
      await this.addOnRepo.delete({ campaignId: id });
      for (const a of dto.addOns) {
        await this.addOnRepo.save(
          this.addOnRepo.create({
            campaignId: id,
            name: a.name,
            priceDelta: a.priceDelta,
            currency: a.currency ?? 'USD',
          }),
        );
      }
    }
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const campaign = await this.findById(id);
    await this.campaignRepo.remove(campaign);
  }

  async getAddOnsByIds(campaignId: string, addOnIds: string[]): Promise<CampaignAddOn[]> {
    if (!addOnIds?.length) return [];
    const addOns = await this.addOnRepo.find({
      where: { id: In(addOnIds), campaignId },
    });
    if (addOns.length !== addOnIds.length) {
      throw new BadRequestException('Invalid add-on selection for this campaign');
    }
    return addOns;
  }

  async saveCampaign(customerId: string, campaignId: string): Promise<{ saved: true }> {
    await this.findById(campaignId);
    const existing = await this.savedRepo.findOne({ where: { customerId, campaignId } });
    if (existing) return { saved: true };
    await this.savedRepo.save(this.savedRepo.create({ customerId, campaignId }));
    return { saved: true };
  }

  async unsaveCampaign(customerId: string, campaignId: string): Promise<{ saved: false }> {
    await this.savedRepo.delete({ customerId, campaignId });
    return { saved: false };
  }

  async getSavedCampaignIds(customerId: string): Promise<string[]> {
    const rows = await this.savedRepo.find({ where: { customerId }, select: ['campaignId'] });
    return rows.map((r) => r.campaignId);
  }

  async getSavedCampaigns(customerId: string): Promise<TripCampaign[]> {
    const ids = await this.getSavedCampaignIds(customerId);
    if (!ids.length) return [];
    return this.campaignRepo.find({
      where: { id: In(ids) },
      relations: ['addOns'],
    });
  }
}
