import React, { useEffect, useMemo, useState } from 'react';

import { usePlatform } from '../contexts/platform';
import models from '../models';
import { __ } from '../utils/helpers';
import Pagination from './Pagination';
import TimeSince from './TimeSince';

const ApplicationList = ({ status, managedBy, limit }) => {
  const { platform } = usePlatform();
  const [page, setPage] = useState(1);
  const [error, setErrors] = useState(false);
  const filter = useMemo(
    () => ({
      where: { status },
      limit,
      page,
    }),
    [status, limit, page],
  );
  if (managedBy) {
    filter.where.managedBy = { $in: [managedBy] };
  }
  const applications = platform.application.find(filter);

  const updateApplication = async (id, status, app = {}) => {
    try {
      await platform.application.patch(id, { ...app, status });
    } catch (err) {
      console.error(err);
      setErrors(err.message);
    }
  };

  const loadData = async () => {
    try {
      platform.application.getCount(filter);
      platform.application.get(filter);
    } catch (err) {
      console.log('Load error', err);
      setErrors(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [platform, filter]);

  return (
    <div className="application-list grid gap-4">
      {error && <div className="validation-error">{error}</div>}
      {applications && applications.count() > 0 ? (
        applications.map((app) => {
          const application = platform.application.findOne(app.get('_id'));

          return (
            <div
              key={application.get('_id')}
              className="application-preview card"
            >
              <div className="card-title">
                <h3>{application.get('name')}</h3>
                <div>
                  <TimeSince time={application.get('created')} />{' '}
                  <span className="tag">{application.get('status')}</span>
                </div>
              </div>
              <div className="card-body">
                {models.application.map(({ label, name }) => (
                  <div key={name} className="mb-2">
                    <p>
                      <i className="text-gray-500">{label}</i>
                      <br />
                      {application.get(name)}
                    </p>
                  </div>
                ))}
                {application.fields &&
                  Object.keys(application.fields).map((field) => (
                    <div key={field} className="mb-2">
                      <p>
                        <i className="text-gray-500">{field}</i>
                        <br />
                        {application.get(field)}
                      </p>
                    </div>
                  ))}
              </div>
              {application.get('status') === 'conversation' && (
                <div className="card-footer">
                  <i>
                    {__('application_list_conversation')}{' '}
                    <b>{application.get('name')}</b>?
                  </i>
                </div>
              )}
              <div className="card-footer flex flex-row justify-between items-center">
                {application.get('status') === 'open' ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      updateApplication(application.get('_id'), 'conversation');
                    }}
                    className="btn-primary mr-4"
                  >
                    {__('application_list_start_conversation')}
                  </button>
                ) : application.get('status') === 'conversation' ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      updateApplication(application.get('_id'), 'approved', {});
                    }}
                    className="btn-primary mr-4"
                  >
                    {__('application_list_approve')}
                  </button>
                ) : (
                  <span />
                )}
                {application.get('status') === 'rejected' && (
                  <a
                    className="text-red-400"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      updateApplication(application.get('_id'), 'open');
                    }}
                  >
                    {__('application_list_reopen')}
                  </a>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <p className="py-4">No applications.</p>
      )}

      <Pagination
        loadPage={(page) => {
          setPage(page);
          loadData();
        }}
        page={page}
        limit={limit}
        total={platform.application.findCount(filter)}
        items={platform.application.find(filter)}
      />
    </div>
  );
};
ApplicationList.defaultProps = {
  status: 'open',
  limit: 10,
};

export default ApplicationList;
