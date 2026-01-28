import { promises as fs, existsSync, mkdirSync, renameSync, rmSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import sharp from 'sharp';
import { Logger } from '@nestjs/common';

import { allowedImageExtensions } from '../constants/media/image';
import { allowedVideoExtensions } from '../constants/media/video';

import { ConfigService } from '@nestjs/config';
import { NamingHelper } from './naming.helper';

import { Format, formatToMime } from '../constants/media/video';
import { attempt } from './attempt.helper';

export class FileHelper {
  private static configService: ConfigService;

  /**
   * @description Initializes FileHelper
   * @param configService ConfigService instance from NestJS
   */
  static init(configService: ConfigService) {
    this.configService = configService;
  }

  // Max image size in bytes
  static get MAX_IMAGE_SIZE(): number {
    if (!this.configService)
      throw new Error(
        'FileHelper not initialized. Call FileHelper.init(configService) first.',
      );
    return this.mbToBytes(
      this.configService.get<number>('MAX_IMAGE_SIZE_MB') || 5,
    );
  }

  // Max video size in bytes
  static get MAX_VIDEO_SIZE(): number {
    if (!this.configService)
      throw new Error(
        'FileHelper not initialized. Call FileHelper.init(configService) first.',
      );
    return this.mbToBytes(
      this.configService.get<number>('MAX_VIDEO_SIZE_MB') || 50,
    );
  }

  /**
   * @description Converts megabytes to bytes
   * @param mb Megabytes
   * @returns Bytes
   */
  static mbToBytes(mb: number): number {
    return mb * 1024 * 1024;
  }

  /**
   * @description Detects the type of a file based on its relative path
   * @param relativePath Relative path to the file
   * @returns 'image' | 'video' | null
   */
  static getFileTypeFromPath(relativePath: string): 'image' | 'video' | null {
    const filename = basename(relativePath);
    const ext = extname(filename).toLowerCase();

    if (allowedImageExtensions.includes(ext)) return 'image';
    if (allowedVideoExtensions.includes(ext)) return 'video';

    return null;
  }

  /**
   * @description Generates folder and storagePath from name/domain
   * Uses slugify for folder
   */
  static generatePaths(name: string, domain?: string) {
    const folderName = domain ?? name;
    const folder = NamingHelper.slugify(folderName); // sanitized folder
    const storagePath = `public/${folder}`;
    return { folder, storagePath };
  }

  /**
   * @description Creates a folder if it doesn't exist
   * @param folderPath Absolute or relative folder path
   */
  static ensureFolder(folderPath: string): void {
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }
  }

  static generateFolder(domain: string) {
    let normalized = domain.trim();

    // Remove protocol
    normalized = normalized.replace(/^https?:\/\//, '');

    // Replace slashes with underscore
    normalized = normalized.replace(/\//g, '_');

    // Remove trailing underscores
    normalized = normalized.replace(/_+$/, '');

    const folder = normalized;
    const storagePath = `public/${folder}`;

    return { folder, storagePath };
  }

  /**
   * @description Renames (moves) a folder atomically
   * @param oldPath Existing folder path
   * @param newPath New folder path
   */
  static renameFolder(oldPath: string, newPath: string): void {
    if (oldPath === newPath) return;

    if (!existsSync(oldPath)) {
      throw new Error(`Source folder does not exist: ${oldPath}`);
    }

    const parentDir = join(newPath, '..');
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }

    if (existsSync(newPath)) {
      throw new Error(`Target folder already exists: ${newPath}`);
    }

    renameSync(oldPath, newPath);
  }

  /**
   * @description Deletes a folder and all its contents recursively
   * @param folderPath Absolute or relative path to the folder
   */
  static removeFolder(folderPath: string): void {
    if (!folderPath) return;

    if (!existsSync(folderPath)) return;

    try {
      rmSync(folderPath, { recursive: true, force: true });
    } catch (error) {
      throw new Error(
        `Failed to remove folder ${folderPath}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * @description Prepares a file for upload
   * @param uploadDir Upload directory
   * @param originalFilename Original filename
   * @returns Object with final filepath and sanitized filename
   */
  static prepareUploadFilepath(
    uploadDir: string,
    originalFilename: string,
  ): { filePath: string; finalName: string } {
    this.ensureFolder(uploadDir);

    const sanitized = NamingHelper.sanitizeFilename(originalFilename);
    const finalName = NamingHelper.getAvailableFilename(uploadDir, sanitized);
    const filePath = join(uploadDir, finalName);

    return { filePath, finalName };
  }

  /**
   * @description Converts/resizes an image using Sharp and saves it to outputPath
   * @param inputPath Absolute path to source image
   * @param outputPath Absolute path to save processed image
   * @param width Target width
   * @param height Target height
   * @param fit Fit option for Sharp (default: 'cover')
   * @param quality WebP quality (default: 100)
   */
  static async converter(
    filepath: string,
    width: number,
    height: number,
    fit: 'cover' | 'contain' | 'inside' | 'outside' | 'fill' = 'cover',
    quality = 100,
    canceled = false,
  ) {
    try {
      this.ensureFolder(dirname(filepath));

      if (canceled) throw new Error('Canceled');

      const buffer = await sharp(filepath)
        .resize(width, height, { fit, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();

      if (canceled) {
        attempt(() => rmSync(filepath));
        throw new Error('Canceled');
      }

      await sharp(buffer).toFile(filepath);
    } catch (error) {
      if ((error as Error).message === 'Canceled') {
        attempt(() => rmSync(filepath));
        throw new Error('Canceled');
      }

      throw new Error(
        `Sharp processing failed for ${filepath}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * @description Detects the type of a file based on its extension
   * @param filename Name of the file
   * @returns 'image' | 'video' | null
   */
  static getFileType(filename: string): 'image' | 'video' | null {
    const ext = extname(filename).toLowerCase();

    if (allowedImageExtensions.includes(ext)) return 'image';
    if (allowedVideoExtensions.includes(ext)) return 'video';

    return null;
  }

  static getMimeType(format: string | Format): string {
    const f = format.toString().toLowerCase() as Format;
    const mime = formatToMime[f];
    if (!mime) throw new Error(`No MIME type defined for format: ${format}`);
    return mime;
  }

  /**
   * @description Cleans up files
   * @param originalPath?
   * @param outputPath?
   */
  static async cleanup(
    originalPath: string,
    outputPath?: string,
    logger?: Logger,
  ): Promise<void> {
    if (originalPath && existsSync(originalPath)) {
      await fs.unlink(originalPath).catch(() => {
        logger?.warn(`Failed to delete original file: ${originalPath}`);
      });
    }

    if (outputPath && existsSync(outputPath)) {
      await fs.unlink(outputPath).catch(() => {
        logger?.warn(`Failed to delete output file: ${outputPath}`);
      });
    }
  }
}
