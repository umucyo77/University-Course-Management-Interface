import React, { useContext, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/authContext";

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payloadB64Url = parts[1];

  try {
    const payloadB64 = payloadB64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadB64.padEnd(
      payloadB64.length + ((4 - (payloadB64.length % 4)) % 4),
      "="
    );
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (loginData) =>
      axios.post(
        "https://student-management-system-backend.up.railway.app/api/auth/login",
        loginData,
        { headers: { "Content-Type": "application/json" } }
      ),
    onSuccess: (res) => {
      setErrorMessage("");
      const token = res?.data?.accessToken ?? res?.data?.data?.accessToken;
      const userFromResponse =
        res?.data?.user ?? res?.data?.data?.user ?? res?.data?.data;
      const userFromToken = decodeJwtPayload(token);
      const user = userFromResponse ?? userFromToken ?? null;

      if (token) {
        localStorage.setItem("accessToken", token);
      }

      if (user?.role === "SUPERVISOR") {
        login(user);
        navigate("/courses");
        return;
      }

      localStorage.removeItem("accessToken");
      setErrorMessage("Access denied: Not a Supervisor");
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.message ??
        "Login failed";
      setErrorMessage(message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    mutation.mutate({
      email: email.trim(),
      password,
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#eff6ff_35%,#f8fafc_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.15)] backdrop-blur">
        <section className="hidden w-1/2 flex-col justify-between bg-slate-900 px-10 py-12 text-white lg:flex">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
              University Supervisor Portal
            </p>
            <h1 className="text-4xl font-semibold leading-tight">
              Manage the course catalog from one professional workspace.
            </h1>
            <p className="max-w-md text-sm leading-7 text-slate-300">
              Authenticate first, then access a clean dashboard for creating,
              reviewing, updating, and deleting courses through the existing
              backend APIs.
            </p>
          </div>
        </section>

        <section className="flex w-full items-center justify-center px-6 py-10 sm:px-10 lg:w-1/2">
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
            <div className="space-y-2 text-center lg:text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
                Secure Login
              </p>
              <h2 className="text-3xl font-semibold text-slate-900">
                Supervisor access
              </h2>
              <p className="text-sm leading-6 text-slate-500">
                Use the provided supervisor account to enter the course
                management dashboard.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Logging in..." : "Login"}
            </button>

            {(mutation.isError || errorMessage) && (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errorMessage || "Login failed"}
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
