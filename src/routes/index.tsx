import { createFileRoute } from "@tanstack/react-router";
import {
  Activity, Ambulance, Bed, Building2, Check, ChevronRight, CircleDot,
  Clock3, Cpu, FlaskConical, HeartPulse, Map, Network, Play, RotateCcw,
  RouteIcon, ShieldCheck, Siren, Stethoscope, History, UserRound,
} from "lucide-react";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { Button } from "@/components/ui/button";
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

type Phase = 0 | 1 | 2 | 3 | 4;
type EventItem = { time: string; title: string; detail: string; tone?: "critical" | "warning" | "signal" };

const phaseProbability: Record<Phase, number> = { 0: 92, 1: 78, 2: 61, 3: 41, 4: 84 };
const phaseEvents: EventItem[] = [
  { time: "18:42:11", title: "ICU capacity changed", detail: "CityCare · 12 → 10 beds", tone: "critical" },
  { time: "18:42:14", title: "Prediction recalculated", detail: "Arrival model · 78% → 61%", tone: "warning" },
  { time: "18:42:16", title: "Acceptance probability", detail: "CityCare · 61% → 41%", tone: "critical" },
  { time: "18:42:18", title: "Destination re-evaluated", detail: "CityCare → Northstar General", tone: "signal" },
];

const nav: Array<[string, ComponentType<{ className?: string }>, boolean]> = [
  ["Command Center", CircleDot, true], ["Active Transfers", Ambulance, false],
  ["Hospital Network", Network, false], ["Simulation Lab", FlaskConical, false],
  ["Incident Timeline", History, false], ["Architecture", Cpu, false],
];

