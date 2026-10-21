# Kubernetes deployment for EduVia

This folder contains a production-style Kubernetes setup for the app.

## What is included

- Namespace
- ConfigMap and Secrets
- PostgreSQL StatefulSet + Service
- API Deployment + Service + Health checks
- Frontend Deployment + Service
- Ingress routing
- Horizontal Pod Autoscaler

## Recommended setup order

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress-nginx.yaml
kubectl apply -f k8s/hpa.yaml
```

## Important values to configure

Update these in the YAML before deploying:

- `k8s/secret.yaml`
  - `DATABASE_URL`
  - `JWT_SECRET`
- `k8s/postgres.yaml`
  - `POSTGRES_PASSWORD`

If you are using the bundled PostgreSQL service in this repo, then set the API secret to:

```yaml
DATABASE_URL: "postgresql://eduvia:change-me-strong-password@eduvia-postgres.eduvia.svc.cluster.local:5432/eduvia"
```

## Build the container images

```bash
docker build -f Dockerfile.api -t eduvia-api:latest .
docker build -f Dockerfile.frontend -t eduvia-frontend:latest .
```

If using kind or minikube:

```bash
kind load docker-image eduvia-api:latest
kind load docker-image eduvia-frontend:latest
```

or

```bash
minikube image load eduvia-api:latest
minikube image load eduvia-frontend:latest
```

## Check status

```bash
kubectl get pods -n eduvia
kubectl get svc -n eduvia
kubectl get ingress -n eduvia
kubectl get hpa -n eduvia
```

## Health check

```bash
kubectl port-forward -n eduvia svc/eduvia-api 3001:3001
curl http://localhost:3001/api/health
```

## Notes

- This is a practical cloud-native deployment that fits the app structure.
- For a real production deployment, use a managed Postgres service instead of self-hosted Postgres if you want less operational overhead.
- An ingress controller such as `ingress-nginx` must be installed in the cluster for the Ingress resource to work.
