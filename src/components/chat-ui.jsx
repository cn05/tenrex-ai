"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function ChatUI({ chatId, userId, initialMessages = [] }) {
  const [messages, setMessages] = useState(
    initialMessages.length > 0
      ? initialMessages
      : [
          {
            role: "assistant",
            content: "Halo! Ada yang bisa saya bantu dengan riset pasar Anda?",
          },
        ],
  );

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;
    const isFirstMessage = messages.length <= 1;

    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          userId,
          message: userText,
          isFirstMessage,
        }),
      });

      if (!response.ok) throw new Error("Gagal memproses pesan");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let aiTextSoFar = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });

        if (chunkValue) {
          aiTextSoFar += chunkValue;

          setMessages((prev) => {
            const updatedMessages = [...prev];
            updatedMessages[updatedMessages.length - 1] = {
              role: "assistant",
              content: aiTextSoFar,
            };
            return updatedMessages;
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Maaf, sistem sedang sibuk. Coba lagi ya.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    // 🔥 UBAH 1: Gunakan h-full agar secara otomatis mengikuti tinggi parent yang sudah dikunci dengan 100dvh
    <div className="flex flex-col h-full w-full relative">
      {/* Area Pesan: flex-1 akan mengambil ruang yang tersisa */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.role === "user" ? (
                <div className="whitespace-pre-wrap">{m.content}</div>
              ) : (
                <ReactMarkdown
                  components={{
                    p: ({ node, ...props }) => (
                      <p
                        className="mb-2 last:mb-0 leading-relaxed"
                        {...props}
                      />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        className="list-disc pl-5 mb-2 space-y-1"
                        {...props}
                      />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol
                        className="list-decimal pl-5 mb-2 space-y-1"
                        {...props}
                      />
                    ),
                    li: ({ node, ...props }) => <li {...props} />,
                    strong: ({ node, ...props }) => (
                      <strong className="font-bold" {...props} />
                    ),
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 🔥 UBAH 2: Tambahkan shrink-0 dan z-10 agar input ini TIDAK PERNAH terdorong keluar layar atau tertutup */}
      <div className="p-4 bg-background border-t shrink-0 z-10">
        <div className="mx-auto max-w-3xl flex gap-2">
          <input
            className="flex-1 rounded-xl border px-4 py-2 text-sm outline-none disabled:opacity-50 focus:ring-2 focus:ring-primary/50"
            placeholder="Ketik pesan..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {isLoading ? "Thinking..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
