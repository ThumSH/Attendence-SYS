import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";

import AttendancePage from "./pages/AttendancePage";
import DashboardPage from "./pages/DashboardPage";
import ReportsPage from "./pages/ReportsPage";
import EmployeesPage from "./pages/EmployeesPage";
import DepartmentsPage from "./pages/DepartmentsPage";

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />

        <Routes>
          <Route
            path="/"
            element={<DashboardPage />}
          />

          <Route
            path="/attendance"
            element={<AttendancePage />}
          />

          <Route
            path="/reports"
            element={<ReportsPage />}
          />
          <Route
            path="/employees"
            element={<EmployeesPage />}
          />
          <Route
            path="/departments"
            element={<DepartmentsPage />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;