import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, updateUser, LanguageKey } from './services.db';

export type TranslationKey = keyof typeof translations['es'];

const translations = {
  es: {
    auth_register: 'Crear cuenta',
    auth_login: 'Iniciar sesión',
    auth_email: 'Correo electrónico',
    auth_username: 'Nombre de usuario',
    auth_password: 'Contraseña',
    auth_profile_image: 'Imagen de perfil (opcional)',
    auth_have_account: '¿Ya tienes cuenta?',
    auth_no_account: '¿No tienes cuenta?',
    auth_invalid_email: 'Correo electrónico inválido',
    auth_required: 'Este campo es obligatorio',
    auth_invalid_credentials: 'Credenciales inválidas',
    auth_email_exists: 'Ya existe una cuenta con este correo',
    dashboard_title: 'Life RPG System',
    dashboard_subtitle:
      'Misiones diarias, XP y disciplina para una vida estratégica.',
  },
  en: {
    auth_register: 'Create account',
    auth_login: 'Sign in',
    auth_email: 'Email',
    auth_username: 'Username',
    auth_password: 'Password',
    auth_profile_image: 'Profile image (optional)',
    auth_have_account: 'Already have an account?',
    auth_no_account: "Don't have an account?",
    auth_invalid_email: 'Invalid email address',
    auth_required: 'This field is required',
    auth_invalid_credentials: 'Invalid credentials',
    auth_email_exists: 'An account with this email already exists',
    dashboard_title: 'Life RPG System',
    dashboard_subtitle:
      'Daily missions, XP and discipline for a strategic life.',
  },
  zh: {
    auth_register: '创建账户',
    auth_login: '登录',
    auth_email: '邮箱',
    auth_username: '用户名',
    auth_password: '密码',
    auth_profile_image: '头像（可选）',
    auth_have_account: '已经有账户？',
    auth_no_account: '还没有账户？',
    auth_invalid_email: '邮箱格式无效',
    auth_required: '此字段为必填项',
    auth_invalid_credentials: '凭据无效',
    auth_email_exists: '该邮箱已注册',
    dashboard_title: 'Life RPG System',
    dashboard_subtitle: '以RPG方式管理你的日常与经验值。',
  },
  ja: {
    auth_register: 'アカウント作成',
    auth_login: 'ログイン',
    auth_email: 'メールアドレス',
    auth_username: 'ユーザー名',
    auth_password: 'パスワード',
    auth_profile_image: 'プロフィール画像（任意）',
    auth_have_account: 'すでにアカウントをお持ちですか？',
    auth_no_account: 'アカウントをお持ちでないですか？',
    auth_invalid_email: 'メールアドレスが無効です',
    auth_required: '必須項目です',
    auth_invalid_credentials: '認証情報が無効です',
    auth_email_exists: 'このメールアドレスは既に登録されています',
    dashboard_title: 'Life RPG System',
    dashboard_subtitle: 'RPGのように日常とXPを管理する。',
  },
  fr: {
    auth_register: 'Créer un compte',
    auth_login: 'Se connecter',
    auth_email: 'Email',
    auth_username: "Nom d'utilisateur",
    auth_password: 'Mot de passe',
    auth_profile_image: 'Photo de profil (optionnel)',
    auth_have_account: 'Vous avez déjà un compte ?',
    auth_no_account: "Vous n'avez pas de compte ?",
    auth_invalid_email: 'Adresse email invalide',
    auth_required: 'Champ obligatoire',
    auth_invalid_credentials: 'Identifiants invalides',
    auth_email_exists: 'Un compte existe déjà avec cet email',
    dashboard_title: 'Life RPG System',
    dashboard_subtitle:
      'Missions quotidiennes, XP et discipline pour une vie stratégique.',
  },
  de: {
    auth_register: 'Konto erstellen',
    auth_login: 'Anmelden',
    auth_email: 'E-Mail',
    auth_username: 'Benutzername',
    auth_password: 'Passwort',
    auth_profile_image: 'Profilbild (optional)',
    auth_have_account: 'Bereits ein Konto?',
    auth_no_account: 'Noch kein Konto?',
    auth_invalid_email: 'Ungültige E-Mail-Adresse',
    auth_required: 'Pflichtfeld',
    auth_invalid_credentials: 'Ungültige Anmeldedaten',
    auth_email_exists: 'Für diese E-Mail existiert bereits ein Konto',
    dashboard_title: 'Life RPG System',
    dashboard_subtitle:
      'Tägliche Missionen, XP und Disziplin für ein strategisches Leben.',
  },
  it: {
    auth_register: 'Crea account',
    auth_login: 'Accedi',
    auth_email: 'Email',
    auth_username: 'Nome utente',
    auth_password: 'Password',
    auth_profile_image: 'Immagine profilo (opzionale)',
    auth_have_account: 'Hai già un account?',
    auth_no_account: 'Non hai un account?',
    auth_invalid_email: 'Email non valida',
    auth_required: 'Campo obbligatorio',
    auth_invalid_credentials: 'Credenziali non valide',
    auth_email_exists: 'Esiste già un account con questa email',
    dashboard_title: 'Life RPG System',
    dashboard_subtitle:
      'Missioni giornaliere, XP e disciplina per una vita strategica.',
  },
  ar: {
    auth_register: 'إنشاء حساب',
    auth_login: 'تسجيل الدخول',
    auth_email: 'البريد الإلكتروني',
    auth_username: 'اسم المستخدم',
    auth_password: 'كلمة المرور',
    auth_profile_image: 'صورة الملف الشخصي (اختياري)',
    auth_have_account: 'هل لديك حساب مسبقاً؟',
    auth_no_account: 'ليس لديك حساب؟',
    auth_invalid_email: 'بريد إلكتروني غير صالح',
    auth_required: 'هذا الحقل مطلوب',
    auth_invalid_credentials: 'بيانات اعتماد غير صحيحة',
    auth_email_exists: 'يوجد حساب بالفعل بهذا البريد الإلكتروني',
    dashboard_title: 'Life RPG System',
    dashboard_subtitle: 'مهمات يومية، نقاط خبرة وانضباط لحياة إستراتيجية.',
  },
};

interface I18nContextValue {
  language: LanguageKey;
  t: (key: TranslationKey) => string;
  setLanguage: (lang: LanguageKey) => void;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = getCurrentUser();
  const [language, setLanguageState] = useState<LanguageKey>(user?.selectedLanguage ?? 'es');

  useEffect(() => {
    const current = getCurrentUser();
    if (current && current.selectedLanguage !== language) {
      updateUser(current.id, { selectedLanguage: language });
    }
  }, [language]);

  const setLanguage = (lang: LanguageKey) => {
    setLanguageState(lang);
  };

  const tFn = (key: TranslationKey) => {
    const pack = translations[language] ?? translations.es;
    return pack[key] ?? (translations.es as any)[key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ language, t: tFn, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
};
