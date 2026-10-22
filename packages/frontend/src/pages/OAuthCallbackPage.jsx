import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import API from "../api/axios";

const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    API.get("/auth/current-user")
      .then((response) => {
        login(response.data.data);
        navigate("/dashboard", { replace: true });
      })
      .catch(() => navigate("/login", { replace: true }));
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-secondary text-sm">Signing you in with Google...</p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
