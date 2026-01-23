import Head from 'next/head';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import Heading from '../components/ui/Heading';

import { loadLocaleData } from '../utils/locale.helpers';

const SITE_URL = process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth';

const PrivacyPolicyPage = () => {
  const t = useTranslations();

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy Policy — Closer',
    description: 'Learn how Closer collects, uses, and protects your personal information across our platform for regenerative communities.',
    url: `${SITE_URL}/privacy-policy`,
    publisher: {
      '@type': 'Organization',
      name: 'OASA Verein',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Industriestrasse 47, c/o Juris Services AG',
        addressLocality: 'Zug',
        postalCode: '6300',
        addressCountry: 'CH',
      },
    },
    dateModified: '2026-01-23',
  };

  return (
    <>
      <Head>
        <title>Privacy Policy — Closer</title>
        <meta name="description" content="Learn how Closer collects, uses, and protects your personal information across our platform for regenerative communities." />
        <meta name="robots" content="noindex, follow" />
        
        <meta property="og:title" content="Privacy Policy — Closer" />
        <meta property="og:description" content="Learn how Closer collects, uses, and protects your personal information." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/privacy-policy`} />
        
        <link rel="canonical" href={`${SITE_URL}/privacy-policy`} />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      <main className="w-full flex flex-col items-center gap-8 pb-20">
        <section className="w-full max-w-[800px] px-4 py-12">
          <Heading level={1} className="text-4xl mb-4">
            {t('privacy_policy_title')}
          </Heading>
          <p className="text-foreground/60 mb-12">
            Last updated: January 2026
          </p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                1. Introduction
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                Closer is operated by OASA Verein, a registered association in Zug, Switzerland (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). We operate a platform that enables regenerative communities to manage accommodations, bookings, events, subscriptions, governance, and community resources. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.
              </p>
              <p className="text-foreground/80 leading-relaxed">
                By accessing or using Closer, you agree to this Privacy Policy. If you do not agree with the terms of this policy, please do not access the platform.
              </p>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                2. Information We Collect
              </Heading>
              
              <Heading level={3} className="text-xl mb-3 mt-6">
                2.1 Personal Information
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                We may collect personal information that you voluntarily provide when using our services, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
                <li>Name, email address, phone number, and postal address</li>
                <li>Date of birth and nationality (for booking and compliance purposes)</li>
                <li>Payment information (processed securely through third-party providers)</li>
                <li>Profile information, photos, and biographical details</li>
                <li>Government-issued identification (when required for accommodation bookings)</li>
                <li>Dietary preferences and accessibility requirements</li>
                <li>Emergency contact information</li>
              </ul>

              <Heading level={3} className="text-xl mb-3 mt-6">
                2.2 Community & Governance Data
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                When participating in community features, we may collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
                <li>Blockchain wallet addresses (for token-based governance)</li>
                <li>Voting records and governance participation data</li>
                <li>Subscription and membership status</li>
                <li>Volunteer hours and contribution records</li>
                <li>Event attendance and participation history</li>
                <li>Communications within community channels</li>
              </ul>

              <Heading level={3} className="text-xl mb-3 mt-6">
                2.3 Automatically Collected Information
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                When you access our platform, we automatically collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Device information (browser type, operating system, device identifiers)</li>
                <li>IP address and approximate location</li>
                <li>Usage data (pages visited, features used, time spent)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                3. How We Use Your Information
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                We use collected information for the following purposes:
              </p>
              
              <Heading level={3} className="text-xl mb-3 mt-6">
                3.1 Core Platform Services
              </Heading>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
                <li>Processing bookings, reservations, and payments</li>
                <li>Managing event registrations and ticketing</li>
                <li>Administering subscriptions and membership benefits</li>
                <li>Facilitating volunteer coordination and task management</li>
                <li>Operating community communication channels</li>
              </ul>

              <Heading level={3} className="text-xl mb-3 mt-6">
                3.2 Governance & Token Features
              </Heading>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
                <li>Recording and verifying governance votes</li>
                <li>Distributing tokens and tracking ownership</li>
                <li>Implementing proof-of-presence and proof-of-sweat mechanisms</li>
                <li>Maintaining transparent community decision records</li>
              </ul>

              <Heading level={3} className="text-xl mb-3 mt-6">
                3.3 Platform Improvement
              </Heading>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Analyzing usage patterns to improve services</li>
                <li>Developing new features and functionality</li>
                <li>Preventing fraud and ensuring platform security</li>
                <li>Complying with legal obligations</li>
              </ul>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                4. Information Sharing & Disclosure
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                We may share your information in the following circumstances:
              </p>

              <Heading level={3} className="text-xl mb-3 mt-6">
                4.1 With Community Operators
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                Communities using Closer receive access to member data necessary for operating their services. Each community may have additional privacy practices, and we encourage you to review their specific policies.
              </p>

              <Heading level={3} className="text-xl mb-3 mt-6">
                4.2 Service Providers
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                We share information with third-party service providers who assist in:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
                <li>Payment processing (Stripe and other payment providers)</li>
                <li>Email communications and newsletters</li>
                <li>Cloud hosting and data storage</li>
                <li>Analytics and performance monitoring</li>
                <li>Authentication services (including Google login)</li>
              </ul>

              <Heading level={3} className="text-xl mb-3 mt-6">
                4.3 Blockchain Networks
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                When using token-based features, certain information is recorded on public blockchain networks (such as Celo). This includes wallet addresses and transaction records, which are publicly visible and immutable by design. We do not control blockchain networks and cannot delete on-chain data.
              </p>

              <Heading level={3} className="text-xl mb-3 mt-6">
                4.4 Legal Requirements
              </Heading>
              <p className="text-foreground/80 leading-relaxed">
                We may disclose information when required by law, regulation, legal process, or governmental request, or when we believe disclosure is necessary to protect our rights, your safety, or the safety of others.
              </p>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                5. Data Retention
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                We retain personal information for as long as necessary to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
                <li>Provide our services and maintain your account</li>
                <li>Comply with legal obligations (including tax and financial reporting)</li>
                <li>Resolve disputes and enforce agreements</li>
                <li>Maintain governance and community records</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed">
                Your data is retained in perpetuity unless you choose to delete it. You can delete your account and all associated data at any time through your account settings in the platform UI, or via our API. Governance and voting records recorded on-chain cannot be deleted due to the immutable nature of blockchain technology.
              </p>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                6. Your Rights & Choices
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
                <li><strong>Access:</strong> Request a copy of personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal retention requirements)</li>
                <li><strong>Portability:</strong> Request your data in a portable format</li>
                <li><strong>Objection:</strong> Object to certain processing of your data</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed">
                You can exercise most of these rights directly through your account settings, including deleting all your data. For additional requests, contact us at team@closer.earth. Note that on-chain blockchain data cannot be modified or deleted.
              </p>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                7. Cookies & Tracking
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
                <li>Maintain your session and preferences</li>
                <li>Analyze platform usage and performance</li>
                <li>Provide personalized experiences</li>
                <li>Enable social media features</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed">
                You can manage cookie preferences through your browser settings. Disabling certain cookies may affect platform functionality.
              </p>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                8. Data Security
              </Heading>
              <p className="text-foreground/80 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your information, including encryption, access controls, and regular security assessments. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                9. Data Storage & International Transfers
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                Our servers are currently located in Germany within the European Union. Your information may also be processed by third-party service providers in other jurisdictions, including the United States. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.
              </p>
              <p className="text-foreground/80 leading-relaxed">
                In the future, Closer intends to deploy its own cloud infrastructure hosted by the regenerative communities themselves, further decentralizing data storage and aligning with our values of community sovereignty.
              </p>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                10. Children&apos;s Privacy
              </Heading>
              <p className="text-foreground/80 leading-relaxed">
                Our services are not directed to individuals under 16 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will take steps to delete such information.
              </p>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                11. Changes to This Policy
              </Heading>
              <p className="text-foreground/80 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on our platform and updating the &ldquo;Last updated&rdquo; date. Your continued use of our services after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                12. Contact Us
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                For questions about this Privacy Policy or our data practices, contact us at:
              </p>
              <div className="bg-foreground/5 rounded-lg p-6">
                <p className="text-foreground/80 mb-4">
                  <strong>OASA Verein</strong><br />
                  Industriestrasse 47<br />
                  c/o Juris Services AG<br />
                  6300 Zug, Switzerland
                </p>
                <p className="text-foreground/80 mb-2">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:team@closer.earth" className="text-accent hover:underline">
                    team@closer.earth
                  </a>
                </p>
                <p className="text-foreground/80">
                  <strong>Website:</strong>{' '}
                  <a href="https://closer.earth" className="text-accent hover:underline">
                    closer.earth
                  </a>
                </p>
              </div>
            </section>

            <section className="border-t border-divider pt-8 mt-12">
              <p className="text-foreground/60 text-sm">
                This privacy policy applies to the Closer platform and all communities operating on it. Individual communities may have additional privacy practices and policies that supplement this document.
              </p>
            </section>
          </div>
        </section>
      </main>
    </>
  );
};

export default PrivacyPolicyPage;

PrivacyPolicyPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return { messages };
  } catch (err) {
    return { error: err, messages: null };
  }
};
