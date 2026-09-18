"use client";

import {
  Building2,
  Clock,
  DollarSign,
  Download,
  Globe,
  Mail,
  Plus,
  PowerOff,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ColaboradorOrigin,
  downloadEmpresaDashboardExport,
  useCreateEmpresaDomain,
  useCreateEmpresaInvite,
  useDeactivateEmpresa,
  useEmpresaAdminAuth,
  useEmpresaDashboardColaboradores,
  useEmpresaDashboardOverview,
  useEmpresaDomains,
  useEmpresaInvites,
  useRequestEmpresaDomainConfirmation,
  useRevokeEmpresaDomain,
  useRevokeEmpresaInvite,
} from "@/features/empresa-admin";

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function originLabel(origin: ColaboradorOrigin): string {
  if (origin === "CONVITE") return "Convite";
  if (origin === "DOMINIO") return "Domínio";
  return "—";
}

function originBadgeVariant(
  origin: ColaboradorOrigin
): "info" | "secondary" | "neutral" {
  if (origin === "DOMINIO") return "info";
  if (origin === "CONVITE") return "secondary";
  return "neutral";
}

export default function EmpresaAdminDashboardPage() {
  const router = useRouter();
  const { logout } = useEmpresaAdminAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [domainValue, setDomainValue] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);

  const period = useMemo(
    () => ({ from: from || undefined, to: to || undefined }),
    [from, to]
  );

  const { data: overview, isLoading: isOverviewLoading } =
    useEmpresaDashboardOverview(period);
  const { data: colaboradores, isLoading: isColaboradoresLoading } =
    useEmpresaDashboardColaboradores(period);
  const { data: invites, isLoading: isInvitesLoading } = useEmpresaInvites();
  const { data: domains, isLoading: isDomainsLoading } = useEmpresaDomains();

  const createInvite = useCreateEmpresaInvite();
  const revokeInvite = useRevokeEmpresaInvite();
  const createDomain = useCreateEmpresaDomain();
  const revokeDomain = useRevokeEmpresaDomain();
  const requestDomainConfirmation = useRequestEmpresaDomainConfirmation();
  const deactivateEmpresa = useDeactivateEmpresa();

  const pendingInvites = (invites ?? []).filter(
    (invite) => invite.status === "PENDING"
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadEmpresaDashboardExport(period);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteEmail.trim()) return;
    await createInvite.mutateAsync(inviteEmail.trim());
    setInviteEmail("");
  };

  const handleCreateDomain = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!domainValue.trim()) return;
    await createDomain.mutateAsync(domainValue.trim());
    setDomainValue("");
  };

  // MW-26 — a Empresa some do ponto de vista deste Administrador (o próprio
  // EmpresaAdmin que chamou o endpoint deixa de existir), então o único
  // caminho depois é deslogar e voltar pro login — não há dado de dashboard
  // pra revalidar nesta tela.
  const handleDeactivate = async () => {
    await deactivateEmpresa.mutateAsync();
    setIsDeactivateOpen(false);
    await logout();
    router.push("/empresa-admin/login?deactivated=1");
  };

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard da Empresa"
        subtitle="Visão agregada dos Colaboradores vinculados"
        icon={Building2}
      >
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          Exportar período
        </Button>
        <AlertDialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
            >
              <PowerOff className="w-4 h-4 mr-2" />
              Desativar Empresa
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desativar Empresa</AlertDialogTitle>
              <AlertDialogDescription>
                Isso remove todos os Administradores e revoga os convites e
                domínios pendentes desta Empresa. Os Colaboradores continuam
                vinculados e seguem registrando e faturando horas
                normalmente — eles só serão avisados de que a Empresa não
                tem mais um Administrador ativo. Você pode reativar a
                Empresa depois pelo mesmo fluxo de Ativação.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeactivate}
                disabled={deactivateEmpresa.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Desativar Empresa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageHeader>

      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div className="space-y-1">
          <Label htmlFor="dashboard-from" className="text-xs">
            De
          </Label>
          <Input
            id="dashboard-from"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="dashboard-to" className="text-xs">
            Até
          </Label>
          <Input
            id="dashboard-to"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
          <TabsTrigger value="vinculos">
            Vínculos
            {pendingInvites.length > 0 && (
              <Badge variant="warning" className="ml-2">
                {pendingInvites.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {isOverviewLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-7 w-[60px]" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Colaboradores ativos
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {overview?.colaboradoresAtivos ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    vinculados à Empresa
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Horas no período
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(overview?.horasPeriodo ?? 0).toFixed(1)}h
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total faturado
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(overview?.totalFaturado ?? 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Convites pendentes
                  </CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {overview?.convitesPendentes ?? 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="colaboradores">
          <Card>
            <CardContent className="p-0">
              {isColaboradoresLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Vínculo</TableHead>
                      <TableHead className="text-right">Horas</TableHead>
                      <TableHead className="text-right">Projetos</TableHead>
                      <TableHead className="text-right">Faturado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(colaboradores ?? []).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {c.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={originBadgeVariant(c.origin)}>
                            {originLabel(c.origin)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {c.horas.toFixed(1)}h
                        </TableCell>
                        <TableCell className="text-right">
                          {c.projetos}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(c.faturado)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(colaboradores ?? []).length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground py-8"
                        >
                          Nenhum Colaborador vinculado ainda.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vinculos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Convites pendentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <form onSubmit={handleCreateInvite} className="flex gap-2">
                  <Input
                    placeholder="email@colaborador.com"
                    type="email"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={createInvite.isPending}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Convidar
                  </Button>
                </form>
                <div className="space-y-2">
                  {isInvitesLoading && <Skeleton className="h-10 w-full" />}
                  {(invites ?? []).map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div>
                        <div className="font-medium">{invite.email}</div>
                        <div className="text-xs text-muted-foreground">
                          {invite.status === "PENDING"
                            ? "Aguardando"
                            : invite.status === "LINKED"
                              ? "Vinculado"
                              : "Revogado"}
                        </div>
                      </div>
                      {invite.status === "PENDING" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Revogar convite de ${invite.email}`}
                          onClick={() => revokeInvite.mutate(invite.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {!isInvitesLoading && (invites ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhum convite criado ainda.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Domínios autorizados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <form onSubmit={handleCreateDomain} className="flex gap-2">
                  <Input
                    placeholder="dominio.com.br"
                    value={domainValue}
                    onChange={(event) => setDomainValue(event.target.value)}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={createDomain.isPending}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Adicionar
                  </Button>
                </form>
                <div className="space-y-2">
                  {isDomainsLoading && <Skeleton className="h-10 w-full" />}
                  {(domains ?? []).map((domain) => (
                    <div
                      key={domain.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div>
                        <div className="font-medium">{domain.domain}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            domain.status === "CONFIRMED"
                              ? "success"
                              : domain.status === "PENDING"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {domain.status === "CONFIRMED"
                            ? "Confirmado"
                            : domain.status === "PENDING"
                              ? "Aguardando confirmação"
                              : "Revogado"}
                        </Badge>
                        {domain.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={requestDomainConfirmation.isPending}
                            onClick={() =>
                              requestDomainConfirmation.mutate(domain.id)
                            }
                          >
                            Confirmar
                          </Button>
                        )}
                        {domain.status !== "REVOKED" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Revogar domínio ${domain.domain}`}
                            onClick={() => revokeDomain.mutate(domain.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!isDomainsLoading && (domains ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhum domínio autorizado ainda.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
