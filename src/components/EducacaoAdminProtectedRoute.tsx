import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Props { children: React.ReactNode }

export const EducacaoAdminProtectedRoute = ({ children }: Props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => check());
    return () => subscription.unsubscribe();
  }, []);

  const check = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAllowed(false); setIsLoading(false); return; }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "admin_educacao"]);
      setAllowed(!!data && data.length > 0);
    } catch {
      setAllowed(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!allowed) return <Navigate to="/admin/educacao/login" replace />;
  return <>{children}</>;
};
