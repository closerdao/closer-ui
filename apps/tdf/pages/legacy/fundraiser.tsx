import {
  LegacyFundraiserPage as CloserLegacyFundraiserPage,
  type InvestPageProps,
} from 'closer';
import { NextPageContext } from 'next';

const TDF_FUNDRAISER_OPTIONS = {
  canonicalUrl: 'https://www.traditionaldreamfactory.com/fundraiser',
  shareUrl: 'https://www.traditionaldreamfactory.com/fundraiser',
  ogImageUrl: 'https://cdn.oasa.co/tdf/tdf-invest-og.jpg',
  dataroomHref: '/dataroom',
  scheduleCallHref: '#webinar',
  loanPackageHref: '/dataroom',
};

function FundraiserPage(props: InvestPageProps) {
  return (
    <CloserLegacyFundraiserPage
      {...props}
      investPageOptions={{
        ...TDF_FUNDRAISER_OPTIONS,
        ...props.investPageOptions,
      }}
    />
  );
}

FundraiserPage.getInitialProps = async (context: NextPageContext) => {
  if (typeof CloserLegacyFundraiserPage.getInitialProps === 'function') {
    return CloserLegacyFundraiserPage.getInitialProps(context);
  }
  return {};
};

export default FundraiserPage;
