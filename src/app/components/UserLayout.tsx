import React from 'react';
import { Link, useLocation, Outlet } from 'react-router';
import { LayoutDashboard, FileText, User, AlertOctagon, ShieldAlert, Menu, X, LogOut, DollarSign } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@/app/hooks/useAuth';
import { SessionExpiryWarning } from '@/app/components/SessionExpiryWarning';
import { transitions, hoverEffects, activeEffects, cx } from '@/app/utils/animations';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function UserLayout() {
  const location = useLocation();
  const { logout, extendSession, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
    { name: 'My Violations', path: '/user/violations', icon: AlertOctagon },
    { name: 'Payment History', path: '/user/payments', icon: DollarSign },
    { name: 'Activity Log', path: '/user/activity', icon: FileText },
    { name: 'Profile', path: '/user/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex font-sans">
      {/* Session Expiry Warning */}
      <SessionExpiryWarning onExtendSession={extendSession} onLogout={handleLogout} />
      
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 fixed h-full z-10 shadow-sm">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-blue-900 p-2 rounded-lg">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-slate-900">SafeRide</h1>
            <p className="text-xs text-slate-500">Citizen Portal</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg group border border-dashed",
                  transitions.default,
                  activeEffects.scale,
                  isActive 
                    ? "bg-blue-950/5 text-blue-900 border-blue-300 shadow-md shadow-blue-600/10" 
                    : cx(
                        "text-slate-500 border-slate-300",
                        hoverEffects.buttonGhost,
                        "hover:text-slate-800 hover:shadow-sm"
                      )
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5",
                  transitions.transform,
                  !isActive && "group-hover:scale-110"
                )} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className={cx(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 w-full border border-dashed border-slate-300",
              "hover:bg-red-50 hover:text-red-600",
              transitions.colors,
              activeEffects.scale
            )}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-2">
             <ShieldAlert className="w-6 h-6 text-blue-900" />
             <span className="font-bold text-slate-900">SafeRide</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </header>

        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 bg-slate-900 z-50 p-4">
             <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-slate-300",
                    transitions.colors,
                    activeEffects.scale,
                    location.pathname.startsWith(item.path)
                      ? "bg-blue-950/5 text-blue-900 border-blue-300" 
                      : "text-slate-500 hover:bg-slate-800 hover:text-slate-900"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
               <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className={cx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 w-full mt-4 border border-dashed border-slate-300",
                  "hover:bg-red-50 hover:text-red-600",
                  transitions.colors,
                  activeEffects.scale
                )}
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </nav>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}