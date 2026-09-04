# ml-platform — understand it before you build it

## What it is, in plain words

Two things, built on top of each other.

**First, the shared platform.** Until now everything ran in Docker Compose on your machine or on Fly.io. This week you build the real thing: a Kubernetes cluster on AWS, described entirely in Terraform files so it can be created and destroyed with one command, with your own NVIDIA machines joined to it as GPU workers. Weeks 1 and 2 move onto it, and deployments happen automatically when you merge to `main` (ArgoCD).

**Second, the ML lifecycle.** A model is not a file you train once. It is a thing that gets trained, compared to the previous one, promoted only if better, served behind an API, watched for the world changing under it (**drift**), and retrained when it does. You build every one of those stages for a real problem: predicting Austin property values and rents from Week 2's gold tables. Then you use the GPU nodes to serve heavier models (a YOLO/CLIP image pipeline, and a 7B-parameter LLM through vLLM), and you measure exactly how much faster each optimization makes them.

## Why employers care

MLE roles (AMP, Evlo, Visa, Apptronik) ask for MLflow, model registries, drift monitoring, Kubernetes, Triton/ONNX/TensorRT, and "productionizing models." Platform roles ask for Terraform, EKS, ArgoCD, and GPU infrastructure. Almost nobody can show a benchmark table where they personally measured FP16 vs INT8 on Triton. You will.

## The picture

```
 PLATFORM (Terraform creates all of this; `terraform destroy` removes it)
 ┌──────────────────────────── AWS ─────────────────────────────┐    ┌── your house (Tailscale) ──┐
 │  VPC ── EKS control plane ── spot node (t3.medium)            │    │  GPU machine(s) joined as   │
 │  RDS Postgres(pgvector)  ElastiCache Redis  S3  ECR  Secrets  │◄──►│  Kubernetes worker nodes     │
 │  Cognito (login)                                              │    │  label gpu=true, NVIDIA plugin│
 └───────────────────────────────────────────────────────────────┘    └──────────────────────────────┘
                     ▲ kubectl / Helm / ArgoCD
   GitHub → Actions builds image → pushes to ECR → bumps Helm values in deploy/ → ArgoCD syncs → Rollouts canary 10%→100%

 ML LIFECYCLE
 Week 2 gold tables ──► features/build.py ──► feature table (Delta)
                                                   │
                     ┌─────────────────────────────┼──────────────────────┐
                     ▼                             ▼                      ▼
              train/linear.py              train/lightgbm.py         train/mlp.py (Ray Train on cluster)
                     └─────────────► MLflow tracking (params, metrics, artifacts) ◄──┘
                                                   │
                                        train/validate.py  ── gate: better than baseline? no leakage? features stable?
                                                   │ pass
                                        MLflow registry: staging ──► production
                                                   │
                     ┌─────────────────────────────┴───────────────────────────┐
                     ▼                                                         ▼
          KServe InferenceService (CPU)                          Triton on GPU node
          /predict  value + rent                                 YOLOv11 + CLIP image pipeline
                     │                                            (ONNX / TensorRT, dynamic batching)
                     ▼
          live inputs + delayed truth ──► Evidently ──► drift metrics ──► Prometheus alert
                                                                              │
                                                              retrain/pipeline.py ── validate ── canary v2 vs v1 ── promote or roll back

 LOCAL LLM SERVING
          vLLM on GPU node serving Qwen2.5-7B ──► OpenAI-compatible endpoint ──► Week 1 router's `local` slot
```

## Follow one prediction through the system

1. **Features.** `features/build.py` reads `gold/parcels_current` and `gold/permits_by_parcel` from Week 2, computes features (sqft, year built, permits in last 5 years, neighborhood medians), and writes a feature table with a version.
2. **Training.** `train/lightgbm.py` trains on last year's appraisals, logs every parameter and metric to **MLflow**, and saves the model as an artifact. Three other scripts do the same with different algorithms so you can compare.
3. **The gate.** `train/validate.py` loads the candidate and the current production model, scores both on the same held-out set, checks for leakage (a feature that is really the answer in disguise), checks feature distributions match, and only if the candidate wins does it move it to `production` in the registry.
4. **Deployment.** ArgoCD notices the registry pointer changed (via a values bump), rolls out a new KServe InferenceService as a **canary**: 10% of traffic for a while, compare error, then 100% or roll back.
5. **Serving.** `POST /predict {parcel_id}` → the service looks up features → returns value and rent. Each request's inputs are logged.
6. **Drift.** Nightly, **Evidently** compares the last day of inputs to the training data (data drift) and, once real appraisals arrive weeks later, compares predictions to truth (concept drift). It pushes numbers to Prometheus. A rule fires an alert when drift crosses a threshold.
7. **Retrain.** The alert triggers `retrain/pipeline.py`, which goes back to step 2 automatically. If the new model is worse in canary, Argo Rollouts rolls it back and the postmortem writes itself into your notes.

**On the GPU side**, an image request goes: client → Triton → dynamic batcher groups requests arriving within a few milliseconds → YOLO (as a TensorRT engine) finds objects → CLIP embeds them → response. You measure images/sec and P95 latency for every combination of runtime (PyTorch eager, `torch.compile`, ONNX Runtime, TensorRT) and precision (FP32, FP16, INT8).

## The tools, and why each one is here

