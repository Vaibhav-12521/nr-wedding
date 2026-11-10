"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Mandala } from "@/components/decor";
import { Seal } from "@/components/site/seal";
import { Toran } from "@/components/site/toran";
import { DOORS_KEY as KEY } from "@/lib/doors";

type Stage = "hidden" | "closed" | "opening" | "reveal";

type Props = {
  bride: string;
  groom: string | null;
  dateLine: string | null;
  bridePhoto: string | null;
  groomPhoto: string | null;
};

const WOOD_GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><filter id='w'><feTurbulence type='fractalNoise' baseFrequency='0.004 0.16' numOctaves='3' seed='7'/><feColorMatrix values='0 0 0 0 0.10  0 0 0 0 0.02  0 0 0 0 0.03  0 0 0 0.75 0'/></filter><rect width='100%' height='100%' filter='url(#w)'/></svg>",
)}")`;

const bevel = "shadow-[inset_2px_2px_0_rgba(255,226,170,0.28),inset_-2px_-2px_0_rgba(0,0,0,0.5),0_0_0_2px_rgba(214,176,106,0.8),0_6px_18px_rgba(0,0,0,0.45)]";
const stud = "rounded-full bg-[radial-gradient(circle_at_32%_30%,#fffbe8_0,#e9c87a_22%,#a77a2a_60%,#4d3410_100%)] shadow-[0_2px_3px_rgba(0,0,0,0.6)]";

function Door({ side }: { side: "left" | "right" }) {
  const inner = side === "left" ? "right" : "left";
  return (
    <div className="relative h-full w-full overflow-hidden"
      style={{ backgroundImage: `${WOOD_GRAIN}, linear-gradient(160deg,#7a1f2e,#4a0f1b 55%,#621827)`, backgroundSize: "600px 600px, cover", backgroundBlendMode: "multiply, normal" }}>
      <div className={`absolute inset-y-0 w-2/3 ${inner === "right" ? "right-0 bg-gradient-to-l" : "left-0 bg-gradient-to-r"} from-[rgba(255,214,150,0.16)] to-transparent`} />
      <div className={`absolute inset-3 rounded-[3px] sm:inset-5 ${bevel}`} />
      <div className={`absolute inset-x-[13%] bottom-[11%] top-[15%] rounded-t-full ${bevel} bg-[radial-gradient(ellipse_at_50%_28%,rgba(232,196,120,0.22),transparent_68%)]`}>
        <div className="absolute inset-2.5 rounded-t-full shadow-[inset_1px_1px_0_rgba(0,0,0,0.45),inset_-1px_-1px_0_rgba(255,226,170,0.2),0_0_0_1px_rgba(214,176,106,0.45)]" />
        <Mandala className="absolute left-1/2 top-[30%] size-[86%] -translate-x-1/2 -translate-y-1/2 text-[#e8cb86] opacity-70 drop-shadow-[1px_1px_0_rgba(0,0,0,0.55)]" />
        <Mandala className="absolute left-1/2 top-[74%] size-[46%] -translate-x-1/2 -translate-y-1/2 text-[#e8cb86] opacity-40 drop-shadow-[1px_1px_0_rgba(0,0,0,0.55)]" />
      </div>
      {["top-[7%]", "bottom-[5%]"].map((pos) => (
        <div key={pos} className={`absolute inset-x-[9%] ${pos} flex justify-between`}>
          {Array.from({ length: 6 }).map((_, i) => <span key={i} className={`size-2.5 sm:size-3.5 ${stud}`} />)}
        </div>
      ))}
      <div className={`absolute inset-y-0 ${inner}-0 w-2.5 bg-[linear-gradient(90deg,#7a5a1e,#f6e2a8_45%,#b88a3a_70%,#5a3e10)] shadow-[0_0_10px_rgba(0,0,0,0.5)]`} />
      <div className={`absolute top-[54%] ${inner === "right" ? "right-5 sm:right-8" : "left-5 sm:left-8"} flex flex-col items-center`}>
        <span className={`size-5 sm:size-6 ${stud}`} />
        <svg viewBox="0 0 40 46" className="-mt-1 h-12 w-10 drop-shadow-[0_4px_4px_rgba(0,0,0,0.55)] sm:h-14 sm:w-12" aria-hidden>
          <defs>
            <linearGradient id={`ring-${side}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff2c4" /><stop offset=".4" stopColor="#d4ac5c" /><stop offset=".75" stopColor="#7a5418" /><stop offset="1" stopColor="#e0bd72" /></linearGradient>
          </defs>
          <circle cx="20" cy="24" r="15" fill="none" stroke={`url(#ring-${side})`} strokeWidth="4.5" />
        </svg>
      </div>
    </div>
  );
}

function Petals() {
  const petals = useMemo(() => Array.from({ length: 34 }, (_, i) => ({
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    dur: 3 + Math.random() * 2.5,
    rot: Math.random() * 360,
    drift: (Math.random() - 0.5) * 30,
    size: 10 + Math.random() * 10,
    colour: ["#e7798a", "#f2a3ae", "#d94f68", "#f6c343", "#ff9a3c"][i % 5],
  })), []);
  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden" aria-hidden>
      {petals.map((p, i) => (
        <motion.span key={i} className="absolute top-0 rounded-[60%_10%_60%_10%]"
          style={{ left: `${p.x}%`, width: p.size, height: p.size * 0.7, background: p.colour }}
          initial={{ y: -40, rotate: p.rot, opacity: 0 }}
          animate={{ y: "110vh", x: `${p.drift}vw`, rotate: p.rot + 540, opacity: [0, 1, 1, 0.8] }}
          transition={{ duration: p.dur, delay: p.delay, ease: "easeIn" }} />
      ))}
    </div>
  );
}

function Portrait({ src, name }: { src: string | null; name: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-t-full bg-[linear-gradient(160deg,#f6e2a8,#b88a3a_35%,#f0d58f_60%,#8f6524)] p-[5px] shadow-[0_14px_28px_-8px_rgba(90,60,30,0.35),0_30px_60px_-28px_rgba(90,40,30,0.5)]">
      <div className="relative h-36 w-28 overflow-hidden rounded-t-full bg-gradient-to-b from-blush to-beige shadow-[inset_0_0_0_2px_rgba(255,250,240,0.85),inset_0_8px_24px_rgba(60,30,10,0.22)] sm:h-52 sm:w-40">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-script text-6xl text-rose">{name[0]}</span>
        )}
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0)_38%)]" />
      </div>
      </div>
      <p className="mt-3 font-script text-3xl text-rose sm:text-4xl">{name}</p>
    </div>
  );
}


