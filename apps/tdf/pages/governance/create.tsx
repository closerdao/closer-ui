import React, { useState, useEffect } from 'react';
import { NextPage, NextPageContext } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { useAuth } from 'closer/contexts/auth';
import { usePlatform } from 'closer/contexts/platform';
import { proposalTemplates, getTemplateFields } from 'closer/constants/proposalTemplates';
import { slugify } from 'closer/utils/common';
import { api } from 'closer';

const CreateProposalPage: NextPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { platform } = usePlatform() as any;
  
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
          templateFields.executionPlan
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
      setError('Only Citizens can create proposals');
      return;
    }
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!description.trim()) {
      setError('Description is required');
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
      try {
        const result = await platform.proposal.post(proposalData);
        console.log('Proposal creation result:', result);
        router.push('/governance');
      } catch (platformError) {
        console.warn('Platform context failed, trying direct API call:', platformError);
        const result = await api.post('/proposal', proposalData);
        console.log('Direct API call result:', result);
        router.push('/governance');
      }
    } catch (err) {
      console.error('Proposal creation error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCitizen()) {
    return (
      <Layout>
        <Head>
          <title>Create Proposal - TDF Governance</title>
        </Head>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">Access Restricted</h2>
              <p className="text-yellow-700">
                Only Citizens can create proposals. Please contact the DAO administrators for more information.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Create Proposal - TDF Governance</title>
      </Head>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Proposal</h1>
            <p className="text-gray-600">
              Create a new governance proposal. You can save as draft or submit for review.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Template Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Choose Template</h2>
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
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                ))}
              </div>
            </div>


            {/* Proposal Fields */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Proposal Details</h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Enter proposal title"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                    Slug (optional)
                  </label>
                  <input
                    type="text"
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Auto-generated from title"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Leave empty to use auto-generated slug from title
                  </p>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Proposal Content *
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                    rows={20}
                    placeholder="Enter your proposal content using markdown formatting..."
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Use markdown formatting to structure your proposal. The template above provides a good starting structure.
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
                Cancel
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
                {isSubmitting ? 'Creating...' : 'Create Draft Proposal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateProposalPage;

CreateProposalPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME);
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
