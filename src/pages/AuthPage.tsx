import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { PixelButton } from '@/components/ui/PixelButton';
import { PixelCard } from '@/components/ui/PixelCard';
import { PixelInput } from '@/components/ui/PixelInput';
import { toast } from 'sonner';
import { Mail, KeyRound, Chrome } from 'lucide-react';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const otpSchema = z.string().length(6, 'OTP must be 6 digits');

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset' | 'otp' | 'verify-otp';

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
    isAuthenticated, 
    loading 
  } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string; otp?: string }>({});

  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'reset') {
      setMode('reset');
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/');
    }
  }, [isAuthenticated, loading, navigate]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    const currentMode = mode;

    if (currentMode !== 'reset' && currentMode !== 'verify-otp') {
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        newErrors.email = emailResult.error.errors[0].message;
      }
    }

    if (currentMode === 'login' || currentMode === 'signup' || currentMode === 'reset') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }

    if ((mode === 'signup' || mode === 'reset') && password !== confirmPassword) {
      newErrors.confirm = 'Passwords do not match';
    }

    if (mode === 'verify-otp') {
      const otpResult = otpSchema.safeParse(otpCode);
      if (!otpResult.success) {
        newErrors.otp = otpResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      let result;

      switch (mode) {
        case 'login':
          result = await signIn(email, password);
          if (result.error) {
            if (result.error.message.includes('Invalid login')) {
              toast.error('Invalid email or password');
            } else {
              toast.error(result.error.message);
            }
          } else {
            toast.success('Welcome back!');
            navigate('/');
          }
          break;

        case 'signup':
          result = await signUp(email, password);
          if (result.error) {
            if (result.error.message.includes('already registered')) {
              toast.error('This email is already registered. Try logging in.');
            } else {
              toast.error(result.error.message);
            }
          } else {
            toast.success('Account created! You can now play.');
            navigate('/');
          }
          break;

        case 'otp':
          result = await sendOtp(email);
          if (result.error) {
            toast.error(result.error.message);
          } else {
            toast.success('OTP sent to your email!');
            setMode('verify-otp');
          }
          break;

        case 'verify-otp':
          result = await verifyOtp(email, otpCode);
          if (result.error) {
            toast.error('Invalid or expired OTP');
          } else {
            toast.success('Verified! Welcome!');
            navigate('/');
          }
          break;

        case 'forgot':
          result = await resetPassword(email);
          if (result.error) {
            toast.error(result.error.message);
          } else {
            toast.success('Password reset email sent! Check your inbox.');
            setMode('login');
          }
          break;

        case 'reset':
          result = await updatePassword(password);
          if (result.error) {
            toast.error(result.error.message);
          } else {
            toast.success('Password updated successfully!');
            navigate('/');
          }
          break;
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        toast.error(result.error.message);
      }
    } catch (error) {
      toast.error('Failed to sign in with Google');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'LOGIN';
      case 'signup': return 'SIGN UP';
      case 'forgot': return 'RESET PASSWORD';
      case 'reset': return 'NEW PASSWORD';
      case 'otp': return 'SIGN IN WITH OTP';
      case 'verify-otp': return 'VERIFY OTP';
    }
  };

  const getSubmitText = () => {
    switch (mode) {
      case 'login': return 'LOGIN';
      case 'signup': return 'CREATE ACCOUNT';
      case 'forgot': return 'SEND RESET LINK';
      case 'reset': return 'UPDATE PASSWORD';
      case 'otp': return 'SEND OTP';
      case 'verify-otp': return 'VERIFY';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-xl font-pixel animate-pulse">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <PixelCard className="w-full max-w-md p-6 space-y-6">
        <h1 className="text-2xl font-pixel text-center text-primary">{getTitle()}</h1>
        
        {/* Google Sign In Button */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-border bg-card hover:bg-accent transition-colors font-pixel text-sm disabled:opacity-50"
            >
              <Chrome className="w-4 h-4" />
              CONTINUE WITH GOOGLE
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-card text-muted-foreground font-pixel">OR</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode !== 'reset' && mode !== 'verify-otp' && (
            <div className="space-y-2">
              <label className="block text-sm font-pixel text-muted-foreground">EMAIL</label>
              <PixelInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-xs text-destructive font-pixel">{errors.email}</p>
              )}
            </div>
          )}

          {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
            <div className="space-y-2">
              <label className="block text-sm font-pixel text-muted-foreground">PASSWORD</label>
              <PixelInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-xs text-destructive font-pixel">{errors.password}</p>
              )}
            </div>
          )}

          {(mode === 'signup' || mode === 'reset') && (
            <div className="space-y-2">
              <label className="block text-sm font-pixel text-muted-foreground">CONFIRM PASSWORD</label>
              <PixelInput
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
              />
              {errors.confirm && (
                <p className="text-xs text-destructive font-pixel">{errors.confirm}</p>
              )}
            </div>
          )}

          {mode === 'verify-otp' && (
            <div className="space-y-2">
              <label className="block text-sm font-pixel text-muted-foreground">ENTER 6-DIGIT CODE</label>
              <PixelInput
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                disabled={isSubmitting}
                maxLength={6}
                className="text-center tracking-widest text-lg"
              />
              {errors.otp && (
                <p className="text-xs text-destructive font-pixel">{errors.otp}</p>
              )}
              <p className="text-[8px] text-muted-foreground text-center">
                CODE SENT TO {email}
              </p>
            </div>
          )}

          <PixelButton
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'PLEASE WAIT...' : getSubmitText()}
          </PixelButton>
        </form>

        {/* Alternative Auth Methods */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setMode('otp')}
              className="flex items-center gap-1 text-[8px] font-pixel text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="w-3 h-3" />
              EMAIL OTP
            </button>
          </div>
        )}

        <div className="space-y-2 text-center">
          {mode === 'login' && (
            <>
              <button
                onClick={() => setMode('forgot')}
                className="text-sm font-pixel text-muted-foreground hover:text-primary transition-colors"
              >
                FORGOT PASSWORD?
              </button>
              <div className="text-sm font-pixel text-muted-foreground">
                NO ACCOUNT?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-primary hover:underline"
                >
                  SIGN UP
                </button>
              </div>
            </>
          )}

          {mode === 'signup' && (
            <div className="text-sm font-pixel text-muted-foreground">
              HAVE AN ACCOUNT?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-primary hover:underline"
              >
                LOGIN
              </button>
            </div>
          )}

          {(mode === 'forgot' || mode === 'otp') && (
            <button
              onClick={() => setMode('login')}
              className="text-sm font-pixel text-muted-foreground hover:text-primary transition-colors"
            >
              BACK TO LOGIN
            </button>
          )}

          {mode === 'verify-otp' && (
            <button
              onClick={() => {
                setOtpCode('');
                setMode('otp');
              }}
              className="text-sm font-pixel text-muted-foreground hover:text-primary transition-colors"
            >
              RESEND CODE
            </button>
          )}
        </div>

        <div className="pt-4 border-t border-border">
          <button
            onClick={() => navigate('/')}
            className="w-full text-center text-sm font-pixel text-muted-foreground hover:text-primary transition-colors"
          >
            ← CONTINUE AS GUEST
          </button>
        </div>
      </PixelCard>
    </div>
  );
}
