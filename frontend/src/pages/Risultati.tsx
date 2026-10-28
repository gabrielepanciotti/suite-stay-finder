import { useEffect, useMemo, useState } from "react";
import { ListFilter } from "lucide-react";
import {
  Badge,
  Button,
  Callout,
  DataTable,
  EmptyState,
  PageHeader,
  SearchBar,
  Skeleton,
} from "@suite/design-system";
import type { Column } from "@suite/design-system";
import type { Stay } from "../lib/api";
import { formatPrice, kindLabels, matchesText } from "../lib/stays";

interface RisultatiProps {
  stays: Stay[];
  loading: boolean;
  error: string | null;
  hasSearch: boolean;
  onRetry: () => void;
  onNewSearch: () => void;
}

const columns: Column<Stay>[] = [
  { key: "name", header: "Nome", sortable: true, accessor: (stay) => stay.name },
  {
    key: "location",
    header: "Località",
    sortable: true,
    accessor: (stay) => stay.location,
  },
  {
    key: "kind",
    header: "Tipo",
    sortable: true,
    accessor: (stay) => kindLabels[stay.kind],
    render: (stay) => <Badge state="info">{kindLabels[stay.kind]}</Badge>,
  },
  {
    key: "price",
    header: "Prezzo/notte",
    sortable: true,
    accessor: (stay) => Number(stay.price_per_night ?? Number.MAX_SAFE_INTEGER),
    render: formatPrice,
  },
  {
    key: "rating",
    header: "Valutazione",
    sortable: true,
    accessor: (stay) => stay.rating ?? 0,
    render: (stay) =>
      stay.rating == null ? "—" : `${stay.rating.toLocaleString("it-IT")}/5`,
  },
  {
    key: "source",
    header: "Fonte",
    accessor: (stay) => stay.url ?? "",
    render: (stay) => stay.url ? (
      <a
        className={
          "inline-flex min-h-11 items-center gap-1 text-info underline " +
          "underline-offset-4"
        }
        href={stay.url}
        target="_blank"
        rel="noreferrer"
      >
        Apri fonte
      </a>
    ) : "—",
  },
];

function ResultCards({ stays }: { stays: Stay[] }) {
  return (
    <div className="grid gap-3 md:hidden">
      {stays.map((stay) => (
        <article key={stay.id} className="rounded-card border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-semibold text-text">{stay.name}</h2>
            <Badge state="info">{formatPrice(stay)}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            {stay.location} · {kindLabels[stay.kind]}
          </p>
          <p className="mt-3 text-sm">
            Valutazione: {stay.rating == null ? "—" : `${stay.rating.toLocaleString("it-IT")}/5`}
          </p>
          {stay.url && (
            <a
              className={
                "mt-3 inline-flex min-h-11 items-center gap-1 text-info " +
                "underline underline-offset-4"
              }
              href={stay.url}
              target="_blank"
              rel="noreferrer"
            >
              Apri fonte
            </a>
          )}
        </article>
      ))}
    </div>
  );
}

function ResultsContent({
  stays,
  loading,
  error,
  hasSearch,
  onRetry,
  onNewSearch,
}: RisultatiProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }
  if (error) {
    return (
      <Callout variant="danger" title="Impossibile completare la ricerca sulle fonti selezionate">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>{error}</span>
          <Button variant="secondary" onClick={onRetry}>Riprova</Button>
        </div>
      </Callout>
    );
  }
  if (!hasSearch) {
    return (
      <EmptyState
        icon={<ListFilter aria-hidden />}
        title="Avvia una ricerca"
        description="Imposta i criteri per trovare gli alloggi disponibili."
        action={<Button onClick={onNewSearch}>Avvia ricerca</Button>}
      />
    );
  }
  if (stays.length === 0) {
    return (
      <EmptyState
        icon={<ListFilter aria-hidden />}
        title="Nessun risultato trovato"
        description="Allarga l'intervallo di prezzo o modifica le date"
        action={<Button onClick={onNewSearch}>Modifica criteri</Button>}
      />
    );
  }
  return (
    <>
      <div className="hidden md:block">
        <DataTable columns={columns} data={stays} rowKey={(stay) => String(stay.id)} />
      </div>
      <ResultCards stays={stays} />
    </>
  );
}

export function Risultati(props: RisultatiProps) {
  const [query, setQuery] = useState(
    () => new URLSearchParams(window.location.search).get("q") || "",
  );
  const filtered = useMemo(
    () => props.stays.filter((stay) => matchesText(stay, query)),
    [props.stays, query],
  );
  useEffect(() => {
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [query]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        icon={<ListFilter aria-hidden />}
        title="Risultati"
        subtitle="Confronta gli alloggi che rispettano i criteri della ricerca."
        actions={
          <Button variant="secondary" onClick={props.onNewSearch}>Nuova ricerca</Button>
        }
      />
      <SearchBar
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filtra per nome, località o tipo"
        aria-label="Filtra risultati"
        className="min-h-11"
      />
      <ResultsContent {...props} stays={filtered} />
    </div>
  );
}
