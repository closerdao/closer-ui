import {
  getInvestPageInitialProps,
  FundraiserPage as CloserFundraiserPage,
  type InvestPageProps,
} from 'closer';

function FundraiserPage(props: InvestPageProps) {
  return <CloserFundraiserPage {...props} />;
}

FundraiserPage.getInitialProps = getInvestPageInitialProps;

export default FundraiserPage;
