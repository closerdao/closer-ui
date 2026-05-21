import { useTranslations } from 'next-intl';

import ConfigImageUpload from '../ConfigImageUpload';
import { Input } from '../ui';

interface Props {
  value: string;
  onChange: (url: string) => void;
  urlLabel?: string;
  showUrlField?: boolean;
}

const BlockImageUpload = ({
  value,
  onChange,
  urlLabel,
  showUrlField = true,
}: Props) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-2">
      <ConfigImageUpload value={value} onChange={onChange} />
      {showUrlField ? (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={urlLabel ?? t('pages_editor_field_image_url')}
        />
      ) : null}
    </div>
  );
};

export default BlockImageUpload;
