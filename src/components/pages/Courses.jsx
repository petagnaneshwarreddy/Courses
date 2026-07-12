import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Nav from "./Nav";

// Base API root — course routes live directly at `${API_BASE}/courses`,
// matching the backend's app.get/post/put/delete("/courses"...) routes.
const API_BASE = "https://course-backend-01ye.onrender.com";

/* ------------------------------------------------------------------
   COURSES.js  —  Admin-only course management page
   ------------------------------------------------------------------ */

// 24 categories — a color is assigned to any category not explicitly
// listed in CATEGORY_COLORS by cycling through PALETTE, so new categories
// never fall back to a single flat blue.
const CATEGORIES = [
  "Web Development",
  "Data Science",
  "Design",
  "Cloud & DevOps",
  "Mobile Development",
  "Cybersecurity",
  "Artificial Intelligence",
  "Machine Learning",
  "Blockchain",
  "Game Development",
  "DevOps Engineering",
  "UI/UX Design",
  "Digital Marketing",
  "Product Management",
  "Business Analytics",
  "Database Management",
  "Networking",
  "Ethical Hacking",
  "Software Testing",
  "Full Stack Development",
  "Backend Development",
  "Frontend Development",
  "AR/VR Development",
  "Robotics & IoT",
];

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

const CATEGORY_COLORS = {
  "Web Development": "#2451CC",
  "Data Science": "#0F9488",
  Design: "#C2540A",
  "Cloud & DevOps": "#6D4FD1",
  "Mobile Development": "#B45309",
  Cybersecurity: "#B0223A",
};

const PALETTE = [
  "#2451CC", "#0F9488", "#C2540A", "#6D4FD1", "#B45309", "#B0223A",
  "#0E7490", "#7C3AED", "#B8860B", "#0D9276", "#9333EA", "#C2410C",
];

function categoryColor(cat) {
  if (CATEGORY_COLORS[cat]) return CATEGORY_COLORS[cat];
  const idx = CATEGORIES.indexOf(cat);
  return PALETTE[(idx >= 0 ? idx : 0) % PALETTE.length];
}

const CODE_LANGUAGES = [
  "JavaScript", "Python", "Java", "C++", "C", "HTML/CSS", "SQL", "TypeScript", "Bash", "Other",
];

function currency(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function initials(name = "") {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Short unique-enough id for client-side list keys (chapters, code
// snippets, questions). The backend is free to assign its own _id once
// these are persisted — this is only used for React keys + editing.
function genId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function youtubeEmbedId(url = "") {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

// Normalizes a course coming back from the API so the rest of the
// component can rely on a stable `id`, `students`, and `rating` field
// regardless of what Mongo/the backend actually returned.
function normalizeCourse(c) {
  return {
    ...c,
    id: c.id || c._id,
    students: c.students ?? 0,
    rating: c.rating ?? 0,
    chapters: Array.isArray(c.chapters) ? c.chapters : [],
  };
}

/* ------------------------------ Icons ------------------------------
   Small inline SVG icon set (stroke-based, 1.5px, currentColor) used
   throughout the page in place of emoji, so the UI reads consistently
   across platforms and renders identically for every user.
   -------------------------------------------------------------------- */

const Icon = {
  Search: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" {...p}>
      <circle cx="8.5" cy="8.5" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.3 13.3 17.5 17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  Close: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="14" height="14" {...p}>
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Edit: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="15" height="15" {...p}>
      <path
        d="M12.6 3.4a1.6 1.6 0 0 1 2.3 0l1.7 1.7a1.6 1.6 0 0 1 0 2.3L7.4 16.6l-4 .9.9-4L12.6 3.4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Trash: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="15" height="15" {...p}>
      <path
        d="M4.5 6h11M8.3 6V4.6c0-.6.5-1.1 1.1-1.1h1.2c.6 0 1.1.5 1.1 1.1V6M6 6l.6 9.4c0 .6.5 1.1 1.1 1.1h4.6c.6 0 1-.5 1.1-1.1L14 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Grid: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="15" height="15" {...p}>
      <rect x="3" y="3" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="3" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="11" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  List: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="15" height="15" {...p}>
      <path d="M4 5.5h12M4 10h12M4 14.5h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  Star: (p) => (
    <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12" {...p}>
      <path d="M10 2.5l2.24 4.54 5.01.73-3.62 3.53.86 4.99L10 13.9l-4.49 2.39.86-4.99L2.75 7.77l5.01-.73L10 2.5Z" />
    </svg>
  ),
  Plus: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="15" height="15" {...p}>
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Book: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="17" height="17" {...p}>
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H16v13H5.5A1.5 1.5 0 0 0 4 17.5v-13Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M4 15.7V17.5A1.5 1.5 0 0 0 5.5 19H16" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="17" height="17" {...p}>
      <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 10.2 9 12.2 13.2 7.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Users: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="17" height="17" {...p}>
      <circle cx="7.2" cy="7" r="2.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.6 16.4c.6-2.6 2.4-4 4.6-4s4 1.4 4.6 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="14.2" cy="7.4" r="2.1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12.6 16.4c.4-1.9 1.6-3.2 3-3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Rupee: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="17" height="17" {...p}>
      <path d="M6 4h8M6 7.4h8M6 4c3.6 0 5.6 1.5 5.6 3.4 0 1.9-2 3.4-5.6 3.4H6l6 5.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Chevron: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="15" height="15" {...p}>
      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Video: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" {...p}>
      <rect x="2.5" y="5" width="10.5" height="10" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M13.5 8.3 17 6v8l-3.5-2.3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  Youtube: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" {...p}>
      <rect x="2" y="4.5" width="16" height="11" rx="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8.4 7.8v4.4l4-2.2-4-2.2Z" fill="currentColor" />
    </svg>
  ),
  Code: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" {...p}>
      <path d="M7 6 3 10l4 4M13 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Quiz: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" {...p}>
      <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 8a2 2 0 1 1 2.6 1.9c-.6.2-1 .7-1 1.4v.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="9.6" cy="13.6" r="0.75" fill="currentColor" />
    </svg>
  ),
};

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div className={`crs-toast crs-toast--${toast.type}`}>
      <span>{toast.message}</span>
      <button onClick={onClose} aria-label="Dismiss">
        <Icon.Close />
      </button>
    </div>
  );
}

