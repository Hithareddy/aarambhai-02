import React, { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";

// ─── SVG Animal Sprites ────────────────────────────────────────────────────────
// Each sprite is a side-facing full-body animal with animated legs.
// CSS classes prefixed per-animal (vc-=cat, vd-=dog, vr-=rabbit) to avoid
// cross-SVG conflicts since inline <style> is document-global.

function CatSprite() {
  return (
    <svg
      viewBox="0 0 64 52"
      style={{ width: 46, height: 36, overflow: "visible", display: "block" }}
      aria-hidden="true"
    >
      {/* Tail — behind body, wags up/down */}
      <path
        className="vc-tail"
        d="M 14 30 Q 4 18 8 9 Q 10 4 6 2"
        stroke="#D06830"
        strokeWidth="4.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Body */}
      <ellipse cx="29" cy="27" rx="19" ry="10" fill="#F4924A" />
      {/* Belly highlight */}
      <ellipse cx="33" cy="28" rx="11" ry="6.5" fill="#FDC090" />
      {/* Head */}
      <circle cx="47" cy="19" r="13" fill="#F4924A" />
      {/* Cheek/muzzle */}
      <ellipse cx="51" cy="22" rx="7" ry="5" fill="#FDC090" />
      {/* Left ear */}
      <polygon points="39,11 42,3 48,11" fill="#F4924A" />
      <polygon points="40.5,11 42.5,6 46.5,11" fill="#FFBDB0" />
      {/* Right ear (partially visible) */}
      <polygon points="45,11 48,4 53,11" fill="#E07840" />
      {/* Eye */}
      <ellipse cx="50" cy="17" rx="2.5" ry="3" fill="#1A1A2E" />
      <circle cx="51" cy="16" r="0.9" fill="white" />
      {/* Nose */}
      <ellipse cx="55" cy="22" rx="2" ry="1.5" fill="#FF9DB0" />
      {/* Mouth */}
      <path d="M 54 23.5 Q 56 25 58 23.5" stroke="#C06060" strokeWidth="0.9" fill="none" />
      {/* Whiskers */}
      <line x1="55" y1="21" x2="63" y2="19" stroke="#D0A070" strokeWidth="0.9" opacity="0.8" />
      <line x1="55" y1="23" x2="63" y2="23" stroke="#D0A070" strokeWidth="0.9" opacity="0.8" />
      {/* Back legs — alternate phase */}
      <rect className="vc-bl1" x="12" y="34" width="7" height="13" rx="3.5" fill="#D06830" />
      <rect className="vc-bl2" x="20" y="34" width="7" height="13" rx="3.5" fill="#C05820" />
      {/* Front legs — alternate phase (opposite to back) */}
      <rect className="vc-fl1" x="36" y="34" width="7" height="13" rx="3.5" fill="#D06830" />
      <rect className="vc-fl2" x="44" y="34" width="7" height="13" rx="3.5" fill="#C05820" />
    </svg>
  );
}

function DogSprite() {
  return (
    <svg
      viewBox="0 0 66 52"
      style={{ width: 47, height: 36, overflow: "visible", display: "block" }}
      aria-hidden="true"
    >
      {/* Tail — upright, wags */}
      <path
        className="vd-tail"
        d="M 12 24 Q 5 14 9 6 Q 11 2 8 0"
        stroke="#B8860B"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Body */}
      <ellipse cx="30" cy="28" rx="20" ry="10" fill="#D4A040" />
      {/* Belly */}
      <ellipse cx="34" cy="29" rx="12" ry="6" fill="#F0D080" />
      {/* Head */}
      <circle cx="49" cy="20" r="14" fill="#D4A040" />
      {/* Snout */}
      <ellipse cx="57" cy="24" rx="8" ry="6" fill="#C49030" />
      <ellipse cx="59" cy="25" rx="5" ry="3.5" fill="#E8C070" />
      {/* Floppy ear — hangs from side of head */}
      <ellipse
        className="vd-ear"
        cx="40"
        cy="26"
        rx="5"
        ry="10"
        fill="#B8860B"
        transform="rotate(-10 40 18)"
      />
      {/* Eye */}
      <circle cx="51" cy="17" r="3" fill="#1A1A2E" />
      <circle cx="52" cy="16" r="1" fill="white" />
      {/* Nose */}
      <ellipse cx="62" cy="24" rx="3" ry="2.5" fill="#2D2D2D" />
      {/* Nostril highlights */}
      <circle cx="61" cy="23.5" r="0.8" fill="#4A4A4A" />
      <circle cx="63" cy="23.5" r="0.8" fill="#4A4A4A" />
      {/* Tongue */}
      <ellipse cx="62" cy="28.5" rx="2.5" ry="2" fill="#FF7070" />
      {/* Back legs */}
      <rect className="vd-bl1" x="13" y="35" width="8" height="14" rx="4" fill="#C49030" />
      <rect className="vd-bl2" x="22" y="35" width="8" height="14" rx="4" fill="#B08020" />
      {/* Front legs */}
      <rect className="vd-fl1" x="37" y="35" width="8" height="14" rx="4" fill="#C49030" />
      <rect className="vd-fl2" x="46" y="35" width="8" height="14" rx="4" fill="#B08020" />
    </svg>
  );
}

