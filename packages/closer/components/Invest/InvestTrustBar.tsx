interface InvestTrustBarProps {
  t: (key: string) => string;
}

const PRESS_LINKS = [
  {
    name: 'Thomson Reuters',
    url: 'https://www.reuters.com/sustainability/land-use-biodiversity/portuguese-eco-village-draws-remote-workers-with-promise-rural-regeneration-2023-09-22/',
  },
  {
    name: 'Expresso',
    url: 'https://expresso.pt/sustentabilidade/2024-01-31-Traditional-Dream-Factory-a-aldeia-no-Alentejo-que-quer-combater-o-exodo-rural-com-uma-DAO-e98de80e',
  },
  {
    name: 'Jornal Económico',
    url: 'https://jornaleconomico.pt/noticias/coliving-na-vila-alentejana-de-abela-atrai-nomadas-digitais-e-quer-regenerar-o-territorio-1021065',
  },
  {
    name: 'The Portugal News',
    url: 'https://www.theportugalnews.com/news/2023-10-09/eco-village-attracts-remote-workers/80853',
  },
];

const InvestTrustBar = ({ t }: InvestTrustBarProps) => {
  return (
    <div className="bg-gray-100 py-6 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-4 sm:gap-8">
        <span className="text-xs text-gray-500 uppercase tracking-widest font-medium">
          {t('invest_trust_featured')}
        </span>
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
          {PRESS_LINKS.map(({ name, url }) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              {name}
            </a>
          ))}
        </div>
        <div className="hidden sm:block w-px h-6 bg-gray-300" />
        <span className="text-sm font-semibold text-gray-600">
          {t('invest_trust_raised')}
        </span>
        <div className="hidden sm:block w-px h-6 bg-gray-300" />
        <span className="text-sm font-semibold text-gray-600">
          {t('invest_trust_reports')}
        </span>
      </div>
    </div>
  );
};

export default InvestTrustBar;
