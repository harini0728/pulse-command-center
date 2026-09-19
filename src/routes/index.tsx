import { createFileRoute } from "@tanstack/react-router";
import {
  Activity, Ambulance, Bed, Building2, Car, ChevronRight, CircleDot, Clock3, Cpu,
  FlaskConical, HeartPulse, History, Minus, Network, Play, Plus, RotateCcw, ShieldCheck,
  Siren, Stethoscope, Syringe, UserRound, Users,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Command Center — TransferPulse" },
    { name: "description", content: "Real-time predictive hospital acceptance for emergency transfers." },
    { property: "og:title", content: "TransferPulse Emergency Command Center" },
    { property: "og:description", content: "Predict hospital acceptance at ambulance arrival, not just current capacity." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: CommandCenter,
});

/* ---------- scenario model ---------- */
type Phase = 0 | 1 | 2 | 3 | 4;
type Tone = "success" | "warning" | "critical";
type EventItem = { time: string; title: string; detail?: string; tone: Tone | "signal" };
type Icon = ComponentType<{ className?: string }>;

const STEP_MS = 1700;      // gap between scenario phases
const TWEEN_MS = 1100;     // shared interpolation duration — every component uses this
const cityCareByPhase: Record<Phase, number> = { 0: 92, 1: 78, 2: 61, 3: 41, 4: 41 };
const NORTHSTAR = 84;
const READY_EVENT: EventItem = { time: "18:42:06", title: "Transfer intelligence ready", detail: "TR-2048 · all systems synchronized", tone: "signal" };
const phaseEvents: EventItem[] = [
  { time: "18:42:11", title: "ICU capacity changed", detail: "CityCare · 12 → 10", tone: "critical" },
  { time: "18:42:14", title: "Prediction recalculated", detail: "Arrival model · 78% → 61%", tone: "warning" },
  { time: "18:42:16", title: "Acceptance probability", detail: "CityCare · 61% → 41%", tone: "critical" },
  { time: "18:42:18", title: "Destination re-evaluated", detail: "CityCare → Northstar General · 84%", tone: "signal" },
];
const phaseLabels = ["Baseline", "ICU admission", "Recalculating", "Threshold breached", "Re-routed"];

const toneFor = (p: number): Tone => (p >= 75 ? "success" : p >= 55 ? "warning" : "critical");
const toneText: Record<Tone, string> = { success: "text-success", warning: "text-warning", critical: "text-critical" };
const toneStroke: Record<Tone, string> = { success: "stroke-success", warning: "stroke-warning", critical: "stroke-critical" };
const toneBg: Record<Tone, string> = { success: "bg-success", warning: "bg-warning", critical: "bg-critical" };
const toneBorder: Record<Tone, string> = { success: "border-success", warning: "border-warning", critical: "border-critical" };

const nav: Array<[string, Icon, boolean]> = [
  ["Command Center", CircleDot, true], ["Active Transfers", Ambulance, false],
  ["Hospital Network", Network, false], ["Simulation Lab", FlaskConical, false],
  ["Incident Timeline", History, false], ["Architecture", Cpu, false],
];

