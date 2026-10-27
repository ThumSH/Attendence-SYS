import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  hasValidSession,
} from "../services/authStorage";

function ProtectedRoute() {
  if (!hasValidSession()) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;