import { Navigate } from "react-router-dom";

const PrivateRoute = ({ authorized, redirectTo = "/Login", children }) => {
    return authorized ? children : <Navigate to={redirectTo} />;
  };

export default PrivateRoute;