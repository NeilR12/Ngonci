"use client";

import { useRef, useState } from "react";
import Modal from "./Modal";
import { useI18n } from "./LangProvider";
import { swatch } from "@/lib/security";
import { notify } from "@/lib/ui";
import type { Vault } from "@/lib/vault";

export default function CategoryModal({
  vault,
  onClose,
  onAdd,
  onDelete,
  onReorder,
}: {
  vault: Vault;
  onClose: () => void;
  onAdd: (name: string) => void;
  onDelete: (name: string) => void;
  onReorder: (order: string[]) => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (vault.categories.some((category) => category.toLowerCase() === trimmed.toLowerCase())) {
      notify(t("cat.exists"));
      return;
    }
    onAdd(trimmed);
    setName("");
  };

  const drop = (to: number) => {
    const from = dragFrom.current;
    dragFrom.current = null;
    setDragOver(null);
    if (from === null || from === to) return;
    const order = [...vault.categories];
    const [moved] = order.splice(from, 1);
    order.splice(to, 0, moved);
    onReorder(order);
  };

  return (
    <Modal onClose={onClose}>
      <h2>{t("cat.title")}</h2>
      <div className="desc">{t("cat.desc")}</div>
      <div className="field">
        <label>{t("cat.new")}</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") add();
            }}
            placeholder={t("cat.newPh")}
          />
          <button className="btn" style={{ width: "auto", padding: "0 18px" }} onClick={add}>
            {t("cat.add")}
          </button>
        </div>
      </div>
      <div style={{ margin: "14px 0 6px", fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{t("cat.list")}</div>
      <div>
        {vault.categories.map((category, index) => (
          <div
            className={"cat-manage-row draggable" + (dragOver === index ? " drag-over" : "")}
            key={category}
            draggable
            onDragStart={() => {
              dragFrom.current = index;
            }}
            onDragOver={(event) => {
              event.preventDefault();
              if (dragOver !== index) setDragOver(index);
            }}
            onDragLeave={() => setDragOver((current) => (current === index ? null : current))}
            onDrop={() => drop(index)}
            onDragEnd={() => {
              dragFrom.current = null;
              setDragOver(null);
            }}
          >
            <span className="grip" title="Drag to reorder" aria-hidden>
              <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
                <circle cx="3" cy="3" r="1.4" />
                <circle cx="9" cy="3" r="1.4" />
                <circle cx="3" cy="8" r="1.4" />
                <circle cx="9" cy="8" r="1.4" />
                <circle cx="3" cy="13" r="1.4" />
                <circle cx="9" cy="13" r="1.4" />
              </svg>
            </span>
            <span className="nm" style={{ color: swatch(category) }}>
              {category}
            </span>
            <span className="ct">{t("cat.accounts", { n: vault.within(category).length })}</span>
            <button className="del" title={t("cat.delete")} onClick={() => onDelete(category)}>
              {t("cat.delete")}
            </button>
          </div>
        ))}
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          {t("cat.close")}
        </button>
      </div>
    </Modal>
  );
}
