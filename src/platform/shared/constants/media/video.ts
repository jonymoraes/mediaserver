export enum Format {
  GIF = 'gif',
  MP4 = 'mp4',
  WEBM = 'webm',
}

export interface Transcode {
  videoCodec: string;
  audioCodec: string;
}

export const Codecs: Record<Format, Transcode> = {
  [Format.GIF]: { videoCodec: 'gif', audioCodec: '' },
  [Format.MP4]: { videoCodec: 'libx264', audioCodec: 'aac' },
  [Format.WEBM]: { videoCodec: 'libvpx-vp9', audioCodec: 'libopus' },
};

// Allowed file extensions for videos
export const allowedVideoExtensions = ['.mp4', '.webm', '.mov', '.mkv'];

// Allowed mime types for videos
export const allowedVideoMimeTypes = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
];

// Format to mime
export const formatToMime: Record<Format, string> = {
  [Format.MP4]: 'video/mp4',
  [Format.WEBM]: 'video/webm',
  [Format.GIF]: 'image/gif',
};
