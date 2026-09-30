# Fullstack CI/CD Kubernetes Project

A learning project that simulates a real company environment: a full-stack application (React + FastAPI + PostgreSQL) developed, tested, containerized and deployed through a complete CI/CD pipeline into a local Kubernetes cluster (Minikube), with separate DEV and PROD environments.

The goal of this project is **not** to build a complex application, but to practice, end to end, how a change made by a developer travels from a feature branch to a running deployment in Kubernetes — including Git workflow, CI, Docker, a container registry-like flow, Kubernetes objects, Secrets, Ingress, and automated CD via a self-hosted GitHub Actions runner.

## Tech Stack

**Frontend:** React + TypeScript, built with Vite, served in production by Nginx. Uses `react-big-calendar` + `date-fns` for the booking calendar.

**Backend:** Python + FastAPI, SQLAlchemy ORM, Pydantic schemas, pandas (for the demo dataset endpoint).

**Database:** PostgreSQL, one independent instance per environment (dev / prod), each with its own PersistentVolumeClaim.

**Containerization:** Docker (multi-stage build for the frontend: Node.js build stage → Nginx runtime stage).

**Orchestration:** Kubernetes, running locally via Minikube (Docker driver).

**CI/CD:** GitHub Actions, using a **self-hosted runner** (running on the developer's machine) so the pipeline can reach the local Minikube cluster — something a normal GitHub-hosted runner cannot do.

**Notifications:** Telegram Bot API, used for instant booking confirmations and a daily reminder job.

**Ingress:** NGINX Ingress Controller (Minikube addon), routing `/` to the frontend and `/api/*` to the backend, with path rewriting.

## Repository Structure

```
.
├── backend/
│   ├── main.py                 # FastAPI app and all endpoints
│   ├── db_connection.py        # SQLAlchemy engine (reads DATABASE_URL)
│   ├── database.py             # SQLAlchemy SessionLocal + get_db dependency
│   ├── models.py               # ORM models (Courts, Players, Reservations)
│   ├── schemas.py              # Pydantic Create/Out schemas
│   ├── telegram_notifier.py    # Reusable Telegram sender
│   ├── scripts/
│   │   ├── seed.py                  # Loads a CSV into the order_items table
│   │   ├── create_tables.py         # Creates ORM-defined tables
│   │   └── notify_reservations.py   # Daily reminder job (used by the CronJob)
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   └── App.tsx              # Booking calendar UI
│   ├── package.json
│   ├── vite.config.ts           # Includes /api proxy for local dev
│   └── Dockerfile               # Multi-stage: Node build → Nginx serve
├── k8s/
│   ├── dev/
│   │   ├── namespace.yaml
│   │   ├── secret.example.yaml       # Documentation only, no real values
│   │   ├── postgres-pvc.yaml
│   │   ├── postgres-deployment.yaml
│   │   ├── postgres-service.yaml
│   │   ├── backend-deployment.yaml
│   │   ├── backend-service.yaml
│   │   ├── frontend-deployment.yaml
│   │   ├── frontend-service.yaml
│   │   ├── ingress.yaml              # /api → backend (with rewrite)
│   │   ├── frontend-ingress.yaml     # / → frontend
│   │   └── notify-cronjob.yaml
│   └── prod/
│       └── ... (same structure as dev)
├── scripts/                     # (reserved for future setup/deploy shell scripts)
├── .github/
│   └── workflows/
│       └── ci.yml
├── docker-compose.yml           # Local dev only: backend + postgres
├── .env.example
└── README.md
```

## Architecture

```
                         Ingress (NGINX)
                              │
                ┌─────────────┴─────────────┐
                │                             │
              path: /                     path: /api
                │                             │
        frontend Service              backend Service
                │                             │
         Frontend Pod(s)               Backend Pod(s)
          (Nginx + React)               (FastAPI)
                                              │
                                       Postgres Service
                                              │
                                        Postgres Pod
                                       (PersistentVolume)
```

This same layout is duplicated once per namespace: `dev` and `prod`, fully isolated from each other — separate database instances, separate Secrets, separate Ingress hosts (`dev.miproyecto.local` / `prod.miproyecto.local`).

## Application Features

The app intentionally combines two small, unrelated feature sets, kept simple on purpose so the focus stays on the infrastructure:

1. **Data demo endpoint** (`/api/order-items`): loads a CSV (Olist e-commerce dataset) into Postgres via a `pandas`-based seed script and exposes it as JSON — used to validate the DB ↔ backend ↔ Kubernetes pipeline early in the project.

2. **Padel court booking system**: a small real feature with its own data model (`courts`, `players`, `reservations`), a calendar UI (month view → day view → time slot → duration → available courts → confirm), a Telegram confirmation sent immediately on booking, and a daily Kubernetes `CronJob` that reminds players of upcoming reservations (with a `notified` flag to avoid duplicate reminders).

## Git Workflow

```
feature/*  →  Pull Request  →  develop  →  Pull Request  →  main
```

- `main` and `develop` are protected: direct pushes are blocked, Pull Requests are required.
- `develop` maps to the **dev** Kubernetes namespace; `main` maps to **prod**.
- Every PR triggers CI (lint + tests). Every push to `develop` or `main` (i.e. every merge) triggers the CD deploy job for the corresponding namespace.

## CI/CD Pipeline

Defined in `.github/workflows/ci.yml`, with three jobs:

| Job | Runner | Trigger | What it does |
|---|---|---|---|
| `lint` | `ubuntu-latest` (GitHub-hosted) | PR + push | Runs `ruff check` on the backend |
| `test` | `ubuntu-latest` (GitHub-hosted) | PR + push | Runs `pytest` on the backend |
| `deploy` | **self-hosted** (local machine) | push only, after lint+test succeed | Builds backend/frontend images inside Minikube's Docker daemon, runs `kubectl apply -f k8s/<namespace>/`, and restarts the Deployments |

**Why a self-hosted runner:** GitHub-hosted runners live in GitHub's cloud and have no network path to a Minikube cluster running on a developer's laptop. A self-hosted runner is a small agent installed on the same machine as Minikube, so it can run `kubectl` and `docker build` directly against the local cluster. In a real cloud deployment (EKS/GKE/etc.) this wouldn't be necessary — a normal GitHub-hosted runner could reach the cluster's public endpoint directly.

## Local Development Setup (Windows)

This project was developed and tested on **Windows with Docker Desktop**, which has a few platform-specific quirks worth knowing about:

- **Two separate Docker daemons exist**: your normal Docker Desktop, and Minikube's *internal* Docker daemon (since Minikube runs as a Docker container itself, using the `docker` driver). Running `eval $(minikube docker-env)` in a terminal points that terminal's `docker` commands at the internal daemon — necessary before building images meant to run inside Kubernetes. Run `eval $(minikube docker-env -u)` to point it back at your normal Docker Desktop.
- **`minikube image load` is currently broken on Windows** (missing `wmic` dependency on recent Windows builds). Workaround: build images directly inside Minikube's Docker daemon instead (see above).
- **Ingress is not directly reachable via Minikube's IP on Windows+Docker driver.** The standard workaround (`minikube tunnel`) does not reliably expose ports below 1024 either. The reliable approach used here is `kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 80:80`, combined with `127.0.0.1` entries in the Windows `hosts` file for `dev.miproyecto.local` and `prod.miproyecto.local`.
- **PowerShell script execution may be blocked by default** (`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` fixes this for the self-hosted runner's generated scripts).

### Typical local session

```bash
# 1. Start Docker Desktop, then:
minikube start --driver=docker

# 2. Keep these running in dedicated terminals as needed:
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 80:80
cd actions-runner && ./run.cmd          # only needed to receive CI/CD deploy jobs

# 3. Build an image into Minikube's internal Docker:
eval $(minikube docker-env)
docker build -t backend:latest ./backend
kubectl rollout restart deployment/backend -n dev
eval $(minikube docker-env -u)
```

### Fast frontend iteration

For UI work, running the frontend outside Kubernetes is much faster:

```bash
kubectl port-forward -n dev svc/backend 8000:8000   # backend reachable at localhost:8000
cd frontend
npm run dev                                          # localhost:5173, proxies /api → localhost:8000
```

The Vite dev server proxy (`vite.config.ts`) forwards `/api/*` to the local backend, mirroring what the Ingress does in the cluster, so the same frontend code works unchanged in both environments — the code never hardcodes a domain, only relative paths like `/api/reservations`.

## Secrets Management

No credentials are ever committed to the repository. Each namespace has its own Kubernetes `Secret`, created imperatively:

```bash
kubectl create secret generic postgres-secret \
  --namespace=dev \
  --from-literal=POSTGRES_USER=... \
  --from-literal=POSTGRES_PASSWORD=... \
  --from-literal=POSTGRES_DB=... \
  --from-literal=DATABASE_URL=postgresql://...

kubectl create secret generic telegram-secret \
  --namespace=dev \
  --from-literal=TELEGRAM_BOT_TOKEN=... \
  --from-literal=TELEGRAM_CHAT_ID=...
```

`k8s/*/secret.example.yaml` documents the expected keys with placeholder values only, for reference.

Local development additionally uses a `.env` file (see `.env.example`) consumed by `docker-compose.yml`.

## Known Limitations

- Everything runs on a single developer's machine; nothing is reachable from outside the local network, and the Kubernetes `CronJob` only fires if Minikube happens to be running at the scheduled time.
- No image registry is used — images are built directly into Minikube, tagged `:latest`. In a real setup, images would be pushed to GHCR/Docker Hub and pulled by the cluster, and the self-hosted runner requirement would disappear.
- No horizontal scaling is configured (`replicas: 1` everywhere) — this is a learning environment, not a production-sized deployment.

## Roadmap / Possible Next Steps

- Player search/selection in the booking form (currently uses a placeholder `player_id`).
- Move to a real cloud Kubernetes cluster + container registry to remove the local-only limitations above.
- Introduce Kustomize or Helm to reduce YAML duplication between `k8s/dev` and `k8s/prod`.
- Add resource requests/limits and readiness/liveness probes.

APUNTES PARA COMPRENSIÓN:


Cluster (Minikube)
│
└── namespace: dev
      │
      ├── Pod (postgres)      ← imagen: postgres:16
      │     Service: postgres  → IP estable para hablar con él
      │
      └── Pod (backend)       ← imagen: backend:latest (la tuya)
            Service: backend   → IP estable para hablar con él


Cada POD (normalmente) contiene una imagen diferente. Los SERVICES son quienes permiten que los PODS se encuentren entre sí opr nombre, sin conocer las IPs internas.


Estructura interna de K8S
Docker Desktop (tu Docker normal)
  │
  └── contenedor "minikube"          ← esto es 1 nodo de Kubernetes
        │
        └── Docker interno de Minikube (el que usaste con el eval)
              │
              ├── Pod postgres   ← contenedor real, corriendo aquí dentro
              └── Pod backend    ← contenedor real, corriendo aquí dentro

Workflow cuando hago un push en Github

 git push
                       │
                       ▼
              ┌─────────────────┐
              │ lint + test      │
              └────────┬────────┘
                       │
                  ¿Todo OK?
                       │
                       ▼
             ┌───────────────────┐
             │ Detectar branch   │
             └─────────┬─────────┘
                       │
             ┌─────────┴─────────┐
             │                   │
          main                otra rama
             │                   │
             ▼                   ▼
           prod                 dev
             │                   │
             └─────────┬─────────┘
                       ▼
              minikube docker-env
                       │
                       ▼
              docker build
              backend:latest
                       │
                       ▼
               kubectl apply
                       │
                       ▼
             rollout restart
                       │
                       ▼
                 🚀 Backend

Para ejecutar la API hay que tener esto en una terminal funcionando: $ kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 80:80

Y seguramente hacer el procedimiento quee viene en github que he creado en otro proyecto independiente en la termianl esto ultimo no estoy seguero


Desde que el usuario hace una peticion hasta que llega a la api al backend pasa esto:

🌍 Usuario / navegador
        │
        │ GET https://miapp.com/api/users
        ▼
┌─────────────────┐
│     INGRESS     │  ← puerta de entrada HTTP/HTTPS
└────────┬────────┘
         │
         │ regla: /api → backend-service
         ▼
┌─────────────────┐
│    SERVICE      │  ← dirección estable
│ backend-service │
└────────┬────────┘
         │
         ▼
   ┌───────────┐
   │ Pod       │
   │ FastAPI   │
   └───────────┘


Cada vez que quiera hacer un despliegue ya sea en dev/prod tengo que tener ejecutando en una terminal el siguiente comando:

$ cd /c/Users/34651/Downloads/actions-runner
./run.cmd

Esto lo que permite es que el runner normal de Github (en la nube, donde normalmente se ejecuta el workflow) no tiene forma de alcanzar mi Minikube, que vive solo en mi PC. Por lo que se usa ese comando que nos lo da Githubpara decirle literlamente usa mi propio ordenador para poder recibir y ejecutar los jobs que te llegan de Github igual que el servidor web que necesita estar encendido para responder peticiones. 

Ademas de ese comando tenemos que tener ejecutando en una terminal el comando:

kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 80:80

que nos conecta con el Ingress Controller, que es necesario para que yo o cualquier a pueda acceder a a la app ya desplegada desde el navegador, para poder hacer la petición vaya. Es una limitacion que hay entre WINDOWS + Docker. Sin este "puente", no se podría conectar el usuario desde la web con mi api en docker que realmente está en k8s, no se podrían visitar desde fuera.