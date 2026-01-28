import { JobStatus } from '../messaging';

type MultipartField = {
  value: string;
  fieldname: string;
  mimetype: string;
  encoding: string;
};

type MultipartFile = {
  filename: string;
  mimetype: string;
  encoding: string;
  toBuffer: () => Promise<Buffer>;
};

export type Upload = {
  file: MultipartFile;
  context?: MultipartField;
  format?: MultipartField;
};

export type ImageJobData = {
  jobId: string;
  status: JobStatus;
  filename: string;
  filepath: string;
  mimetype: string;
  filesize: number;
  context: string;
  accountId: string;
  quotaId: string;
};

export type VideoJobData = {
  jobId: string;
  status: JobStatus;
  filename: string;
  filepath: string;
  mimetype: string;
  filesize: number;
  format: string;
  accountId: string;
  quotaId: string;
};