/* ---------- page ---------- */
function CommandCenter() {
  const [phase, setPhase] = useState<Phase>(0);
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([READY_EVENT]);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const rerouted = phase === 4;
  const cityCare = cityCareByPhase[phase];
  const probability = rerouted ? NORTHSTAR : cityCare;   // headline number follows the recommended hospital
  const tone = toneFor(probability);
  const done = rerouted && !running;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const play = () => {
    timers.current.forEach(clearTimeout);
    setPhase(0); setRunning(true);
    setEvents([{ time: "18:42:06", title: "Emergency scenario started", detail: "TR-2048 · live prediction model", tone: "signal" }]);
    ([1, 2, 3, 4] as Phase[]).forEach((next, i) => {
      timers.current.push(setTimeout(() => {
        setPhase(next);
        setEvents((c) => [...c, phaseEvents[i]].slice(-6));
        if (next === 4) setRunning(false);
      }, (i + 1) * STEP_MS));
    });
  };
  const reset = () => { timers.current.forEach(clearTimeout); setRunning(false); setPhase(0); setEvents([READY_EVENT]); };

  return (
    <TooltipProvider delayDuration={250}>
      <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[216px_1fr]">
        <Sidebar />
        <div className="min-w-0">
          <Topbar running={running} />
          <main className="mx-auto max-w-[1680px] p-3 sm:p-4 xl:p-5">
            {/* header + scenario controls */}
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-primary">Operational view / Sector 04</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight">Command Center</h1>
              </div>
              <div className="flex items-center gap-2">
                {done && <Button variant="quiet" size="lg" onClick={reset} className="h-11 rounded-sm font-mono text-xs uppercase"><RotateCcw />Reset scenario</Button>}
                <Button variant="command" size="lg" onClick={play} disabled={running} aria-busy={running} className="h-11 min-w-56 rounded-sm font-mono text-xs uppercase tracking-normal">
                  {running ? <Activity className="animate-pulse" /> : <Play />}
                  {running ? `Simulating · step ${phase}/4` : done ? "Replay scenario" : "Play emergency scenario"}
                </Button>
              </div>
            </div>

            {(running || done) && <ScenarioProgress phase={phase} running={running} />}
            {rerouted && <ReRouteBanner />}

            {/* row 1 — focal transfer + forecast window */}
            <section className="grid gap-3 xl:grid-cols-[1.35fr_.65fr]">
              <TransferPanel probability={probability} tone={tone} rerouted={rerouted} phase={phase} />
              <AcceptanceWindow phase={phase} cityCare={cityCare} rerouted={rerouted} />
            </section>

            {/* row 2 — map, rationale, events */}
            <section className="mt-3 grid gap-3 xl:grid-cols-[1.5fr_.75fr_.65fr]">
              <NetworkMap phase={phase} cityCare={cityCare} rerouted={rerouted} />
              <WhyPanel rerouted={rerouted} phase={phase} probability={probability} tone={tone} />
              <EventStream events={events} running={running} />
            </section>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

/* ---------- chrome ---------- */
function Sidebar() {
  return <aside className="border-b border-border bg-panel lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
    <div className="flex h-16 items-center gap-3 border-b border-border px-4">
      <div className="grid size-8 place-items-center border border-primary/50 bg-primary/10"><HeartPulse className="size-4 text-primary" /></div>
      <div><p className="text-sm font-bold tracking-tight">TRANSFER<span className="text-primary">PULSE</span></p><p className="font-mono text-[8px] text-muted-foreground">PREDICTIVE OPS</p></div>
    </div>
    <nav className="flex gap-1 overflow-x-auto p-2 lg:block lg:space-y-1 lg:p-3" aria-label="Primary">
      {nav.map(([label, Icon, active]) => <div key={label} aria-disabled={!active} title={active ? undefined : "Coming soon"} className={cn("flex min-w-max items-center gap-3 border-l-2 px-3 py-2.5 text-xs transition-colors", active ? "border-primary bg-primary/8 text-foreground" : "cursor-not-allowed border-transparent text-muted-foreground opacity-55")}>
        <Icon className={cn("size-4", active && "text-primary")} /><span>{label}</span>{!active && <span className="ml-auto hidden font-mono text-[7px] lg:block">LOCKED</span>}
      </div>)}
    </nav>
    <div className="hidden px-4 lg:absolute lg:bottom-5 lg:block lg:w-full">
      <p className="mb-3 font-mono text-[9px] text-muted-foreground">SYSTEM STATUS</p>
      <StatusDot label="Prediction engine" value="ONLINE" /><StatusDot label="Network sync" value="LIVE" />
      <div className="mt-4 border-t border-border pt-3 font-mono text-[8px] leading-4 text-muted-foreground">TP CORE v4.8.2<br />LATENCY 23MS</div>
    </div>
  </aside>;
}
function StatusDot({ label, value }: { label: string; value: string }) {
  return <div className="mb-2 flex items-center gap-2 text-[10px]"><span className="size-1.5 rounded-full bg-success status-pulse" /><span className="text-muted-foreground">{label}</span><span className="ml-auto font-mono text-success">{value}</span></div>;
}
function Topbar({ running }: { running: boolean }) {
  const [time, setTime] = useState("18:42:06");
  useEffect(() => { const id = setInterval(() => setTime(new Date().toLocaleTimeString("en-GB", { hour12: false })), 1000); return () => clearInterval(id); }, []);
  return <header className="flex h-16 items-center border-b border-border bg-background/90 px-3 backdrop-blur sm:px-5">
    <div className="hidden sm:block"><p className="text-xs font-medium">Emergency Operations Network</p><p className="font-mono text-[9px] text-muted-foreground">REGION NCR-04 · 12 HOSPITALS CONNECTED</p></div>
    <div className="ml-auto flex items-center gap-3 sm:gap-5">
      <span className={cn("flex items-center gap-2 border px-2 py-1 font-mono text-[9px] transition-colors duration-500", running ? "border-warning/40 text-warning" : "border-success/40 text-success")}><span className="size-1.5 rounded-full bg-current status-pulse" />{running ? "COMPUTING" : "LIVE"}</span>
      <div className="text-right"><p className="numeric text-xs">{time}</p><p className="font-mono text-[8px] text-muted-foreground">SIMULATED TIME</p></div>
      <div className="grid size-8 place-items-center border border-border bg-panel-strong"><UserRound className="size-4 text-muted-foreground" /></div>
    </div>
  </header>;
}
function PanelHeader({ title, meta, focal }: { title: string; meta?: ReactNode; focal?: boolean }) {
  return <div className="flex h-10 items-center border-b border-border px-4"><span className={cn("mr-2 size-1.5", focal ? "bg-primary" : "bg-muted-foreground/50")} /><h2 className={cn("font-mono text-[10px] font-semibold uppercase tracking-wider", !focal && "text-muted-foreground")}>{title}</h2>{meta && <span className="ml-auto font-mono text-[9px] text-muted-foreground">{meta}</span>}</div>;
}
function Hint({ children, tip }: { children: ReactNode; tip: string }) {
  return <Tooltip><TooltipTrigger asChild><span className="cursor-help underline decoration-dotted decoration-muted-foreground/50 underline-offset-2">{children}</span></TooltipTrigger><TooltipContent className="max-w-56 border-border bg-panel-strong font-mono text-[10px] text-foreground">{tip}</TooltipContent></Tooltip>;
}

/* shared number interpolation — same duration + easing everywhere */
function useTween(value: number) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current, t0 = performance.now(); let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / TWEEN_MS, 1), e = 1 - Math.pow(1 - p, 3);
      const v = start + (value - start) * e; setDisplay(v); from.current = v;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return display;
}
function Num({ value }: { value: number }) { return <>{Math.round(useTween(value))}</>; }

