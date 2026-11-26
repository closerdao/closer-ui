import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

const GROUP = '12.1a';

type IncomeEntriesInput = NonNullable<
  Parameters<typeof trpc.incomeTracking.entries.query>[0]
>;
type ExpenseInput = Parameters<typeof trpc.toconline.createExpense.mutate>[0];

// Legacy `GET /income-tracking/combined-entries`.
export const fetchIncomeEntries = async (
  input: IncomeEntriesInput,
): Promise<unknown> => {
  if (!isTrpcEnabled(GROUP)) {
    const res = await api.get('/income-tracking/combined-entries', {
      params: {
        from: input.from,
        to: input.to,
        page: input.page,
        limit: input.limit,
        sort_by: '-date',
        toconline_document_type: input.toconlineDocumentType,
      },
    });
    return res.data;
  }
  return trpc.incomeTracking.entries.query(input).catch(throwApiError);
};

// Legacy `POST /stripe-data/subscription-payments`.
export const fetchSubscriptionPayments = async (range: {
  start?: Date;
  end?: Date;
}) => {
  if (!isTrpcEnabled('13.0a')) {
    const res = await api.post('/stripe-data/subscription-payments', range);
    return res.data.results;
  }
  return (
    trpc.stripeData.subscriptionPayments
      // Dates go out as axios sent them: ISO strings.
      .query(JSON.parse(JSON.stringify(range)))
      .catch(throwApiError)
  );
};

// Legacy `POST /toconline/expense`.
export const createToconlineExpense = async (
  expenseData: ExpenseInput['expenseData'],
): Promise<void> => {
  if (!isTrpcEnabled(GROUP)) {
    await api.post('/toconline/expense', { expenseData });
    return;
  }
  await trpc.toconline.createExpense
    .mutate({ expenseData })
    .catch(throwApiError);
};
