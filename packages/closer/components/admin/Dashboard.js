import React, { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import dayjs from 'dayjs';

import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import PageNotAllowed from '../../pages/401';
import { theme } from '../../tailwind.config';
import api from '../../utils/api';
import Loading from '../Loading';

const metricsToPlot = ['user', 'ticket'];
const last30days = dayjs().subtract(30, 'days').format();
const metricFilter = { where: { created: { $gt: last30days } } };

const Dashboard = () => {
  const { platform } = usePlatform();
  const { user, isLoading } = useAuth();
  const [email, setInviteEmail] = useState('');
  const [error, setError] = useState(null);
  const [invite, setInvite] = useState(null);

  const inviteUser = async () => {
    try {
      setError(null);
      setInvite(null);
      const res = await api.post('/generate-invite', { email });
      if (res.data.invite_link) {
        setInvite(res.data.invite_link);
        setInviteEmail('');
      } else {
        throw new Error('No invite_url returned.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const loadData = async () => {
    await Promise.all(
      metricsToPlot.map((metric) => platform[metric].getGraph(metricFilter)),
    );
  };

  useEffect(() => {
    if (
      user &&
      (user.roles.includes('admin') || user.roles.includes('analyst'))
    ) {
      loadData();
    }
  }, [user]);

  if (isLoading) {
    return <Loading />;
  }
  if (!user || !user.roles.includes('admin')) {
    return <PageNotAllowed />;
  }

  return (
    <div className="admin-dashboard card">
      <div className="flex flex-row flex-wrap">
        {metricsToPlot.map((metric) => {
          const data = platform[metric].findGraph(metricFilter);
          if (!data) {
            return <h4 key={metric}>{metric} not found.</h4>;
          }
          const chartData = data.map((p) => ({
            time: p.get('time'),
            value: p.get('value'),
          })).toJS();

          return (
            <div key={metric} className="w-full md:w-1/2 p-2">
              <h4 className="text-center font-medium mb-2">{metric}s per day</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={theme.extend.colors.primary}
                    name={metric}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          inviteUser(email);
        }}
        className="mt-8 md:w-1/2"
      >
        {invite && (
          <div className="success-box">
            Invite link:
            <input value={invite} className="copy-box" disabled />
          </div>
        )}
        {error && <div className="error-box">{error}</div>}
        <div className="form-field">
          <label htmlFor="email">Get Invite Link</label>
          <input
            type="email"
            name="email"
            value={email}
            placeholder="name@awesomeproject.co"
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            className="bg-transparent"
          />
        </div>
        <div className="card-footer">
          <div className="action-row">
            <button type="submit" className="btn-primary">
              Generate link
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Dashboard;