function CommandCenter() {
  const [phase, setPhase] = useState<Phase>(0);
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([
    { time: "18:42:06", title: "Transfer intelligence ready", detail: "TR-2048 · all systems synchronized", tone: "signal" },
  ]);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const probability = phaseProbability[phase];
  const rerouted = phase === 4;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const play = () => {
    timers.current.forEach(clearTimeout);
    setPhase(0); setRunning(true);
    setEvents([{ time: "18:42:06", title: "Emergency scenario started", detail: "TR-2048 · live prediction model", tone: "signal" }]);
    [1, 2, 3, 4].forEach((next, index) => {
      timers.current.push(setTimeout(() => {
        const nextEvent = phaseEvents[index];
        setPhase(next as Phase);
        if (nextEvent) setEvents((current) => [nextEvent, ...current].slice(0, 5));
        if (next === 4) setRunning(false);
      }, (index + 1) * 1500));
    });
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    setRunning(false);
    setPhase(0);
    setEvents([{ time: "18:42:06", title: "Transfer intelligence ready", detail: "TR-2048 · all systems synchronized", tone: "signal" }]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[216px_1fr]">
      <Sidebar />
      <div className="min-w-0">
        <Topbar running={running} />
        <main className="mx-auto max-w-[1680px] p-3 sm:p-4 xl:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><p className="font-mono text-[10px] uppercase text-primary">Operational view / Sector 04</p><h1 className="mt-1 text-xl font-semibold">Command Center</h1></div>
            <div className="flex items-center gap-2">
              {rerouted && <Button variant="outline" size="lg" onClick={reset} className="h-11 rounded-sm font-mono text-xs uppercase"><RotateCcw />Reset</Button>}
              <Button variant="command" size="lg" onClick={play} disabled={running} className="h-11 rounded-sm font-mono text-xs uppercase tracking-normal">
                {running ? <Activity className="animate-pulse" /> : <Play />} {running ? `Simulating · ${phase}/4` : rerouted ? "Replay scenario" : "Play emergency scenario"}
              </Button>
            </div>
          </div>

          {(running || rerouted) && <div className="mb-3 flex items-center gap-3 font-mono text-[8px] text-muted-foreground"><span>SCENARIO PROGRESS</span><div className="h-px flex-1 bg-border"><div className="h-px bg-primary transition-all duration-700" style={{ width: `${phase * 25}%` }} /></div><span className="text-primary">{phase * 25}%</span></div>}

          {rerouted && <ReRouteBanner />}

          <section className="grid gap-3 xl:grid-cols-[1.3fr_.7fr]">
            <TransferPanel probability={probability} rerouted={rerouted} phase={phase} />
            <AcceptanceWindow phase={phase} probability={probability} rerouted={rerouted} />
          </section>

          <section className="mt-3 grid gap-3 xl:grid-cols-[1.45fr_.72fr_.68fr]">
            <NetworkMap phase={phase} rerouted={rerouted} />
            <WhyPanel rerouted={rerouted} phase={phase} />
            <EventStream events={events} running={running} />
          </section>
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  return <aside className="border-b border-border bg-panel lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
    <div className="flex h-16 items-center gap-3 border-b border-border px-4">
      <div className="grid size-8 place-items-center border border-primary/50 bg-primary/10"><HeartPulse className="size-4 text-primary" /></div>
      <div><p className="text-sm font-bold">TRANSFER<span className="text-primary">PULSE</span></p><p className="font-mono text-[8px] text-muted-foreground">PREDICTIVE OPS</p></div>
    </div>
    <nav className="flex gap-1 overflow-x-auto p-2 lg:block lg:space-y-1 lg:p-3" aria-label="Primary">
      {nav.map(([label, Icon, active]) => <div key={label} aria-disabled={!active} className={cn("flex min-w-max items-center gap-3 border-l-2 px-3 py-2.5 text-xs", active ? "border-primary bg-primary/8 text-foreground" : "cursor-not-allowed border-transparent text-muted-foreground opacity-55")} title={active ? undefined : "Coming soon"}>
        <Icon className={cn("size-4", active && "text-primary")} /><span>{label}</span>{!active && <span className="ml-auto hidden font-mono text-[7px] lg:block">LOCKED</span>}
      </div>)}
    </nav>
    <div className="hidden px-4 lg:absolute lg:bottom-5 lg:block lg:w-full">
      <p className="mb-3 font-mono text-[9px] text-muted-foreground">SYSTEM STATUS</p>
      <StatusDot label="Prediction engine" value="ONLINE" /><StatusDot label="Network sync" value="LIVE" />
      <div className="mt-4 border-t border-border pt-3 font-mono text-[8px] text-muted-foreground">TP CORE v4.8.2<br />LATENCY 23MS</div>
    </div>
  </aside>;
}

function StatusDot({ label, value }: { label: string; value: string }) {
  return <div className="mb-2 flex items-center gap-2 text-[10px]"><span className="size-1.5 rounded-full bg-success shadow-[0_0_8px_currentColor] text-success" /><span className="text-muted-foreground">{label}</span><span className="ml-auto font-mono text-success">{value}</span></div>;
}

function Topbar({ running }: { running: boolean }) {
  const [time, setTime] = useState("18:42:06");
  useEffect(() => { const id = setInterval(() => setTime(new Date().toLocaleTimeString("en-GB", { hour12: false })), 1000); return () => clearInterval(id); }, []);
  return <header className="flex h-16 items-center border-b border-border bg-background/90 px-3 backdrop-blur sm:px-5">
    <div className="hidden sm:block"><p className="text-xs font-medium">Emergency Operations Network</p><p className="font-mono text-[9px] text-muted-foreground">REGION NCR-04 · 12 HOSPITALS CONNECTED</p></div>
    <div className="ml-auto flex items-center gap-3 sm:gap-5">
      <span className={cn("flex items-center gap-2 border px-2 py-1 font-mono text-[9px]", running ? "border-warning/40 text-warning" : "border-success/40 text-success")}><span className="size-1.5 rounded-full bg-current" />{running ? "COMPUTING" : "LIVE"}</span>
      <div className="text-right"><p className="font-mono text-xs">{time}</p><p className="font-mono text-[8px] text-muted-foreground">SIMULATED TIME</p></div>
      <div className="grid size-8 place-items-center border border-border bg-panel-strong"><UserRound className="size-4 text-muted-foreground" /></div>
    </div>
  </header>;
}

function PanelHeader({ title, meta }: { title: string; meta?: string }) {
  return <div className="flex h-10 items-center border-b border-border px-4"><span className="mr-2 size-1.5 bg-primary" /><h2 className="font-mono text-[10px] font-semibold uppercase">{title}</h2>{meta && <span className="ml-auto font-mono text-[9px] text-muted-foreground">{meta}</span>}</div>;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  useEffect(() => {
    const start = previous.current;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - started) / 850, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (value - start) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else previous.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{display}</>;
}

function TransferPanel({ probability, rerouted, phase }: { probability: number; rerouted: boolean; phase: Phase }) {
  const danger = phase >= 3 && !rerouted;
  const circumference = 2 * Math.PI * 54;
  return <article className="border border-primary/25 bg-panel shadow-[0_16px_50px_oklch(0_0_0_/_0.24)] transition-colors duration-700">
    <PanelHeader title="Active emergency transfer" meta="TR-2048 / PRIORITY 1" />
    <div className="grid md:grid-cols-[1fr_300px]">
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2"><span className="border border-critical/40 bg-critical/10 px-2 py-1 font-mono text-[9px] text-critical">CRITICAL</span><span className="font-mono text-[10px] text-muted-foreground">AMB-17 · DISPATCHED 18:28</span></div>
        <div className="mt-5 flex flex-wrap items-center gap-3 sm:gap-4">
          <Metric icon={Ambulance} label="Ambulance" value="AMB-17" /><ChevronRight className="hidden size-4 text-primary sm:block" /><Metric icon={Clock3} label="ETA" value="14:32" mono /><ChevronRight className="hidden size-4 text-primary sm:block" /><Metric icon={Building2} label="Recommended" value={rerouted ? "NORTHSTAR" : "CITYCARE"} />
        </div>
        <div className="mt-5 border-t border-border pt-4"><p className="font-mono text-[9px] text-muted-foreground">PATIENT REQUIREMENTS</p><div className="mt-2 flex flex-wrap gap-2">{["ICU", "VENTILATOR", "CARDIOLOGY"].map(x => <span key={x} className="border border-border bg-secondary px-2 py-1 font-mono text-[9px]">{x}</span>)}</div></div>
        <div className="mt-5 flex items-center gap-3 border-l-2 border-primary bg-primary/5 px-3 py-2"><Building2 className="size-4 text-primary" /><div><p className="font-mono text-[8px] text-muted-foreground">CURRENT RECOMMENDATION</p><p className="text-sm font-semibold">{rerouted ? "NORTHSTAR GENERAL" : "CITYCARE MEDICAL CENTER"}</p></div></div>
      </div>
      <div className={cn("relative flex min-h-72 flex-col items-center justify-center overflow-hidden border-t border-border p-5 transition-colors duration-700 md:border-l md:border-t-0", danger ? "bg-critical/5" : "bg-primary/4")}>
        <svg viewBox="0 0 128 128" className="absolute size-52 -rotate-90" aria-hidden="true"><circle cx="64" cy="64" r="54" fill="none" className="stroke-border" strokeWidth="4" /><circle cx="64" cy="64" r="54" fill="none" className={cn("transition-all duration-1000", danger ? "stroke-critical" : rerouted ? "stroke-success" : phase >= 2 ? "stroke-warning" : "stroke-success")} strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - probability / 100)} /></svg>
        <p className={cn("relative z-10 font-mono text-7xl font-semibold transition-colors duration-700", danger ? "text-critical" : rerouted ? "text-success" : phase >= 2 ? "text-warning" : "text-success")}><AnimatedNumber value={probability} /><span className="text-3xl">%</span></p>
        <p className="mt-2 text-center font-mono text-[9px] text-muted-foreground">PREDICTED ACCEPTANCE<br />AT ARRIVAL</p>
        <div className="relative z-10 mt-8 w-full space-y-2 border-t border-border pt-4"><StateLine label="Current capacity" value="AVAILABLE" /><StateLine label="Arrival capacity" value={danger ? "AT RISK" : "AVAILABLE"} warning={danger} /><StateLine label="Confidence" value="HIGH" /></div>
      </div>
    </div>
  </article>;
}

function Metric({ icon: Icon, label, value, mono }: { icon: ComponentType<{ className?: string }>; label: string; value: string; mono?: boolean }) { return <div><div className="flex items-center gap-2 text-muted-foreground"><Icon className="size-3.5" /><p className="font-mono text-[8px]">{label.toUpperCase()}</p></div><p className={cn("mt-1 text-sm font-medium", mono && "font-mono")}>{value}</p></div>; }
function StateLine({ label, value, warning }: { label: string; value: string; warning?: boolean }) { return <div className="flex justify-between font-mono text-[8px]"><span className="text-muted-foreground">{label.toUpperCase()}</span><span className={warning ? "text-critical" : "text-success"}>{value}</span></div>; }

function AcceptanceWindow({ phase, probability, rerouted }: { phase: Phase; probability: number; rerouted: boolean }) {
  const end = rerouted ? 69 : Math.max(28, probability - 31);
  const path = `M 10 30 C 90 31, 145 ${phase >= 2 && !rerouted ? 40 : 30}, 210 ${110 - probability * .65} S 330 ${105 - end * .6}, 390 ${105 - end * .6}`;
  return <article className="border border-border bg-panel"><PanelHeader title="Acceptance window" meta="FORECAST / 45 MIN" /><div className="p-4 sm:p-5">
    <div className="mb-4 grid grid-cols-3 gap-px bg-border"><TimeState label="Current" sub="NOW" value={rerouted ? 84 : 92} tone="success" /><TimeState label="At arrival" sub="ETA · 14 MIN" value={probability} tone={phase >= 3 && !rerouted ? "critical" : phase >= 2 && !rerouted ? "warning" : "success"} active /><TimeState label="Forecast" sub="+30 MIN" value={end} tone="warning" /></div>
    <svg viewBox="0 0 400 120" className="h-36 w-full overflow-visible" role="img" aria-label="Predicted hospital acceptance over time">
      {[30,60,90].map(y => <line key={y} x1="0" y1={y} x2="400" y2={y} className="stroke-border" strokeWidth="1" />)}
      <line x1="210" y1="8" x2="210" y2="112" className="stroke-primary/40" strokeDasharray="3 4" />
      <path d={path} fill="none" className={cn("transition-all duration-1000", phase >= 3 && !rerouted ? "stroke-critical" : phase >= 2 && !rerouted ? "stroke-warning" : "stroke-success")} strokeWidth="3" />
      <circle cx="210" cy={110 - probability * .65} r="4" className={phase >= 3 && !rerouted ? "fill-critical" : "fill-primary"} />
    </svg>
    <div className="flex items-start gap-2 border-t border-border pt-3"><Activity className="mt-0.5 size-3.5 text-primary" /><p className="text-[10px] leading-4 text-muted-foreground">{rerouted ? "Northstar maintains a stable acceptance window beyond arrival." : phase >= 2 ? "Projected ICU load is compressing the safe arrival window." : "Acceptance remains stable through the estimated arrival window."}</p></div>
  </div></article>;
}

function TimeState({ label, sub, value, tone, active }: { label: string; sub: string; value: number; tone: string; active?: boolean }) { return <div className={cn("bg-background/55 p-3", active && "bg-primary/6")}><p className={cn("font-mono text-[8px] uppercase", active ? "text-primary" : "text-muted-foreground")}>{label}</p><p className="mt-1 font-mono text-[7px] text-muted-foreground">{sub}</p><p className={cn("mt-2 font-mono text-xl", tone === "success" ? "text-success" : tone === "critical" ? "text-critical" : "text-warning")}><AnimatedNumber value={value} />%</p></div>; }

function NetworkMap({ phase, rerouted }: { phase: Phase; rerouted: boolean }) {
  const aTone = phase >= 3 ? "critical" : phase >= 2 ? "warning" : "success";
  return <article className="relative min-h-[460px] overflow-hidden border border-border bg-panel shadow-[0_16px_50px_oklch(0_0_0_/_0.18)]"><PanelHeader title="Predictive network map" meta="TRAFFIC VECTOR / LIVE" />
    <div className="absolute inset-x-0 top-10 h-px bg-primary/15 map-scan" />
    <svg viewBox="0 0 760 390" className="absolute inset-x-0 bottom-0 h-[calc(100%-2.5rem)] w-full" aria-label="Ambulance and hospital network map">
      <g className="stroke-line" fill="none" strokeWidth="1"><path d="M20 82 L198 82 L240 126 L460 126 L520 68 L740 68" /><path d="M45 305 L180 240 L326 292 L466 230 L738 278" /><path d="M90 25 L148 190 L105 370 M350 20 L326 292 M620 20 L560 350" /></g>
      <g fill="none" className={cn("transition-all duration-1000 stroke-primary", rerouted ? "opacity-25" : "opacity-90")} strokeWidth="3" strokeDasharray="9 7"><path d="M138 284 C230 260 335 205 508 126" className="route-flow" /></g>
      <g fill="none" className={cn("transition-all duration-1000 stroke-primary", rerouted ? "opacity-100" : "opacity-0")} strokeWidth="3" strokeDasharray="9 7"><path d="M138 284 C285 320 425 285 610 240" className="route-flow" /></g>
    </svg>
    <MapNode x="67%" y="29%" name="CITYCARE" value={phase === 0 ? 92 : phase === 1 ? 78 : phase === 2 ? 61 : 41} tone={aTone} selected={!rerouted} unsafe={phase >= 3} />
    <MapNode x="79%" y="58%" name="NORTHSTAR" value={84} tone="success" selected={rerouted} />
    <MapNode x="35%" y="28%" name="ST. JOSEPH" value={43} tone="critical" />
    <MapNode x="43%" y="72%" name="METRO TRAUMA" value={68} tone="warning" />
    <div className="absolute bottom-[19%] left-[16%] flex items-center gap-2"><span className="relative grid size-9 place-items-center rounded-full border border-primary bg-background text-primary shadow-[0_0_18px_var(--command-glow)]"><span className="absolute inset-0 rounded-full border border-primary soft-pulse" /><Ambulance className="size-4" /></span><div><p className="font-mono text-[9px] text-primary">AMB-17</p><p className="font-mono text-[8px] text-muted-foreground">ETA 14:32</p></div></div>
    <div className="absolute bottom-3 left-3 flex gap-3 bg-background/75 px-2 py-1 font-mono text-[8px] text-muted-foreground"><span><b className="text-success">●</b> HIGH</span><span><b className="text-warning">●</b> UNCERTAIN</span><span><b className="text-critical">●</b> LOW</span></div>
  </article>;
}

function MapNode({ x, y, name, value, tone, selected, unsafe }: { x: string; y: string; name: string; value: number; tone: string; selected?: boolean; unsafe?: boolean }) {
  return <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}><div className="flex flex-col items-center"><span className={cn("relative grid size-9 place-items-center rounded-full border bg-background transition-all duration-700", tone === "success" ? "border-success text-success" : tone === "warning" ? "border-warning text-warning" : "border-critical text-critical", selected && "ring-4 ring-primary/10")}>
    {unsafe && <span className="absolute inset-0 rounded-full border border-critical soft-pulse" />}<Building2 className="size-4" /></span><div className={cn("mt-1 border bg-background/90 px-2 py-1 text-center", selected ? "border-primary/50" : "border-border")}><p className="font-mono text-[8px]">{name}</p><p className={cn("font-mono text-sm font-semibold", tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-critical")}>{value}%</p></div>{selected && <span className="mt-1 bg-primary px-1.5 py-0.5 font-mono text-[7px] text-primary-foreground">DESTINATION</span>}</div></div>;
}

function WhyPanel({ rerouted, phase }: { rerouted: boolean; phase: Phase }) {
  return <article className="border border-border bg-panel"><PanelHeader title="Why this hospital?" meta="EXPLAINABILITY" /><div className="p-4">
    <div className="mb-5 flex items-center gap-3"><div className="grid size-9 place-items-center border border-primary/40 bg-primary/10"><ShieldCheck className="size-4 text-primary" /></div><div><p className="text-xs font-semibold">{rerouted ? "Northstar General" : "CityCare Medical"}</p><p className="font-mono text-[8px] text-muted-foreground">MODEL DECISION · 8 FACTORS</p></div></div>
    <Factor icon={Bed} label="ICU capacity" value={rerouted ? "79%" : phase >= 3 ? "31%" : "82%"} progress={rerouted ? 79 : phase >= 3 ? 31 : 82} warning={phase >= 3 && !rerouted} />
    <Factor icon={Stethoscope} label="Specialist" value="AVAILABLE" progress={100} />
    <Factor icon={Activity} label="Equipment" value="READY" progress={94} />
    <Factor icon={Clock3} label="Traffic / ETA" value={rerouted ? "16 MIN" : "14 MIN"} progress={76} />
    <Factor icon={Ambulance} label="Expected arrivals" value={rerouted ? "+0" : phase > 0 ? "+2" : "+1"} progress={rerouted ? 90 : phase > 0 ? 28 : 67} warning={!rerouted && phase > 0} />
    <Factor icon={Check} label="Acceptance reliability" value={rerouted ? "91%" : "88%"} progress={rerouted ? 91 : 88} />
    <div className="mt-5 border-t border-border pt-4"><div className="flex items-end justify-between"><p className="font-mono text-[9px] text-muted-foreground">PREDICTED ACCEPTANCE</p><p className="font-mono text-3xl text-success">{rerouted ? 84 : phaseProbability[phase]}%</p></div></div>
  </div></article>;
}

function Factor({ icon: Icon, label, value, progress, warning }: { icon: ComponentType<{ className?: string }>; label: string; value: string; progress: number; warning?: boolean }) { return <div className="mb-4"><div className="mb-1.5 flex items-center gap-2"><Icon className="size-3 text-muted-foreground" /><span className="font-mono text-[8px] text-muted-foreground">{label.toUpperCase()}</span><span className={cn("ml-auto font-mono text-[8px]", warning ? "text-critical" : "text-foreground")}>{value}</span></div><div className="h-1 bg-secondary"><div className={cn("h-full transition-all duration-1000", warning ? "bg-critical" : "bg-primary")} style={{ width: `${progress}%` }} /></div></div>; }

function EventStream({ events, running }: { events: EventItem[]; running: boolean }) {
  return <article className="border border-border bg-panel"><PanelHeader title="Live event stream" meta={running ? "RECEIVING" : "MONITORING"} /><div className="p-4"><div className="mb-4 flex items-center gap-2 border-b border-border pb-3"><span className={cn("size-1.5 rounded-full bg-success", running && "animate-pulse")} /><span className="font-mono text-[8px] text-muted-foreground">EVENT BUS · CHANNEL TR-2048</span></div><div className="space-y-0">
    {events.map((event) => <div key={`${event.time}-${event.title}`} className="relative border-l border-border py-3 pl-4 event-enter"><span className={cn("absolute -left-1 top-4 size-2 rounded-full border border-panel", event.tone === "critical" ? "bg-critical" : event.tone === "warning" ? "bg-warning" : "bg-primary")} /><p className="font-mono text-[8px] text-primary">{event.time}</p><p className="mt-1 text-[11px] font-medium">{event.title}</p><p className="mt-0.5 font-mono text-[8px] leading-4 text-muted-foreground">{event.detail}</p></div>)}
  </div></div></article>;
}

function ReRouteBanner() { return <div className="mb-3 flex flex-wrap items-center gap-3 border border-primary/50 bg-primary/8 px-4 py-3 animate-fade-in"><Siren className="size-4 text-primary" /><div><p className="font-mono text-[9px] text-primary">DESTINATION RE-EVALUATED</p><p className="text-xs">CityCare Medical <ChevronRight className="mx-1 inline size-3" /> <strong>Northstar General</strong></p></div><p className="ml-auto font-mono text-[9px] text-muted-foreground">CITYCARE PROJECTED ICU SATURATION AT ARRIVAL</p></div>; }