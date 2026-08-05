import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../auth";
import { getApiErrorMessage } from "../../api";
import { ThemeSwitcher } from "../../components/theme/ThemeSwitcher";
import { staffRoles } from "../../types";
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ defaultValues: { rememberMe: false } });
  async function onSubmit(values) {
    try {
      const user = await login(values.email, values.password);
      if (values.rememberMe) {
        localStorage.setItem("carpedium-remember", "1");
      }
      toast.success(`Welcome back, ${user.full_name.split(" ")[0]}! \u{1F44B}`, { duration: 3000 });
      navigate(staffRoles.includes(user.role) ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }
  return <div
  className="relative grid min-h-screen place-items-center px-5 py-16 overflow-hidden"
  style={{
  background: `
    radial-gradient(circle at top left,
      rgba(6,182,212,0.15),
      transparent 35%),
    radial-gradient(circle at top right,
      rgba(59,130,246,0.15),
      transparent 35%),
    linear-gradient(
      180deg,
      #06122b 0%,
      #081730 50%,
      #0a1635 100%
    )
  `
}}
>
  {/* Hero Style Background */}
  <div className="absolute inset-0 -z-10">
    <div className="hero-blobs">

      <div
        className="hero-blob hero-blob-green animate-blob"
        style={{
          width: "450px",
          height: "450px",
          top: "10%",
          left: "-100px",
        }}
      />

      <div
        className="hero-blob hero-blob-cyan animate-blob animation-delay-2000"
        style={{
          width: "500px",
          height: "500px",
          top: "20%",
          right: "-150px",
        }}
      />

      <div
        className="hero-blob hero-blob-indigo animate-blob animation-delay-4000"
        style={{
          width: "400px",
          height: "400px",
          bottom: "-100px",
          left: "40%",
        }}
      />
    </div>

    {/* Base background */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(100deg, #f1f5f9 0%, #f7fafe 35%, #eef2f5 100%)",
      }}
    />
  </div>  {
    /* Background orbs */
  }
      <div className="pointer-events-none fixed left-1/4 top-1/4 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/25 blur-3xl animate-pulse" style={{ animationDuration: "6s" }} />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-pink-500/20 blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />

      <div className="absolute right-5 top-5">
        <ThemeSwitcher />
      </div>

      <motion.div
  className="glass-premium w-full max-w-sm rounded-[2rem] p-6"
  initial={{
    opacity: 0,
    scale: 0.4,
  }}
  animate={{
    opacity: 1,
    scale: 1,
  }}
  transition={{
    duration: 2,
    ease: [0.22, 1, 0.36, 1],
  }}
>
        {
    /* Logo */
  }
        <Link
    to="/"
    className="mb-10 block text-xl font-black tracking-tight transition hover:opacity-80 text-gradient"
  >
          Carpedium
        </Link>

        <h1 className="text-4xl font-black tracking-tight text-gradient">
          Welcome back
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          Sign in to manage your events and registrations.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-4">
          {
    /* Email */
  }
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Email address
            </label>
            <input
    id="login-email"
    className="input"
    type="email"
    placeholder="you@example.com"
    autoComplete="email"
    {...register("email", {
      required: "Email is required",
      pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" }
    })}
  />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
          </div>

          {
    /* Password */
  }
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Password
            </label>
            <div className="relative">
              <input
    id="login-password"
    className="input pr-12"
    type={showPass ? "text" : "password"}
    placeholder="••••••••"
    autoComplete="current-password"
    {...register("password", { required: "Password is required" })}
  />
              <button
    type="button"
    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 transition-colors hover:bg-white/[0.06] active:scale-95"
    onClick={() => setShowPass((s) => !s)}
    tabIndex={-1}
    aria-label={showPass ? "Hide password" : "Show password"}
  >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
          </div>

          {
    /* Remember me */
  }
          <label className="flex cursor-pointer items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            <input
    type="checkbox"
    className="h-4 w-4 rounded accent-pink-500"
    {...register("rememberMe")}
  />
            Remember me for 30 days
          </label>

          {
    /* Submit */
  }
          <button
    id="login-submit"
    type="submit"
    className="btn-primary mt-2 w-full"
    disabled={isSubmitting}
  >
            {isSubmitting ? <><Loader2 size={17} className="animate-spin" /> Signing in…</> : <>Sign In <ArrowRight size={17} /></>}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-pink-400 transition hover:opacity-80">
            Create account
          </Link>
        </p>
      </motion.div>
    </div>;
}