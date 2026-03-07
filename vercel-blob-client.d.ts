declare module "@vercel/blob/client" {
  export interface PutBlobResult {
    url: string;
    pathname: string;
    contentType: string;
    contentDisposition: string;
    downloadUrl?: string;
  }

  export interface UploadOptions {
    access: "public" | "private";
    handleUploadUrl: string;
    onUploadProgress?: (event: { percentage: number }) => void;
    contentType?: string;
    multipart?: boolean;
    abortSignal?: AbortSignal;
  }

  export function upload(
    pathname: string,
    body: Blob | File | ArrayBuffer | string | ReadableStream,
    options: UploadOptions
  ): Promise<PutBlobResult>;

  export type HandleUploadBody = unknown;

  export interface HandleUploadOptions {
    body: HandleUploadBody;
    request: Request | import("node:http").IncomingMessage;
    onBeforeGenerateToken: (
      pathname: string,
      clientPayload: string | null,
      multipart: boolean
    ) => Promise<{
      allowedContentTypes?: string[];
      maximumSizeInBytes?: number;
      addRandomSuffix?: boolean;
      tokenPayload?: string | null;
    }>;
    onUploadCompleted?: (payload: {
      blob: PutBlobResult;
      tokenPayload?: string | null;
    }) => Promise<void>;
  }

  export function handleUpload(options: HandleUploadOptions): Promise<unknown>;
}