function RabbitSprite() {
  return (
    <svg
      viewBox="0 0 52 60"
      style={{ width: 31, height: 36, overflow: "visible", display: "block" }}
      aria-hidden="true"
    >
      {/* Left tall ear */}
      <ellipse className="vr-ear-l" cx="20" cy="10" rx="5" ry="13" fill="#D0D0DC" />
      <ellipse className="vr-ear-l" cx="20" cy="10" rx="2.5" ry="9" fill="#FFBDB0" />
      {/* Right tall ear */}
      <ellipse className="vr-ear-r" cx="30" cy="9" rx="5" ry="13" fill="#D0D0DC" />
      <ellipse className="vr-ear-r" cx="30" cy="9" rx="2.5" ry="9" fill="#FFBDB0" />
      {/* Body */}
      <ellipse cx="26" cy="34" rx="16" ry="13" fill="#E0E0EC" />
      {/* Belly */}
      <ellipse cx="28" cy="36" rx="9" ry="7" fill="#F5F5FF" />
      {/* Fluffy tail */}
      <circle cx="10" cy="32" r="7" fill="white" />
      <circle cx="10" cy="32" r="5" fill="#F5F5FF" />
      {/* Head */}
      <circle cx="38" cy="25" r="12" fill="#E0E0EC" />
      {/* Cheek */}
      <ellipse cx="42" cy="28" rx="6" ry="4.5" fill="#F5F5FF" />
      {/* Eye */}
      <circle cx="41" cy="22" r="3" fill="#CC3366" />
      <circle cx="42" cy="21" r="1" fill="white" />
      {/* Nose */}
      <ellipse cx="46" cy="27" rx="2" ry="1.5" fill="#FF9DB0" />
      {/* Mouth */}
      <path d="M 45 28.5 Q 47 30 49 28.5" stroke="#C06080" strokeWidth="0.9" fill="none" />
      {/* Whiskers */}
      <line x1="47" y1="27" x2="52" y2="25.5" stroke="#C0B0C0" strokeWidth="0.8" opacity="0.8" />
      <line x1="47" y1="28" x2="52" y2="28" stroke="#C0B0C0" strokeWidth="0.8" opacity="0.8" />
      {/* Back legs — larger hind legs */}
      <rect className="vr-bl1" x="12" y="44" width="8" height="14" rx="4" fill="#C8C8D8" />
      <rect className="vr-bl2" x="20" y="44" width="8" height="14" rx="4" fill="#B8B8C8" />
      {/* Front legs — smaller */}
      <rect className="vr-fl1" x="30" y="44" width="6" height="11" rx="3" fill="#C8C8D8" />
      <rect className="vr-fl2" x="37" y="44" width="6" height="11" rx="3" fill="#B8B8C8" />
    </svg>
  );
}

// ─── Companion config ──────────────────────────────────────────────────────────

interface CompanionConfig {
  id: "cat" | "dog" | "rabbit";
  name: string;
  phrase: string;
  Sprite: () => React.ReactElement;
  travelClass: string;
  bobClass: string;
}

const COMPANIONS: CompanionConfig[] = [
  {
    id: "cat",
    name: "Cat",
    phrase: "You've got this! ✨",
    Sprite: CatSprite,
    travelClass: "aar-travel-cat",
    bobClass: "aar-bob-cat",
  },
  {
    id: "dog",
    name: "Dog",
    phrase: "Keep going! 🚀",
    Sprite: DogSprite,
    travelClass: "aar-travel-dog",
    bobClass: "aar-bob-dog",
  },
  {
    id: "rabbit",
    name: "Rabbit",
    phrase: "One step closer 🌱",
    Sprite: RabbitSprite,
    travelClass: "aar-travel-rabbit",
    bobClass: "aar-bob-rabbit",
  },
];

