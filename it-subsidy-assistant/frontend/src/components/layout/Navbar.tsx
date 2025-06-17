import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Home, Search, Heart, FileText, LogOut, User } from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'ダッシュボード' },
    { path: '/search', icon: Search, label: '補助金検索' },
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
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">IT</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              補助金アシスト
            </span>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center text-sm text-gray-600 dark:text-gray-300">
              <User className="w-4 h-4 mr-1" />
              <span>{user?.name || user?.email}</span>
            </div>
            <Button
              onClick={handleLogout}
              variant="secondary"
              size="sm"
              className="flex items-center"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span className="hidden md:inline">ログアウト</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-2">
          <div className="flex justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};