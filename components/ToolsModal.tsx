"use client";

import { useState } from "react";
import Modal from "./Modal";
import { useI18n } from "./LangProvider";
import { Codec, type Scheme } from "@/lib/codec";
import { copy } from "@/lib/ui";

type Mode = Scheme | "aes";

export default function ToolsModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("base64");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [passphrase, setPassphrase] = useState("");

  const run = (direction: "encode" | "decode") => {
    if (mode === "aes") {
      const task = direction === "encode" ? Codec.encrypt(passphrase, input) : Codec.decrypt(passphrase, input);
      task.then(setOutput).catch(() => setOutput(direction === "encode" ? t("tools.encFail") : t("tools.decFail")));
      return;
    }
    try {
      setOutput(direction === "encode" ? Codec.encode(mode, input) : Codec.decode(mode, input));
    } catch {
      setOutput(t("tools.invalid"));
    }
  };

  const modes: { id: Mode; label: string }[] = [
    { id: "base64", label: "Base64" },
    { id: "ascii", label: "ASCII" },
    { id: "hex", label: "Hex" },
    { id: "url", label: "URL" },
    { id: "aes", label: "AES" },
  ];

  return (
    <Modal onClose={onClose}>
      <h2>{t("tools.title")}</h2>
      <div className="desc">{t("tools.desc")}</div>
      <div className="seg">
        {modes.map((item) => (
          <button
            key={item.id}
            className={mode === item.id ? "active" : ""}
            onClick={() => {
              setMode(item.id);
              setOutput("");
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {mode === "aes" && (
        <div className="field">
          <label>{t("tools.passphrase")}</label>
          <div className="input-wrap">
            <input className="text" type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} placeholder={t("tools.keyPh")} />
          </div>
        </div>
      )}
      <div className="field">
        <label>{t("tools.input")}</label>
        <textarea className="text" value={input} onChange={(event) => setInput(event.target.value)} />
      </div>
      <div className="modal-actions" style={{ margin: "0 0 12px" }}>
        <button className="btn" style={{ flex: 1 }} onClick={() => run("encode")}>
          {mode === "aes" ? t("tools.encrypt") : t("tools.encode")}
        </button>
        <button className="btn ghost" style={{ flex: 1 }} onClick={() => run("decode")}>
          {mode === "aes" ? t("tools.decrypt") : t("tools.decode")}
        </button>
      </div>
      <div className="field">
        <label>{t("tools.output")}</label>
        <textarea className="text" readOnly value={output} />
        <button className="mini" style={{ marginTop: 6 }} onClick={() => copy(output)}>
          {t("tools.copyResult")}
        </button>
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          {t("tools.close")}
        </button>
      </div>
    </Modal>
  );
}
