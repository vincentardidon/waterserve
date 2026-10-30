"use client";
import {
  Droplets,
  ArrowUpRight,
  LogOut,
  Menu,
  X,
  Bell,
  Lock,
} from "lucide-react";
import { prototypeRequest } from "../../lib/prototype-store";
import type { WaterServeController } from "../../hooks/useWaterServe";
type Props = Pick<
  WaterServeController,
  | "page"
  | "user"
  | "setUser"
  | "menu"
  | "setMenu"
  | "setReports"
  | "navigateTo"
  | "performAction"
  | "nav"
  | "unread"
>;
export function SiteHeader({
  page,
  user,
  setUser,
  menu,
  setMenu,
  setReports,
  navigateTo,
  performAction,
  nav,
  unread,
}: Props) {
  return (
    <header>
      <div className="header-inner">
        <button
          className="brand"
          onClick={() => navigateTo(user ? "dashboard" : "home")}
        >
          <span className="brand-icon">
            <Droplets size={26} />
          </span>
          <span>
            Water<span className="brand-light">Serve</span>
            <small>CALBAYOG CITY WATER DISTRICT</small>
          </span>
        </button>
        <nav id="site-navigation" className={menu ? "open" : ""}>
          {nav.map(([p, label]) => (
            <button
              key={p}
              className={page === p ? "active" : ""}
              onClick={() => navigateTo(p)}
            >
              {label}
            </button>
          ))}
          {/* The desktop staff shortcut is hidden on phone-sized screens. */}
          {!user && (
            <button
              className="mobile-menu mobile-staff-link"
              style={{ alignItems: "center", gap: 8, padding: "13px 0" }}
              onClick={() => navigateTo("login")}
            >
              <Lock size={16} />
              Staff portal
            </button>
          )}
        </nav>
        <div className="header-actions">
          {!user ? (
            <>
              <button
                className="notification-button"
                aria-label="Notifications"
                onClick={() => navigateTo("notifications")}
              >
                <Bell size={19} />
                {unread > 0 && <i>{unread}</i>}
              </button>
              <button
                className="staff-link"
                onClick={() => navigateTo("login")}
              >
                <Lock size={14} />
                Staff portal
                <ArrowUpRight size={15} />
              </button>
            </>
          ) : (
            <>
              <span className="avatar">{user.name.charAt(0)}</span>
              <button
                className="logout"
                aria-label="Sign out"
                onClick={() =>
                  performAction(async () => {
                    await prototypeRequest("logout", {});
                    setUser(null);
                    setReports([]);
                    navigateTo("home");
                  })
                }
              >
                <LogOut size={18} />
              </button>
            </>
          )}
          <button
            className="mobile-menu"
            aria-label="Toggle navigation"
            aria-expanded={menu}
            aria-controls="site-navigation"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
