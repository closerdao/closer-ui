import {
  FundraiserPage as CloserFundraiserPage,
  type InvestPageProps,
} from 'closer';

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
    <CloserFundraiserPage
      {...props}
      investPageOptions={{
        ...TDF_FUNDRAISER_OPTIONS,
        ...props.investPageOptions,
      }}
    />
  );
}

export default FundraiserPage;
