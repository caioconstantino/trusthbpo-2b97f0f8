import { Download, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

interface DownloadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const downloads = [
  {
    name: "Formulário de Estágio",
    file: "/downloads/Formulario_Estagio_TRUSTHBPO.docx",
  },
  {
    name: "Relatório Semestral",
    file: "/downloads/Relatorio_Semestral_TRUSTHBPO.docx",
  },
];

export function DownloadsDialog({ open, onOpenChange }: DownloadsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Downloads
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {downloads.map((item) => (
            <a
              key={item.file}
              href={item.file}
              download
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <FileText className="h-8 w-8 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground">.docx</p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0" asChild>
                <span>
                  <Download className="h-4 w-4" />
                </span>
              </Button>
            </a>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
