import React, { useState } from 'react';

import api, { formatSearch } from '../utils/api';
import { __ } from '../utils/helpers';

const Autocomplete = ({ endpoint, where, placeholder, value, onChange }) => {
  const [search, setSearch] = useState('');
  const [pastSearch, setPastSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);
  const [options, setOptions] = useState(null);
  const [error, setErrors] = useState(false);

  const textSearch = async (text) => {
    setSearch(text);

    if (text === pastSearch) {
      return;
    }

    setLoading(true);
    try {
      const params = {
        where: formatSearch({
          ...where,
          _search: text,
        }),
        sort_by: '-created',
      };
      const {
        data: { results },
      } = await api.get(endpoint, { params });
      setOptions(results);
      setPastSearch(text);
      setLoading(false);
    } catch (err) {
      console.log('Load error', err);
      setErrors(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="autocomplete">
      <input
        value={search}
        placeholder={placeholder}
        onChange={(e) => {
          textSearch(e.target.value);
        }}
        onFocus={() => setActive(true)}
      />
      {error && <div className="validation-error">{error}</div>}
      {active && (
        <div className="autocomplete-results">
          <a
            href="#"
            className="close"
            onClick={(e) => {
              e.preventDefault();
              setActive(false);
            }}
          >
            {__('autocomplete_close')}
          </a>
          {loading && <div className="loading">loading...</div>}
          {options && options.length > 0 ? (
            <div className="results">
              {options
                .filter((o) => !value.map((v) => v._id).includes(o._id))
                .map((option) => {
                  switch (endpoint) {
                    case '/user':
                      return (
                        <a
                          href="#"
                          key={option._id}
                          onClick={(e) => {
                            e.preventDefault();
                            setSearch('');
                            onChange(value.concat(option), option, 'ADD');
                          }}
                          className="user-preview"
                        >
                          <figure className="profile-photo"></figure>
                          <span>{option.screenname}</span>
                        </a>
                      );
                    case '/channel':
                      return (
                        <a
                          href="#"
                          key={option._id}
                          onClick={(e) => {
                            e.preventDefault();
                            setSearch('');
                            onChange(value.concat(option), option, 'ADD');
                          }}
                          className="channel-preview"
                        >
                          <span>{option.name}</span>
                        </a>
                      );
                    default:
                      return `No render method for ${endpoint}`;
                  }
                })}
            </div>
          ) : (
            <p>{__('autocomplete_no_results')}</p>
          )}
        </div>
      )}
    </div>
  );
};

Autocomplete.defaultProps = {
  onChange: () => null,
  value: [],
  where: {},
  placeholder: 'Start typing...',
};

export default Autocomplete;
