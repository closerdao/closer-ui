import Link from 'next/link';

import React from 'react';

import { __ } from '../../utils/helpers';

const ReportABug = () => {
    return (
        <p className="text-center mt-4">
        🐛
        <Link
          className="text-accent underline"
          href="https://forms.gle/uQQhTiFu5PRtu7Ei9"
          target="_blank"
        >
          {__('report_a_bug')}
        </Link>
      </p>
    );
};

export default ReportABug;
