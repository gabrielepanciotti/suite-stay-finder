import { useEffect, useState, type ReactNode } from "react";
import {
  CircleAlert,
  LayoutGrid,
  ListFilter,
  Search,
  Settings,
  Star,
} from "lucide-react";
import {
  AppShell,
  Button,
  EmptyState,
  Skeleton,
  VistaProvider,
  useVista,
} from "@suite/design-system";
import { Cerca, type SearchCriteria } from "./pages/Cerca";
import { Impostazioni } from "./pages/Impostazioni";
import { Risultati } from "./pages/Risultati";
import { Salvati } from "./pages/Salvati";
import { listStays, type Stay } from "./lib/api";
import { vistaFetcher } from "./lib/vista";

const icons: Record<string, ReactNode> = {
  cerca: <Search aria-hidden />,
  risultati: <ListFilter aria-hidden />,
  salvati: <Star aria-hidden />,
  impostazioni: <Settings aria-hidden />,
};

function isMobileViewport() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches
  );
}

function useActiveSection(
  sections: ReturnType<typeof useVista>["sezioniVisibili"],
) {
  const [section, setSection] = useState(
    () => window.location.hash.slice(1) || "cerca",
  );
  useEffect(() => {
    const sync = () => setSection(window.location.hash.slice(1) || "cerca");
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const active = sections.some((item) => item.id === section)
    ? section
    : "cerca";
  useEffect(() => {
    if (window.location.hash !== `#${active}`) window.location.hash = active;
  }, [active]);
  return active;
}

function useStaySearch() {
  const [results, setResults] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCriteria, setLastCriteria] = useState<SearchCriteria | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const run = async (criteria: SearchCriteria) => {
    setLastCriteria(criteria);
    setLoading(true);
    setError(null);
    try {
      const stays = await listStays({
        location: criteria.location || undefined,
        kind: criteria.kind || undefined,
      });
      const maximum = criteria.maxPrice === "" ? null : Number(criteria.maxPrice);
      const matchingStays =
        maximum == null
          ? stays
          : stays.filter(
              (stay) =>
                stay.price_per_night == null ||
                Number(stay.price_per_night) <= maximum,
            );
      setResults(matchingStays);
      setAnnouncement(`${matchingStays.length} risultati trovati`);
      window.location.hash = "risultati";
    } catch (searchError) {
      setResults([]);
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Impossibile completare la ricerca sulle fonti selezionate",
      );
      window.location.hash = "risultati";
    } finally {
      setLoading(false);
    }
  };
  const retry = () => {
    if (lastCriteria) void run(lastCriteria);
  };

  return {
    results,
    loading,
    error,
    lastCriteria,
    announcement,
    setAnnouncement,
    run,
    retry,
  };
}

function ShellLoading({ defaultCollapsed }: { defaultCollapsed: boolean }) {
  return (
    <AppShell defaultCollapsed={defaultCollapsed}>
      <AppShell.Content className="max-md:pl-12">
        <div className="space-y-3">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppShell.Content>
    </AppShell>
  );
}

interface ShellErrorProps {
  defaultCollapsed: boolean;
  onRetry: () => void;
}

function ShellError({ defaultCollapsed, onRetry }: ShellErrorProps) {
  return (
    <AppShell defaultCollapsed={defaultCollapsed}>
      <AppShell.Content className="max-md:pl-12">
        <EmptyState
          icon={<CircleAlert aria-hidden />}
          title="Impossibile caricare la vista"
          description="Non è stato possibile recuperare le sezioni disponibili."
          action={<Button onClick={onRetry}>Riprova</Button>}
        />
      </AppShell.Content>
    </AppShell>
  );
}

interface FinderSidebarProps {
  active: string;
  sections: ReturnType<typeof useVista>["sezioniVisibili"];
}

function FinderSidebar({ active, sections }: FinderSidebarProps) {
  return (
    <AppShell.Sidebar
      settingsItem={
        <AppShell.Sidebar.Item
          icon={icons.impostazioni}
          label="Impostazioni"
          active={active === "impostazioni"}
          onClick={() => {
            window.location.hash = "impostazioni";
          }}
        />
      }
    >
      {sections
        .filter((item) => item.id !== "impostazioni")
        .slice(0, 7)
        .map((item) => (
          <AppShell.Sidebar.Item
            key={item.id}
            icon={icons[item.id] ?? <LayoutGrid aria-hidden />}
            label={item.titolo}
            active={active === item.id}
            onClick={() => {
              window.location.hash = item.id;
            }}
          />
        ))}
    </AppShell.Sidebar>
  );
}

function StayFinderShell() {
  const { sezioniVisibili, stato, etichetta, ricarica } = useVista();
  const [defaultCollapsed] = useState(isMobileViewport);
  const active = useActiveSection(sezioniVisibili);
  const search = useStaySearch();
  const goToSearch = () => {
    window.location.hash = "cerca";
  };

  if (stato === "loading") {
    return <ShellLoading defaultCollapsed={defaultCollapsed} />;
  }
  if (stato === "error") {
    return (
      <ShellError
        defaultCollapsed={defaultCollapsed}
        onRetry={() => void ricarica()}
      />
    );
  }

  const pages: Record<string, ReactNode> = {
    cerca: <Cerca onSearch={(criteria) => void search.run(criteria)} />,
    risultati: (
      <Risultati
        stays={search.results}
        loading={search.loading}
        error={search.error}
        hasSearch={search.lastCriteria !== null}
        onRetry={search.retry}
        onNewSearch={goToSearch}
      />
    ),
    salvati: <Salvati onAnnounce={search.setAnnouncement} />,
    impostazioni: <Impostazioni />,
  };

  return (
    <AppShell defaultCollapsed={defaultCollapsed}>
      <FinderSidebar active={active} sections={sezioniVisibili} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppShell.Topbar>
          <span className="text-sm font-medium text-text">
            StayFinder · {etichetta}
          </span>
        </AppShell.Topbar>
        <AppShell.Content className="max-md:pl-12 p-4 sm:p-6">
          <p className="sr-only" aria-live="polite">
            {search.announcement}
          </p>
          {pages[active]}
        </AppShell.Content>
      </div>
    </AppShell>
  );
}

export default function App() {
  return (
    <VistaProvider fetcher={vistaFetcher}>
      <StayFinderShell />
    </VistaProvider>
  );
}
