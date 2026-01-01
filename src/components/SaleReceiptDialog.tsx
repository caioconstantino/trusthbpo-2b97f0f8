import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Printer, Download, Mail, MessageCircle, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Payment {
  method: string;
  value: number;
}

interface SaleReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleData: {
    id?: string;
    customerName: string;
    cartItems: CartItem[];
    subtotal: number;
    discountPercent: number;
    additionPercent: number;
    total: number;
    change: number;
    payments: Payment[];
    createdAt?: string;
  } | null;
}

export const SaleReceiptDialog = ({
  open,
  onOpenChange,
  saleData
}: SaleReceiptDialogProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!saleData) return null;

  const discountValue = (saleData.subtotal * saleData.discountPercent) / 100;
  const additionValue = (saleData.subtotal * saleData.additionPercent) / 100;
  const dateTime = saleData.createdAt 
    ? format(new Date(saleData.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  const generateReceiptHTML = () => {
    const itemsHTML = saleData.cartItems.map(item => `
      <tr>
        <td style="padding: 4px 0; border-bottom: 1px dashed #ddd;">${item.name}</td>
        <td style="padding: 4px 0; border-bottom: 1px dashed #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 4px 0; border-bottom: 1px dashed #ddd; text-align: right;">R$ ${item.price.toFixed(2)}</td>
        <td style="padding: 4px 0; border-bottom: 1px dashed #ddd; text-align: right;">R$ ${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const paymentsHTML = saleData.payments.map(p => `
      <div style="display: flex; justify-content: space-between; margin: 4px 0;">
        <span>${p.method}</span>
        <span>R$ ${p.value.toFixed(2)}</span>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Comprovante de Venda</title>
        <style>
          body { font-family: 'Courier New', monospace; max-width: 300px; margin: 0 auto; padding: 20px; font-size: 12px; }
          .header { text-align: center; margin-bottom: 20px; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; padding: 4px 0; border-bottom: 2px solid #000; }
          .total-row { font-weight: bold; font-size: 14px; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2 style="margin: 0;">COMPROVANTE DE VENDA</h2>
          <p style="margin: 5px 0;">${dateTime}</p>
          ${saleData.id ? `<p style="margin: 5px 0; font-size: 10px;">Venda #${saleData.id.substring(0, 8)}</p>` : ''}
        </div>
        
        ${saleData.customerName ? `<p><strong>Cliente:</strong> ${saleData.customerName}</p>` : ''}
        
        <div class="divider"></div>
        
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th style="text-align: center;">Qtd</th>
              <th style="text-align: right;">Vlr</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
        
        <div class="divider"></div>
        
        <div style="margin: 10px 0;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>R$ ${saleData.subtotal.toFixed(2)}</span>
          </div>
          ${saleData.discountPercent > 0 ? `
            <div style="display: flex; justify-content: space-between; color: #e53e3e;">
              <span>Desconto (${saleData.discountPercent}%):</span>
              <span>- R$ ${discountValue.toFixed(2)}</span>
            </div>
          ` : ''}
          ${saleData.additionPercent > 0 ? `
            <div style="display: flex; justify-content: space-between; color: #38a169;">
              <span>Acréscimo (${saleData.additionPercent}%):</span>
              <span>+ R$ ${additionValue.toFixed(2)}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="divider"></div>
        
        <div class="total-row" style="display: flex; justify-content: space-between; margin: 10px 0;">
          <span>TOTAL:</span>
          <span>R$ ${saleData.total.toFixed(2)}</span>
        </div>
        
        <div class="divider"></div>
        
        <div style="margin: 10px 0;">
          <p style="margin: 0 0 5px 0; font-weight: bold;">Forma de Pagamento:</p>
          ${paymentsHTML}
        </div>
        
        ${saleData.change > 0 ? `
          <div style="display: flex; justify-content: space-between; margin: 10px 0; font-weight: bold; color: #38a169;">
            <span>Troco:</span>
            <span>R$ ${saleData.change.toFixed(2)}</span>
          </div>
        ` : ''}
        
        <div class="footer">
          <div class="divider"></div>
          <p>Obrigado pela preferência!</p>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateReceiptHTML());
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const html = generateReceiptHTML();
      printWindow.document.write(`
        ${html}
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      `);
      printWindow.document.close();
    }
    toast({
      title: "PDF",
      description: "Use a opção 'Salvar como PDF' na janela de impressão",
    });
  };

  const handleSendEmail = async () => {
    if (!email) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, informe o email do cliente",
        variant: "destructive"
      });
      return;
    }

    setSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-receipt-email', {
        body: {
          to: email,
          subject: "Comprovante de Venda",
          html: generateReceiptHTML(),
          customerName: saleData.customerName,
          total: saleData.total
        }
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Email enviado!",
        description: `Comprovante enviado para ${email}`,
      });
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive"
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleWhatsApp = () => {
    toast({
      title: "Em desenvolvimento",
      description: "Envio por WhatsApp será disponibilizado em breve",
    });
  };

  const handleClose = () => {
    setEmail("");
    setEmailSent(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Venda Finalizada!
          </DialogTitle>
          <DialogDescription>
            Comprovante da venda - {dateTime}
          </DialogDescription>
        </DialogHeader>

        {/* Receipt Preview */}
        <div ref={receiptRef} className="bg-muted/50 p-4 rounded-lg text-sm font-mono">
          <div className="text-center mb-4">
            <h3 className="font-bold text-lg">COMPROVANTE DE VENDA</h3>
            {saleData.id && (
              <p className="text-xs text-muted-foreground">#{saleData.id.substring(0, 8)}</p>
            )}
          </div>

          {saleData.customerName && (
            <p className="mb-2"><strong>Cliente:</strong> {saleData.customerName}</p>
          )}

          <Separator className="my-2" />

          <div className="space-y-1">
            {saleData.cartItems.map((item, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span>{item.quantity}x {item.name}</span>
                <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <Separator className="my-2" />

          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>R$ {saleData.subtotal.toFixed(2)}</span>
            </div>
            {saleData.discountPercent > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Desconto ({saleData.discountPercent}%):</span>
                <span>- R$ {discountValue.toFixed(2)}</span>
              </div>
            )}
            {saleData.additionPercent > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Acréscimo ({saleData.additionPercent}%):</span>
                <span>+ R$ {additionValue.toFixed(2)}</span>
              </div>
            )}
          </div>

          <Separator className="my-2" />

          <div className="flex justify-between font-bold">
            <span>TOTAL:</span>
            <span>R$ {saleData.total.toFixed(2)}</span>
          </div>

          <Separator className="my-2" />

          <div className="text-xs">
            <p className="font-bold mb-1">Pagamento:</p>
            {saleData.payments.map((p, i) => (
              <div key={i} className="flex justify-between">
                <span>{p.method}</span>
                <span>R$ {p.value.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {saleData.change > 0 && (
            <div className="flex justify-between font-bold text-green-600 mt-2">
              <span>Troco:</span>
              <span>R$ {saleData.change.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Salvar PDF
          </Button>
        </div>

        {/* Email Section */}
        <div className="space-y-2">
          <Label>Enviar por Email</Label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={emailSent}
            />
            <Button 
              onClick={handleSendEmail} 
              disabled={sendingEmail || emailSent}
              className="gap-2 shrink-0"
            >
              {sendingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : emailSent ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              {emailSent ? "Enviado" : "Enviar"}
            </Button>
          </div>
        </div>

        {/* WhatsApp Button (In Development) */}
        <Button 
          onClick={handleWhatsApp} 
          variant="secondary" 
          className="w-full gap-2"
          disabled
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp (Em breve)
        </Button>

        <Button onClick={handleClose} className="w-full">
          Fechar
        </Button>
      </DialogContent>
    </Dialog>
  );
};
