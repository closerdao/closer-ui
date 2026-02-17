import { CitizenshipPage } from 'closer';
import { ComponentProps } from 'react';

const TDFCitizenshipPage = (props: ComponentProps<typeof CitizenshipPage>) => (
  <CitizenshipPage {...props} appName="Traditional Dream Factory" />
);

TDFCitizenshipPage.getInitialProps = CitizenshipPage.getInitialProps;
export default TDFCitizenshipPage;
