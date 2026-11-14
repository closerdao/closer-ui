import type { EmailTemplate } from '../types/emailTemplate';
import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

// Legacy `GET /emailtemplates?limit=N`.
export const fetchEmailTemplates = async (
  limit: number,
): Promise<EmailTemplate[]> => {
  if (!isTrpcEnabled('8.1a')) {
    const res = await api.get(`/emailtemplates?limit=${limit}`);
    return res?.data?.results ?? [];
  }
  const results = await trpc.emailTemplate.list
    .query({ limit })
    .catch(throwApiError);
  return results as EmailTemplate[];
};

// The editor page treats a failed variables read as no variables.
export const fetchEmailTemplateVariables = async (): Promise<string[]> => {
  if (!isTrpcEnabled('8.1a')) {
    const res = await api
      .get('/emails/template-variables')
      .catch(() => ({ data: { results: [] } }));
    return res?.data?.results ?? [];
  }
  return trpc.emailTemplate.variables.query().catch(() => []);
};

// Legacy `PATCH /emailtemplate/:slug`.
export const updateEmailTemplate = async (
  slug: string,
  data: Partial<EmailTemplate>,
): Promise<void> => {
  if (!isTrpcEnabled('8.1a')) {
    await api.patch(`/emailtemplate/${slug}`, data);
    return;
  }
  await trpc.emailTemplate.update
    .mutate({ idOrSlug: slug, data })
    .catch(throwApiError);
};

// Legacy `POST /emails/render/:slug`; returns the HTML. `sendToMe` also mails it to the caller.
export const renderEmailTemplate = async (
  slug: string,
  templateData: Record<string, unknown>,
  sendToMe: boolean,
): Promise<string> => {
  if (!isTrpcEnabled('8.1a')) {
    const res = await api.post(
      `/emails/render/${slug}`,
      sendToMe ? { templateData, sendToMe: true } : { templateData },
    );
    return res.data?.html ?? '';
  }
  const res = await trpc.emailTemplate.render
    .mutate({ templateId: slug, templateData, sendToMe })
    .catch(throwApiError);
  return res.html;
};
