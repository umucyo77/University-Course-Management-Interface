import { useContext } from "react";
import { AuthContext } from "./authContext";
import { Navigate } from "react-router-dom";

const ProtectedRoute=({children,role})=>{
    const {user, isAuthenticated}=useContext(AuthContext);

    if (!isAuthenticated || !user){
        return <Navigate to="/" replace />;  
      }
      if (role && user.role !== role){
        return <Navigate to="/" replace />
      }
      return children;

}

export default ProtectedRoute;
