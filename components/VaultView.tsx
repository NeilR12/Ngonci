"use client";

import { CaretIcon, CopyIcon } from "./icons";
import PasswordReveal from "./PasswordReveal";
import { useI18n } from "./LangProvider";
import { Audit, swatch } from "@/lib/security";
import { copy } from "@/lib/ui";
import type { ActiveFilter, Entry } from "@/lib/types";
import type { Vault } from "@/lib/vault";

interface Props {
  vault: Vault;
  search: string;
  setSearch: (value: string) => void;
  filter: ActiveFilter;
  setFilter: (value: ActiveFilter) => void;
  onManageCats: () => void;
  onEdit: (entry: Entry) => void;
  onRotate: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}

export default function VaultView(props: Props) {
  const { t } = useI18n();
  const { vault, search, filter } = props;
  const counts = Audit.duplicates(vault.entries);
  const overdue = vault.entries.filter(Audit.stale).length;
  const focusedId = filter.type === "entry" ? filter.value : null;

  const visible = (() => {
    const query = search.trim().toLowerCase();
    let list = vault.entries;
    if (filter.type === "cat") list = list.filter((entry) => entry.category === filter.value);
    else if (filter.type === "stale") list = list.filter(Audit.stale);
    else if (filter.type === "entry") list = list.filter((entry) => entry.id === filter.value);
    if (query)
      list = list.filter((entry) =>
        [entry.name, entry.username, entry.url, entry.category].filter(Boolean).some((field) => field.toLowerCase().includes(query)),
      );
    return list;
  })();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="side-head">
          <h3>{t("vault.categories")}</h3>
          <button className="side-add" title={t("cat.title")} onClick={props.onManageCats}>
            +
          </button>
        </div>
        <ul className="tree">
          <li>
            <div className={"cat-row" + (filter.type === "all" ? " active" : "")} onClick={() => props.setFilter({ type: "all" })}>
              <svg className="caret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="9" />
              </svg>
              {t("vault.all")} <span className="cat-count">{vault.entries.length}</span>
            </div>
          </li>
          {overdue > 0 && (
            <li>
              <div className={"cat-row" + (filter.type === "stale" ? " active" : "")} style={{ color: "var(--warn)" }} onClick={() => props.setFilter({ type: "stale" })}>
                <svg className="caret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                </svg>
                {t("vault.needChange")} <span className="cat-count">{overdue}</span>
              </div>
            </li>
          )}
          {vault.categories.map((category) => {
            const items = vault.within(category);
            const open = filter.type === "cat" && filter.value === category;
            return (
              <li className="tree-cat" key={category}>
                <div
                  className={"cat-row" + (open ? " active" : "")}
                  onClick={() => props.setFilter(open ? { type: "all" } : { type: "cat", value: category })}
                >
                  <CaretIcon className={"caret" + (open ? " open" : "")} />
                  <span className="cat-name" style={{ color: open ? "var(--accent)" : swatch(category) }}>
                    {category}
                  </span>
                  <span className="cat-count">{items.length}</span>
                </div>
                {open && (
                  <ul className="tree-children">
                    {items.map((entry) => (
                      <li
                        key={entry.id}
                        className={"leaf" + (Audit.stale(entry) ? " warn" : "") + (focusedId === entry.id ? " active" : "")}
                        onClick={(event) => {
                          event.stopPropagation();
                          props.setFilter({ type: "entry", value: entry.id });
                        }}
                      >
                        <span className="dot" />
                        {entry.name}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </aside>

      <main className="main">
        <div className="main-head">
          <input className="search" value={search} onChange={(event) => props.setSearch(event.target.value)} placeholder={t("vault.search")} />
        </div>
        <div className="grid">
          {visible.length === 0 ? (
            <div className="empty" style={{ gridColumn: "1/-1" }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{t("vault.emptyTitle")}</div>
              <div style={{ marginTop: 6 }}>{t("vault.emptyBody")}</div>
            </div>
          ) : (
            visible.map((entry) => (
              <Card key={entry.id} entry={entry} counts={counts} onEdit={props.onEdit} onRotate={props.onRotate} onDelete={props.onDelete} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function Card({
  entry,
  counts,
  onEdit,
  onRotate,
  onDelete,
}: {
  entry: Entry;
  counts: Map<string, number>;
  onEdit: (entry: Entry) => void;
  onRotate: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}) {
  const { t } = useI18n();
  const issues = Audit.issues(entry, counts);
  const tint = swatch(entry.name || "x");
  const initial = (entry.name || "?").trim().charAt(0).toUpperCase();
  let badge = <span className="badge ok">{t("badge.safe")}</span>;
  if (issues.length) {
    const top = issues[0];
    const severe = issues.some((issue) => issue.severe);
    const label = top.kind === "stale" ? t("issue.days", { n: Audit.ageDays(entry) }) : t("issue." + top.kind);
    badge = <span className={"badge " + (severe ? "bad" : "warn")}>{label}</span>;
  }

  return (
    <div className="card">
      <div className="row1">
        <div className="avatar" style={{ background: `linear-gradient(135deg, ${tint}, ${tint}99)` }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="title">{entry.name}</div>
          <div className="sub">{entry.category}</div>
        </div>
        {badge}
      </div>
      <div className="field-line">
        <span className="k">{t("field.user")}</span>
        <span className="v">{entry.username || "—"}</span>
        <button className="mini" title={t("rk.copy")} onClick={() => copy(entry.username || "")}>
          <CopyIcon />
        </button>
      </div>
      <PasswordReveal password={entry.password} />
      {entry.url && (
        <div className="field-line">
          <span className="k">{t("field.url")}</span>
          <span className="v">{entry.url}</span>
        </div>
      )}
      <div className="field-line" style={{ background: "transparent", border: "none", padding: "6px 2px 0" }}>
        <span className="k" style={{ width: "auto" }}>
          {t("field.updated")}
        </span>
        <span className="v" style={{ fontFamily: "inherit", color: Audit.stale(entry) ? "var(--warn)" : "var(--muted)" }}>
          {t("vault.daysAgo", { n: Audit.ageDays(entry) })}
        </span>
      </div>
      <div className="card-actions">
        <button onClick={() => onEdit(entry)}>{t("card.edit")}</button>
        <button onClick={() => onRotate(entry)}>{t("card.change")}</button>
        <button onClick={() => onDelete(entry)}>{t("card.delete")}</button>
      </div>
    </div>
  );
}
