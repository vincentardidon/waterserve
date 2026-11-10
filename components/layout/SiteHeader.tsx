"use client";
import {
  Droplets,
  LogOut,
  Menu,
  X,
  UserRound,
} from "lucide-react";
import { waterServeRequest } from "../../lib/water-serve-api";
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
}: Props) {
  return (
    <header>
      <div className="header-inner">
        <button
          className="brand"
          onClick={() => navigateTo(user ? user.role === "customer" ? "myreports" : "dashboard" : "home")}
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
          {!user && (
            <button
              className="mobile-menu mobile-staff-link"
              style={{ alignItems: "center", gap: 8, padding: "13px 0" }}
              onClick={() => navigateTo("login")}
            >
              <UserRound size={16} />
              Sign in
            </button>
          )}
        </nav>
        <div className="header-actions">
          {!user ? (
            <button
              className="staff-link"
              onClick={() => navigateTo("login")}
            >
              <UserRound size={14} />
              Sign in
            </button>
          ) : (
            <>
              <span className="avatar">{user.name.charAt(0)}</span>
              <button
                className="logout"
                aria-label="Sign out"
                onClick={() =>
                  performAction(async () => {
                    await waterServeRequest("logout", {});
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
