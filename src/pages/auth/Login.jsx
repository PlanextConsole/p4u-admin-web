import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/image/logo.png";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/api/client";

// External portals — override via Vite env if the deployed hosts differ.
const CUSTOMER_URL = import.meta.env.VITE_CUSTOMER_URL || "https://planext4u.com";
const VENDOR_URL = import.meta.env.VITE_VENDOR_URL || "https://vendor.planext4u.com";

const BRAND = "#0f9d94";
const BRAND_DARK = "#0c8f86";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isInitializing, isAuthenticated, login } = useAuth();

  useEffect(() => {
    if (!isInitializing && isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isInitializing, isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      let msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Sign in failed.";
      if (/<html[\s>]/i.test(msg) || /405 Not Allowed/i.test(msg)) {
        msg =
          "Login API misconfigured: admin web must call https://api.planext4u.com (set VITE_API_GATEWAY_URL and rebuild, or proxy /api on nginx).";
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    background: "#eef1fb",
    border: "1px solid transparent",
    borderRadius: 14,
    padding: "16px 18px",
    fontSize: 15,
    color: "#0f172a",
    outline: "none",
  };

  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background:
          "linear-gradient(135deg, #35c9bd 0%, #0f9d94 42%, #0b6b64 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
        }}
      >
        {/* Teal header */}
        <div
          style={{
            background: `linear-gradient(180deg, ${BRAND}, ${BRAND_DARK})`,
            padding: "34px 24px 30px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              margin: "0 auto 18px",
              background: "#fff",
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
            }}
          >
            <img
              src={logo}
              alt="Planext4u"
              style={{ width: 50, height: 50, objectFit: "contain" }}
            />
          </div>
          <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>
            Admin Portal
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.85)",
              margin: "8px 0 0",
              fontSize: 14,
            }}
          >
            Restricted access — Authorized personnel only
          </p>
        </div>

        {/* White body */}
        <div style={{ padding: "30px 30px 34px" }}>
          <form id="p4u-admin-login-form" onSubmit={handleLogin}>
            <input
              type="text"
              style={{ ...inputStyle, marginBottom: 16 }}
              placeholder="admin@planext4u.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />

            <div style={{ position: "relative", marginBottom: 22 }}>
              <input
                type={showPassword ? "text" : "password"}
                style={{ ...inputStyle, paddingRight: 48 }}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <span
                onClick={() => setShowPassword((s) => !s)}
                role="button"
                tabIndex={0}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") setShowPassword((s) => !s);
                }}
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#64748b",
                  display: "flex",
                }}
              >
                <Icon
                  icon={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"}
                  style={{ fontSize: 20 }}
                />
              </span>
            </div>

            {error && (
              <p
                style={{
                  color: "#dc2626",
                  fontSize: 13,
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                background: BRAND,
                color: "#fff",
                border: "none",
                borderRadius: 14,
                padding: "16px",
                fontSize: 16,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: submitting ? "default" : "pointer",
                opacity: submitting ? 0.75 : 1,
              }}
            >
              <Icon icon="mdi:login" style={{ fontSize: 20 }} />
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 18 }}>
            <a
              href={CUSTOMER_URL}
              style={{
                display: "block",
                color: BRAND,
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
                marginBottom: 8,
              }}
            >
              Customer Login →
            </a>
            <a
              href={VENDOR_URL}
              style={{
                display: "block",
                color: BRAND,
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Vendor Login →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
