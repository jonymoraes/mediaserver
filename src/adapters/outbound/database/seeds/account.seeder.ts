import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Account } from '@/src/domain/entities/account.entity';
import { Roles } from '@/src/platform/shared/constants/account/roles';

@Injectable()
export class AccountSeeder {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

  async seedAccounts(): Promise<void> {
    const count = await this.accountRepo.count();
    if (count > 0) {
      console.log('Cuentas existentes, se omite el seed.');
      return;
    }

    const users: Account[] = [];

    // ==== Admin ====
    users.push(
      this.accountRepo.create({
        apikey:
          'bb324db151b6cb7261c1dc9de577e4530515764ec90cf9f74661400980aa25e2',
        name: 'Admin',
        role: Roles.ADMIN,
      }),
    );

    await this.accountRepo.save(users);
    console.log('Usuarios iniciales insertados correctamente');
  }
}
