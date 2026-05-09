import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { LayoutDashboard, Users, CreditCard, Brain, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const adminLinks = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/influencers', icon: <Users size={18} />, label: 'Influencers' },
    { to: '/payments', icon: <CreditCard size={18} />, label: 'Payments' },
    { to: '/ai-insights', icon: <Brain size={18} />, label: 'AI Insights' },
  ];

  const influencerLinks = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'My Dashboard' },
    { to: '/payments', icon: <CreditCard size={18} />, label: 'My Payments' },
  ];

  const links = user?.role === 'influencer' ? influencerLinks : adminLinks;

  return (
    <div className="page-container">
      <button className="btn btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{ position: 'fixed', top: 12, left: 12, zIndex: 200, display: 'none' }}
        id="sidebar-toggle">
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="logo-dot" />
          <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AffluenceAI
          </span>
        </div>

        <div className="sidebar-section">Menu</div>
        <nav className="sidebar-nav">
          {links.map(link => (
            <NavLink key={link.to} to={link.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}>
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ width: '100%', justifyContent: 'flex-start' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content animate-fade">
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          #sidebar-toggle { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
