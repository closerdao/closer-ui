import React, { useEffect, useState } from 'react';

import objectPath from 'object-path';

import { useAuth } from '../contexts/auth';
import api from '../utils/api';
import { getSample } from '../utils/helpers';
import { __ } from '../utils/helpers';
import { trackEvent } from './Analytics';
import FormField from './FormField';
import Tabs from './Tabs';

const filterFields = (fields, data) =>
  fields.filter((field) => {
    if (field.showIf) {
      if (field.showIf.every(({ field, value }) => data[field] === value)) {
        return true;
      }
      return false;
    }
    return true;
  });

// If no id is passed, we are creating a new model
const EditModel = ({
  fields,
  id,
  initialData,
  endpoint,
  onSave,
  onUpdate,
  onError,
  onDelete,
  allowDelete,
  deleteButton,
  isPublic,
}) => {
  const { isAuthenticated, user } = useAuth();
  const initialModel =
    initialData ||
    fields.reduce(
      (acc, field) => ({
        ...acc,
        [field.name]: field.default || getSample(field),
      }),
      {},
    );
  const [data, setData] = useState(initialModel);
  const [error, setErrors] = useState(false);
  const fieldsByTab = {
    general: [],
  };
  fields &&
    fields.forEach((field) => {
      if (field.tab) {
        fieldsByTab[field.tab] = (fieldsByTab[field.tab] || []).concat(field);
      } else {
        fieldsByTab.general = (fieldsByTab.general || []).concat(field);
      }
    });

  // Name: visibleBy, value: [1], option: 1, actionType: ADD
  const update = (name, value, option, actionType) => {
    const copy = { ...data };
    objectPath.set(copy, name, value);
    setData(copy);

    if (onUpdate) {
      onUpdate(name, value, option, actionType);
    }
  };

  const validate = (updatedData) => {
    const validationErrors = [];
    fields.forEach((field) => {
      if (field.required && !updatedData[field.name]) {
        validationErrors.push(field.name);
      }
    });
    if (validationErrors.length > 0) {
      throw new Error(`Please set a valid ${validationErrors.join(', ')}`);
    }
  };
  const save = async (updatedData) => {
    setErrors(null);
    try {
      validate(updatedData);
      const method = id ? 'patch' : 'post';
      const route = id ? `${endpoint}/${id}` : endpoint;
      trackEvent(`EditModel:${endpoint}:${id ? id : 'new'}`, method);
      const {
        data: { results: savedData },
      } = await api[method](route, updatedData);
      if (onSave) {
        onSave(savedData);
      }
    } catch (err) {
      setErrors(err.message);
      if (onError) {
        onError(err.message);
      }
    }
  };
  const deleteObject = async () => {
    setErrors(null);
    try {
      if (!data._id) {
        throw new Error(
          `Attempting to delete ${endpoint} but no _id provided.`,
        );
      }
      trackEvent(`EditModel:${endpoint}:${id ? id : 'new'}`, 'delete');
      await api.delete(`${endpoint}/${data._id}`);
      if (onDelete) {
        onDelete();
      }
    } catch (err) {
      setErrors(err.message);
      if (onError) {
        onError(err.message);
      }
    }
  };

  const loadData = async () => {
    try {
      if (id && !initialData) {
        const {
          data: { results: modelData },
        } = await api.get(`${endpoint}/${id}`);
        setData(modelData);
        // Look out for dependent data
        await Promise.all(
          fields.map(async (field) => {
            if (
              field.type === 'autocomplete' &&
              field.endpoint &&
              modelData[field.name] &&
              typeof modelData[field.name][0] !== 'object'
            ) {
              const params = {
                where: { _id: { $in: modelData[field.name] } },
              };
              const {
                data: { results },
              } = await api.get(field.endpoint, { params });
              update(field.name, results);
            }
          }),
        );
      }
    } catch (err) {
      setErrors(err.response?.data?.error || err.message);
    }
  };

  useEffect(() => {
    loadData();
    if (initialData && JSON.stringify(initialData) !== JSON.stringify(data)) {
      setData(initialData);
    }
  }, [endpoint, id, initialData, fields]);

  if (!isPublic && !isAuthenticated) {
    return (
      <div className="validation-error card">
        {__('edit_model_auth_required')}
      </div>
    );
  }

  if (
    !isPublic &&
    data.createdBy &&
    user &&
    data.createdBy !== user._id &&
    !user.roles.includes('admin')
  ) {
    return (
      <div className="validation-error card">
        {__('edit_model_permission_denied')}
      </div>
    );
  }

  return (
    <form
      action="#"
      onSubmit={(e) => {
        e.preventDefault();
        save(data);
      }}
    >
      {error && <div className="validation-error">{error}</div>}
      {Object.keys(fieldsByTab).length > 1 ? (
        <Tabs
          tabs={Object.keys(fieldsByTab).map((key) => ({
            title: key,
            value: key,
            content: filterFields(fieldsByTab[key], data).map((field) => (
              <FormField
                {...field}
                key={field.name}
                data={data}
                update={update}
              />
            )),
          }))}
        />
      ) : (
        fields &&
        filterFields(fields, data).map((field) => (
          <FormField {...field} key={field.name} data={data} update={update} />
        ))
      )}
      <div className="mt-2 flex items-center">
        <button type="submit" className="btn-primary">
          {__('edit_model_save')}
        </button>
        {allowDelete && (
          <a
            href="#"
            className="text-red-700 ml-4"
            onClick={(e) => {
              e.preventDefault();
              deleteObject();
            }}
          >
            {deleteButton}
          </a>
        )}
      </div>
    </form>
  );
};

EditModel.defaultProps = {
  fields: [],
  buttonText: 'Save',
  allowDelete: false,
  deleteButton: 'Delete',
  isPublic: false,
};

export default EditModel;