/* ---------- scenario progress ---------- */
function ScenarioProgress({ phase, running }: { phase: Phase; running: boolean }) {
  return <div className="mb-3 border border-border bg-panel px-4 py-2.5 banner-enter">
    <div className="flex items-center gap-3 font-mono text-[8px] uppercase text-muted-foreground"><span className="tracking-wider">Scenario progress</span><span className={cn("ml-auto", running ? "text-warning" : "text-success")}>{running ? `Step ${phase} of 4 · ${phaseLabels[phase]}` : "Complete · Destination re-evaluated"}</span></div>
    <div className="mt-2 grid grid-cols-4 gap-1">
      {[1, 2, 3, 4].map((s) => <div key={s} className="h-1 overflow-hidden bg-secondary"><div className={cn("h-full ease-command transition-[width] duration-1000", s <= phase ? "w-full" : "w-0", s === 4 && phase === 4 ? "bg-success" : s === 3 && phase >= 3 ? "bg-critical" : "bg-primary")} /></div>)}
    </div>
  </div>;
}
function ReRouteBanner() {
  return <div role="status" className="mb-3 flex flex-wrap items-center gap-3 border border-primary/60 bg-primary/10 px-4 py-3 banner-enter">
    <span className="grid size-8 place-items-center border border-primary/60 bg-primary/15"><Siren className="size-4 text-primary" /></span>
    <div><p className="font-mono text-[10px] font-semibold tracking-wider text-primary">DESTINATION RE-EVALUATED</p><p className="mt-0.5 text-xs text-muted-foreground"><span className="line-through">CityCare Medical</span><ChevronRight className="mx-1 inline size-3 text-primary" /><strong className="text-foreground">Northstar General</strong> · predicted acceptance <strong className="numeric text-success">84%</strong></p></div>
    <p className="ml-auto font-mono text-[9px] text-muted-foreground">REASON · CITYCARE ICU SATURATION PROJECTED AT ARRIVAL</p>
  </div>;
}