const DEFAULT_PHRASES = [
  "Keep going! 🚀",
  "You've got this! ✨",
  "One step closer 🌱",
  "Ace today! ⭐",
  "Small steps matter 💙",
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * LearningCompanions — full-body SVG animals running across the top of WelcomeHero.
 *
 * Two-layer animation:
 *   OUTER wrapper  → aarTravelX: translateX(-80px → 2000px), linear, infinite
 *   INNER div      → aarBob*: tiny vertical body bounce, synced with leg cycle
 *   SVG legs       → vc-/vd-/vr- classes: leg rect rotation for running cycle
 *
 * Parent MUST have: position:relative; overflow:hidden
 * Zero layout impact — all position:absolute.
 */
export function LearningCompanions() {
  const { t } = useLanguage();
  const [activeSpeech, setActiveSpeech] = useState<{
    id: string;
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!activeSpeech) return;
    const timer = setTimeout(() => setActiveSpeech(null), 3200);
    return () => clearTimeout(timer);
  }, [activeSpeech]);

  const handleClick = (companion: CompanionConfig) => {
    const rawPhrases = t("companions.phrases");
    const phrases: string[] = Array.isArray(rawPhrases)
      ? (rawPhrases as string[])
      : DEFAULT_PHRASES;
    const text =
      phrases.length > 0
        ? phrases[Math.floor(Math.random() * phrases.length)]
        : companion.phrase;
    setActiveSpeech({ id: companion.id, text });
  };

  return (
    <>
      <style>{`
        /* ════════════════════════════════════════════════════════════════
           HORIZONTAL TRAVEL — outer wrapper crosses the full card width.
           Starts off-left (-80px), ends off-right (2000px).
           Card overflow:hidden clips both edges.
           Linear so speed is constant (no ease-in/out slowing at edges).
           Negative delays pre-position animals across the card at load:
             Rabbit  −1.5 s → ≈ 250 px from left
             Cat     −5 s   → ≈ 670 px from left
             Dog     −10 s  → ≈ 1 100 px from left
        ════════════════════════════════════════════════════════════════ */
        @keyframes aarTravelX {
          from { transform: translateX(-80px); }
          to   { transform: translateX(2000px); }
        }
        .aar-travel-cat    { animation: aarTravelX 13s linear infinite; animation-delay: -5s; }
        .aar-travel-dog    { animation: aarTravelX 16s linear infinite; animation-delay: -10s; }
        .aar-travel-rabbit { animation: aarTravelX 11s linear infinite; animation-delay: -1.5s; }

        /* ════════════════════════════════════════════════════════════════
           BODY BOUNCE — inner wrapper: tiny vertical movement
           in sync with the leg cycle frequency so it feels like running.
        ════════════════════════════════════════════════════════════════ */
        @keyframes aarBobCat    { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-3px)} }
        @keyframes aarBobDog    { 0%,100%{transform:translateY(0)}  40%{transform:translateY(-5px)} 70%{transform:translateY(1px)} }
        @keyframes aarBobRabbit { 0%,100%{transform:translateY(0)}  25%{transform:translateY(-8px)} 50%{transform:translateY(0)} 75%{transform:translateY(-4px)} }
        .aar-bob-cat    { animation: aarBobCat    0.38s ease-in-out infinite; }
        .aar-bob-dog    { animation: aarBobDog    0.36s ease-in-out infinite; }
        .aar-bob-rabbit { animation: aarBobRabbit 0.55s ease-in-out infinite; }

        /* ════════════════════════════════════════════════════════════════
           SVG LEG ANIMATIONS
           transform-box:fill-box makes transform-origin % relative to
           each rect's own bounding box.
           transform-origin:50% 0% = top-centre of each leg = the hip joint.
           Rotating ±20-25° creates a pendulum/running-leg effect.
           Paired legs alternate phase (A vs B) for left/right stepping.
        ════════════════════════════════════════════════════════════════ */
        @keyframes legRunA { 0%,100%{transform:rotate(-22deg)} 50%{transform:rotate(22deg)}  }
        @keyframes legRunB { 0%,100%{transform:rotate(22deg)}  50%{transform:rotate(-22deg)} }
        @keyframes legHopA { 0%,100%{transform:rotate(-18deg)} 50%{transform:rotate(18deg)}  }
        @keyframes legHopB { 0%,100%{transform:rotate(18deg)}  50%{transform:rotate(-18deg)} }

        /* Cat legs */
        .vc-bl1,.vc-fl2 { transform-box:fill-box; transform-origin:50% 0%; animation:legRunA 0.38s ease-in-out infinite; }
        .vc-bl2,.vc-fl1 { transform-box:fill-box; transform-origin:50% 0%; animation:legRunB 0.38s ease-in-out infinite; }
        /* Cat tail */
        .vc-tail { transform-box:fill-box; transform-origin:100% 100%; animation:catTailWag 0.76s ease-in-out infinite; }
        @keyframes catTailWag { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-18deg)} }

        /* Dog legs */
        .vd-bl1,.vd-fl2 { transform-box:fill-box; transform-origin:50% 0%; animation:legRunA 0.36s ease-in-out infinite; }
        .vd-bl2,.vd-fl1 { transform-box:fill-box; transform-origin:50% 0%; animation:legRunB 0.36s ease-in-out infinite; }
        /* Dog tail */
        .vd-tail { transform-box:fill-box; transform-origin:100% 100%; animation:dogTailWag 0.4s ease-in-out infinite; }
        @keyframes dogTailWag { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-25deg)} }
        /* Dog floppy ear */
        .vd-ear { transform-box:fill-box; transform-origin:50% 0%; animation:dogEarFlop 0.72s ease-in-out infinite; }
        @keyframes dogEarFlop { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(8deg)} }

        /* Rabbit legs — hop cycle slightly slower */
        .vr-bl1,.vr-fl2 { transform-box:fill-box; transform-origin:50% 0%; animation:legHopA 0.55s ease-in-out infinite; }
        .vr-bl2,.vr-fl1 { transform-box:fill-box; transform-origin:50% 0%; animation:legHopB 0.55s ease-in-out infinite; }
        /* Rabbit ears subtle tilt */
        .vr-ear-l { transform-box:fill-box; transform-origin:50% 100%; animation:rabbitEarL 1.1s ease-in-out infinite; }
        .vr-ear-r { transform-box:fill-box; transform-origin:50% 100%; animation:rabbitEarR 1.1s ease-in-out infinite; }
        @keyframes rabbitEarL { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-6deg)} }
        @keyframes rabbitEarR { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(6deg)}  }

        /* ════════════════════════════════════════════════════════════════
           REDUCED MOTION — freeze animals at distributed positions,
           stop all leg and body animations.
        ════════════════════════════════════════════════════════════════ */
        @media (prefers-reduced-motion: reduce) {
          .aar-travel-cat    { animation:none !important; transform:translateX(200px) !important; }
          .aar-travel-dog    { animation:none !important; transform:translateX(450px) !important; }
          .aar-travel-rabbit { animation:none !important; transform:translateX(80px)  !important; }
          .aar-bob-cat, .aar-bob-dog, .aar-bob-rabbit { animation:none !important; }
          .vc-bl1,.vc-bl2,.vc-fl1,.vc-fl2,.vc-tail,
          .vd-bl1,.vd-bl2,.vd-fl1,.vd-fl2,.vd-tail,.vd-ear,
          .vr-bl1,.vr-bl2,.vr-fl1,.vr-fl2,.vr-ear-l,.vr-ear-r
            { animation:none !important; transform:none !important; }
        }
      `}</style>

      {COMPANIONS.map((companion) => {
        const isSpeaking = activeSpeech?.id === companion.id;
        const { Sprite } = companion;

        return (
          /*
           * OUTER — horizontal travel across the card.
           * top: 6px places animals in the decorative top strip of the hero,
           * above the padded text content (which starts at ~24-32px).
           */
          <div
            key={companion.id}
            className={`absolute select-none ${companion.travelClass}`}
            style={{ top: "6px", left: 0 }}
          >
            {/*
             * Speech bubble — child of the travel wrapper so it moves with it.
             * Appears below the sprite (top: 100% + gap) to stay inside the card.
             * The tail points upward toward the sprite.
             */}
            {isSpeaking && (
              <div
                className="absolute left-1/2 -translate-x-1/2
                  whitespace-nowrap rounded-xl bg-popover border border-border
                  shadow-lg px-2.5 py-1 text-[10px] font-semibold
                  text-popover-foreground pointer-events-none z-50"
                style={{ top: "calc(100% + 6px)" }}
              >
                {activeSpeech!.text}
                {/* Upward-pointing tail */}
                <div
                  className="absolute -top-1 left-1/2 -translate-x-1/2
                    w-2 h-2 rotate-45 bg-popover border-l border-t border-border"
                />
              </div>
            )}

            {/*
             * INNER — vertical body bounce while running.
             * Wrapping the SVG here keeps the two transform axes independent.
             */}
            <div
              className={companion.bobClass}
              style={{ display: "inline-block", lineHeight: 0 }}
            >
              <button
                type="button"
                aria-label={`${companion.name} companion — click for encouragement`}
                onClick={() => handleClick(companion)}
                className="block cursor-pointer p-0 bg-transparent border-none
                  hover:scale-110 active:scale-90 transition-transform duration-100"
                style={{ lineHeight: 0 }}
              >
                <Sprite />
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}
