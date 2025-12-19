import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Chrome } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelInput } from "@/components/ui/PixelInput";

/* ------------------ Validation ------------------ */

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const otpSchema = z.string().regex(/^\d{6}$/, "OTP must be 6 digits");

type AuthMode =
  | "login"
  | "signup"
  | "forgot"
  | "reset"
  | "otp"
  | "verify-otp";

/* ------------------ Component ------------------ */

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    signIn,
    signUp,
    signInWithGoogle,
    sendOtp,
    verifyOtp,
    resetPassword,
    updatePassword,
    resendVerification,
    isAuthenticated,
    loading,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ------------------ Effects ------------------ */

  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "reset") setMode("reset");
  }, [searchParams]);

  useEffect(() => {
    setErrors({});
  }, [mode]);


  /* ------------------ Validation ------------------ */

  const validate = () => {
    const e: Record<string, string> = {};

    if (mode !== "verify-otp" && mode !== "reset") {
      const r = emailSchema.safeParse(email);
      if (!r.success) e.email = r.error.errors[0].message;
    }

    if (["login", "signup", "reset"].includes(mode)) {
      const r = passwordSchema.safeParse(password);
      if (!r.success) e.password = r.error.errors[0].message;
    }

    if ((mode === "signup" || mode === "reset") && password !== confirmPassword) {
      e.confirm = "Passwords do not match";
    }

    if (mode === "verify-otp") {
      const r = otpSchema.safeParse(otpCode);
      if (!r.success) e.otp = r.error.errors[0].message;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ------------------ Submit ------------------ */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      switch (mode) {
        /* ---------- LOGIN ---------- */
        case "login": {
          const { error } = await signIn(email, password);
          if (error) {
            if (error.message.toLowerCase().includes("confirm")) {
              toast.error("Please verify your email before logging in.");
            } else {
              toast.error("Invalid email or password. Or create an account.");
            }
            return;
          }
          toast.success("Welcome back!");
          navigate("/");
          break;
        }

        /* ---------- SIGNUP ---------- */
        case "signup": {
          const { error } = await signUp(email, password);
          if (error) {
            toast.error(error.message);
            return;
          }
          toast.success("Account created! Check your email to verify.");
          setMode("login");
          break;
        }

        /* ---------- OTP LOGIN ---------- */
        case "otp": {
          const { error } = await sendOtp(email);
          if (error) {
            toast.error(error.message);
            return;
          }
          localStorage.setItem("otpEmail", email);
          toast.success("OTP sent to your email!");
          setMode("verify-otp");
          break;
        }

        case "verify-otp": {
          const savedEmail = email || localStorage.getItem("otpEmail") || "";
          const { error } = await verifyOtp(savedEmail, otpCode);
          if (error) {
            toast.error("Invalid or expired OTP");
            return;
          }
          localStorage.removeItem("otpEmail");
          toast.success("Logged in successfully!");
          break;
        }

        /* ---------- RESET PASSWORD ---------- */
        case "forgot": {
          const { error } = await resetPassword(email);
          if (error) {
            toast.error(error.message);
            return;
          }
          toast.success("Password reset link sent!");
          setMode("login");
          break;
        }

        case "reset": {
          const { error } = await updatePassword(password);
          if (error) {
            toast.error(error.message);
            return;
          }
          toast.success("Password updated!");
          navigate("/");
          break;
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ------------------ UI Helpers ------------------ */

  const titleMap: Record<AuthMode, string> = {
    login: "LOGIN",
    signup: "SIGN UP",
    forgot: "RESET PASSWORD",
    reset: "NEW PASSWORD",
    otp: "SIGN IN WITH OTP",
    "verify-otp": "VERIFY OTP",
  };

  const buttonMap: Record<AuthMode, string> = {
    login: "LOGIN",
    signup: "CREATE ACCOUNT",
    forgot: "SEND RESET LINK",
    reset: "UPDATE PASSWORD",
    otp: "SEND OTP",
    "verify-otp": "VERIFY",
  };

  /* ------------------ Render ------------------ */

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-pixel">
        LOADING...
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <PixelCard className="w-full max-w-md p-6 space-y-6">
        <h1 className="text-2xl font-pixel text-center">{titleMap[mode]}</h1>

        {(mode === "login" || mode === "signup") && (
          <PixelButton
            onClick={async () => {
              setIsSubmitting(true);
              try {
                const { error } = await signInWithGoogle();
                if (error) {
                  toast.error(error.message || "Failed to sign in with Google");
                }
              } catch (err) {
                toast.error("An error occurred while signing in with Google");
                console.error(err);
              } finally {
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <Chrome className="w-4 h-4" />
            CONTINUE WITH GOOGLE
          </PixelButton>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode !== "verify-otp" && mode !== "reset" && (
            <PixelInput
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}

          {["login", "signup", "reset"].includes(mode) && (
            <PixelInput
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}

          {(mode === "signup" || mode === "reset") && (
            <PixelInput
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          )}

          {mode === "verify-otp" && (
            <PixelInput
              placeholder="000000"
              value={otpCode}
              maxLength={6}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
          )}

          <PixelButton disabled={isSubmitting} className="w-full">
            {buttonMap[mode]}
          </PixelButton>
        </form>

        {mode === "login" && (
          <>
            <button onClick={() => setMode("forgot")}>Forgot password?</button>
            <button onClick={() => setMode("signup")}>Create account</button>
            <button
              onClick={async () => {
                const res = await resendVerification(email);
                if (res?.error) toast.error(res.error.message);
                else toast.success("Verification email resent!");
              }}
            >
              Resend verification email
            </button>
          </>
        )}

        {(mode === "forgot" || mode === "otp" || mode === "verify-otp") && (
          <button onClick={() => setMode("login")}>Back to login</button>
        )}

        <button onClick={() => navigate("/")}>← Continue as guest</button>
      </PixelCard>
    </div>
  );
}