/* ---------- focal panel ---------- */
function TransferPanel({ probability, tone, rerouted, phase }: { probability: number; tone: Tone; rerouted: boolean; phase: Phase }) {
  const R = 54, C = 2 * Math.PI * R;
  const tweened = useTween(probability);
  const danger = phase >= 3 && !rerouted;
  return <article className="border bg-panel panel-focal">
    <PanelHeader focal title="Active emergency transfer" meta={<span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-critical status-pulse" />TR-2048 / PRIORITY 1</span>} />
    <div className="grid md:grid-cols-[1fr_320px]">
      {/* probability — first on mobile, right on desktop */}
      <div className={cn("relative order-first flex min-h-80 flex-col items-center justify-center overflow-hidden border-b border-border p-6 transition-colors duration-1000 md:order-last md:border-b-0 md:border-l", danger ? "bg-critical/6" : rerouted ? "bg-success/5" : "bg-primary/4")}>
        <div className={cn("absolute inset-0 focal-breathe transition-opacity", danger ? "bg-[radial-gradient(circle_at_center,var(--critical)_0%,transparent_60%)] opacity-[.08]" : "opacity-0")} />
        <svg viewBox="0 0 128 128" className="absolute top-8 size-56 -rotate-90" aria-hidden="true">
          <circle cx="64" cy="64" r={R} fill="none" className="stroke-border" strokeWidth="3" />
          <circle cx="64" cy="64" r={R} fill="none" className={cn("transition-[stroke] duration-700", toneStroke[tone])} strokeWidth="4" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - tweened / 100)} />
        </svg>
        <p className={cn("relative z-10 mt-2 numeric text-[88px] font-semibold leading-none transition-colors duration-700", toneText[tone])} aria-live="polite">{Math.round(tweened)}<span className="text-3xl font-medium">%</span></p>
        <p className="relative z-10 mt-3 text-center font-mono text-[10px] font-medium tracking-wider text-foreground">PREDICTED ACCEPTANCE</p>
        <p className="relative z-10 font-mono text-[9px] tracking-wider text-muted-foreground">AT ARRIVAL · {rerouted ? "NORTHSTAR" : "CITYCARE"}</p>
        <div className="relative z-10 mt-6 w-full space-y-1.5 border-t border-border pt-4">
          <StateLine label="Current capacity" value="AVAILABLE" tone="success" />
          <StateLine label="Arrival capacity" value={danger ? "AT RISK" : phase === 2 ? "TIGHTENING" : "AVAILABLE"} tone={danger ? "critical" : phase === 2 ? "warning" : "success"} />
          <StateLine label={<Hint tip="Agreement across 8 live factors and the last 15 minutes of network telemetry.">Confidence</Hint>} value={phase === 2 ? "MEDIUM" : "HIGH"} tone={phase === 2 ? "warning" : "success"} />
        </div>
      </div>

      {/* transfer summary */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2"><span className="border border-critical/40 bg-critical/10 px-2 py-1 font-mono text-[9px] tracking-wider text-critical">CRITICAL</span><span className="font-mono text-[10px] text-muted-foreground">AMB-17 · DISPATCHED 18:28 · CARDIAC / STEMI</span></div>
        <div className="mt-5 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 sm:gap-3">
          <Metric icon={Ambulance} label="Ambulance" value="AMB-17" sub="ALS UNIT" /><Arrow />
          <Metric icon={Clock3} label="ETA" value="14:32" sub="14 MIN" mono /><Arrow />
          <Metric icon={Building2} label="Recommended" value={rerouted ? "Northstar" : "CityCare"} sub={rerouted ? "GENERAL · 6.1 KM" : "MEDICAL · 4.8 KM"} highlight />
        </div>
        <div className="mt-5 border-t border-border pt-4"><p className="font-mono text-[9px] tracking-wider text-muted-foreground">PATIENT REQUIREMENTS</p><div className="mt-2 flex flex-wrap gap-2">{["ICU BED", "VENTILATOR", "CARDIOLOGY", "CATH LAB"].map(x => <span key={x} className="border border-border bg-secondary px-2 py-1 font-mono text-[9px]">{x}</span>)}</div></div>
        <div className={cn("mt-5 flex items-center gap-3 border-l-2 px-3 py-2.5 transition-colors duration-700", danger ? "border-critical bg-critical/6" : "border-primary bg-primary/6")}>
          <Building2 className={cn("size-4", danger ? "text-critical" : "text-primary")} />
          <div><p className="font-mono text-[8px] tracking-wider text-muted-foreground">{danger ? "RECOMMENDATION UNDER REVIEW" : "CURRENT RECOMMENDATION"}</p><p className="text-sm font-semibold">{rerouted ? "Northstar General" : "CityCare Medical Center"}</p></div>
          <span className={cn("ml-auto numeric text-sm", toneText[tone])}><Num value={probability} />%</span>
        </div>
      </div>
    </div>
  </article>;
}
function Arrow() { return <ChevronRight className="size-4 text-primary/70" />; }
function Metric({ icon: Icon, label, value, sub, mono, highlight }: { icon: Icon; label: string; value: string; sub: string; mono?: boolean; highlight?: boolean }) {
  return <div className="min-w-0"><div className="flex items-center gap-1.5 text-muted-foreground"><Icon className="size-3.5" /><p className="font-mono text-[8px] tracking-wider">{label.toUpperCase()}</p></div><p className={cn("mt-1 truncate text-base font-semibold tracking-tight transition-colors duration-500", mono && "numeric", highlight && "text-primary")}>{value}</p><p className="font-mono text-[8px] text-muted-foreground">{sub}</p></div>;
}
function StateLine({ label, value, tone }: { label: ReactNode; value: string; tone: Tone }) {
  return <div className="flex items-center justify-between font-mono text-[9px]"><span className="text-muted-foreground uppercase">{label}</span><span className={cn("flex items-center gap-1.5 transition-colors duration-500", toneText[tone])}><span className={cn("size-1 rounded-full", toneBg[tone])} />{value}</span></div>;
}

