import React, { useEffect, useState } from 'react';
import axios from 'axios';

const statusColor = {
  pending: '#475569',
  in_progress: '#f59e0b',
  completed: '#22c55e',
};

export default function JobDetail({ API, job, navigate }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/jobs/${job.id}`).then(r => {
      setDetail(r.data);
      setLoading(false);
    });
  }, [API, job]);

  if (loading) return <div style={{ color: '#64748b', padding: '40px' }}>Loading...</div>;

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate('jobs')}
        style={{
          background: 'transparent',
          border: '1px solid #334155',
          color: '#94a3b8',
          padding: '8px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '13px',
          marginBottom: '20px',
        }}
      >
        ← Back to Jobs
      </button>

      {/* Job Header */}
      <div style={{
        background: '#1e293b',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #334155',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#38bdf8' }}>{detail.job_number}</h1>
            <div style={{ fontSize: '16px', color: '#e2e8f0', marginTop: '4px' }}>{detail.part_name}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              {detail.part_number} · {detail.customer} · Qty: {detail.quantity}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Due Date</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#f1f5f9', marginTop: '2px' }}>
              {detail.due_date ? new Date(detail.due_date).toLocaleDateString() : '—'}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>Predicted Ship</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#f59e0b', marginTop: '2px' }}>
              {detail.predicted_ship_date ? new Date(detail.predicted_ship_date).toLocaleDateString() : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Operations Timeline */}
      <div style={{
        background: '#1e293b',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #334155',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8', marginBottom: '20px' }}>
          Operations Timeline
        </div>

        {detail.operations.map((op, i) => (
          <div key={op.id} style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            {/* Timeline dot */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: statusColor[op.status],
                marginTop: '4px',
                flexShrink: 0,
              }} />
              {i < detail.operations.length - 1 && (
                <div style={{ width: '2px', flex: 1, background: '#334155', marginTop: '4px' }} />
              )}
            </div>

            {/* Operation Card */}
            <div style={{
              flex: 1,
              background: '#0f172a',
              borderRadius: '8px',
              padding: '14px',
              border: `1px solid ${op.status === 'in_progress' ? '#f59e0b40' : '#334155'}`,
              marginBottom: '8px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{op.operation_name}</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                    Predicted: {op.predicted_time_minutes} min
                    {op.actual_time_minutes && ` · Actual: ${Math.round(op.actual_time_minutes)} min`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: `${statusColor[op.status]}20`,
                    color: statusColor[op.status],
                  }}>
                    {op.status.replace('_', ' ')}
                  </span>
                  {op.variance_minutes !== null && (
                    <div style={{
                      fontSize: '12px',
                      marginTop: '4px',
                      color: op.variance_minutes > 0 ? '#ef4444' : '#22c55e'
                    }}>
                      {op.variance_minutes > 0 ? `+${op.variance_minutes}` : op.variance_minutes} min variance
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}