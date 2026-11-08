import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import CompanySettings from "@/components/settings/CompanySettings";
import DocumentsSettings from "@/components/settings/DocumentsSettings";
import TeamSettings from "@/components/settings/TeamSettings";
import PlanSettings from "@/components/settings/PlanSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenant } from "@/lib/TenantContext";
import { Settings } from "lucide-react";

export default function Configuracoes() {
  const { can } = useTenant();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "empresa";

  if (!can.manageTeam) {
    return (
      <div className="surface p-8 max-w-lg mx-auto text-center">
        <span className="w-12 h-12 rounded-2xl bg-muted grid place-items-center mx-auto text-muted-foreground">
          <Settings className="w-5 h-5" />
        </span>
        <h1 className="mt-4 font-heading font-bold text-lg">Acesso restrito</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          As configurações da empresa são exclusivas dos administradores.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Configurações"
        subtitle="Dados da empresa, documentos emitidos, equipe e assinatura."
      />

      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value })}>
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="equipe">Equipe</TabsTrigger>
          <TabsTrigger value="plano">Plano</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa"><CompanySettings /></TabsContent>
        <TabsContent value="documentos"><DocumentsSettings /></TabsContent>
        <TabsContent value="equipe"><TeamSettings /></TabsContent>
        <TabsContent value="plano"><PlanSettings /></TabsContent>
      </Tabs>
    </div>
  );
}
