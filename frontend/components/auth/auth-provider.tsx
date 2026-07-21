"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest } from "@/lib/api";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
} from "@/types/auth";

const SESSION_KEY = "applyflow.session";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    credentials: LoginCredentials,
  ) => Promise<void>;
  register: (
    data: RegisterData,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );

function isStoredSession(
  value: unknown,
): value is AuthResponse {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const session = value as Partial<AuthResponse>;

  return (
    typeof session.accessToken === "string" &&
    typeof session.user === "object" &&
    session.user !== null &&
    typeof session.user.id === "string" &&
    typeof session.user.email === "string"
  );
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(
    null,
  );
  const [token, setToken] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedSession =
        sessionStorage.getItem(SESSION_KEY);

      if (storedSession) {
        try {
          const parsedSession: unknown =
            JSON.parse(storedSession);

          if (isStoredSession(parsedSession)) {
            setUser(parsedSession.user);
            setToken(parsedSession.accessToken);
          } else {
            sessionStorage.removeItem(
              SESSION_KEY,
            );
          }
        } catch {
          sessionStorage.removeItem(SESSION_KEY);
        }
      }

      setIsLoading(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const saveSession = useCallback(
    (session: AuthResponse) => {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify(session),
      );

      setUser(session.user);
      setToken(session.accessToken);
    },
    [],
  );

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const session =
        await apiRequest<AuthResponse>(
          "/auth/login",
          {
            method: "POST",
            body: JSON.stringify(credentials),
          },
        );

      saveSession(session);
    },
    [saveSession],
  );

  const register = useCallback(
    async (data: RegisterData) => {
      const session =
        await apiRequest<AuthResponse>(
          "/auth/register",
          {
            method: "POST",
            body: JSON.stringify(data),
          },
        );

      saveSession(session);
    },
    [saveSession],
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: token !== null,
      isLoading,
      login,
      register,
      logout,
    }),
    [
      user,
      token,
      isLoading,
      login,
      register,
      logout,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth doit être utilisé dans AuthProvider.",
    );
  }

  return context;
}
