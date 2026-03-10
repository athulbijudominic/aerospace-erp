import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

const COLORS = ['#38bdf8', '#f59e0b', '#ef4444', '#22c55e'];

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: '#1e293b',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid #334155',
      flex: '1 1 140px',
      minWidth: '130px',
    }}>
      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: '700', color: color || '#e2e8f0' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard({ API, navigate, isMobile }) {  const [summary, setSummary] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/jobs/summary`),
      axios.get(`${API}/jobs/`)
    ]).then(([s, j]) => {
      setSummary(s.data);
      setJobs(j.data);
      setLoading(false);
    });
  }, [API]);

  if (loading) return <div style={{ color: '#64748b', padding: '40px' }}>Loading...</div>;

  const atRiskJobs = jobs.filter(j => j.is_at_risk).slice(0, 5);
  const pieData = [
    { name: 'In Progress', value: summary.in_progress },
    { name: 'Delayed', value: summary.delayed },
    { name: 'At Risk', value: summary.at_risk },
    { name: 'Shipped', value: summary.shipped },
  ];

  const customerData = {};
  jobs.forEach(j => {
    customerData[j.customer] = (customerData[j.customer] || 0) + 1;
  });
  const barData = Object.entries(customerData).map(([name, count]) => ({ name, count }));

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9' }}>Operations Dashboard</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Real-time manufacturing intelligence</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Total Jobs" value={summary.total} color="#38bdf8" />
        <StatCard label="In Progress" value={summary.in_progress} color="#f59e0b" />
        <StatCard label="Delayed" value={summary.delayed} color="#ef4444" sub="Needs attention" />
        <StatCard label="Shipped" value={summary.shipped} color="#22c55e" sub="This period" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        {/* Pie Chart */}
        <div style={{
          background: '#1e293b',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #334155',
          flex: '1 1 280px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#94a3b8' }}>Job Status Breakdown</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div style={{
          background: '#1e293b',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #334155',
          flex: '1 1 280px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#94a3b8' }}>Jobs by Customer</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <XAxis dataKey="name" stroke="#475569" fontSize={12} />
              <YAxis stroke="#475569" fontSize={12} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* At Risk Jobs */}
      <div style={{
        background: '#1e293b',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #334155',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#94a3b8' }}>
          ⚠️ Jobs At Risk — Due Soon
        </div>
        {atRiskJobs.length === 0 && <div style={{ color: '#475569' }}>No jobs at risk right now.</div>}
        {atRiskJobs.map(job => (
          <div
            key={job.id}
            onClick={() => navigate('job-detail', job)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              marginBottom: '8px',
              background: '#0f172a',
              borderRadius: '8px',
              cursor: 'pointer',
              border: '1px solid #ef444430',
            }}
          >
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{job.job_number} — {job.part_name}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{job.customer} · {job.current_operation}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#ef4444', fontWeight: '600', fontSize: '13px' }}>
                {job.days_until_due < 0 ? `${Math.abs(job.days_until_due)}d overdue` : `${job.days_until_due}d left`}
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{job.priority} priority</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
