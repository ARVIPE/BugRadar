"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

type Ev = {
  id: string;
  created_at: string;
  severity: "warning" | "error";
  log_message: string;
  container_name: string;
  status?: "open" | "resolved" | "ignored";
};

interface LogStreamProps {
  projectId: string | null;
}

const SCROLL_HEIGHT_CLASS = "max-h-[420px]";

function sameEvents(a: Ev[], b: Ev[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const ea = a[i];
    const eb = b[i];
    if (
      ea.id !== eb.id ||
      ea.created_at !== eb.created_at ||
      ea.severity !== eb.severity ||
      ea.log_message !== eb.log_message ||
      ea.container_name !== eb.container_name ||
      (ea.status ?? "open") !== (eb.status ?? "open")
    ) {
      return false;
    }
  }
  return true;
}

export default function LogStream({ projectId }: LogStreamProps) {
  const locale = useLocale();
  const t = useTranslations("LogStream");

  const [activeTab, setActiveTab] = useState<
    "errors" | "warnings" | "closed"
  >("errors");
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let isFirstLoad = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      if (!projectId) {
        if (mounted) {
          setEvents([]);
          setLoading(false);
        }
        return;
      }

      if (isFirstLoad && mounted) {
        setLoading(true);
      }

      try {
        const res = await fetch(
          `/api/logs?project_id=${encodeURIComponent(projectId)}&limit=300`,
          {
            cache: "no-store",
          }
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        const incoming: Ev[] = json.items ?? [];

        if (!mounted) return;

        setEvents((prev) => {
          if (sameEvents(prev, incoming)) return prev;
          return incoming;
        });
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to fetch logs:", err);
        }
      } finally {
        if (mounted && isFirstLoad) {
          setLoading(false);
          isFirstLoad = false;
        }
      }
    };

    void load();
    intervalId = setInterval(load, 5000);

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [projectId]);

  const counts = useMemo(() => {
    const isOpen = (e: Ev) => (e.status ?? "open") === "open";
    const isClosed = (e: Ev) =>
      e.status === "resolved" || e.status === "ignored";

    const eOpen = events.filter(
      (e) => e.severity === "error" && isOpen(e)
    ).length;
    const wOpen = events.filter(
      (e) => e.severity === "warning" && isOpen(e)
    ).length;
    const closed = events.filter(isClosed).length;

    return { eOpen, wOpen, closed };
  }, [events]);

  const tabs = [
    { key: "errors" as const, label: `${t("tabErrors")} (${counts.eOpen})` },
    {
      key: "warnings" as const,
      label: `${t("tabWarnings")} (${counts.wOpen})`,
    },
    { key: "closed" as const, label: `${t("tabClosed")} (${counts.closed})` },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const isOpen = (e: Ev) => (e.status ?? "open") === "open";
    const isClosed = (e: Ev) =>
      e.status === "resolved" || e.status === "ignored";

    let base = events;

    if (activeTab === "errors") {
      base = base.filter((e) => e.severity === "error" && isOpen(e));
    } else if (activeTab === "warnings") {
      base = base.filter((e) => e.severity === "warning" && isOpen(e));
    } else if (activeTab === "closed") {
      base = base.filter(isClosed);
    } 

    if (q) {
      base = base.filter((x) => {
        const created = new Date(x.created_at);
        const createdStr = isNaN(created.getTime())
          ? ""
          : created.toLocaleDateString(locale).toLowerCase();

        return (
          x.log_message.toLowerCase().includes(q) ||
          x.container_name.toLowerCase().includes(q) ||
          x.severity.toLowerCase().includes(q) ||
          (x.status ?? "open").toLowerCase().includes(q) ||
          createdStr.includes(q)
        );
      });
    }
    return base;
  }, [events, activeTab, query, locale]);

  const logs = useMemo(
    () =>
      filtered.map((ev) => ({
        id: ev.id,
        time: new Date(ev.created_at).toLocaleString(locale),
        severity:
          ev.severity === "error"
            ? t("severityError")
            : ev.severity === "warning"
            ? t("severityWarning")
            : "",
        message: ev.log_message,
        service: ev.container_name || "—",
        status: ev.status ?? "open",
      })),
    [filtered, locale, t]
  );

  return (
    <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-6 mt-10">
      <h2 className="text-xl font-semibold text-skin-title mb-4">
        {t("title")}
      </h2>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full md:w-1/3 px-3 py-2 text-sm bg-skin-input border border-border rounded-md
                     placeholder:text-skin-subtitle text-skin-title
                     focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)]"
        />
      </div>

      <div className="flex bg-skin-bg rounded-md overflow-x-auto text-sm font-medium mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 flex-1 transition-colors
              ${
                activeTab === tab.key
                  ? "bg-amber-400 text-slate-900 hover:bg-amber-500 focus:ring-2 focus:ring-amber-600"
                  : "text-skin-subtitle hover:text-skin-title hover:bg-skin-panel"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="grid grid-cols-5 px-3 py-2 text-xs uppercase text-skin-subtitle border-b border-border">
          <div>{t("colTimestamp")}</div>
          <div>{t("colSeverity")}</div>
          <div>{t("colMessage")}</div>
          <div>{t("colService")}</div>
          <div className="text-right">{t("colActions")}</div>
        </div>

        <div className={`${SCROLL_HEIGHT_CLASS} overflow-y-auto scrollbar-thin`}>
          {loading ? (
            <div className="px-3 py-4 text-skin-subtitle">{t("loading")}</div>
          ) : logs.length === 0 ? (
            <div className="px-3 py-4 text-skin-subtitle">{t("empty")}</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-5 px-3 py-3 text-sm text-skin-title border-b border-border hover:bg-skin-bg"
              >
                <div>{log.time}</div>
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                      log.severity === t("severityError")
                        ? "bg-destructive/10 text-destructive"
                        : log.severity === t("severityWarning")
                        ? "text-[var(--yellow)] bg-[color:var(--yellow)]/10"
                        : "text-skin-subtitle bg-skin-bg"
                    }`}
                  >
                    {log.severity}
                  </span>
                </div>
                <div className="truncate" title={log.message}>
                  {log.message}
                </div>
                <div className="truncate" title={log.service}>
                  {log.service}
                </div>
                <div className="text-right">
                  <Link
                    href={`/${locale}/detail/${log.id}`}
                    className="text-[var(--details-link)] hover:underline"
                  >
                    {t("viewDetails")}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile */}
      <div
        className={`md:hidden flex flex-col gap-4 ${SCROLL_HEIGHT_CLASS} overflow-y-auto scrollbar-thin`}
      >
        {loading ? (
          <div className="text-skin-subtitle">{t("loading")}</div>
        ) : logs.length === 0 ? (
          <div className="text-skin-subtitle">{t("empty")}</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="border border-border rounded-md p-4 bg-skin-panel shadow-elev-1"
            >
              <div className="text-xs text-skin-subtitle mb-1">
                {t("colTimestamp")}
              </div>
              <div className="mb-2 text-skin-title">{log.time}</div>

              <div className="text-xs text-skin-subtitle mb-1">
                {t("colSeverity")}
              </div>
              <div className="mb-2">
                <span
                    className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                      log.severity === t("severityError")
                        ? "bg-destructive/10 text-destructive"
                        : log.severity === t("severityWarning")
                        ? "text-[var(--yellow)] bg-[color:var(--yellow)]/10"
                        : "text-skin-subtitle bg-skin-bg"
                    }`}
                  >
                  {log.severity}
                </span>
              </div>

              <div className="text-xs text-skin-subtitle mb-1">
                {t("colMessage")}
              </div>
              <div className="mb-2 text-skin-title">{log.message}</div>

              <div className="text-xs text-skin-subtitle mb-1">
                {t("colService")}
              </div>
              <div className="mb-2 text-skin-title">{log.service}</div>

              <div className="text-right mt-2">
                <Link
                  href={`/${locale}/detail/${log.id}`}
                  className="text-[var(--primary)] text-sm font-medium hover:underline"
                >
                  {t("viewDetails")}
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
