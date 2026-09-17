import { ComponentProps } from 'react';

import { LegacyCitizenshipPage } from 'closer';

const TDFLegacyCitizenshipPage = (
  props: ComponentProps<typeof LegacyCitizenshipPage>,
) => <LegacyCitizenshipPage {...props} appName="Traditional Dream Factory" />;

TDFLegacyCitizenshipPage.getInitialProps =
  LegacyCitizenshipPage.getInitialProps;

export default TDFLegacyCitizenshipPage;
