# StayFinder

StayFinder is a FastAPI and React application for keeping a lightweight, searchable catalogue of travel accommodations. It provides a CRUD API for stays today; availability search and booking-provider integrations are intentionally out of scope for this release.

## Features

- Create, list, filter, update, and soft-delete accommodation records.
- Cursor-paginated saved-stay endpoint.
- FastAPI backend with PostgreSQL in Docker and a Vite/React frontend.

## Requirements

- Python 3.13
- Node.js 20 and npm
- Docker Compose (recommended for local development)
- The companion Life framework, checked out as a sibling directory named `Life`, for the shared backend and frontend packages.

## Quickstart

```bash
git clone <your-fork-or-clone-url> stayfinder
git clone <life-framework-url> Life
cd stayfinder
cp .env.example .env
bash deploy/prebuild.sh
docker compose -f deploy/docker-compose.example.yml up --build
```

The example stack exposes the backend at `http://127.0.0.1:8000` and the frontend at `http://127.0.0.1:5173`.

To run without Docker, install `../Life/packages/shared`, `../Life/packages/backend-core`, and `backend/requirements.txt`, then run `uvicorn stayfinder_backend.app:app --reload` from `backend/`. In `frontend/`, run `npm ci` and then `npm run dev`.

## Tests

Run `pytest` from `backend/`, then run `npm test` and `npm run build` from `frontend/`. CI checks out this repository as `repo/` and the framework as its `Life/` sibling using the `LIFE_FRAMEWORK_REPO` repository variable (default `suite-life`), because `suite_core`, `suite_backend_core`, and `@suite/design-system` are not registry packages.

## Configuration

| Variable |
| --- |
| `DB_PASSWORD` |
| `DB_HOST_PORT` |
| `DATABASE_URL` |
| `LIFE_FRAMEWORK_DIR` |

See [the user guide](docs/guida.md) for API examples.

## License

MIT — see [LICENSE](LICENSE).
