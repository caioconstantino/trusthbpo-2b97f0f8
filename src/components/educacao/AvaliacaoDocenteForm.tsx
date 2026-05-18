import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

export interface AvaliacaoDocente {
  docente?: {
    nome?: string; matricula?: string; email?: string; centro?: string;
    departamento?: string; data_entrada?: string;
    acompanhamento?: string[]; // '1_sem','2_sem','3_sem','4_sem','opcional'
  };
  tutor?: { nome?: string; matricula?: string; fone?: string; email?: string };
  assiduidade?: { frequencia?: string; permanencia?: string };
  disciplina?: string;
  iniciativa?: string;
  responsabilidade?: string;
  metas?: {
    ensino?: string; extras_cliente?: string; producao_intelectual?: string;
    pesquisa?: string; extensao?: string; administrativa?: string;
  };
  parecer_chefia?: string;
  parecer_tutor?: string;
  endossos?: { data?: string; docente?: string; tutor?: string; chefia?: string };
  observacoes?: { texto?: string; responsavel?: string; data?: string };
}

interface Props {
  value: AvaliacaoDocente;
  onChange: (v: AvaliacaoDocente) => void;
}

const ACOMP = [
  { v: "1_sem", l: "1º sem" }, { v: "2_sem", l: "2º sem" },
  { v: "3_sem", l: "3º sem" }, { v: "4_sem", l: "4º sem" },
  { v: "opcional", l: "Opcional" },
];

