import { UPLOAD_FAVICON_PATH, UPLOAD_FILE_PATH } from '../constants';
import { FileUploadResult } from '../types/api';
import api from './api';
import { isEndpointMissingStatus } from './favicon';

const MULTIPART_HEADERS = { 'Content-Type': 'multipart/form-data' };

const postFile = async (path: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<{ results: FileUploadResult }>(
    path,
    formData,
    { headers: MULTIPART_HEADERS },
  );
  return data?.results;
};

/**
 * Uploads a normalised favicon and returns the value to store on
 * `general.favicon`: an id when `/upload/favicon` exists, otherwise the plain
 * URL from `/upload/file`. Only `404`/`405`/`501` trigger the fallback — a
 * rejected upload (`400`, `413`) is a real error and must reach the admin.
 * See docs/tickets/favicon-upload-api.md.
 */
export const uploadFaviconImage = async (file: File): Promise<string> => {
  try {
    const results = await postFile(UPLOAD_FAVICON_PATH, file);
    if (results?._id) return results._id;
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response
      ?.status;
    if (!isEndpointMissingStatus(status)) throw err;
  }

  const results = await postFile(UPLOAD_FILE_PATH, file);
  return results?.url || '';
};
