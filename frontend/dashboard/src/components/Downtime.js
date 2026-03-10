import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Downtime({ API }) {
  const [downtimes, setDowntimes] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/downtime/`),
      axios.get(`${API}/downtime/recurring`)
    ]).then(([d, r]) => {
      setDowntimes(d.data);
      setRecurring(r.data);
      setLoading(false);
    });
  }, [API]);

  if (loading) return <div style={{ color: '#64748b', padding: '40px' }}>Loading...</div>;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9' }}>Downtime & Error Log</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Machine errors, approvals and recurring issues</p>
      </div>

      {/* Recurring Issues Alert */}
      {recurring.length > 0 && (
        <div style={{
          background: '#ef444415',
          border: '1px solid #ef444440',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
        }}>
          <div style={{ fontWeight: '600', color: '#ef4444', marginBottom: '10px' }}>
            🔴 Recurring Machine Issues — Technician Required
          </div>
          {recurring.map((r, i) => (
            <div key={i} style={{ fontSize: '13px', color: '#fca5a5', marginBottom: '4px' }}>
              · {r.machine_id} — {r.part_number} — {r.reason}
            </div>
          ))}
        </div>
      )}

      {/* Downtime Table */}
      <div style={{
        background: '#1e293b',
        borderRadius: '12px',
        border: '1px solid #334155',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '0.8fr 1.5fr 1fr 0.8fr 0.8fr 0.8fr',
          padding: '12px 20px',
          background: '#0f172a',
          fontSize: '12px',
          color: '#475569',
          fontWeight: '600',
          letterSpacing: '0.05em',
        }}>
          <div>MACHINE</div>
          <div>REASON</div>
          <div>REPORTED BY</div>
          <div>DURATION</div>
          <div>APPROVED</div>
          <div>RECURRING</div>
        </div>

        {downtimes.map((d, i) => (
          <div key={d.id} style={{
            display: 'grid',
            gridTemplateColumns: '0.8fr 1.5fr 1fr 0.8fr 0.8fr 0.8fr',
            padding: '14px 20px',
            borderTop: '1px solid #334155',
            background: i % 2 === 0 ? '#1e293b' : '#182032',
            fontSize: '13px',
          }}>
            <div style={{ fontWeight: '600', color: '#38bdf8' }}>{d.machine_id || '—'}</div>
            <div style={{ color: '#94a3b8' }}>{d.reason}</div>
            <div style={{ color: '#94a3b8' }}>{d.reported_by_name || '—'}</div>
            <div style={{ color: '#f59e0b' }}>{Math.round(d.duration_minutes)} min</div>
            <div>
              <span style={{
                padding: '2px 8px',
                borderRadius: '20px',
                fontSize: '11px',
                background: d.is_approved ? '#22c55e20' : '#ef444420',
                color: d.is_approved ? '#22c55e' : '#ef4444',
              }}>
                {d.is_approved ? 'Yes' : 'Pending'}
              </span>
            </div>
            <div>
              <span style={{
                padding: '2px 8px',
                borderRadius: '20px',
                fontSize: '11px',
                background: d.is_recurring ? '#ef444420' : '#47556920',
                color: d.is_recurring ? '#ef4444' : '#475569',
              }}>
                {d.is_recurring ? '⚠ Yes' : 'No'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}