import { useTranslations } from 'next-intl';

const Loading = () => {
  const t = useTranslations();
  return (
    <div className="loading">
      <div className="lds-ripple">
        <div></div>
        <div></div>
      </div>{' '}
      {t('generic_loading')}
    </div>
  );
};

export default Loading;
