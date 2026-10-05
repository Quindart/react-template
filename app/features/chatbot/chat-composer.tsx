import { useRef, type FormEvent } from 'react';
import { Paperclip, Send, X, FileText } from 'lucide-react';
import { Button } from '~/components/ui/button';

export type ChatAttachment = { id: number; name: string; size: number };

type Props = {
  draft: string;
  attachments: ChatAttachment[];
  pending: boolean;
  onDraftChange: (value: string) => void;
  onAttach: (files: File[]) => void;
  onRemove: (id: number) => void;
  onSend: () => void;
};

export function ChatComposer({
  draft,
  attachments,
  pending,
  onDraftChange,
  onAttach,
  onRemove,
  onSend,
}: Props) {
  const picker = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const canSend =
    !pending && (draft.trim().length > 0 || attachments.length > 0);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSend) return;
    onSend();
    textarea.current?.focus();
  }

  return (
    <form
      onSubmit={submit}
      className="shrink-0 border-t bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {attachments.length > 0 && (
        <ul
          aria-label="Tệp đã chọn"
          className="mb-3 max-h-24 space-y-1.5 overflow-y-auto"
        >
          {attachments.map((file) => (
            <li
              key={file.id}
              className="flex min-w-0 items-center gap-2 rounded-lg border bg-muted/30 px-2 py-1 text-xs"
            >
              <FileText
                aria-hidden="true"
                className="size-4 shrink-0 text-indigo-500"
              />
              <span className="min-w-0 flex-1 truncate" title={file.name}>
                {file.name}
              </span>
              <span className="shrink-0 text-muted-foreground">
                {Math.max(1, Math.ceil(file.size / 1024))} KB
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                aria-label={`Bỏ tệp ${file.name}`}
                onClick={() => onRemove(file.id)}
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="rounded-xl border bg-muted/20 p-2 focus-within:ring-2 focus-within:ring-indigo-500/30">
        <label htmlFor="chat-message" className="sr-only">
          Tin nhắn
        </label>
        <textarea
          ref={textarea}
          id="chat-message"
          rows={3}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              if (canSend) event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Hỏi về kết quả kinh doanh…"
          aria-describedby="chat-input-help"
          className="block max-h-32 min-h-20 w-full resize-none bg-transparent px-2 py-1.5 text-base leading-6 outline-none placeholder:text-muted-foreground sm:text-sm"
        />
        <div className="flex items-center justify-between gap-2">
          <input
            ref={picker}
            type="file"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-label="Chọn tệp đính kèm"
            onChange={(event) => {
              onAttach(Array.from(event.target.files ?? []));
              event.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Đính kèm tệp"
            title="Đính kèm tệp"
            onClick={() => picker.current?.click()}
          >
            <Paperclip aria-hidden="true" />
          </Button>
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            aria-label="Gửi tin nhắn"
            className="rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Send aria-hidden="true" />
          </Button>
        </div>
      </div>
      <p
        id="chat-input-help"
        className="mt-2 text-center text-[10px] leading-4 text-muted-foreground"
      >
        Enter để gửi · Shift + Enter xuống dòng
      </p>
      <p className="mt-1 text-center text-[10px] leading-4 text-muted-foreground">
        Trả lời và đính kèm tệp là mô phỏng.
      </p>
    </form>
  );
}
