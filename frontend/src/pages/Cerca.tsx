import { useState } from "react";
import { Search } from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@suite/design-system";
import type { StayKind } from "../lib/api";
import { kindLabels, kindOptions } from "../lib/stays";

export interface SearchCriteria {
  location: string;
  kind: StayKind | "";
  maxPrice: string;
}

export const emptyCriteria: SearchCriteria = {
  location: "",
  kind: "",
  maxPrice: "",
};

const storageKey = "stayfinder:last-criteria";

export function readLastCriteria(): SearchCriteria | null {
  try {
    return JSON.parse(
      localStorage.getItem(storageKey) || "null",
    ) as SearchCriteria | null;
  } catch {
    return null;
  }
}

function RecentCriteria({ criteria }: { criteria: SearchCriteria }) {
  return (
    <Card>
      <CardHeader><CardTitle>Ultimi criteri usati</CardTitle></CardHeader>
      <CardBody>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div><dt className="text-muted">Località</dt><dd>{criteria.location || "Tutte"}</dd></div>
          <div>
            <dt className="text-muted">Tipo</dt>
            <dd>{criteria.kind ? kindLabels[criteria.kind] : "Tutti"}</dd>
          </div>
          <div>
            <dt className="text-muted">Prezzo massimo</dt>
            <dd>{criteria.maxPrice ? `${criteria.maxPrice} € a notte` : "Nessun limite"}</dd>
          </div>
        </dl>
      </CardBody>
    </Card>
  );
}

interface CriteriaFormProps {
  criteria: SearchCriteria;
  onChange: (criteria: SearchCriteria) => void;
  onSubmit: (event: React.FormEvent) => void;
}

function CriteriaForm({ criteria, onChange, onSubmit }: CriteriaFormProps) {
  return (
    <form onSubmit={onSubmit} className="rounded-card border border-border bg-surface p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Località"
          htmlFor="location"
          hint="Corrispondenza esatta con la località archiviata."
        >
          <Input
            id="location"
            value={criteria.location}
            onChange={(event) => onChange({ ...criteria, location: event.target.value })}
            placeholder="Es. Roma"
          />
        </Field>
        <Field label="Tipo di alloggio" htmlFor="kind">
          <Select
            value={criteria.kind}
            onValueChange={(kind) => onChange({ ...criteria, kind: kind as StayKind })}
          >
            <SelectTrigger id="kind"><SelectValue placeholder="Tutti i tipi" /></SelectTrigger>
            <SelectContent>
              {kindOptions.map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Prezzo massimo a notte" htmlFor="maxPrice">
          <Input
            id="maxPrice"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={criteria.maxPrice}
            onChange={(event) => onChange({ ...criteria, maxPrice: event.target.value })}
            placeholder="Es. 150"
          />
        </Field>
      </div>
      <div className="mt-6 flex justify-end">
        <Button type="submit" className="min-h-11">Avvia ricerca</Button>
      </div>
    </form>
  );
}

export function Cerca({ onSearch }: { onSearch: (criteria: SearchCriteria) => void }) {
  const [criteria, setCriteria] = useState<SearchCriteria>(readLastCriteria() ?? emptyCriteria);
  const last = readLastCriteria();
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    localStorage.setItem(storageKey, JSON.stringify(criteria));
    onSearch(criteria);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        icon={<Search aria-hidden />}
        title="Cerca alloggi"
        subtitle="Imposta i criteri per trovare le strutture già archiviate."
      />
      <CriteriaForm criteria={criteria} onChange={setCriteria} onSubmit={submit} />
      {last ? <RecentCriteria criteria={last} /> : (
        <EmptyState
          icon={<Search aria-hidden />}
          title="Nessuna ricerca recente"
          description="Imposta i parametri qui sopra per interrogare le fonti disponibili"
          action={
            <Button onClick={() => document.getElementById("location")?.focus()}>
              Avvia ricerca
            </Button>
          }
        />
      )}
    </div>
  );
}
