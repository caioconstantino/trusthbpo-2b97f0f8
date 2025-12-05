import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import Landing from "./pages/Landing";
import Educacao from "./pages/Educacao";
import FabricaSoftware from "./pages/FabricaSoftware";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Produtos from "./pages/Produtos";
import Clientes from "./pages/Clientes";
import PDV from "./pages/PDV";
import Compras from "./pages/Compras";
import ContasPagar from "./pages/ContasPagar";
import ContasReceber from "./pages/ContasReceber";
import CentralContas from "./pages/CentralContas";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminClientes from "./pages/admin/AdminClientes";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminWebhooks from "./pages/admin/AdminWebhooks";
import AdminEscolas from "./pages/admin/AdminEscolas";
import AdminAlunos from "./pages/admin/AdminAlunos";
import AdminFinanceiro from "./pages/admin/AdminFinanceiro";
import AdminRevendas from "./pages/admin/AdminRevendas";
import CriarUsuario from "./pages/CriarUsuario";
import Configuracoes from "./pages/Configuracoes";
import CadastroAluno from "./pages/CadastroAluno";
import RevendaLanding from "./pages/RevendaLanding";
import RevendaDashboard from "./pages/RevendaDashboard";
import RevendaLogin from "./pages/RevendaLogin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/educacao" element={<Educacao />} />
            <Route path="/fabrica-software" element={<FabricaSoftware />} />
            <Route path="/login" element={<Login />} />
            <Route path="/criar-usuario" element={<CriarUsuario />} />
            <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/produtos" element={<ProtectedRoute><Produtos /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
            <Route path="/pdv" element={<ProtectedRoute><PDV /></ProtectedRoute>} />
            <Route path="/compras" element={<ProtectedRoute><Compras /></ProtectedRoute>} />
            <Route path="/contas-pagar" element={<ProtectedRoute><ContasPagar /></ProtectedRoute>} />
            <Route path="/contas-receber" element={<ProtectedRoute><ContasReceber /></ProtectedRoute>} />
            <Route path="/central-contas" element={<ProtectedRoute><CentralContas /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/clientes" element={<AdminProtectedRoute><AdminClientes /></AdminProtectedRoute>} />
            <Route path="/admin/usuarios" element={<AdminProtectedRoute><AdminUsuarios /></AdminProtectedRoute>} />
            <Route path="/admin/webhooks" element={<AdminProtectedRoute><AdminWebhooks /></AdminProtectedRoute>} />
            <Route path="/admin/escolas" element={<AdminProtectedRoute><AdminEscolas /></AdminProtectedRoute>} />
            <Route path="/admin/alunos" element={<AdminProtectedRoute><AdminAlunos /></AdminProtectedRoute>} />
            <Route path="/admin/financeiro" element={<AdminProtectedRoute><AdminFinanceiro /></AdminProtectedRoute>} />
            <Route path="/admin/revendas" element={<AdminProtectedRoute><AdminRevendas /></AdminProtectedRoute>} />
            
            {/* Public Registration Routes */}
            <Route path="/cadastro/aluno/:slug" element={<CadastroAluno />} />
            
            {/* Revenda Routes */}
            <Route path="/revenda/login" element={<RevendaLogin />} />
            <Route path="/revenda/dashboard" element={<RevendaDashboard />} />
            <Route path="/revenda/:slug" element={<RevendaLanding />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
