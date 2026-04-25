"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SUPABASE_CONFIG_ERROR_MESSAGE,
  SUPABASE_IS_CONFIGURED,
  supabase,
} from "./lib/supabaseClient";
import {
  checkUsernameAvailability,
  mapAuthErrorMessage,
  resolveLoginIdentifier,
} from "@/app/lib/supabase/auth";

export default function Home() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("register");
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!SUPABASE_IS_CONFIGURED) {
        setMessage(SUPABASE_CONFIG_ERROR_MESSAGE);
        return;
      }

      if (mode === "register") {
        const email = identifier.trim().toLowerCase();
        const cleanUsername = username.trim().toLowerCase();

        if (!email || !cleanUsername || !password || !confirmPassword) {
          setMessage("Tüm alanları doldur.");
          return;
        }

        if (password !== confirmPassword) {
          setMessage("Şifreler eşleşmiyor.");
          return;
        }

        const usernameAvailability = await checkUsernameAvailability(cleanUsername);

        if (!usernameAvailability.available) {
          setMessage(usernameAvailability.errorMessage);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: cleanUsername,
              display_name: cleanUsername,
              full_name: cleanUsername,
            },
          },
        });

        if (error) {
          setMessage(mapAuthErrorMessage(error));
          return;
        }

        setMessage(
          data.session
            ? "Kayıt başarılı. Şimdi giriş yapabilirsin."
            : "Kayıt başarılı. E-posta adresini doğruladıktan sonra giriş yapabilirsin."
        );
        setMode("login");
        setIdentifier(email);
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        return;
      }

      const input = identifier.trim().toLowerCase();

      if (!input || !password) {
        setMessage("Kullanıcı adı/e-posta ve şifre gerekli.");
        return;
      }

      const loginResolution = await resolveLoginIdentifier(input);

      if ("errorMessage" in loginResolution) {
        setMessage(loginResolution.errorMessage ?? "Giriş yapılamadı.");
        return;
      }

      const emailToLogin = loginResolution.email;

      const { error } = await supabase.auth.signInWithPassword({
        email: emailToLogin,
        password,
      });

      if (error) {
        setMessage(
          mapAuthErrorMessage(error, {
            invalidCredentialsMessage: "Şifre hatalı.",
          })
        );
        return;
      }

      setMessage("Giriş başarılı.");

      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <h1 className="text-3xl font-bold">Disiplin Paneli</h1>

        <p className="mt-2 text-sm text-slate-400">
          {mode === "register"
            ? "Kayıt olurken kullanıcı adı, e-posta ve şifre belirle."
            : "Kullanıcı adı veya e-posta ile giriş yap."}
        </p>

        <div className="mt-6 flex gap-2 rounded-xl bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setMessage("");
            }}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              mode === "register" ? "bg-slate-800 text-white" : "text-slate-400"
            }`}
          >
            Kayıt Ol
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              mode === "login" ? "bg-slate-800 text-white" : "text-slate-400"
            }`}
          >
            Giriş Yap
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "register" && (
            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Kullanıcı adı
              </label>
              <input
                type="text"
                placeholder="kullanıcıadı"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 outline-none"
                required
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              {mode === "register" ? "E-posta" : "Kullanıcı adı veya e-posta"}
            </label>
            <input
              type="text"
              placeholder={
                mode === "register"
                  ? "ornek@mail.com"
                  : "kullaniciadi veya ornek@mail.com"
              }
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Şifre</label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Şifren"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 pr-20 outline-none"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400"
              >
                {showPassword ? "Gizle" : "Göster"}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Şifreyi tekrar gir
              </label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Şifre tekrar"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 outline-none"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "İşleniyor..."
              : mode === "register"
              ? "Kayıt Ol"
              : "Giriş Yap"}
          </button>
        </form>

        {message && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
            {message}
          </div>
        )}
      </div>
    </main>
  );
}
