import React, { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, KeyRound, Info } from 'lucide-react';
import { StarBorder } from '../components/ui/StarBorder';
import { api } from '../services/api';

interface ForgotPasswordPageProps {
  onNavigateLogin: () => void;
  onNavigateLanding: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onNavigateLogin,
  onNavigateLanding,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError(null);

    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid institutional email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.forgotPassword(email.trim().toLowerCase());
      setSubmitted(true);
      setConfirmationMessage(
        res.message ||
          'If an account with that email exists, we have sent a secure password reset link to your inbox.'
      );
    } catch (err: any) {
      setError(err?.message || 'Unable to process password reset request. Please try again.');
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
                Account Recovery
              </span>
              <h1 className="text-xl font-serif font-bold text-[#1E1915] tracking-tight">
                Reset Your Password
              </h1>
              <p className="text-xs text-[#5B5048]">
                We will send instructions to your institutional email
              </p>
            </div>
          </div>

          {submitted ? (
            /* Confirmation View */
            <div className="space-y-5 text-center pt-2">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mx-auto">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <div className="space-y-2">
                <h3 className="font-serif font-bold text-base text-[#1E1915]">
                  Check Your Inbox
                </h3>
                <p className="text-xs text-[#5B5048] leading-relaxed">
                  {confirmationMessage}
                </p>
                <p className="text-[11px] text-[#5B5048]/80 font-mono pt-1">
                  Single-use link valid for <strong>15 minutes</strong>.
                </p>
              </div>

              {/* Dev Notice */}
              <div className="p-3 rounded-xl bg-[#243C50]/5 border border-[#243C50]/15 text-left text-[11px] text-[#243C50] flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Development Mode Notice:</strong> If SMTP is not configured in local development, the reset link is printed to your backend server terminal log for instantaneous review.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="w-full py-2.5 rounded-xl border border-[#1E1915]/15 hover:bg-[#F3ECE2] text-xs font-semibold text-[#1E1915] transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Return to Sign In</span>
                </button>
              </div>
            </div>
          ) : (
            /* Form View */
            <>
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <p className="text-xs text-[#5B5048] leading-relaxed">
                Enter the email address registered with your CIT account. For privacy and security, we provide a neutral confirmation notice without disclosing whether an account is present.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#5B5048] mb-1.5 uppercase tracking-wider font-mono">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-[#5B5048]/60 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. user@cit.edu"
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#1E1915]/15 bg-[#FBF8F3] text-sm text-[#1E1915] focus:outline-none focus:ring-2 focus:ring-[#A9502B]/20 focus:border-[#A9502B] transition-all font-mono placeholder:text-[#5B5048]/50 disabled:opacity-60"
                    />
                  </div>
                </div>

                <StarBorder
                  as="button"
                  type="submit"
                  disabled={isLoading}
                  radius={12}
                  color="#C8693F"
                  trailColor="#A9502B"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#A9502B] hover:bg-[#8F3F1E] text-[#F3ECE2] text-xs font-semibold shadow-md shadow-[#A9502B]/20 transition-all disabled:opacity-50 tracking-wide uppercase"
                >
                  {isLoading ? (
                    <span>Initiating Secure Dispatch...</span>
                  ) : (
                    <>
                      <span>Send Password Reset Link</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </StarBorder>
              </form>

              <div className="pt-2 border-t border-[#1E1915]/10 text-center text-xs text-[#5B5048]">
                <span>Remember your password? </span>
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

