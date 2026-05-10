import { CitizenshipPage } from 'closer';
import { ComponentProps } from 'react';

const TDFCitizenshipPage = (props: ComponentProps<typeof CitizenshipPage>) => (
  <CitizenshipPage {...props} appName="Traditional Dream Factory" />
);

export default TDFCitizenshipPage;
