import { useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Underline, Type } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Digite aqui...",
  className,
  minHeight = "120px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync external value changes
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      const currentHtml = editorRef.current.innerHTML;
      // Convert plain text (with \n) to HTML if needed
      const htmlValue = value.includes("<") ? value : convertPlainToHtml(value);
      if (currentHtml !== htmlValue) {
        editorRef.current.innerHTML = htmlValue;
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const convertPlainToHtml = (text: string): string => {
    if (!text) return "";
    return text
      .split("\n")
      .map((line) => (line.trim() === "" ? "<br>" : `<p>${line}</p>`))
      .join("");
  };

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      document.execCommand("insertParagraph");
      handleInput();
    }
  };

  const isActive = (command: string) => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  };

  return (
    <div className={cn("border rounded-md overflow-hidden bg-background", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b bg-muted/30 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => execCommand("bold")}
          title="Negrito"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => execCommand("italic")}
          title="Itálico"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => execCommand("underline")}
          title="Sublinhado"
        >
          <Underline className="h-3.5 w-3.5" />
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        <Select
          onValueChange={(v) => execCommand("fontSize", v)}
        >
          <SelectTrigger className="h-7 text-xs w-20 gap-1">
            <Type className="h-3 w-3" />
            <SelectValue placeholder="Tam." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Muito Pequeno</SelectItem>
            <SelectItem value="2">Pequeno</SelectItem>
            <SelectItem value="3">Normal</SelectItem>
            <SelectItem value="4">Médio</SelectItem>
            <SelectItem value="5">Grande</SelectItem>
            <SelectItem value="6">Muito Grande</SelectItem>
            <SelectItem value="7">Enorme</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className={cn(
          "px-3 py-2 text-sm outline-none overflow-auto",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50 empty:before:pointer-events-none",
          "[&_p]:my-0.5 [&_br]:leading-6"
        )}
        style={{ minHeight }}
      />
    </div>
  );
}
