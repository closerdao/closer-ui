import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { useState } from 'react';

import { Button, Heading, LinkButton } from '../../components/ui';

import { AffiliateConfig, api, useAuth, usePlatform } from 'closer';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../401';
import { loadLocaleData } from '../../utils/locale.helpers';

const AffiliateLandingPage = ({
  affiliateConfig,
}: {
  affiliateConfig: AffiliateConfig;
}) => {
  const t = useTranslations();
  const { user, isLoading } = useAuth();
  const { platform }: any = usePlatform();
  const router = useRouter();

  const [isApiLoading, setIsApiLoading] = useState(false);

  const becomeAffiliate = async () => {
    try {
      setIsApiLoading(true);
      await platform.user.patch(user?._id, {
        affiliate: new Date(),
      });
      router.push('/settings/affiliate');
    } catch (error) {
      console.error('error=', error);
    } finally {
      setIsApiLoading(false);
    }
  };

  if (!user && !isLoading) {
    return <PageNotAllowed />;
  }
  return (
    <>
      <Head>
        <title>Grow with us</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
      </Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        <Image
          src="/images/affiliate-hero.png"
          alt="Grow with us"
          width={896}
          height={400}
        />
        <section className="flex flex-col gap-6">
          <Heading level={1} className="text-2xl font-bold">
            Grow with us
          </Heading>

          <p className="">
            Welcome to the Traditional Dream Factory (TDF) Affiliate Program! We
            are excited to collaborate with partners who are dedicated to
            promoting regenerative living. By joining our program, you can
            nurture and regenerate the earth&apos;s ecosystems while enjoying
            lucrative benefits.
          </p>

          <Heading level={2} className="text-lg font-bold mt-4">
            PROGRAM BENEFITS
          </Heading>

          <ul className="list-disc pl-6 space-y-4">
            <li>
              <span className="font-bold">GENEROUS COMMISSIONS:</span> Earn up
              to {affiliateConfig?.subscriptionCommissionPercent}% commission on
              all digital income generated through your referral links, such as
              memberships & digital products, and{' '}
              {affiliateConfig?.staysCommissionPercent}% on bookings for events
              and stays, and {affiliateConfig?.tokenSaleCommissionPercent}% of
              token sales. Commissions will keep cashing in from purchases made
              by users you referred for 12 months after they sign up!
            </li>
            <li>
              <span className="font-bold">EXCLUSIVE ACCESS:</span> As an
              affiliate, you&apos;ll get exclusive access to our facilities for
              content creation, subject to availability and prior arrangement.
            </li>
            <li>
              <span className="font-bold">PROMOTIONAL SUPPORT:</span> We provide
              you with all necessary promotional materials, including
              high-quality images, logos, and detailed product information,
              ensuring you have everything you need to succeed.
            </li>
            <li>
              <span className="font-bold">EARLY INFORMATION:</span> Get early
              notifications about upcoming events, new projects, and exclusive
              opportunities within TDF, giving you an edge in content creation
              and audience engagement.
            </li>
            <li>
              <span className="font-bold">REGENERATIVE IMPACT:</span> Align with
              a cause that matters. By promoting TDF, you are supporting the
              conservation of land, and transition into regenerative land
              stewardship, promoting biodiversity, restoring water cycles, and
              helping create a regenerative paradigm.
            </li>
          </ul>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <div className="rounded-md shadow-xl p-4 flex flex-col justify-center items-center gap-2 border border-accent">
              <p className="text-3xl font-bold text-pink-500">
                {affiliateConfig?.staysCommissionPercent}%
              </p>
              <p className="text-xl font-semibold text-center">
                Stays & Events
              </p>
            </div>
            <div className="rounded-md shadow-xl p-4 flex flex-col justify-center items-center gap-2 border border-accent">
              <p className="text-3xl font-bold text-pink-500">
                {affiliateConfig?.subscriptionCommissionPercent}%
              </p>
              <p className="text-xl font-semibold text-center">
                Digital Products & Subscriptions
              </p>
            </div>
            <div className="rounded-md shadow-xl p-4 flex flex-col justify-center items-center gap-2 border border-accent">
              <p className="text-3xl font-bold text-pink-500">
                {affiliateConfig?.tokenSaleCommissionPercent}%
              </p>
              <p className="text-xl font-semibold text-center">Token Sales</p>
            </div>
          </div>

          <Heading level={2} className="text-lg font-bold mt-4">
            HOW IT WORKS?
          </Heading>

          <ol className="list-decimal pl-6 space-y-4">
            <li>
              <span className="font-bold">PROMOTE TDF:</span> Share your unique
              link through your digital platforms. Use our promotional materials
              or create your content that resonates with your audience.
            </li>
            <li>
              <span className="font-bold">EARN COMMISSIONS:</span> When someone
              books a stay, an event or subscribes or buy tokens, you&apos;ll
              earn a portion of the revenue generated.
            </li>
            <li>
              <span className="font-bold">RECEIVE PAYMENTS:</span> Commissions
              are paid out monthly, once you reach €100. Payments to be made in
              $TDF, or to a Euro account. You&apos;ll need to provide us with a
              simple invoice.
            </li>
          </ol>

          <Heading level={2} className="text-lg font-bold mt-4">
            WHO IS THIS FOR?
          </Heading>

          <p className="text-lg">
            We are looking for influencers & partners (10k+ followers)
            interested in the regenerative lifestyle, who can drive the right
            kind of audience. It&apos;s not just about selling, it&apos;s about
            bringing the right kind of people. All referrals are based on humans
            you introduce to our ecosystem. TDF has been bootstrapped from the
            ground up with a thriving community of members, and we are now
            aiming to make the project commercially viable while bringing
            together a trusted community of dreamers and shapers who believe we
            can change the way we live. We are especially excited to welcome
            regenerative entrepreneurs who can help us build a thriving economy
            while supporting us to restore ecosystems.
          </p>

          <LinkButton
            target="_blank"
            className="mx-auto mt-6 px-4 bg-white text-accent   w-fit"
            href="https://drive.google.com/drive/folders/11i6UBGqEyC8aw0ufJybnbjueSpE3s8f-"
          >
            {t('dashboard_affiliate_promo_materials')}
          </LinkButton>
          <div className="mt-8 text-center bg-accent-light rounded-md p-4  mx-auto min-w-auto sm:min-w-[400px]">
            <Heading level={2} className="text-lg font-bold mb-4">
              READY TO JOIN?
            </Heading>
            <Button
              onClick={becomeAffiliate}
              variant="primary"
              color="accent"
              className="max-w-xs mx-auto"
              isLoading={isApiLoading}
              isEnabled={!isApiLoading}
            >
              BECOME AN AFFILIATE
            </Button>
          </div>
        </section>
      </div>
    </>
  );
};

AffiliateLandingPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [affiliateConfigRes, messages] = await Promise.all([
      api.get('/config/affiliate').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const affiliateConfig = affiliateConfigRes?.data?.results?.value;

    return {
      affiliateConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      affiliateConfig: null,
      messages: null,
    };
  }
};

export default AffiliateLandingPage;
