import { z } from 'zod';

interface DataSchema {
  len: number;
  names: string[];
}

const validMonths = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

const stringRequired = z.string().min(1, { message: 'This field is required' });
const numberRequired = z
  .string()
  .min(1, { message: 'This field is required' })
  .refine((val) => !isNaN(Number(val)), {
    message: 'Must be a valid number',
  });

const numberOptional = z.string().refine((val) => !isNaN(Number(val)), {
  message: 'Must be a valid number',
});
const monthNameOptional = z
  .string()
  .refine((val) => validMonths.includes(val.toLowerCase()), {
    message: 'Must be a valid month name in English',
  });

export const configFormSchema = z.object({
  appName: stringRequired,
  platformName: stringRequired,
  semanticUrl: stringRequired,
  platformLegalAddress: stringRequired,
  teamEmail: stringRequired.email(),
  locationLat: numberRequired,
  locationLon: numberRequired,
  facebookPixelId: numberOptional,
  foodPriceBasic: numberRequired,
  foodPriceChef: numberRequired,
  utilityFiatVal: numberRequired,
  utilityFiatCur: stringRequired,
  utilityDayFiatVal: numberRequired,
  utilityTokenVal: numberRequired,
  utilityTokenCur: stringRequired,
  checkinTime: numberRequired,
  checkoutTime: numberRequired,
  maxDuration: numberRequired,
  minDuration: numberRequired,
  volunteerCommitment: stringRequired,
  memberMaxDuration: numberRequired,
  memberMaxBookingHorizon: numberRequired,
  guestMaxDuration: numberRequired,
  guestMaxBookingHorizon: numberRequired,
  discountsDaily: numberRequired,
  discountsWeekly: numberRequired,
  discountsMonthly: numberRequired,
  seasonsHighStart: monthNameOptional,
  seasonsHighEnd: monthNameOptional,
  seasonsHighModifier: numberRequired,
  cancellationPolicyLastday: numberRequired,
  cancellationPolicyLastweek: numberRequired,
  cancellationPolicyLastmonth: numberRequired,
  cancellationPolicyDefault: numberRequired,
  vatRate: numberRequired,
  volunteeringMinStay: numberRequired,
});

const arrayValidationRules = {
  title: stringRequired,
  description: stringRequired,
  billingPeriod: stringRequired,
  slug: stringRequired,
  priceId: stringRequired,
  tier: numberOptional,
  monthlyCredits: numberRequired,
  price: numberRequired,
  perks: stringRequired,
  name: stringRequired,
  subject: stringRequired,
  body: stringRequired,
};

function buildValidationObject(
  data: DataSchema[],
  obj: Record<string, any>,
): z.ZodObject<any> {
  let newObjSchema = z.object({});

  data.forEach(({ len, names }) => {
    names.forEach((name) => {
      for (let i = 0; i < len; i++) {
        if (!obj[name]) return;
        newObjSchema = newObjSchema.extend({
          [`${name}-${i}`]: obj[name],
        });
      }
    });
  });

  const mergedSchema = configFormSchema.merge(newObjSchema);

  return mergedSchema;
}
export const getValidationSchema = (data: DataSchema[]) => {
  if (!data) return null;
  const arrayValidation = buildValidationObject(data, arrayValidationRules);
  return arrayValidation;
};
