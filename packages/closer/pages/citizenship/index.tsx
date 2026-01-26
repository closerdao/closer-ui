import Link from 'next/link';

import { useEffect, useState } from 'react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/shadcn-button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/shadcn-card';

import {
  ArrowRight,
  Calendar,
  Check,
  ChevronRight,
  CreditCard,
  Hammer,
  Handshake,
  HeartHandshake,
  ShieldCheck,
  Sprout,
  Star,
  Trees,
  Users,
  Wallet,
} from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useBuyTokens } from '../../hooks/useBuyTokens';
import { CitizenshipConfig } from '../../types/api';
import api from '../../utils/api';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

const CITIZEN_TARGET = 300;

interface CitizenshipPageProps {
  appName?: string;
  customConfig?: {
    citizenTarget?: number;
    apiEndpoint?: string;
  };
  citizenshipConfig?: CitizenshipConfig;
}

const citizenFilter = {
  roles: {
    $in: ['member', 'citizen'],
  },
};

const CitizenshipPage = ({
  appName = 'Traditional Dream Factory',
  citizenshipConfig = {} as CitizenshipConfig,
  customConfig = {} as { citizenTarget?: number; apiEndpoint?: string },
}: CitizenshipPageProps) => {
  const t = useTranslations();

  const { user } = useAuth();
  const [citizenCurrent, setCitizenCurrent] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenPrice, setTokenPrice] = useState(0);
  const [isTokenPriceLoading, setIsTokenPriceLoading] = useState(false);
  const [tokenPlans, setTokenPlans] = useState([
    { tokens: 30, monthlyPayment: 0 },
    { tokens: 60, monthlyPayment: 0 },
    { tokens: 90, monthlyPayment: 0 },
    { tokens: 120, monthlyPayment: 0 },
  ]);
  const { getTotalCostWithoutWallet, isConfigReady } = useBuyTokens();

  // Track citizenship page view
  useEffect(() => {
    (async () => {
      try {
        await api.post('/metric', {
          event: 'page-view',
          value: 'citizenship',
          point: 0,
          category: 'engagement',
        });
      } catch (error) {
        console.error('Error tracking citizenship page view:', error);
      }
    })();
  }, []);
  const { platform }: any = usePlatform();

  const citizenTarget = customConfig?.citizenTarget || CITIZEN_TARGET;

  const fetchMemberCount = async () => {
    console.log('fetchMemberCount');
    setIsLoading(true);
    try {
      const response = await platform.user.getCount({ where: citizenFilter });
      const memberCount = response?.results || 0;
      setCitizenCurrent(memberCount);
    } catch (error) {
      console.error('Failed to fetch member count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberCount();
  }, [platform, citizenFilter]);

  useEffect(() => {
    const fetchTokenPrice = async () => {
      if (!isConfigReady) return;

      try {
        setIsTokenPriceLoading(true);
        // Calculate price for 1 token to get the base price
        const basePrice = await getTotalCostWithoutWallet('1');
        setTokenPrice(basePrice);
      } catch (error) {
        console.error('Failed to fetch token price:', error);
      } finally {
        setIsTokenPriceLoading(false);
      }
    };

    if (!tokenPrice) {
      fetchTokenPrice();
    }
  }, [isConfigReady]);

  useEffect(() => {
    const calculateTokenPlans = async () => {
      if (!isConfigReady || !citizenshipConfig) return;

      try {
        setIsTokenPriceLoading(true);
        const plans = await Promise.all([
          calculateFinancedPrice(30),
          calculateFinancedPrice(60),
          calculateFinancedPrice(90),
          calculateFinancedPrice(120),
        ]);

        setTokenPlans([
          { tokens: 30, monthlyPayment: plans[0] },
          { tokens: 60, monthlyPayment: plans[1] },
          { tokens: 90, monthlyPayment: plans[2] },
          { tokens: 120, monthlyPayment: plans[3] },
        ]);
      } catch (error) {
        console.error('Failed to calculate token plans:', error);
      } finally {
        setIsTokenPriceLoading(false);
      }
    };

    calculateTokenPlans();
  }, [isConfigReady, citizenshipConfig?.tokenPriceModifierPercent]);

  const progress = Math.min(
    100,
    Math.round((citizenCurrent / citizenTarget) * 100),
  );

  // Calculate financed token prices
  const calculateFinancedPrice = async (tokens: number) => {
    console.log('=== citizenshipConfig ===', citizenshipConfig);
    if (!isConfigReady) return 0;
    try {
      const totalCost = await getTotalCostWithoutWallet(tokens.toString());
      const priceModifier = citizenshipConfig?.tokenPriceModifierPercent || 0;
      const totalToPayInFiat = Number(
        (totalCost * (1 + priceModifier / 100)).toFixed(2),
      );
      const downPayment = Number((totalToPayInFiat * 0.1).toFixed(2));
      const monthlyPayment = Number(
        ((totalToPayInFiat - downPayment) / 36).toFixed(2),
      );

      console.log(`Citizenship calculation for ${tokens} tokens:`, {
        totalCost,
        priceModifier,
        priceModifierPercent: citizenshipConfig?.tokenPriceModifierPercent,
        totalToPayInFiat,
        downPayment,
        monthlyPayment,
        citizenshipConfig: citizenshipConfig,
      });

      return monthlyPayment;
    } catch (error) {
      console.error('Failed to calculate financed price:', error);
      return 0;
    }
  };

  const benefits = [
    {
      icon: ShieldCheck,
      title: t('citizenship_benefits_belonging_title'),
      desc: t('citizenship_benefits_belonging_desc'),
    },
    {
      icon: Users,
      title: t('citizenship_benefits_governance_title'),
      desc: t('citizenship_benefits_governance_desc'),
    },
    {
      icon: Calendar,
      title: t('citizenship_benefits_booking_title'),
      desc: t('citizenship_benefits_booking_desc'),
    },
    {
      icon: Star,
      title: t('citizenship_benefits_priority_title'),
      desc: t('citizenship_benefits_priority_desc'),
    },
    {
      icon: CreditCard,
      title: t('citizenship_benefits_financial_title'),
      desc: t('citizenship_benefits_financial_desc'),
    },
    {
      icon: Hammer,
      title: t('citizenship_benefits_impact_title'),
      desc: t('citizenship_benefits_impact_desc'),
    },
  ];

  const pathway = [
    {
      title: t('citizenship_pathway_onboarding_title'),
      desc: t('citizenship_pathway_onboarding_desc'),
      icon: Sprout,
    },
    {
      title: t('citizenship_pathway_presence_title'),
      desc: t('citizenship_pathway_presence_desc'),
      icon: Trees,
    },
    {
      title: t('citizenship_pathway_tokens_title'),
      desc: t('citizenship_pathway_tokens_desc'),
      icon: Wallet,
    },
    {
      title: t('citizenship_pathway_vouching_title'),
      desc: t('citizenship_pathway_vouching_desc'),
      icon: HeartHandshake,
    },
    {
      title: t('citizenship_pathway_agreement_title'),
      desc: t('citizenship_pathway_agreement_desc'),
      icon: Handshake,
    },
  ];

  const faqs = [
    {
      q: t('citizenship_faq_tokens_needed_q'),
      a: t('citizenship_faq_tokens_needed_a'),
    },
    {
      q: t('citizenship_faq_portugal_q'),
      a: t('citizenship_faq_portugal_a'),
    },
    {
      q: t('citizenship_faq_land_stewardship_q'),
      a: t('citizenship_faq_land_stewardship_a'),
    },
    {
      q: t('citizenship_faq_resell_q'),
      a: t('citizenship_faq_resell_a'),
    },
    {
      q: t('citizenship_faq_responsibilities_q'),
      a: t('citizenship_faq_responsibilities_a'),
    },
  ];

  if (process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP !== 'true') {
    return <PageNotFound error="" />;
  }

  return (
    <div className="min-h-screen bg-neutral-light text-foreground">
      {/* Hero */}

      <section className="relative isolate overflow-hidden">
        {user?.roles?.includes('member') && (
          <div className="mt-4 mx-auto max-w-6xl bg-green-50 border border-green-200 rounded-md p-4 mb-4">
            <p className="font-bold text-green-700 mb-2">
              {t('subscriptions_citizen_already_member_title')}
            </p>
            <p>{t('subscriptions_citizen_already_member_description')}</p>
          </div>
        )}

        <div className="mx-auto max-w-6xl px-6 pt-4 pb-10">
          <Badge className="mb-4 bg-accent-light text-accent hover:bg-accent-light">
            {t('citizenship_founding_cohort_badge')}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
            {t('citizenship_hero_title')}{' '}
            <span className="text-accent">{appName}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-foreground">
            {t('citizenship_hero_subtitle')}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {!user?.roles?.includes('member') && (
              <Button asChild size="lg" className="rounded-2xl px-6">
                <Link
                  href="/subscriptions/citizen/why"
                  onClick={() => {
                    api.post('/metric', {
                      event: 'become-citizen-button-click',
                      value: 'citizenship',
                      point: 0,
                      category: 'engagement',
                    });
                  }}
                >
                  {t('citizenship_become_citizen_button')}{' '}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}

            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-2xl px-6"
            >
              <Link href="/token">{t('citizenship_learn_tdf_button')}</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="rounded-2xl px-6"
            >
              <a
                href="https://traditionaldreamfactory.gitbook.io/game-guide/02_roles-and-stakeholders/citizenship"
                target="_blank"
                rel="noreferrer"
              >
                {t('citizenship_read_game_guide_button')}
              </a>
            </Button>
          </div>

          {/* Progress */}
          <div className="mt-10 max-w-xl">
            <div className="flex items-center justify-between text-sm text-foreground">
              <span>{t('citizenship_citizens_joined')}</span>
              <span>
                {isLoading ? '...' : citizenCurrent} / {citizenTarget}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral">
              <div
                className="h-full bg-accent transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* What we've built */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Sprout className="h-6 w-6" />
                {t('citizenship_whats_here_today_title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-foreground">
              <p className="flex items-start gap-2">
                <Check className="mt-1 h-5 w-5 text-accent" />
                {t('citizenship_whats_here_today_1')}
              </p>
              <p className="flex items-start gap-2">
                <Check className="mt-1 h-5 w-5 text-accent" />
                {t('citizenship_whats_here_today_2')}
              </p>
              <p className="flex items-start gap-2">
                <Check className="mt-1 h-5 w-5 text-accent" />
                {t('citizenship_whats_here_today_3')}
              </p>
              <p className="flex items-start gap-2">
                <Check className="mt-1 h-5 w-5 text-accent" />
                {t('citizenship_whats_here_today_4')}
              </p>
              <p className="flex items-start gap-2">
                <Check className="mt-1 h-5 w-5 text-accent" />
                {t('citizenship_whats_here_today_5')}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Hammer className="h-6 w-6" />
                {t('citizenship_roadmap_title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-foreground">
              <p className="flex items-start gap-2">
                <ChevronRight className="mt-1 h-5 w-5 text-accent" />
                {t('citizenship_roadmap_1')}
              </p>
              <p className="flex items-start gap-2">
                <ChevronRight className="mt-1 h-5 w-5 text-accent" />
                {t('citizenship_roadmap_2')}
              </p>
              <p className="flex items-start gap-2">
                <ChevronRight className="mt-1 h-5 w-5 text-accent" />
                {t('citizenship_roadmap_3')}
              </p>
              <p className="flex items-start gap-2">
                <ChevronRight className="mt-1 h-5 w-5 text-accent" />
                {t('citizenship_roadmap_4')}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-3xl font-semibold">
            {t('citizenship_benefits_title')}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <Card key={b.title} className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <b.icon className="h-6 w-6 text-accent" />
                    {b.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pathway */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-3xl font-semibold">
          {t('citizenship_pathway_title')}
        </h2>
        <p className="mt-2 max-w-2xl text-foreground">
          {t('citizenship_pathway_subtitle')}
        </p>

        {/* Visual Timeline */}
        <div className="mt-12 relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-accent/20"></div>

          <div className="space-y-8">
            {pathway.map((s, i) => (
              <div key={s.title} className="relative flex items-start gap-6">
                {/* Timeline Dot */}
                <div className="relative z-10 flex-shrink-0 w-16 h-16 bg-accent rounded-full flex items-center justify-center border-4 border-background shadow-lg">
                  <s.icon className="h-6 w-6 text-background" />
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="secondary" className="text-sm">
                      {t('citizenship_pathway_step')} {i + 1}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {s.title}
                  </h3>
                  <p className="text-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* tokenPriceModifierPercent={tokenPriceModifierPercent} */}
      {/* Financed tokens */}
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {t('citizenship_financed_tokens_title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-foreground">
                <p className="flex items-start gap-2">
                  <Check className="mt-1 h-5 w-5 text-accent" />
                  {t('citizenship_financed_tokens_1')}
                </p>
                <p className="flex items-start gap-2">
                  <Check className="mt-1 h-5 w-5 text-accent" />
                  {t('citizenship_financed_tokens_2')}
                </p>
                <p className="flex items-start gap-2">
                  <Check className="mt-1 h-5 w-5 text-accent" />
                  {t('citizenship_financed_tokens_3')}
                </p>

                {isTokenPriceLoading ? (
                  <div className="mt-4 rounded-xl border p-4">
                    <div className="text-sm text-foreground">
                      {t('citizenship_loading_token_prices')}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border p-4">
                    <div className="text-sm text-foreground">
                      {t('citizenship_from')}
                    </div>
                    <div className="text-4xl font-semibold leading-tight">
                      €{tokenPlans[0]?.monthlyPayment || 0}
                      <span className="text-base font-normal">
                        {t('citizenship_per_month')}
                      </span>
                    </div>
                    <div className="text-sm text-foreground">
                      {t('citizenship_for_3_years')}
                    </div>
                  </div>
                )}

                <div className="pt-3">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-2xl px-6 w-full sm:w-auto"
                  >
                    <Link href={`${user?.roles?.includes('member') ? '/token/finance' : '/subscriptions/citizen/why'}`}>
                      {t('citizenship_start_financed_plan')}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {t('citizenship_responsibilities_title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-foreground">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="mt-1 h-5 w-5 text-accent" />
                    {t('citizenship_responsibilities_1')}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-1 h-5 w-5 text-accent" />
                    {t('citizenship_responsibilities_2')}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-1 h-5 w-5 text-accent" />
                    {t('citizenship_responsibilities_3')}
                  </li>
                </ul>
                <div className="pt-3">
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-2xl px-6"
                  >
                    <a
                      href="https://traditionaldreamfactory.gitbook.io/game-guide/02_roles-and-stakeholders/citizenship"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t('citizenship_read_full_responsibilities')}
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA strip */}

      {!user?.roles?.includes('member') && (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-3xl bg-accent p-8 text-background shadow-lg">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h3 className="text-2xl font-semibold">
                  {t('citizenship_cta_heading')}
                </h3>
                <p className="mt-1 text-accent-light">
                  {t('citizenship_cta_subtitle')}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  asChild
                  size="lg"
                  className="rounded-2xl bg-background text-accent hover:bg-background/90"
                >
                  <Link href="/subscriptions/citizen/why">
                    {t('citizenship_cta_become_citizen')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-3xl font-semibold">
            {t('citizenship_faq_title')}
          </h2>
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
        </div>
      </section>
    </div>
  );
};

CitizenshipPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [citizenshipRes, messages] = await Promise.all([
      api.get('/config/citizenship').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const citizenshipConfig = citizenshipRes?.data?.results?.value;

    return {
      citizenshipConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      citizenshipConfig: null,
    };
  }
};

export default CitizenshipPage;
