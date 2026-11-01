import React, { useState, useEffect } from 'react';
import {
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  X,
  KeyRound
} from 'lucide-react';
import { StarBorder } from '../components/ui/StarBorder';
import { api } from '../services/api';

interface ResetPasswordPageProps {
  token?: string | null;
  onNavigateLogin: () => void;
  onNavigateForgotPassword: () => void;
  onNavigateLanding: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  token: initialToken,
  onNavigateLogin,
  onNavigateForgotPassword,
  onNavigateLanding,
}) => {
  const [token, setToken] = useState<string>(initialToken || '');
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [emailMasked, setEmailMasked] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Read token from URL query parameters if not passed directly
  useEffect(() => {
    let activeToken = initialToken;
    if (!activeToken) {
      const params = new URLSearchParams(window.location.search);
      activeToken = params.get('token') || params.get('reset_token');
    }
    if (activeToken) {
      setToken(activeToken);
    }
  }, [initialToken]);

  // Verify token validity on token change
  useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      setTokenValid(false);
      setTokenError('No password reset token provided. Please use the link sent to your email.');
      return;
    }

    setIsVerifying(true);
    setTokenError(null);

    api.verifyResetToken(token)
      .then((res) => {
        setTokenValid(true);
        setEmailMasked(res.email_masked || null);
      })
      .catch((err: any) => {
        setTokenValid(false);
        setTokenError(
          err?.message ||
            'This password reset token is invalid, expired, or has already been used. Please request a new link.'
        );
      })
      .finally(() => {
        setIsVerifying(false);
      });
  }, [token]);

  // Password strength checks
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(newPassword);
  const isMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const strengthScore = [
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecial
  ].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    if (strengthScore < 5) {
      setError('Password must meet all 5 institutional security requirements.');
      return;
    }

    setIsLoading(true);

    try {
      await api.resetPassword(token, newPassword, confirmPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Unable to reset password. The token may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3ECE2] text-[#1E1915] flex flex-col justify-between p-6 selection:bg-[#A9502B]/20 selection:text-[#1E1915]">
      {/* Top Bar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={onNavigateLanding}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#5B5048] hover:text-[#A9502B] transition-colors focus:outline-none"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Public Overview
        </button>
        <div className="inline-flex items-center gap-2">
          <img
            src="/img/cit/cit-logo.png"
            alt="CIT Seal"
            className="h-5 w-5 rounded-full object-cover shrink-0"
          />
          <span className="text-xs font-mono text-[#5B5048] font-medium hidden sm:inline">
            Chilika Institute of Technology
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto w-full my-8">
        <div className="bg-[#FBF8F3] p-6 sm:p-8 rounded-2xl shadow-elevated border border-[#1E1915]/10 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-[#A9502B]/10 text-[#A9502B] flex items-center justify-center shrink-0 border border-[#A9502B]/20">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A9502B] font-mono">
                Secure Reset
              </span>
              <h1 className="text-xl font-serif font-bold text-[#1E1915] tracking-tight">
                Create New Password
              </h1>
              <p className="text-xs text-[#5B5048]">
                {emailMasked ? `Updating account for ${emailMasked}` : 'Enter your new institutional credentials'}
              </p>
            </div>
          </div>

          {/* Verification Loading State */}
          {isVerifying ? (
            <div className="p-8 text-center space-y-3">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#A9502B] border-t-transparent" />
              <p className="text-xs text-[#5B5048] font-mono">Validating cryptographic reset token...</p>
            </div>
          ) : success ? (
            /* Success State */
            <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-base text-emerald-900">Password Reset Complete</h3>
                <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                  Your password has been successfully updated with institutional PBKDF2 encryption. You can now sign in with your new credentials.
                </p>
              </div>
              <StarBorder
                as="button"
                onClick={onNavigateLogin}
                radius={9999}
                color="#C8693F"
                trailColor="#A9502B"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#A9502B] hover:bg-[#8F3F1E] text-[#F3ECE2] text-xs font-semibold uppercase tracking-wider transition-all"
              >
                <span>Sign In to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </StarBorder>
            </div>
          ) : tokenValid === false ? (
            /* Invalid/Expired Token Error */
            <div className="space-y-4 text-center py-2">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-rose-50 text-rose-700 border border-rose-200 mx-auto">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-base text-[#1E1915]">Invalid or Expired Link</h3>
                <p className="text-xs text-rose-700 leading-relaxed px-2">
                  {tokenError}
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onNavigateForgotPassword}
                  className="w-full py-2.5 rounded-xl bg-[#A9502B] hover:bg-[#8F3F1E] text-xs font-semibold text-[#F3ECE2] uppercase tracking-wider transition-all"
                >
                  Request a New Reset Link
                </button>
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="w-full py-2 rounded-xl text-xs text-[#5B5048] hover:text-[#1E1915] transition-colors"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          ) : (
            /* Reset Form */
            <>
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-[#5B5048] mb-1.5 uppercase tracking-wider font-mono">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-[#5B5048]/60 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#1E1915]/15 bg-[#FBF8F3] text-sm text-[#1E1915] focus:outline-none focus:ring-2 focus:ring-[#A9502B]/20 focus:border-[#A9502B] transition-all placeholder:text-[#5B5048]/50 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3 top-2.5 p-1 text-[#5B5048]/70 hover:text-[#1E1915] transition-colors focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-bold text-[#5B5048] mb-1.5 uppercase tracking-wider font-mono">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-[#5B5048]/60 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl border ${
                        confirmPassword && !isMatch
                          ? 'border-rose-400 focus:ring-rose-200'
                          : 'border-[#1E1915]/15 focus:ring-[#A9502B]/20 focus:border-[#A9502B]'
                      } bg-[#FBF8F3] text-sm text-[#1E1915] focus:outline-none focus:ring-2 transition-all placeholder:text-[#5B5048]/50 disabled:opacity-60`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                      className="absolute right-3 top-2.5 p-1 text-[#5B5048]/70 hover:text-[#1E1915] transition-colors focus:outline-none"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Meter */}
                {newPassword.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[#F3ECE2]/70 border border-[#1E1915]/10 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#5B5048]">Password Strength:</span>
                      <span
                        className={`font-bold ${
                          strengthScore === 5
                            ? 'text-emerald-700'
                            : strengthScore >= 3
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {strengthScore === 5 ? 'Strong' : strengthScore >= 3 ? 'Medium' : 'Weak'}
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-[#1E1915]/10 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full transition-all duration-300 ${
                          strengthScore === 5
                            ? 'bg-emerald-600 w-full'
                            : strengthScore >= 3
                            ? 'bg-amber-500 w-3/5'
                            : 'bg-rose-500 w-1/5'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[#5B5048] pt-1">
                      <span className={`inline-flex items-center gap-1 ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-[#5B5048]/70'}`}>
                        {hasMinLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} 8+ Characters
                      </span>
                      <span className={`inline-flex items-center gap-1 ${hasUpperCase ? 'text-emerald-700 font-semibold' : 'text-[#5B5048]/70'}`}>
                        {hasUpperCase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} Uppercase (A-Z)
                      </span>
                      <span className={`inline-flex items-center gap-1 ${hasLowerCase ? 'text-emerald-700 font-semibold' : 'text-[#5B5048]/70'}`}>
                        {hasLowerCase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} Lowercase (a-z)
                      </span>
                      <span className={`inline-flex items-center gap-1 ${hasNumber ? 'text-emerald-700 font-semibold' : 'text-[#5B5048]/70'}`}>
                        {hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} Number (0-9)
                      </span>
                      <span className={`inline-flex items-center gap-1 ${hasSpecial ? 'text-emerald-700 font-semibold' : 'text-[#5B5048]/70'}`}>
                        {hasSpecial ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} Special (!@#$)
                      </span>
                      {confirmPassword.length > 0 && (
                        <span className={`inline-flex items-center gap-1 ${isMatch ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}`}>
                          {isMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} Match
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <StarBorder
                  as="button"
                  type="submit"
                  disabled={isLoading}
                  radius={12}
                  color="#C8693F"
                  trailColor="#A9502B"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#A9502B] hover:bg-[#8F3F1E] text-[#F3ECE2] text-xs font-semibold shadow-md shadow-[#A9502B]/20 transition-all disabled:opacity-50 tracking-wide uppercase mt-2"
                >
                  {isLoading ? (
                    <span>Securing New Password...</span>
                  ) : (
                    <>
                      <span>Update Password</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </StarBorder>
              </form>

              <div className="pt-2 border-t border-[#1E1915]/10 text-center text-xs text-[#5B5048]">
                <span>Remembered your old password? </span>
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="font-bold text-[#A9502B] hover:text-[#8F3F1E] hover:underline transition-colors focus:outline-none"
                >
                  Back to Sign In
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto w-full text-center text-xs text-[#5B5048]">
        Campus Scheduling and Venue Management Platform &middot; Chilika Institute of Technology
      </div>
    </div>
  );
};

