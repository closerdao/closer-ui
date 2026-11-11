import { UPLOAD_PHOTO_PATH } from '../constants/api.constants';
import api, { doRefresh, notifySessionInvalid } from './api';
import { getAccessToken } from './authStorage';
import { isTrpcEnabled } from './trpc';

export type UploadedPhoto = {
  _id: string;
  urls: Record<string, string>;
  fileType?: 'image' | 'pdf';
  pdfMetadata?: Record<string, unknown>;
};

type UploadPhotoResponse = { data: { results: UploadedPhoto } };

// The tRPC server answers uploads as plain HTTP on the origin that serves `/trpc`.
const uploadUrl = (path: string): string =>
  isTrpcEnabled()
    ? `${(process.env.NEXT_PUBLIC_TRPC_URL ?? '').replace(/\/trpc\/?$/, '')}${path}`
    : `${process.env.NEXT_PUBLIC_API_URL}${path}`;

export const photoUploadUrl = (): string => uploadUrl(UPLOAD_PHOTO_PATH);

const postForm = (path: string, formData: FormData): Promise<Response> => {
  const token = getAccessToken();
  return fetch(uploadUrl(path), {
    method: 'POST',
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).catch(() => {
    throw new Error('Network Error');
  });
};

// Same shape as the axios rejection parseMessageFromError reads (`response.data.error`).
const uploadError = async (response: Response): Promise<Error> => {
  const data = await response.json().catch(() => undefined);
  if (!data) {
    return Object.assign(new Error('Something went wrong'), {
      response: { status: response.status, data },
    });
  }
  const message =
    typeof data.error === 'string'
      ? data.error
      : `Request failed with status code ${response.status}`;
  return Object.assign(new Error(message), {
    response: { status: response.status, data },
  });
};

// Like the tRPC client: a 401 refreshes once through the shared lock and retries.
const uploadThroughTrpc = async <T>(
  path: string,
  formData: FormData,
): Promise<{ data: T }> => {
  let response = await postForm(path, formData);
  if (response.status === 401) {
    const refreshed = await doRefresh().then(
      () => true,
      (refreshError: { silentAuthRedirect?: boolean }) => {
        if (!refreshError?.silentAuthRedirect) notifySessionInvalid();
        return false;
      },
    );
    if (refreshed) response = await postForm(path, formData);
  }
  if (!response.ok) throw await uploadError(response);
  return { data: await response.json() };
};

export const uploadForm = <T>(
  path: string,
  formData: FormData,
): Promise<{ data: T }> =>
  isTrpcEnabled()
    ? uploadThroughTrpc<T>(path, formData)
    : api.post<T>(path, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

export const uploadPhoto = (formData: FormData): Promise<UploadPhotoResponse> =>
  uploadForm<UploadPhotoResponse['data']>(UPLOAD_PHOTO_PATH, formData);
