import { Logger } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { dirname } from 'path';
import { FileHelper } from './file.helper';

export interface TranscodeOptions {
  input: string;
  output: string;
  videoCodec: string;
  audioCodec: string;
  duration?: number;
  loggerName: string;
  onProgress?: (percentage: number, stage: string) => void;
  onCancel?: () => boolean;
}

export class TranscodeHelper {
  /**
   * @description Transcodes a video from input to output path
   */
  static async transcodeVideo(options: TranscodeOptions): Promise<void> {
    const {
      input,
      output,
      videoCodec,
      audioCodec,
      duration,
      loggerName,
      onProgress,
      onCancel,
    } = options;
    const logger = new Logger(loggerName);

    // Aseguramos carpeta de salida
    FileHelper.ensureFolder(dirname(output));

    await new Promise<void>((resolve, reject) => {
      const ffmpeg: ChildProcessWithoutNullStreams = spawn('ffmpeg', [
        '-y', // sobrescribir si existe
        '-i',
        input,
        '-c:v',
        videoCodec,
        '-b:v',
        '1M',
        '-c:a',
        audioCodec,
        output, // archivo de salida
      ]);

      ffmpeg.stderr.on('data', (data) => {
        const line = data.toString();
        logger.debug(`ffmpeg: ${line}`);

        if (onCancel?.()) {
          logger.warn('Kill ffmpeg process due to cancellation');
          ffmpeg.kill('SIGINT');
          reject(new Error('Cancelled'));
          return;
        }

        if (duration && onProgress) {
          const match = line.match(/time=(\d+):(\d+):(\d+\.\d+)/);
          if (match) {
            const [, hh, mm, ss] = match;
            const current =
              parseInt(hh) * 3600 + parseInt(mm) * 60 + parseFloat(ss);
            const percentage = Math.min(
              95,
              Math.floor((current / duration) * 65) + 15,
            );
            onProgress(percentage, 'transcoding');
          }
        }
      });

      ffmpeg.on('error', (err) =>
        reject(new Error(`ffmpeg error: ${err.message}`)),
      );

      ffmpeg.on('close', (code) => {
        if (onCancel?.()) {
          logger.warn('ffmpeg process closed after cancellation');
          return reject(new Error('Cancelled'));
        }
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });
    });
  }

  /**
   * @description Returns the duration of a video
   */
  static async getDuration(
    filepath: string,
    loggerName = 'TranscodeHelper',
  ): Promise<number> {
    const logger = new Logger(loggerName);

    return new Promise<number>((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v',
        'error',
        '-select_streams',
        'v:0',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        filepath,
      ]);

      let output = '';
      let errorOutput = '';

      ffprobe.stdout.on('data', (data: Buffer) => (output += data.toString()));
      ffprobe.stderr.on(
        'data',
        (data: Buffer) => (errorOutput += data.toString()),
      );

      ffprobe.on('close', (code: number) => {
        if (code === 0) {
          const duration = parseFloat(output.trim());
          if (isNaN(duration)) {
            logger.error(`Duration is NaN. Output: "${output}"`);
            reject(new Error('Could not parse video duration'));
          } else {
            resolve(duration);
          }
        } else {
          logger.error(`ffprobe failed. Code: ${code}. Error: ${errorOutput}`);
          reject(new Error('ffprobe failed to get duration'));
        }
      });
    });
  }
}
