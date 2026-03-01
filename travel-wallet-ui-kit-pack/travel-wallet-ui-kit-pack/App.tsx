import React, { useMemo, useState } from "react";

type Toast = { id: string; message: string };

function uid() {
  return Math.random().toString(16).slice(2, 10).toUpperCase();
}

function cn(...xs: Array<string | undefined | false>) {
  return xs.filter(Boolean).join(" ");
}

export default function App() {
  const [q, setQ] = useState("");
  const [nfcUid, setNfcUid] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (message: string) => {
    const id = crypto?.randomUUID?.() ?? String(Date.now());
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200);
  };

  const disabledSearch = q.trim().length === 0;
  const disabledNfc = nfcUid.trim().length === 0;
  const disabledQr = qrToken.trim().length === 0;

  return (
    <div className="min-h-screen w-full overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url(/assets/bg-everest.jpg)" }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-sky-50/50 via-sky-200/15 to-blue-500/5" />

      {/* Top bar */}
      <header className="mx-auto flex h-[72px] w-full max-w-[1400px] items-center justify-between px-10">
        <div className="flex items-center gap-3">
          <img src="/assets/icons/logo.svg" className="h-9 w-9" alt="logo" />
          <div className="text-[26px] font-extrabold tracking-tight text-[#2F7DFF]">
            Travel Wallet
          </div>
        </div>

        {/* Segmented pill */}
        <div className="flex items-center rounded-full border border-white/30 bg-white/10 p-1 backdrop-blur-2xl shadow-[0_18px_55px_rgba(47,125,255,0.18)]">
          <button className="rounded-full bg-gradient-to-b from-[#4FA3FF] to-[#2F7DFF] px-6 py-2 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(47,125,255,0.35)]">
            POS
          </button>
          <div className="mx-3 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/40 bg-white/25">
            <span className="text-xs font-semibold text-[#0B1B3A]/70">👤</span>
          </div>
          <button className="rounded-full px-6 py-2 text-sm font-semibold text-[#0B1B3A]/70">
            Admin
          </button>
        </div>
      </header>

      {/* Title */}
      <main className="mx-auto w-full max-w-[1400px] px-10">
        <div className="mt-10 text-center">
          <h1 className="text-[56px] font-extrabold tracking-tight text-[#2F7DFF]">
            Point of Sale
          </h1>
          <p className="mt-2 text-[18px] font-medium text-[#0B1B3A]/60">
            Identify customer by search, NFC tap, or QR code
          </p>
        </div>

        {/* Cards */}
        <section className="mx-auto mt-10 grid max-w-[1240px] grid-cols-3 gap-7">
          <GlassCard title="Search customer">
            <Input
              value={q}
              onChange={setQ}
              placeholder="Name, email, or phone"
              icon="/assets/icons/search.svg"
            />
            <PrimaryButton
              className="mt-5 w-full"
              disabled={disabledSearch}
              onClick={() => toast(`Search: ${q}`)}
            >
              Search
            </PrimaryButton>
          </GlassCard>

          <GlassCard title="Tap card (NFC UID)">
            <Input
              value={nfcUid}
              onChange={setNfcUid}
              placeholder="Paste or enter NFC tag UID"
            />
            <div className="mt-5 grid grid-cols-2 gap-4">
              <PrimaryButton disabled={disabledNfc} onClick={() => toast(`NFC UID: ${nfcUid}`)}>
                Identify by NFC
              </PrimaryButton>
              <SecondaryButton
                onClick={() => {
                  const v = uid();
                  setNfcUid(v);
                  toast(`Scanned card: ${v}`);
                }}
              >
                Scan card
              </SecondaryButton>
            </div>
            <p className="mt-4 text-center text-xs text-[#0B1B3A]/50">
              Click “Scan card” then tap the card on the reader.
            </p>
          </GlassCard>

          <GlassCard title="Scan QR token">
            <Input
              value={qrToken}
              onChange={setQrToken}
              placeholder="Paste QR session token or scan code"
            />
            <PrimaryButton
              className="mt-5 w-full"
              disabled={disabledQr}
              onClick={() => toast(`QR Token: ${qrToken}`)}
            >
              Identify by QR
            </PrimaryButton>
          </GlassCard>
        </section>

        {/* Bottom quick actions */}
        <section className="mx-auto mt-10 flex max-w-[1240px] justify-center gap-6 pb-10">
          <QuickTile icon="/assets/icons/search.svg" label="Search" />
          <QuickTile icon="/assets/icons/nfc.svg" label="NFC Tap" />
          <QuickTile icon="/assets/icons/qr.svg" label="Scan QR" />
        </section>
      </main>

      {/* Toasts */}
      <div className="fixed right-6 top-24 z-50 space-y-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl border border-white/40 bg-white/20 px-4 py-3 text-sm font-semibold text-[#0B1B3A]/80 backdrop-blur-2xl shadow-[0_14px_40px_rgba(47,125,255,0.18)]"
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function GlassCard(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/30 bg-white/15 p-6 backdrop-blur-2xl shadow-[0_22px_70px_rgba(47,125,255,0.20)]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 via-white/0 to-white/10" />
      <div className="relative">
        <div className="text-center text-[20px] font-bold text-[#0B1B3A]/85">
          {props.title}
        </div>
        <div className="mt-5">{props.children}</div>
      </div>
    </div>
  );
}

function Input(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/60 px-4 py-3">
      {props.icon ? (
        <img src={props.icon} alt="" className="h-5 w-5 opacity-80" />
      ) : null}
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className="w-full bg-transparent text-sm font-medium text-[#0B1B3A]/70 placeholder:text-[#0B1B3A]/40 outline-none"
      />
    </div>
  );
}

function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className, disabled, ...rest } = props;
  return (
    <button
      {...rest}
      disabled={disabled}
      className={cn(
        "rounded-2xl px-5 py-3 text-sm font-semibold text-white transition",
        "bg-gradient-to-b from-[#4FA3FF] to-[#2F7DFF] shadow-[0_14px_40px_rgba(47,125,255,0.35)]",
        "hover:brightness-[1.03] active:brightness-95",
        "disabled:opacity-60 disabled:shadow-none",
        className
      )}
    />
  );
}

function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className, ...rest } = props;
  return (
    <button
      {...rest}
      className={cn(
        "rounded-2xl border border-white/50 bg-white/25 px-5 py-3 text-sm font-semibold text-[#0B1B3A]/70 backdrop-blur-xl",
        "hover:bg-white/30 active:bg-white/20",
        className
      )}
    />
  );
}

function QuickTile(props: { icon: string; label: string }) {
  return (
    <div className="relative h-[92px] w-[260px] overflow-hidden rounded-[26px] border border-white/30 bg-white/15 backdrop-blur-2xl shadow-[0_18px_55px_rgba(47,125,255,0.18)]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 via-white/0 to-white/10" />
      <div className="relative flex h-full items-center justify-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-[#4FA3FF] to-[#2F7DFF] shadow-[0_14px_40px_rgba(47,125,255,0.25)]">
          <img src={props.icon} alt="" className="h-6 w-6 brightness-[10]" />
        </div>
        <div className="text-base font-semibold text-[#0B1B3A]/70">{props.label}</div>
      </div>
    </div>
  );
}
