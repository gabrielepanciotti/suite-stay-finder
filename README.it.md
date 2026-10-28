# StayFinder

StayFinder è un'applicazione FastAPI e React per conservare un catalogo leggero e ricercabile di alloggi per viaggi. Oggi offre un'API CRUD per le strutture; la ricerca di disponibilità e le integrazioni con provider di prenotazione non fanno parte di questa release.

## Avvio rapido

```bash
git clone <url-del-tuo-fork-o-clone> stayfinder
cd stayfinder
cp .env.example .env
bash deploy/prebuild.sh
bash deploy/compose.sh up --build
```

Il backend è disponibile su `http://127.0.0.1:10021` e il frontend su `http://127.0.0.1:3355`. Sono richiesti Python 3.13, Node.js 20, Docker Compose e il framework Life compagno (`LIFE_FRAMEWORK_DIR`).

Per la configurazione, i test e i dettagli tecnici consulta il [README in inglese](README.md).
