import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';

//  Guards
import { AuthenticateGuard } from '@/src/platform/shared/guards/authenticate.guard';
import { AuthorizeGuard } from '@/src/platform/shared/guards/authorize.guard';

//  Decorators
import { User } from 'src/platform/shared/decorators/user.decorator';
import { Authorize } from '@/src/platform/shared/decorators/authorize.decorator';

//  Dtos
import { PaginationQueryDto } from '@/src/application/dto/input/shared/pagination-query.dto';
import { AccountToDto } from '@/src/application/dto/to-dto/account.to-dto';
import { CreateAccountDto } from 'src/application/dto/input/account/create-account.dto';
import { UpdateAccountDto } from '@/src/application/dto/input/account/update-account.dto';

//  Use Cases
import { GetAccountUseCase } from '@/src/application/use-cases/account/get-account.use-case';
import { GetAccountsUseCase } from '@/src/application/use-cases/account/get-accounts.use-case';
import { CreateAccountUseCase } from 'src/application/use-cases/account/create-account.use-case';
import { UpdateAccountUseCase } from 'src/application/use-cases/account/update-account.use-case';
import { DeleteAccountUseCase } from 'src/application/use-cases/account/delete-account.use-case';

//  Constants
import { Session } from '@/src/platform/shared/constants/account/auth';
import { Roles } from '@/src/platform/shared/constants/account/roles';

/**
 * @description Controller to manage Accounts
 */
@Controller('account')
export class AccountController {
  constructor(
    private readonly getAccountUseCase: GetAccountUseCase,
    private readonly getAccountsUseCase: GetAccountsUseCase,
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly updateAccountUseCase: UpdateAccountUseCase,
    private readonly deleteAccountUseCase: DeleteAccountUseCase,
  ) {}

  /**
   * @description Get account
   */
  @UseGuards(AuthenticateGuard)
  @Get()
  async getAccount(@User() user: Session): Promise<{ account: AccountToDto }> {
    return await this.getAccountUseCase.execute(user.sub);
  }

  /**
   * @description Get accounts
   * @param page? - Default: 1
   * @param limit? - Default: 10
   */
  @UseGuards(AuthenticateGuard, AuthorizeGuard)
  @Authorize(Roles.ADMIN)
  @Get('list')
  async getAccounts(@Query() dto: PaginationQueryDto) {
    return await this.getAccountsUseCase.execute(dto.page, dto.limit);
  }

  /**
   * @description Create a new account
   * @param name
   * @param domain
   */
  @Post()
  async createAccount(
    @Body() dto: CreateAccountDto,
  ): Promise<{ message: string; apikey: string }> {
    return await this.createAccountUseCase.execute({
      name: dto.name,
      domain: dto.domain,
    });
  }

  /**
   * @description Update account
   * @param name?
   * @param domain?
   */
  @UseGuards(AuthenticateGuard)
  @Patch()
  async updateAccount(
    @Body() dto: UpdateAccountDto,
    @User() user: Session,
  ): Promise<{ message: string }> {
    return await this.updateAccountUseCase.execute(user.sub, dto);
  }

  /**
   * @description Remove account
   */
  @UseGuards(AuthenticateGuard)
  @Delete()
  async deleteAccount(@User() user: Session) {
    return await this.deleteAccountUseCase.execute(user.sub);
  }
}
