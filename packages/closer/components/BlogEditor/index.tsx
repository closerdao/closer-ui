import React, { FC, useCallback, useState } from 'react';

import { FaChevronDown } from '@react-icons/all-files/fa/FaChevronDown';
import { FaChevronUp } from '@react-icons/all-files/fa/FaChevronUp';
import { FaImage } from '@react-icons/all-files/fa/FaImage';
import { FaTimes } from '@react-icons/all-files/fa/FaTimes';
import { useDropzone } from 'react-dropzone';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import api, { cdn } from '../../utils/api';
import { parseMessageFromError, slugify } from '../../utils/common';
import RichTextEditor from '../RichTextEditor';
import { Spinner } from '../ui';

interface ArticleData {
  _id?: string;
  title: string;
  slug: string;
  summary: string;
  html: string;
  photo: string | null;
  category: string;
  tags: string[];
  createdBy?: string;
}

interface Props {
  initialData?: Partial<ArticleData>;
  onSave?: (article: ArticleData) => void;
}

const BlogEditor: FC<Props> = ({
  initialData,
  onSave,
}) => {
  const t = useTranslations();
  const { isAuthenticated, user } = useAuth();

  const [data, setData] = useState<ArticleData>({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    summary: initialData?.summary || '',
    html: initialData?.html || '',
    photo: initialData?.photo || null,
    category: initialData?.category || '',
    tags: initialData?.tags || [],
    _id: initialData?._id,
    createdBy: initialData?.createdBy,
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newTag, setNewTag] = useState('');

  const isEditMode = !!initialData?._id;

  const updateField = <K extends keyof ArticleData>(
    field: K,
    value: ArticleData[K],
  ) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTitleChange = (title: string) => {
    updateField('title', title);
    if (!isEditMode || !data.slug) {
      updateField('slug', slugify(title));
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploadingPhoto(true);
    setError(null);

    try {
      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.append('file', file);

      const { data: response } = await api.post('/upload/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      updateField('photo', response.results._id);
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setIsUploadingPhoto(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: 'image/*',
    multiple: false,
  });

  const removePhoto = () => {
    updateField('photo', null);
  };

  const addTag = () => {
    if (newTag.trim() && !data.tags.includes(newTag.trim())) {
      updateField('tags', [...data.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateField(
      'tags',
      data.tags.filter((tag) => tag !== tagToRemove),
    );
  };

  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const validate = () => {
    if (!data.title.trim()) {
      throw new Error(t('blog_editor_error_title_required'));
    }
    if (!data.category.trim()) {
      throw new Error(t('blog_editor_error_category_required'));
    }
  };

  const save = async () => {
    setIsLoading(true);
    setError(null);

    try {
      validate();

      const method = isEditMode ? 'patch' : 'post';
      const route = isEditMode ? `/article/${data._id}` : '/article';

      const {
        data: { results: savedData },
      } = await api[method](route, data);

      if (onSave) {
        onSave(savedData);
      }
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12 text-gray-500">
        {t('edit_model_auth_required')}
      </div>
    );
  }

  if (
    data.createdBy &&
    user &&
    data.createdBy !== user._id &&
    !user.roles.includes('admin')
  ) {
    return (
      <div className="text-center py-12 text-gray-500">
        {t('edit_model_permission_denied')}
      </div>
    );
  }

  return (
    <div className="blog-editor min-h-[80vh] flex flex-col">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div
        {...getRootProps()}
        className={`relative mb-8 rounded-xl overflow-hidden transition-all duration-200 ${
          data.photo
            ? 'aspect-[21/9] bg-gray-100'
            : 'aspect-[21/9] border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        } ${isDragActive ? 'border-accent ring-2 ring-accent/20' : ''}`}
      >
        <input {...getInputProps()} />

        {data.photo ? (
          <>
            <img
              src={`${cdn}${data.photo}-max-lg.jpg`}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removePhoto();
              }}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-4 text-white/80 text-sm">
              {t('blog_editor_click_to_change_cover')}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 cursor-pointer">
            {isUploadingPhoto ? (
              <Spinner />
            ) : (
              <>
                <FaImage className="w-12 h-12 mb-3" />
                <p className="text-lg font-medium">
                  {t('blog_editor_add_cover_image')}
                </p>
                <p className="text-sm mt-1">{t('blog_editor_drag_or_click')}</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full">
        <input
          type="text"
          value={data.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder={t('blog_editor_title_placeholder')}
          className="w-full text-4xl md:text-5xl font-bold border-0 bg-transparent focus:outline-none focus:ring-0 placeholder-gray-300 mb-2"
        />

        <input
          type="text"
          value={data.summary}
          onChange={(e) => updateField('summary', e.target.value)}
          placeholder={t('blog_editor_summary_placeholder')}
          className="w-full text-xl text-gray-500 border-0 bg-transparent focus:outline-none focus:ring-0 placeholder-gray-300 mb-4"
        />

        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
          <label className="text-sm font-medium text-gray-500 whitespace-nowrap">
            {t('blog_editor_category')}
          </label>
          <input
            type="text"
            value={data.category}
            onChange={(e) => updateField('category', e.target.value)}
            placeholder={t('blog_editor_category_placeholder')}
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors bg-gray-50"
          />
        </div>

        <div className="prose prose-lg max-w-none blog-editor-content">
          <RichTextEditor
            value={data.html}
            onChange={(value) => updateField('html', value)}
          />
        </div>
      </div>

      <div className="mt-12 border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          {showSettings ? (
            <FaChevronUp className="w-4 h-4" />
          ) : (
            <FaChevronDown className="w-4 h-4" />
          )}
          <span className="font-medium">{t('blog_editor_settings')}</span>
        </button>

        {showSettings && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 rounded-xl p-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('blog_editor_slug')}
              </label>
              <input
                type="text"
                value={data.slug}
                onChange={(e) => updateField('slug', e.target.value)}
                placeholder={t('blog_editor_slug_placeholder')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('blog_editor_slug_help')}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('blog_editor_tags')}
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {data.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent-dark rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  placeholder={t('blog_editor_add_tag')}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  {t('blog_editor_add')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={save}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isLoading && <Spinner />}
          {isEditMode ? t('blog_editor_update') : t('blog_editor_publish')}
        </button>
      </div>

      <style jsx global>{`
        .blog-editor-content .ql-container {
          font-size: 18px;
          border: none !important;
          min-height: 400px;
        }

        .blog-editor-content .ql-editor {
          padding: 0;
          min-height: 400px;
        }

        .blog-editor-content .ql-editor.ql-blank::before {
          font-style: normal;
          color: #d1d5db;
          left: 0;
        }

        .blog-editor-content .ql-toolbar {
          border: none !important;
          border-bottom: 1px solid #e5e7eb !important;
          padding: 12px 0 !important;
          margin-bottom: 24px;
        }

        .blog-editor-content .ql-toolbar .ql-formats {
          margin-right: 16px;
        }

        .blog-editor-content .ql-editor h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }

        .blog-editor-content .ql-editor p {
          margin-bottom: 1rem;
          line-height: 1.75;
        }

        .blog-editor-content .ql-editor img {
          max-width: 100%;
          border-radius: 8px;
          margin: 1.5rem 0;
        }

        .blog-editor-content .ql-editor a {
          color: #42cc93;
          text-decoration: underline;
        }

        .blog-editor-content .ql-editor ul,
        .blog-editor-content .ql-editor ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }

        .blog-editor-content .ql-editor li {
          margin-bottom: 0.5rem;
        }

        .blog-editor-content .ql-editor blockquote {
          border-left: 4px solid #42cc93;
          padding-left: 1rem;
          font-style: italic;
          color: #6b7280;
          margin: 1.5rem 0;
        }
      `}</style>
    </div>
  );
};

export default BlogEditor;
