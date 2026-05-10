import { NextPageContext } from 'next';
import type { ComponentProps } from 'react';

import PageNotFound from '../../../not-found';
import StayCheckoutPage from '../stayCheckoutPage';
import { isStayMongoId } from '../../../../utils/stayRouting.helpers';

type CheckoutProps = ComponentProps<typeof StayCheckoutPage>;

type Props = CheckoutProps & { stayRouteInvalid?: boolean };

function StayCreateByStayIdPage(props: Props) {
  if (props.stayRouteInvalid) {
    return <PageNotFound />;
  }
  const { stayRouteInvalid: _r, ...rest } = props;
  return <StayCheckoutPage {...(rest as CheckoutProps)} />;
}

StayCreateByStayIdPage.getInitialProps = async (context: NextPageContext) => {
  const raw = context.query.slug;
  const slug = Array.isArray(raw) ? raw[0] : raw;
  if (typeof slug !== 'string' || !isStayMongoId(slug)) {
    if (context.res) {
      context.res.statusCode = 404;
    }
    return {
      stayRouteInvalid: true,
      bookingSettings: null,
      generalConfig: null,
      volunteerConfig: null,
      foodOptions: null,
      messages: null,
    };
  }
  const base = await StayCheckoutPage.getInitialProps?.(context);
  return {
    ...(base ?? {}),
    stayRouteInvalid: false,
  };
};

export default StayCreateByStayIdPage;
