import { Controller, Get, UseGuards } from '@nestjs/common';

//  Guards
import { AuthenticateGuard } from '@/src/platform/shared/guards/authenticate.guard';

//  Decorators
import { User } from 'src/platform/shared/decorators/user.decorator';

//  Dtos
import { QuotaToDto } from 'src/application/dto/to-dto/quota.to-dto';

//  Use Cases
import { GetQuotaUseCase } from 'src/application/use-cases/quota/get-quota.use-case';

//  Constants
import { Session } from '@/src/platform/shared/constants/account/auth';

/**
 * @description Controller to manage Quotas
 */
@Controller('quota')
export class QuotaController {
  constructor(private readonly getQuotaUseCase: GetQuotaUseCase) {}

  /**
   * @description Get quota
   */
  @UseGuards(AuthenticateGuard)
  @Get()
  async getQuota(@User() user: Session): Promise<{ quota: QuotaToDto }> {
    return await this.getQuotaUseCase.execute(user.sub);
  }
}
