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
import { UploadVideoUseCase } from 'src/application/use-cases/video/upload-video.use-case';
import { CancelVideoProcessUseCase } from '@/src/application/use-cases/video/cancel-video-process.use-case';
import { UpdateVideoStatusUseCase } from 'src/application/use-cases/video/update-video-status.use-case';
import { DeleteVideoUseCase } from '@/src/application/use-cases/video/delete-video.use-case';

//  Constants
import { Session } from '@/src/platform/shared/constants/account/auth';
import { Upload } from '@/src/platform/shared/constants/media/file';

//  Helpers
import { ValidationHelper } from '@/src/platform/shared/helpers/validation.helper';
import { Format } from '@/src/platform/shared/constants/media/video';

/**
 * @description Controller to manage Images
 */
@Controller('video')
export class VideoController {
  constructor(
    private readonly uploadVideoUseCase: UploadVideoUseCase,
    private readonly cancelVideoProcessUseCase: CancelVideoProcessUseCase,
    private readonly updateVideoStatusUseCase: UpdateVideoStatusUseCase,
    private readonly deleteVideoUseCase: DeleteVideoUseCase,
  ) {}

  /**
   * @description Handles video upload: validates account, quota, saves file and DB entry
   * @param userId User ID from session
   * @param file MultipartFile with buffer
   * @param format Optional video format
   */
  @UseGuards(AuthenticateGuard)
  @Post()
  async upload(@Req() req: FastifyRequest, @User() user: Session) {
    const body = req.body as Upload;

    const file = await ValidationHelper.isValidVideoUpload(req);
    const format = body.format?.value || Format.WEBM;

    return await this.uploadVideoUseCase.execute(user.sub, file, format);
  }

  /**
   * @description Handles video cancellation
   * @param jobId
   */
  @UseGuards(AuthenticateGuard)
  @Post(':jobId')
  async cancel(@Param('jobId') jobId: string): Promise<{ message: string }> {
    return await this.cancelVideoProcessUseCase.execute(jobId);
  }

  /**
   * @description Updates video status
   * @param filename
   */
  @UseGuards(AuthenticateGuard)
  @Patch(':filename')
  async update(@Param('filename') filename: string, @User() user: Session) {
    return await this.updateVideoStatusUseCase.execute(user.sub, filename);
  }

  /**
   * @description Handles video deletion
   * @param filename
   */
  @UseGuards(AuthenticateGuard)
  @Delete(':filename')
  async delete(@Param('filename') filename: string, @User() user: Session) {
    return await this.deleteVideoUseCase.execute(user.sub, filename);
  }
}
