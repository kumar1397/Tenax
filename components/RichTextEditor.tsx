"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, List } from "lucide-react";

// Lightweight rich-text field: paragraphs + bold + italic + bullet lists.
// Emits HTML via onChange. Paste is forced to plain text so no external
// HTML/scripts can enter the field (content is limited to what the toolbar and
// keyboard produce). Render the stored value through sanitizeRichText().
export default function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Push external value in only when it diverges, so typing never resets the caret.
  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) el.innerHTML = value || "";
  }, [value]);

  const sync = () => onChange(ref.current?.innerHTML ?? "");

  const exec = (cmd: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false);
    sync();
  };

  const tools = [
    { cmd: "bold", Icon: Bold, label: "Bold" },
    { cmd: "italic", Icon: Italic, label: "Italic" },
    { cmd: "insertUnorderedList", Icon: List, label: "Bullet list" },
  ];

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-1.5 border-b border-border px-2 py-1.5">
        {tools.map(({ cmd, Icon, label }) => (
          <button
            key={cmd}
            type="button"
            title={label}
            aria-label={label}
            // onMouseDown (not onClick) so the editor keeps its selection
            onMouseDown={(e) => { e.preventDefault(); exec(cmd); }}
            className="grid size-8 place-items-center rounded-md border border-border bg-background text-muted-foreground transition hover:border-brand hover:text-foreground"
          >
            <Icon className="size-4" />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={sync}
        onBlur={sync}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          sync();
        }}
        className="rte min-h-[150px] px-3 py-2.5 text-sm leading-relaxed focus:outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic"
      />
    </div>
  );
}
