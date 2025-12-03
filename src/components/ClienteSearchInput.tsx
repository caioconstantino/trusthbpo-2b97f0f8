import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

interface Cliente {
  id: number;
  razao_social: string;
  cpf_cnpj: string;
}

interface ClienteSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ClienteSearchInput({ 
  value, 
  onChange, 
  placeholder = "Selecione um cliente",
  className 
}: ClienteSearchInputProps) {
  const [open, setOpen] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dominio = localStorage.getItem("user_dominio") || "";

  useEffect(() => {
    if (open) {
      fetchClientes();
    }
  }, [open]);

  const fetchClientes = async (search?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from("tb_clientes")
        .select("id, razao_social, cpf_cnpj")
        .eq("dominio", dominio)
        .order("razao_social", { ascending: true })
        .limit(50);

      if (search && search.length > 0) {
        query = query.or(`razao_social.ilike.%${search}%,cpf_cnpj.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Error fetching clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    fetchClientes(search);
  };

  const selectedCliente = clientes.find(c => c.razao_social === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-9 font-normal", className)}
        >
          <span className="truncate">
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Buscar cliente..." 
            value={searchTerm}
            onValueChange={handleSearch}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <>
                <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                <CommandGroup>
                  {clientes.map((cliente) => (
                    <CommandItem
                      key={cliente.id}
                      value={cliente.razao_social}
                      onSelect={() => {
                        onChange(cliente.razao_social);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === cliente.razao_social ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm">{cliente.razao_social}</span>
                        <span className="text-xs text-muted-foreground">{cliente.cpf_cnpj}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
