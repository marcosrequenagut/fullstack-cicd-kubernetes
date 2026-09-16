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