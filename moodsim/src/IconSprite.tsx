// SVG sprite: all <symbol> icons referenced via <use href="#ic-..."/> across
// the app. Render this ONCE near the root (e.g. in App.tsx) — every page can
// then reference these icons by id from anywhere in the tree.
export default function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <symbol id="ic-chart" viewBox="0 0 24 24">
          <path d="M4 20V10" />
          <path d="M10 20V4" />
          <path d="M16 20v-7" />
          <path d="M22 20H2" />
        </symbol>
        <symbol id="ic-check" viewBox="0 0 24 24">
          <path d="M20 6 9 17l-5-5" />
        </symbol>
        <symbol id="ic-film" viewBox="0 0 24 24">
          <rect x="2" y="3" width="20" height="18" rx="2" />
          <path d="M7 3v18M17 3v18M2 8h5M2 16h5M17 8h5M17 16h5" />
        </symbol>
        <symbol id="ic-video" viewBox="0 0 24 24">
          <rect x="2" y="6" width="14" height="12" rx="2" />
          <path d="m22 8-6 4 6 4V8Z" />
        </symbol>
        <symbol id="ic-clock" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </symbol>
        <symbol id="ic-smile" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <path d="M9 9h.01M15 9h.01" />
        </symbol>
        <symbol id="ic-frown" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <path d="M9 9h.01M15 9h.01" />
        </symbol>
        <symbol id="ic-angry" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 15s1.5-1 4-1 4 1 4 1" />
          <path d="m8 8.5 2.5 1M16 8.5l-2.5 1" />
        </symbol>
        <symbol id="ic-meh-scared" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M9 15.5c0-1 1.3-1.5 3-1.5s3 .5 3 1.5" />
          <circle cx="9" cy="9.2" r="1" />
          <circle cx="15" cy="9.2" r="1" />
        </symbol>
        <symbol id="ic-activity" viewBox="0 0 24 24">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </symbol>
        <symbol id="ic-cpu" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="2" />
          <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
        </symbol>
        <symbol id="ic-user" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </symbol>
        <symbol id="ic-trend" viewBox="0 0 24 24">
          <path d="m22 7-8.5 8.5-5-5L2 17" />
          <path d="M16 7h6v6" />
        </symbol>
        <symbol id="ic-info" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 16v-5" />
          <path d="M12 8h.01" />
        </symbol>
        <symbol id="ic-moon" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </symbol>
        <symbol id="ic-sun" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </symbol>
        <symbol id="ic-home" viewBox="0 0 24 24">
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 9.8V20h13V9.8" />
          <path d="M9.5 20v-6h5v6" />
        </symbol>
        <symbol id="ic-edit" viewBox="0 0 24 24">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </symbol>
        <symbol id="ic-arrow-right" viewBox="0 0 24 24">
          <path d="M5 12h14" />
          <path d="m13 5 7 7-7 7" />
        </symbol>
        <symbol id="ic-plus" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </symbol>
        <symbol id="ic-trash" viewBox="0 0 24 24">
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
          <path d="M10 11v6M14 11v6" />
        </symbol>
        <symbol id="ic-play" viewBox="0 0 24 24">
          <path d="M6 4v16l14-8Z" />
        </symbol>
        <symbol id="ic-x" viewBox="0 0 24 24">
          <path d="M18 6 6 18M6 6l12 12" />
        </symbol>
        <symbol id="ic-camera" viewBox="0 0 24 24">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
          <circle cx="12" cy="13" r="4" />
        </symbol>
        <symbol id="ic-pause" viewBox="0 0 24 24">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </symbol>
      </defs>
    </svg>
  );
}
