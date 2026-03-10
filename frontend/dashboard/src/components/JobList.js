import React, { useEffect, useState } from 'react';
import axios from 'axios';

const statusColor = {
  in_progress: '#f59e0b',
  delayed: '#ef4444',
  completed: '#38bdf8',
  shipped: '#22c55e',
};

const priorityColor = {
  low: '#475569',
  normal: '#94a3b8',
  high: '#f59e0b',
  critical: '#ef4444',
};

export default function JobList({ API, navigate, isMobile }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`${API}/jobs/`).then(r => {
      setJobs(r.data);
      setLoading(false);
    });
  }, [API]);

  const filtered = jobs.filter(j => {
    const matchFilter = filter === 'all' || j.status === filter;
    const matchSearch = j.job_number.toLowerCase().includes(search.toLowerCase()) ||
      j.part_name.toLowerCase().includes(search.toLowerCase()) ||
      j.customer.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) return <div style={{ color: '#64748b', padding: '40px' }}>Loading...</div>;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9' }}>Job Orders</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>{jobs.length} total jobs</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          placeholder="Search job, part, customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '10px 14px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#e2e8f0',
            fontSize: '14px',
            width: '260px',
            outline: 'none',
          }}
        />
        {['all', 'in_progress', 'delayed', 'shipped'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '10px 16px',
              background: filter === f ? '#38bdf8' : '#1e293b',
              color: filter === f ? '#0f172a' : '#94a3b8',
              border: '1px solid #334155',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: filter === f ? '600' : '400',
            }}
          >
            {f.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Job Table - Desktop */}
      {!isMobile && (
        <div style={{
          background: '#1e293b',
          borderRadius: '12px',
          border: '1px solid #334155',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr 1fr 0.8fr',
            padding: '12px 20px',
            background: '#0f172a',
            fontSize: '12px',
            color: '#475569',
            fontWeight: '600',
            letterSpacing: '0.05em',
          }}>
            <div>JOB NUMBER</div>
            <div>PART</div>
            <div>CUSTOMER</div>
            <div>CURRENT OP</div>
            <div>DUE DATE</div>
            <div>STATUS</div>
            <div>PRIORITY</div>
          </div>

          {filtered.map((job, i) => (
            <div
              key={job.id}
              onClick={() => navigate('job-detail', job)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr 1fr 0.8fr',
                padding: '14px 20px',
                borderTop: '1px solid #334155',
                cursor: 'pointer',
                background: i % 2 === 0 ? '#1e293b' : '#182032',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#263348'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#1e293b' : '#182032'}
            >
              <div style={{ fontWeight: '600', fontSize: '14px', color: '#38bdf8' }}>{job.job_number}</div>
              <div>
                <div style={{ fontSize: '13px' }}>{job.part_name}</div>
                <div style={{ fontSize: '11px', color: '#475569' }}>{job.part_number}</div>
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>{job.customer}</div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>{job.current_operation}</div>
              <div>
                <div style={{ fontSize: '13px' }}>
                  {job.due_date ? new Date(job.due_date).toLocaleDateString() : '—'}
                </div>
                {job.is_at_risk && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px' }}>⚠ At Risk</div>
                )}
              </div>
              <div>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '600',
                  background: `${statusColor[job.status]}20`,
                  color: statusColor[job.status],
                }}>
                  {job.status.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '600',
                  background: `${priorityColor[job.priority]}20`,
                  color: priorityColor[job.priority],
                }}>
                  {job.priority}
                </span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>
              No jobs found matching your search.
            </div>
          )}
        </div>
      )}

      {/* Job Cards - Mobile */}
      {isMobile && (
        <div>
          {filtered.map(job => (
            <div
              key={job.id}
              onClick={() => navigate('job-detail', job)}
              style={{
                background: '#1e293b',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '10px',
                border: job.is_at_risk ? '1px solid #ef444440' : '1px solid #334155',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontWeight: '700', color: '#38bdf8', fontSize: '14px' }}>{job.job_number}</div>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '600',
                  background: `${statusColor[job.status]}20`,
                  color: statusColor[job.status],
                }}>
                  {job.status.replace('_', ' ')}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: '#f1f5f9', marginBottom: '4px' }}>{job.part_name}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                {job.customer} · {job.current_operation}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: '#475569' }}>
                  Due: {job.due_date ? new Date(job.due_date).toLocaleDateString() : '—'}
                </div>
                {job.is_at_risk && (
                  <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '600' }}>⚠ At Risk</div>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>
              No jobs found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}   