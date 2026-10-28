import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, Search, User } from 'lucide-react';

const AdminNavbar = ({
  admin,
  searchValue = '',
  onSearchChange,
  notifications = [],
  onLogout,
  onViewAllNotifications,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }

      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fullName = admin?.name || 'Administrator';
  const email = admin?.email || 'No email available';

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
      <div className="flex min-h-19 w-full items-center gap-2 px-3 sm:gap-4 sm:px-5 lg:px-7">
        {/* WebGetUp logo */}
        <div className="w-28 shrink-0 min-[400px]:w-36.25 sm:w-45 lg:w-55">
          <img
            src="/webgetup-logo.png.png"
            alt="WebGetUp"
            className="block h-auto w-full object-contain"
          />
        </div>

        {/* Search bar */}
        <div className="flex min-w-0 flex-1 justify-center">
          <div className="relative w-full max-w-3xl">
            <Search
              size={19}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 sm:left-4"
            />

            <input
              type="text"
              aria-label="Search tasks"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search tasks..."
              className="
                h-10 w-full min-w-0 rounded-full
                border border-slate-200 bg-slate-100
                pl-9 pr-2 text-xs text-slate-700
                outline-none transition
                placeholder:text-slate-400
                focus:border-blue-300 focus:bg-white
                focus:ring-2 focus:ring-blue-100
                min-[400px]:text-sm
                sm:h-12 sm:pl-12 sm:pr-4 sm:text-base
              "
            />
          </div>
        </div>

        {/* Notifications and profile */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          {/* Notifications */}
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              aria-label={`Notifications: ${unreadCount} unread`}
              aria-expanded={showNotifications}
              onClick={() => {
                setShowNotifications((previous) => !previous);
                setShowProfileMenu(false);
              }}
              className="
                relative flex h-9 w-9 items-center justify-center
                rounded-full text-slate-600 hover:bg-slate-100
                sm:h-11 sm:w-11
              "
            >
              <Bell size={21} />

              {unreadCount > 0 && (
                <span
                  className="
                    absolute -right-0.5 -top-0.5
                    flex h-5 min-w-5 items-center justify-center
                    rounded-full bg-red-500 px-1
                    text-[10px] font-bold text-white
                  "
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className="
                  fixed left-3 right-3 top-21 z-60
                  overflow-hidden rounded-2xl border
                  border-slate-200 bg-white shadow-2xl
                  sm:absolute sm:left-auto sm:right-0
                  sm:top-[calc(100%+10px)] sm:w-96
                "
              >
                <div className="flex items-center justify-between border-b px-4 py-4">
                  <h3 className="font-semibold text-slate-800">
                    Notifications
                  </h3>

                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications(false);
                      onViewAllNotifications?.();
                    }}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View All
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification._id}
                        className={`border-b px-4 py-3 ${
                          !notification.isRead ? 'bg-blue-50/70' : ''
                        }`}
                      >
                        <p className="wrap-break-word text-sm font-medium text-slate-800">
                          {notification.message}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {notification.createdAt
                            ? new Date(notification.createdAt).toLocaleString()
                            : ''}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-sm text-slate-500">
                      No notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              aria-label="Open profile menu"
              aria-expanded={showProfileMenu}
              onClick={() => {
                setShowProfileMenu((previous) => !previous);
                setShowNotifications(false);
              }}
              className="
                flex items-center gap-1 rounded-full p-0.5
                hover:bg-slate-100 sm:gap-2 sm:p-1
              "
            >
              <div
                className="
                  flex h-9 w-9 items-center justify-center
                  rounded-full bg-blue-600 text-xs font-bold text-white
                  shadow-sm sm:h-11 sm:w-11 sm:text-sm
                "
              >
                {initials || <User size={18} />}
              </div>

              <ChevronDown
                size={15}
                className="hidden text-slate-500 min-[400px]:block"
              />
            </button>

            {showProfileMenu && (
              <div
                className="
                  fixed right-3 top-21 z-60 w-64
                  overflow-hidden rounded-2xl border
                  border-slate-200 bg-white shadow-2xl
                  sm:absolute sm:right-0 sm:top-[calc(100%+10px)]
                "
              >
                <div className="border-b px-4 py-4">
                  <p className="truncate font-semibold text-slate-800">
                    {fullName}
                  </p>
                  <p className="break-all text-sm text-slate-500">{email}</p>
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="
                      flex w-full items-center gap-3 rounded-xl
                      px-3 py-3 text-red-600 hover:bg-red-50
                    "
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
