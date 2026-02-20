import type { FkField } from './common.js';

export interface InboxItem {
  InboxId: number;
  DocumentNumber?: string;
  Description?: string;
  Customer?: FkField;
  DateReceived?: string;
  DateDocument?: string;
  TotalAmount?: number;
  Currency?: FkField;
  Status?: string;
  RowVersion?: string;
  Attachments?: InboxAttachment[];
  [key: string]: unknown;
}

export interface InboxAttachment {
  AttachmentId: number;
  FileName?: string;
  FileSize?: number;
  ContentType?: string;
  [key: string]: unknown;
}
