import React, { useEffect, useState } from 'react';
import axios from 'axios';

function ShippingTarget({ data }) {
  const pct = Math.min(data.confidence_pct, 100);
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      border: `1px solid ${data.on_track ? '#22c55e60' : '#ef444460'}`,
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#64748b', letterSpacing: '0.1em', marginBottom: '6px' }}>
            AI — SHIPPING TARGET PREDICTION
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: data.on_track ? '#22c55e' : '#ef4444' }}>
            {data.on_track ? '✅ On Track to Hit Target' : '🚨 At Risk of Missing Target'}
          </div>
        </div>
        <div style={{
          background: data.on_track ? '#22c55e20' : '#ef444420',
          border: `1px solid ${data.on_track ? '#22c55e40' : '#ef444440'}`,
          borderRadius: '12px',
          padding: '12px 20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', fontWeight: '800', color: data.on_track ? '#22c55e' : '#ef4444' }}>
            {pct}%
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Confidence</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
          <span>Current: ${data.current_shipped_value.toLocaleString()}</span>
          <span>Target: ${data.target.toLocaleString()}</span>
        </div>
        <div style={{ background: '#0f172a', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min((data.current_shipped_value / data.target) * 100, 100)}%`,
            height: '100%',
            background: data.on_track ? '#22c55e' : '#ef4444',
            borderRadius: '999px',
            transition: 'width 1s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', marginTop: '6px' }}>
          <span>Projected: ${data.projected_total_value.toLocaleString()}</span>
          <span>{data.days_remaining} days remaining this month</span>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {[
          { label: 'Shipped', value: data.shipped_count, color: '#22c55e' },
          { label: 'In Progress', value: data.in_progress_count, color: '#f59e0b' },
          { label: 'Delayed', value: data.delayed_count, color: '#ef4444' },
          { label: 'Jobs Needed', value: data.jobs_needed_to_close_gap, color: '#38bdf8' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1,
            background: '#0f172a',
            borderRadius: '10px',
            padding: '12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TruckAlerts({ data }) {
  if (data.length === 0) return null;
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      border: '1px solid #f59e0b60',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '20px',
    }}>
      <div style={{ fontSize: '12px', color: '#64748b', letterSpacing: '0.1em', marginBottom: '6px' }}>
        AI — TRUCK DISPATCH ALERTS
      </div>
      <div style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b', marginBottom: '16px' }}>
        🚛 {data.length} Shipment{data.length > 1 ? 's' : ''} Ready for Inter-Plant Transfer
      </div>

      {data.map((alert, i) => (
        <div key={i} style={{
          background: '#0f172a',
          borderRadius: '10px',
          padding: '14px 16px',
          marginBottom: '10px',
          border: alert.priority === 'critical' ? '1px solid #ef444440' : '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px', color: '#f1f5f9' }}>
              {alert.job_number} — {alert.part_name}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              {alert.completed_operation} complete → {alert.next_operation} needed
            </div>
            <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
              📍 {alert.from_plant} → {alert.to_plant}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '600',
              background: alert.priority === 'critical' ? '#ef444420' : '#f59e0b20',
              color: alert.priority === 'critical' ? '#ef4444' : '#f59e0b',
              marginBottom: '6px',
            }}>
              {alert.priority}
            </div>
            <div style={{ fontSize: '11px', color: '#475569' }}>
              Qty: {alert.quantity}
            </div>
            {alert.due_date && (
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                Due: {alert.due_date}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DelayRisks({ data }) {
  const high = data.filter(j => j.risk.level === 'critical' || j.risk.level === 'high').slice(0, 6);
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      border: '1px solid #ef444440',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '20px',
    }}>
      <div style={{ fontSize: '12px', color: '#64748b', letterSpacing: '0.1em', marginBottom: '6px' }}>
        AI — DELAY RISK ANALYSIS
      </div>
      <div style={{ fontSize: '18px', fontWeight: '700', color: '#ef4444', marginBottom: '16px' }}>
        🎯 High Risk Jobs — Action Required
      </div>

      {high.map((item, i) => (
        <div key={i} style={{
          background: '#0f172a',
          borderRadius: '10px',
          padding: '14px 16px',
          marginBottom: '10px',
          border: `1px solid ${item.risk.color}30`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', fontSize: '14px', color: '#f1f5f9' }}>
                {item.job_number} — {item.part_name}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{item.customer}</div>
              <div style={{ marginTop: '8px' }}>
                {item.risk.reasons.map((r, ri) => (
                  <div key={ri} style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>
                    · {r}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'right', marginLeft: '16px' }}>
              {/* Risk Score Circle */}
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: `${item.risk.color}20`,
                border: `2px solid ${item.risk.color}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: item.risk.color }}>
                  {item.risk.score}
                </div>
                <div style={{ fontSize: '9px', color: '#475569' }}>RISK</div>
              </div>
              {item.prediction.will_miss_due_date && (
                <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>
                  +{item.prediction.days_variance}d late
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function OvertimeRecs({ data }) {
  if (data.length === 0) return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      border: '1px solid #22c55e40',
      borderRadius: '16px',
      padding: '24px',
    }}>
      <div style={{ fontSize: '12px', color: '#64748b', letterSpacing: '0.1em', marginBottom: '6px' }}>
        AI — OVERTIME RECOMMENDATIONS
      </div>
      <div style={{ color: '#22c55e', fontWeight: '600' }}>✅ No overtime needed — all jobs on track</div>
    </div>
  );

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      border: '1px solid #a855f740',
      borderRadius: '16px',
      padding: '24px',
    }}>
      <div style={{ fontSize: '12px', color: '#64748b', letterSpacing: '0.1em', marginBottom: '6px' }}>
        AI — OVERTIME RECOMMENDATIONS
      </div>
      <div style={{ fontSize: '18px', fontWeight: '700', color: '#a855f7', marginBottom: '16px' }}>
        ⏰ {data.length} Job{data.length > 1 ? 's' : ''} Recommended for Overtime
      </div>

      {data.map((rec, i) => (
        <div key={i} style={{
          background: '#0f172a',
          borderRadius: '10px',
          padding: '14px 16px',
          marginBottom: '10px',
          border: '1px solid #a855f730',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px', color: '#f1f5f9' }}>
              {rec.job_number} — {rec.part_name}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              {rec.operation} · {rec.customer}
            </div>
            <div style={{ fontSize: '12px', color: '#a855f7', marginTop: '4px' }}>
              Suggested: {rec.suggested_overtime_hours}h overtime
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444' }}>
              {rec.days_behind}d
            </div>
            <div style={{ fontSize: '11px', color: '#475569' }}>behind schedule</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AIInsights({ API }) {
  const [shipping, setShipping] = useState(null);
  const [trucks, setTrucks] = useState([]);
  const [risks, setRisks] = useState([]);
  const [overtime, setOvertime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = () => {
    Promise.all([
      axios.get(`${API}/ai/shipping-target`),
      axios.get(`${API}/ai/truck-alerts`),
      axios.get(`${API}/ai/delay-risks`),
      axios.get(`${API}/ai/overtime-recommendations`),
    ]).then(([s, t, r, o]) => {
      setShipping(s.data);
      setTrucks(t.data);
      setRisks(r.data);
      setOvertime(o.data);
      setLoading(false);
      setLastUpdated(new Date().toLocaleTimeString());
    });
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000); // refresh every 30 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API]);

  if (loading) return <div style={{ color: '#64748b', padding: '40px' }}>Running AI analysis...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9' }}>AI Insights</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Real-time intelligence · Auto-refreshes every 30 seconds
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {lastUpdated && (
            <div style={{ fontSize: '12px', color: '#475569' }}>Last updated: {lastUpdated}</div>
          )}
          <button
            onClick={fetchAll}
            style={{
              padding: '8px 16px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <ShippingTarget data={shipping} />
      <TruckAlerts data={trucks} />
      <DelayRisks data={risks} />
      <OvertimeRecs data={overtime} />
    </div>
  );
}