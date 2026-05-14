import Link from 'next/link';

import { FileText, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Heading } from '../ui';

import I18nHoverAction from './I18nHoverAction';
import { resolveBlockText } from '../../utils/blockI18n';

export interface PageListItem {
  _id: string;
  title?: string;
  slug?: string;
}

interface Props {
  pages: PageListItem[];
  activeId: string;
  onNewPage: () => void;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  isOpen: boolean;
  onClose: () => void;
}

const PagesSidebar = ({
  pages,
  activeId,
  onNewPage,
  saveStatus,
  isOpen,
  onClose,
}: Props) => {
  const t = useTranslations();

  const statusLabel =
    saveStatus === 'saving'
      ? t('pages_editor_saving')
      : saveStatus === 'unsaved'
        ? t('pages_editor_unsaved')
        : saveStatus === 'error'
          ? t('pages_editor_save_error')
          : t('pages_editor_saved');

  return (
    <aside
      className={`flex flex-col border-r border-gray-200 bg-white min-h-0 w-[280px] max-w-[86vw] shrink-0 fixed lg:relative inset-y-0 left-0 z-40 lg:z-0 transform transition-transform lg:transform-none pt-12 xl:pt-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="p-4 border-b border-gray-100 flex items-start justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 bg-accent/10 rounded-lg shrink-0">
            <FileText className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <Heading level={4} className="text-sm sm:text-base truncate">
              {t('pages_editor_title')}
            </Heading>
            <p className="text-xs text-gray-500 mt-0.5">
              {(pages ?? []).length} {t('pages_editor_pages_count')}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 shrink-0"
          aria-label={t('pages_editor_new')}
          onClick={onNewPage}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 min-h-0">
        {(pages ?? []).map((p) => {
          const isActive = p._id === activeId;
          return (
            <Link
              key={p._id}
              href={`/dashboard/pages/${p._id}`}
              onClick={() => onClose()}
              className={`block rounded-lg px-3 py-2.5 text-sm transition-colors mb-1 ${
                isActive
                  ? 'bg-accent-light text-accent-dark font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="block min-w-0 w-full font-medium">
                <I18nHoverAction
                  raw={p.title?.trim() || null}
                  display={
                    (p.title?.trim() && resolveBlockText(p.title, t)) ||
                    t('pages_editor_untitled')
                  }
                  className="w-full font-medium"
                  textClassName="truncate font-medium"
                  stopLinkNavigation
                />
              </span>
              <span className="block text-xs text-gray-500 font-mono truncate">
                {p.slug || '/'}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500 shrink-0">
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            saveStatus === 'saving'
              ? 'bg-amber-400'
              : saveStatus === 'error'
                ? 'bg-red-500'
                : 'bg-green-500'
          }`}
          aria-hidden
        />
        <span>{statusLabel}</span>
      </div>
    </aside>
  );
};

export default PagesSidebar;
