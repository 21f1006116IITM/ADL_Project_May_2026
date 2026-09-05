import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "couple") return <Navigate to="/couple" replace />;
  if (user.role === "organizer") return <Navigate to="/organizer" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;

  return null;
}
