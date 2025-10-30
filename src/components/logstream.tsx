"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Ev = {
  id: string;
  created_at: string;
  severity: "warning" | "error";
  log_message: string;
  container_name: string;
  status?: "open" | "resolved" | "ignored";
};

const SCROLL_HEIGHT_CLASS = "max-h-[420px]";

export default function LogStream() {
  const [activeTab, setActiveTab] = useState<string>("Errors (0)");
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let t: any;

    const load = async () => {
      try {
        // Traemos últimos N eventos (abiertos y cerrados) y filtramos en cliente
        const res = await fetch(`/api/logs?limit=300`, { cache: "no-store" });
        if (!mounted) return;
        const json = await res.json();
        setEvents(json.items ?? []);
      } catch (err: any) {
        /* ignorar AbortError */
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    t = setInterval(load, 5000);
    return () => {
      clearInterval(t);
      mounted = false;
    };
  }, []);

  // Contadores por tab
  const counts = useMemo(() => {
    const isOpen = (e: Ev) => (e.status ?? "open") === "open";
    const isClosed = (e: Ev) => (e.status === "resolved" || e.status === "ignored");

    const eOpen = events.filter(e => e.severity === "error" && isOpen(e)).length;
    const wOpen = events.filter(e => e.severity === "warning" && isOpen(e)).length;
    const closed = events.filter(isClosed).length;

    return { eOpen, wOpen, closed };
  }, [events]);

  const tabs = useMemo(() => {
    const errors = `Errors (${counts.eOpen})`;
    const warnings = `Warnings (${counts.wOpen})`;
    const debug = `Debug (${counts.closed})`;
    const metrics = "Metrics";

    const currentType = activeTab.split(" ")[0]; // Errors/Warnings/Debug/Metrics
    const newMap: Record<string, string> = {
      Errors: errors,
      Warnings: warnings,
      Debug: debug,
      Metrics: metrics,
    };
    const nextActive = newMap[currentType] ?? errors;
    if (activeTab !== nextActive) setActiveTab(nextActive);

    return [errors, warnings, debug, metrics];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts.eOpen, counts.wOpen, counts.closed]);

  // Filtro por tab + búsqueda
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const isOpen = (e: Ev) => (e.status ?? "open") === "open";
    const isClosed = (e: Ev) => (e.status === "resolved" || e.status === "ignored");

    let base = events;

    if (activeTab.startsWith("Errors")) base = base.filter(e => e.severity === "error" && isOpen(e));
    else if (activeTab.startsWith("Warnings")) base = base.filter(e => e.severity === "warning" && isOpen(e));
    else if (activeTab.startsWith("Debug")) base = base.filter(isClosed);
    // Metrics: dejamos todo (o podrías dejar vacío, como en tu maqueta original)

    if (q) {
      base = base.filter(
        (x) =>
          x.log_message.toLowerCase().includes(q) ||
          x.container_name.toLowerCase().includes(q) ||
          x.severity.toLowerCase().includes(q) ||
          (x.status ?? "open").toLowerCase().includes(q) ||
          new Date(x.created_at).toLocaleDateString('en-GB').toLowerCase().includes(q.toLowerCase())
      );
    }
    return base;
  }, [events, activeTab, query]);

  const logs = useMemo(
    () =>
      filtered.map((ev) => ({
        id: ev.id,
        time: new Date(ev.created_at).toLocaleString(),
        severity:
          ev.severity === "error" ? "Error" :
          ev.severity === "warning" ? "Warning" : "",
        message: ev.log_message,
        service: ev.container_name || "—",
        status: ev.status ?? "open",
      })),
    [filtered]
  );

  return (
    <div className="bg-skin-panel border border-border rounded-lg shadow-elev-1 p-6 mt-10">
      <h2 className="text-xl font-semibold text-skin-title mb-4">Log Stream</h2>

      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="Search logs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full md:w-1/3 px-3 py-2 text-sm bg-skin-input border border-border rounded-md
                     placeholder:text-skin-subtitle text-skin-title
                     focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)]"
        />
      </div>

      {/* Tabs */}
      <div className="flex bg-skin-bg rounded-md overflow-x-auto text-sm font-medium mb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 flex-1 transition-colors
              ${activeTab === tab
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-skin-subtitle hover:text-skin-title hover:bg-skin-panel"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Desktop table + scroll estilizado */}
      <div className="hidden md:block">
        <div className="grid grid-cols-5 px-3 py-2 text-xs uppercase text-skin-subtitle border-b border-border">
          <div>Timestamp</div>
          <div>Severity</div>
          <div>Message</div>
          <div>Service</div>
          <div className="text-right">Actions</div>
        </div>

        <div className={`${SCROLL_HEIGHT_CLASS} overflow-y-auto scrollbar-thin`}>
          {loading ? (
            <div className="px-3 py-4 text-skin-subtitle">Loading…</div>
          ) : logs.length === 0 ? (
            <div className="px-3 py-4 text-skin-subtitle">No logs</div>
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
                      log.severity === "Error"
                        ? "bg-destructive/10 text-destructive"
                        : log.severity === "Warning"
                        ? "text-[var(--yellow)] bg-[color:var(--yellow)]/10"
                        : "text-skin-subtitle bg-skin-bg"
                    }`}
                  >
                    {log.severity}
                  </span>
                </div>
                <div className="truncate" title={log.message}>{log.message}</div>
                <div className="truncate" title={log.service}>{log.service}</div>
                <div className="text-right">
                  <Link href={`/detail/${log.id}`} className="text-[var(--details-link)] hover:underline">
                    View Details
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile cards + scroll estilizado */}
      <div className={`md:hidden flex flex-col gap-4 ${SCROLL_HEIGHT_CLASS} overflow-y-auto scrollbar-thin`}>
        {loading ? (
          <div className="text-skin-subtitle">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="text-skin-subtitle">No logs</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="border border-border rounded-md p-4 bg-skin-panel shadow-elev-1">
              <div className="text-xs text-skin-subtitle mb-1">Timestamp</div>
              <div className="mb-2 text-skin-title">{log.time}</div>

              <div className="text-xs text-skin-subtitle mb-1">Severity</div>
              <div className="mb-2">
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                    log.severity === "Error"
                      ? "bg-destructive/10 text-destructive"
                      : log.severity === "Warning"
                      ? "text-[var(--yellow)] bg-[color:var(--yellow)]/10"
                      : "text-skin-subtitle bg-skin-bg"
                  }`}
                >
                  {log.severity}
                </span>
              </div>

              <div className="text-xs text-skin-subtitle mb-1">Message</div>
              <div className="mb-2 text-skin-title">{log.message}</div>

              <div className="text-xs text-skin-subtitle mb-1">Service</div>
              <div className="mb-2 text-skin-title">{log.service}</div>

              <div className="text-right mt-2">
                <Link href={`/detail/${log.id}`} className="text-[var(--primary)] text-sm font-medium hover:underline">
                  View Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
