import { useState } from 'react';

import { ObjectId } from 'bson';

import { CURRENCIES_WITH_LABELS } from '../constants';
import PriceEditor from './PriceEditor';
import Switch from './Switch';
import { useTranslations } from 'next-intl';

const TicketOptionsEditor = ({ value, onChange, required }) => {
  const t = useTranslations();
  const [options, setOptions] = useState(value);
  const updateOptions = (update) => {
    setOptions(update);
    onChange && onChange(update);
  };
  const updateOption = (index, option) => {
    const update = options.map((o, i) => (i === index ? option : o));
    updateOptions(update);
  };
  const addOption = (e) => {
    e.preventDefault();
    updateOptions(
      options.concat({
        id: new ObjectId().toString(),
        name: '',
        icon: null,
        price: 0,
        currency: CURRENCIES_WITH_LABELS[0].value,
        disclaimer: '',
        limit: 0,
      }),
    );
  };
  const removeOption = (e, index) => {
    e.preventDefault();
    updateOptions(options.filter((o, i) => index !== i));
  };

  return (
    <div className="ticket-options flex justify-start items-start flex-wrap gap-3 overflow-x-hidden max-w-full">
      {options &&
        options.map((option, index) => (
          <div
            key={option._id || option.id || index}
            className="min-w-0 w-full sm:w-auto sm:min-w-[280px] card overflow-hidden"
          >
            <div className="mb-3">
              <label>{t('ticket_options_ticket_name')}</label>
              <input
                type="text"
                value={option.name}
                required={true}
                placeholder="Regular Ticket"
                onChange={(e) => {
                  e.preventDefault();
                  updateOption(index, {
                    ...option,
                    name: e.target.value,
                  });
                }}
              />
            </div>
            <div className="mb-3">
              <label>{t('ticket_options_number_of_tickets')}</label>
              <p className="italic text-gray-500 text-xs">
                {t('ticket_options_promt_message')}
              </p>
              <input
                type="Number"
                min="0"
                max="10000"
                step="1"
                className="w-full max-w-32"
                value={option.limit}
                placeholder="Quantity"
                onChange={(e) => {
                  e.preventDefault();
                  updateOption(index, {
                    ...option,
                    limit: e.target.value,
                  });
                }}
              />
            </div>
            <div className="mb-3">
              <label>{t('ticket_options_ticket_details')}</label>
              <textarea
                value={option.disclaimer}
                placeholder="This ticket provides you with..."
                onChange={(e) =>
                  updateOption(index, {
                    ...option,
                    disclaimer: e.target.value,
                  })
                }
                className="textarea min-w-0 max-w-full"
              />
            </div>
            <div className="mb-3">
              <label>{t('ticket_options_is_day_ticket')}</label>
              <Switch
                name={`isDayTicket.${index}`}
                onChange={(checked) => {
                  updateOption(index, {
                    ...option,
                    isDayTicket: checked,
                  });
                }}
                checked={option.isDayTicket}
              />
            </div>
            <PriceEditor
              value={{ cur: option.currency, val: option.price }}
              onChange={(price) => {
                updateOption(index, {
                  ...option,
                  price: price.val,
                  currency: price.cur,
                });
              }}
              required={required}
            />
            <div className="mt-3">
              <a
                href="#"
                className="danger-link"
                onClick={(e) => removeOption(e, index)}
              >
                {t('ticket_options_remove')}
              </a>
            </div>
          </div>
        ))}
      <div className="flex justify-center items-center">
        <a href="#" className="btn" onClick={(e) => addOption(e)}>
          {t('ticket_options_add_type')}
        </a>
      </div>
    </div>
  );
};

TicketOptionsEditor.defaultProps = {
  onChange: null,
  value: [],
};

export default TicketOptionsEditor;
