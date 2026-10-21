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

    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      <div className="flex min-h-18 items-center gap-3 px-4 sm:px-6">
        {/* Logo */}
        <div className="shrink-0">
          <img
            src="/webgetup-logo.png"
            alt="WebGetUp"
            className="h-auto w-40 object-contain sm:w-48"
          />
        </div>

        {/* Search */}
        <div className="flex flex-1 justify-center">
          <div className="relative w-full max-w-xl">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search..."
              className="
                h-11
                w-full
                rounded-full
                border
                border-slate-200
                bg-slate-100
                pl-11
                pr-4
                text-sm
                outline-none
                transition
                focus:border-blue-300
                focus:bg-white
                focus:ring-4
                focus:ring-blue-100
              "
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="
                relative
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                hover:bg-slate-100
              "
            >
              <Bell size={20} />

              {unreadCount > 0 && (
                <span
                  className="
                    absolute
                    right-0
                    top-0
                    flex
                    min-h-5
                    min-w-5
                    items-center
                    justify-center
                    rounded-full
                    bg-red-500
                    px-1
                    text-[10px]
                    font-bold
                    text-white
                  "
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className="
                  absolute
                  right-0
                  top-[calc(100%+10px)]
                  z-50
                  w-96
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  shadow-2xl
                "
              >
                <div className="flex items-center justify-between border-b px-4 py-4">
                  <h3 className="font-semibold">Notifications</h3>

                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications(false);
                      onViewAllNotifications?.();
                    }}
                    className="text-sm text-blue-600"
                  >
                    View All
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification._id}
                        className="border-b px-4 py-3"
                      >
                        <p className="font-medium text-slate-800">
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
                    <div className="p-6 text-center text-slate-500">
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
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="
                flex
                items-center
                gap-2
                rounded-full
                p-1
                hover:bg-slate-100
              "
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-full
                  bg-blue-600
                  font-bold
                  text-white
                "
              >
                {initials || <User size={18} />}
              </div>

              <ChevronDown size={16} className="text-slate-500" />
            </button>

            {showProfileMenu && (
              <div
                className="
                  absolute
                  right-0
                  top-[calc(100%+10px)]
                  z-50
                  w-64
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  shadow-2xl
                "
              >
                <div className="border-b px-4 py-4">
                  <p className="font-semibold text-slate-800">{fullName}</p>

                  <p className="text-sm text-slate-500">{email}</p>
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-3
                      text-red-600
                      hover:bg-red-50
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
