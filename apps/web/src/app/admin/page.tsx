"use client";

/**
 * Kitchen/manager console: PIN login, live order board (new orders
 * pop in over the socket), one-tap status advance, and per-item
 * availability toggles that sold-out the storefront instantly.
 */
import { useCallback, useEffect, useState } from "react";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, formatPKR, type OrderStatusName } from "@four/shared";
import { api, ApiError } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { BrandLogo } from "@/components/BrandLogo";

interface AdminOrder {
  orderNumber: string;
  status: string;
  placedAt: string;
  customerName: string;
  phone: string;
  areaName: string;
  block: string;
  address: string;
  note: string | null;
  payment: "COD" | "CARD";
  total: number;
  branchId: string | null;
  branch: string | null;
  riderId: string | null;
  riderName: string | null;
  lines: { name: string; variantLabel: string | null; modifiers: string[]; qty: number }[];
}

interface AdminBranch {
  id: string;
  name: string;
  shortName: string;
}

interface AdminRider {
  id: string;
  name: string;
  phone: string;
  status: string;
  active: boolean;
  branchId: string;
  branch: string;
}

interface AdminItem {
  id: string;
  name: string;
  available: boolean;
  categoryId: string;
}

const NEXT_STATUS: Record<string, OrderStatusName | undefined> = {
  CONFIRMED: "PREPARING",
  PREPARING: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

/** Rider management: onboard, move between branches, reset PIN, deactivate. */
function RidersTab({
  riders,
  branches,
  onChanged,
}: {
  riders: AdminRider[];
  branches: AdminBranch[];
  onChanged: () => void;
}) {
  const [form, setForm] = useState({ name: "", phone: "", pin: "", branchId: "" });
  const [message, setMessage] = useState("");
  const [pinEdit, setPinEdit] = useState<{ id: string; pin: string } | null>(null);

  const create = async () => {
    setMessage("");
    try {
      await api("/api/admin/riders", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", phone: "", pin: "", branchId: "" });
      onChanged();
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : "Could not add the rider.");
    }
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    setMessage("");
    try {
      await api(`/api/admin/riders/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      onChanged();
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : "Could not update the rider.");
    }
  };

  const inputCls =
    "h-11 rounded-xl border border-ink/15 bg-cream px-3.5 text-sm text-ink outline-none transition focus:border-red focus:ring-2 focus:ring-red/30";

  return (
    <div className="mt-8 grid gap-4">
      <div className="rounded-card bg-cream p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Add a rider</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className={inputCls} />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0300 0000000" inputMode="tel" className={inputCls} />
          <input value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 8) })} placeholder="PIN (4-8 digits)" inputMode="numeric" className={inputCls} />
          <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className={inputCls}>
            <option value="" disabled>
              Branch
            </option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.shortName}
              </option>
            ))}
          </select>
          <button
            onClick={create}
            disabled={form.name.trim().length < 2 || form.phone.replace(/\D/g, "").length < 11 || form.pin.length < 4 || !form.branchId}
            className="rounded-full bg-red px-5 py-2 text-sm font-semibold text-cream transition hover:bg-red-deep disabled:opacity-50"
          >
            Add rider
          </button>
        </div>
      </div>

      {message && (
        <p role="alert" className="rounded-xl bg-red/10 px-4 py-3 text-sm font-medium text-red">
          {message}
        </p>
      )}

      {riders.map((r) => (
        <article key={r.id} className={`rounded-card bg-cream p-5 ${r.active ? "" : "opacity-60"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${r.active && r.status === "ONLINE" ? "bg-green-600" : "bg-ink/25"}`}
                title={r.status}
                aria-hidden
              />
              <div>
                <p className="font-semibold text-ink">
                  {r.name}
                  {!r.active && <span className="ml-2 rounded-full bg-ink/10 px-2 py-0.5 text-[11px] font-bold text-ink-soft">DEACTIVATED</span>}
                </p>
                <p className="text-xs text-ink-soft">{r.phone}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={r.branchId}
                onChange={(e) => patch(r.id, { branchId: e.target.value })}
                className="h-9 rounded-full border border-ink/15 bg-cream px-3 text-xs font-semibold text-ink outline-none focus:border-red"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.shortName}
                  </option>
                ))}
              </select>
              {pinEdit?.id === r.id ? (
                <span className="flex items-center gap-2">
                  <input
                    value={pinEdit.pin}
                    onChange={(e) => setPinEdit({ id: r.id, pin: e.target.value.replace(/\D/g, "").slice(0, 8) })}
                    placeholder="New PIN"
                    inputMode="numeric"
                    autoFocus
                    className="h-9 w-28 rounded-full border border-ink/15 bg-cream px-3 text-center text-xs font-semibold text-ink outline-none focus:border-red"
                  />
                  <button
                    onClick={async () => {
                      await patch(r.id, { pin: pinEdit.pin });
                      setPinEdit(null);
                    }}
                    disabled={pinEdit.pin.length < 4}
                    className="rounded-full bg-red px-4 py-2 text-xs font-semibold text-cream transition hover:bg-red-deep disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button onClick={() => setPinEdit(null)} className="text-xs font-medium text-ink-soft hover:text-ink">
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setPinEdit({ id: r.id, pin: "" })}
                  className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink-soft transition hover:border-red hover:text-red"
                >
                  Reset PIN
                </button>
              )}
              <button
                onClick={() => patch(r.id, { active: !r.active })}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  r.active
                    ? "border border-ink/20 text-ink-soft hover:border-red hover:text-red"
                    : "bg-red text-cream hover:bg-red-deep"
                }`}
              >
                {r.active ? "Deactivate" : "Reactivate"}
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [branches, setBranches] = useState<AdminBranch[]>([]);
  const [riders, setRiders] = useState<AdminRider[]>([]);
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [tab, setTab] = useState<"orders" | "menu" | "riders" | "pos">("orders");
  const branchFilterRef = { current: branchFilter };
  const [posFeed, setPosFeed] = useState<{ provider: string; entries: { receivedAt: string; order: unknown }[] }>({ provider: "", entries: [] });

  const refresh = useCallback(async (branchId?: string) => {
    try {
      const q = branchId ? `?branchId=${branchId}` : "";
      const [o, m, b, r] = await Promise.all([
        api<{ orders: AdminOrder[] }>(`/api/admin/orders${q}`),
        api<{ categories: { id: string; items: { id: string; name: string; available: boolean; categoryId: string }[] }[] }>("/api/menu"),
        api<{ branches: AdminBranch[] }>("/api/admin/branches"),
        api<{ riders: AdminRider[] }>("/api/admin/riders"),
      ]);
      setOrders(o.orders);
      setBranches(b.branches);
      setRiders(r.riders);
      setItems(m.categories.flatMap((c) => c.items.map((i) => ({ id: i.id, name: i.name, available: i.available, categoryId: c.id }))));
      setAuthed(true);
      const socket = getSocket();
      socket.emit("admin:watch");
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) setAuthed(false);
    }
  }, []);

  useEffect(() => {
    void refresh(branchFilter || undefined);
  }, [refresh, branchFilter]);

  useEffect(() => {
    if (!authed) return;
    const socket = getSocket();
    const reload = () => void refresh(branchFilterRef.current || undefined);
    socket.on("admin:order:new", reload);
    socket.on("admin:order:updated", reload);
    return () => {
      socket.off("admin:order:new", reload);
      socket.off("admin:order:updated", reload);
    };
  }, [authed, refresh]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api("/api/admin/login", { method: "POST", body: JSON.stringify({ pin }) });
      // socket auth carries isAdmin from the session row; reconnect to refresh it
      getSocket().disconnect().connect();
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    }
  };

  const loadPosFeed = useCallback(async () => {
    try {
      setPosFeed(await api("/api/admin/pos-feed"));
    } catch {
      // the tab is a demonstration aid; a failure here must not break the board
    }
  }, []);

  const advance = async (orderNumber: string, status: string) => {
    const next = NEXT_STATUS[status];
    if (!next) return;
    await api(`/api/admin/orders/${orderNumber}/status`, { method: "PATCH", body: JSON.stringify({ status: next }) });
    await refresh(branchFilter || undefined);
  };

  const cancel = async (orderNumber: string) => {
    await api(`/api/admin/orders/${orderNumber}/status`, { method: "PATCH", body: JSON.stringify({ status: "CANCELLED" }) });
    await refresh(branchFilter || undefined);
  };

  const setRider = async (orderNumber: string, riderId: string) => {
    await api(`/api/admin/orders/${orderNumber}/rider`, {
      method: "PATCH",
      body: JSON.stringify({ riderId: riderId || null }),
    });
    await refresh(branchFilter || undefined);
  };

  const toggleItem = async (item: AdminItem) => {
    setItems((p) => p.map((i) => (i.id === item.id ? { ...i, available: !i.available } : i)));
    await api(`/api/admin/items/${item.id}/availability`, {
      method: "PATCH",
      body: JSON.stringify({ available: !item.available }),
    }).catch(() => refresh());
  };

  if (!authed) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center px-4">
        <form onSubmit={login} className="w-full max-w-sm rounded-card bg-cream p-8 shadow-xl shadow-ink/10">
          <span className="text-red">
            <BrandLogo className="h-8" />
          </span>
          <h1 className="font-display mt-4 text-2xl font-semibold text-ink">Kitchen console</h1>
          <label className="mt-6 grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink">PIN</span>
            <input
              // inputMode numeric brings up the tablet numpad rather than a keyboard
              type="password"
              inputMode="numeric"
              autoComplete="off"
              pattern="[0-9]*"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="h-14 rounded-xl border border-ink/15 bg-cream px-4 text-center text-2xl tracking-[0.5em] text-ink outline-none focus:border-red focus:ring-2 focus:ring-red/30"
            />
          </label>
          {error && <p className="mt-3 text-sm font-medium text-red">{error}</p>}
          <button
            disabled={pin.length < 4}
            className="mt-5 w-full rounded-full bg-red py-3.5 font-semibold text-cream transition hover:bg-red-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            Sign in
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-red">
            <BrandLogo className="h-8" />
          </span>
          <h1 className="font-display text-2xl font-semibold text-ink">Kitchen console</h1>
        </div>
        <div className="flex gap-2 rounded-full bg-beige-deep p-1 text-sm font-semibold">
          <button
            onClick={() => setTab("orders")}
            className={`rounded-full px-5 py-2 transition ${tab === "orders" ? "bg-red text-cream" : "text-ink"}`}
          >
            Orders
          </button>
          <button
            onClick={() => setTab("menu")}
            className={`rounded-full px-5 py-2 transition ${tab === "menu" ? "bg-red text-cream" : "text-ink"}`}
          >
            Menu availability
          </button>
          <button
            onClick={() => setTab("riders")}
            className={`rounded-full px-5 py-2 transition ${tab === "riders" ? "bg-red text-cream" : "text-ink"}`}
          >
            Riders
          </button>
          <button
            onClick={() => {
              setTab("pos");
              void loadPosFeed();
            }}
            className={`rounded-full px-5 py-2 transition ${tab === "pos" ? "bg-red text-cream" : "text-ink"}`}
          >
            POS feed
          </button>
        </div>
      </header>

      {tab === "pos" ? (
        <div className="mt-8 grid gap-4">
          <div className="rounded-card bg-cream p-6">
            <h2 className="font-display text-lg font-semibold text-ink">What the POS receives</h2>
            <p className="mt-1 text-sm text-ink-soft">
              The exact payload the bridge sends for each order - the integration a POS vendor
              would build against. Active provider: <b className="text-ink">{posFeed.provider || "unknown"}</b>.
              {posFeed.provider !== "demo" && " Set POS_PROVIDER=demo to capture payloads here."}
            </p>
          </div>
          {posFeed.entries.length === 0 && (
            <p className="rounded-card bg-cream p-8 text-center text-ink-soft">
              Nothing captured yet. Place an order with POS_PROVIDER=demo and it appears here.
            </p>
          )}
          {posFeed.entries.map((e, i) => (
            <article key={i} className="rounded-card bg-cream p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{e.receivedAt}</p>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-ink/5 p-4 text-xs leading-relaxed text-ink">
                {JSON.stringify(e.order, null, 2)}
              </pre>
            </article>
          ))}
        </div>
      ) : tab === "orders" ? (
        <div className="mt-8 grid gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setBranchFilter("")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                branchFilter === "" ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-beige-deep"
              }`}
            >
              All branches
            </button>
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => setBranchFilter(b.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  branchFilter === b.id ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-beige-deep"
                }`}
              >
                {b.shortName}
              </button>
            ))}
          </div>
          {orders.length === 0 && <p className="rounded-card bg-cream p-8 text-center text-ink-soft">No orders yet today.</p>}
          {orders.map((o) => (
            <article key={o.orderNumber} className="rounded-card bg-cream p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-xl font-semibold text-ink">{o.orderNumber}</h2>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        o.status === "DELIVERED"
                          ? "bg-ink/10 text-ink-soft"
                          : o.status === "CANCELLED"
                            ? "bg-ink/10 text-ink-soft line-through"
                            : "bg-red text-cream"
                      }`}
                    >
                      {ORDER_STATUS_LABELS[o.status as OrderStatusName] ?? o.status}
                    </span>
                    <span className="text-xs text-ink-soft">
                      {new Date(o.placedAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">
                    {o.branch && <span className="mr-2 rounded-full bg-beige-deep px-2 py-0.5 text-[11px] font-bold text-ink">{o.branch}</span>}
                    {o.customerName} · {o.phone} · {o.block}, {o.areaName} · {o.address}
                    {o.note ? ` · "${o.note}"` : ""}
                  </p>
                  <ul className="mt-3 grid gap-1 text-sm text-ink">
                    {o.lines.map((l, i) => (
                      <li key={i}>
                        {l.qty}x {l.name}
                        {l.variantLabel ? ` (${l.variantLabel})` : ""}
                        {l.modifiers.length > 0 && <span className="text-ink-soft"> + {l.modifiers.join(", ")}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <span className="text-lg font-bold text-ink">
                    {formatPKR(o.total)} <span className="text-xs font-medium text-ink-soft">{o.payment}</span>
                  </span>
                  {NEXT_STATUS[o.status] && (
                    <select
                      value={o.riderId ?? ""}
                      onChange={(e) => setRider(o.orderNumber, e.target.value)}
                      className="h-9 rounded-full border border-ink/15 bg-cream px-3 text-xs font-semibold text-ink outline-none focus:border-red"
                    >
                      <option value="">Assign rider...</option>
                      {riders
                        .filter((r) => r.active && (!o.branchId || r.branchId === o.branchId))
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.status === "ONLINE" ? "online" : "offline"})
                          </option>
                        ))}
                    </select>
                  )}
                  {o.riderName && !NEXT_STATUS[o.status] && (
                    <span className="text-xs text-ink-soft">Rider: {o.riderName}</span>
                  )}
                  {NEXT_STATUS[o.status] && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => cancel(o.orderNumber)}
                        className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink-soft transition hover:border-red hover:text-red"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => advance(o.orderNumber, o.status)}
                        className="rounded-full bg-red px-5 py-2 text-sm font-semibold text-cream transition hover:bg-red-deep"
                      >
                        Mark {ORDER_STATUS_LABELS[NEXT_STATUS[o.status]!]}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : tab === "riders" ? (
        <RidersTab riders={riders} branches={branches} onChanged={() => refresh(branchFilter || undefined)} />
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleItem(item)}
              className={`flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                item.available ? "bg-cream text-ink hover:bg-beige-deep" : "bg-ink/5 text-ink-soft line-through"
              }`}
            >
              {item.name}
              <span
                className={`ml-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  item.available ? "bg-red/10 text-red" : "bg-ink/10 text-ink-soft"
                }`}
              >
                {item.available ? "LIVE" : "OFF"}
              </span>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
