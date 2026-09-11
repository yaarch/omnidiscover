export interface AdminSecurityConfig {
  adminEmail: string;
  adminPassword: string;
  adminPin: string;
  hideAdminFromPublic: boolean;
  sessionTimeoutHours: number;
}

const DEFAULT_SECURITY_CONFIG: AdminSecurityConfig = {
  adminEmail: 'admin',
  adminPassword: 'admin',
  adminPin: '2026123456789012345678901',
  hideAdminFromPublic: false,
  sessionTimeoutHours: 4,
};

const STORAGE_KEY_CONFIG = 'omni_admin_security_config';
const STORAGE_KEY_SESSION = 'omni_admin_active_session';

export interface AdminSession {
  email: string;
  authenticatedAt: string;
  expiresAt: string;
  token: string;
}

class AdminAuthService {
  private config: AdminSecurityConfig;
  private listeners: (() => void)[] = [];

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AdminSecurityConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        return { ...DEFAULT_SECURITY_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not load admin security config from storage', e);
    }
    return { ...DEFAULT_SECURITY_CONFIG };
  }

  private saveConfig() {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Could not save admin security config', e);
    }
  }

  public getConfig(): AdminSecurityConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<AdminSecurityConfig>): boolean {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    this.saveConfig();
    this.notify();
    return true;
  }

  public getSession(): AdminSession | null {
    try {
      // Check sessionStorage first, then localStorage
      let raw = sessionStorage.getItem(STORAGE_KEY_SESSION);
      if (!raw) {
        raw = localStorage.getItem(STORAGE_KEY_SESSION);
      }
      if (!raw) return null;

      const session: AdminSession = JSON.parse(raw);
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        this.logout();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  public isAuthenticated(): boolean {
    return this.getSession() !== null;
  }

  public login(
    identifier: string,
    secret: string,
    remember: boolean = false
  ): { success: boolean; error?: string } {
    const trimmedId = identifier.trim().toLowerCase();
    const trimmedSecret = secret.trim();

    const expectedEmail = this.config.adminEmail.trim().toLowerCase();

    // Verification check: email match & password match, OR master PIN match
    const isEmailValid = trimmedId === expectedEmail || trimmedId === 'admin';
    const isPasswordValid = trimmedSecret === this.config.adminPassword;
    const isPinValid = trimmedSecret === this.config.adminPin;

    if (!isEmailValid) {
      return {
        success: false,
        error: 'Unauthorized email address. Access is restricted to the platform administrator.',
      };
    }

    if (!isPasswordValid && !isPinValid) {
      return {
        success: false,
        error: 'Invalid password or PIN. Please check your credentials.',
      };
    }

    const durationMs = (this.config.sessionTimeoutHours || 4) * 60 * 60 * 1000;
    const session: AdminSession = {
      email: this.config.adminEmail,
      authenticatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + durationMs).toISOString(),
      token: `omni-adm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };

    const sessionStr = JSON.stringify(session);
    sessionStorage.setItem(STORAGE_KEY_SESSION, sessionStr);
    if (remember) {
      localStorage.setItem(STORAGE_KEY_SESSION, sessionStr);
    }

    this.notify();
    return { success: true };
  }

  public loginWithPin(pin: string, remember: boolean = false): { success: boolean; error?: string } {
    if (pin.trim() === this.config.adminPin.trim()) {
      const durationMs = (this.config.sessionTimeoutHours || 4) * 60 * 60 * 1000;
      const session: AdminSession = {
        email: this.config.adminEmail,
        authenticatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + durationMs).toISOString(),
        token: `omni-adm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      };

      const sessionStr = JSON.stringify(session);
      sessionStorage.setItem(STORAGE_KEY_SESSION, sessionStr);
      if (remember) {
        localStorage.setItem(STORAGE_KEY_SESSION, sessionStr);
      }
      this.notify();
      return { success: true };
    }

    return { success: false, error: 'Incorrect Master Security PIN.' };
  }

  public logout(): void {
    sessionStorage.removeItem(STORAGE_KEY_SESSION);
    localStorage.removeItem(STORAGE_KEY_SESSION);
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const adminAuth = new AdminAuthService();
