"use client";

import { useI18n } from "./LangProvider";
import { languages } from "@/lib/i18n";

export default function LangSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <div className="lang-switch">
      {languages.map((option) => (
        <button key={option.id} className={lang === option.id ? "active" : ""} onClick={() => setLang(option.id)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}