/* ---------- acceptance window ---------- */
function AcceptanceWindow({ phase, cityCare, rerouted }: { phase: Phase; cityCare: number; rerouted: boolean }) {
  const now = rerouted ? 88 : 92;                         // what a bed board would show today
  const arrival = rerouted ? NORTHSTAR : cityCare;        // what the model predicts
  const plus30 = rerouted ? 79 : Math.max(24, cityCare - 22);
  const t = useTween(arrival), t30 = useTween(plus30), tn = useTween(now);
  const y = (v: number) => 104 - v * 0.8;
  const tone = toneFor(arrival);
  const path = `M 20 ${y(tn)} C 110 ${y(tn)}, 150 ${y(t)}, 210 ${y(t)} S 330 ${y(t30)}, 380 ${y(t30)}`;
  return <article className="panel-quiet">
    <PanelHeader title="Acceptance window" meta="FORECAST HORIZON · 45 MIN" />
    <div className="p-4 sm:p-5">
      <p className="mb-3 text-[11px] leading-4 text-muted-foreground">Bed boards show <span className="text-foreground">now</span>. TransferPulse predicts <span className="text-primary">at arrival</span>.</p>
      <div className="grid grid-cols-3 gap-px border border-border bg-border">
        <TimeState label="Current" sub="NOW · 18:42" value={now} tone="success" muted />
        <TimeState label="At arrival" sub="ETA · +14 MIN" value={arrival} tone={tone} active />
        <TimeState label="+30 min" sub="POST-ARRIVAL" value={plus30} tone={toneFor(plus30)} muted />
      </div>
      <svg viewBox="0 0 400 120" className="mt-3 h-36 w-full overflow-visible" role="img" aria-label="Predicted hospital acceptance over time">
        <defs><linearGradient id="curveFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".18" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
        {[24, 44, 64, 84].map(v => <g key={v}><line x1="20" y1={v} x2="380" y2={v} className="stroke-border" strokeWidth="1" /><text x="386" y={v + 3} className="fill-muted-foreground font-mono" fontSize="7">{Math.round((104 - v) / 0.8)}</text></g>)}
        <line x1="20" y1="8" x2="20" y2="112" className="stroke-border" /><line x1="210" y1="8" x2="210" y2="112" className="stroke-primary/50" strokeDasharray="3 4" /><line x1="380" y1="8" x2="380" y2="112" className="stroke-border" />
        <text x="20" y="118" className="fill-muted-foreground font-mono" fontSize="7">NOW</text><text x="210" y="118" textAnchor="middle" className="fill-primary font-mono" fontSize="7">ARRIVAL</text><text x="380" y="118" textAnchor="end" className="fill-muted-foreground font-mono" fontSize="7">+30 MIN</text>
        <path d={`${path} L 380 104 L 20 104 Z`} fill="url(#curveFill)" className={cn("transition-colors duration-700", toneText[tone])} />
        <path d={path} fill="none" className={cn("transition-[stroke] duration-700", toneStroke[tone])} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="20" cy={y(tn)} r="3" className="fill-muted-foreground" />
        <circle cx="210" cy={y(t)} r="5" className={cn("transition-colors duration-700", tone === "critical" ? "fill-critical" : tone === "warning" ? "fill-warning" : "fill-success")} /><circle cx="210" cy={y(t)} r="9" fill="none" className={cn("transition-colors duration-700", toneStroke[tone])} strokeOpacity=".35" />
        <circle cx="380" cy={y(t30)} r="3" className="fill-muted-foreground" />
      </svg>
      <div className="mt-2 flex items-start gap-2 border-t border-border pt-3"><Activity className="mt-0.5 size-3.5 shrink-0 text-primary" /><p className="text-[10px] leading-4 text-muted-foreground">{rerouted ? "Northstar holds a stable acceptance window through and beyond arrival." : phase >= 3 ? "CityCare shows beds now, but projected ICU load closes the window before AMB-17 arrives." : phase >= 2 ? "Incoming ICU admissions are compressing the safe arrival window." : "Acceptance remains stable through the estimated arrival window."}</p></div>
    </div>
  </article>;
}
function TimeState({ label, sub, value, tone, active, muted }: { label: string; sub: string; value: number; tone: Tone; active?: boolean; muted?: boolean }) {
  return <div className={cn("relative p-3 transition-colors duration-700", active ? "bg-primary/8" : "bg-panel")}>
    {active && <span className="absolute inset-x-0 top-0 h-0.5 bg-primary" />}
    <p className={cn("font-mono text-[8px] uppercase tracking-wider", active ? "text-primary" : "text-muted-foreground")}>{label}</p>
    <p className="mt-0.5 font-mono text-[7px] text-muted-foreground">{sub}</p>
    <p className={cn("mt-2 numeric transition-colors duration-700", active ? "text-2xl font-semibold" : "text-lg", muted ? "text-foreground/80" : toneText[tone])}><Num value={value} />%</p>
    {active && <p className="mt-0.5 font-mono text-[7px] tracking-wider text-primary">PREDICTED</p>}
  </div>;
}

