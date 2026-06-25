import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Palette, User, Check, Image, FolderOpen } from "lucide-react";
import { ACCENT_COLORS, BG_PRESETS, useThemeContext } from "@/hooks/use-theme";

type Tab = "appearance" | "account";

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("appearance");
  const { settings, setAccent, setBgPreset, setBgImage } = useThemeContext();
  const [urlInput, setUrlInput] = useState(
    settings.bgPreset === "custom" && !settings.bgImage.startsWith("data:") ? settings.bgImage : ""
  );
  const urlRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function applyCustomUrl() {
    const v = urlInput.trim();
    if (!v) return;
    setBgPreset("custom");
    setBgImage(v);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setBgPreset("custom");
        setBgImage(dataUrl);
        setUrlInput("");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return createPortal(
    <div className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center sm:justify-end"
      onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />

      {/* Panel */}
      <div
        className="relative w-full sm:w-[360px] sm:h-full sm:max-h-full flex flex-col overflow-hidden rounded-t-2xl sm:rounded-none sm:rounded-l-2xl"
        style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.08)", zIndex: 1 }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <span className="text-base font-bold text-white">Settings</span>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          {(["appearance", "account"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors capitalize"
              style={{
                color: tab === t ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                borderBottom: tab === t ? "2px solid hsl(var(--primary))" : "2px solid transparent",
                marginBottom: "-1px",
              }}>
              {t === "appearance" ? <Palette className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-7">

          {tab === "appearance" && (
            <>
              {/* Accent color */}
              <section>
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Accent Color</p>
                <div className="grid grid-cols-4 gap-2.5">
                  {ACCENT_COLORS.map((c) => {
                    const active = settings.accent === c.hsl;
                    return (
                      <button key={c.name} onClick={() => setAccent(c.hsl)}
                        className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all"
                        style={{
                          background: active ? `${c.hex}18` : "rgba(255,255,255,0.04)",
                          border: active ? `2px solid ${c.hex}` : "2px solid transparent",
                        }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ background: c.hex }}>
                          {active && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-[10px] text-white/60 font-medium">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Background */}
              <section>
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Background</p>
                <div className="grid grid-cols-3 gap-2">
                  {BG_PRESETS.filter((b) => b.id !== "custom").map((b) => {
                    const active = settings.bgPreset === b.id;
                    return (
                      <button key={b.id} onClick={() => { setBgPreset(b.id); setBgImage(""); }}
                        className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all"
                        style={{
                          border: active ? "2px solid hsl(var(--primary))" : "2px solid rgba(255,255,255,0.08)",
                          background: active ? "hsl(var(--primary) / 0.08)" : "rgba(255,255,255,0.03)",
                        }}>
                        <div className="w-full aspect-video rounded-lg overflow-hidden"
                          style={{ background: b.preview }} />
                        <span className="text-[10px] text-white/60 font-medium">{b.label}</span>
                        {active && <Check className="w-3 h-3" style={{ color: "hsl(var(--primary))" }} />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom image */}
                <div className="mt-3 rounded-xl overflow-hidden"
                  style={{ border: settings.bgPreset === "custom" ? "2px solid hsl(var(--primary))" : "2px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                  <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                    <Image className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "hsl(var(--primary))" }} />
                    <span className="text-xs font-semibold text-white/70">Custom Background</span>
                  </div>

                  {/* Choose from file */}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-colors hover:bg-white/5 border-b"
                    style={{ color: "hsl(var(--primary))", borderColor: "rgba(255,255,255,0.07)" }}>
                    <FolderOpen className="w-3.5 h-3.5" />
                    Choose from file
                    {settings.bgPreset === "custom" && settings.bgImage.startsWith("data:") && (
                      <span className="text-white/40 font-normal">(image loaded)</span>
                    )}
                  </button>

                  {/* URL input */}
                  <div className="flex gap-2 p-3">
                    <input
                      ref={urlRef}
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") applyCustomUrl(); }}
                      placeholder="Or paste image URL…"
                      className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20 min-w-0"
                    />
                    <button onClick={applyCustomUrl}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors"
                      style={{ background: "hsl(var(--primary))", color: "#fff" }}>
                      Apply
                    </button>
                  </div>

                  {settings.bgPreset === "custom" && settings.bgImage && (
                    <button onClick={() => { setBgPreset("dark"); setBgImage(""); setUrlInput(""); }}
                      className="w-full py-2 text-xs text-white/30 hover:text-white transition-colors border-t text-center"
                      style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                      Remove custom background
                    </button>
                  )}
                </div>
              </section>
            </>
          )}

          {tab === "account" && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "hsl(var(--primary) / 0.12)", border: "2px solid hsl(var(--primary) / 0.2)" }}>
                <User className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Account</h3>
                <p className="text-sm text-white/40">Coming Soon</p>
              </div>
              <div className="px-4 py-2 rounded-full text-xs font-semibold"
                style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.2)" }}>
                🚧 Under Construction
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
