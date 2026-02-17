import {
  getInvestPageInitialProps,
  InvestPage as CloserInvestPage,
  type InvestPageProps,
} from 'closer';

function InvestPage(props: InvestPageProps) {
  return <CloserInvestPage {...props} />;
}

InvestPage.getInitialProps = getInvestPageInitialProps;

export default InvestPage;
