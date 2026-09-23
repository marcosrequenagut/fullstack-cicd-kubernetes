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