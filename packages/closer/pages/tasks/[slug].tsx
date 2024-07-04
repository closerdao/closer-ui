import Head from 'next/head';
import Link from 'next/link';

import { useState } from 'react';

import ProfilePhoto from '../../components/ProfilePhoto';
import Heading from '../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

interface Props {
  task: any;
  error?: string;
}

const Task = ({ task, error }: Props) => {
  const t = useTranslations();
  const [status, setStatus] = useState(task && task.status);
  const { user, isAuthenticated } = useAuth();
  const [usersById, setUsersById] = useState<any>({});
  const [applicants, setApplicants] = useState(task.applicants || []);
  if (user && user._id && !usersById[user._id]) {
    setUsersById({ ...usersById, [user._id]: user });
  }

  const apply = async (_id: string, application: any) => {
    try {
      const {
        data: { results: task },
      } = await api.post(`/apply/task/${_id}`, { application });
      setApplicants(task.applicants);
    } catch (err) {
      alert(`Could not apply: ${parseMessageFromError(err)}`);
    }
  };

  const updateStatus = async (_id: string, status: string) => {
    try {
      const {
        data: { results: task },
      } = await api.patch(`/task/${_id}`, { status });
      setStatus(task.status);
    } catch (err) {
      alert(`Could not update status: ${parseMessageFromError(err)}`);
    }
  };

  if (!task) {
    return <PageNotFound error={error} />;
  }

  return (
    <>
      <Head>
        <title>{task.title}</title>
        <meta name="description" content={task.description} />
        <meta property="og:type" content="task" />
      </Head>
      <main className="fullwidth task-page main-content intro">
        <div className="columns">
          <div className="col lg two-third">
            <div>
              <Heading>{task.title}</Heading>
              {error && <div className="validation-error">{error}</div>}
              <section>
                <div
                  dangerouslySetInnerHTML={{
                    __html: task.description,
                  }}
                />
              </section>
            </div>
          </div>
          <div className="col third">
            <div>
              <div className="card">
                {isAuthenticated && (
                  <section className="card-body">
                    <div className="action-row">
                      {user?._id === task.createdBy ? (
                        <div>
                          <Link
                            as={`/tasks/edit/${task.slug}`}
                            href="/tasks/edit/[slug]"
                          >
                            {t('tasks_slug_edit_task')}
                          </Link>
                          <select
                            value={status}
                            onChange={(e) =>
                              updateStatus(task._id, e.target.value)
                            }
                          >
                            <option value="opening">
                              {t('tasks_slug_open')}
                            </option>
                            <option value="completed">
                              {t('tasks_slug_completed')}
                            </option>
                            <option value="closed">
                              {t('tasks_slug_closed')}
                            </option>
                            <option value="draft">
                              {t('tasks_slug_draft')}
                            </option>
                          </select>
                        </div>
                      ) : applicants?.includes(user?._id) ? (
                        <p className="text-small">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              apply(task._id, !applicants?.includes(user?._id));
                            }}
                          >
                            {t('tasks_slug_cancel_application')}
                          </a>
                        </p>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            apply(task._id, !applicants?.includes(user?._id));
                          }}
                        >
                          {t('tasks_slug_apply')}
                        </button>
                      )}
                    </div>
                  </section>
                )}
                {task.tags && task.tags.length > 0 && (
                  <div className="tags">
                    {task.tags.map((tag: any) => (
                      <Link
                        key={tag}
                        as={`/search/${tag}`}
                        href="/search/[keyword]"
                        className="tag"
                      >
                        <span className="ellipsis">{tag}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {user &&
                  (user._id === task.createdBy ||
                    (task.team && user._id === task.team[0])) && (
                    <section className="applicants card-body">
                      <h3>{t('tasks_slug_applicants')}</h3>
                      <div className="user-list">
                        {applicants.length > 0
                          ? applicants.map(
                              (uid: string) =>
                                usersById[uid] && (
                                  <Link
                                    key={uid}
                                    as={`/members/${usersById[uid].slug}`}
                                    href="/members/[slug]"
                                    className="from user-preview"
                                  >
                                    <ProfilePhoto
                                      stack={false}
                                      size="sm"
                                      user={usersById[uid]}
                                    />
                                    <span className="name">
                                      {usersById[uid].screenname}
                                    </span>
                                  </Link>
                                ),
                            )
                          : 'No applicants yet'}
                      </div>
                    </section>
                  )}
                {task.rewards && task.rewards.length > 0 && (
                  <section className="rewards card-body">
                    <h3>{t('tasks_slug_reward')}</h3>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};
Task.getInitialProps = async (context: NextPageContext) => {
  try {
    const { query } = context;
    const [taskResponse, messages] = await Promise.all([
      api.get(`/task/${query.slug}`),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const task = taskResponse.data.results;
    return { task, messages };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default Task;
