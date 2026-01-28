import { Controller, Get, Param, Res, Query, UseGuards } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { join } from 'path';
import { existsSync, statSync } from 'fs';

//  Guards
import { AuthenticateGuard } from '@/src/platform/shared/guards/authenticate.guard';

//  Decorators
import { User } from 'src/platform/shared/decorators/user.decorator';

//  Use Cases
import { UpdateTransferUseCase } from '@/src/application/use-cases/storage/update-transfer.use-case';

//  Helpers
import { FileHelper } from '@/src/platform/shared/helpers/file.helper';

//  Constants
import { Session } from '@/src/platform/shared/constants/account/auth';

//  Errors
import { FileNotFoundError } from '@/src/platform/shared/errors/storage.errors';

//  i18n
import { I18nService } from 'nestjs-i18n';

@Controller('static')
export class StorageController {
  constructor(
    private readonly updateTransferUseCase: UpdateTransferUseCase,
    private readonly i18n: I18nService,
  ) {}

  @UseGuards(AuthenticateGuard)
  @Get('*')
  async getFile(
    @Param('*') path: string,
    @Query() query: any,
    @Res() reply: FastifyReply,
    @User() user: Session,
  ): Promise<void> {
    const root = join(process.cwd(), 'public');
    const filePath = join(root, path);

    //  Validate file
    if (!existsSync(filePath)) throw new FileNotFoundError(this.i18n);

    //  Validate type
    FileHelper.getFileTypeFromPath(path);

    //  Calculate transfer
    const stats = statSync(filePath);
    const fileSizeInBytes = stats.size;

    //  Register transfer
    await this.updateTransferUseCase.execute(user.sub, fileSizeInBytes);

    //  Download header
    if (query.download === 'true') {
      reply.header(
        'Content-Disposition',
        `attachment; filename="${path.split('/').pop()}"`,
      );
    }

    return reply.sendFile(path, root);
  }
}