export function InvitationIntro({ bride, groom, dateLine, bridePhoto, groomPhoto }: Props) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<Stage>("closed");

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(KEY) === "1"; } catch {  }
    if (seen || reduce) setStage("hidden");
  }, [reduce]);

  const finish = () => setStage("hidden");
  const open = () => {
    try { sessionStorage.setItem(KEY, "1"); } catch {  }
    setStage("opening");
    setTimeout(() => setStage("reveal"), 1500);
    setTimeout(finish, 4200);
  };

  const opening = stage === "opening" || stage === "reveal";
  return (
    <AnimatePresence>
      {stage !== "hidden" && (
        <motion.div key="doors" data-doors className="fixed inset-0 z-50 overflow-hidden bg-[#2a0810]" exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
          role="dialog" aria-modal="true" aria-label="Wedding invitation">
          <div className="paper absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <Mandala className="pointer-events-none absolute size-[140vmin] opacity-[0.08] animate-[spin_120s_linear_infinite]" />
            <motion.div className="relative" initial={{ opacity: 0, scale: 0.9 }} animate={opening ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.7, duration: 1 }}>
              <p className="text-[0.7rem] uppercase tracking-[0.4em] text-taupe sm:text-xs">Together with their families</p>
              <div className="mt-6 flex items-end justify-center gap-4 sm:gap-10">
                <Portrait src={bridePhoto} name={bride} />
                {groom && <span className="mb-14 font-script text-5xl text-gold sm:text-6xl">&</span>}
                {groom && <Portrait src={groomPhoto} name={groom} />}
              </div>
              {dateLine && <p className="mt-6 font-display text-xl tracking-wide text-gold-deep sm:text-2xl">{dateLine}</p>}
            </motion.div>
          </div>

          <div className="absolute inset-0 flex [perspective:1800px]">
            <motion.div className="h-full w-1/2 origin-left [backface-visibility:hidden] will-change-transform" animate={opening ? { rotateY: -108, filter: "brightness(0.45)" } : { rotateY: 0, filter: "brightness(1)" }}
              transition={{ duration: 1.9, ease: [0.65, 0, 0.25, 1] }}>
              <Door side="left" />
            </motion.div>
            <motion.div className="h-full w-1/2 origin-right [backface-visibility:hidden] will-change-transform" animate={opening ? { rotateY: 108, filter: "brightness(0.45)" } : { rotateY: 0, filter: "brightness(1)" }}
              transition={{ duration: 1.9, ease: [0.65, 0, 0.25, 1] }}>
              <Door side="right" />
            </motion.div>
          </div>

          <motion.div animate={opening ? { y: -120, opacity: 0 } : { y: 0 }} transition={{ duration: 0.9 }}><Toran className="absolute inset-x-0 top-0 z-30" /></motion.div>

          <motion.div className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6 text-center"
            animate={opening ? { opacity: 0 } : { opacity: 1 }} transition={{ duration: 0.4 }}>
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[70vmin] w-[110vmin] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(42,8,16,0.75),transparent_65%)]" />
            <p className="text-[0.7rem] uppercase tracking-[0.35em] text-[#f1d899]/90 sm:text-xs">You are invited to the wedding of</p>
            <p className="mt-2 font-script text-5xl text-[#f6e2a8] drop-shadow sm:text-6xl">{groom ? `${bride} & ${groom}` : bride}</p>
            <motion.button type="button" onClick={open} disabled={opening}
              className="mt-6 rounded-full outline-none focus-visible:ring-4 focus-visible:ring-[#f1d899]/60"
              animate={opening ? { scale: 1.4, rotate: 90, opacity: 0 } : { scale: [1, 1.04, 1] }}
              transition={opening ? { duration: 0.5 } : { duration: 2.6, repeat: Infinity }}
              aria-label="Open the invitation">
              <Seal initials={[bride[0], groom?.[0]]} className="size-36 sm:size-44" />
            </motion.button>
            <p className="mt-5 text-sm tracking-wide text-[#f1d899]/80">Tap the seal to open</p>
          </motion.div>

          {opening && <Petals />}

          <button type="button" onClick={() => { try { sessionStorage.setItem(KEY, "1"); } catch {  } finish(); }}
            className="absolute bottom-14 right-5 z-50 rounded-full bg-[#2a0810]/50 px-3 py-2 text-xs uppercase tracking-[0.25em] text-[#f1d899]/90 backdrop-blur-sm hover:text-[#f6e2a8] sm:bottom-16">
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
