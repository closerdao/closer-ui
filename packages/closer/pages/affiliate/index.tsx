import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { Button, Heading, LinkButton } from '../../components/ui';
import ErrorMessage from '../../components/ui/ErrorMessage';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/shadcn-card';

import { PageNotFound, api, useAuth, usePlatform } from 'closer';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import { reportIssue } from '../../utils/reporting.utils';

const AffiliateLandingPage = () => {
  const t = useTranslations();
  const { user, isLoading, refetchUser } = useAuth();
  const { platform } = usePlatform() as { platform: any };
  const router = useRouter();

  const [isApiLoading, setIsApiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Track affiliate page view
  useEffect(() => {
    const trackAffiliatePageView = async () => {
      try {
        await api.post('/metric', {
          event: 'affiliate-page-view',
          value: user?._id || 'anonymous',
          number: 1,
          point: 1,
          category: 'engagement',
        });
      } catch (error) {
        console.error('Error tracking affiliate page view:', error);
      }
    };

    trackAffiliatePageView();
  }, [user?._id]);

  const faqs = [
    {
      q: 'How do I create a tracking link?',
      a: 'Use the link builder in your Affiliate Dashboard, or contact us if you need help.',
    },
    {
      q: 'How long do I earn commission after someone signs up?',
      a: '12 months after their first click on your affiliate link.',
    },
    {
      q: 'When do I get paid?',
      a: 'On the 15th of each month, once you reach €100 in commissions.',
    },
    {
      q: 'Can I offer my audience a discount code?',
      a: 'Yes, affiliates can request personalized coupon codes.',
    },
    {
      q: 'Who do I contact with questions?',
      a: 'Email affiliate@traditionaldreamfactory.com',
    },
  ];

  const becomeAffiliate = async () => {
    if (user?.affiliate) {
      router.push('/settings/affiliate');
      return;
    }

    if (!user?._id) {
      setError('User not found. Please try logging in again.');
      return;
    }

    if (!platform?.user?.patch) {
      setError('System not ready. Please refresh the page and try again.');
      return;
    }

    try {
      setIsApiLoading(true);
      setError(null);
      setSuccess(false);

      await platform.user.patch(user._id, {
        affiliate: new Date(),
      });

      await refetchUser();

      // Track affiliate signup
      try {
        await api.post('/metric', {
          event: 'affiliate-signup',
          value: user?._id,
          number: 1,
          point: 1,
          category: 'engagement',
        });
      } catch (error) {
        console.error('Error tracking affiliate signup:', error);
        reportIssue(
          `Error tracking affiliate signup: ${user?._id}`,
          user?.email,
        );
      }

      setSuccess(true);

      setTimeout(() => {
        router.push('/settings/affiliate');
      }, 2000);
    } catch (error) {
      const errorMessage = parseMessageFromError(error);
      setError(errorMessage);
      console.error('Error adding affiliate to user:', error);
      reportIssue(`Error adding affiliate to user: ${user?._id}`, user?.email);
    } finally {
      setIsApiLoading(false);
    }
  };

  if (process.env.NEXT_PUBLIC_FEATURE_AFFILIATE !== 'true') {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>Join the Traditional Dream Factory Affiliate Program</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
      </Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        <Image
          src="/images/affiliate-hero.png"
          alt="Join the Traditional Dream Factory Affiliate Program"
          width={896}
          height={400}
        />
        <section className="flex flex-col gap-6">
          <Heading level={1} className="text-2xl font-bold">
            Join the Traditional Dream Factory Affiliate Program
          </Heading>

          <p className="">
            Welcome to the Traditional Dream Factory (TDF) Affiliate Program! We
            are excited to collaborate with partners who are dedicated to
            promoting regenerative living. By joining our program, you can
            nurture and regenerate the earth&apos;s ecosystems while enjoying
            lucrative benefits. As an affiliate, you&apos;ll earn commissions
            when people book events, stays, or buy digital products and tokens
            through your referral links.
          </p>

          <Heading level={2} className="text-lg font-bold mt-4">
            Why you should join
          </Heading>

          <ul className="list-disc pl-6 space-y-4">
            <li>
              <span className="font-bold">GENEROUS COMMISSIONS:</span> Earn up
              to 30% commission on all digital income generated through your
              referral links, such as memberships & digital products, and 10% on
              bookings for events and stays, and 3% of token sales. Commissions
              will keep cashing in from purchases made by users you referred for
              12 months after they sign up!
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

          <Heading level={2} className="text-lg font-bold mt-4">
            What You Can Earn Commission On:
          </Heading>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <div className="rounded-md shadow-xl p-4 flex flex-col justify-center items-center gap-2 border border-accent">
              <p className="text-3xl font-bold text-pink-500">10%</p>
              <p className="text-xl font-semibold text-center">
                Stays & Events
              </p>
            </div>
            <div className="rounded-md shadow-xl p-4 flex flex-col justify-center items-center gap-2 border border-accent">
              <p className="text-3xl font-bold text-pink-500">30%</p>
              <p className="text-xl font-semibold text-center">
                Digital Products & Subscriptions
              </p>
            </div>
            <div className="rounded-md shadow-xl p-4 flex flex-col justify-center items-center gap-2 border border-accent">
              <p className="text-3xl font-bold text-pink-500">3%</p>
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

          <Heading level={2} className="text-lg font-bold mt-4">
            What are our Affiliate Program Rules that you agree to by joining:
          </Heading>

          <ul className="list-disc pl-6 space-y-4">
            <li>
              If you forgot to use your tracking code, we cannot pay commissions
              on any referrals
            </li>
            <li>No spamming, cookie stuffing, or misleading promotions.</li>
            <li>
              Be transparent – disclose your affiliate relationship when
              required.
            </li>
            <li>
              Respect TDF&apos;s brand and values in your promotions. You can
              find logos and copy swipes in your affiliate resources
            </li>
            <li>
              You&apos;re not allowed to represent our brand wrongfully or give
              wrong information about our product, service or prices.
            </li>
            <li>
              You&apos;re not allowed to bid on our Brand or audience, TDF or
              Traditional Dream Factory, in any paid campaigns via Google Ads,
              Bing Ads or similar, as well as on Social Media channels, unless
              you have been given explicit authorisation by the Affiliate
              Manager of TDF. This rule includes close variations or
              misspellings.
            </li>
            <li>
              You are not allowed to &quot;Resell&quot; our product. Orders or
              bookings of your audience have to be made by themselves on our own
              website
            </li>
            <li>
              You are not allowed to willfully promote non-existent or expired
              Discounts or Coupon codes.
            </li>
            <li>
              If we encounter any of the above, we reserve the right to
              deactivate your Affiliate account at any time, without prior
              warning and you will not receive any commission payouts of pending
              commissions.
            </li>
          </ul>

          <Heading level={2} className="text-lg font-bold mt-4">
            Affiliate Resources:
          </Heading>

          <ul className="list-disc pl-6 space-y-2">
            <li>
              Copy Swipes (emails, social media posts, descriptions you can use)
            </li>
            <li>Affiliate Dashboard (track clicks, sales, and commissions)</li>
            <li>Brand Assets (logos, images)</li>
            <li>
              Dedicated Affiliate Manager (email:
              affiliate@traditionaldreamfactory.com)
            </li>
          </ul>

          <Heading level={2} className="text-lg font-bold mt-4">
            FAQs:
          </Heading>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {faqs.map((f) => (
              <Card key={f.q} className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{f.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{f.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <LinkButton
            target="_blank"
            className="mx-auto mt-6 px-4 bg-white text-accent   w-fit"
            href="https://drive.google.com/drive/folders/11i6UBGqEyC8aw0ufJybnbjueSpE3s8f-"
            onClick={async () => {
              try {
                await api.post('/metric', {
                  event: 'affiliate-promo-materials-click',
                  value: user?._id || 'anonymous',
                  number: 1,
                  point: 1,
                  category: 'engagement',
                });
              } catch (error) {
                console.error('Error tracking promo materials click:', error);
              }
            }}
          >
            {t('dashboard_affiliate_promo_materials')}
          </LinkButton>
          <div className="mt-8 text-center bg-accent-light rounded-md p-8 w-full">
            <Heading level={2} className="text-2xl font-bold mb-6">
              READY TO JOIN?
            </Heading>

            {error && (
              <div className="mb-4">
                <ErrorMessage error={error} />
                <div className="text-center mt-2">
                  <Button
                    onClick={becomeAffiliate}
                    variant="secondary"
                    color="accent"
                    className="max-w-xs mx-auto"
                    isLoading={isApiLoading}
                    isEnabled={!isApiLoading}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {success && (
              <div className="text-center py-4 mb-4">
                <div className="text-green-600 text-4xl mb-2">✓</div>
                <p className="text-green-600 font-semibold mb-2">
                  Welcome to the TDF Affiliate Program!
                </p>
                <p className="text-gray-600 text-sm">
                  Redirecting you to your affiliate dashboard...
                </p>
              </div>
            )}

            {!error && !success && (
              <Button
                onClick={becomeAffiliate}
                variant="primary"
                color="accent"
                className="max-w-xs mx-auto"
                isLoading={isApiLoading}
                isEnabled={!isApiLoading}
              >
                {user?.affiliate
                  ? 'Go to Affiliate dashboard'
                  : '👉 Join the TDF Affiliate Program Today'}
              </Button>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

AffiliateLandingPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );

    return {
      messages,
    };
  } catch (err: unknown) {
    return {
      messages: null,
    };
  }
};

export default AffiliateLandingPage;
