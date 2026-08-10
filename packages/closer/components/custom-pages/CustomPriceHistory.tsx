import React from 'react';

import TokenGraph from '../TokenGraph';

const CustomPriceHistory: React.FC<{
  settings?: Record<string, unknown>;
  content?: Record<string, unknown>;
}> = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <TokenGraph variant="price" />
      </div>
    </section>
  );
};

export default CustomPriceHistory;
