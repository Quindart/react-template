import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  FileText,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet';
import { ChatComposer, type ChatAttachment } from './chat-composer';
import { getFakeReply, quickQuestions } from './fake-reply';

type ChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  attachments: ChatAttachment[];
};

export function BusinessChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [pending, setPending] = useState(false);
  const nextId = useRef(0);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(
    () => () => {
      if (replyTimer.current !== null) clearTimeout(replyTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!open || messages.length === 0) return;
    const frame = requestAnimationFrame(() => {
      if (scroller.current)
        scroller.current.scrollTop = scroller.current.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, pending, open]);

  function send(text: string, files: ChatAttachment[]) {
    const trimmed = text.trim();
    if (replyTimer.current !== null || (!trimmed && files.length === 0)) return;
    const id = ++nextId.current;
    setMessages((current) => [
      ...current,
      { id, role: 'user', text: trimmed, attachments: files },
    ]);
    setPending(true);
    replyTimer.current = setTimeout(() => {
      const answer = getFakeReply(
        trimmed,
        files.map((file) => file.name),
      );
      const id = ++nextId.current;
      setMessages((current) => [
        ...current,
        { id, role: 'assistant', text: answer, attachments: [] },
      ]);
      replyTimer.current = null;
      setPending(false);
    }, 700);
  }

  function sendDraft() {
    if (replyTimer.current !== null || (!draft.trim() && !attachments.length))
      return;
    send(draft, attachments);
    setDraft('');
    setAttachments([]);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          aria-label="Mở chatbot"
          title="Trợ lý kinh doanh"
          className="fixed bottom-6 right-6 z-30 size-14 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 transition-transform hover:scale-105 hover:bg-indigo-700 motion-reduce:transform-none"
        >
          <MessageCircle aria-hidden="true" className="!size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex h-dvh w-full flex-col gap-0 p-0 sm:w-[max(25vw,360px)] sm:max-w-none motion-reduce:animate-none"
      >
        <SheetHeader className="shrink-0 border-b p-5 pr-12 text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Sparkles aria-hidden="true" className="size-4 text-indigo-600" />
            Trợ lý kinh doanh
          </SheetTitle>
          <SheetDescription className="text-xs">
            Khám phá số liệu · Chatbot demo
          </SheetDescription>
        </SheetHeader>

        <div
          ref={scroller}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5"
        >
          {messages.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <ChartNoAxesCombined aria-hidden="true" className="size-8" />
              </div>
              <h2 className="max-w-64 text-center text-lg font-semibold leading-7 tracking-tight">
                Phân tích kết quả kinh doanh với chatbot
              </h2>
              <p className="mt-2 max-w-64 text-center text-sm leading-6 text-muted-foreground">
                Bắt đầu bằng một câu hỏi hoặc chọn gợi ý bên dưới.
              </p>
              <div className="mt-5 w-full space-y-2">
                {quickQuestions.map((question) => (
                  <Button
                    key={question}
                    variant="outline"
                    onClick={() => send(question, [])}
                    className="h-auto w-full justify-between gap-3 whitespace-normal rounded-xl px-3 py-3 text-left text-xs leading-5 font-normal hover:border-indigo-200 hover:bg-indigo-50"
                  >
                    {question}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="text-indigo-500"
                    />
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div
              role="log"
              aria-label="Hội thoại chatbot"
              aria-live="polite"
              aria-relevant="additions"
              className="space-y-5"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <p className="mb-1.5 px-1 text-[11px] font-medium text-muted-foreground">
                    {message.role === 'user' ? 'Bạn' : 'Trợ lý kinh doanh'}
                  </p>
                  <div
                    className={`max-w-[95%] rounded-2xl px-3.5 py-3 text-sm leading-6 [overflow-wrap:anywhere] ${message.role === 'user' ? 'rounded-tr-sm bg-indigo-600 text-white' : 'rounded-tl-sm border bg-muted/30'}`}
                  >
                    {message.text && (
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    )}
                    {message.attachments.length > 0 && (
                      <ul
                        aria-label="Tệp đính kèm"
                        className={
                          message.text ? 'mt-2 space-y-1' : 'space-y-1'
                        }
                      >
                        {message.attachments.map((file) => (
                          <li
                            key={file.id}
                            className="flex items-start gap-2 text-xs"
                          >
                            <FileText
                              aria-hidden="true"
                              className="mt-0.5 size-4 shrink-0"
                            />
                            <span>{file.name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {pending && (
            <p
              role="status"
              className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"
            >
              <span
                aria-hidden="true"
                className="size-2 animate-pulse rounded-full bg-indigo-500 motion-reduce:animate-none"
              />
              Đang trả lời…
            </p>
          )}
        </div>

        <ChatComposer
          draft={draft}
          attachments={attachments}
          pending={pending}
          onDraftChange={setDraft}
          onAttach={(files) => {
            const additions = files.map((file) => ({
              id: ++nextId.current,
              name: file.name,
              size: file.size,
            }));
            setAttachments((current) => [...current, ...additions]);
          }}
          onRemove={(id) =>
            setAttachments((current) =>
              current.filter((file) => file.id !== id),
            )
          }
          onSend={sendDraft}
        />
      </SheetContent>
    </Sheet>
  );
}
