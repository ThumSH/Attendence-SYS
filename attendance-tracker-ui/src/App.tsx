import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import AttendancePage from "./pages/AttendancePage";
import DashboardPage from "./pages/DashboardPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import EmployeesPage from "./pages/EmployeesPage";
import LoginPage from "./pages/LoginPage";
import ReportsPage from "./pages/ReportsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          element={<ProtectedRoute />}
        >
          <Route
            element={<AppLayout />}
          >
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;