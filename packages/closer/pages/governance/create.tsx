import Head from 'next/head';
import { useRouter } from 'next/router';

import React, { useEffect, useState } from 'react';

import {
  getTemplateFields,
  proposalTemplates,
} from 'closer/constants/proposalTemplates';
import { useAuth } from 'closer/contexts/auth';
import { usePlatform } from 'closer/contexts/platform';
import { slugify } from 'closer/utils/common';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPage, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

const CreateProposalPage: NextPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { platform } = usePlatform() as any;
  const t = useTranslations();

  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCitizen = (): boolean => {
    return user?.roles?.includes('member') || false;
  };

  // Load template when selected
  useEffect(() => {
    if (selectedTemplate) {
      const templateFields = getTemplateFields(selectedTemplate);
      if (templateFields) {
        // Combine all template fields into a single description
        const combinedDescription = [
          templateFields.description,
          templateFields.rationale,
          templateFields.impact,
          templateFields.requestedResources,
          templateFields.executionPlan,
        ].join('\n\n');
        setDescription(combinedDescription);
      }
    }
  }, [selectedTemplate]);

  // Generate slug from title (same logic as EditModel)
  useEffect(() => {
    if (title && title.trim().length > 0) {
      const generatedSlug = slugify(title.trim());
      if (generatedSlug && generatedSlug !== slug) {
        setSlug(generatedSlug);
      }
    }
  }, [title, slug]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isCitizen()) {
      setError(t('governance_only_citizens_can_create'));
      return;
    }

    if (!title.trim()) {
      setError(t('governance_title_required'));
      return;
    }

    if (!description.trim()) {
      setError(t('governance_description_required'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create proposal data (always as draft)
      const proposalData = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim(),
        status: 'draft',
        visibleBy: [],
        createdBy: user?._id || '',
        updated: new Date().toISOString(),
        created: new Date().toISOString(),
        attributes: [],
        managedBy: [],
        template: selectedTemplate,
      };

      // Submit proposal
      await platform.proposal.post(proposalData);
      console.log(
        'CreateProposal: Redirecting to governance with refetch=true',
      );
      router.push('/governance?refetch=true');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('governance_unknown_error'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCitizen()) {
    return (
      <>
        <Head>
          <title>{t('governance_create_proposal')} - TDF Governance</title>
        </Head>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                {t('governance_access_restricted')}
              </h2>
              <p className="text-yellow-700">
                {t('governance_contact_dao_administrators')}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{t('governance_create_proposal')} - TDF Governance</title>
      </Head>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {t('governance_create_proposal')}
            </h1>
            <p className="text-gray-600">
              {t('governance_create_new_proposal')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Template Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">
                {t('governance_choose_template')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {proposalTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate === template.id
                        ? 'border-accent bg-accent-light'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTemplateChange(template.id)}
                  >
                    <h3 className="font-medium mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600">
                      {template.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Proposal Fields */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">
                {t('governance_proposal_details')}
              </h2>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t('governance_title_label')} *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder={t('governance_title_placeholder')}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="slug"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t('governance_slug_label')} ({t('governance_optional')})
                  </label>
                  <input
                    type="text"
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder={t('governance_slug_placeholder')}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {t('governance_slug_description')}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t('governance_proposal_content')} *
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                    rows={20}
                    placeholder={t('governance_proposal_content_placeholder')}
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {t('governance_proposal_content_description')}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                {t('governance_cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-md font-medium ${
                  isSubmitting
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-accent hover:bg-accent-dark text-white'
                }`}
              >
                {isSubmitting
                  ? t('governance_creating')
                  : t('governance_create_draft_proposal')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateProposalPage;

CreateProposalPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return {
      messages,
    };
  } catch (err) {
    return {
      error: err,
      messages: null,
    };
  }
};
