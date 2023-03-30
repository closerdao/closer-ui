import Link from 'next/link';

import React, { useEffect, useState } from 'react';

import api, { formatSearch } from '../utils/api';
import { __ } from '../utils/helpers';
import TimeSince from './TimeSince';

const TaskList = ({ channel, limit }) => {
  const [tasks, setTasks] = useState([]);
  const [error, setErrors] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const where = channel && {
          viewChannels: channel,
        };
        const params = {
          where: where && formatSearch(where),
          sort_by: '-created',
          limit,
        };
        const {
          data: { results },
        } = await api.get('/task', { params });
        setTasks(results);
      } catch (err) {
        console.log('Load error', err);
        setErrors(err.message);
      }
    };
    loadData();
  }, [channel, limit]);

  return (
    <section className="tasks">
      {error && <div className="validation-error">{error}</div>}
      <div className="card-body">
        <div className="tasks-list">
          {tasks && tasks.length > 0 ? (
            tasks.map((task) => (
              <Link
                key={task._id}
                as={`/tasks/${task.slug}`}
                href="/tasks/[slug]"
                className="task-preview card"
              >
                <span className="name">{task.title}</span>
                <br />
                {task.tags && task.tags.length > 0 && (
                  <div className="tags">
                    {task.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <TimeSince time={task.created} />
              </Link>
            ))
          ) : (
            <p>{__('task_list_empty_message')}</p>
          )}
        </div>
      </div>
    </section>
  );
};
TaskList.defaultProps = {
  limit: 12,
};

export default TaskList;
