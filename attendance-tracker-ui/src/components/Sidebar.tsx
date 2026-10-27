import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import CompanyBrand from "./CompanyBrand";

import {
  clearAuthSession,
  getAuthUser,
} from "../services/authStorage";

interface NavigationItem {
  label: string;
  path: string;
  icon: string;
  end?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/",
    icon: "dashboard",
    end: true,
  },
  {
    label: "Attendance",
    path: "/attendance",
    icon: "attendance",
  },
  {
    label: "Employees",
    path: "/employees",
    icon: "employees",
  },
  {
    label: "Departments",
    path: "/departments",
    icon: "departments",
  },
  {
    label: "Reports",
    path: "/reports",
    icon: "reports",
  },
];

function Sidebar() {
  const navigate =
    useNavigate();

  const user =
    getAuthUser();

  function handleLogout() {
    clearAuthSession();

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <CompanyBrand
          subtitle="Attendance Tracker"
        />
      </div>

      <nav className="sidebar-navigation">
        <span className="sidebar-section-label">
          Navigation
        </span>

        <div className="sidebar-menu">
          {navigationItems.map(
            (item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({
                  isActive,
                }) =>
                  isActive
                    ? "sidebar-nav-item active"
                    : "sidebar-nav-item"
                }
              >
                <span className="sidebar-nav-icon">
                  <SidebarIcon
                    name={item.icon}
                  />
                </span>

                <span className="sidebar-nav-label">
                  {item.label}
                </span>
              </NavLink>
            )
          )}
        </div>
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">
            {getInitial(
              user?.fullName ||
                user?.userName
            )}
          </div>

          <div className="sidebar-user-details">
            <strong>
              {user?.fullName ||
                "System User"}
            </strong>

            <span>
              {user?.userName ||
                "admin"}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-logout"
          onClick={
            handleLogout
          }
        >
          <span className="sidebar-logout-icon">
            <SidebarIcon
              name="logout"
            />
          </span>

          <span>
            Logout
          </span>
        </button>

        <div className="sidebar-footer">
          <strong>
            Colour Plus
          </strong>

          <span>
            Printing Systems
          </span>
        </div>
      </div>
    </aside>
  );
}

function SidebarIcon({
  name,
}: {
  name: string;
}) {
  switch (name) {
    case "dashboard":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <rect
            x="4"
            y="4"
            width="6"
            height="6"
            rx="1"
          />

          <rect
            x="14"
            y="4"
            width="6"
            height="6"
            rx="1"
          />

          <rect
            x="4"
            y="14"
            width="6"
            height="6"
            rx="1"
          />

          <rect
            x="14"
            y="14"
            width="6"
            height="6"
            rx="1"
          />
        </svg>
      );

    case "attendance":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="8"
          />

          <path
            d="M12 7v5l3 2"
          />
        </svg>
      );

    case "employees":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="8"
            r="3"
          />

          <path
            d="M6.5 19c.6-3.3 2.5-5 5.5-5s4.9 1.7 5.5 5"
          />
        </svg>
      );

    case "departments":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <rect
            x="4"
            y="5"
            width="16"
            height="14"
            rx="2"
          />

          <path
            d="M8 9h8M8 13h8M8 17h5"
          />
        </svg>
      );

    case "reports":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M5 19V9M10 19V5M15 19v-7M20 19V8"
          />
        </svg>
      );

    case "logout":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4"
          />

          <path
            d="M14 8l4 4-4 4"
          />

          <path
            d="M18 12H9"
          />
        </svg>
      );

    default:
      return null;
  }
}

function getInitial(
  value?: string | null
) {
  if (!value?.trim()) {
    return "A";
  }

  return value
    .trim()
    .charAt(0)
    .toUpperCase();
}

export default Sidebar;