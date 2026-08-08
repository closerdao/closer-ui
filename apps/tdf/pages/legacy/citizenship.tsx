import { LegacyCitizenshipPage } from 'closer';
import { ComponentProps } from 'react';

const TDFLegacyCitizenshipPage = (
  props: ComponentProps<typeof LegacyCitizenshipPage>,
) => <LegacyCitizenshipPage {...props} appName="Traditional Dream Factory" />;

TDFLegacyCitizenshipPage.getInitialProps =
  LegacyCitizenshipPage.getInitialProps;

export default TDFLegacyCitizenshipPage;
