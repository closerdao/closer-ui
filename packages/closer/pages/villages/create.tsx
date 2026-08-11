import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import VillageForm from '../../components/VillageForm';
import {
  Eyebrow,
  PageShell,
  btnPrimary,
  btnSecondary,
} from '../../components/VillageUI';

import { useTranslations } from 'next-intl';

import Page401 from '../401';
import { AMBASSADOR_ROLE } from '../../constants/village.constants';
import { useAuth } from '../../contexts/auth';
import { CreateVillageInput } from '../../types/village';
import { createVillage } from '../../utils/village.utils';

const CreateVillagePage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const canCreate =
    isAuthenticated &&
    (Boolean(user?.affiliate) ||
      user?.roles?.includes(AMBASSADOR_ROLE) ||
      user?.roles?.includes('admin'));

  if (!isAuthenticated) {
    return <Page401 />;
  }

  if (!canCreate) {
    return (
      <>
        <Head>
          <title>{t('villages_create_title')}</title>
        </Head>
        <PageShell width="narrow">
          <div className="rounded-[22px] border border-[#C2F0DA] bg-white p-8 md:p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-[#E2FAEE] text-[#0FA968] text-2xl flex items-center justify-center mx-auto">
              ✦
            </div>
            <h1 className="font-serif text-3xl md:text-4xl mt-6">
              {t('villages_gate_title')}
            </h1>
            <p className="text-[15px] text-[#5C6E64] mt-4 max-w-md mx-auto leading-relaxed">
              {t('villages_create_ambassador_required')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Link href="/ambassadors" className={btnPrimary}>
                {t('ambassadors_cta_join')}
              </Link>
              <Link href="/map" className={btnSecondary}>
                {t('ambassadors_cta_map')}
              </Link>
            </div>
          </div>
        </PageShell>
      </>
    );
  }

  const handleSubmit = async (payload: CreateVillageInput) => {
    const created = await createVillage({
      ...payload,
      referredBy: user?._id,
      ambassadorId: user?._id,
      managedBy: user?._id ? [user._id] : [],
    });
    const path = created.slug || created._id;
    router.push(`/villages/${path}?created=1`);
  };

  return (
    <>
      <Head>
        <title>{t('villages_create_title')}</title>
      </Head>
      <PageShell>
        <header className="max-w-2xl mb-10">
          <Eyebrow>{t('villages_create_eyebrow')}</Eyebrow>
          <h1 className="font-serif text-4xl md:text-5xl leading-[1.08] mt-3">
            {t('villages_create_title')}
          </h1>
          <p className="text-[17px] text-[#5C6E64] mt-4 leading-relaxed">
            {t('villages_create_intro')}
          </p>
        </header>
        <VillageForm
          submitLabel={t('villages_create_submit')}
          onSubmit={handleSubmit}
        />
      </PageShell>
    </>
  );
};

export default CreateVillagePage;
