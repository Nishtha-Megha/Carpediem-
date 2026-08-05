import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { ArrowRight, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../auth";
import { getApiErrorMessage } from "../../api";
import { ThemeSwitcher } from "../../components/theme/ThemeSwitcher";
function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: "Too short", color: "#ef4444" },
    { label: "Weak", color: "#f97316" },
    { label: "Fair", color: "#eab308" },
    { label: "Good", color: "#22c55e" },
    { label: "Strong", color: "#06b6d4" }
  ];
  return { level: score, ...levels[score] };
}
export default function SignupPage() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm();
  const pwValue = watch("password", "");
  const strength = passwordStrength(pwValue);
  async function onSubmit(values) {
    try {
      const user = await authRegister(
        values.fullName,
        values.email,
        values.password,
        values.confirmPassword
      );
      toast.success(`Account created! Welcome, ${user.full_name.split(" ")[0]}! \u{1F389}`, { duration: 3000 });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }
  return <div
    className="relative grid min-h-screen place-items-center px-5 py-16 overflow-hidden"
    style={{ background: "var(--bg-primary)" }}
  >
    {
      /* Orbs */
    }
    <div className="hero-blobs">
      <div
        className="hero-blob hero-blob-green animate-blob"
        style={{
          width: "450px",
          height: "450px",
          top: "5%",
          left: "-120px",
        }}
      />

      <div
        className="hero-blob hero-blob-cyan animate-blob animation-delay-2000"
        style={{
          width: "500px",
          height: "500px",
          top: "10%",
          right: "-150px",
        }}
      />

      <div
        className="hero-blob hero-blob-indigo animate-blob animation-delay-4000"
        style={{
          width: "420px",
          height: "420px",
          bottom: "-120px",
          left: "35%",
        }}
      />
    </div>
    <div className="absolute right-5 top-5">
      <ThemeSwitcher />
    </div>

    <motion.div
      className="glass-premium w-full max-w-md rounded-[2rem] p-6"
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
      <Link to="/" className="mb-10 block text-xl font-black tracking-tight transition hover:opacity-80 text-gradient">
        Carpedium
      </Link>

      <h1 className="text-4xl font-black tracking-tight text-gradient">
        Create account
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
        Join thousands of students managing their campus events.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-4">
        {
          /* Full Name */
        }
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Full name</label>
          <input
            id="signup-name"
            className="input"
            placeholder="Alex Johnson"
            autoComplete="name"
            {...register("fullName", {
              required: "Full name is required",
              minLength: { value: 2, message: "At least 2 characters" }
            })}
          />
          {errors.fullName && <p className="text-xs text-red-400">{errors.fullName.message}</p>}
        </div>

        {
          /* Email */
        }
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Email address</label>
          <input
            id="signup-email"
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
          <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Password</label>
          <div className="relative">
            <input
              id="signup-password"
              className="input pr-12"
              type={showPass ? "text" : "password"}
              placeholder="Min 8 characters"
              autoComplete="new-password"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 8, message: "Minimum 8 characters" }
              })}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 transition-colors hover:bg-white/[0.06] active:scale-95"
              onClick={() => setShowPass((s) => !s)}
              tabIndex={-1}
              aria-label="Toggle password visibility"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {
            /* Strength bar */
          }
          {pwValue && <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all"
                style={{ background: i <= strength.level ? strength.color : "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
              />)}
            </div>
            <p className="text-xs" style={{ color: strength.color }}>{strength.label}</p>
          </div>}
          {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
        </div>

        {
          /* Confirm Password */
        }
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Confirm password</label>
          <div className="relative">
            <input
              id="signup-confirm"
              className="input pr-12"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
              autoComplete="new-password"
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (val) => val === pwValue || "Passwords do not match"
              })}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 transition-colors hover:bg-white/[0.06] active:scale-95"
              onClick={() => setShowConfirm((s) => !s)}
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
        </div>

        <button
          id="signup-submit"
          type="submit"
          className="btn-primary mt-2 w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? <><Loader2 size={17} className="animate-spin" /> Creating account…</> : <><Check size={17} /> Create Account <ArrowRight size={17} /></>}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-blue-400 transition hover:opacity-80">
          Sign in
        </Link>
      </p>
    </motion.div>
  </div>;
}