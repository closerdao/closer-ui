import { describe, expect, it } from '@jest/globals';

import { getApiErrorDetails } from './apiError';

describe('getApiErrorDetails', () => {
  it('preserves backend error and explorer details from an Axios response', () => {
    expect(
      getApiErrorDetails(
        {
          isAxiosError: true,
          response: {
            data: {
              error: 'Transaction submission status is unknown',
              code: 'SUBMISSION_STATUS_UNKNOWN',
              explorerUrl: 'https://explorer/address/proposer',
            },
          },
        },
        'Fallback',
      ),
    ).toEqual({
      message: 'Transaction submission status is unknown',
      code: 'SUBMISSION_STATUS_UNKNOWN',
      explorerUrl: 'https://explorer/address/proposer',
    });
  });
});
