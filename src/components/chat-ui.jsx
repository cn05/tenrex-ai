"use client";

import { useState, useRef, useEffect } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

function buildToolProgressId(event, existingProgress = []) {
  if (event.toolCallId) return event.toolCallId;

  const fallbackId = [event.toolName, event.staffNumber, event.title]
    .filter(Boolean)
    .join(":");

  if (fallbackId) return fallbackId;

  return `tool-progress-${existingProgress.length + 1}`;
}

function updateToolProgress(existingProgress = [], event) {
  const nextProgress = [...existingProgress];
  const progressId = buildToolProgressId(event, existingProgress);
  const existingIndex = nextProgress.findIndex(
    (item) => item.progressId === progressId,
  );

  const nextItem = {
    progressId,
    toolCallId: event.toolCallId,
    toolName: event.toolName || "researchTask",
    staffNumber: event.staffNumber ?? "?",
    title: event.title || "Research Task",
    status:
      event.phase === "start"
        ? "running"
        : event.phase === "done"
          ? "done"
          : "error",
    detail:
      event.phase === "start"
        ? event.startMessage || "Sedang menjalankan riset tambahan."
        : event.phase === "done"
          ? event.doneMessage || "Riset tambahan selesai."
          : event.errorMessage || "Riset tambahan gagal dijalankan.",
    durationMs: event.durationMs ?? null,
  };

  if (existingIndex >= 0) {
    nextProgress[existingIndex] = {
      ...nextProgress[existingIndex],
      ...nextItem,
    };
  } else {
    nextProgress.push(nextItem);
  }

  return nextProgress.sort((a, b) => {
    if (a.staffNumber === b.staffNumber) {
      return String(a.title).localeCompare(String(b.title));
    }

    const leftOrder = Number.isFinite(Number(a.staffNumber))
      ? Number(a.staffNumber)
      : Number.MAX_SAFE_INTEGER;
    const rightOrder = Number.isFinite(Number(b.staffNumber))
      ? Number(b.staffNumber)
      : Number.MAX_SAFE_INTEGER;

    return leftOrder - rightOrder;
  });
}

function ToolProgressPanel({ statusText, toolProgress = [] }) {
  if (!statusText && toolProgress.length === 0) return null;

  return (
    <div className="mb-3 rounded-xl border border-border/60 bg-background/70 p-3">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Tenrex Research
      </div>

      {statusText ? (
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          <span>{statusText}</span>
        </div>
      ) : null}

      {toolProgress.length > 0 ? (
        <div className="space-y-2">
          {toolProgress.map((item) => {
            const Icon =
              item.status === "done"
                ? CheckCircle2
                : item.status === "error"
                  ? AlertCircle
                  : LoaderCircle;

            return (
              <div
                key={item.progressId}
                className="flex items-start justify-between gap-3 rounded-lg bg-muted/55 px-3 py-2"
              >
                <div className="flex min-w-0 items-start gap-2">
                  <Icon
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      item.status === "done"
                        ? "text-emerald-500"
                        : item.status === "error"
                          ? "text-red-500"
                          : "animate-spin text-primary"
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-medium">
                      {`Staf ${item.staffNumber} - ${item.title}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.detail}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {item.status === "done"
                    ? "Done"
                    : item.status === "error"
                      ? "Error"
                      : "Working"}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

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
  const autoSentRef = useRef(false);
  const sendMessageRef = useRef(null);

  const updateLastAssistantMessage = (updater) => {
    setMessages((prev) => {
      const updatedMessages = [...prev];
      const lastIndex = updatedMessages.length - 1;

      if (lastIndex < 0 || updatedMessages[lastIndex].role !== "assistant") {
        return prev;
      }

      updatedMessages[lastIndex] = updater(updatedMessages[lastIndex]);
      return updatedMessages;
    });
  };

  const sendMessage = async (rawText) => {
    const userText = String(rawText ?? input);
    if (!userText.trim() || isLoading) return;

    const trimmedUserText = userText.trim();
    const isFirstMessage = messages.length <= 1;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmedUserText },
      {
        role: "assistant",
        content: "",
        toolProgress: [],
        statusText: "Tenrex sedang menyiapkan riset...",
        isStreaming: true,
      },
    ]);

    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          userId,
          message: trimmedUserText,
          isFirstMessage,
        }),
      });

      if (!response.ok) throw new Error("Gagal memproses pesan");
      if (!response.body) throw new Error("Response stream kosong");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let aiTextSoFar = "";
      let buffer = "";

      const handleEvent = (event) => {
        if (event.type === "assistant-status") {
          updateLastAssistantMessage((message) => ({
            ...message,
            statusText: event.phase === "done" ? null : event.message,
            isStreaming: event.phase !== "done",
          }));
          return;
        }

        if (event.type === "tool-status") {
          updateLastAssistantMessage((message) => ({
            ...message,
            toolProgress: updateToolProgress(message.toolProgress, event),
          }));
          return;
        }

        if (event.type === "text-delta") {
          aiTextSoFar += event.text;

          updateLastAssistantMessage((message) => ({
            ...message,
            content: aiTextSoFar,
            statusText: "Tenrex sedang menulis jawaban...",
            isStreaming: true,
          }));
        }
      };

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        buffer += decoder.decode(value || new Uint8Array(), {
          stream: !doneReading,
        });

        let newlineIndex = buffer.indexOf("\n");
        while (newlineIndex >= 0) {
          const rawLine = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);

          if (rawLine) {
            handleEvent(JSON.parse(rawLine));
          }

          newlineIndex = buffer.indexOf("\n");
        }
      }

      const finalLine = buffer.trim();
      if (finalLine) {
        handleEvent(JSON.parse(finalLine));
      }

      if (!aiTextSoFar.trim()) {
        updateLastAssistantMessage((message) => ({
          ...message,
          content:
            "Maaf, saya belum berhasil menghasilkan jawaban. Coba kirim ulang pesan ini.",
          statusText: null,
          isStreaming: false,
        }));
      } else {
        updateLastAssistantMessage((message) => ({
          ...message,
          statusText: null,
          isStreaming: false,
        }));
      }
    } catch (error) {
      console.error("Error sending message:", error);
      updateLastAssistantMessage((message) => ({
        ...message,
        toolProgress: message.toolProgress?.map((item) =>
          item.status === "running"
            ? {
                ...item,
                status: "error",
                detail: "Proses ini terhenti sebelum selesai.",
              }
            : item,
        ),
        content: message.content || "Maaf, sistem sedang sibuk. Coba lagi ya.",
        statusText: null,
        isStreaming: false,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  sendMessageRef.current = sendMessage;

  const handleSend = () => {
    void sendMessage(input);
  };

  useEffect(() => {
    if (autoSentRef.current) return;

    const pendingKey = `pending-chat:${chatId}`;
    const pendingMessage = window.sessionStorage.getItem(pendingKey);

    if (!pendingMessage) return;

    autoSentRef.current = true;
    window.sessionStorage.removeItem(pendingKey);
    void sendMessageRef.current?.(pendingMessage);
  }, [chatId]);

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
                <>
                  <ToolProgressPanel
                    statusText={m.statusText}
                    toolProgress={m.toolProgress}
                  />

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
                </>
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
