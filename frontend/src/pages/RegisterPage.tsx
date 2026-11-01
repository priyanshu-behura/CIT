import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  User as UserIcon,
  BookOpen,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { StarBorder } from '../components/ui/StarBorder';
import { api } from '../services/api';
import type { DepartmentItem } from '../types/dataset';

interface RegisterPageProps {
  onNavigateLogin: () => void;
  onNavigateLanding: () => void;
}

const DEFAULT_DEPARTMENTS: DepartmentItem[] = [
  { code: 'CSE', name: 'Computer Science & Engineering' },
  { code: 'ECE', name: 'Electronics & Communication Engineering' },
  { code: 'EE', name: 'Electrical Engineering' },
  { code: 'ME', name: 'Mechanical Engineering' },
  { code: 'CE', name: 'Civil Engineering' },
  { code: 'COMMON', name: 'First Year Common Engineering' },
  { code: 'HSS', name: 'Humanities & Social Sciences' },
  { code: 'MA', name: 'Mathematics' },
  { code: 'PH', name: 'Physics' },
];

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigateLogin,
  onNavigateLanding,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [departments, setDepartments] = useState<DepartmentItem[]>(DEFAULT_DEPARTMENTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load departments from backend if available
  useEffect(() => {
    api.getDepartments()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDepartments(data);
        }
      })
      .catch(() => {
        // Fall back to default departments
      });
  }, []);

  // Password strength checks
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
  const isMatch = password === confirmPassword && confirmPassword.length > 0;

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
    setSuccessMessage(null);

    // Client-side validations
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!department) {
      setError('Please select your academic department.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both password fields are identical.');
      return;
    }

    if (strengthScore < 5) {
      setError('Password must meet all 5 institutional security requirements.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        registration_no: registrationNo.trim() ? registrationNo.trim().toUpperCase() : undefined,
        department,
        password,
        confirm_password: confirmPassword,
      });

      setSuccessMessage(
        res.message || 'Account created successfully! You can now log in with your credentials.'
      );
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check your information and try again.');
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
      <div className="max-w-2xl mx-auto w-full my-8">
        <div className="bg-[#FBF8F3] p-6 sm:p-10 rounded-2xl shadow-elevated border border-[#1E1915]/10 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <img
              src="/img/cit/cit-logo.png"
              alt="CIT Emblem"
              className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover shadow-sm border border-[#1E1915]/10 shrink-0"
            />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A9502B] font-mono">
                Student Account Registration
              </span>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#1E1915] tracking-tight">
                Create Your CIT Account
              </h1>
              <p className="text-xs text-[#5B5048] mt-0.5">
                Join the Campus Scheduling & Venue Management Platform
              </p>
            </div>
          </div>

          {/* Success Banner */}
          {successMessage ? (
            <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-base text-emerald-900">Registration Complete</h3>
                <p className="text-xs text-emerald-700 max-w-md mx-auto">{successMessage}</p>
              </div>
              <StarBorder
                as="button"
                onClick={onNavigateLogin}
                radius={9999}
                color="#C8693F"
                trailColor="#A9502B"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#A9502B] hover:bg-[#8F3F1E] text-[#F3ECE2] text-xs font-semibold uppercase tracking-wider transition-all"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </StarBorder>
            </div>
          ) : (
            <>
              {/* Error Notice */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Role Security Note */}
              <div className="p-3.5 rounded-xl bg-[#243C50]/5 border border-[#243C50]/15 flex items-start gap-2.5 text-xs text-[#243C50]">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-[#243C50]" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Institutional Notice:</strong> Public self-registration assigns the restricted <strong>Student</strong> role. Faculty, Department Coordinator, and Administrative roles are provisioned exclusively through institutional appointment.
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-[#5B5048] mb-1.5 uppercase tracking-wider font-mono">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="h-4 w-4 text-[#5B5048]/60 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Priyanshu Behura"
                        disabled={isLoading}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#1E1915]/15 bg-[#FBF8F3] text-sm text-[#1E1915] focus:outline-none focus:ring-2 focus:ring-[#A9502B]/20 focus:border-[#A9502B] transition-all placeholder:text-[#5B5048]/50 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* Institutional Email */}
                  <div>
                    <label className="block text-xs font-bold text-[#5B5048] mb-1.5 uppercase tracking-wider font-mono">
                      Institutional Email *
                    </label>
                    <div className="relative">
                      <Mail className="h-4 w-4 text-[#5B5048]/60 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@cit.edu"
                        disabled={isLoading}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#1E1915]/15 bg-[#FBF8F3] text-sm text-[#1E1915] focus:outline-none focus:ring-2 focus:ring-[#A9502B]/20 focus:border-[#A9502B] transition-all font-mono placeholder:text-[#5B5048]/50 disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Registration Number */}
                  <div>
                    <label className="block text-xs font-bold text-[#5B5048] mb-1.5 uppercase tracking-wider font-mono">
                      Student Reg. No. <span className="text-[10px] text-[#5B5048]/70 lowercase">(optional)</span>
                    </label>
                    <div className="relative">
                      <GraduationCap className="h-4 w-4 text-[#5B5048]/60 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={registrationNo}
                        onChange={(e) => setRegistrationNo(e.target.value)}
                        placeholder="e.g. 2101289045"
                        disabled={isLoading}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#1E1915]/15 bg-[#FBF8F3] text-sm text-[#1E1915] focus:outline-none focus:ring-2 focus:ring-[#A9502B]/20 focus:border-[#A9502B] transition-all font-mono placeholder:text-[#5B5048]/50 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* Academic Department */}
                  <div>
                    <label className="block text-xs font-bold text-[#5B5048] mb-1.5 uppercase tracking-wider font-mono">
                      Academic Department *
                    </label>
                    <div className="relative">
                      <BookOpen className="h-4 w-4 text-[#5B5048]/60 absolute left-3.5 top-3.5 pointer-events-none" />
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        disabled={isLoading}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#1E1915]/15 bg-[#FBF8F3] text-sm text-[#1E1915] focus:outline-none focus:ring-2 focus:ring-[#A9502B]/20 focus:border-[#A9502B] transition-all disabled:opacity-60 cursor-pointer"
                      >
                        {departments.map((dept) => (
                          <option key={dept.code} value={dept.code}>
                            {dept.code} - {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-[#5B5048] mb-1.5 uppercase tracking-wider font-mono">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="h-4 w-4 text-[#5B5048]/60 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold text-[#5B5048] mb-1.5 uppercase tracking-wider font-mono">
                      Confirm Password *
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
                </div>

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[#F3ECE2]/70 border border-[#1E1915]/10 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#5B5048]">Security Policy Strength:</span>
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

                    {/* Progress Bar */}
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

                    {/* Checkmarks */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] text-[#5B5048] pt-1">
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
                          {isMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} Passwords Match
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
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
                    <span>Registering Account with CIT Registry...</span>
                  ) : (
                    <>
                      <span>Complete Student Registration</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </StarBorder>
              </form>

              {/* Already have an account link */}
              <div className="pt-4 border-t border-[#1E1915]/10 text-center text-xs text-[#5B5048]">
                <span>Already have a registered account? </span>
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="font-bold text-[#A9502B] hover:text-[#8F3F1E] hover:underline transition-colors focus:outline-none"
                >
                  Sign In to Dashboard
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

