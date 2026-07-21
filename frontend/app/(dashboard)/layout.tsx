"use client";

import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/components/i18n/language-provider";

const navigation = [
  {
    labelKey: "nav.overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    labelKey: "nav.applications",
    href: "/applications",
    icon: BriefcaseBusiness,
  },
  {
    labelKey: "nav.companies",
    href: "/companies",
    icon: Building2,
  },
  {
    labelKey: "nav.interviews",
    href: "/interviews",
    icon: CalendarDays,
  },
  {
    labelKey: "nav.documents",
    href: "/documents",
    icon: FileText,
  },
];

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    logout,
  } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [
    isAuthenticated,
    isLoading,
    router,
  ]);

  if (isLoading || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <span className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          {t("auth.loading")}
        </div>
      </main>
    );
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-20 items-center justify-between px-6 lg:justify-start">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 text-lg font-semibold text-slate-950"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
              A
            </span>
            ApplyFlow
          </Link>

          <div className="flex items-center gap-3 lg:hidden">
            <LanguageSwitcher compact />
            <div className="flex size-9 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
              {initials}
            </div>
          </div>
        </div>

        <nav
          aria-label={t("nav.main")}
          className="flex gap-2 overflow-x-auto px-4 pb-4 lg:block lg:space-y-1 lg:pb-0"
        >
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(
                  `${item.href}/`,
                ));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Icon
                  aria-hidden="true"
                  className="size-5"
                />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden border-t border-slate-200 p-4 lg:absolute lg:inset-x-0 lg:bottom-0 lg:block">
          <div className="mb-4 px-2">
            <LanguageSwitcher compact />
          </div>

          <div className="mb-3 flex items-center gap-3 px-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-xs text-slate-500">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700"
          >
            <LogOut
              aria-hidden="true"
              className="size-5"
            />
            {t("nav.logout")}
          </button>
        </div>
      </aside>

      <main className="min-w-0">
        {children}
      </main>
    </div>
  );
}
