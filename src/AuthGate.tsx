import React, { useState } from 'react';
import { getCurrentUser, LanguageKey } from './services.db';
import { loginUser, registerUser } from './services.auth';
import { useI18n } from './i18n';

const emailRegex = /.+@.+\..+/;

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const existing = getCurrentUser();
  const [user, setUser] = useState(existing);
  const [mode, setMode] = useState<'login' | 'register'>(existing ? 'login' : 'register');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [profileImage, setProfileImage] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const { t, language, setLanguage } = useI18n();

  if (user) {
    return <>{children}</>;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfileImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const doRegister = async () => {
    setError(null);
    if (!emailRegex.test(email)) {
      setError(t('auth_invalid_email'));
      return;
    }
    if (!username.trim() || !password) {
      setError(t('auth_required'));
      return;
    }
    try {
      const u = await registerUser({
        email: email.trim(),
        username: username.trim(),
        password,
        profileImage,
        language,
        theme: 'videoGame',
      });
      setUser(u);
    } catch (e: any) {
      if (e?.message === 'EMAIL_ALREADY_EXISTS') setError(t('auth_email_exists'));
      else setError('Error');
    }
  };

  const doLogin = async () => {
    setError(null);
    if (!emailRegex.test(email) || !password) {
      setError(t('auth_invalid_credentials'));
      return;
    }
    try {
      const u = await loginUser(email.trim(), password);
      setUser(u);
    } catch (e: any) {
      setError(t('auth_invalid_credentials'));
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Life RPG System</h1>
          <p>{mode === 'register' ? t('auth_register') : t('auth_login')}</p>
        </div>

        <div className="auth-lang-theme">
          <button
            type="button"
            className="btn-ghost change-language-btn"
            onClick={() => {
              // simple cycle through languages for now
              const order: LanguageKey[] = ['es', 'en', 'zh', 'ja', 'fr', 'de', 'it', 'ar'];
              const idx = order.indexOf(language);
              const next = order[(idx + 1) % order.length];
              setLanguage(next);
            }}
          >
            Change Language
          </button>
        </div>

        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === 'register') doRegister();
            else doLogin();
          }}
        >
          <label>
            {t('auth_email')}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {mode === 'register' && (
            <label>
              {t('auth_username')}
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
          )}
          <label>
            {t('auth_password')}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {mode === 'register' && (
            <label>
              {t('auth_profile_image')}
              <input type="file" accept="image/*" onChange={handleImageChange} />
            </label>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn-primary auth-submit">
            {mode === 'register' ? t('auth_register') : t('auth_login')}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'register' ? (
            <button
              type="button"
              className="btn-link"
              onClick={() => setMode('login')}
            >
              {t('auth_have_account')}
            </button>
          ) : (
            <button
              type="button"
              className="btn-link"
              onClick={() => setMode('register')}
            >
              {t('auth_no_account')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
