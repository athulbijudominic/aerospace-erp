import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import JobList from './components/JobList';
import JobDetail from './components/JobDetail';
import Plants from './components/Plants';
import Downtime from './components/Downtime';
import AIInsights from './components/AIInsights';
import OvertimeBidding from './components/OvertimeBidding';

const API = 'https://aerospace-erp-backend.onrender.com';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [selectedJob, setSelectedJob] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigate = (p, data = null) => {
    setPage(p);
    if (data) setSelectedJob(data);
    window.scrollTo(0, 0);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'jobs', label: 'Jobs', icon: '🔧' },
    { id: 'plants', label: 'Plants', icon: '🏭' },
    { id: 'downtime', label: 'Downtime', icon: '⚠️' },
    { id: 'ai', label: 'AI', icon: '🤖' },
    { id: 'overtime', label: 'Overtime', icon: '⏰' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar - Desktop only */}
      {!isMobile && (
        <div style={{
          width: '220px',
          background: '#1e293b',
          padding: '24px 0',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          borderRight: '1px solid #334155',
          zIndex: 100,
        }}>
          <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #334155' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>AEROSPACE ERP</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#38bdf8' }}>Intelligence</div>
          </div>

          <nav style={{ padding: '16px 0', flex: 1 }}>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: page === item.id ? '#0f172a' : 'transparent',
                  color: page === item.id ? '#38bdf8' : '#94a3b8',
                  border: 'none',
                  borderLeft: page === item.id ? '3px solid #38bdf8' : '3px solid transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: page === item.id ? '600' : '400',
                }}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>

          <div style={{ padding: '16px 20px', borderTop: '1px solid #334155', fontSize: '12px', color: '#475569' }}>
            Live Demo v1.0
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{
        marginLeft: isMobile ? '0' : '220px',
        flex: 1,
        padding: isMobile ? '16px 12px 80px' : '24px',
        minWidth: 0,
      }}>
        {/* Mobile Header */}
        {isMobile && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            paddingBottom: '16px',
            borderBottom: '1px solid #334155',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>AEROSPACE ERP</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#38bdf8' }}>Intelligence</div>
            </div>
            <div style={{ fontSize: '11px', color: '#475569' }}>Live Demo v1.0</div>
          </div>
        )}

        {page === 'dashboard' && <Dashboard API={API} navigate={navigate} isMobile={isMobile} />}
        {page === 'jobs' && <JobList API={API} navigate={navigate} isMobile={isMobile} />}
        {page === 'job-detail' && <JobDetail API={API} job={selectedJob} navigate={navigate} isMobile={isMobile} />}
        {page === 'plants' && <Plants API={API} isMobile={isMobile} />}
        {page === 'downtime' && <Downtime API={API} isMobile={isMobile} />}
        {page === 'ai' && <AIInsights API={API} isMobile={isMobile} />}
        {page === 'overtime' && <OvertimeBidding API={API} isMobile={isMobile} />}
      </div>

      {/* Bottom Nav - Mobile only */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#1e293b',
          borderTop: '1px solid #334155',
          display: 'flex',
          zIndex: 100,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              style={{
                flex: 1,
                padding: '10px 4px',
                background: 'transparent',
                border: 'none',
                borderTop: page === item.id ? '2px solid #38bdf8' : '2px solid transparent',
                color: page === item.id ? '#38bdf8' : '#475569',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: page === item.id ? '600' : '400' }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}