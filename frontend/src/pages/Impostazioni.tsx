import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  PageHeader,
} from "@suite/design-system";
import { Settings } from "lucide-react";

export function Impostazioni() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        icon={<Settings aria-hidden />}
        title="Impostazioni"
        subtitle="Consulta le informazioni e l’accesso al nodo StayFinder."
      />
      <Card>
        <CardHeader>
          <CardTitle>Informazioni del nodo</CardTitle>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-muted">Nodo</dt><dd>StayFinder</dd></div>
            <div>
              <dt className="text-muted">Dominio</dt>
              <dd>Ricerca di alloggi per i viaggi</dd>
            </div>
            <div>
              <dt className="text-muted">Stato</dt>
              <dd>Archivio e ricerca di strutture ricettive</dd>
            </div>
            <div>
              <dt className="text-muted">Scheda nodo</dt>
              <dd>
                <a
                  className={
                    "inline-flex min-h-11 items-center text-info underline " +
                    "underline-offset-4"
                  }
                  href="/overview"
                >
                  Apri overview
                </a>
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}
