import react, { useState } from 'react';

import PriceEditor from './PriceEditor';
import { __ } from '../utils/helpers';

const fieldTypes = [
  {
    value: 'text',
    label: 'Text'
  },
  {
    value: 'datetime',
    label: 'Date & Time'
  },
  {
    value: 'select',
    label: 'Multi select'
  },
];

const FieldsEditor = ({ value, onChange }) => {
  const [options, setOptions] = useState(value);
  const updateOptions = (update) => {
    setOptions(update);
    onChange && onChange(update);
  }
  const updateOption = (index, option) => {
    const update = options.map((o, i) => i === index ? option : o);
    updateOptions(update);
  }
  const addOption = e => {
    e.preventDefault();
    updateOptions(options.concat({
      id: Math.random(),
      name: '',
      fieldType: 'text',
      options: []
    }));
  };
  const removeOption = (e, index) => {
    e.preventDefault();
    updateOptions(options.filter((o, i) => index !== i))
  }

  return (
    <div className="discounts-options">
      {
        options && options.map((option, index) => (
          <div key={ option._id || option.id || index } className="mr-3 mb-4 p-3 shadow">
            <div className="mb-3">
              <label>{ __('fields_editor_question') }</label>
              <input
                type="text"
                value={ option.name }
                placeholder="What time will you arrive?"
                onChange={e => { e.preventDefault(); updateOption(index, { ...option, name: e.target.value }); }}
              />
            </div>
            <div className="mb-3">
              <label>{ __('fields_editor_type') }</label>
              <select
                value={ option.fieldType }
                onChange={e => updateOption(index, { ...option, fieldType: e.target.value })}
              >
                {fieldTypes.map(opt => (
                  <option value={ opt.value } key={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            { option.fieldType === 'select' &&
              <div className="mb-3">
                <label>{ __('fields_editor_options') }</label>
                { option.options && option.options.map((opt, i) => (
                  <div key={ i } className="flex flex-row justify-start items-center mb-3">
                    <input
                      type="text"
                      value={ opt }
                      placeholder={`around ${3 + i}pm`}
                      onChange={e => updateOption(index, { ...option, options: (option.options || []).map((v, y) => {
                        if (y === i) {
                          return e.target.value;
                        }
                        return v;
                      }) })}
                    />
                    <a href="#" className="danger-link" onClick={ e => {
                      e.preventDefault();
                      updateOption(index, { ...option, options: (option.options || []).filter((v, y) => y !== i) });
                    }}>{ __('fields_editor_remove') }</a>
                  </div>
                )) }
                <div>
                  <a href="#" className="btn text-sm" onClick={ e => {
                    e.preventDefault();
                    updateOption(index, { ...option, options: (option.options || []).concat('') });
                  } }>
                    { __('fields_editor_add_option') }
                  </a>
                </div>
              </div>
            }
            <div className="mt-3">
              <a href="#" className="danger-link" onClick={ e => removeOption(e, index) }>{ __('fields_editor_remove') }</a>
            </div>
          </div>
        ))
      }
      <div className="flex justify-start items-center">
        <a href="#" className="btn" onClick={ e => addOption(e) }>{ __('fields_editor_add_custom_field') }</a>
      </div>
    </div>
  );
}

FieldsEditor.defaultProps = {
  onChange: null,
  value: []
}

export default FieldsEditor;
