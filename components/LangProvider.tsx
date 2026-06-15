"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { setActiveLang, translate, type Lang } from "@/lib/i18n";

interface Value {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Context = createContext<Value | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("konci.lang") as Lang | null;
    if (saved === "en" || saved === "zh" || saved === "id") {
      setLangState(saved);
      setActiveLang(saved);
    }
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    setActiveLang(next);
    localStorage.setItem("konci.lang", next);
  };

  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);

  return <Context.Provider value={{ lang, setLang, t }}>{children}</Context.Provider>;
}

export function useI18n(): Value {
  const value = useContext(Context);
  if (!value) throw new Error("useI18n must be used inside LangProvider");
  return value;
}
