import { FC, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';
import objectPath from 'object-path';

import { useAuth } from '../../contexts/auth';
import api from '../../utils/api';
import { parseMessageFromError, slugify } from '../../utils/common';
import { getSample } from '../../utils/helpers';
import { trackEvent } from '../Analytics';
import DateTimePicker from '../DateTimePicker';
import FormField from '../FormField';
import Modal from '../Modal';
import Tabs from '../Tabs';
import { Button, Spinner } from '../ui';

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
  transformDataBeforeSave?: (data: any) => any;
  timeZone?: string;
  currencyConfig?: { fiatCur: string; tokenCur: string };
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
  transformDataBeforeSave,
  timeZone,
  currencyConfig,
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [startDate, setStartDate] = useState<string | null | Date>(data.start);
  const [endDate, setEndDate] = useState<string | null | Date>(data.end);
  const [isLoading, setIsLoading] = useState(false);
  // Check if the model has a slug field
  const hasSlugField = fields.some((field) => field.name === 'slug');

  // Generate slug from title/name for models with slug fields
  const generateSlug = (titleOrName: string) => {
    if (
      !titleOrName ||
      typeof titleOrName !== 'string' ||
      titleOrName.trim().length === 0
    )
      return '';
    return slugify(titleOrName.trim());
  };

  // Get the title/name field value for slug generation
  const getTitleValue = () => {
    const value = data.title || data.name || '';
    return value && value.trim() ? value : '';
  };

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

      // Transform data before saving if transformDataBeforeSave is provided
      const dataToSave = transformDataBeforeSave
        ? transformDataBeforeSave(updatedData)
        : updatedData;

      const method = id ? 'patch' : 'post';
      const route = id ? `${endpoint}/${id}` : endpoint;
      trackEvent(`EditModel:${endpoint}:${id ? id : 'new'}`, method);
      const {
        data: { results: savedData },
      } = await api[method](route, dataToSave);
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

  // Auto-generate slug on each character typed in title field
  useEffect(() => {
    const titleValue = getTitleValue();

    if (hasSlugField && titleValue && titleValue.length > 0) {
      const newSlug = generateSlug(titleValue);
      if (newSlug && newSlug !== data.slug) {
        update('slug', newSlug);
      }
    }
  }, [data.title, data.name, hasSlugField]);

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

  const isEvent = endpoint === '/event';
  const isPrimaryField = (field: any) => field.type === 'longtext';

  return (
    <div className="card rounded-lg p-4 shadow-sm border border-neutral-dark/20">
      <form
        action="#"
        onSubmit={(e) => {
          e.preventDefault();
          save(data);
        }}
        className="w-full"
      >
        {error && (
          <div className="validation-error mb-3 rounded-lg bg-primary-light/30 p-3 text-sm">
            {error}
          </div>
        )}
        {Object.keys(fieldsByTab).length > 1 ? (
          <Tabs
            tabs={Object.keys(fieldsByTab).map((key) => {
              const datePickerEl =
                endpoint !== '/listing' &&
                endpoint !== '/food' &&
                endpoint !== '/lesson' ? (
                  <DateTimePicker
                    setStartDate={setStartDate}
                    setEndDate={setEndDate}
                    isAdmin={true}
                    savedStartDate={data.start && data.start}
                    savedEndDate={data.end && data.end}
                    defaultMonth={new Date()}
                    timeZone={timeZone}
                    startCollapsed={isEvent}
                  />
                ) : null;
              const tabFields = filterFields(fieldsByTab[key], data);
              const isGeneralEvent = key === 'general' && isEvent;
              const titleOnly =
                isGeneralEvent ? tabFields.filter((f: any) => f.name === 'name') : [];
              const restFields = isGeneralEvent
                ? tabFields.filter(
                    (f: any) =>
                      f.name !== 'name' && f.name !== 'start' && f.name !== 'end',
                  )
                : tabFields;
              const renderField = (field: any) => (
                <FormField
                  dynamicField={dynamicField}
                  currencyConfig={currencyConfig}
                  {...field}
                  key={field.name}
                  data={data}
                  update={update}
                  isPrimaryField={isPrimaryField(field)}
                  isSecondary={
                    !isPrimaryField(field) && field.name !== 'start' && field.name !== 'end'
                  }
                />
              );
              return {
                title: key,
                value: key,
                datePicker:
                  key === 'general' && datePickerEl && !isGeneralEvent
                    ? datePickerEl
                    : null,
                content: (
                  <>
                    {isGeneralEvent ? (
                      <>
                        {titleOnly.map(renderField)}
                        {datePickerEl}
                        {restFields.map(renderField)}
                      </>
                    ) : (
                      tabFields.map(renderField)
                    )}
                  </>
                ),
              };
            })}
          />
        ) : (
          <>
            {fields &&
              filterFields(fields, data).map((field) => (
                <FormField
                  {...field}
                  dynamicField={dynamicField}
                  currencyConfig={currencyConfig}
                  key={field.name}
                  data={data}
                  update={update}
                  step={field.step || 1}
                  isPrimaryField={isPrimaryField(field)}
                  isSecondary={!isPrimaryField(field) && field.name !== 'start' && field.name !== 'end'}
                />
              ))}
          </>
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
              timeZone={timeZone}
            />
          </div>
        )}

        <div className="pt-6 mt-6 flex items-center justify-between border-t border-neutral-dark/20 gap-4 flex-wrap">
          <button
            type="submit"
            className="btn-primary min-h-[44px] px-6 inline-flex items-center justify-center"
          >
            <span className="flex gap-2 items-center">
              {isLoading && <Spinner />}
              {t('edit_model_save')}
            </span>
          </button>
          {allowDelete && (
            <button
              type="button"
              className="text-sm text-red-600 hover:text-red-800 hover:underline"
              onClick={(e) => {
                e.preventDefault();
                setShowDeleteConfirm(true);
              }}
            >
              {deleteButton}
            </button>
          )}
        </div>
      </form>

      {showDeleteConfirm && (
        <Modal
          closeModal={() => setShowDeleteConfirm(false)}
          className="md:w-[400px] md:h-auto"
        >
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold">
              {t('edit_model_delete_confirm_title')}
            </h3>
            <p className="text-gray-600">
              {t('edit_model_delete_confirm_message')}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                {t('generic_cancel')}
              </Button>
              <Button
                className="bg-red-600 text-white border-red-600 hover:bg-red-700"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  deleteObject();
                }}
              >
                {deleteButton}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EditModel;
