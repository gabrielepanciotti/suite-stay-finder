import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import {
  Button,
  Callout,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  Field,
  Input,
  PageHeader,
  SearchBar,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Skeleton,
  Textarea,
} from "@suite/design-system";
import type { Column } from "@suite/design-system";
import {
  createStay,
  deleteStay,
  listStays,
  updateStay,
  type Stay,
  type StayCreate,
  type StayKind,
} from "../lib/api";
import { formatPrice, kindLabels, kindOptions, matchesText } from "../lib/stays";

const initialForm: StayCreate = {
  name: "",
  location: "",
  kind: "hotel",
  currency: "EUR",
  source: "manual",
};

interface StayFormProps {
  value: StayCreate;
  onChange: (next: StayCreate) => void;
}

function StayForm({ value, onChange }: StayFormProps) {
  const set = <K extends keyof StayCreate>(key: K, next: StayCreate[K]) => {
    onChange({ ...value, [key]: next });
  };
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Nome" required htmlFor="stay-name">
        <Input
          id="stay-name"
          value={value.name}
          onChange={(event) => set("name", event.target.value)}
        />
      </Field>
      <Field label="Località" required htmlFor="stay-location">
        <Input
          id="stay-location"
          value={value.location}
          onChange={(event) => set("location", event.target.value)}
        />
      </Field>
      <Field label="Tipo" htmlFor="stay-kind">
        <Select
          value={value.kind}
          onValueChange={(kind) => set("kind", kind as StayKind)}
        >
          <SelectTrigger id="stay-kind"><SelectValue /></SelectTrigger>
          <SelectContent>
            {kindOptions.map(([id, label]) => (
              <SelectItem key={id} value={id}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Prezzo a notte" htmlFor="stay-price">
        <Input
          id="stay-price"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={value.price_per_night ?? ""}
          onChange={(event) =>
            set("price_per_night", event.target.value ? Number(event.target.value) : null)
          }
        />
      </Field>
      <Field label="Valutazione (0–5)" htmlFor="stay-rating">
        <Input
          id="stay-rating"
          type="number"
          min="0"
          max="5"
          step="0.1"
          inputMode="decimal"
          value={value.rating ?? ""}
          onChange={(event) =>
            set("rating", event.target.value ? Number(event.target.value) : null)
          }
        />
      </Field>
      <Field label="Link alla fonte" htmlFor="stay-url">
        <Input
          id="stay-url"
          type="url"
          value={value.url ?? ""}
          onChange={(event) => set("url", event.target.value || null)}
        />
      </Field>
      <Field label="Note" htmlFor="stay-notes" className="sm:col-span-2">
        <Textarea
          id="stay-notes"
          value={value.notes ?? ""}
          onChange={(event) => set("notes", event.target.value || null)}
        />
      </Field>
    </div>
  );
}

function getColumns(
  editNote: (stay: Stay) => void,
  requestRemove: (stay: Stay) => void,
): Column<Stay>[] {
  return [
    { key: "name", header: "Nome", sortable: true, accessor: (stay) => stay.name },
    {
      key: "location",
      header: "Località",
      sortable: true,
      accessor: (stay) => stay.location,
    },
    { key: "kind", header: "Tipo", accessor: (stay) => kindLabels[stay.kind] },
    {
      key: "price",
      header: "Prezzo/notte",
      sortable: true,
      accessor: (stay) => Number(stay.price_per_night ?? Number.MAX_SAFE_INTEGER),
      render: formatPrice,
    },
    {
      key: "notes",
      header: "Note",
      accessor: (stay) => stay.notes ?? "—",
      render: (stay) => (
        <span className="block max-w-48 whitespace-normal text-muted">
          {stay.notes || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Azioni",
      actions: true,
      accessor: () => "",
      render: (stay) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" aria-label={`Azioni per ${stay.name}`}>
              Azioni
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => editNote(stay)}>
              Modifica nota
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-danger"
              onSelect={() => requestRemove(stay)}
            >
              Rimuovi
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

interface SavedDialogsProps {
  open: boolean;
  form: StayCreate;
  saving: boolean;
  noteStay: Stay | null;
  note: string;
  removeStay: Stay | null;
  setOpen: (open: boolean) => void;
  setForm: (form: StayCreate) => void;
  setNote: (note: string) => void;
  closeNote: () => void;
  closeRemove: () => void;
  save: (event: React.FormEvent) => void;
  saveNote: () => void;
  remove: () => void;
}

function SavedDialogs(props: SavedDialogsProps) {
  return (
    <>
      <Sheet open={props.open} onOpenChange={props.setOpen}>
        <SheetContent
          side="right"
          className="w-[min(100vw,38rem)] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Aggiungi alloggio</SheetTitle>
            <SheetDescription>
              Inserisci i dati disponibili della struttura.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={props.save} className="flex flex-1 flex-col gap-5">
            <StayForm value={props.form} onChange={props.setForm} />
            <SheetFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => props.setOpen(false)}
              >
                Annulla
              </Button>
              <Button type="submit" loading={props.saving}>Salva alloggio</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      <Dialog
        open={props.noteStay !== null}
        onOpenChange={(open) => !open && props.closeNote()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica nota</DialogTitle>
            <DialogDescription>
              Aggiungi informazioni utili su {props.noteStay?.name}.
            </DialogDescription>
          </DialogHeader>
          <Field label="Nota" htmlFor="note">
            <Textarea
              id="note"
              value={props.note}
              onChange={(event) => props.setNote(event.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button variant="secondary" onClick={props.closeNote}>Annulla</Button>
            <Button onClick={props.saveNote}>Salva nota</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={props.removeStay !== null}
        onOpenChange={(open) => !open && props.closeRemove()}
      >
        <DialogContent state="danger">
          <DialogHeader>
            <DialogTitle>Rimuovere l’alloggio?</DialogTitle>
            <DialogDescription>
              {props.removeStay
                ? `Rimuoverai definitivamente “${props.removeStay.name}” dall’archivio.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={props.closeRemove}>Annulla</Button>
            <Button variant="destructive" onClick={props.remove}>
              Rimuovi alloggio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Salvati({
  onAnnounce,
}: {
  onAnnounce: (message: string) => void;
}) {
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<StayCreate>(initialForm);
  const [saving, setSaving] = useState(false);
  const [noteStay, setNoteStay] = useState<Stay | null>(null);
  const [note, setNote] = useState("");
  const [removeStay, setRemoveStay] = useState<Stay | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try { setStays(await listStays()); }
    catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossibile caricare gli alloggi.",
      );
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const stay = await createStay(form);
      setStays((current) => [...current, stay]);
      setOpen(false);
      setForm(initialForm);
      onAnnounce("Elemento salvato");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossibile aggiungere l'alloggio.",
      );
    } finally { setSaving(false); }
  };
  const saveNote = async () => {
    if (!noteStay) return;
    try {
      const updated = await updateStay(noteStay.id, { notes: note });
      setStays((current) =>
        current.map((stay) => stay.id === updated.id ? updated : stay),
      );
      setNoteStay(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Impossibile aggiornare la nota.");
    }
  };
  const remove = async () => {
    if (!removeStay) return;
    try {
      await deleteStay(removeStay.id);
      setStays((current) => current.filter((stay) => stay.id !== removeStay.id));
      setRemoveStay(null);
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Impossibile rimuovere l'alloggio.",
      );
    }
  };
  const editNote = (stay: Stay) => {
    setNoteStay(stay);
    setNote(stay.notes ?? "");
  };
  const filtered = useMemo(
    () => stays.filter((stay) => matchesText(stay, query)),
    [stays, query],
  );
  const columns = getColumns(editNote, setRemoveStay);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        icon={<Star aria-hidden />}
        title="Alloggi salvati"
        subtitle="Gestisci gli alloggi archiviati e le loro note."
        actions={<Button onClick={() => setOpen(true)}>Aggiungi alloggio</Button>}
      />
      {error && (
        <Callout variant="danger" title="Operazione non completata">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="secondary" onClick={() => void load()}>Riprova</Button>
          </div>
        </Callout>
      )}
      <SearchBar
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filtra per nome, località o tipo"
        aria-label="Filtra alloggi salvati"
        className="min-h-11"
      />
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Star aria-hidden />}
          title="Nessun elemento salvato"
          description="Salva i risultati migliori durante una ricerca per ritrovarli qui"
          action={
            <Button onClick={() => { window.location.hash = "cerca"; }}>
              Nuova ricerca
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} data={filtered} rowKey={(stay) => String(stay.id)} />
      )}
      <SavedDialogs
        open={open}
        form={form}
        saving={saving}
        noteStay={noteStay}
        note={note}
        removeStay={removeStay}
        setOpen={setOpen}
        setForm={setForm}
        setNote={setNote}
        closeNote={() => setNoteStay(null)}
        closeRemove={() => setRemoveStay(null)}
        save={save}
        saveNote={() => void saveNote()}
        remove={() => void remove()}
      />
    </div>
  );
}