| Tool | What it is | Why it is in this project | What you could use instead |
|------|------------|---------------------------|----------------------------|
| **Terraform** | Infrastructure as code | Every AWS resource is a file in git; recreate or destroy the whole platform in one command; the cost guard | Pulumi, CloudFormation, clicking in the console (never) |
| **EKS** | AWS-managed Kubernetes | The job descriptions say Kubernetes; EKS is what most Austin companies run | GKE, k3s on a VM, ECS (you write ADR-009 on this) |
| **Kubernetes** | Container orchestrator | Runs, scales, restarts, and networks your containers across many machines | Nomad, Docker Swarm, ECS |
| **Helm** | Package manager for Kubernetes | One chart per service with configurable values instead of hundreds of YAML files | Kustomize |
| **ArgoCD** | GitOps deployer | The cluster continuously matches what is in the `deploy/` branch; no manual `kubectl apply` | Flux |
| **Argo Rollouts** | Canary and blue-green deployments | Ship a new model or service to 10% first, measure, then promote | Flagger |
| **KEDA** | Event-driven autoscaler | Scales Week 1's workers on Kafka lag, not CPU | HPA on CPU |
| **Tailscale** | Zero-config VPN | Your home GPU boxes join the cluster securely without opening ports | WireGuard by hand |
| **NVIDIA device plugin** | Exposes GPUs to Kubernetes pods | Pods can request `nvidia.com/gpu: 1` | Running outside Kubernetes |
| **Cognito** | AWS identity provider | Replaces Keycloak with a managed service; same JWT validation code | Auth0, Okta |
| **MLflow** | Experiment tracking + model registry | Every run's params/metrics/artifacts; `staging → production` promotion is a first-class object | Weights & Biases, SageMaker registry |
| **LightGBM / XGBoost** | Gradient-boosted trees | The right tool for tabular data; usually beats neural nets here, and you prove it | CatBoost, sklearn |
| **PyTorch** | Deep learning framework | The MLP baseline, and everything GPU | JAX, TensorFlow |
| **Ray Train** | Distributed training on Kubernetes | Trains the MLP across nodes; the standard for scaling PyTorch jobs | torchrun by hand, Kubeflow |
| **KServe** | Model serving on Kubernetes | Standard inference API, autoscaling to zero, canary support | BentoML, plain FastAPI |
| **Triton Inference Server** | NVIDIA's GPU serving system | Dynamic batching, multiple backends (PyTorch, ONNX, TensorRT), metrics | TorchServe, plain FastAPI |
| **ONNX Runtime** | Portable optimized inference runtime | Often 1.5–3× faster than eager PyTorch with one export | Stay in PyTorch |
| **TensorRT** | NVIDIA compiler for inference | Fastest option on NVIDIA GPUs; FP16/INT8 without rewriting the model | torch.compile |
| **vLLM** | High-throughput LLM server | Paged KV cache and continuous batching; the standard way to self-host an LLM | TGI, Ollama, llama.cpp |
| **Evidently** | Drift and data-quality reports | Ready-made statistical tests for data and concept drift; exports to Prometheus | Custom KS tests, WhyLabs |
| **Prometheus / Grafana** | Metrics and dashboards | Same stack as Week 1, now with GPU and drift panels | Datadog |

## What the week produces

A Terraform repo that creates the whole platform; Weeks 1 and 2 running on EKS with GitOps deploys and a working rollback; a valuation model with a tracked lineage from features to production, a validation gate that rejects a leaked feature, a drift alert that triggers retraining and a canary that can roll back; a GPU benchmark matrix (runtime × precision × batch size) and an LLM serving benchmark (FP16 vs INT4, concurrency 1/8/32); and Week 1's agent using your own hosted 7B model for cheap steps, with the cost delta measured.

## Words you will hear this week

- **Control plane / worker node**: the Kubernetes brain / the machines that run pods.
- **Pod / Deployment / Service / Ingress**: one or more containers / a managed set of pods / stable network name / the door from the internet.
- **GitOps**: the git repo is the source of truth; a controller makes the cluster match it.
- **Canary**: send a slice of traffic to the new version first.
- **Spot instance**: cheap AWS capacity that can be reclaimed; fine for a dev cluster.
- **Feature store / feature table**: precomputed model inputs, versioned, shared between training and serving so they cannot drift apart (**training-serving skew**).
- **Leakage**: a training feature that would not be available at prediction time, or that encodes the target.
- **Model registry**: a versioned catalog of models with stage labels.
- **Data drift / concept drift**: inputs look different from training / the relationship between inputs and truth changed.
- **Dynamic batching**: the server groups requests that arrive close together into one GPU call.
- **FP32 / FP16 / BF16 / INT8 / INT4**: number precisions; lower is faster and smaller, at some accuracy cost you measure.
- **Quantization**: converting a model to a lower precision.
- **Throughput vs latency**: items per second vs time per item; batching raises the first and hurts the second.
- **Compute-bound vs memory-bandwidth-bound**: limited by arithmetic vs by moving weights through memory (LLM decoding is the latter).
- **KV cache / paged attention / continuous batching**: reuse past attention keys and values / manage that cache in pages like an OS / add new requests to a batch mid-flight.

## The day-by-day in one line each

15. Terraform the platform; EKS up; your GPU box joins; `nvidia-smi` runs in a pod.
16. Helm charts for Weeks 1–2, ArgoCD, canary rollouts, Cognito, runbooks, one rollback drill.
17. Features, four training scripts in MLflow, validation gate, registry promotion.
18. KServe for the tabular model; Triton with YOLO/CLIP on the GPU node; the runtime × precision benchmark matrix.
19. Evidently drift → alert → automatic retrain → canary → promote or roll back.
20. vLLM serving a 7B model; Week 1 router uses it; cost and quality delta measured.
21. Load test, GPU-node-down drill, docs, video, case study, three applications, `terraform destroy`.
