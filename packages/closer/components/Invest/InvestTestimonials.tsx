interface InvestTestimonialsProps {
  tokenHolderCount: number;
  t: (key: string, values?: Record<string, string | number>) => string;
}

const TESTIMONIAL_KEYS = [0, 1, 2] as const;

const InvestTestimonials = ({ tokenHolderCount, t }: InvestTestimonialsProps) => {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-3">
        {t('invest_testimonials_label')}
      </p>
      <h2 className="font-bold text-3xl text-gray-900 mb-3">
        {t('invest_testimonials_title')}
      </h2>
      <p className="text-base text-gray-600 max-w-xl mb-10">
        {t('invest_testimonials_subtitle', { count: tokenHolderCount })}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {TESTIMONIAL_KEYS.map((i) => (
          <div key={i} className="bg-gray-100 rounded-2xl p-6 sm:p-7 flex flex-col">
            <p className="text-sm text-gray-600 leading-relaxed italic mb-5 flex-1">
              &ldquo;{t(`invest_testimonial_${i}_quote`)}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center font-semibold text-accent text-sm flex-shrink-0">
                {t(`invest_testimonial_${i}_initials`)}
              </div>
              <div>
                <div className="font-semibold text-sm text-gray-900">
                  {t(`invest_testimonial_${i}_name`)}
                </div>
                <div className="text-xs text-gray-500">
                  {t(`invest_testimonial_${i}_detail`)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default InvestTestimonials;
