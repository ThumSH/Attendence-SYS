import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          A
        </div>

        <div>
          <h2>Attendance</h2>
          <span>Tracker System</span>
        </div>
      </div>

      <nav className="nav-menu">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive
              ? "nav-item active"
              : "nav-item"
          }
        >
          <span>▦</span>
          Dashboard
        </NavLink>

        <NavLink
          to="/attendance"
          className={({ isActive }) =>
            isActive
              ? "nav-item active"
              : "nav-item"
          }
        >
          <span>◷</span>
          Attendance
        </NavLink>



        <NavLink
  to="/departments"
  className={({ isActive }) =>
    `nav-item ${
      isActive
        ? "active"
        : ""
    }`
  }
>
  <span>▦</span>
  Departments
</NavLink>

        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span>▤</span>
          Reports
        </NavLink>

            <NavLink
      to="/employees"
      className={({ isActive }) =>
        `nav-item ${
          isActive
            ? "active"
            : ""
        }`
      }
    >
      <span>👥</span>
      Employees
    </NavLink>
      </nav>

      <div className="sidebar-footer">
        Colour Plus Printing Systems
      </div>
    </aside>
  );
}

export default Sidebar;