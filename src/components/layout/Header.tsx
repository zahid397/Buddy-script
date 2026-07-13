'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Bell, ChevronDown, Home, LogOut, MessageCircle, Search, Settings, UserRoundPlus, HelpCircle, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { useUnreadMessageCount } from '@/hooks/useMessages';
import { useMarkAllNotificationsRead, useNotifications, useUnreadNotificationCount } from '@/hooks/useNotifications';
import NotificationItem from '../common/NotificationItem';
import HeaderSearch from './HeaderSearch';

const NOT_IMPLEMENTED_MESSAGE = "This isn't part of the demo scope, but the UI is here for fidelity.";

function notImplemented() {
  toast(NOT_IMPLEMENTED_MESSAGE, { icon: '🚧' });
}

export default function Header() {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLLIElement>(null);

  useOnClickOutside(profileRef, () => setProfileOpen(false));
  useOnClickOutside(notifyRef, () => setNotifyOpen(false));

  const { data: unreadMessages } = useUnreadMessageCount();
  const messageBadge = unreadMessages?.count ?? 0;

  const { data: unreadNotifications } = useUnreadNotificationCount();
  const notificationBadge = unreadNotifications?.count ?? 0;
  const { data: notificationsData } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const notifications = notificationsData?.pages.flatMap((p) => p.items) ?? [];

  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}` : '';

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out');
    } catch {
      toast.error('Failed to log out');
    }
  };

  return (
    <>
      {/* Desktop nav */}
      <nav className="navbar navbar-expand-lg navbar-light _header_nav _padd_t10">
        <div className="container _custom_container">
          <div className="_logo_wrap">
            <Link className="navbar-brand" href="/feed">
              <Image src="/assets/js/images/logo.svg" alt="Buddy Script" width={140} height={32} className="_nav_logo" priority />
            </Link>
          </div>
          <div className="_header_form ms-auto d-none d-lg-flex">
            <HeaderSearch />
          </div>
          <ul className="navbar-nav mb-2 mb-lg-0 _header_nav_list ms-auto _mar_r8 d-none d-lg-flex flex-row">
            <li className="nav-item _header_nav_item">
              <Link className="nav-link _header_nav_link_active _header_nav_link" href="/feed" aria-label="Home">
                <Home size={19} color="#000" strokeWidth={1.5} />
              </Link>
            </li>
            <li className="nav-item _header_nav_item">
              <Link className="nav-link _header_nav_link" href="/notifications" aria-label="Friend requests">
                <UserRoundPlus size={19} color="#000" strokeWidth={1.5} />
              </Link>
            </li>
            <li className="nav-item _header_nav_item" ref={notifyRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="nav-link _header_nav_link _header_notify_btn"
                onClick={() => setNotifyOpen((v) => !v)}
                aria-label="Notifications"
              >
                <Bell size={19} color="#000" strokeWidth={1.5} />
                {notificationBadge > 0 ? <span className="_counting">{notificationBadge}</span> : null}
              </button>
              <div className={`_notification_dropdown${notifyOpen ? ' show' : ''}`}>
                <div className="_notifications_content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 className="_notifications_content_title">Notifications</h4>
                  {notificationBadge > 0 ? (
                    <button
                      type="button"
                      onClick={() => markAllRead.mutate()}
                      className="text-xs text-brand hover:underline"
                      style={{ marginRight: 24 }}
                    >
                      Mark all read
                    </button>
                  ) : null}
                </div>
                <div className="_notifications_all" style={{ maxHeight: 420, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <p className="_notification_para" style={{ padding: '16px 24px' }}>
                      No notifications yet.
                    </p>
                  ) : (
                    notifications
                      .slice(0, 10)
                      .map((n) => <NotificationItem key={n.id} notification={n} onNavigate={() => setNotifyOpen(false)} />)
                  )}
                  <Link
                    href="/notifications"
                    onClick={() => setNotifyOpen(false)}
                    className="block px-4 py-2 text-center text-xs text-brand hover:underline"
                  >
                    View all
                  </Link>
                </div>
              </div>
            </li>
            <li className="nav-item _header_nav_item">
              <Link className="nav-link _header_nav_link" href="/messages" aria-label="Messages">
                <MessageCircle size={19} color="#000" strokeWidth={1.5} />
                {messageBadge > 0 ? <span className="_counting">{messageBadge}</span> : null}
              </Link>
            </li>
          </ul>
          <div className="_header_nav_profile" ref={profileRef} style={{ position: 'relative' }}>
            <div className="_header_nav_profile_image">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.firstName} className="_nav_profile_img" />
              ) : (
                <span className="_nav_profile_img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1890FF', color: '#fff' }}>
                  {initials}
                </span>
              )}
            </div>
            <div className="_header_nav_dropdown">
              <p className="_header_nav_para">{user ? `${user.firstName} ${user.lastName}` : ''}</p>
              <button
                className="_header_nav_dropdown_btn _dropdown_toggle"
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                aria-label="Open profile menu"
              >
                <ChevronDown size={12} color="#112032" />
              </button>
            </div>
            <div className={`_nav_profile_dropdown _profile_dropdown${profileOpen ? ' show' : ''}`}>
              <div className="_nav_profile_dropdown_info">
                <div className="_nav_profile_dropdown_image">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.firstName} className="_nav_drop_img" />
                  ) : null}
                </div>
                <div className="_nav_profile_dropdown_info_txt">
                  <h4 className="_nav_dropdown_title">{user ? `${user.firstName} ${user.lastName}` : ''}</h4>
                  <Link href={user ? `/profile/${user.id}` : '#'} className="_nav_drop_profile" onClick={() => setProfileOpen(false)}>
                    View Profile
                  </Link>
                </div>
              </div>
              <hr />
              <ul className="_nav_dropdown_list">
                <li className="_nav_dropdown_list_item">
                  <button type="button" className="_nav_dropdown_link" onClick={notImplemented}>
                    <div className="_nav_drop_info">
                      <span><Settings size={16} color="#377DFF" /></span>
                      Settings
                    </div>
                  </button>
                </li>
                <li className="_nav_dropdown_list_item">
                  <button type="button" className="_nav_dropdown_link" onClick={notImplemented}>
                    <div className="_nav_drop_info">
                      <span><HelpCircle size={16} color="#377DFF" /></span>
                      Help &amp; Support
                    </div>
                  </button>
                </li>
                <li className="_nav_dropdown_list_item">
                  <button type="button" className="_nav_dropdown_link" onClick={handleLogout}>
                    <div className="_nav_drop_info">
                      <span><LogOut size={16} color="#377DFF" /></span>
                      Log Out
                    </div>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile top bar */}
      <div className="_header_mobile_menu">
        <div className="_header_mobile_menu_wrap">
          <div className="container">
            <div className="_header_mobile_menu_top_inner">
              <div className="_header_mobile_menu_logo">
                <Link href="/feed">
                  <Image src="/assets/js/images/logo.svg" alt="Buddy Script" width={120} height={28} className="_nav_logo" />
                </Link>
              </div>
              <div className="_header_mobile_menu_right">
                <button
                  type="button"
                  className="_header_mobile_search"
                  onClick={() => setMobileSearchOpen((v) => !v)}
                  aria-label="Search"
                >
                  <Search size={17} color="#666" />
                </button>
              </div>
            </div>
            {mobileSearchOpen ? (
              <div className="pb-3">
                <HeaderSearch mobile />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="_mobile_navigation_bottom_wrapper">
        <div className="_mobile_navigation_bottom_wrap">
          <div className="container">
            <ul className="_mobile_navigation_bottom_list">
              <li className="_mobile_navigation_bottom_item">
                <Link href="/feed" className="_mobile_navigation_bottom_link _mobile_navigation_bottom_link_active">
                  <Home size={22} color="#000" />
                </Link>
              </li>
              <li className="_mobile_navigation_bottom_item">
                <Link href="/notifications" className="_mobile_navigation_bottom_link" aria-label="Friend requests">
                  <UserRoundPlus size={22} color="#000" />
                </Link>
              </li>
              <li className="_mobile_navigation_bottom_item">
                <Link href="/notifications" className="_mobile_navigation_bottom_link" aria-label="Notifications">
                  <Bell size={22} color="#000" />
                  {notificationBadge > 0 ? <span className="_counting">{notificationBadge}</span> : null}
                </Link>
              </li>
              <li className="_mobile_navigation_bottom_item">
                <Link href="/messages" className="_mobile_navigation_bottom_link" aria-label="Messages">
                  <MessageCircle size={22} color="#000" />
                  {messageBadge > 0 ? <span className="_counting">{messageBadge}</span> : null}
                </Link>
              </li>
              <div className="_header_mobile_toggle">
                <button type="button" className="_header_mobile_btn_link" onClick={handleLogout} aria-label="Log out">
                  <Menu size={18} color="#666" />
                </button>
              </div>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
