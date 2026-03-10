import React, { useEffect, useState } from 'react';
import axios from 'axios';

function PostCard({ post, API, onRefresh }) {
  const [showBids, setShowBids] = useState(false);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState([]);
  const [message, setMessage] = useState(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    axios.get(`${API}/jobs/`).then(() => {});
    // Get employees for bidding
    fetch(`${API}/plants/`)
      .then(r => r.json())
      .then(() => {});
  }, [API]);

  const loadBids = () => {
    axios.get(`${API}/ai/overtime-posts/${post.id}/bids`).then(r => {
      setBids(r.data);
      setShowBids(true);
    });
  };

  const submitBid = () => {
    if (!selectedEmployee || !bidAmount) {
      setMessage({ type: 'error', text: 'Please enter employee ID and bid amount' });
      return;
    }
    if (parseFloat(bidAmount) > post.base_bonus) {
      setMessage({ type: 'error', text: `Bid must be $${post.base_bonus} or less` });
      return;
    }
    axios.post(`${API}/ai/overtime-bids`, {
      post_id: post.id,
      employee_id: parseInt(selectedEmployee),
      bid_amount: parseFloat(bidAmount),
    }).then(r => {
      setMessage({ type: 'success', text: r.data.message });
      setBidAmount('');
      loadBids();
    }).catch(e => {
      setMessage({ type: 'error', text: e.response?.data?.detail || 'Error submitting bid' });
    });
  };

  const closePost = () => {
    setClosing(true);
    axios.post(`${API}/ai/overtime-posts/${post.id}/close`).then(r => {
      setMessage({ type: 'success', text: `Winner: ${r.data.winner} — $${r.data.final_bonus}` });
      onRefresh();
      setClosing(false);
    }).catch(e => {
      setMessage({ type: 'error', text: e.response?.data?.detail || 'Error closing post' });
      setClosing(false);
    });
  };

  const statusColor = {
    open: '#22c55e',
    closed: '#475569',
    cancelled: '#ef4444',
  };

  return (
    <div style={{
      background: '#1e293b',
      borderRadius: '14px',
      padding: '20px',
      marginBottom: '16px',
      border: `1px solid ${post.status === 'open' ? '#a855f740' : '#334155'}`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontWeight: '700', fontSize: '15px', color: '#f1f5f9' }}>
            {post.job_number} — {post.part_name}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
            {post.operation_name} · Posted by {post.posted_by_name}
          </div>
        </div>
        <span style={{
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: '700',
          background: `${statusColor[post.status]}20`,
          color: statusColor[post.status],
        }}>
          {post.status.toUpperCase()}
        </span>
      </div>

      {/* Details Row */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {[
          { label: 'Base Bonus', value: `$${post.base_bonus}`, color: '#a855f7' },
          { label: 'Hours', value: `${post.hours_required}h`, color: '#38bdf8' },
          { label: 'Date', value: new Date(post.date_required).toLocaleDateString(), color: '#f59e0b' },
          { label: 'Bids', value: post.bid_count, color: '#22c55e' },
          { label: 'Lowest Bid', value: post.lowest_bid ? `$${post.lowest_bid}` : '—', color: '#22c55e' },
        ].map(d => (
          <div key={d.label} style={{
            background: '#0f172a',
            borderRadius: '8px',
            padding: '8px 12px',
            flex: '1 1 80px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: d.color }}>{d.value}</div>
            <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>{d.label}</div>
          </div>
        ))}
      </div>

      {/* Winner Banner */}
      {post.status === 'closed' && post.winner_name && (
        <div style={{
          background: '#22c55e15',
          border: '1px solid #22c55e30',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '12px',
          fontSize: '13px',
          color: '#22c55e',
          fontWeight: '600',
        }}>
          🏆 Winner: {post.winner_name} — Final Bonus: ${post.final_bonus}
        </div>
      )}

      {/* Message */}
      {message && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '12px',
          fontSize: '13px',
          background: message.type === 'success' ? '#22c55e15' : '#ef444415',
          color: message.type === 'success' ? '#22c55e' : '#ef4444',
          border: `1px solid ${message.type === 'success' ? '#22c55e30' : '#ef444430'}`,
        }}>
          {message.text}
        </div>
      )}

      {/* Bid Form - only if open */}
      {post.status === 'open' && (
        <div style={{
          background: '#0f172a',
          borderRadius: '10px',
          padding: '14px',
          marginBottom: '12px',
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', fontWeight: '600' }}>
            SUBMIT A BID (max ${post.base_bonus})
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              placeholder="Employee ID (number)"
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value)}
              type="number"
              style={{
                flex: '1 1 120px',
                padding: '9px 12px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <input
              placeholder={`Bid $ (max $${post.base_bonus})`}
              value={bidAmount}
              onChange={e => setBidAmount(e.target.value)}
              type="number"
              style={{
                flex: '1 1 120px',
                padding: '9px 12px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              onClick={submitBid}
              style={{
                padding: '9px 18px',
                background: '#a855f7',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Bid
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={showBids ? () => setShowBids(false) : loadBids}
          style={{
            padding: '8px 14px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          {showBids ? 'Hide Bids' : `View Bids (${post.bid_count})`}
        </button>
        {post.status === 'open' && post.bid_count > 0 && (
          <button
            onClick={closePost}
            disabled={closing}
            style={{
              padding: '8px 14px',
              background: '#22c55e',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            {closing ? 'Closing...' : '🏆 Select Winner'}
          </button>
        )}
      </div>

      {/* Bids List */}
      {showBids && (
        <div style={{ marginTop: '12px' }}>
          {bids.length === 0 && (
            <div style={{ fontSize: '13px', color: '#475569', padding: '10px' }}>No bids yet.</div>
          )}
          {bids.map((bid, i) => (
            <div key={bid.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 12px',
              background: bid.is_winner ? '#22c55e10' : '#0f172a',
              borderRadius: '8px',
              marginBottom: '6px',
              border: bid.is_winner ? '1px solid #22c55e30' : '1px solid #334155',
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9' }}>
                  {i + 1}. {bid.employee_name}
                  {bid.is_winner && ' 🏆'}
                </div>
                <div style={{ fontSize: '11px', color: '#475569' }}>{bid.employee_code}</div>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: i === 0 ? '#22c55e' : '#94a3b8' }}>
                ${bid.bid_amount}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreatePostModal({ API, jobs, onClose, onCreated }) {
  const [form, setForm] = useState({
    job_id: '',
    operation_name: '',
    plant_id: '',
    posted_by: '1',
    date_required: '',
    hours_required: '',
    base_bonus: '',
    notes: '',
  });
  const [message, setMessage] = useState(null);

  const operations = ['CNC Machining', 'Lathe', 'Excello', 'Deburring', 'Inspection', 'Assembly'];

  const submit = () => {
    if (!form.job_id || !form.operation_name || !form.plant_id || !form.date_required || !form.hours_required || !form.base_bonus) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }
    axios.post(`${API}/ai/overtime-posts`, {
      ...form,
      job_id: parseInt(form.job_id),
      plant_id: parseInt(form.plant_id),
      posted_by: parseInt(form.posted_by),
      hours_required: parseFloat(form.hours_required),
      base_bonus: parseFloat(form.base_bonus),
    }).then(() => {
      onCreated();
      onClose();
    }).catch(e => {
      setMessage({ type: 'error', text: e.response?.data?.detail || 'Error creating post' });
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '13px',
    outline: 'none',
    marginBottom: '10px',
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: '#000000aa',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: '#1e293b',
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '480px',
        border: '1px solid #334155',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#f1f5f9', marginBottom: '20px' }}>
          ⏰ Post Overtime Request
        </div>

        {message && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '12px',
            fontSize: '13px',
            background: '#ef444415',
            color: '#ef4444',
            border: '1px solid #ef444430',
          }}>
            {message.text}
          </div>
        )}

        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>JOB ID</div>
        <select
          value={form.job_id}
          onChange={e => setForm({ ...form, job_id: e.target.value })}
          style={{ ...inputStyle, background: '#0f172a' }}
        >
          <option value="">Select a job...</option>
          {jobs.filter(j => j.status !== 'shipped').map(j => (
            <option key={j.id} value={j.id}>{j.job_number} — {j.part_name}</option>
          ))}
        </select>

        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>OPERATION</div>
        <select
          value={form.operation_name}
          onChange={e => setForm({ ...form, operation_name: e.target.value })}
          style={{ ...inputStyle, background: '#0f172a' }}
        >
          <option value="">Select operation...</option>
          {operations.map(op => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>

        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>PLANT ID (1-4)</div>
        <input
          type="number"
          placeholder="Plant ID"
          value={form.plant_id}
          onChange={e => setForm({ ...form, plant_id: e.target.value })}
          style={inputStyle}
        />

        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>DATE REQUIRED</div>
        <input
          type="date"
          value={form.date_required}
          onChange={e => setForm({ ...form, date_required: e.target.value })}
          style={inputStyle}
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>HOURS REQUIRED</div>
            <input
              type="number"
              placeholder="e.g. 4"
              value={form.hours_required}
              onChange={e => setForm({ ...form, hours_required: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>BASE BONUS ($)</div>
            <input
              type="number"
              placeholder="e.g. 100"
              value={form.base_bonus}
              onChange={e => setForm({ ...form, base_bonus: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>NOTES (optional)</div>
        <textarea
          placeholder="Any additional notes..."
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          style={{ ...inputStyle, height: '70px', resize: 'none' }}
        />

        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '11px',
              background: 'transparent',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            style={{
              flex: 1,
              padding: '11px',
              background: '#a855f7',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Post Overtime
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OvertimeBidding({ API, isMobile }) {
  const [posts, setPosts] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchData = () => {
    Promise.all([
      axios.get(`${API}/ai/overtime-posts`),
      axios.get(`${API}/jobs/`),
    ]).then(([p, j]) => {
      setPosts(p.data);
      setJobs(j.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [API]);

  const filtered = posts.filter(p => filter === 'all' || p.status === filter);

  if (loading) return <div style={{ color: '#64748b', padding: '40px' }}>Loading...</div>;

  return (
    <div>
      {showModal && (
        <CreatePostModal
          API={API}
          jobs={jobs}
          onClose={() => setShowModal(false)}
          onCreated={fetchData}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9' }}>Overtime Bidding</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Post overtime slots · Employees bid · Lowest wins
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 18px',
            background: '#a855f7',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontWeight: '700',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          + Post Overtime
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Posts', value: posts.length, color: '#38bdf8' },
          { label: 'Open', value: posts.filter(p => p.status === 'open').length, color: '#a855f7' },
          { label: 'Closed', value: posts.filter(p => p.status === 'closed').length, color: '#22c55e' },
          { label: 'Total Bids', value: posts.reduce((a, p) => a + p.bid_count, 0), color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{
            flex: '1 1 100px',
            background: '#1e293b',
            borderRadius: '10px',
            padding: '14px',
            border: '1px solid #334155',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '26px', fontWeight: '700', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['all', 'open', 'closed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              background: filter === f ? '#a855f7' : '#1e293b',
              color: filter === f ? 'white' : '#94a3b8',
              border: '1px solid #334155',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: filter === f ? '600' : '400',
            }}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Posts */}
      {filtered.length === 0 && (
        <div style={{
          background: '#1e293b',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          color: '#475569',
          border: '1px solid #334155',
        }}>
          No overtime posts yet. Click "+ Post Overtime" to create one.
        </div>
      )}

      {filtered.map(post => (
        <PostCard key={post.id} post={post} API={API} onRefresh={fetchData} />
      ))}
    </div>
  );
}