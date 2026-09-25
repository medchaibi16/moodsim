import { useEffect, useRef, useState } from "react";
import logoMark from "./assets/logo-mark.png";
import { resetCharacter } from "./api";
import "./CharacterPage.css";

/* ============================================================
   Character model — matches MoodSimBackend's CharacterProfile,
   as returned (camelCased) by GET /api/character/default.
   The index signature preserves backend-managed fields we don't
   edit here (memory, currentState, emotionalHistory) so posting
   the character back to /api/simulation/start doesn't drop them.
============================================================ */
export interface GoalConcern {
  name: string;
  importance?: number;
  relevance?: number;
  [key: string]: unknown;
}

export interface Character {
  name: string;
  description: string;
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  baselinePleasure: number;
  baselineArousal: number;
  baselineDominance: number;
  goals: GoalConcern[];
  concerns: GoalConcern[];
  [key: string]: unknown;
}

const TRAITS: { key: keyof Character; label: string }[] = [
  { key: "openness", label: "Openness" },
  { key: "conscientiousness", label: "Conscientiousness" },
  { key: "extraversion", label: "Extraversion" },
  { key: "agreeableness", label: "Agreeableness" },
  { key: "neuroticism", label: "Neuroticism" },
];

const PAD_TRAITS: { key: keyof Character; label: string }[] = [
  { key: "baselinePleasure", label: "Pleasure" },
  { key: "baselineArousal", label: "Arousal" },
  { key: "baselineDominance", label: "Dominance" },
];

// Same rule set as the original CharacterSelection.js's getDominantEmotion()
function getDominantEmotion(c: Character): string {
  const p = c.baselinePleasure;
  const a = c.baselineArousal;
  const d = c.baselineDominance;
  if (p > 0.3 && a > 0.1) return "happy";
  if (p < -0.2 && a > 0.2) return "angry";
  if (p < -0.3 && a < -0.1) return "sad";
  if (p < -0.1 && a > 0.3) return "stress";
  if (p < -0.1 && a > 0.1 && d < 0) return "frustrated";
  return "neutral";
}

