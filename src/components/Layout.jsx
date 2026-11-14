import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, MonitorSmartphone, FileText, Wallet,
  Settings, ShieldCheck, Menu, LogOut, ChevronDown, Bell, Plus,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useTenant } from "@/lib/TenantContext";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import BrandMark from "@/components/BrandMark";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "technician", "attendant"] },
  { to: "/ordens", label: "Ordens de Serviço", icon: FileText, roles: ["admin", "technician", "attendant"] },
  { to: "/clientes", label: "Clientes", icon: Users, roles: ["admin", "technician", "attendant"] },
  { to: "/equipamentos", label: "Equipamentos", icon: MonitorSmartphone, roles: ["admin", "technician", "attendant"] },
  { to: "/financeiro", label: "Financeiro", icon: Wallet, roles: ["admin"] },
  { to: "/configuracoes", label: "Configurações", icon: Settings, roles: ["admin"] },
];

function Brand({ company, compact = false }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-white/25 to-white/[0.06] font-heading text-[11px] font-extrabold tracking-[0.08em] text-white ring-1 ring-white/20 backdrop-blur">
        <BrandMark className="h-7 w-7 text-white" />
      </span>
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className="block font-heading text-[15px] font-extrabold tracking-[-0.02em] text-white">OS PRO</span>
          <span className="mt-0.5 block max-w-[160px] truncate text-[10.5px] text-white/45">
            {company?.trade_name || company?.name || "Assistência técnica"}
          </span>
        </span>
      )}
    </Link>
  );
}

function NavList({ role, isPlatformAdmin, onNavigate }) {
  const items = NAV.filter((item) => !role || item.roles.includes(role));

  const renderLink = (to, label, Icon, end = false) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
          isActive
            ? "nav-active text-white"
            : "text-sidebar-foreground/75 hover:bg-white/[0.06] hover:text-white"
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[hsl(152_72%_52%)] transition-opacity",
              isActive ? "opacity-100" : "opacity-0"
            )}
            aria-hidden="true"
          />
          <Icon
            className={cn(
              "h-[18px] w-[18px] shrink-0 transition-colors",
              isActive ? "text-[hsl(152_72%_62%)]" : "text-white/45 group-hover:text-white/70"
            )}
          />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <nav className="relative flex-1 space-y-1 overflow-y-auto px-3 pb-4">
      <p className="px-3 pb-2 pt-4 text-[9.5px] font-bold uppercase tracking-[0.18em] text-white/30">Gestão</p>
      {items.map(({ to, label, icon: Icon }) => renderLink(to, label, Icon, to === "/"))}

      {isPlatformAdmin && (
        <>
          <p className="px-3 pb-2 pt-6 text-[9.5px] font-bold uppercase tracking-[0.18em] text-white/30">Plataforma</p>
          {renderLink("/plataforma", "Painel da plataforma", ShieldCheck)}
        </>
      )}
    </nav>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { company, account, role, isPlatformAdmin } = useTenant();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const initials = (user?.full_name || user?.email || "U").slice(0, 1).toUpperCase();
  const planLabel =
    account?.plan_name || (account?.status === "trial" ? "Período de teste" : "Sem plano ativo");
  const current = NAV.find((item) => item.to === location.pathname)?.label || "OS PRO";

  return (
    <div className="min-h-screen bg-background">
      <aside className="sidebar-shell fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col text-sidebar-foreground lg:flex">
        <div className="sidebar-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative px-5 pb-4 pt-6">
          <Brand company={company} />
        </div>

        <NavList role={role} isPlatformAdmin={isPlatformAdmin} />

        <div className="relative px-4 pb-4">
          <div className="rounded-2xl border border-white/[0.09] bg-white/[0.045] p-2 shadow-[0_12px_30px_-22px_rgba(0,0,0,0.9)]">
            <p className="px-2 pb-2 pt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">Acesso rápido</p>
            <Button
              asChild
              className="h-11 w-full justify-start gap-3 rounded-xl bg-white text-[13px] font-semibold text-primary shadow-[0_8px_20px_-14px_rgba(0,0,0,0.8)] transition-all hover:-translate-y-px hover:bg-white/95 active:translate-y-0"
            >
              <Link to="/ordens/nova">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10">
                  <Plus className="h-4 w-4" />
                </span>
                <span className="flex-1 text-left">Nova ordem de serviço</span>
                <span className="text-[10px] font-medium text-primary/45">＋</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative border-t border-white/[0.08] px-3 pb-4 pt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.045] p-2.5 text-left transition-all hover:border-white/[0.14] hover:bg-white/[0.075]">
                <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[hsl(152_70%_44%)] to-[hsl(174_70%_38%)] text-[12px] font-bold text-white shadow-inner ring-1 ring-white/20">
                  {initials}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[hsl(var(--sidebar))] bg-[hsl(152_70%_52%)]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-semibold text-white">{user?.full_name || "Usuário"}</span>
                  <span className="mt-1 block truncate text-[10.5px] text-white/45">{planLabel}</span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-white/40 transition-transform group-data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-[232px] rounded-xl">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-semibold">{user?.full_name || "Usuário"}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {role === "admin" && (
                <DropdownMenuItem asChild>
                  <Link to="/configuracoes">Configurações da empresa</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => logout(true)} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-[272px]">
        <header className="no-print sticky top-0 z-30 flex h-[68px] items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="-ml-1 rounded-xl p-2 text-foreground transition-colors hover:bg-muted lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="sidebar-shell flex w-[284px] flex-col border-sidebar-border p-0 text-sidebar-foreground">
              <div className="sidebar-grid pointer-events-none absolute inset-0" aria-hidden="true" />
              <div className="relative px-5 pb-4 pt-6">
                <Brand company={company} />
              </div>
              <NavList role={role} isPlatformAdmin={isPlatformAdmin} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex-1 lg:hidden">
            <Brand company={company} compact />
          </div>

          <div className="hidden min-w-0 flex-1 lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">OS PRO</p>
            <p className="truncate font-heading text-[13.5px] font-bold tracking-[-0.01em] text-foreground">{current}</p>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card px-3.5 py-1.5 text-[11.5px] text-muted-foreground xl:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(152_62%_42%)]" />
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="relative hidden h-9 w-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:grid"
                aria-label="Abrir notificações"
              >
                <Bell className="h-[18px] w-[18px]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="w-[min(360px,calc(100vw-2rem))] rounded-2xl border-border/80 p-0 shadow-xl">
              <div className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-foreground">Notificações</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Central de avisos do OS PRO</p>
                </div>
                <span className="rounded-full border border-border/70 bg-muted/60 px-2 py-1 text-[10px] font-medium text-muted-foreground">
                  Em breve
                </span>
              </div>
              <DropdownMenuSeparator />
              <div className="flex flex-col items-center px-6 py-8 text-center">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                  <Bell className="h-5 w-5" />
                </span>
                <p className="text-[13px] font-semibold text-foreground">Nenhuma notificação por enquanto</p>
                <p className="mt-1.5 max-w-[250px] text-[11.5px] leading-relaxed text-muted-foreground">
                  A central está pronta. Os avisos automáticos do sistema serão conectados em uma próxima etapa.
                </p>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
