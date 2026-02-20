import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface BlockConfig {
  // Header config
  logoUrl?: string;
  alignment?: "left" | "center" | "right";
  backgroundColor?: string;
  textColor?: string;
  showBorder?: boolean;
  borderColor?: string;
  padding?: string;
  
  // Items config
  headerBgColor?: string;
  headerTextColor?: string;
  rowBgColor?: string;
  rowTextColor?: string;
  footerBgColor?: string;
  footerTextColor?: string;
  
  // Conditions/Text config
  fontSize?: string;
  fontWeight?: string;
  
  // Footer config
  companyName?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
}

interface BlockConfigPanelProps {
  blockType: "header" | "items" | "conditions" | "text" | "divider" | "footer" | "cliente" | "oferta" | "imagem" | "assinatura" | "beneficios" | "prazo";
  config: BlockConfig;
  content?: string;
  onConfigChange: (config: BlockConfig) => void;
  onContentChange?: (content: string) => void;
  onClose: () => void;
}

export function BlockConfigPanel({
  blockType,
  config,
  content,
  onConfigChange,
  onContentChange,
  onClose,
}: BlockConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState<BlockConfig>(config);
  const [localContent, setLocalContent] = useState(content || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalConfig(config);
    setLocalContent(content || "");
  }, [config, content]);

  const updateConfig = (key: keyof BlockConfig, value: string | boolean) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo de imagem",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const dominio = localStorage.getItem("user_dominio") || "default";
      const fileName = `${dominio}/propostas-logo-${Date.now()}.${file.name.split(".").pop()}`;

      const { data, error } = await supabase.storage
        .from("produtos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from("produtos")
        .getPublicUrl(data.path);

      updateConfig("logoUrl", publicUrl.publicUrl);
      toast({
        title: "Sucesso",
        description: "Logo enviado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao enviar logo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o logo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = () => {
    updateConfig("logoUrl", "");
  };

  const renderHeaderConfig = () => (
    <div className="space-y-4">
      {/* Logo Upload */}
      <div className="space-y-2">
        <Label>Logo da Empresa</Label>
        {localConfig.logoUrl ? (
          <div className="relative inline-block">
            <img
              src={localConfig.logoUrl}
              alt="Logo"
              className="max-h-20 rounded border"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={removeLogo}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Enviando..." : "Enviar Logo"}
            </Button>
          </div>
        )}
      </div>

      {/* Alignment */}
      <div className="space-y-2">
        <Label>Alinhamento</Label>
        <div className="flex gap-2">
          <Button
            variant={localConfig.alignment === "left" ? "default" : "outline"}
            size="icon"
            onClick={() => updateConfig("alignment", "left")}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={localConfig.alignment === "center" ? "default" : "outline"}
            size="icon"
            onClick={() => updateConfig("alignment", "center")}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant={localConfig.alignment === "right" ? "default" : "outline"}
            size="icon"
            onClick={() => updateConfig("alignment", "right")}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cor de Fundo</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={localConfig.backgroundColor || "#ffffff"}
              onChange={(e) => updateConfig("backgroundColor", e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={localConfig.backgroundColor || "#ffffff"}
              onChange={(e) => updateConfig("backgroundColor", e.target.value)}
              placeholder="#ffffff"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Cor do Texto</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={localConfig.textColor || "#000000"}
              onChange={(e) => updateConfig("textColor", e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={localConfig.textColor || "#000000"}
              onChange={(e) => updateConfig("textColor", e.target.value)}
              placeholder="#000000"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label>Texto do Cabeçalho</Label>
        <Input
          value={localContent}
          onChange={(e) => {
            setLocalContent(e.target.value);
            onContentChange?.(e.target.value);
          }}
          placeholder="Proposta Comercial"
        />
      </div>
    </div>
  );

  const renderItemsConfig = () => (
    <div className="space-y-4">
      <Tabs defaultValue="header">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="header">Cabeçalho</TabsTrigger>
          <TabsTrigger value="rows">Linhas</TabsTrigger>
          <TabsTrigger value="footer">Rodapé</TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cor de Fundo</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={localConfig.headerBgColor || "#f3f4f6"}
                  onChange={(e) => updateConfig("headerBgColor", e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={localConfig.headerBgColor || "#f3f4f6"}
                  onChange={(e) => updateConfig("headerBgColor", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor do Texto</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={localConfig.headerTextColor || "#000000"}
                  onChange={(e) => updateConfig("headerTextColor", e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={localConfig.headerTextColor || "#000000"}
                  onChange={(e) => updateConfig("headerTextColor", e.target.value)}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rows" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cor de Fundo</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={localConfig.rowBgColor || "#ffffff"}
                  onChange={(e) => updateConfig("rowBgColor", e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={localConfig.rowBgColor || "#ffffff"}
                  onChange={(e) => updateConfig("rowBgColor", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor do Texto</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={localConfig.rowTextColor || "#000000"}
                  onChange={(e) => updateConfig("rowTextColor", e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={localConfig.rowTextColor || "#000000"}
                  onChange={(e) => updateConfig("rowTextColor", e.target.value)}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="footer" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cor de Fundo</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={localConfig.footerBgColor || "#f3f4f6"}
                  onChange={(e) => updateConfig("footerBgColor", e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={localConfig.footerBgColor || "#f3f4f6"}
                  onChange={(e) => updateConfig("footerBgColor", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor do Texto</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={localConfig.footerTextColor || "#000000"}
                  onChange={(e) => updateConfig("footerTextColor", e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={localConfig.footerTextColor || "#000000"}
                  onChange={(e) => updateConfig("footerTextColor", e.target.value)}
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderConditionsConfig = () => (
    <div className="space-y-4">
      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cor de Fundo</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={localConfig.backgroundColor || "#ffffff"}
              onChange={(e) => updateConfig("backgroundColor", e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={localConfig.backgroundColor || "#ffffff"}
              onChange={(e) => updateConfig("backgroundColor", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Cor do Texto</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={localConfig.textColor || "#000000"}
              onChange={(e) => updateConfig("textColor", e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={localConfig.textColor || "#000000"}
              onChange={(e) => updateConfig("textColor", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <Label>Tamanho da Fonte</Label>
        <Select
          value={localConfig.fontSize || "normal"}
          onValueChange={(v) => updateConfig("fontSize", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Pequeno</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="large">Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label>Conteúdo</Label>
        <Textarea
          value={localContent}
          onChange={(e) => {
            setLocalContent(e.target.value);
            onContentChange?.(e.target.value);
          }}
          rows={4}
          placeholder="Digite as condições..."
        />
      </div>
    </div>
  );

  const renderFooterConfig = () => (
    <div className="space-y-4">
      {/* Company Info */}
      <div className="space-y-2">
        <Label>Nome da Empresa</Label>
        <Input
          value={localConfig.companyName || ""}
          onChange={(e) => updateConfig("companyName", e.target.value)}
          placeholder="Nome da sua empresa"
        />
      </div>
      <div className="space-y-2">
        <Label>Telefone</Label>
        <Input
          value={localConfig.companyPhone || ""}
          onChange={(e) => updateConfig("companyPhone", e.target.value)}
          placeholder="(00) 00000-0000"
        />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          value={localConfig.companyEmail || ""}
          onChange={(e) => updateConfig("companyEmail", e.target.value)}
          placeholder="contato@empresa.com"
        />
      </div>
      <div className="space-y-2">
        <Label>Endereço</Label>
        <Textarea
          value={localConfig.companyAddress || ""}
          onChange={(e) => updateConfig("companyAddress", e.target.value)}
          placeholder="Endereço completo"
          rows={2}
        />
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cor de Fundo</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={localConfig.backgroundColor || "#f3f4f6"}
              onChange={(e) => updateConfig("backgroundColor", e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={localConfig.backgroundColor || "#f3f4f6"}
              onChange={(e) => updateConfig("backgroundColor", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Cor do Texto</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={localConfig.textColor || "#666666"}
              onChange={(e) => updateConfig("textColor", e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={localConfig.textColor || "#666666"}
              onChange={(e) => updateConfig("textColor", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTextConfig = () => (
    <div className="space-y-4">
      {/* Alignment */}
      <div className="space-y-2">
        <Label>Alinhamento</Label>
        <div className="flex gap-2">
          <Button
            variant={localConfig.alignment === "left" ? "default" : "outline"}
            size="icon"
            onClick={() => updateConfig("alignment", "left")}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={localConfig.alignment === "center" ? "default" : "outline"}
            size="icon"
            onClick={() => updateConfig("alignment", "center")}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant={localConfig.alignment === "right" ? "default" : "outline"}
            size="icon"
            onClick={() => updateConfig("alignment", "right")}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cor de Fundo</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={localConfig.backgroundColor || "#ffffff"}
              onChange={(e) => updateConfig("backgroundColor", e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={localConfig.backgroundColor || "#ffffff"}
              onChange={(e) => updateConfig("backgroundColor", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Cor do Texto</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={localConfig.textColor || "#000000"}
              onChange={(e) => updateConfig("textColor", e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={localConfig.textColor || "#000000"}
              onChange={(e) => updateConfig("textColor", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <Label>Tamanho da Fonte</Label>
        <Select
          value={localConfig.fontSize || "normal"}
          onValueChange={(v) => updateConfig("fontSize", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Pequeno</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="large">Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label>Conteúdo</Label>
        <Textarea
          value={localContent}
          onChange={(e) => {
            setLocalContent(e.target.value);
            onContentChange?.(e.target.value);
          }}
          rows={4}
          placeholder="Digite o texto..."
        />
      </div>
    </div>
  );

  const renderDividerConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Cor da Linha</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={localConfig.borderColor || "#e5e7eb"}
            onChange={(e) => updateConfig("borderColor", e.target.value)}
            className="w-12 h-10 p-1 cursor-pointer"
          />
          <Input
            value={localConfig.borderColor || "#e5e7eb"}
            onChange={(e) => updateConfig("borderColor", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Espaçamento</Label>
        <Select
          value={localConfig.padding || "normal"}
          onValueChange={(v) => updateConfig("padding", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Pequeno</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="large">Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const getTitle = () => {
    const titles: Record<string, string> = {
      header: "Configurar Cabeçalho",
      items: "Configurar Tabela de Itens",
      conditions: "Configurar Condições",
      text: "Configurar Texto",
      divider: "Configurar Divisor",
      footer: "Configurar Rodapé",
    };
    return titles[blockType] || "Configurar Bloco";
  };

  return (
    <Card className="w-80 absolute right-0 top-0 z-10 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{getTitle()}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="max-h-[60vh] overflow-y-auto">
        {blockType === "header" && renderHeaderConfig()}
        {blockType === "items" && renderItemsConfig()}
        {blockType === "conditions" && renderConditionsConfig()}
        {blockType === "text" && renderTextConfig()}
        {blockType === "divider" && renderDividerConfig()}
        {blockType === "footer" && renderFooterConfig()}
      </CardContent>
    </Card>
  );
}