function StickFigure() {
  return (
    <svg className="stick" viewBox="0 0 60 90" aria-hidden="true">
      <circle cx="30" cy="14" r="10" strokeWidth={2.5} />
      <line x1="30" y1="24" x2="30" y2="56" strokeWidth={2.5} />
      <line x1="30" y1="34" x2="12" y2="46" strokeWidth={2.5} />
      <line x1="30" y1="34" x2="48" y2="46" strokeWidth={2.5} />
      <line x1="30" y1="56" x2="16" y2="76" strokeWidth={2.5} />
      <line x1="30" y1="56" x2="44" y2="76" strokeWidth={2.5} />
      <circle cx="26" cy="13" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="34" cy="13" r="1.5" fill="currentColor" stroke="none" />
      <line x1="25" y1="19" x2="35" y2="19" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

/* ============================================================
   Component
============================================================ */
interface CharacterPageProps {
  character: Character | null;
  characterError: string | null;
  onCharacterChange: (updater: Character | ((prev: Character) => Character)) => void;
  onContinue?: () => void;
}

export default function CharacterPage({
  character,
  characterError,
  onCharacterChange,
  onContinue,
}: CharacterPageProps) {
  const [nameDraft, setNameDraft] = useState(character?.name ?? "");
  const [photo, setPhoto] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "edit">("overview");
  const [resetting, setResetting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Keep the name draft in sync once the real character arrives from the backend
  // (it starts null while the initial fetch in App.tsx is in flight).
  useEffect(() => {
    if (character) setNameDraft(character.name);
  }, [character]);

  function updateStat(key: keyof Character, raw: number) {
    onCharacterChange((prev) => ({ ...prev, [key]: raw / 100 }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function removePhoto() {
    setPhoto(null);
  }

  function syncName() {
    const val = nameDraft.trim();
    if (!val || !character) {
      setNameDraft(character?.name ?? "");
      return;
    }
    onCharacterChange((prev) => ({ ...prev, name: val }));
  }

  async function resetToDefault() {
    setResetting(true);
    try {
      const fresh = await resetCharacter();
      onCharacterChange(fresh as Character);
      setNameDraft(fresh.name as string);
      setPhoto(null);
    } catch (err) {
      // Backend unreachable — leave the current character as-is rather than losing it.
      console.error("Failed to reset character from backend:", err);
      alert("Couldn't reach the backend to reset the character. Is the API running?");
    } finally {
      setResetting(false);
    }
  }

  if (characterError) {
    return (
      <div className="main">
        <div className="page-header">
          <h1>Choose Your Character</h1>
        </div>
        <div className="card" style={{ padding: "var(--sp-6)", textAlign: "center" }}>
          <p style={{ color: "var(--danger)", fontWeight: 600 }}>Couldn't load the character from the backend.</p>
          <p style={{ color: "var(--gray)", fontSize: 13 }}>{characterError}</p>
          <p style={{ color: "var(--gray)", fontSize: 13 }}>
            Check that the backend is running and reachable (default: http://localhost:5000).
          </p>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="main">
        <div className="page-header">
          <h1>Choose Your Character</h1>
        </div>
        <div className="card" style={{ padding: "var(--sp-6)", textAlign: "center", color: "var(--gray)" }}>
          Loading character from backend…
        </div>
      </div>
    );
  }

  const dominant = getDominantEmotion(character);

  return (
    <div className="main">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            <svg className="icon-sm" aria-hidden="true">
              <use href="#ic-user" />
            </svg>
            Baseline setup
          </div>
          <h1>Choose Your Character</h1>
          <p className="subtitle">Customize your character's personality and emotional baseline</p>
        </div>
      </div>

      <div className="char-layout">
        {/* Avatar card */}
        <div className="card char-avatar-card">
          <div
            className="char-avatar-wrap"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Change character photo"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
          >
            <div className="char-avatar">
              {photo ? (
                <img className="char-photo" src={photo} alt="Character" />
              ) : (
                <StickFigure />
              )}
            </div>
            <div className="char-avatar-overlay" aria-hidden="true">
              <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Change photo
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="char-avatar-input"
            accept="image/*"
            onChange={handlePhotoChange}
          />

          <div className="char-mood-label">
            {dominant.charAt(0).toUpperCase() + dominant.slice(1)}
          </div>

          <div className="char-name-wrap">
            <input
              ref={nameInputRef}
              type="text"
              className="char-name"
              value={nameDraft}
              aria-label="Character name"
              maxLength={32}
              spellCheck={false}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={syncName}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
            />
            <button
              className="char-name-edit-icon"
              aria-label="Edit name"
              tabIndex={-1}
              onClick={() => nameInputRef.current?.focus()}
            >
              <svg className="icon-sm" aria-hidden="true">
                <use href="#ic-edit" />
              </svg>
            </button>
          </div>

          <div className="char-desc">{character.description}</div>

          {photo && (
            <button
              onClick={removePhoto}
              style={{
                marginTop: "var(--sp-4)",
                fontSize: 12,
                color: "var(--danger)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              Remove photo
            </button>
          )}
        </div>

        {/* Stats panel */}
        <div>
          <div className="char-tab-row">
            <button
              className={`char-tab${activeTab === "overview" ? " active" : ""}`}
              aria-pressed={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            >
              <svg className="icon-sm" aria-hidden="true">
                <use href="#ic-chart" />
              </svg>
              Overview
            </button>
            <button
              className={`char-tab${activeTab === "edit" ? " active" : ""}`}
              aria-pressed={activeTab === "edit"}
              onClick={() => setActiveTab("edit")}
            >
              <svg className="icon-sm" aria-hidden="true">
                <use href="#ic-edit" />
              </svg>
              Edit Stats
            </button>
          </div>

          {activeTab === "overview" ? (
            <div>
              {/* Big Five */}
              <div className="card" style={{ marginBottom: "var(--sp-5)" }}>
                <div className="char-section-title">
                  <span style={{ fontSize: 18 }} aria-hidden="true">
                    🧠
                  </span>
                  Big Five Personality
                </div>
                {TRAITS.map((t) => {
                  const pct = Math.round((character[t.key] as number) * 100);
                  return (
                    <div className="char-trait-row" key={t.key}>
                      <span className="char-trait-name">{t.label}</span>
                      <div className="char-trait-track">
                        <div className="char-trait-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="char-trait-val">{pct}%</span>
                    </div>
                  );
                })}
              </div>

              {/* PAD Baseline */}
              <div className="card" style={{ marginBottom: "var(--sp-5)" }}>
                <div className="char-section-title">
                  <span style={{ fontSize: 18 }} aria-hidden="true">
                    🎭
                  </span>
                  PAD Baseline
                </div>
                {PAD_TRAITS.map((t) => {
                  const val = character[t.key] as number;
                  return (
                    <div className="char-trait-row" key={t.key}>
                      <span className="char-trait-name">{t.label}</span>
                      <div className="char-trait-track">
                        <div
                          className="char-trait-fill"
                          style={{ width: `${(val + 1) * 50}%` }}
                        />
                      </div>
                      <span className="char-trait-val">{val.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Goals & Concerns */}
              <div className="card">
                <div className="char-section-title">
                  <span style={{ fontSize: 18 }} aria-hidden="true">
                    🎯
                  </span>
                  Goals &amp; Concerns
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: "var(--sp-2)" }}>
                      Goals:
                    </div>
                    <div style={{ fontSize: 13.5, color: "var(--gray)" }}>
                      {character.goals.map((g) => g.name).join(", ")}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: "var(--sp-2)" }}>
                      Concerns:
                    </div>
                    <div style={{ fontSize: 13.5, color: "var(--gray)" }}>
                      {character.concerns.map((c) => c.name).join(", ")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="card">
                <div className="char-section-title">
                  <svg className="icon-sm" aria-hidden="true">
                    <use href="#ic-edit" />
                  </svg>
                  Edit Personality
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
                  {TRAITS.map((t) => {
                    const pct = Math.round((character[t.key] as number) * 100);
                    return (
                      <div className="field" key={t.key}>
                        <div className="field-label">
                          <span>{t.label}</span>
                          <span className="f-val">{pct}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={pct}
                          onChange={(e) => updateStat(t.key, Number(e.target.value))}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card" style={{ marginTop: "var(--sp-5)" }}>
                <div className="char-section-title">
                  <span style={{ fontSize: 18 }} aria-hidden="true">
                    🎭
                  </span>
                  Edit PAD Baseline
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
                  {PAD_TRAITS.map((t) => {
                    const val = character[t.key] as number;
                    return (
                      <div className="field" key={t.key}>
                        <div className="field-label">
                          <span>
                            {t.label} (&minus;1 to +1)
                          </span>
                          <span className="f-val">{val.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={-100}
                          max={100}
                          step={5}
                          value={Math.round(val * 100)}
                          onChange={(e) => updateStat(t.key, Number(e.target.value))}
                        />
                      </div>
                    );
                  })}
                </div>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: "var(--sp-5)", width: "100%" }}
                  onClick={() => setActiveTab("overview")}
                >
                  Save &amp; View Overview
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: "var(--sp-6)", display: "flex", gap: "var(--sp-4)", flexWrap: "wrap" }}>
            <button className="btn btn-ghost" style={{ flex: "0 0 auto" }} onClick={resetToDefault} disabled={resetting}>
              <span aria-hidden="true">🔄</span> {resetting ? "Resetting…" : "Reset to Default"}
            </button>
            <button className="run-btn" style={{ flex: 1 }} onClick={onContinue}>
              <svg className="icon" aria-hidden="true">
                <use href="#ic-arrow-right" />
              </svg>
              Continue to Day Builder
            </button>
          </div>
        </div>
      </div>

      <img src={logoMark} alt="MoodStabilizer" className="page-watermark" />
    </div>
  );
}
