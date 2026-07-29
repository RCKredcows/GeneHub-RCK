import type React from 'react';
import { FiHome, FiUsers, FiDatabase, FiSettings, FiLogOut, FiX, FiDroplet, FiHeart, FiLayers, FiActivity } from 'react-icons/fi';
import { NavLink, useLocation } from 'react-router-dom';
import { signOut } from '../../../api';
import './styles.css';
import type { IconType } from 'react-icons';

interface NavigationItem {
  path: string;
  label: string;
  icon: IconType;
}

interface SidebarUser {
  email?: string;
  user_metadata?: {
    first_name?: string;
    full_name?: string;
    [key: string]: unknown;
  };
}

interface SidebarProps {
  user: SidebarUser | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onNavigate?: (path: string) => void;
}

export default function Sidebar({ user, isOpen, setIsOpen, onNavigate }: SidebarProps) {
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut({ scope: 'local' });
  };

  const handleNavClick = (path: string, e: React.MouseEvent) => {
    setIsOpen(false);
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  const navigationItems: NavigationItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/customers', label: 'Customers', icon: FiUsers },
    { path: '/sires', label: 'Sires', icon: FiDatabase },
    { path: '/tanks', label: 'Semen Tanks', icon: FiDroplet },
    { path: '/genetic-inventory', label: 'Genetic Inventory', icon: FiLayers },
    { path: '/medical-inventory', label: 'Medical Inventory', icon: FiHeart },
    { path: '/activity', label: 'Activity', icon: FiActivity },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="sidebar__overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__container">
          {/* Header */}
          <div className="sidebar__header">
            <h2 className="sidebar__logo">
              <span className="sidebar__logo-gene">Gene</span>Hub 🧬
            </h2>
            <button
              className="sidebar__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="sidebar__nav">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`}
                  onClick={(e) => handleNavClick(item.path, e)}
                >
                  <Icon className="sidebar__nav-icon" />
                  <span className="sidebar__nav-label">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="sidebar__footer">
            <NavLink
              to="/settings"
              className={`sidebar__nav-item ${location.pathname === '/settings' ? 'sidebar__nav-item--active' : ''}`}
              onClick={(e) => handleNavClick('/settings', e)}
            >
              <FiSettings className="sidebar__nav-icon" />
              <span className="sidebar__nav-label">Settings</span>
            </NavLink>

            <button className="sidebar__nav-item" onClick={handleSignOut}>
              <FiLogOut className="sidebar__nav-icon" />
              <span className="sidebar__nav-label">Sign Out</span>
            </button>

            {/* User Info */}
            <div className="sidebar__user">
              <div className="sidebar__user-avatar">
                {user?.user_metadata?.first_name?.[0] || user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="sidebar__user-info">
                <p className="sidebar__user-name">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="sidebar__user-email">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
