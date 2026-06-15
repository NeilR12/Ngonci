"use client";

import { useEffect, useRef, useState } from "react";

export default function Toaster() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onToast = (event: Event) => {
      setMessage((event as CustomEvent<string>).detail);
      setVisible(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setVisible(false), 2200);
    };
    window.addEventListener("konci:toast", onToast);
    return () => window.removeEventListener("konci:toast", onToast);
  }, []);

  return <div className={"toast" + (visible ? " show" : "")}>{message}</div>;
}
