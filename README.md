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