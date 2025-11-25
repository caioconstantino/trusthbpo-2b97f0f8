import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TutorialStep {
  title: string;
  description: string;
  targetElement?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

interface DashboardTutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Relatórios Diários",
    description: "Aqui estão os relatórios diários. Aqui você pode acompanhar suas vendas, contas a receber do dia e despesas do dia.",
    targetElement: "metric-cards",
    position: "bottom",
  },
  {
    title: "Relatórios por Loja",
    description: "Aqui estão os relatórios para cada uma de suas lojas.",
    targetElement: "branches-section",
    position: "top",
  },
  {
    title: "Botão Operacional",
    description: "Este é o botão de operacional. Clique aqui para ver os relatórios operacionais.",
    targetElement: "operacional-tab",
    position: "bottom",
  },
  {
    title: "Botão Estoque",
    description: "Este é o botão de estoque. Clique aqui para acessar os relatórios de estoque.",
    targetElement: "estoque-tab",
    position: "bottom",
  },
  {
    title: "Botão Fiscal",
    description: "Este é o botão fiscal. Clique aqui para ver os relatórios fiscais.",
    targetElement: "fiscal-tab",
    position: "bottom",
  },
  {
    title: "Filtro de Data",
    description: "Você pode filtrar os dados por data usando este formulário.",
    targetElement: "date-filter",
    position: "bottom",
  },
];

export const DashboardTutorial = ({ open, onOpenChange }: DashboardTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      setHighlightedElement(null);
      return;
    }

    const step = tutorialSteps[currentStep];
    if (step.targetElement) {
      const element = document.getElementById(step.targetElement);
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      setHighlightedElement(null);
    }
  }, [currentStep, open]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onOpenChange(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" onClick={handleClose} />
      
      {/* Highlight Box */}
      {highlightedElement && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: highlightedElement.getBoundingClientRect().top - 8,
            left: highlightedElement.getBoundingClientRect().left - 8,
            width: highlightedElement.getBoundingClientRect().width + 16,
            height: highlightedElement.getBoundingClientRect().height + 16,
            border: "3px solid hsl(var(--primary))",
            borderRadius: "8px",
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
          }}
        />
      )}

      {/* Tutorial Dialog */}
      <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-lg p-6">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </button>

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 py-2">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentStep
                      ? "bg-primary"
                      : index < currentStep
                      ? "bg-primary/50"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                Back
              </Button>
              <Button onClick={handleNext}>
                {isLastStep ? "Done" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