/* ---------- map ---------- */
const ROUTE_A = "M138 284 C230 260 335 205 508 126";
const ROUTE_B = "M138 284 C285 320 425 285 610 240";
function NetworkMap({ phase, cityCare, rerouted }: { phase: Phase; cityCare: number; rerouted: boolean }) {
  const aTone = toneFor(cityCare);
  const pathA = useRef<SVGPathElement>(null), pathB = useRef<SVGPathElement>(null);
  const [amb, setAmb] = useState({ x: 138, y: 284, len: 0 });
  const progress = Math.min(phase, 4) * 0.075;   // ambulance advances a little per phase
  useLayoutEffect(() => {
    const p = (rerouted ? pathB : pathA).current; if (!p) return;
    const len = p.getTotalLength(), pt = p.getPointAtLength(len * progress);
    setAmb({ x: pt.x, y: pt.y, len });
  }, [progress, rerouted]);
  return <article className="relative min-h-[480px] overflow-hidden panel-quiet">
    <PanelHeader title="Predictive network map" meta="TRAFFIC VECTOR / LIVE" />
    <div className="absolute inset-x-0 top-10 h-px bg-primary/12 map-scan" />
    <svg viewBox="0 0 760 390" className="absolute inset-x-0 bottom-0 h-[calc(100%-2.5rem)] w-full" aria-label="Ambulance and hospital network map">
      <g className="stroke-line" fill="none" strokeWidth="1"><path d="M20 82 L198 82 L240 126 L460 126 L520 68 L740 68" /><path d="M45 305 L180 240 L326 292 L466 230 L738 278" /><path d="M90 25 L148 190 L105 370 M350 20 L326 292 M620 20 L560 350" /><path d="M0 200 L120 190 L270 170 L420 180 L760 150" strokeOpacity=".5" /></g>
      {/* route A */}
      <g fill="none" className={cn("stroke-primary transition-opacity duration-1000", rerouted ? "opacity-15" : phase >= 3 ? "opacity-45" : "opacity-90")}><path ref={pathA} d={ROUTE_A} strokeWidth="3" strokeDasharray="9 7" className={cn(!rerouted && "route-flow")} /></g>
      {/* route B */}
      <g fill="none" className={cn("stroke-primary transition-opacity duration-1000", rerouted ? "opacity-95" : "opacity-0")}><path ref={pathB} d={ROUTE_B} strokeWidth="3" strokeDasharray="9 7" className={cn(rerouted && "route-flow")} /></g>
      {/* travelled */}
      <path d={rerouted ? ROUTE_B : ROUTE_A} fill="none" className="stroke-foreground/70 transition-[stroke-dashoffset] duration-1000 ease-command" strokeWidth="3" strokeLinecap="round" strokeDasharray={amb.len || 1} strokeDashoffset={(amb.len || 1) * (1 - progress)} />
      {/* ambulance */}
      <g style={{ transform: `translate(${amb.x}px, ${amb.y}px)`, transition: `transform ${TWEEN_MS}ms cubic-bezier(.2,.7,.2,1)` }}>
        <circle r="22" className="fill-primary/10 soft-pulse" style={{ transformOrigin: "0 0" }} /><circle r="16" className="fill-background stroke-primary" strokeWidth="1.5" />
        <foreignObject x="-8" y="-8" width="16" height="16"><Ambulance className="size-4 text-primary" /></foreignObject>
        <text x="24" y="-2" className="fill-primary font-mono" fontSize="10">AMB-17</text><text x="24" y="10" className="fill-muted-foreground font-mono" fontSize="8">ETA 14:32</text>
      </g>
    </svg>
    <MapNode x="67%" y="29%" name="CITYCARE" value={cityCare} tone={aTone} selected={!rerouted} rejected={rerouted} unsafe={phase >= 3 && !rerouted} tip="Med Center · 12 ICU · Cath lab" />
    <MapNode x="79%" y="58%" name="NORTHSTAR" value={NORTHSTAR} tone="success" selected={rerouted} tip="General · 18 ICU · Cath lab" />
    <MapNode x="35%" y="28%" name="ST. JOSEPH" value={43} tone="critical" tip="No cardiology on call" />
    <MapNode x="43%" y="72%" name="METRO TRAUMA" value={68} tone="warning" tip="Trauma L1 · ICU 3 free" />
    <div className="absolute bottom-3 left-3 flex gap-3 border border-border bg-background/80 px-2 py-1 font-mono text-[8px] text-muted-foreground backdrop-blur-sm"><span className="flex items-center gap-1"><i className="size-1.5 rounded-full bg-success" />HIGH</span><span className="flex items-center gap-1"><i className="size-1.5 rounded-full bg-warning" />UNCERTAIN</span><span className="flex items-center gap-1"><i className="size-1.5 rounded-full bg-critical" />LOW</span><span className="ml-2 border-l border-border pl-2">VALUES = ACCEPTANCE AT ARRIVAL</span></div>
  </article>;
}
function MapNode({ x, y, name, value, tone, selected, rejected, unsafe, tip }: { x: string; y: string; name: string; value: number; tone: Tone; selected?: boolean; rejected?: boolean; unsafe?: boolean; tip: string }) {
  return <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}>
    <Tooltip><TooltipTrigger asChild>
      <div className={cn("group flex cursor-default flex-col items-center transition-opacity duration-700", rejected && "opacity-60")}>
        <span className={cn("relative grid size-9 place-items-center rounded-full border bg-background transition-all duration-700 group-hover:scale-105", toneBorder[tone], toneText[tone], selected && "ring-4 ring-primary/15 shadow-[0_0_0_1px_var(--command-glow)]")}>
          {unsafe && <span className="absolute inset-0 rounded-full border border-critical soft-pulse" />}
          {selected && !unsafe && <span className="absolute -inset-1 rounded-full border border-primary/40" />}
          <Building2 className="size-4" />
        </span>
        <div className={cn("mt-1.5 border bg-background/92 px-2 py-1 text-center backdrop-blur-sm transition-colors duration-700", selected ? "border-primary/60" : "border-border")}>
          <p className="font-mono text-[8px] tracking-wider">{name}</p>
          <p className={cn("numeric text-sm font-semibold transition-colors duration-700", toneText[tone])}><Num value={value} />%</p>
        </div>
        <span className={cn("mt-1 px-1.5 py-0.5 font-mono text-[7px] tracking-wider transition-all duration-500", selected ? "bg-primary text-primary-foreground opacity-100" : "opacity-0")}>DESTINATION</span>
      </div>
    </TooltipTrigger><TooltipContent className="border-border bg-panel-strong font-mono text-[10px] text-foreground">{tip}</TooltipContent></Tooltip>
  </div>;
}

