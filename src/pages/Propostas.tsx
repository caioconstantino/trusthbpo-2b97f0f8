import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  MoreVertical,
  FileText,
  Edit,
  Trash2,
  Copy,
  Send,
  Download,
  ShoppingCart,
  LayoutTemplate,
  Eye,
} from "lucide-react";
import { usePropostas, Proposta, PropostaModelo } from "@/hooks/usePropostas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreatePropostaDialog } from "@/components/propostas/CreatePropostaDialog";
import { PropostaEditorDialog } from "@/components/propostas/PropostaEditorDialog";
import { ModeloEditorDialog } from "@/components/propostas/ModeloEditorDialog";
import { ViewPropostaDialog } from "@/components/propostas/ViewPropostaDialog";

const statusColors: Record<string, string> = {
  rascunho: "bg-gray-500",
  enviada: "bg-blue-500",
  visualizada: "bg-purple-500",
  aprovada: "bg-green-500",
  rejeitada: "bg-red-500",
  convertida: "bg-amber-500",
};

const statusLabels: Record<string, string> = {
  rascunho: "Rascunho",
  enviada: "Enviada",
  visualizada: "Visualizada",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
  convertida: "Convertida em Venda",
};

const Propostas = () => {
  const {
    propostas,
    modelos,
    loading,
    deleteProposta,
    deleteModelo,
    fetchPropostas,
    fetchModelos,
  } = usePropostas();

  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editorDialogOpen, setEditorDialogOpen] = useState(false);
  const [modeloEditorOpen, setModeloEditorOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProposta, setSelectedProposta] = useState<Proposta | null>(null);
  const [selectedModelo, setSelectedModelo] = useState<PropostaModelo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteModeloDialogOpen, setDeleteModeloDialogOpen] = useState(false);
  const [propostaToDelete, setPropostaToDelete] = useState<string | null>(null);
  const [modeloToDelete, setModeloToDelete] = useState<string | null>(null);

  const filteredPropostas = propostas.filter(
    (p) =>
      p.titulo.toLowerCase().includes(search.toLowerCase()) ||
      p.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.numero.toString().includes(search)
  );

  const filteredModelos = modelos.filter((m) =>
    m.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditProposta = (proposta: Proposta) => {
    setSelectedProposta(proposta);
    setEditorDialogOpen(true);
  };

  const handleViewProposta = (proposta: Proposta) => {
    setSelectedProposta(proposta);
    setViewDialogOpen(true);
  };

  const handleDeleteProposta = async () => {
    if (propostaToDelete) {
      await deleteProposta(propostaToDelete);
      setDeleteDialogOpen(false);
      setPropostaToDelete(null);
    }
  };

  const handleEditModelo = (modelo: PropostaModelo) => {
    setSelectedModelo(modelo);
    setModeloEditorOpen(true);
  };

  const handleDeleteModelo = async () => {
    if (modeloToDelete) {
      await deleteModelo(modeloToDelete);
      setDeleteModeloDialogOpen(false);
      setModeloToDelete(null);
    }
  };

  const handleNewModelo = () => {
    setSelectedModelo(null);
    setModeloEditorOpen(true);
  };

  const handlePropostaCreated = () => {
    fetchPropostas();
    setCreateDialogOpen(false);
  };

  const handlePropostaSaved = () => {
    fetchPropostas();
    setEditorDialogOpen(false);
    setSelectedProposta(null);
  };

  const handleModeloSaved = () => {
    fetchModelos();
    setModeloEditorOpen(false);
    setSelectedModelo(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Propostas</h1>
            <p className="text-muted-foreground">
              Gerencie suas propostas comerciais
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleNewModelo}>
              <LayoutTemplate className="h-4 w-4 mr-2" />
              Novo Modelo
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Proposta
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar propostas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="propostas">
          <TabsList>
            <TabsTrigger value="propostas">
              <FileText className="h-4 w-4 mr-2" />
              Propostas ({propostas.length})
            </TabsTrigger>
            <TabsTrigger value="modelos">
              <LayoutTemplate className="h-4 w-4 mr-2" />
              Modelos ({modelos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="propostas" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : filteredPropostas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Nenhuma proposta encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPropostas.map((proposta) => (
                        <TableRow key={proposta.id}>
                          <TableCell className="font-medium">
                            #{proposta.numero}
                          </TableCell>
                          <TableCell>{proposta.titulo}</TableCell>
                          <TableCell>{proposta.cliente_nome || "-"}</TableCell>
                          <TableCell>
                            <Badge
                              className={`${statusColors[proposta.status]} text-white`}
                            >
                              {statusLabels[proposta.status] || proposta.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {proposta.total.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </TableCell>
                          <TableCell>
                            {format(new Date(proposta.created_at), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleViewProposta(proposta)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEditProposta(proposta)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Baixar PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Send className="h-4 w-4 mr-2" />
                                  Enviar por Email
                                </DropdownMenuItem>
                                {proposta.status === "aprovada" && (
                                  <DropdownMenuItem>
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Converter em Venda
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setPropostaToDelete(proposta.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modelos" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredModelos.map((modelo) => (
                <Card key={modelo.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">
                      {modelo.nome}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditModelo(modelo)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setModeloToDelete(modelo.id);
                            setDeleteModeloDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {modelo.descricao || "Sem descrição"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {modelo.layout.length} elementos
                    </p>
                  </CardContent>
                </Card>
              ))}
              {filteredModelos.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhum modelo encontrado. Crie seu primeiro modelo de proposta.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CreatePropostaDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        modelos={modelos}
        onCreated={handlePropostaCreated}
      />

      {selectedProposta && (
        <PropostaEditorDialog
          open={editorDialogOpen}
          onOpenChange={setEditorDialogOpen}
          proposta={selectedProposta}
          onSaved={handlePropostaSaved}
        />
      )}

      <ModeloEditorDialog
        open={modeloEditorOpen}
        onOpenChange={setModeloEditorOpen}
        modelo={selectedModelo}
        onSaved={handleModeloSaved}
      />

      {selectedProposta && (
        <ViewPropostaDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          proposta={selectedProposta}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir proposta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A proposta será permanentemente
              excluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProposta}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteModeloDialogOpen}
        onOpenChange={setDeleteModeloDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              Este modelo será desativado e não poderá mais ser usado para novas
              propostas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteModelo}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Propostas;