function ConfirmDialog({ open, title, body, onConfirm, onCancel, confirmLabel = "Delete", tone = "danger" }) {
  if (!open) return null;
  return (
    <div className="crs-overlay" onMouseDown={onCancel}>
      <div
        className="crs-confirm"
        role="alertdialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        <p>{body}</p>
        <div className="crs-confirm__actions">
          <button className="crs-btn crs-btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`crs-btn ${tone === "danger" ? "crs-btn--danger" : "crs-btn--success"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- Chapter builder -------------------------
   Lets an admin add zero or more chapters ("classes") to a course.
   Each chapter carries one video (an uploaded file OR a YouTube link),
   free-text content, any number of code snippets, and any number of
   practice questions. Entirely optional — a course can be created,
   saved and published with no chapters, and chapters added later by
   re-opening the same "Edit course" modal.
   -------------------------------------------------------------------- */

function CodeSnippetEditor({ snippet, index, onChange, onRemove }) {
  return (
    <div className="crs-snippet">
      <div className="crs-snippet__head">
        <span className="crs-snippet__label"><Icon.Code /> Code snippet {index + 1}</span>
        <select
          value={snippet.language}
          onChange={(e) => onChange({ ...snippet, language: e.target.value })}
        >
          {CODE_LANGUAGES.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <button
          type="button"
          className="crs-icon-btn crs-icon-btn--danger"
          onClick={onRemove}
          aria-label="Remove code snippet"
        >
          <Icon.Trash />
        </button>
      </div>
      <textarea
        className="crs-snippet__code"
        rows={5}
        placeholder="Paste or write the code students will see…"
        value={snippet.code}
        onChange={(e) => onChange({ ...snippet, code: e.target.value })}
      />
    </div>
  );
}

function QuestionEditor({ question, index, onChange, onRemove }) {
  const updateOption = (optIdx, value) => {
    const options = [...question.options];
    options[optIdx] = value;
    onChange({ ...question, options });
  };
  return (
    <div className="crs-question">
      <div className="crs-question__head">
        <span className="crs-snippet__label"><Icon.Quiz /> Question {index + 1}</span>
        <button
          type="button"
          className="crs-icon-btn crs-icon-btn--danger"
          onClick={onRemove}
          aria-label="Remove question"
        >
          <Icon.Trash />
        </button>
      </div>
      <input
        type="text"
        placeholder="Practice question…"
        value={question.question}
        onChange={(e) => onChange({ ...question, question: e.target.value })}
      />
      <div className="crs-question__options">
        {question.options.map((opt, i) => (
          <label key={i} className="crs-question__option">
            <input
              type="radio"
              name={`correct-${question.id}`}
              checked={question.correctIndex === i}
              onChange={() => onChange({ ...question, correctIndex: i })}
            />
            <input
              type="text"
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
            />
          </label>
        ))}
      </div>
      <p className="crs-question__hint">Select the radio button next to the correct option.</p>
    </div>
  );
}

function ChapterCard({ chapter, index, expanded, onToggle, onChange, onRemove }) {
  const videoRef = useRef(null);

  const update = (patch) => onChange({ ...chapter, ...patch });

  const handleVideoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ videoFile: reader.result, videoUrl: "" });
    reader.readAsDataURL(file);
  };

  const addSnippet = () =>
    update({
      codeSnippets: [
        ...chapter.codeSnippets,
        { id: genId("code"), language: CODE_LANGUAGES[0], code: "" },
      ],
    });
  const updateSnippet = (i, snippet) => {
    const codeSnippets = [...chapter.codeSnippets];
    codeSnippets[i] = snippet;
    update({ codeSnippets });
  };
  const removeSnippet = (i) =>
    update({ codeSnippets: chapter.codeSnippets.filter((_, idx) => idx !== i) });

  const addQuestion = () =>
    update({
      questions: [
        ...chapter.questions,
        { id: genId("q"), question: "", options: ["", "", "", ""], correctIndex: 0 },
      ],
    });
  const updateQuestion = (i, q) => {
    const questions = [...chapter.questions];
    questions[i] = q;
    update({ questions });
  };
  const removeQuestion = (i) =>
    update({ questions: chapter.questions.filter((_, idx) => idx !== i) });

  return (
    <div className="crs-chapter">
      <div className="crs-chapter__head" onClick={onToggle}>
        <span className="crs-chapter__num">{index + 1}</span>
        <input
          type="text"
          className="crs-chapter__title"
          placeholder={`Chapter ${index + 1} title`}
          value={chapter.title}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => update({ title: e.target.value })}
        />
        <span className="crs-chapter__meta">
          {chapter.videoType === "youtube" ? chapter.videoUrl && <Icon.Youtube /> : chapter.videoFile && <Icon.Video />}
          {chapter.codeSnippets.length > 0 && <span className="crs-chapter__badge">{chapter.codeSnippets.length} code</span>}
          {chapter.questions.length > 0 && <span className="crs-chapter__badge">{chapter.questions.length} quiz</span>}
        </span>
        <button
          type="button"
          className="crs-icon-btn crs-icon-btn--danger"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove chapter"
        >
          <Icon.Trash />
        </button>
        <span className={`crs-chapter__chevron ${expanded ? "is-open" : ""}`}>
          <Icon.Chevron />
        </span>
      </div>

      {expanded && (
        <div className="crs-chapter__body">
          <div className="crs-video-tabs">
            <button
              type="button"
              className={chapter.videoType === "upload" ? "is-active" : ""}
              onClick={() => update({ videoType: "upload" })}
            >
              <Icon.Video /> Upload video
            </button>
            <button
              type="button"
              className={chapter.videoType === "youtube" ? "is-active" : ""}
              onClick={() => update({ videoType: "youtube" })}
            >
              <Icon.Youtube /> YouTube link
            </button>
          </div>

          {chapter.videoType === "upload" ? (
            <div className="crs-field">
              <input
                ref={videoRef}
                type="file"
                accept="video/*"
                hidden
                onChange={handleVideoFile}
              />
              <button type="button" className="crs-btn crs-btn--ghost" onClick={() => videoRef.current?.click()}>
                {chapter.videoFile ? "Change video file" : "Upload video file"}
              </button>
              {chapter.videoFile && <span className="crs-doc-name">Video attached</span>}
            </div>
          ) : (
            <label className="crs-field">
              <span>YouTube URL</span>
              <input
                type="url"
                placeholder="https://youtube.com/watch?v=…"
                value={chapter.videoUrl}
                onChange={(e) => update({ videoUrl: e.target.value, videoFile: "" })}
              />
            </label>
          )}

          <label className="crs-field" style={{ marginTop: 12 }}>
            <span>Chapter content</span>
            <textarea
              rows={3}
              placeholder="Notes, explanation, or a summary of what this class covers…"
              value={chapter.content}
              onChange={(e) => update({ content: e.target.value })}
            />
          </label>

          <div className="crs-chapter__section">
            <div className="crs-chapter__section-head">
              <h4>Code snippets (optional)</h4>
              <button type="button" className="crs-btn crs-btn--ghost" onClick={addSnippet}>
                <Icon.Plus /> Add code
              </button>
            </div>
            {chapter.codeSnippets.map((s, i) => (
              <CodeSnippetEditor
                key={s.id}
                snippet={s}
                index={i}
                onChange={(v) => updateSnippet(i, v)}
                onRemove={() => removeSnippet(i)}
              />
            ))}
          </div>

          <div className="crs-chapter__section">
            <div className="crs-chapter__section-head">
              <h4>Practice questions (optional)</h4>
              <button type="button" className="crs-btn crs-btn--ghost" onClick={addQuestion}>
                <Icon.Plus /> Add question
              </button>
            </div>
            {chapter.questions.map((q, i) => (
              <QuestionEditor
                key={q.id}
                question={q}
                index={i}
                onChange={(v) => updateQuestion(i, v)}
                onRemove={() => removeQuestion(i)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChapterEditor({ chapters, onChange }) {
  const [expandedId, setExpandedId] = useState(null);

  const addChapter = () => {
    const chapter = {
      id: genId("ch"),
      title: "",
      videoType: "upload",
      videoFile: "",
      videoUrl: "",
      content: "",
      codeSnippets: [],
      questions: [],
    };
    onChange([...chapters, chapter]);
    setExpandedId(chapter.id);
  };

  const updateChapter = (i, chapter) => {
    const next = [...chapters];
    next[i] = chapter;
    onChange(next);
  };

  const removeChapter = (i) => onChange(chapters.filter((_, idx) => idx !== i));

  return (
    <div className="crs-chapters">
      <div className="crs-chapter__section-head">
        <h4>Chapters / classes (optional)</h4>
        <span className="crs-chapters__count">{chapters.length} added</span>
      </div>
      {chapters.map((c, i) => (
        <ChapterCard
          key={c.id}
          chapter={c}
          index={i}
          expanded={expandedId === c.id}
          onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
          onChange={(v) => updateChapter(i, v)}
          onRemove={() => removeChapter(i)}
        />
      ))}
      <button type="button" className="crs-btn crs-btn--ghost crs-add-chapter" onClick={addChapter}>
        <Icon.Plus /> Add chapter
      </button>
      <p className="crs-question__hint">
        You can publish a course with no chapters and add them later — just reopen this course
        from "Edit".
      </p>
    </div>
  );
}

function CourseModal({ open, initial, onClose, onSave, saving }) {
  const emptyForm = {
    title: "",
    category: CATEGORIES[0],
    level: LEVELS[0],
    instructor: "",
    price: "",
    duration: "",
    status: "Draft",
    thumbnail: "",
    description: "",
    document: "",
    youtubeUrl: "",
    chapters: [],
  };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [confirmPublish, setConfirmPublish] = useState(false);
  const fileRef = useRef(null);
  const docRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...emptyForm, ...initial, chapters: initial.chapters || [] } : emptyForm);
      setErrors({});
      setConfirmPublish(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  if (!open) return null;

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleThumb = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setForm((f) => ({ ...f, thumbnail: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleDoc = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setForm((f) => ({ ...f, document: reader.result }));
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.instructor.trim()) errs.instructor = "Instructor is required";
    // Price is optional — a blank price means the course is Free, so we
    // only flag it when something was actually typed and it's negative.
    if (form.price !== "" && Number(form.price) < 0) errs.price = "Enter a valid price, or leave blank for Free";
    if (!form.duration || Number(form.duration) <= 0)
      errs.duration = "Enter valid hours";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const doSave = (finalForm) => {
    onSave({
      ...finalForm,
      price: finalForm.price === "" ? 0 : Number(finalForm.price),
      duration: Number(finalForm.duration),
    });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (form.status === "Published") {
      // Publishing makes the course visible/enrollable to every student —
      // confirm before it goes live, same as toggling status on a card.
      setConfirmPublish(true);
      return;
    }
    doSave(form);
  };

  return (
    <div className="crs-overlay" onMouseDown={onClose}>
      <ConfirmDialog
        open={confirmPublish}
        title="Publish this course?"
        body="Students will be able to see this course and enroll immediately. You can move it back to Draft any time."
        confirmLabel="Yes, publish"
        tone="success"
        onConfirm={() => {
          setConfirmPublish(false);
          doSave(form);
        }}
        onCancel={() => setConfirmPublish(false)}
      />
      <div
        className="crs-modal"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="crs-modal__header">
          <h2>{initial ? "Edit course" : "Add a new course"}</h2>
          <button className="crs-icon-btn" onClick={onClose} aria-label="Close">
            <Icon.Close />
          </button>
        </div>

        <form className="crs-form" onSubmit={submit}>
          {/* Thumbnail Upload */}
          <div className="crs-form__thumb">
            <div
              className="crs-form__thumb-preview"
              style={
                form.thumbnail
                  ? { backgroundImage: `url(${form.thumbnail})` }
                  : undefined
              }
              onClick={() => fileRef.current?.click()}
            >
              {!form.thumbnail && <span>Click to upload cover image</span>}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleThumb}
            />
          </div>

          {/* Form Grid */}
          <div className="crs-form__grid">
            <label className="crs-field crs-field--wide">
              <span>Course title</span>
              <input
                type="text"
                value={form.title}
                onChange={update("title")}
                placeholder="e.g. Advanced JavaScript Patterns"
              />
              {errors.title && <em>{errors.title}</em>}
            </label>

            <label className="crs-field">
              <span>Category</span>
              <select value={form.category} onChange={update("category")}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>

            <label className="crs-field">
              <span>Level</span>
              <select value={form.level} onChange={update("level")}>
                {LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>

            <label className="crs-field">
              <span>Instructor</span>
              <input
                type="text"
                value={form.instructor}
                onChange={update("instructor")}
                placeholder="Instructor name"
              />
              {errors.instructor && <em>{errors.instructor}</em>}
            </label>

            <label className="crs-field">
              <span>Status</span>
              <select value={form.status} onChange={update("status")}>
                <option>Draft</option>
                <option>Published</option>
              </select>
            </label>

            <label className="crs-field">
              <span>Price (₹) — leave blank for Free</span>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={update("price")}
                placeholder="Free"
              />
              {errors.price && <em>{errors.price}</em>}
            </label>

            <label className="crs-field">
              <span>Duration (hours)</span>
              <input
                type="number"
                min="0"
                value={form.duration}
                onChange={update("duration")}
                placeholder="20"
              />
              {errors.duration && <em>{errors.duration}</em>}
            </label>

            <label className="crs-field crs-field--wide">
              <span>Description</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={update("description")}
                placeholder="What will students learn?"
              />
            </label>

            {/* YouTube URL */}
            <label className="crs-field crs-field--wide">
              <span>YouTube trailer URL (optional)</span>
              <input
                type="url"
                value={form.youtubeUrl}
                onChange={update("youtubeUrl")}
                placeholder="https://youtube.com/watch?v=..."
              />
            </label>
          </div>

          {/* Document Upload Section */}
          <div className="crs-form__doc">
            <label className="crs-field crs-field--wide">
              <span>Course material (optional)</span>
              <input
                ref={docRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                hidden
                onChange={handleDoc}
              />
              <button
                type="button"
                className="crs-btn crs-btn--ghost"
                onClick={() => docRef.current?.click()}
              >
                {form.document ? "Change document" : "Upload document"}
              </button>
              {form.document && (
                <span className="crs-doc-name">
                  {typeof form.document === 'string' && form.document.split(',')[0].split(':')[1]}
                </span>
              )}
            </label>
          </div>

          {/* Chapters */}
          <ChapterEditor
            chapters={form.chapters}
            onChange={(chapters) => setForm((f) => ({ ...f, chapters }))}
          />

          {/* Form Actions */}
          <div className="crs-form__actions">
            <button
              type="button"
              className="crs-btn crs-btn--ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="crs-btn crs-btn--primary" disabled={saving}>
              {saving
                ? "Saving…"
                : form.status === "Published"
                ? "Publish course"
                : initial
                ? "Save changes"
                : "Save as draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CoursesStyles() {
  return (
    <style>{`
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap");

:root {
  --crs-ink: #0f172a;
  --crs-accent: #2451cc;
  --crs-accent-dark: #1c3f9e;
  --crs-teal: #0f9488;
  --crs-amber: #b45309;
  --crs-danger: #c0293f;
  --crs-danger-dark: #a01f33;
  --crs-bg: #f5f6f9;
  --crs-surface: #ffffff;
  --crs-border: #e2e5ec;
  --crs-border-strong: #cfd4de;
  --crs-text: #10151f;
  --crs-text-soft: #5b6472;
  --crs-text-faint: #8a92a1;
  --crs-radius: 10px;
  --crs-radius-lg: 14px;
  --crs-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 1px rgba(15, 23, 42, 0.03);
  --crs-shadow-lg: 0 24px 48px -12px rgba(15, 23, 42, 0.22);
  --crs-font-body: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  --crs-font-mono: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
}

.crs-page {
  font-family: var(--crs-font-body);
  color: var(--crs-text);
  background: var(--crs-bg);
  min-height: 100%;
  padding: 32px 40px 64px;
  box-sizing: border-box;
  font-feature-settings: "tnum" 1, "cv05" 1;
}

.crs-page * {
  box-sizing: border-box;
}

.crs-page--centered {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

.crs-denied h2 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 8px;
  color: var(--crs-ink);
}
.crs-denied p {
  margin: 4px 0;
  color: var(--crs-text-soft);
  font-size: 14px;
}
.crs-denied__redirect {
  color: var(--crs-accent);
  font-weight: 600;
}

/* Header */
.crs-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
  flex-wrap: wrap;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--crs-border);
}

.crs-eyebrow {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--crs-accent);
  margin: 0 0 8px;
}

.crs-header h1 {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 6px;
  color: var(--crs-ink);
}

.crs-subtitle {
  margin: 0;
  color: var(--crs-text-soft);
  font-size: 14px;
}

.crs-banner {
  background: #fef6e8;
  border: 1px solid #f2debb;
  color: #7a4f0a;
  padding: 11px 16px;
  border-radius: var(--crs-radius);
  font-size: 13.5px;
  margin-bottom: 20px;
}

.crs-banner--error {
  background: #fbecee;
  border-color: #eec6cc;
  color: #93202f;
}

/* Buttons */
.crs-btn {
  font-family: var(--crs-font-body);
  font-weight: 600;
  font-size: 13.5px;
  border-radius: 8px;
  padding: 9px 16px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.crs-btn:active { transform: translateY(0.5px); }
.crs-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.crs-btn--primary {
  background: var(--crs-ink);
  color: #fff;
}
.crs-btn--primary:hover:not(:disabled) { background: #000; }

.crs-btn--lg { padding: 10px 20px; font-size: 14px; }

.crs-btn--ghost {
  background: var(--crs-surface);
  border: 1px solid var(--crs-border-strong);
  color: var(--crs-text);
}
.crs-btn--ghost:hover:not(:disabled) { border-color: var(--crs-ink); background: #fafafb; }

.crs-btn--danger {
  background: var(--crs-danger);
  color: #fff;
}
.crs-btn--danger:hover:not(:disabled) { background: var(--crs-danger-dark); }

.crs-btn--danger-ghost {
  background: var(--crs-surface);
  color: var(--crs-danger);
  border: 1px solid #f0ccd2;
}
.crs-btn--danger-ghost:hover:not(:disabled) { background: #fbecee; border-color: var(--crs-danger); }

.crs-btn--success {
  background: var(--crs-teal);
  color: #fff;
}
.crs-btn--success:hover:not(:disabled) { background: #0b7d72; }

.crs-icon-btn {
  background: var(--crs-surface);
  border: 1px solid var(--crs-border-strong);
  border-radius: 7px;
  width: 30px;
  height: 30px;
  cursor: pointer;
  color: var(--crs-text-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.12s ease, color 0.12s ease;
}
.crs-icon-btn:hover:not(:disabled) { border-color: var(--crs-ink); color: var(--crs-ink); }
.crs-icon-btn--danger:hover:not(:disabled) { border-color: var(--crs-danger); color: var(--crs-danger); }
.crs-icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Stats */
.crs-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

.crs-stat {
  background: var(--crs-surface);
  border: 1px solid var(--crs-border);
  border-radius: var(--crs-radius-lg);
  padding: 18px 20px;
  box-shadow: var(--crs-shadow);
  display: flex;
  align-items: center;
  gap: 14px;
}

.crs-stat__icon {
  width: 38px;
  height: 38px;
  border-radius: 9px;
  background: #eef1f8;
  color: var(--crs-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.crs-stat:nth-child(2) .crs-stat__icon { background: #e7f5f3; color: var(--crs-teal); }
.crs-stat:nth-child(3) .crs-stat__icon { background: #eef1f8; color: var(--crs-accent); }
.crs-stat:nth-child(4) .crs-stat__icon { background: #fdf0e3; color: var(--crs-amber); }

.crs-stat__text { display: flex; flex-direction: column; gap: 3px; min-width: 0; }

.crs-stat__label {
  font-size: 12px;
  color: var(--crs-text-soft);
  font-weight: 500;
}

.crs-stat__value {
  font-family: var(--crs-font-mono);
  font-size: 21px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--crs-ink);
}

/* Toolbar */
.crs-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.crs-search {
  flex: 1 1 260px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--crs-surface);
  border: 1px solid var(--crs-border-strong);
  border-radius: 8px;
  padding: 9px 13px;
  color: var(--crs-text-faint);
}
.crs-search input {
  border: none;
  outline: none;
  font-size: 13.5px;
  width: 100%;
  background: transparent;
  color: var(--crs-text);
  font-family: var(--crs-font-body);
}

.crs-toolbar select {
  border: 1px solid var(--crs-border-strong);
  background: var(--crs-surface);
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 13px;
  font-family: var(--crs-font-body);
  color: var(--crs-text);
  cursor: pointer;
}

.crs-view-toggle {
  display: flex;
  border: 1px solid var(--crs-border-strong);
  border-radius: 8px;
  overflow: hidden;
}
.crs-view-toggle button {
  background: var(--crs-surface);
  border: none;
  width: 36px;
  height: 36px;
  cursor: pointer;
  color: var(--crs-text-faint);
  display: flex;
  align-items: center;
  justify-content: center;
}
.crs-view-toggle button + button { border-left: 1px solid var(--crs-border-strong); }
.crs-view-toggle button.is-active {
  background: var(--crs-ink);
  color: #fff;
}

/* Grid + Cards */
.crs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.crs-card {
  background: var(--crs-surface);
  border: 1px solid var(--crs-border);
  border-radius: var(--crs-radius-lg);
  overflow: hidden;
  box-shadow: var(--crs-shadow);
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
}
.crs-card:hover {
  border-color: var(--crs-border-strong);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
}

.crs-card--clickable { cursor: pointer; }

.crs-card--skeleton {
  height: 320px;
  background: linear-gradient(90deg, #ecedf2 25%, #f5f6f9 37%, #ecedf2 63%);
  background-size: 400% 100%;
  animation: crs-shimmer 1.4s ease infinite;
}
@keyframes crs-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

.crs-card__cover {
  height: 116px;
  background-size: cover;
  background-position: center;
  position: relative;
  padding: 12px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.crs-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 6px;
  letter-spacing: 0.01em;
}
.crs-tag--inline { display: inline-block; }

.crs-status {
  border: none;
  font-size: 10.5px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.crs-status:disabled { opacity: 0.6; cursor: not-allowed; }
.crs-status--published { background: #e3f5ee; color: #0d7a49; }
.crs-status--draft { background: #fdf0e3; color: #92590a; }

.crs-card__body {
  padding: 15px 17px 4px;
  flex: 1;
}

.crs-card__body h3 {
  font-size: 15.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 6px;
  color: var(--crs-ink);
  line-height: 1.35;
}

.crs-card__desc {
  font-size: 13px;
  line-height: 1.5;
  color: var(--crs-text-soft);
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.crs-card__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--crs-text-soft);
  margin-bottom: 8px;
}

.crs-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 10px;
}
.crs-rating__stars {
  display: inline-flex;
  gap: 1px;
  color: #d9a012;
}
.crs-rating__stars svg[data-empty="true"] { color: #e2e5ec; }
.crs-rating__value {
  font-family: var(--crs-font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--crs-text-soft);
}

.crs-avatar {
  width: 21px;
  height: 21px;
  border-radius: 50%;
  background: var(--crs-ink);
  color: #fff;
  font-size: 9.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.crs-dot { opacity: 0.5; }

.crs-card__row {
  display: flex;
  align-items: center;
  gap: 16px;
  border-top: 1px solid var(--crs-border);
  padding: 12px 0;
  margin-bottom: 4px;
}

.crs-card__figure {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 10.5px;
  color: var(--crs-text-faint);
}
.crs-card__figure strong {
  font-family: var(--crs-font-mono);
  font-size: 13.5px;
  font-weight: 600;
  color: var(--crs-text);
  display: flex;
  align-items: center;
  gap: 3px;
}
.crs-card__figure strong svg { color: #d9a012; }

.crs-card__price {
  margin-left: auto;
  font-family: var(--crs-font-mono);
  font-weight: 600;
  color: var(--crs-ink);
  font-size: 15px;
}

.crs-card__actions {
  display: flex;
  gap: 8px;
  padding: 13px 17px 17px;
}
.crs-card__actions .crs-btn { flex: 1; text-align: center; }

.crs-progress {
  padding: 0 17px 13px;
}
.crs-progress__bar {
  height: 6px;
  border-radius: 999px;
  background: var(--crs-border);
  overflow: hidden;
  margin-bottom: 6px;
}
.crs-progress__fill {
  height: 100%;
  background: var(--crs-teal);
  border-radius: 999px;
  transition: width 0.2s ease;
}
.crs-progress__label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--crs-text-soft);
  font-family: var(--crs-font-mono);
}

/* Table view */
.crs-table-wrap {
  background: var(--crs-surface);
  border: 1px solid var(--crs-border);
  border-radius: var(--crs-radius-lg);
  overflow: hidden;
  box-shadow: var(--crs-shadow);
}
.crs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}
.crs-table thead {
  background: #fafbfc;
}
.crs-table th {
  text-align: left;
  padding: 11px 16px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--crs-text-faint);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--crs-border);
}
.crs-table td {
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid var(--crs-border);
}
.crs-table tbody tr:last-child td { border-bottom: none; }
.crs-table tbody tr:hover { background: #fafbfd; }
.crs-table__title { font-weight: 600; color: var(--crs-ink); cursor: pointer; }
.crs-table__title:hover { text-decoration: underline; }
.crs-table td:nth-child(4), .crs-table td:nth-child(5) { font-family: var(--crs-font-mono); }
.crs-table__actions { display: flex; gap: 8px; }

/* Empty state */
.crs-empty {
  text-align: center;
  padding: 64px 24px;
  background: var(--crs-surface);
  border: 1px dashed var(--crs-border-strong);
  border-radius: var(--crs-radius-lg);
}
.crs-empty h3 { font-size: 16px; font-weight: 700; margin: 0 0 6px; color: var(--crs-ink); }
.crs-empty p { color: var(--crs-text-soft); margin: 0 0 18px; font-size: 13.5px; }

/* Modal / overlay */
.crs-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(2px);
}

.crs-modal {
  background: var(--crs-surface);
  border-radius: 16px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--crs-shadow-lg);
}

.crs-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid var(--crs-border);
  position: sticky;
  top: 0;
  background: var(--crs-surface);
  z-index: 2;
}
.crs-modal__header h2 {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0;
  color: var(--crs-ink);
}

.crs-form { padding: 20px 22px 22px; }

.crs-form__thumb-preview {
  height: 132px;
  border-radius: var(--crs-radius);
  border: 1.5px dashed var(--crs-border-strong);
  background: #fafbfc;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--crs-text-faint);
  font-size: 13px;
  cursor: pointer;
  margin-bottom: 18px;
  transition: border-color 0.12s ease;
}
.crs-form__thumb-preview:hover { border-color: var(--crs-accent); }

.crs-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.crs-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--crs-text-soft);
}
.crs-field--wide { grid-column: 1 / -1; }

.crs-field input,
.crs-field select,
.crs-field textarea {
  font-family: var(--crs-font-body);
  font-size: 13.5px;
  font-weight: 400;
  color: var(--crs-text);
  border: 1px solid var(--crs-border-strong);
  border-radius: 8px;
  padding: 9px 12px;
  outline: none;
  resize: vertical;
}
.crs-field input:focus,
.crs-field select:focus,
.crs-field textarea:focus {
  border-color: var(--crs-accent);
  box-shadow: 0 0 0 3px rgba(36, 81, 204, 0.12);
}
.crs-field em {
  font-style: normal;
  color: var(--crs-danger);
  font-size: 11.5px;
  font-weight: 500;
}

/* Document Upload Styles */
.crs-form__doc {
  margin-top: 14px;
}

.crs-doc-name {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  font-weight: 400;
  color: var(--crs-text-faint);
  word-break: break-all;
}

.crs-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--crs-border);
}

/* Confirm dialog */
.crs-confirm {
  background: var(--crs-surface);
  border-radius: 14px;
  padding: 22px;
  width: 100%;
  max-width: 380px;
  box-shadow: var(--crs-shadow-lg);
}
.crs-confirm h3 { margin: 0 0 8px; font-size: 16px; font-weight: 700; color: var(--crs-ink); }
.crs-confirm p { margin: 0 0 20px; color: var(--crs-text-soft); font-size: 13.5px; line-height: 1.5; }
.crs-confirm__actions { display: flex; justify-content: flex-end; gap: 10px; }

/* Toast */
.crs-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--crs-ink);
  color: #fff;
  padding: 12px 16px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13.5px;
  box-shadow: var(--crs-shadow-lg);
  z-index: 1100;
}
.crs-toast--danger { background: var(--crs-danger); }
.crs-toast button {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.75;
  display: flex;
  align-items: center;
}
.crs-toast button:hover { opacity: 1; }

/* ---------------- Chapter builder ---------------- */
.crs-chapters {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--crs-border);
}
.crs-chapter__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.crs-chapter__section-head h4 {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--crs-ink);
  margin: 0;
}
.crs-chapters__count {
  font-size: 12px;
  color: var(--crs-text-faint);
  font-family: var(--crs-font-mono);
}
.crs-chapter {
  border: 1px solid var(--crs-border-strong);
  border-radius: var(--crs-radius);
  margin-bottom: 10px;
  overflow: hidden;
  background: #fafbfc;
}
.crs-chapter__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 13px;
  cursor: pointer;
}
.crs-chapter__num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--crs-ink);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.crs-chapter__title {
  flex: 1;
  border: none !important;
  background: transparent !important;
  padding: 4px 2px !important;
  font-size: 13.5px !important;
  font-weight: 600;
  color: var(--crs-ink);
}
.crs-chapter__title:focus { box-shadow: none !important; }
.crs-chapter__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--crs-text-faint);
  flex-shrink: 0;
}
.crs-chapter__badge {
  font-size: 10.5px;
  font-weight: 600;
  background: #eef1f8;
  color: var(--crs-accent);
  padding: 3px 7px;
  border-radius: 5px;
}
.crs-chapter__chevron { color: var(--crs-text-faint); transition: transform 0.15s ease; display: flex; }
.crs-chapter__chevron.is-open { transform: rotate(180deg); }
.crs-chapter__body {
  padding: 4px 15px 16px;
  border-top: 1px solid var(--crs-border);
}
.crs-chapter__section {
  margin-top: 16px;
}

.crs-video-tabs {
  display: flex;
  gap: 8px;
  margin: 12px 0 10px;
}
.crs-video-tabs button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--crs-border-strong);
  background: var(--crs-surface);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--crs-text-soft);
  cursor: pointer;
}
.crs-video-tabs button.is-active {
  border-color: var(--crs-accent);
  color: var(--crs-accent);
  background: #eef1f8;
}

.crs-snippet {
  border: 1px solid var(--crs-border-strong);
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
}
.crs-snippet__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #f2f3f7;
}
.crs-snippet__label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--crs-text-soft);
  flex: 1;
}
.crs-snippet__head select {
  font-size: 12px;
  border: 1px solid var(--crs-border-strong);
  border-radius: 6px;
  padding: 4px 8px;
  background: var(--crs-surface);
}
.crs-snippet__code {
  width: 100%;
  border: none;
  outline: none;
  resize: vertical;
  font-family: var(--crs-font-mono);
  font-size: 12.5px;
  padding: 10px;
  background: #10151f;
  color: #e6e9f0;
}

.crs-question {
  border: 1px solid var(--crs-border-strong);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  background: var(--crs-surface);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.crs-question__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.crs-question > input[type="text"] {
  border: 1px solid var(--crs-border-strong);
  border-radius: 7px;
  padding: 8px 10px;
  font-size: 13px;
  font-family: var(--crs-font-body);
}
.crs-question__options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.crs-question__option {
  display: flex;
  align-items: center;
  gap: 7px;
}
.crs-question__option input[type="text"] {
  flex: 1;
  border: 1px solid var(--crs-border-strong);
  border-radius: 7px;
  padding: 7px 9px;
  font-size: 12.5px;
}
.crs-question__hint {
  font-size: 11.5px;
  color: var(--crs-text-faint);
  margin: 0;
}

.crs-add-chapter { width: 100%; justify-content: center; margin-top: 4px; }

/* App shell (sidebar offset) */
.app-shell {
  display: flex;
  align-items: stretch;
  min-height: 100vh;
}
.app-main {
  flex: 1;
  min-width: 0;
}

/* Responsive */
@media (max-width: 960px) {
  .crs-stats { grid-template-columns: repeat(2, 1fr); }
  .crs-form__grid { grid-template-columns: 1fr; }
  .crs-question__options { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .crs-page { padding: 20px; }
  .crs-stats { grid-template-columns: 1fr 1fr; }
  .crs-header { align-items: flex-start; }
}

    `}</style>
  );
}

// Renders a 5-star rating row: filled stars for the rounded score,
// empty outlines for the rest, plus the numeric value — e.g. ★★★★★ 4.8.
function StarRating({ value = 0 }) {
  const rounded = Math.round(value);
  return (
    <div className="crs-rating">
      <span className="crs-rating__stars" aria-label={`${value} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Icon.Star key={i} data-empty={i >= rounded ? "true" : undefined} />
        ))}
      </span>
      <span className="crs-rating__value">{value ? value.toFixed(1) : "New"}</span>
    </div>
  );
}

export default function Courses() {
  const navigate = useNavigate();

  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // courseId -> { progress, completed } for the logged-in student. Empty
  // (and unused) for admins, who see edit/delete instead of enroll state.
  const [enrollments, setEnrollments] = useState({});

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("recent");
  const [view, setView] = useState("grid");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const [hasToken, setHasToken] = useState(false);
  const LOGIN_ROUTE = "/explore/login";

  // ---- Auth check ----
  // Role is never read from localStorage (a user could edit that in dev
  // tools to fake admin access in the UI). Instead we only store the raw
  // token client-side, and ask the backend's /me route — which looks the
  // role up fresh in MongoDB on every request — whether this user is an
  // admin. The backend's own requireAdmin middleware is still the real
  // security boundary on write routes; this just keeps the UI honest.
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
        const res = await axios.get(`${API_BASE}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        setHasToken(true);
        setIsAdmin((res.data.role || "").toLowerCase() === "admin");
      } catch {
        // Token invalid/expired — treat as logged out.
        if (cancelled) return;
        localStorage.removeItem("token");
        setHasToken(false);
        const t = setTimeout(() => navigate(LOGIN_ROUTE), 1200);
        return () => clearTimeout(t);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  });

  const showToast = (message, type = "success") =>
    setToast({ message, type });

  // ---- Load courses ----
  // Reads are public on the backend, so this loads for any logged-in
  // user (admin or not) — no token strictly required, but we send it
  // anyway since it's harmless and future-proofs against locking reads down.
  const loadCourses = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await axios.get(`${API_BASE}/courses`, {
        headers: authHeaders(),
      });
      const data = res.data;
      const list = Array.isArray(data) ? data : data.courses || [];
      setCourses(list.map(normalizeCourse));
    } catch (err) {
      setCourses([]);
      setLoadError(
        err.response?.data?.message || "Couldn't reach the courses API. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Students' own enrollment status for every course they're in, so
  // each card can show "Continue Learning" + progress instead of
  // "Enroll Now". Harmless (and simply empty) for admins.
  const loadEnrollments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/my-enrollments`, {
        headers: authHeaders(),
      });
      const map = {};
      (res.data || []).forEach((e) => {
        map[e.courseId] = { progress: e.progress, completed: e.completed };
      });
      setEnrollments(map);
    } catch {
      // Non-fatal — cards just fall back to "Enroll Now".
      setEnrollments({});
    }
  };

  useEffect(() => {
    if (!hasToken) return;
    loadCourses();
    if (!isAdmin) loadEnrollments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken, isAdmin]);

  // ---- Derived data ----
  const stats = useMemo(() => {
    const totalStudents = courses.reduce((s, c) => s + (c.students || 0), 0);
    const revenue = courses.reduce(
      (s, c) => s + (c.students || 0) * (c.price || 0),
      0
    );
    const published = courses.filter((c) => c.status === "Published").length;
    return {
      total: courses.length,
      totalStudents,
      revenue,
      published,
    };
  }, [courses]);

  const filtered = useMemo(() => {
    let list = courses.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.instructor.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "All" || c.category === categoryFilter;
      const matchesStatus =
        statusFilter === "All" || c.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    switch (sortBy) {
      case "students":
        list = [...list].sort((a, b) => b.students - a.students);
        break;
      case "price-high":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "price-low":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "title":
        list = [...list].sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        list = [...list].sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
    }
    return list;
  }, [courses, search, categoryFilter, statusFilter, sortBy]);

  // ---- CRUD handlers ----
  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (course) => {
    setEditing(course);
    setModalOpen(true);
  };

  const goToDetail = (course) => navigate(`/courses/${course.id}`);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      const url = editing
        ? `${API_BASE}/courses/${editing.id}`
        : `${API_BASE}/courses`;
      const res = editing
        ? await axios.put(url, form, { headers: authHeaders() })
        : await axios.post(url, form, { headers: authHeaders() });

      const saved = normalizeCourse(res.data);

      setCourses((prev) => {
        if (editing) {
          return prev.map((c) => (c.id === editing.id ? { ...c, ...saved } : c));
        }
        return [saved, ...prev];
      });

      setModalOpen(false);
      showToast(
        form.status === "Published"
          ? "Course published"
          : editing
          ? "Course updated"
          : "Course saved as draft"
      );
    } catch (err) {
      const msg =
        err.response?.status === 401 || err.response?.status === 403
          ? "You don't have permission to do this. Please log in as an admin."
          : err.response?.data?.message || "Failed to save the course.";
      showToast(msg, "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const course = pendingDelete;
    setPendingDelete(null);
    try {
      await axios.delete(`${API_BASE}/courses/${course.id}`, {
        headers: authHeaders(),
      });
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
      showToast(`"${course.title}" deleted`, "danger");
    } catch (err) {
      const msg =
        err.response?.status === 401 || err.response?.status === 403
          ? "You don't have permission to do this. Please log in as an admin."
          : err.response?.data?.message || "Failed to delete the course.";
      showToast(msg, "danger");
    }
  };

  const toggleStatus = async (course) => {
    const nextStatus = course.status === "Published" ? "Draft" : "Published";
    // Optimistic update, rolled back on failure so the button doesn't lie
    // about whether the change actually saved.
    setCourses((prev) =>
      prev.map((c) => (c.id === course.id ? { ...c, status: nextStatus } : c))
    );
    try {
      const res = await axios.put(
        `${API_BASE}/courses/${course.id}`,
        { ...course, status: nextStatus },
        { headers: authHeaders() }
      );
      const saved = normalizeCourse(res.data);
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, ...saved } : c))
      );
      showToast(
        nextStatus === "Published" ? "Course published" : "Moved to draft"
      );
    } catch (err) {
      // Roll back
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, status: course.status } : c))
      );
      const msg =
        err.response?.status === 401 || err.response?.status === 403
          ? "You don't have permission to do this. Please log in as an admin."
          : "Failed to update status.";
      showToast(msg, "danger");
    }
  };

  // Sends the student to the payment page. Enrollment itself only
  // happens after payment succeeds there (see Payment.jsx).
  const handleEnroll = (course, e) => {
    e.stopPropagation();
    // Free courses (price === 0) can skip payment entirely — send
    // straight to the course player and enroll on arrival there.
    if (!course.price) {
      navigate(`/courses/${course.id || course._id}/learn`, { state: { course } });
      return;
    }
    navigate(`/payment/${course.id || course._id}`, {
      state: { course },
    });
  };

  // ---- Guard states ----
  if (!authChecked) {
    return (
      <div className="app-shell">
        <Nav />
        <main className="app-main">
          <div className="crs-page crs-page--centered">
            <CoursesStyles />
            Checking access…
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
          <div className="crs-page crs-page--centered">
            <CoursesStyles />
            <div className="crs-denied">
              <h2>Please log in</h2>
              <p>You need to be logged in to view courses.</p>
              <p className="crs-denied__redirect">Redirecting you to login…</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Nav />
      <main className="app-main">
        <div className="crs-page">
          <CoursesStyles />
          <Toast toast={toast} onClose={() => setToast(null)} />

          <ConfirmDialog
            open={!!pendingDelete}
            title="Delete this course?"
            body={
              pendingDelete
                ? `"${pendingDelete.title}" and its enrollment data will be removed. This can't be undone.`
                : ""
            }
            onConfirm={handleDelete}
            onCancel={() => setPendingDelete(null)}
          />

          <CourseModal
            open={modalOpen}
            initial={editing}
            onClose={() => setModalOpen(false)}
            onSave={handleSave}
            saving={saving}
          />

          <header className="crs-header">
            <div>
              <p className="crs-eyebrow">
                {isAdmin ? "Admin · Course catalog" : "Course catalog"}
              </p>
              <h1>Courses</h1>
              <p className="crs-subtitle">
                {isAdmin
                  ? "Create, publish and manage every course on Skillfull Technologies."
                  : "Browse every course on Skillfull Technologies."}
              </p>
            </div>
            {isAdmin && (
              <button className="crs-btn crs-btn--primary crs-btn--lg" onClick={openCreate}>
                <Icon.Plus /> Add course
              </button>
            )}
          </header>

          {loadError && (
            <div className="crs-banner crs-banner--error">
              {loadError}{" "}
              <button className="crs-btn crs-btn--ghost" style={{ marginLeft: 8 }} onClick={loadCourses}>
                Retry
              </button>
            </div>
          )}

          <section className="crs-stats">
            <div className="crs-stat">
              <span className="crs-stat__icon"><Icon.Book /></span>
              <span className="crs-stat__text">
                <span className="crs-stat__label">Total courses</span>
                <span className="crs-stat__value">{stats.total}</span>
              </span>
            </div>
            <div className="crs-stat">
              <span className="crs-stat__icon"><Icon.Check /></span>
              <span className="crs-stat__text">
                <span className="crs-stat__label">Published</span>
                <span className="crs-stat__value">{stats.published}</span>
              </span>
            </div>
            <div className="crs-stat">
              <span className="crs-stat__icon"><Icon.Users /></span>
              <span className="crs-stat__text">
                <span className="crs-stat__label">Total students</span>
                <span className="crs-stat__value">
                  {stats.totalStudents.toLocaleString("en-IN")}
                </span>
              </span>
            </div>
            <div className="crs-stat">
              <span className="crs-stat__icon"><Icon.Rupee /></span>
              <span className="crs-stat__text">
                <span className="crs-stat__label">Estimated revenue</span>
                <span className="crs-stat__value">{currency(stats.revenue)}</span>
              </span>
            </div>
          </section>

          <section className="crs-toolbar">
            <div className="crs-search">
              <Icon.Search />
              <input
                type="text"
                placeholder="Search by title or instructor…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All statuses</option>
              <option>Published</option>
              <option>Draft</option>
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recent">Recently updated</option>
              <option value="students">Most students</option>
              <option value="price-high">Price: high to low</option>
              <option value="price-low">Price: low to high</option>
              <option value="title">Title A–Z</option>
            </select>

            <div className="crs-view-toggle">
              <button
                className={view === "grid" ? "is-active" : ""}
                onClick={() => setView("grid")}
                aria-label="Grid view"
              >
                <Icon.Grid />
              </button>
              <button
                className={view === "table" ? "is-active" : ""}
                onClick={() => setView("table")}
                aria-label="Table view"
              >
                <Icon.List />
              </button>
            </div>
          </section>

          {loading ? (
            <div className="crs-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="crs-card crs-card--skeleton" key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="crs-empty">
              <h3>{loadError ? "Couldn't load courses" : "No courses match your filters"}</h3>
              <p>
                {loadError
                  ? "Check your connection and try again."
                  : isAdmin
                  ? "Try clearing the search or filters, or create a new course."
                  : "Try clearing the search or filters."}
              </p>
              {isAdmin && !loadError && (
                <button className="crs-btn crs-btn--primary" onClick={openCreate}>
                  <Icon.Plus /> Add course
                </button>
              )}
            </div>
          ) : view === "grid" ? (
            <section className="crs-grid">
              {filtered.map((course) => {
                const enrollment = enrollments[course.id];
                const isEnrolled = !!enrollment;
                return (
                  <article
                    className="crs-card crs-card--clickable"
                    key={course.id}
                    onClick={() => goToDetail(course)}
                  >
                    <div
                      className="crs-card__cover"
                      style={
                        course.thumbnail
                          ? { backgroundImage: `url(${course.thumbnail})` }
                          : {
                              background: `linear-gradient(135deg, ${categoryColor(course.category)}, #0f172a)`,
                            }
                      }
                    >
                      <span
                        className="crs-tag"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.92)",
                          color: categoryColor(course.category),
                        }}
                      >
                        {course.category}
                      </span>
                      {isAdmin ? (
                        <button
                          className={`crs-status crs-status--${course.status.toLowerCase()}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatus(course);
                          }}
                          title="Toggle publish status"
                        >
                          {course.status}
                        </button>
                      ) : (
                        <span className={`crs-status crs-status--${course.status.toLowerCase()}`}>
                          {course.status}
                        </span>
                      )}
                    </div>

                    <div className="crs-card__body">
                      <h3>{course.title}</h3>
                      <StarRating value={course.rating} />
                      <p className="crs-card__desc">{course.description}</p>

                      <div className="crs-card__meta">
                        <span className="crs-avatar">{initials(course.instructor)}</span>
                        <span>{course.instructor}</span>
                        <span className="crs-dot">•</span>
                        <span>{course.level}</span>
                        {course.chapters?.length > 0 && (
                          <>
                            <span className="crs-dot">•</span>
                            <span>{course.chapters.length} classes</span>
                          </>
                        )}
                      </div>

                      <div className="crs-card__row">
                        <div className="crs-card__figure">
                          <strong>{course.duration}h</strong>
                          <span>duration</span>
                        </div>
                        <div className="crs-card__figure">
                          <strong>{course.students}</strong>
                          <span>students</span>
                        </div>
                        <div className="crs-card__price">
                          {course.price ? currency(course.price) : "Free"}
                        </div>
                      </div>
                    </div>

                    {isAdmin ? (
                      <div className="crs-card__actions">
                        <button
                          className="crs-btn crs-btn--ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(course);
                          }}
                        >
                          <Icon.Edit /> Edit
                        </button>
                        <button
                          className="crs-btn crs-btn--danger-ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDelete(course);
                          }}
                        >
                          <Icon.Trash /> Delete
                        </button>
                      </div>
                    ) : isEnrolled ? (
                      <>
                        <div className="crs-progress">
                          <div className="crs-progress__bar">
                            <div
                              className="crs-progress__fill"
                              style={{ width: `${enrollment.progress || 0}%` }}
                            />
                          </div>
                          <span className="crs-progress__label">
                            {enrollment.completed ? "Completed" : `${enrollment.progress || 0}% complete`}
                          </span>
                        </div>
                        <div className="crs-card__actions">
                          <button
                            className="crs-btn crs-btn--success"
                            onClick={(e) => {
                              e.stopPropagation();
                              goToDetail(course);
                            }}
                          >
                            Continue Learning
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="crs-card__actions">
                        <button
                          className="crs-btn crs-btn--primary"
                          onClick={(e) => handleEnroll(course, e)}
                        >
                          {course.price ? "Enroll Now" : "Start for Free"}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          ) : (
            <section className="crs-table-wrap">
              <table className="crs-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Category</th>
                    <th>Instructor</th>
                    <th>Students</th>
                    <th>Price</th>
                    <th>Status</th>
                    {isAdmin ? <th aria-label="Actions" /> : <th>Learning</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((course) => {
                    const enrollment = enrollments[course.id];
                    return (
                      <tr key={course.id}>
                        <td className="crs-table__title" onClick={() => goToDetail(course)}>
                          {course.title}
                        </td>
                        <td>
                          <span
                            className="crs-tag crs-tag--inline"
                            style={{
                              backgroundColor: `${categoryColor(course.category)}1a`,
                              color: categoryColor(course.category),
                            }}
                          >
                            {course.category}
                          </span>
                        </td>
                        <td>{course.instructor}</td>
                        <td>{course.students}</td>
                        <td>{course.price ? currency(course.price) : "Free"}</td>
                        <td>
                          {isAdmin ? (
                            <button
                              className={`crs-status crs-status--${course.status.toLowerCase()}`}
                              onClick={() => toggleStatus(course)}
                            >
                              {course.status}
                            </button>
                          ) : (
                            <span className={`crs-status crs-status--${course.status.toLowerCase()}`}>
                              {course.status}
                            </span>
                          )}
                        </td>
                        {isAdmin ? (
                          <td className="crs-table__actions">
                            <button className="crs-icon-btn" onClick={() => openEdit(course)} aria-label="Edit">
                              <Icon.Edit />
                            </button>
                            <button
                              className="crs-icon-btn crs-icon-btn--danger"
                              onClick={() => setPendingDelete(course)}
                              aria-label="Delete"
                            >
                              <Icon.Trash />
                            </button>
                          </td>
                        ) : (
                          <td>
                            {enrollment ? (
                              <button className="crs-btn crs-btn--success" onClick={() => goToDetail(course)}>
                                Continue ({enrollment.progress || 0}%)
                              </button>
                            ) : (
                              <button
                                className="crs-btn crs-btn--primary"
                                onClick={(e) => handleEnroll(course, e)}
                              >
                                {course.price ? "Enroll Now" : "Start for Free"}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}