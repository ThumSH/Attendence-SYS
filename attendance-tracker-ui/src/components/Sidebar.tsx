import {
  NavLink,
} from "react-router-dom";

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
  return (
    <aside className="sidebar">
      {/* =========================
          BRAND
          ========================= */}

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

      {/* =========================
          NAVIGATION
          ========================= */}

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

      {/* =========================
          FOOTER
          ========================= */}

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

export default Sidebar;