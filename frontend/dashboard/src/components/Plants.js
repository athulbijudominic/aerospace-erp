import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Plants({ API, isMobile }) {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/plants/`).then(r => {
      setPlants(r.data);
      setLoading(false);
    });
  }, [API]);

  if (loading) return <div style={{ color: '#64748b', padding: '40px' }}>Loading...</div>;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9' }}>Plant Overview</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Live status across all 4 locations</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
        {plants.map(plant => (
          <div key={plant.id} style={{
            background: '#1e293b',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #334155',
          }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#38bdf8', marginBottom: '4px' }}>
              {plant.name}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              📍 {plant.location}
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{
                flex: 1,
                background: '#0f172a',
                borderRadius: '8px',
                padding: '14px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>{plant.active_jobs}</div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>Active Jobs</div>
              </div>
              <div style={{
                flex: 1,
                background: '#0f172a',
                borderRadius: '8px',
                padding: '14px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444' }}>{plant.delayed_jobs}</div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>Delayed Jobs</div>
              </div>
            </div>

            <div style={{
              marginTop: '16px',
              padding: '10px',
              background: '#0f172a',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#475569',
            }}>
              🌐 {plant.lat?.toFixed(4)}, {plant.lng?.toFixed(4)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}