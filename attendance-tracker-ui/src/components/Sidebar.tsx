import {
  NavLink,
  useNavigate,
} from "react-router-dom";

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
    icon: "▦",
    end: true,
  },
  {
    label: "Attendance",
    path: "/attendance",
    icon: "◷",
  },
  {
    label: "Employees",
    path: "/employees",
    icon: "♙",
  },
  {
    label: "Departments",
    path: "/departments",
    icon: "▤",
  },
  {
    label: "Reports",
    path: "/reports",
    icon: "▥",
  },
];

function Sidebar() {
  const navigate = useNavigate();

  const user = getAuthUser();

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
      <div className="brand">
        <div className="brand-icon">
          A
        </div>

        <div>
          <h2>
            Attendance
          </h2>

          <span>
            Tracker System
          </span>
        </div>
      </div>

      <nav className="nav-menu">
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
                  ? "nav-item active"
                  : "nav-item"
              }
            >
              <span className="nav-icon">
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>
            </NavLink>
          )
        )}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user-avatar">
          {getInitial(
            user?.fullName ||
              user?.userName
          )}
        </div>

        <div className="sidebar-user-info">
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
        <span>
          ↪
        </span>

        Logout
      </button>

      <div className="sidebar-footer">
        <strong>
          Colour Plus
        </strong>

        <span>
          Printing Systems
        </span>
      </div>
    </aside>
  );
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