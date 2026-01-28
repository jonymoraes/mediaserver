import { join, extname, basename } from 'path';
import { existsSync } from 'fs';

/**
 * @file naming.helper.ts
 * @description Helper class to generate sanitized folder names, paths, and file-friendly strings
 */
export class NamingHelper {
  /**
   * @description Converts a string into a URL-friendly slug
   * Removes accents, lowercase, replaces spaces with dash, removes invalid characters
   */
  static slugify(text: string): string {
    return text
      .normalize('NFD') // decomposes accented letters
      .replace(/[\u0300-\u036f]/g, '') // removes accents
      .toLowerCase()
      .replace(/\s+/g, '-') // spaces → dash
      .replace(/[^\w-]+/g, ''); // remove invalid chars
  }

  /**
   * @description Generates file-friendly names (keeps guiones)
   */
  static friendlyName(name: string): string {
    return this.slugify(name);
  }

  /**
   * @description Sanitizes a filename
   * @param filename Original filename
   * @returns Sanitized filename
   */
  static sanitizeFilename(filename: string): string {
    const ext = extname(filename).toLowerCase();
    const name = this.friendlyName(basename(filename, ext));
    return `${name}${ext}`;
  }

  /**
   * @description Returns an available filename based on the original filename
   * @param dest Destination folder
   * @param filename Original filename
   * @returns Available filename
   */
  static getAvailableFilename(dest: string, filename: string): string {
    const ext = extname(filename);
    const name = basename(filename, ext);
    let candidate = `${name}${ext}`;
    let index = 1;

    while (existsSync(join(dest, candidate))) {
      candidate = `${name}-${index}${ext}`;
      index++;
    }

    return candidate;
  }
}
