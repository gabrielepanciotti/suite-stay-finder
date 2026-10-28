# Guida d'uso di StayFinder

## Cosa fa

StayFinder è l'archivio degli alloggi per i viaggi, nel cluster Travel della rete Life. Oggi salva e ritrova schede `Stay`
con nome, luogo, tipo (`hotel`, `apartment`, `hostel`, `bnb`, `camping`,
`other`), link, prezzo a notte, valuta (`EUR` per impostazione predefinita), coordinate, voto, note e fonte (`assisted`, `link`,
`manual`, `agent`). Non cerca da solo su siti esterni e non esegue scraping.

## Come si apre

L'interfaccia web mostra solo il titolo: non ci sono ancora schermate operative,
quindi oggi si usano le API.

- Sviluppo: backend `http://127.0.0.1:8000`, frontend `http://127.0.0.1:5173`.
  Il frontend inoltra le richieste `/api` al backend.

Per avviare in sviluppo:

```bash
cp .env.example .env
bash deploy/prebuild.sh
docker compose -f deploy/docker-compose.example.yml up -d --build
```

La salute si verifica con `GET /health`, che risponde `{"status":"ok",...}`.

## Casi d'uso passo per passo

1. Aggiungere un alloggio. La risposta ha stato `201` e contiene anche il nuovo `id`:

   ```bash
   curl -X POST http://127.0.0.1:8000/api/stays \
     -H 'Content-Type: application/json' \
     -d '{"name":"Hotel Centro","location":"Roma","kind":"hotel","url":"https://example.com/hotel","price_per_night":120,"currency":"EUR","source":"manual"}'
   ```

2. Elencare gli alloggi:

   ```bash
   curl http://127.0.0.1:8000/api/stays
   ```

3. Filtrare per luogo e tipo. Il confronto sul luogo è esatto, maiuscole comprese:

   ```bash
   curl 'http://127.0.0.1:8000/api/stays?location=Roma&kind=hotel'
   ```

4. Vedere la scheda con `id` 1:

   ```bash
   curl http://127.0.0.1:8000/api/stays/1
   ```

5. Correggere solo i campi passati:

   ```bash
   curl -X PATCH http://127.0.0.1:8000/api/stays/1 \
     -H 'Content-Type: application/json' -d '{"rating":4.8,"notes":"Vicino al centro"}'
   ```

6. Cancellare la scheda. La risposta ha stato `204`:

   ```bash
   curl -X DELETE http://127.0.0.1:8000/api/stays/1
   ```

## Problemi comuni

- `404` con `Stay not found`: l'`id` non esiste.
- `422`: un campo non è valido, per esempio `kind` è fuori dall'elenco ammesso.
- Un filtro `location` vuoto può dipendere dal testo, che deve coincidere esattamente.
- Il compose non parte se nel file `.env` manca `DB_PASSWORD`.
