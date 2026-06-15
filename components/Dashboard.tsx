"use client";

import { BadIcon, WarnIcon } from "./icons";
import { useI18n } from "./LangProvider";
import { Audit } from "@/lib/security";
import type { Entry } from "@/lib/types";
import type { Vault } from "@/lib/vault";

interface Props {
  vault: Vault;
  onEdit: (entry: Entry) => void;
  onRotate: (entry: Entry) => void;
}

export default function Dashboard({ vault, onEdit, onRotate }: Props) {
  const { t } = useI18n();
  const report = Audit.review(vault.data());
  const empty = report.total === 0;
  const color = empty
    ? "var(--muted)"
    : report.score >= 80
      ? "var(--accent-2)"
      : report.score >= 50
        ? "var(--warn)"
        : "var(--danger)";
  const verdict = empty
    ? t("dash.empty")
    : report.score >= 80
      ? t("dash.healthy")
      : report.score >= 50
        ? t("dash.attention")
        : t("dash.risk");
  const circumference = 2 * Math.PI * 70;
  const offset = empty ? circumference : circumference * (1 - report.score / 100);

  return (
    <div className="dash">
      <h1>{t("dash.title")}</h1>
      <div className="sub">{t("dash.subtitle")}</div>
      <div className="dash-top">
        <div className="score-card">
          <div className="ring">
            <svg width="160" height="160">
              <circle cx="80" cy="80" r="70" stroke="var(--panel-2)" strokeWidth="14" fill="none" />
              <circle cx="80" cy="80" r="70" stroke={color} strokeWidth="14" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
            </svg>
            <div className="ring-num">
              <b style={{ color }}>{empty ? "—" : report.score}</b>
              <span>{t("dash.outOf")}</span>
            </div>
          </div>
          <div className="score-label" style={{ color }}>
            {verdict}
          </div>
        </div>
        <div className="stat-grid">
          <div className="stat">
            <div className="n">{report.total}</div>
            <div className="l">{t("dash.total")}</div>
          </div>
          <div className="stat alert-ok">
            <div className="n">{report.healthy}</div>
            <div className="l">{t("dash.healthyCount")}</div>
          </div>
          <div className={"stat" + (report.stale ? " alert-warn" : "")}>
            <div className="n">{report.stale}</div>
            <div className="l">{t("dash.stale")}</div>
          </div>
          <div className={"stat" + (report.weak ? " alert-bad" : "")}>
            <div className="n">{report.weak}</div>
            <div className="l">{t("dash.weak")}</div>
          </div>
          <div className={"stat" + (report.reused ? " alert-bad" : "")}>
            <div className="n">{report.reused}</div>
            <div className="l">{t("dash.reused")}</div>
          </div>
        </div>
      </div>
      <div className="alerts">
        <h2>{t("dash.attentionTitle")}</h2>
        <div className="sub2">{report.flagged.length ? t("dash.attentionCount", { n: report.flagged.length }) : t("dash.noWarnings")}</div>
        {report.flagged.length ? (
          report.flagged.map(({ entry, issues }) => {
            const severe = issues.some((issue) => issue.severe);
            return (
              <div className="alert-row" key={entry.id}>
                <div className={"alert-ic " + (severe ? "bad" : "warn")}>{severe ? <BadIcon /> : <WarnIcon />}</div>
                <div className="info">
                  <b>{entry.name}</b>
                  <div className="why">
                    {issues.map((issue, index) => (
                      <span key={index} className={"chip " + (issue.severe ? "bad" : "warn")}>
                        {issue.kind === "stale" ? t("issue.days", { n: Audit.ageDays(entry) }) : t("issue." + issue.kind)}
                      </span>
                    ))}
                    <span style={{ color: "var(--muted)" }}>· {entry.category}</span>
                  </div>
                </div>
                <div className="act">
                  <button onClick={() => onEdit(entry)}>{t("dash.edit")}</button>
                  <button onClick={() => onRotate(entry)}>{t("dash.change")}</button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="all-good">{t("dash.allGood")}</div>
        )}
      </div>
    </div>
  );
}
