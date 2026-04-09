"use client";

import { useState, useRef, useEffect } from "react";

export default function ChatUI() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Halo! Ada yang bisa saya bantu?" },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Kamu bilang: "${input}" 😄` },
      ]);
    }, 400);

    setInput("");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="relative h-full">
      {/* Messages */}
      <div className="overflow-y-auto p-4 space-y-4 pb-32">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 🔥 INPUT FIXED */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4">
        <div className="mx-auto max-w-3xl flex gap-2">
          <input
            className="flex-1 rounded-xl border px-4 py-2 text-sm outline-none"
            placeholder="Ketik pesan..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
}
