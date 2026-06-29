import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  RefreshCw,
  X,
} from 'lucide-react';
import { authService } from '../services/api';

const PASSWORD_MIN_LENGTH = 6;

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const email = useMemo(() => searchParams.get('email') || '', [searchParams]);
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [resendDevLink, setResendDevLink] = useState('');
  const [error, setError] = useState('');
  const hasValidLink = Boolean(email && token);
  const passwordTouched = newPassword.length > 0;
  const confirmTouched = confirmPassword.length > 0;
  const passwordIsLongEnough = newPassword.length >= PASSWORD_MIN_LENGTH;
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit = hasValidLink && passwordIsLongEnough && passwordsMatch && !loading;
  const isSuccess = Boolean(message);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setResendMessage('');
    setResendDevLink('');

    if (!hasValidLink) {
      setError(t('login.invalidResetLink', { defaultValue: 'Invalid or expired reset link.' }));
      return;
    }

    if (!passwordIsLongEnough) {
      setError(t('login.passwordTooShort', { defaultValue: 'Use at least 6 characters.' }));
      return;
    }

    if (!passwordsMatch) {
      setError(t('login.passwordMismatch', { defaultValue: 'Passwords do not match.' }));
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword(email, token, newPassword);
      if (response.success) {
        setMessage(response.message || t('login.resetSuccess', { defaultValue: 'Password reset successfully. Sign in with your new password.' }));
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(response.message || t('login.invalidResetLink', { defaultValue: 'Invalid or expired reset link.' }));
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.message || t('login.invalidResetLink', { defaultValue: 'Invalid or expired reset link.' }));
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = async () => {
    if (!email) {
      setError(t('login.emailRequired', { defaultValue: 'Enter your email on the login page to request a new link.' }));
      return;
    }

    setError('');
    setResendMessage('');
    setResendDevLink('');
    setResendLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        setResendMessage(response.message || t('login.resetEmailSent', { defaultValue: 'If this email exists, we sent a password link.' }));
        setResendDevLink(response.resetUrl || '');
      } else {
        setError(response.message || t('login.resetEmailError', { defaultValue: 'We could not send the password link right now.' }));
      }
    } catch (err: any) {
      console.error('Resend password link error:', err);
      setError(
        err.code === 'ECONNABORTED'
          ? t('login.resetEmailTimeout', { defaultValue: 'The request took too long. Check the local API SMTP config and try again.' })
          : err.response?.data?.message || t('login.resetEmailError', { defaultValue: 'We could not send the password link right now.' }),
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <LockKeyhole size={28} />
              </div>
              <h2 className="mt-8 text-3xl font-extrabold leading-tight">
                {t('login.passwordAccessTitle', { defaultValue: 'Acesso por Google e senha' })}
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                {t('login.passwordAccessDescription', {
                  defaultValue: 'Se sua conta foi criada com Google, esse link cria uma senha para entrar tambem com email e senha. O login com Google continua funcionando.',
                })}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">
                {t('login.securityNoteTitle', { defaultValue: 'Nota de seguranca' })}
              </p>
              <p className="mt-2 leading-6">
                {t('login.securityNoteDescription', {
                  defaultValue: 'Use o link mais recente recebido por email. Links antigos podem expirar depois que voce pede outro.',
                })}
              </p>
            </div>
          </aside>

          <main className="p-6 sm:p-8 lg:p-10">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                {isSuccess ? <Check size={30} /> : <LockKeyhole size={30} />}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-600">
                  {t('login.accountSecurity', { defaultValue: 'Seguranca da conta' })}
                </p>
                <h1 className="mt-1 text-2xl font-extrabold text-gray-950">
                  {isSuccess
                    ? t('login.resetDoneTitle', { defaultValue: 'Senha criada com sucesso' })
                    : t('login.resetTitle', { defaultValue: 'Create a new password' })}
                </h1>
              </div>
            </div>

            {email && (
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                <Mail size={18} className="text-purple-600" />
                <span className="min-w-0 flex-1 truncate">{email}</span>
              </div>
            )}

            <p className="text-sm leading-6 text-gray-600">
              {hasValidLink
                ? t('login.resetDescription', { defaultValue: 'Enter a new password to get back into FlowSpeak.' })
                : t('login.invalidResetLink', { defaultValue: 'Invalid or expired reset link.' })}
            </p>

            {message && (
              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <div className="flex gap-3">
                  <Check size={18} className="mt-0.5 shrink-0" />
                  <span>{message}</span>
                </div>
                <Link
                  to="/login"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white hover:bg-emerald-700"
                >
                  {t('login.signInWithPassword', { defaultValue: 'Entrar com email e senha' })}
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="flex gap-3">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  <span className="min-w-0 flex-1">{error}</span>
                  <button type="button" onClick={() => setError('')} className="text-red-400 hover:text-red-700">
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {resendMessage && (
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                {resendMessage}
                {resendDevLink && (
                  <a href={resendDevLink} className="mt-2 block break-all font-bold underline">
                    {t('login.devResetLink', { defaultValue: 'Local test link' })}
                  </a>
                )}
              </div>
            )}

            {hasValidLink && !isSuccess && (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="new-password" className="mb-1 block text-sm font-semibold text-gray-800">
                    {t('login.newPassword', { defaultValue: 'New password' })}
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      required
                      minLength={PASSWORD_MIN_LENGTH}
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-gray-900 transition-all placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('login.newPasswordPlaceholder', { defaultValue: 'Enter your new password' })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      aria-label={showNewPassword
                        ? t('login.hidePassword', { defaultValue: 'Hide password' })
                        : t('login.showPassword', { defaultValue: 'Show password' })}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className={`mt-2 text-xs ${passwordTouched && !passwordIsLongEnough ? 'text-red-600' : 'text-gray-500'}`}>
                    {t('login.passwordRule', { defaultValue: 'Use at least 6 characters.' })}
                  </p>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="mb-1 block text-sm font-semibold text-gray-800">
                    {t('login.confirmPassword', { defaultValue: 'Confirm password' })}
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      minLength={PASSWORD_MIN_LENGTH}
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-gray-900 transition-all placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('login.confirmPasswordPlaceholder', { defaultValue: 'Enter the password again' })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      aria-label={showConfirmPassword
                        ? t('login.hidePassword', { defaultValue: 'Hide password' })
                        : t('login.showPassword', { defaultValue: 'Show password' })}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmTouched && !passwordsMatch && (
                    <p className="mt-2 text-xs text-red-600">
                      {t('login.passwordMismatch', { defaultValue: 'Passwords do not match.' })}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-3.5 font-bold text-white shadow-lg transition-all hover:from-blue-600 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? t('login.processing', { defaultValue: 'Processing...' })
                    : t('login.resetTitle', { defaultValue: 'Create a new password' })}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            )}

            {!isSuccess && (
              <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                <p className="font-semibold text-gray-900">
                  {t('login.needAnotherLink', { defaultValue: 'Precisa de outro link?' })}
                </p>
                <p className="mt-1 leading-6">
                  {t('login.needAnotherLinkDescription', {
                    defaultValue: 'Se o email demorou, expirou ou voce abriu um link antigo, peca um novo link de senha.',
                  })}
                </p>
                <button
                  type="button"
                  onClick={handleResendLink}
                  disabled={resendLoading || !email}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-bold text-purple-700 ring-1 ring-purple-200 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resendLoading ? <RefreshCw size={16} className="animate-spin" /> : <Mail size={16} />}
                  {resendLoading
                    ? t('login.sending', { defaultValue: 'Enviando...' })
                    : t('login.sendNewPasswordLink', { defaultValue: 'Enviar novo link' })}
                </button>
              </div>
            )}

            <Link
              to="/login"
              className="mt-6 block text-center text-sm font-bold text-blue-600 hover:text-blue-800"
            >
              {t('login.backToLogin', { defaultValue: 'Back to login' })}
            </Link>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
