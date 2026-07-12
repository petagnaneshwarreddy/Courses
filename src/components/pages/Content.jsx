import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Nav from "./Nav";

// Same API root the rest of the app uses.
const API_BASE = "https://course-backend-01ye.onrender.com";

// Mount this at a route like:  <Route path="/courses/:id/learn" element={<Content />} />
// and point "Continue Learning" / "Start for Free" buttons at `/courses/${course.id}/learn`.

/* ------------------------------------------------------------------
   CONTENT.js  —  Course player ("Continue Learning" destination)
   ------------------------------------------------------------------
   Renders every chapter an admin built in the Courses.js chapter
   editor: the video (uploaded file or YouTube), the chapter's notes,
   any code snippets, and any practice questions — as an interactive
   quiz with immediate right/wrong feedback. Progress is tracked
   per-chapter on the client and rolled up into the single 0-100
   `progress` field the backend's Enrollment model stores.

   NEW: chapters unlock sequentially — a student can always see Class 1,
   but Class 2 stays locked until Class 1 is marked complete, and so on.
   Admins previewing a course always see every chapter unlocked.
   On finishing every chapter, a celebration panel appears with a
   "View Certificate" button that opens Certificate.jsx.
   ------------------------------------------------------------------ */

function youtubeEmbedId(url = "") {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

function initials(name = "") {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* ------------------------------ Icons ------------------------------ */

const Icon = {
  Back: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" {...p}>
      <path d="M12.5 4.5 6 10l6.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Play: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="13" height="13" {...p}>
      <path d="M6.5 4.8v10.4l8-5.2-8-5.2Z" fill="currentColor" />
    </svg>
  ),
  Video: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="14" height="14" {...p}>
      <rect x="2.5" y="5" width="10.5" height="10" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M13.5 8.3 17 6v8l-3.5-2.3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  Code: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="14" height="14" {...p}>
      <path d="M7 6 3 10l4 4M13 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Quiz: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="14" height="14" {...p}>
      <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 8a2 2 0 1 1 2.6 1.9c-.6.2-1 .7-1 1.4v.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="9.6" cy="13.6" r="0.75" fill="currentColor" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="13" height="13" {...p}>
      <path d="M4 10.5 8 14.5 16 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Cross: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="12" height="12" {...p}>
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Chevron: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="15" height="15" {...p}>
      <path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Copy: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="13" height="13" {...p}>
      <rect x="7" y="7" width="9" height="9" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M13 7V4.6A1.6 1.6 0 0 0 11.4 3H4.6A1.6 1.6 0 0 0 3 4.6v6.8A1.6 1.6 0 0 0 4.6 13H7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  Trophy: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="34" height="34" {...p}>
      <path d="M6 4h8v3.4A4 4 0 0 1 10 11.4 4 4 0 0 1 6 7.4V4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6 5H3.6A1.6 1.6 0 0 0 2 6.6 3.4 3.4 0 0 0 5.4 10M14 5h2.4A1.6 1.6 0 0 1 18 6.6 3.4 3.4 0 0 1 14.6 10" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 11.4V15M7 17h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Empty: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="22" height="22" {...p}>
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 13.5 7 9.8l3 2.6 3.4-3.6 4.1 4.7" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  ),
  Lock: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="12" height="12" {...p}>
      <rect x="4.5" y="8.5" width="11" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.5 8.5V6.3a3.5 3.5 0 0 1 7 0v2.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
};

/* -------------------------- Video player -------------------------- */

function ChapterVideo({ chapter }) {
  if (chapter.videoType === "youtube" && chapter.videoUrl) {
    const embedId = youtubeEmbedId(chapter.videoUrl);
    if (embedId) {
      return (
        <div className="lrn-player">
          <iframe
            src={`https://www.youtube.com/embed/${embedId}`}
            title={chapter.title || "Class video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  }
  if (chapter.videoType === "upload" && chapter.videoFile) {
    return (
      <div className="lrn-player">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video key={chapter.id || chapter._id} src={chapter.videoFile} controls controlsList="nodownload" />
      </div>
    );
  }
  return (
    <div className="lrn-player lrn-player--empty">
      <Icon.Empty />
      <p>No video was added for this class.</p>
    </div>
  );
}

/* --------------------------- Code snippets -------------------------- */

function CodeSnippets({ snippets }) {
  const [copiedIdx, setCopiedIdx] = useState(null);

  if (!snippets || snippets.length === 0) {
    return (
      <div className="lrn-empty-tab">
        <Icon.Code />
        <p>No code snippets for this class.</p>
      </div>
    );
  }

  const copy = (code, idx) => {
    navigator.clipboard?.writeText(code || "").then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx((v) => (v === idx ? null : v)), 1600);
    });
  };

  return (
    <div className="lrn-snippets">
      {snippets.map((s, i) => (
        <div className="lrn-snippet" key={i}>
          <div className="lrn-snippet__head">
            <span className="lrn-snippet__lang">{s.language || "Code"}</span>
            <button type="button" className="lrn-copy-btn" onClick={() => copy(s.code, i)}>
              {copiedIdx === i ? <><Icon.Check /> Copied</> : <><Icon.Copy /> Copy</>}
            </button>
          </div>
          <pre className="lrn-snippet__code"><code>{s.code || "// No code provided"}</code></pre>
        </div>
      ))}
    </div>
  );
}

/* -------------------------- Practice quiz --------------------------- */

function PracticeQuiz({ chapterId, questions, answers, onAnswer }) {
  if (!questions || questions.length === 0) {
    return (
      <div className="lrn-empty-tab">
        <Icon.Quiz />
        <p>No practice questions for this class.</p>
      </div>
    );
  }

  const answeredCount = questions.reduce(
    (n, _, i) => n + (answers?.[i] != null ? 1 : 0),
    0
  );
  const correctCount = questions.reduce(
    (n, q, i) => n + (answers?.[i] === q.correctIndex ? 1 : 0),
    0
  );

  return (
    <div className="lrn-quiz">
      <div className="lrn-quiz__score">
        <span>
          {answeredCount === 0
            ? `${questions.length} question${questions.length === 1 ? "" : "s"}`
            : `${correctCount} / ${answeredCount} correct so far`}
        </span>
        {answeredCount === questions.length && questions.length > 0 && (
          <span className="lrn-quiz__done">
            {correctCount === questions.length ? "Perfect score! 🎉" : "All questions answered"}
          </span>
        )}
      </div>

      {questions.map((q, qi) => {
        const picked = answers?.[qi];
        const isAnswered = picked != null;
        return (
          <div className="lrn-quiz-card" key={qi}>
            <p className="lrn-quiz-card__q">
              <span className="lrn-quiz-card__num">Q{qi + 1}</span>
              {q.question || "Untitled question"}
            </p>
            <div className="lrn-quiz-card__options">
              {q.options.map((opt, oi) => {
                const isCorrect = oi === q.correctIndex;
                const isPicked = oi === picked;
                let state = "";
                if (isAnswered) {
                  if (isCorrect) state = "correct";
                  else if (isPicked) state = "wrong";
                }
                return (
                  <button
                    type="button"
                    key={oi}
                    className={`lrn-quiz-opt ${state ? `lrn-quiz-opt--${state}` : ""} ${isPicked ? "lrn-quiz-opt--picked" : ""}`}
                    disabled={isAnswered}
                    onClick={() => onAnswer(chapterId, qi, oi)}
                  >
                    <span className="lrn-quiz-opt__marker">
                      {state === "correct" ? <Icon.Check /> : state === "wrong" ? <Icon.Cross /> : String.fromCharCode(65 + oi)}
                    </span>
                    <span>{opt || `Option ${oi + 1}`}</span>
                  </button>
                );
              })}
            </div>
            {isAnswered && (
              <p className={`lrn-quiz-card__feedback ${picked === q.correctIndex ? "is-correct" : "is-wrong"}`}>
                {picked === q.correctIndex ? "Correct!" : "Not quite — the highlighted option is correct."}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ContentStyles() {
  return (
    <style>{`
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap");

:root {
  --lrn-ink: #0f172a;
  --lrn-accent: #2451cc;
  --lrn-teal: #0f9488;
  --lrn-amber: #b45309;
  --lrn-danger: #c0293f;
  --lrn-bg: #f5f6f9;
  --lrn-surface: #ffffff;
  --lrn-border: #e2e5ec;
  --lrn-border-strong: #cfd4de;
  --lrn-text: #10151f;
  --lrn-text-soft: #5b6472;
  --lrn-text-faint: #8a92a1;
  --lrn-code-bg: #10151f;
  --lrn-code-text: #e6e9f0;
  --lrn-radius: 10px;
  --lrn-radius-lg: 14px;
  --lrn-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 1px rgba(15, 23, 42, 0.03);
  --lrn-font-body: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  --lrn-font-mono: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
}

.lrn-page { font-family: var(--lrn-font-body); color: var(--lrn-text); background: var(--lrn-bg); min-height: 100%; box-sizing: border-box; }
.lrn-page * { box-sizing: border-box; }

.lrn-page--centered { display: flex; align-items: center; justify-content: center; min-height: 70vh; text-align: center; padding: 32px; }
.lrn-page--centered p { color: var(--lrn-text-soft); font-size: 14px; margin: 6px 0 0; }
.lrn-page--centered h2 { font-size: 20px; font-weight: 700; margin: 0; color: var(--lrn-ink); }

/* Top bar */
.lrn-topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 28px;
  background: var(--lrn-surface);
  border-bottom: 1px solid var(--lrn-border);
  position: sticky;
  top: 0;
  z-index: 5;
}
.lrn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--lrn-surface);
  border: 1px solid var(--lrn-border-strong);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--lrn-text);
  cursor: pointer;
  flex-shrink: 0;
}
.lrn-back:hover { border-color: var(--lrn-ink); }

.lrn-topbar__info { min-width: 0; flex: 1; }
.lrn-topbar__eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--lrn-accent);
  margin: 0 0 3px;
}
.lrn-topbar__title {
  font-size: 16.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0;
  color: var(--lrn-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lrn-topbar__progress { display: flex; align-items: center; gap: 10px; flex-shrink: 0; width: 220px; }
.lrn-topbar__bar { flex: 1; height: 7px; border-radius: 999px; background: var(--lrn-border); overflow: hidden; }
.lrn-topbar__fill { height: 100%; background: var(--lrn-teal); border-radius: 999px; transition: width 0.25s ease; }
.lrn-topbar__pct { font-family: var(--lrn-font-mono); font-size: 12.5px; font-weight: 600; color: var(--lrn-text-soft); width: 34px; text-align: right; }

.lrn-preview-badge {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: #fdf0e3;
  color: var(--lrn-amber);
  padding: 5px 9px;
  border-radius: 6px;
  flex-shrink: 0;
}

/* Layout */
.lrn-layout { display: flex; align-items: flex-start; gap: 24px; padding: 24px 28px 64px; max-width: 1400px; margin: 0 auto; }

/* Chapter rail */
.lrn-rail {
  width: 300px;
  flex-shrink: 0;
  background: var(--lrn-surface);
  border: 1px solid var(--lrn-border);
  border-radius: var(--lrn-radius-lg);
  box-shadow: var(--lrn-shadow);
  overflow: hidden;
  position: sticky;
  top: 84px;
}
.lrn-rail__head {
  padding: 14px 16px;
  border-bottom: 1px solid var(--lrn-border);
}
.lrn-rail__head h3 { margin: 0 0 2px; font-size: 13.5px; font-weight: 700; color: var(--lrn-ink); }
.lrn-rail__head span { font-size: 11.5px; color: var(--lrn-text-faint); font-family: var(--lrn-font-mono); }

.lrn-rail__list { list-style: none; margin: 0; padding: 6px; max-height: calc(100vh - 220px); overflow-y: auto; }

.lrn-rail__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 9px;
  padding: 10px 10px;
  cursor: pointer;
  position: relative;
}
.lrn-rail__item:hover { background: #f4f5f9; }
.lrn-rail__item.is-active { background: #eef1f8; }
.lrn-rail__item.is-locked { opacity: 0.55; cursor: not-allowed; }
.lrn-rail__item.is-locked:hover { background: transparent; }

.lrn-rail__node {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  font-family: var(--lrn-font-mono);
  background: var(--lrn-border);
  color: var(--lrn-text-soft);
  margin-top: 1px;
}
.lrn-rail__item.is-active .lrn-rail__node { background: var(--lrn-accent); color: #fff; }
.lrn-rail__item.is-done .lrn-rail__node { background: var(--lrn-teal); color: #fff; }
.lrn-rail__item.is-locked .lrn-rail__node { background: var(--lrn-border); color: var(--lrn-text-faint); }

.lrn-rail__body { min-width: 0; flex: 1; }
.lrn-rail__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--lrn-ink);
  margin: 0 0 4px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.lrn-rail__item.is-active .lrn-rail__title { color: var(--lrn-accent); }
.lrn-rail__item.is-locked .lrn-rail__title { color: var(--lrn-text-faint); }
.lrn-rail__meta { display: flex; gap: 7px; flex-wrap: wrap; align-items: center; }
.lrn-rail__chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 600;
  color: var(--lrn-text-faint);
}
.lrn-rail__lock-note {
  font-size: 10px;
  color: var(--lrn-text-faint);
  font-style: italic;
}

/* Main panel */
.lrn-main { flex: 1; min-width: 0; }

.lrn-player {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #05070d;
  border-radius: var(--lrn-radius-lg);
  overflow: hidden;
  box-shadow: var(--lrn-shadow);
}
.lrn-player iframe, .lrn-player video { width: 100%; height: 100%; border: none; display: block; background: #000; }
.lrn-player--empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #6b7280;
  background: #12151d;
}
.lrn-player--empty p { margin: 0; font-size: 13.5px; }

.lrn-chapter-head { margin: 20px 0 4px; }
.lrn-chapter-head__eyebrow {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--lrn-accent);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin: 0 0 4px;
}
.lrn-chapter-head h1 { font-size: 21px; font-weight: 700; letter-spacing: -0.01em; margin: 0; color: var(--lrn-ink); }

.lrn-tabs {
  display: flex;
  gap: 4px;
  margin: 18px 0 16px;
  border-bottom: 1px solid var(--lrn-border);
}
.lrn-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--lrn-text-soft);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.lrn-tab:hover { color: var(--lrn-ink); }
.lrn-tab.is-active { color: var(--lrn-accent); border-bottom-color: var(--lrn-accent); }
.lrn-tab__count {
  background: var(--lrn-border);
  color: var(--lrn-text-soft);
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 10.5px;
  font-family: var(--lrn-font-mono);
}
.lrn-tab.is-active .lrn-tab__count { background: var(--lrn-accent); color: #fff; }

.lrn-tab-panel {
  background: var(--lrn-surface);
  border: 1px solid var(--lrn-border);
  border-radius: var(--lrn-radius-lg);
  padding: 22px;
  min-height: 160px;
  box-shadow: var(--lrn-shadow);
}

.lrn-notes { font-size: 14px; line-height: 1.7; color: var(--lrn-text); white-space: pre-wrap; margin: 0; }
.lrn-notes--empty { color: var(--lrn-text-faint); font-style: italic; }

.lrn-empty-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 0;
  color: var(--lrn-text-faint);
}
.lrn-empty-tab p { margin: 0; font-size: 13.5px; }

.lrn-snippets { display: flex; flex-direction: column; gap: 14px; }
.lrn-snippet { border: 1px solid var(--lrn-border-strong); border-radius: 10px; overflow: hidden; }
.lrn-snippet__head { display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; background: #f2f3f7; }
.lrn-snippet__lang { font-size: 11.5px; font-weight: 700; color: var(--lrn-text-soft); font-family: var(--lrn-font-mono); text-transform: uppercase; letter-spacing: 0.03em; }
.lrn-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--lrn-surface);
  border: 1px solid var(--lrn-border-strong);
  border-radius: 6px;
  padding: 4px 9px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--lrn-text-soft);
  cursor: pointer;
}
.lrn-copy-btn:hover { color: var(--lrn-ink); border-color: var(--lrn-ink); }
.lrn-snippet__code {
  margin: 0;
  padding: 14px 16px;
  background: var(--lrn-code-bg);
  color: var(--lrn-code-text);
  font-family: var(--lrn-font-mono);
  font-size: 12.8px;
  line-height: 1.6;
  overflow-x: auto;
}

.lrn-quiz { display: flex; flex-direction: column; gap: 16px; }
.lrn-quiz__score {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--lrn-text-soft);
  font-family: var(--lrn-font-mono);
}
.lrn-quiz__done { color: var(--lrn-teal); }

.lrn-quiz-card {
  border: 1px solid var(--lrn-border-strong);
  border-radius: 10px;
  padding: 16px;
}
.lrn-quiz-card__q { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; font-weight: 600; color: var(--lrn-ink); margin: 0 0 12px; }
.lrn-quiz-card__num {
  flex-shrink: 0;
  font-family: var(--lrn-font-mono);
  font-size: 11px;
  font-weight: 700;
  background: #eef1f8;
  color: var(--lrn-accent);
  padding: 2px 7px;
  border-radius: 6px;
  margin-top: 1px;
}
.lrn-quiz-card__options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.lrn-quiz-opt {
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  padding: 10px 12px;
  border: 1px solid var(--lrn-border-strong);
  border-radius: 8px;
  background: var(--lrn-surface);
  font-size: 13px;
  color: var(--lrn-text);
  cursor: pointer;
}
.lrn-quiz-opt:hover:not(:disabled) { border-color: var(--lrn-accent); background: #f7f9fd; }
.lrn-quiz-opt:disabled { cursor: default; }
.lrn-quiz-opt__marker {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--lrn-border);
  color: var(--lrn-text-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10.5px;
  font-weight: 700;
  font-family: var(--lrn-font-mono);
}
.lrn-quiz-opt--correct { border-color: var(--lrn-teal); background: #e7f5f3; }
.lrn-quiz-opt--correct .lrn-quiz-opt__marker { background: var(--lrn-teal); color: #fff; }
.lrn-quiz-opt--wrong { border-color: var(--lrn-danger); background: #fbecee; }
.lrn-quiz-opt--wrong .lrn-quiz-opt__marker { background: var(--lrn-danger); color: #fff; }
.lrn-quiz-card__feedback { margin: 10px 0 0; font-size: 12.5px; font-weight: 600; }
.lrn-quiz-card__feedback.is-correct { color: var(--lrn-teal); }
.lrn-quiz-card__feedback.is-wrong { color: var(--lrn-danger); }

/* Footer nav */
.lrn-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 22px;
}
.lrn-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--lrn-surface);
  border: 1px solid var(--lrn-border-strong);
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--lrn-text);
  cursor: pointer;
}
.lrn-nav-btn:hover:not(:disabled) { border-color: var(--lrn-ink); }
.lrn-nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.lrn-nav-btn--primary { background: var(--lrn-ink); color: #fff; border-color: var(--lrn-ink); }
.lrn-nav-btn--primary:hover:not(:disabled) { background: #000; }
.lrn-nav-btn--done { background: var(--lrn-teal); color: #fff; border-color: var(--lrn-teal); }
.lrn-nav-btn--done:hover:not(:disabled) { background: #0b7d72; }

/* Completion state */
.lrn-complete {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  padding: 56px 24px;
  background: var(--lrn-surface);
  border: 1px solid var(--lrn-border);
  border-radius: var(--lrn-radius-lg);
  box-shadow: var(--lrn-shadow);
}
.lrn-complete--celebrate {
  background: linear-gradient(180deg, #fbfdff 0%, var(--lrn-surface) 60%);
  border: 1px solid #cfe0d9;
  position: relative;
  overflow: hidden;
}
.lrn-complete--celebrate::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 12% 20%, rgba(15,148,136,0.14), transparent 40%),
    radial-gradient(circle at 88% 15%, rgba(36,81,204,0.12), transparent 40%),
    radial-gradient(circle at 50% 100%, rgba(180,83,9,0.10), transparent 45%);
  pointer-events: none;
}
.lrn-complete__icon {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: #e7f5f3;
  color: var(--lrn-teal);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  position: relative;
  z-index: 1;
  animation: lrn-pop 0.5s cubic-bezier(.34,1.56,.64,1);
}
@keyframes lrn-pop {
  0% { transform: scale(0.4); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.lrn-complete h2 { font-size: 20px; font-weight: 700; margin: 0; color: var(--lrn-ink); position: relative; z-index: 1; }
.lrn-complete p { margin: 0; color: var(--lrn-text-soft); font-size: 13.5px; max-width: 380px; position: relative; z-index: 1; }
.lrn-complete__cert-btn {
  position: relative;
  z-index: 1;
  margin-top: 8px;
}

/* App shell (sidebar offset — matches Courses.js / Nav) */
.app-shell { display: flex; align-items: stretch; min-height: 100vh; }
.app-main { flex: 1; min-width: 0; }

@media (max-width: 960px) {
  .lrn-layout { flex-direction: column; }
  .lrn-rail { width: 100%; position: static; }
  .lrn-quiz-card__options { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .lrn-topbar { padding: 12px 16px; flex-wrap: wrap; }
  .lrn-topbar__progress { width: 100%; order: 3; }
  .lrn-layout { padding: 16px 16px 48px; }
}
    `}</style>
  );
}

export default function Content() {
  const navigate = useNavigate();
  const { id: courseId } = useParams();
  const LOGIN_ROUTE = "/login";

  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [studentName, setStudentName] = useState("");

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [enrollmentId, setEnrollmentId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [completedIdx, setCompletedIdx] = useState(() => new Set());

  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("notes");
  const [quizAnswers, setQuizAnswers] = useState({}); // { [chapterId]: { [qIndex]: optionIndex } }
  const [saving, setSaving] = useState(false);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  });

  // ---- Auth check (same pattern as Courses.js) ----
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setHasToken(false);
      setAuthChecked(true);
      const t = setTimeout(() => navigate(LOGIN_ROUTE), 1200);
      return () => clearTimeout(t);
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (cancelled) return;
        setHasToken(true);
        setIsAdmin((res.data.role || "").toLowerCase() === "admin");
        setStudentName(res.data.name || res.data.username || "");
      } catch {
        if (cancelled) return;
        localStorage.removeItem("token");
        setHasToken(false);
        const t = setTimeout(() => navigate(LOGIN_ROUTE), 1200);
        return () => clearTimeout(t);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // ---- Load course + (for students) enrollment/progress ----
  useEffect(() => {
    if (!hasToken || !courseId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const courseRes = await axios.get(`${API_BASE}/courses/${courseId}`, { headers: authHeaders() });
        if (cancelled) return;
        const loadedCourse = {
          ...courseRes.data,
          id: courseRes.data.id || courseRes.data._id,
          chapters: Array.isArray(courseRes.data.chapters) ? courseRes.data.chapters : [],
        };
        setCourse(loadedCourse);

        if (!isAdmin) {
          // Find (or create) this student's enrollment so progress can be tracked.
          let enrollments = [];
          try {
            const enrRes = await axios.get(`${API_BASE}/my-enrollments`, { headers: authHeaders() });
            enrollments = enrRes.data || [];
          } catch {
            enrollments = [];
          }
          let mine = enrollments.find((e) => String(e.courseId) === String(loadedCourse.id));

          if (!mine) {
            try {
              const enrollRes = await axios.post(
                `${API_BASE}/courses/${loadedCourse.id}/enroll`,
                {},
                { headers: authHeaders() }
              );
              mine = { enrollmentId: enrollRes.data.id, progress: 0, completed: false };
            } catch {
              // Already enrolled (race) or enrollment not permitted — re-fetch once more.
              try {
                const retryRes = await axios.get(`${API_BASE}/my-enrollments`, { headers: authHeaders() });
                mine = (retryRes.data || []).find((e) => String(e.courseId) === String(loadedCourse.id));
              } catch {
                mine = null;
              }
            }
          }

          if (mine && !cancelled) {
            setEnrollmentId(mine.enrollmentId);
            setProgress(mine.progress || 0);
            const total = loadedCourse.chapters.length;
            const doneCount = total > 0 ? Math.round(((mine.progress || 0) / 100) * total) : 0;
            setCompletedIdx(new Set(Array.from({ length: doneCount }, (_, i) => i)));
            // Resume where they left off — the first not-yet-completed
            // chapter — rather than always jumping back to Class 1.
            const resumeAt = total > 0 ? Math.min(doneCount, total - 1) : 0;
            setActiveIndex(resumeAt);
          }
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(err.response?.data?.message || "Couldn't load this course. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken, isAdmin, courseId]);

  const chapters = course?.chapters || [];
  const totalChapters = chapters.length;
  const activeChapter = chapters[activeIndex] || null;

  const totalCode = useMemo(
    () => chapters.reduce((n, c) => n + (c.codeSnippets?.length || 0), 0),
    [chapters]
  );
  const totalQuestions = useMemo(
    () => chapters.reduce((n, c) => n + (c.questions?.length || 0), 0),
    [chapters]
  );

  // The first chapter that ISN'T yet completed — every chapter up to
  // and including this one is unlocked; everything after it is locked.
  // Admins previewing a course always see every chapter unlocked.
  const unlockedUpTo = useMemo(() => {
    let i = 0;
    while (i < totalChapters && completedIdx.has(i)) i++;
    return i;
  }, [completedIdx, totalChapters]);

  const isLocked = (i) => !isAdmin && i > unlockedUpTo;

  useEffect(() => {
    setActiveTab("notes");
  }, [activeIndex]);

  const handleAnswer = (chapterId, qIndex, optIndex) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [chapterId]: { ...(prev[chapterId] || {}), [qIndex]: optIndex },
    }));
  };

  const persistProgress = async (nextCompletedSet) => {
    if (!enrollmentId || totalChapters === 0) return;
    const nextProgress = Math.round((nextCompletedSet.size / totalChapters) * 100);
    setProgress(nextProgress);
    setSaving(true);
    try {
      await axios.put(
        `${API_BASE}/enrollments/${enrollmentId}`,
        { progress: nextProgress },
        { headers: authHeaders() }
      );
    } catch {
      // Non-fatal — the visible progress bar still reflects the local state;
      // it'll reconcile with the server on next visit.
    } finally {
      setSaving(false);
    }
  };

  const markCurrentComplete = () => {
    if (isAdmin) return;
    setCompletedIdx((prev) => {
      if (prev.has(activeIndex)) return prev;
      const next = new Set(prev);
      next.add(activeIndex);
      persistProgress(next);
      return next;
    });
  };

  const goToChapter = (idx) => {
    if (idx < 0 || idx >= totalChapters) return;
    if (isLocked(idx)) return;
    setActiveIndex(idx);
  };

  const goNext = () => {
    markCurrentComplete();
    if (activeIndex < totalChapters - 1) {
      goToChapter(activeIndex + 1);
    }
  };

  const chapterId = (c, i) => c.id || c._id || `chapter_${i}`;

  // ---- Guard states ----
  if (!authChecked || (hasToken && loading)) {
    return (
      <div className="app-shell">
        <Nav />
        <main className="app-main">
          <div className="lrn-page lrn-page--centered">
            <ContentStyles />
            <h2>Loading your class…</h2>
          </div>
        </main>
      </div>
    );
  }
  if (!hasToken) {
    return (
      <div className="app-shell">
        <Nav />
        <main className="app-main">
          <div className="lrn-page lrn-page--centered">
            <ContentStyles />
            <h2>Please log in</h2>
            <p>Redirecting you to login…</p>
          </div>
        </main>
      </div>
    );
  }
  if (loadError || !course) {
    return (
      <div className="app-shell">
        <Nav />
        <main className="app-main">
          <div className="lrn-page lrn-page--centered">
            <ContentStyles />
            <h2>{loadError ? "Couldn't load this course" : "Course not found"}</h2>
            <p>{loadError || "It may have been removed."}</p>
            <button className="lrn-back" style={{ marginTop: 14 }} onClick={() => navigate("/courses")}>
              <Icon.Back /> Back to courses
            </button>
          </div>
        </main>
      </div>
    );
  }

  const isFullyComplete = !isAdmin && totalChapters > 0 && completedIdx.size >= totalChapters;

  return (
    <div className="app-shell">
      <Nav />
      <main className="app-main">
        <div className="lrn-page">
          <ContentStyles />

          <div className="lrn-topbar">
            <button className="lrn-back" onClick={() => navigate(`/courses/${course.id}`)}>
              <Icon.Back /> Course
            </button>
            <div className="lrn-topbar__info">
              <p className="lrn-topbar__eyebrow">{course.category}</p>
              <h1 className="lrn-topbar__title">{course.title}</h1>
            </div>
            {isAdmin ? (
              <span className="lrn-preview-badge">Admin preview</span>
            ) : (
              <div className="lrn-topbar__progress">
                <div className="lrn-topbar__bar">
                  <div className="lrn-topbar__fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="lrn-topbar__pct">{progress}%</span>
              </div>
            )}
          </div>

          {totalChapters === 0 ? (
            <div className="lrn-layout" style={{ display: "block" }}>
              <div className="lrn-complete">
                <div className="lrn-complete__icon"><Icon.Empty /></div>
                <h2>No classes yet</h2>
                <p>
                  {isAdmin
                    ? "This course doesn't have any chapters yet. Add some from the course editor."
                    : "The instructor hasn't published any classes for this course yet — check back soon."}
                </p>
              </div>
            </div>
          ) : (
            <div className="lrn-layout">
              {/* Chapter rail */}
              <aside className="lrn-rail">
                <div className="lrn-rail__head">
                  <h3>Classes</h3>
                  <span>
                    {totalChapters} class{totalChapters === 1 ? "" : "es"} · {totalCode} code · {totalQuestions} questions
                  </span>
                </div>
                <ul className="lrn-rail__list">
                  {chapters.map((c, i) => {
                    const done = completedIdx.has(i);
                    const locked = isLocked(i);
                    return (
                      <li key={chapterId(c, i)}>
                        <button
                          type="button"
                          className={`lrn-rail__item ${activeIndex === i ? "is-active" : ""} ${done ? "is-done" : ""} ${locked ? "is-locked" : ""}`}
                          onClick={() => goToChapter(i)}
                          disabled={locked}
                          title={locked ? "Complete the previous class to unlock this one" : undefined}
                        >
                          <span className="lrn-rail__node">
                            {done ? <Icon.Check /> : locked ? <Icon.Lock /> : i + 1}
                          </span>
                          <span className="lrn-rail__body">
                            <span className="lrn-rail__title">{c.title || `Class ${i + 1}`}</span>
                            <span className="lrn-rail__meta">
                              {locked ? (
                                <span className="lrn-rail__lock-note">Locked</span>
                              ) : (
                                <>
                                  {(c.videoUrl || c.videoFile) && (
                                    <span className="lrn-rail__chip"><Icon.Video /> Video</span>
                                  )}
                                  {c.codeSnippets?.length > 0 && (
                                    <span className="lrn-rail__chip"><Icon.Code /> {c.codeSnippets.length}</span>
                                  )}
                                  {c.questions?.length > 0 && (
                                    <span className="lrn-rail__chip"><Icon.Quiz /> {c.questions.length}</span>
                                  )}
                                </>
                              )}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>

              {/* Main content */}
              <section className="lrn-main">
                {activeChapter && (
                  <>
                    <ChapterVideo chapter={activeChapter} />

                    <div className="lrn-chapter-head">
                      <p className="lrn-chapter-head__eyebrow">Class {activeIndex + 1} of {totalChapters}</p>
                      <h1>{activeChapter.title || `Class ${activeIndex + 1}`}</h1>
                    </div>

                    <div className="lrn-tabs">
                      <button
                        type="button"
                        className={`lrn-tab ${activeTab === "notes" ? "is-active" : ""}`}
                        onClick={() => setActiveTab("notes")}
                      >
                        Notes
                      </button>
                      <button
                        type="button"
                        className={`lrn-tab ${activeTab === "code" ? "is-active" : ""}`}
                        onClick={() => setActiveTab("code")}
                      >
                        <Icon.Code /> Code
                        <span className="lrn-tab__count">{activeChapter.codeSnippets?.length || 0}</span>
                      </button>
                      <button
                        type="button"
                        className={`lrn-tab ${activeTab === "practice" ? "is-active" : ""}`}
                        onClick={() => setActiveTab("practice")}
                      >
                        <Icon.Quiz /> Practice
                        <span className="lrn-tab__count">{activeChapter.questions?.length || 0}</span>
                      </button>
                    </div>

                    <div className="lrn-tab-panel">
                      {activeTab === "notes" &&
                        (activeChapter.content?.trim() ? (
                          <p className="lrn-notes">{activeChapter.content}</p>
                        ) : (
                          <p className="lrn-notes lrn-notes--empty">No notes were added for this class.</p>
                        ))}
                      {activeTab === "code" && <CodeSnippets snippets={activeChapter.codeSnippets} />}
                      {activeTab === "practice" && (
                        <PracticeQuiz
                          chapterId={chapterId(activeChapter, activeIndex)}
                          questions={activeChapter.questions}
                          answers={quizAnswers[chapterId(activeChapter, activeIndex)]}
                          onAnswer={handleAnswer}
                        />
                      )}
                    </div>

                    <div className="lrn-footer">
                      <button
                        type="button"
                        className="lrn-nav-btn"
                        onClick={() => goToChapter(activeIndex - 1)}
                        disabled={activeIndex === 0}
                      >
                        <Icon.Back /> Previous class
                      </button>

                      {isAdmin ? (
                        <span />
                      ) : activeIndex < totalChapters - 1 ? (
                        <button type="button" className="lrn-nav-btn lrn-nav-btn--primary" onClick={goNext} disabled={saving}>
                          {completedIdx.has(activeIndex) ? "Next class" : "Mark complete & continue"} <Icon.Chevron />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="lrn-nav-btn lrn-nav-btn--done"
                          onClick={markCurrentComplete}
                          disabled={saving || completedIdx.has(activeIndex)}
                        >
                          <Icon.Check /> {completedIdx.has(activeIndex) ? "Class completed" : "Mark complete"}
                        </button>
                      )}
                    </div>

                    {isFullyComplete && (
                      <div className="lrn-complete lrn-complete--celebrate" style={{ marginTop: 22 }}>
                        <div className="lrn-complete__icon"><Icon.Trophy /></div>
                        <h2>🎉 Course completed{studentName ? `, ${studentName}` : ""}!</h2>
                        <p>
                          You've finished every class in "{course.title}". Your certificate is ready to view and download.
                        </p>
                        <button
                          type="button"
                          className="lrn-nav-btn lrn-nav-btn--primary lrn-complete__cert-btn"
                          onClick={() =>
                            navigate(`/certificate/${course.id}`, {
                              state: { course, studentName },
                            })
                          }
                        >
                          View Certificate <Icon.Chevron />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}