import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "./layout/AppLayout";

import AttendancePage from "./pages/AttendancePage";
import DashboardPage from "./pages/DashboardPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import EmployeesPage from "./pages/EmployeesPage";
import ReportsPage from "./pages/ReportsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==================================
            PUBLIC ROUTES
            Login will be added here later
            ================================== */}

        {/* ==================================
            APPLICATION ROUTES
            ================================== */}

        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={<DashboardPage />}
          />

          <Route
            path="/attendance"
            element={<AttendancePage />}
          />

          <Route
            path="/employees"
            element={<EmployeesPage />}
          />

          <Route
            path="/departments"
            element={<DepartmentsPage />}
          />

          <Route
            path="/reports"
            element={<ReportsPage />}
          />
        </Route>

        {/* ==================================
            FALLBACK
            ================================== */}

        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

function NotFoundPage() {
  return (
    <main className="main-content">
      <div className="app-not-found">
        <span>404</span>

        <h1>Page not found</h1>

        <p>
          The page you are trying to open
          does not exist.
        </p>

        <a href="/">
          Return to Dashboard
        </a>
      </div>
    </main>
  );
}

export default App;