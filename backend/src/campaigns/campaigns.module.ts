import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripCampaign } from '../entities/trip-campaign.entity';
import { CampaignAddOn } from '../entities/campaign-addon.entity';
import { CustomerSavedCampaign } from '../entities/customer-saved-campaign.entity';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TripCampaign, CampaignAddOn, CustomerSavedCampaign]),
    CustomersModule,
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
