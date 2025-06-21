import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Home, Search, Heart, FileText, LogOut, User, BookOpen } from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'ダッシュボード' },
    { path: '/search', icon: Search, label: '補助金検索' },
    { path: '/guide', icon: BookOpen, label: '申請ガイド' },
    { path: '/favorites', icon: Heart, label: 'お気に入り' },
    { path: '/document/create', icon: FileText, label: '資料作成' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-container">
          {/* Logo */}
          <a 
            href="#"
            className="navbar-brand"
            onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
          >
            <div className="stat-card-icon" style={{ width: '40px', height: '40px', marginBottom: 0 }}>
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>IT</span>
            </div>
            <span>補助金アシスト</span>
          </a>

          {/* Navigation Items */}
          <nav className="hide-mobile">
            <ul className="navbar-nav">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); navigate(item.path); }}
                      className={`navbar-link ${
                        isActive(item.path) ? 'active' : ''
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" style={{ display: 'inline' }} />
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Menu */}
          <div className="navbar-nav">
            <span className="navbar-link hide-mobile">
              <User className="w-4 h-4 mr-1" style={{ display: 'inline' }} />
              {user?.name || user?.email}
            </span>
            <Button
              onClick={handleLogout}
              variant="secondary"
              size="sm"
            >
              <LogOut className="w-4 h-4 mr-1" style={{ display: 'inline' }} />
              <span className="hide-mobile">ログアウト</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="hide-desktop" style={{ borderTop: '1px solid var(--color-gray-200)', padding: 'var(--spacing-sm) 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.path}
                  href="#"
                  onClick={(e) => { e.preventDefault(); navigate(item.path); }}
                  className={`navbar-link ${
                    isActive(item.path) ? 'active' : ''
                  }`}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    fontSize: 'var(--font-size-xs)',
                    padding: 'var(--spacing-sm)'
                  }}
                >
                  <Icon style={{ width: '20px', height: '20px', marginBottom: '4px' }} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};