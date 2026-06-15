"use client";

import { useEffect, useRef, useState } from "react";
import { CopyIcon, EyeIcon } from "./icons";
import { useI18n } from "./LangProvider";
import { copy } from "@/lib/ui";

const dots = "••••••••••";

export default function PasswordReveal({
  password,
  variant = "card",
}: {
  password: string;
  variant?: "card" | "map";
}) {
  const { t } = useI18n();
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const toggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setRevealed((current) => {
      const next = !current;
      if (timer.current) clearTimeout(timer.current);
      if (next) timer.current = setTimeout(() => setRevealed(false), 8000);
      return next;
    });
  };

  if (variant === "map") {
    return (
      <div className="me-pw">
        <span className={"me-dots" + (revealed ? " shown" : "")}>{revealed ? password : dots}</span>
        <button className="me-ic eye" title={t("field.password")} onClick={toggle}>
          <EyeIcon />
        </button>
        <button
          className="me-ic"
          title={t("rk.copy")}
          onClick={(event) => {
            event.stopPropagation();
            copy(password);
          }}
        >
          <CopyIcon size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="field-line">
      <span className="k">{t("field.password")}</span>
      <span className="v pw">{revealed ? password : dots}</span>
      <button className="mini eyebtn" title={t("field.password")} onClick={toggle}>
        <EyeIcon />
      </button>
      <button className="mini" title={t("rk.copy")} onClick={() => copy(password)}>
        <CopyIcon />
      </button>
    </div>
  );
}