/* ---------- rationale ---------- */
type FactorRow = { icon: Icon; label: string; value: string; positive: boolean; note: string };
function WhyPanel({ rerouted, phase, probability, tone }: { rerouted: boolean; phase: Phase; probability: number; tone: Tone }) {
  const icuBad = phase >= 3 && !rerouted, arrivalsBad = phase >= 1 && !rerouted;
  const rows: FactorRow[] = [
    { icon: Bed, label: "ICU capacity", value: rerouted ? "9 free" : icuBad ? "1 at arrival" : phase >= 1 ? "10 → 8 proj." : "12 free", positive: !icuBad && !(phase === 2), note: rerouted ? "Stable through +30 min" : icuBad ? "Saturates before ETA" : phase >= 1 ? "Trending down" : "Comfortable margin" },
    { icon: Stethoscope, label: "Specialist", value: "Cardiology on call", positive: true, note: "Interventional team ready" },
    { icon: Syringe, label: "Equipment", value: "Cath lab · Vent", positive: true, note: "Matches all 4 requirements" },
    { icon: Clock3, label: "ETA", value: rerouted ? "16 min" : "14 min", positive: !rerouted || true, note: rerouted ? "+2 min vs CityCare" : "Shortest route" },
    { icon: Users, label: "Expected incoming", value: rerouted ? "+0 ICU" : phase >= 1 ? "+2 ICU" : "+1 ICU", positive: !arrivalsBad, note: arrivalsBad ? "Two admissions ahead of AMB-17" : "No competing transfers" },
    { icon: Car, label: "Traffic", value: rerouted ? "Light" : phase >= 2 ? "Moderate" : "Light", positive: !(phase >= 2 && !rerouted), note: rerouted ? "Ring road clear" : phase >= 2 ? "Slowing on NH-48" : "Free-flowing" },
  ];
  const pos = rows.filter(r => r.positive).length;
  return <article className="panel-quiet">
    <PanelHeader title="Why this hospital?" meta="EXPLAINABILITY" />
    <div className="p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid size-9 place-items-center border border-primary/40 bg-primary/10"><ShieldCheck className="size-4 text-primary" /></div>
        <div className="min-w-0"><p className="truncate text-xs font-semibold">{rerouted ? "Northstar General" : "CityCare Medical Center"}</p><p className="font-mono text-[8px] text-muted-foreground">MODEL DECISION · {pos} FOR / {rows.length - pos} AGAINST</p></div>
        <p className={cn("ml-auto numeric text-2xl font-semibold transition-colors duration-700", toneText[tone])}><Num value={probability} />%</p>
      </div>
      <div className="divide-y divide-border border-y border-border">
        {rows.map((r) => <Factor key={r.label} {...r} />)}
      </div>
      <p className="mt-3 font-mono text-[8px] leading-4 text-muted-foreground">{rerouted ? "NORTHSTAR SELECTED · ACCEPTANCE STABLE THROUGH ARRIVAL WINDOW" : icuBad ? "CITYCARE BELOW 50% THRESHOLD · RE-EVALUATING DESTINATION" : "CITYCARE HOLDS · MONITORING ICU INFLOW"}</p>
    </div>
  </article>;
}
function Factor({ icon: Icon, label, value, positive, note }: FactorRow) {
  return <div className="flex items-center gap-3 py-2.5 transition-colors duration-500 hover:bg-secondary/40">
    <span className={cn("grid size-5 shrink-0 place-items-center border transition-colors duration-500", positive ? "border-success/50 bg-success/10 text-success" : "border-critical/50 bg-critical/10 text-critical")}>{positive ? <Plus className="size-3" /> : <Minus className="size-3" />}</span>
    <Icon className="size-3.5 shrink-0 text-muted-foreground" />
    <div className="min-w-0 flex-1"><p className="font-mono text-[8px] tracking-wider text-muted-foreground">{label.toUpperCase()}</p><p className="truncate text-[11px] font-medium">{value}</p></div>
    <p className={cn("max-w-28 text-right font-mono text-[8px] leading-3 transition-colors duration-500", positive ? "text-muted-foreground" : "text-critical")}>{note}</p>
  </div>;
}

