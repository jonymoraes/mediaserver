import { extname } from 'path';

import { FastifyRequest } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { BadRequestException } from '@nestjs/common';

import {
  allowedImageExtensions,
  allowedImageMimeTypes,
} from '../constants/media/image';

import {
  allowedVideoExtensions,
  allowedVideoMimeTypes,
} from '../constants/media/video';

import { FileHelper } from './file.helper';

export class ValidationHelper {
  /**
   * @description Validate if a file is an allowed image
   * @param filename File name with extension
   * @param mimetype File MIME type
   * @returns true if valid image
   */
  static isValidImageFile(filename: string, mimetype: string): boolean {
    const ext = extname(filename).toLowerCase();
    return (
      allowedImageExtensions.includes(ext) &&
      allowedImageMimeTypes.includes(mimetype)
    );
  }

  /**
   * @description Validate if a file is an allowed video
   * @param filename File name with extension
   * @param mimetype File MIME type
   * @returns true if valid video
   */
  static isValidVideoFile(filename: string, mimetype: string): boolean {
    const ext = extname(filename).toLowerCase();
    return (
      allowedVideoExtensions.includes(ext) &&
      allowedVideoMimeTypes.includes(mimetype)
    );
  }

  /**
   * @description Validates a Fastify multipart image upload
   * Checks presence, extension, mimetype, empty buffer, and max size
   * @param req FastifyRequest containing multipart body
   * @returns Validated MultipartFile with buffer attached
   * @throws BadRequestException if validation fails
   */
  static async isValidImageUpload(req: FastifyRequest): Promise<MultipartFile> {
    const body = req.body as { file?: MultipartFile };
    const file = body?.file;

    if (!file) {
      throw new BadRequestException('image: Image is required.');
    }

    if (!file.filename || !file.mimetype) {
      throw new BadRequestException('image: Invalid file.');
    }

    if (!this.isValidImageFile(file.filename, file.mimetype)) {
      throw new BadRequestException('image: Invalid image.');
    }

    let buffer: Buffer;
    try {
      buffer = await file.toBuffer();
    } catch {
      throw new BadRequestException('image: Failed to read image.');
    }

    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('image: Empty image.');
    }

    if (buffer.length > FileHelper.MAX_IMAGE_SIZE) {
      throw new BadRequestException('image: File size exceeds limit.');
    }

    // Attach buffer to file for later use
    (file as any).buffer = buffer;

    return file;
  }

  /**
   * @description Validates a Fastify multipart video upload
   * Checks presence, extension, mimetype, empty buffer, and max size
   * @param req FastifyRequest containing multipart body
   * @returns Validated MultipartFile with buffer attached
   * @throws BadRequestException if validation fails
   */
  static async isValidVideoUpload(req: FastifyRequest): Promise<MultipartFile> {
    const body = req.body as { file?: MultipartFile };
    const file = body?.file;

    if (!file) {
      throw new BadRequestException('video: Video is required.');
    }

    if (!file.filename || !file.mimetype) {
      throw new BadRequestException('video: Invalid file.');
    }

    if (!this.isValidVideoFile(file.filename, file.mimetype)) {
      throw new BadRequestException('video: Invalid video.');
    }

    let buffer: Buffer;
    try {
      buffer = await file.toBuffer();
    } catch {
      throw new BadRequestException('video: Failed to read video.');
    }

    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('video: Empty video.');
    }

    if (buffer.length > FileHelper.MAX_VIDEO_SIZE) {
      throw new BadRequestException('video: File size exceeds limit.');
    }

    (file as any).buffer = buffer;

    return file;
  }

  static isVideo(filename: string, mimetype: string): boolean {
    const ext = extname(filename).toLowerCase();
    return (
      allowedVideoExtensions.includes(ext) &&
      allowedVideoMimeTypes.includes(mimetype)
    );
  }

  static isImage(filename: string, mimetype: string): boolean {
    const ext = extname(filename).toLowerCase();
    return (
      allowedImageExtensions.includes(ext) &&
      allowedImageMimeTypes.includes(mimetype)
    );
  }
}
