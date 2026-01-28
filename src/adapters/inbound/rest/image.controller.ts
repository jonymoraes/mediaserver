import {
  Controller,
  Req,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';

//  Guards
import { AuthenticateGuard } from '@/src/platform/shared/guards/authenticate.guard';

//  Decorators
import { User } from 'src/platform/shared/decorators/user.decorator';

//  Use Cases
import { UploadImageUseCase } from 'src/application/use-cases/image/upload-image.use-case';
import { CancelImageProcessUseCase } from '@/src/application/use-cases/image/cancel-image-process.use-case';
import { UpdateImageStatusUseCase } from 'src/application/use-cases/image/update-image-status.use-case';
import { DeleteImageUseCase } from 'src/application/use-cases/image/delete-image.use-case';

//  Constants
import { Session } from '@/src/platform/shared/constants/account/auth';
import { Upload } from '@/src/platform/shared/constants/media/file';
import { Context } from '@/src/platform/shared/constants/media/image';

//  Helpers
import { ValidationHelper } from '@/src/platform/shared/helpers/validation.helper';

/**
 * @description Controller to manage Images
 */
@Controller('image')
export class ImageController {
  constructor(
    private readonly uploadImageUseCase: UploadImageUseCase,
    private readonly cancelImageProcessUseCase: CancelImageProcessUseCase,
    private readonly updateImageStatusUseCase: UpdateImageStatusUseCase,
    private readonly deleteImageUseCase: DeleteImageUseCase,
  ) {}

  /**
   * @description Handles image upload: validates account, quota, saves file and DB entry
   * @param req FastifyRequest containing file multipart and context
   * @param user User ID from session
   */
  @UseGuards(AuthenticateGuard)
  @Post()
  async upload(
    @Req() req: FastifyRequest,
    @User() user: Session,
  ): Promise<{ message: string; jobId: string }> {
    const body = req.body as Upload;

    const file = await ValidationHelper.isValidImageUpload(req);
    const context = body.context?.value || Context.GENERIC;

    return await this.uploadImageUseCase.execute(user.sub, file, context);
  }

  /**
   * @description Updates image status
   * @param filename
   * @param user User ID from session
   */
  @UseGuards(AuthenticateGuard)
  @Post(':jobId')
  async cancel(@Param('jobId') jobId: string): Promise<{ message: string }> {
    return await this.cancelImageProcessUseCase.execute(jobId);
  }

  /**
   * @description Updates image status
   * @param filename
   * @param user User ID from session
   */
  @UseGuards(AuthenticateGuard)
  @Patch(':filename')
  async update(@Param('filename') filename: string, @User() user: Session) {
    return await this.updateImageStatusUseCase.execute(user.sub, filename);
  }

  /**
   * @description Updates image status
   * @param filename
   */
  @UseGuards(AuthenticateGuard)
  @Delete(':filename')
  async delete(@Param('filename') filename: string, @User() user: Session) {
    return await this.deleteImageUseCase.execute(user.sub, filename);
  }
}
