"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import PasswordReveal from "./PasswordReveal";
import { Audit, swatch } from "@/lib/security";
import type { Entry } from "@/lib/types";
import type { Vault } from "@/lib/vault";

interface Branch {
  d: string;
  color: string;
  width: number;
  opacity: number;
}

export default function Mindmap({ vault, onEdit }: { vault: Vault; onEdit: (entry: Entry) => void }) {
  const counts = Audit.duplicates(vault.entries);
  const canvas = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [branches, setBranches] = useState<Branch[]>([]);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const drawBranches = useCallback(() => {
    const root = canvas.current;
    if (!root) return;
    const bounds = root.getBoundingClientRect();
    const anchor = (element: Element, side: "l" | "r") => {
      const box = element.getBoundingClientRect();
      return {
        x: (side === "r" ? box.right : box.left) - bounds.left + root.scrollLeft,
        y: box.top - bounds.top + root.scrollTop + box.height / 2,
      };
    };
    const center = root.querySelector("#node-root");
    if (!center) return;
    const start = anchor(center, "r");
    const drawn: Branch[] = [];
    const curve = (from: { x: number; y: number }, to: { x: number; y: number }, color: string, width: number, opacity: number) => {
      const mid = (from.x + to.x) / 2;
      drawn.push({ d: `M ${from.x} ${from.y} C ${mid} ${from.y}, ${mid} ${to.y}, ${to.x} ${to.y}`, color, width, opacity });
    };
    root.querySelectorAll<HTMLElement>(".m-cat").forEach((node) => {
      const color = getComputedStyle(node).getPropertyValue("--c").trim() || "#4f9cf9";
      curve(start, anchor(node, "l"), color, 2.4, 0.55);
      const list = root.querySelector(`[data-entries="${node.dataset.node}"]`);
      if (list && !list.classList.contains("collapsed")) {
        const branchStart = anchor(node, "r");
        list.querySelectorAll(".m-entry").forEach((leaf) => curve(branchStart, anchor(leaf, "l"), color, 1.5, 0.32));
      }
    });
    setSize({ width: root.scrollWidth, height: root.scrollHeight });
    setBranches(drawn);
  }, []);

  useLayoutEffect(() => {
    drawBranches();
    const onResize = () => drawBranches();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [drawBranches, collapsed, vault]);

  const toggle = (id: string) =>
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="mind-wrap">
      <div className="mind-head">
        <div>
          <h1>Peta Brankas</h1>
          <div className="sub">Akun dikelompokkan per kategori. Klik ikon mata untuk menampilkan sandi, klik nama untuk mengedit.</div>
        </div>
      </div>
      <div className="legend">
        <span><span className="sw" style={{ background: "#6ee7b7" }} />Aman</span>
        <span><span className="sw" style={{ background: "#fbbf24" }} />Perlu diganti</span>
        <span><span className="sw" style={{ background: "#f87171" }} />Lemah / dipakai ulang</span>
      </div>
      <div className="mind2" ref={canvas}>
        <svg className="mind2-links" width={size.width} height={size.height} viewBox={`0 0 ${size.width} ${size.height}`}>
          {branches.map((branch, index) => (
            <path key={index} d={branch.d} fill="none" stroke={branch.color} strokeWidth={branch.width} strokeOpacity={branch.opacity} />
          ))}
        </svg>
        <div className="mind2-cols">
          <div className="col col-root">
            <div className="m-root" id="node-root">
              <span>Konci</span>
            </div>
          </div>
          <div className="col col-cats">
            {vault.categories.map((category, index) => {
              const items = vault.within(category);
              const id = `c-${index}`;
              const isCollapsed = collapsed.has(id);
              return (
                <div className="cat-group" key={category}>
                  <button
                    className={"m-cat" + (isCollapsed ? " collapsed" : "")}
                    data-node={id}
                    style={{ ["--c" as string]: swatch(category) }}
                    onClick={() => toggle(id)}
                  >
                    <span className="mc-name">{category}</span>
                    <span className="mc-count">{items.length}</span>
                  </button>
                  <div className={"m-entries" + (isCollapsed ? " collapsed" : "")} data-entries={id}>
                    {items.length ? (
                      items.map((entry) => {
                        const severe = Audit.weak(entry) || Audit.reused(entry, counts);
                        const state = severe ? "bad" : Audit.stale(entry) ? "warn" : "ok";
                        return (
                          <div className={"m-entry " + state} key={entry.id}>
                            <div className="me-top">
                              <span className="me-name" onClick={() => onEdit(entry)}>
                                {entry.name}
                              </span>
                              {entry.username && <span className="me-user">{entry.username}</span>}
                            </div>
                            <PasswordReveal password={entry.password} variant="map" />
                          </div>
                        );
                      })
                    ) : (
                      <div className="m-empty">Belum ada akun</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