/* ---------- events ---------- */
function EventStream({ events, running }: { events: EventItem[]; running: boolean }) {
  return <article className="panel-quiet">
    <PanelHeader title="Live event stream" meta={<span className={cn(running && "text-warning")}>{running ? "RECEIVING" : "MONITORING"}</span>} />
    <div className="p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-border pb-3"><span className={cn("size-1.5 rounded-full", running ? "bg-warning status-pulse" : "bg-success")} /><span className="font-mono text-[8px] tracking-wider text-muted-foreground">EVENT BUS · CHANNEL TR-2048</span><span className="ml-auto numeric text-[8px] text-muted-foreground">{events.length} EVENTS</span></div>
      <ol className="relative">
        {events.map((e, i) => <li key={`${e.time}-${e.title}`} className={cn("relative border-l py-2.5 pl-4 event-enter", i === events.length - 1 ? "border-primary/50" : "border-border")}>
          <span className={cn("absolute -left-[4.5px] top-3.5 size-2 rounded-full border-2 border-panel", e.tone === "critical" ? "bg-critical" : e.tone === "warning" ? "bg-warning" : "bg-primary")} />
          <p className="numeric text-[9px] text-primary">{e.time}</p>
          <p className="mt-0.5 text-[11px] font-medium">{e.title}</p>
          {e.detail && <p className={cn("mt-0.5 numeric text-[9px] leading-4", e.tone === "critical" ? "text-critical/90" : "text-muted-foreground")}>{e.detail}</p>}
        </li>)}
      </ol>
    </div>
  </article>;
}
