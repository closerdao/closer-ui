import { FC, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';
import objectPath from 'object-path';

import { useAuth } from '../../contexts/auth';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { getSample } from '../../utils/helpers';
import { trackEvent } from '../Analytics';
import DateTimePicker from '../DateTimePicker';
import FormField from '../FormField';
import Tabs from '../Tabs';
import { Spinner } from '../ui';

const filterFields = (fields: any[], data: any) =>
  fields.filter((field) => {
    if (field.showIf) {
      if (
        field.showIf.every(
          ({ field, value }: { field: any; value: any }) =>
            data[field] === value,
        )
      ) {
        return true;
      }
      return false;
    }
    return true;
  });

// If no id is passed, we are creating a new model
interface Props {
  fields: any[];
  id?: string;
  initialData?: any;
  endpoint: string;
  onSave?: (data: any) => void;
  onUpdate?: (
    name: string,
    value: any,
    option?: any,
    actionType?: string,
  ) => void;
  onError?: (error: string) => void;
  onDelete?: () => void;
  allowDelete?: boolean;
  deleteButton?: any;
  isPublic?: boolean;
  dynamicField?: {
    name: string;
    options: any[];
  };
}

const EditModel: FC<Props> = ({
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
  dynamicField,
}) => {
  const t = useTranslations();
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
  const [error, setErrors] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<string | null | Date>(data.start);
  const [endDate, setEndDate] = useState<string | null | Date>(data.end);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setData({ ...data, start: startDate, end: endDate });
  }, [endDate, startDate]);

  const fieldsByTab: Record<string, any> = {
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

  const propagateError = (error: unknown) => {
    const errorMessage = parseMessageFromError(error);
    setErrors(errorMessage);
    if (onError) {
      onError(errorMessage);
    }
  };
  // Name: visibleBy, value: [1], option: 1, actionType: ADD
  const update = (
    name: string,
    value: any,
    option?: string,
    actionType?: string,
  ) => {
    const copy = { ...data };

    objectPath.set(copy, name, value);
    setData(copy);

    if (onUpdate) {
      onUpdate(name, value, option, actionType);
    }
  };

  const validate = (updatedData: any) => {
    const validationErrors: string[] = [];
    fields.forEach((field) => {
      if (field.required && !updatedData[field.name]) {
        validationErrors.push(field.name);
      }
    });
    if (validationErrors.length > 0) {
      throw new Error(`Please set a valid ${validationErrors.join(', ')}`);
    }
  };
  const save = async (updatedData: any) => {
    setIsLoading(true);
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
      propagateError(err);
    } finally {
      setIsLoading(false);
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
      propagateError(err);
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
      propagateError(err);
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
        {t('edit_model_auth_required')}
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
        {t('edit_model_permission_denied')}
      </div>
    );
  }

  return (
    <div className="card">
      <form
        action="#"
        onSubmit={(e) => {
          e.preventDefault();
          save(data);
        }}
        className="w-full"
      >
        {error && <div className="validation-error">{error}</div>}
        {Object.keys(fieldsByTab).length > 1 ? (
          <Tabs
            tabs={Object.keys(fieldsByTab).map((key) => ({
              title: key,
              value: key,
              datePicker:
                endpoint !== '/listing' && endpoint !== '/food' ? (
                  <DateTimePicker
                    setStartDate={setStartDate}
                    setEndDate={setEndDate}
                    isAdmin={true}
                    savedStartDate={data.start && data.start}
                    savedEndDate={data.end && data.end}
                    defaultMonth={new Date()}
                  />
                ) : null,
              content: filterFields(fieldsByTab[key], data).map((field) => (
                <FormField
                  dynamicField={dynamicField}
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
            <FormField
              {...field}
              dynamicField={dynamicField}
              key={field.name}
              data={data}
              update={update}
              step={field.step || 1}
            />
          ))
        )}

        {(endpoint === '/volunteer' || endpoint === '/projects') && (
          <div>
            <DateTimePicker
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              isAdmin={true}
              savedStartDate={data.start}
              savedEndDate={data.end}
              defaultMonth={new Date()}
            />
          </div>
        )}

        <div className="py-6 flex items-center">
          <button type="submit" className="btn-primary">
            <div className="flex gap-2 items-center">
              {isLoading && <Spinner />}
              {t('edit_model_save')}
            </div>
          </button>
          {allowDelete && (
            <a
              href="#"
              className="text-pink-700 ml-4"
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
    </div>
  );
};

export default EditModel;