export const AvaliacaoDocenteForm = ({ value, onChange }: Props) => {
  const v = value || {};
  const set = (patch: Partial<AvaliacaoDocente>) => onChange({ ...v, ...patch });
  const setNested = <K extends keyof AvaliacaoDocente>(key: K, patch: any) =>
    set({ [key]: { ...(v[key] as any), ...patch } } as any);

  const acomp = v.docente?.acompanhamento || [];
  const toggleAcomp = (val: string) => {
    const next = acomp.includes(val) ? acomp.filter(a => a !== val) : [...acomp, val];
    setNested("docente", { acompanhamento: next });
  };

  const Radio = ({ name, val, onValChange, options }: { name: string; val?: string; onValChange: (s: string) => void; options: { v: string; l: string }[] }) => (
    <RadioGroup value={val || ""} onValueChange={onValChange} className="space-y-2">
      {options.map(o => (
        <div key={o.v} className="flex items-start gap-2">
          <RadioGroupItem value={o.v} id={`${name}-${o.v}`} className="mt-1" />
          <Label htmlFor={`${name}-${o.v}`} className="font-normal leading-snug">{o.l}</Label>
        </div>
      ))}
    </RadioGroup>
  );

  return (
    <Accordion type="multiple" defaultValue={["ident"]} className="w-full">
      <AccordionItem value="ident">
        <AccordionTrigger>1. Identificação do docente</AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome</Label><Input value={v.docente?.nome || ""} onChange={e => setNested("docente", { nome: e.target.value })} /></div>
            <div><Label>Matrícula</Label><Input value={v.docente?.matricula || ""} onChange={e => setNested("docente", { matricula: e.target.value })} /></div>
            <div><Label>E-mail</Label><Input value={v.docente?.email || ""} onChange={e => setNested("docente", { email: e.target.value })} /></div>
            <div><Label>Centro</Label><Input value={v.docente?.centro || ""} onChange={e => setNested("docente", { centro: e.target.value })} /></div>
            <div><Label>Departamento</Label><Input value={v.docente?.departamento || ""} onChange={e => setNested("docente", { departamento: e.target.value })} /></div>
            <div><Label>Data de entrada em exercício</Label><Input type="date" value={v.docente?.data_entrada || ""} onChange={e => setNested("docente", { data_entrada: e.target.value })} /></div>
            <div className="col-span-2">
              <Label>Acompanhamento</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {ACOMP.map(o => (
                  <label key={o.v} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={acomp.includes(o.v)} onCheckedChange={() => toggleAcomp(o.v)} />
                    {o.l}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="tutor">
        <AccordionTrigger>2. Identificação do Tutor</AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome</Label><Input value={v.tutor?.nome || ""} onChange={e => setNested("tutor", { nome: e.target.value })} /></div>
            <div><Label>Matrícula</Label><Input value={v.tutor?.matricula || ""} onChange={e => setNested("tutor", { matricula: e.target.value })} /></div>
            <div><Label>Fone para contato</Label><Input value={v.tutor?.fone || ""} onChange={e => setNested("tutor", { fone: e.target.value })} /></div>
            <div><Label>E-mail</Label><Input value={v.tutor?.email || ""} onChange={e => setNested("tutor", { email: e.target.value })} /></div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="criterios">
        <AccordionTrigger>Critérios de desempenho</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-5">
            <div>
              <p className="font-medium mb-2">1 – Assiduidade — Frequência ao trabalho</p>
              <Radio name="freq" val={v.assiduidade?.frequencia} onValChange={s => setNested("assiduidade", { frequencia: s })} options={[
                { v: "ocasional", l: "Ocasionalmente, falta sem justificativa." },
                { v: "nao_falta", l: "Não falta sem justificativa." },
                { v: "frequente", l: "Falta frequentemente sem justificativa." },
              ]} />
            </div>
            <div>
              <p className="font-medium mb-2">Permanência no trabalho</p>
              <Radio name="perm" val={v.assiduidade?.permanencia} onValChange={s => setNested("assiduidade", { permanencia: s })} options={[
                { v: "dificuldade", l: "Tem dificuldade em permanecer. É comum ausentar-se e não retornar." },
                { v: "irregular", l: "Permanência irregular. Ausenta-se mas normalmente retorna." },
                { v: "integral", l: "Permanece integralmente. Não se ausenta sem avisar." },
              ]} />
            </div>
            <div>
              <p className="font-medium mb-2">2 – Disciplina</p>
              <Radio name="disc" val={v.disciplina} onValChange={s => set({ disciplina: s })} options={[
                { v: "pouco_caso", l: "Não gosta de receber ordens e demonstra pouco caso com as normas." },
                { v: "preocupa", l: "Preocupa-se em agir de acordo com as normas disciplinares." },
                { v: "aceita", l: "Aceita orientações, mas às vezes precisa verificação." },
              ]} />
            </div>
            <div>
              <p className="font-medium mb-2">3 – Iniciativa</p>
              <Radio name="ini" val={v.iniciativa} onValChange={s => set({ iniciativa: s })} options={[
                { v: "busca_orient", l: "Busca orientação; não investe em situações novas sem solicitação." },
                { v: "habilidade", l: "Desenvolve-se com habilidade; encaminha corretamente assuntos fora da alçada." },
                { v: "omite", l: "Omite-se em tomar medidas novas diante de problemas." },
              ]} />
            </div>
            <div>
              <p className="font-medium mb-2">4 – Responsabilidade</p>
              <Radio name="resp" val={v.responsabilidade} onValChange={s => set({ responsabilidade: s })} options={[
                { v: "supervisionado", l: "Pode-se contar com o profissional desde que supervisionado." },
                { v: "lembrado", l: "Conhece responsabilidades, mas às vezes precisa ser lembrado." },
                { v: "fiel", l: "É fiel aos compromissos e assume as obrigações do trabalho." },
              ]} />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="metas">
        <AccordionTrigger>5. Consecução de objetivos e metas</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div><Label>5.1 Atividades de ensino (graduação e pós)</Label><Textarea rows={3} value={v.metas?.ensino || ""} onChange={e => setNested("metas", { ensino: e.target.value })} /></div>
            <div><Label>5.2 Atividades extras no cliente alocado</Label><Textarea rows={3} value={v.metas?.extras_cliente || ""} onChange={e => setNested("metas", { extras_cliente: e.target.value })} /></div>
            <div><Label>5.3 Produção intelectual</Label><Textarea rows={3} value={v.metas?.producao_intelectual || ""} onChange={e => setNested("metas", { producao_intelectual: e.target.value })} /></div>
            <div><Label>5.4 Pesquisa</Label><Textarea rows={3} value={v.metas?.pesquisa || ""} onChange={e => setNested("metas", { pesquisa: e.target.value })} /></div>
            <div><Label>5.5 Extensão</Label><Textarea rows={3} value={v.metas?.extensao || ""} onChange={e => setNested("metas", { extensao: e.target.value })} /></div>
            <div><Label>5.6 Contribuição administrativa</Label><Textarea rows={3} value={v.metas?.administrativa || ""} onChange={e => setNested("metas", { administrativa: e.target.value })} /></div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="pareceres">
        <AccordionTrigger>Pareceres</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div><Label>Parecer da chefia imediata</Label><Textarea rows={4} value={v.parecer_chefia || ""} onChange={e => set({ parecer_chefia: e.target.value })} /></div>
            <div><Label>Parecer do tutor</Label><Textarea rows={4} value={v.parecer_tutor || ""} onChange={e => set({ parecer_tutor: e.target.value })} /></div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="endossos">
        <AccordionTrigger>Endossos</AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data</Label><Input type="date" value={v.endossos?.data || ""} onChange={e => setNested("endossos", { data: e.target.value })} /></div>
            <div><Label>Docente (nome e matrícula)</Label><Input value={v.endossos?.docente || ""} onChange={e => setNested("endossos", { docente: e.target.value })} /></div>
            <div><Label>Tutor (nome e matrícula)</Label><Input value={v.endossos?.tutor || ""} onChange={e => setNested("endossos", { tutor: e.target.value })} /></div>
            <div><Label>Chefia Imediata (nome e matrícula)</Label><Input value={v.endossos?.chefia || ""} onChange={e => setNested("endossos", { chefia: e.target.value })} /></div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="obs">
        <AccordionTrigger>Observações</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div><Label>Observações</Label><Textarea rows={4} value={v.observacoes?.texto || ""} onChange={e => setNested("observacoes", { texto: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Responsável pelas observações</Label><Input value={v.observacoes?.responsavel || ""} onChange={e => setNested("observacoes", { responsavel: e.target.value })} /></div>
              <div><Label>Data da observação</Label><Input type="date" value={v.observacoes?.data || ""} onChange={e => setNested("observacoes", { data: e.target.value })} /></div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};