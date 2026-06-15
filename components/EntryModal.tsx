"use client";

import { useMemo, useState } from "react";
import Modal from "./Modal";
import { CopyIcon, EyeIcon } from "./icons";
import { useI18n } from "./LangProvider";
import { Generator, Strength, type GenOptions } from "@/lib/password";
import { copy, notify } from "@/lib/ui";
import type { Entry } from "@/lib/types";

export interface EntryData {
  name: string;
  username: string;
  password: string;
  category: string;
  url: string;
  notes: string;
}

interface Props {
  entry: Entry | null;
  categories: string[];
  onClose: () => void;
  onAddCategory: (name: string) => void;
  onSave: (data: EntryData, id: string | null) => void;
}

const toggles: { key: keyof GenOptions; label: string }[] = [
  { key: "lower", label: "a-z" },
  { key: "upper", label: "A-Z" },
  { key: "digits", label: "0-9" },
  { key: "symbols", label: "!@#" },
  { key: "lookalikes", label: "il1O0" },
];

export default function EntryModal({ entry, categories, onClose, onAddCategory, onSave }: Props) {
  const { t } = useI18n();
  const [folders, setFolders] = useState(categories);
  const [name, setName] = useState(entry?.name ?? "");
  const [username, setUsername] = useState(entry?.username ?? "");
  const [password, setPassword] = useState(entry?.password ?? "");
  const [category, setCategory] = useState(entry?.category ?? categories[0] ?? "Other");
  const [url, setUrl] = useState(entry?.url ?? "");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [reveal, setReveal] = useState(false);

  const [length, setLength] = useState(18);
  const [options, setOptions] = useState<GenOptions>({ lower: true, upper: true, digits: true, symbols: true, lookalikes: false });
  const [suggestion, setSuggestion] = useState(() => Generator.make(18, { lower: true, upper: true, digits: true, symbols: true, lookalikes: false }));

  const strength = useMemo(() => Strength.of(password), [password]);

  const regenerate = (size = length, opts = options) => setSuggestion(Generator.make(size, opts));

  const chooseCategory = (value: string) => {
    if (value !== "__new__") {
      setCategory(value);
      return;
    }
    const fresh = window.prompt(t("entry.newCategoryPrompt"));
    if (!fresh || !fresh.trim()) return;
    const trimmed = fresh.trim();
    if (!folders.some((folder) => folder.toLowerCase() === trimmed.toLowerCase())) {
      setFolders([...folders, trimmed]);
      onAddCategory(trimmed);
    }
    setCategory(trimmed);
  };

  const submit = () => {
    if (!name.trim()) return notify(t("entry.nameRequired"));
    if (!password) return notify(t("entry.passwordRequired"));
    onSave({ name: name.trim(), username: username.trim(), password, category, url: url.trim(), notes: notes.trim() }, entry?.id ?? null);
  };

  return (
    <Modal onClose={onClose}>
      <h2>{entry ? t("entry.edit") : t("entry.add")}</h2>
      <div className="desc">{t("entry.desc")}</div>
      <div className="field">
        <label>{t("entry.name")}</label>
        <div className="input-wrap">
          <input className="text" value={name} onChange={(event) => setName(event.target.value)} placeholder={t("entry.namePh")} />
        </div>
      </div>
      <div className="row-2">
        <div className="field">
          <label>{t("entry.user")}</label>
          <div className="input-wrap">
            <input className="text" value={username} onChange={(event) => setUsername(event.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>{t("entry.category")}</label>
          <select className="text" value={category} onChange={(event) => chooseCategory(event.target.value)}>
            {folders.map((folder) => (
              <option key={folder}>{folder}</option>
            ))}
            <option value="__new__">{t("entry.newCategory")}</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label>{t("entry.password")}</label>
        <div className="input-wrap">
          <input className="text" type={reveal ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="off" spellCheck={false} />
          <button className="eye" type="button" onClick={() => setReveal((value) => !value)}>
            <EyeIcon />
          </button>
        </div>
        <div className="strength">
          <div style={{ width: strength.score + "%", background: strength.color }} />
        </div>
        <div className="strength-label" style={{ color: strength.color }}>
          {strength.label}
        </div>
      </div>

      <div className="gen-box">
        <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginBottom: 8 }}>{t("entry.generator")}</div>
        <div className="gen-out">
          <input className="text" readOnly value={suggestion} />
          <button className="mini" onClick={() => copy(suggestion)}>
            <CopyIcon />
          </button>
          <button
            className="mini txt"
            onClick={() => {
              setPassword(suggestion);
              notify(t("entry.passwordUsed"));
            }}
          >
            {t("entry.use")}
          </button>
          <button className="mini txt" onClick={() => regenerate()}>
            {t("entry.shuffle")}
          </button>
        </div>
        <div className="slider-row">
          <span>{t("entry.length")}</span>
          <input
            type="range"
            min={8}
            max={48}
            value={length}
            onChange={(event) => {
              const size = Number(event.target.value);
              setLength(size);
              regenerate(size, options);
            }}
          />
          <span>{length}</span>
        </div>
        <div className="checks">
          {toggles.map(({ key, label }) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={options[key]}
                onChange={(event) => {
                  const next = { ...options, [key]: event.target.checked };
                  setOptions(next);
                  regenerate(length, next);
                }}
              />{" "}
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="field" style={{ marginTop: 14 }}>
        <label>{t("entry.url")}</label>
        <div className="input-wrap">
          <input className="text" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." />
        </div>
      </div>
      <div className="field">
        <label>{t("entry.notes")}</label>
        <textarea className="text" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          {t("entry.cancel")}
        </button>
        <button className="btn" onClick={submit}>
          {entry ? t("entry.save") : t("entry.addBtn")}
        </button>
      </div>
    </Modal>
  );
}
