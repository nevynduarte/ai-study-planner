// Maps a stack string from PORTFOLIO.md ("Postgres 16 + pgvector (RLS)") onto a
// Simple Icons slug + brand colour, so the Projects/Plan tabs can show a row of
// real logos instead of another list of words.
//
// Icon path data is bundled at build time by scripts/build-icons.cjs, which
// pulls only the slugs named here out of the `simple-icons` package — so the app
// makes no third-party request to render a logo and works offline. A null slug
// (AWS-family marks, which simple-icons no longer ships, and projects with no
// icon yet) renders a brand-coloured letter tile instead — see <TechIcon>.

// Ordered longest-key-first at lookup time so "apache spark" wins over "spark".
const ICONS = {
  // languages / runtimes
  "python":            ["python", "3776AB"],
  "typescript":        ["typescript", "3178C6"],
  "javascript":        ["javascript", "F7DF1E"],
  "node":              ["nodedotjs", "5FA04E"],
  "go":                ["go", "00ADD8"],
  "rust":              ["rust", "DEA584"],
  "bash":              ["gnubash", "4EAA25"],

  // web / api
  "fastapi":           ["fastapi", "009688"],
  "pydantic":          ["pydantic", "E92063"],
  "next.js":           ["nextdotjs", "888888"],
  "nextjs":            ["nextdotjs", "888888"],
  "react":             ["react", "61DAFB"],
  "vite":              ["vite", "646CFF"],
  "streamlit":         ["streamlit", "FF4B4B"],
  "gradio":            ["gradio", "F97316"],
  "nginx":             ["nginx", "009639"],

  // data stores
  "postgres":          ["postgresql", "4169E1"],
  "postgresql":        ["postgresql", "4169E1"],
  "pgvector":          ["postgresql", "4169E1"],
  "redis":             ["redis", "FF4438"],
  "elasticsearch":     ["elasticsearch", "005571"],
  "opensearch":        ["opensearch", "005EB8"],
  "duckdb":            ["duckdb", "FFF000"],
  "snowflake":         ["snowflake", "29B5E8"],
  "minio":             ["minio", "C72E49"],
  "sqlite":            ["sqlite", "003B57"],

  // streaming / processing
  "kafka":             ["apachekafka", "231F20"],
  "redpanda":          ["apachekafka", "231F20"],
  "spark":             ["apachespark", "E25A1C"],
  "pyspark":           ["apachespark", "E25A1C"],
  "delta lake":        ["databricks", "FF3621"],
  "databricks":        ["databricks", "FF3621"],
  "dagster":           [null, "654FF0"],
  "airflow":           ["apacheairflow", "017CEE"],
  "dbt":               [null, "FF694B"],
  "beam":              [null, "FF6D00"],

  // ml / ai
  "pytorch":           ["pytorch", "EE4C2C"],
  "tensorflow":        ["tensorflow", "FF6F00"],
  "keras":             ["keras", "D00000"],
  "scikit":            ["scikitlearn", "F7931E"],
  "pandas":            ["pandas", "150458"],
  "polars":            ["polars", "CD792C"],
  "numpy":             ["numpy", "013243"],
  "mlflow":            ["mlflow", "0194E2"],
  "hugging":           ["huggingface", "FFD21E"],
  "ray":               ["ray", "028CF0"],
  "onnx":              ["onnx", "005CED"],
  "nvidia":            ["nvidia", "76B900"],
  "triton":            ["nvidia", "76B900"],
  "tensorrt":          ["nvidia", "76B900"],
  "cuda":              ["nvidia", "76B900"],
  "vllm":              [null, "6E44FF"],
  "anthropic":         ["anthropic", "D97757"],
  "claude":            ["anthropic", "D97757"],
  "openai":            [null, "412991"],
  "langchain":         ["langchain", "1C3C3C"],
  "langgraph":         ["langchain", "1C3C3C"],
  "llamaindex":        [null, "000000"],
  "weights":           ["weightsandbiases", "FFBE00"],
  "w&b":               ["weightsandbiases", "FFBE00"],
  "jupyter":           ["jupyter", "F37626"],
  "evidently":         [null, "18A0FB"],
  "feast":             [null, "1D9E75"],

  // infra / platform
  "docker":            ["docker", "2496ED"],
  "kubernetes":        ["kubernetes", "326CE5"],
  "eks":               [null, "FF9900"],
  "helm":              ["helm", "0F1689"],
  "argocd":            ["argo", "EF7B4D"],
  "argo":              ["argo", "EF7B4D"],
  "keda":              [null, "326CE5"],
  "terraform":         ["terraform", "844FBA"],
  "aws":               [null, "FF9900"],
  "amazon":            [null, "FF9900"],
  "ecr":               [null, "FF9900"],
  "cognito":           [null, "FF9900"],
  "gcp":               ["googlecloud", "4285F4"],
  "cloudflare":        ["cloudflare", "F38020"],
  "fly.io":            ["flydotio", "8B5CF6"],
  "vercel":            ["vercel", "000000"],
  "tailscale":         ["tailscale", "242424"],
  "keycloak":          ["keycloak", "008AAA"],
  "k3s":               ["k3s", "FFC61C"],

  // observability
  "opentelemetry":     ["opentelemetry", "000000"],
  "otel":              ["opentelemetry", "000000"],
  "prometheus":        ["prometheus", "E6522C"],
  "grafana":           ["grafana", "F46800"],
  "tempo":             ["grafana", "F46800"],
  "sentry":            ["sentry", "362D59"],
  "k6":                ["k6", "7D64FF"],

  // dev tooling
  "github actions":    ["githubactions", "2088FF"],
  "github":            ["github", "181717"],
  "git":               ["git", "F05032"],
  "mcp":               ["modelcontextprotocol", "000000"],
  "pytest":            ["pytest", "0A9EDC"],
  "poetry":            ["poetry", "60A5FA"],
  "tree-sitter":       [null, "8B5CF6"],
};

const KEYS = Object.keys(ICONS).sort((a, b) => b.length - a.length);

// "Postgres 16 + pgvector (RLS)" -> { slug:"postgresql", color:"4169E1" }
export function iconFor(label) {
  const l = String(label || "").toLowerCase();
  for (const k of KEYS) if (l.includes(k)) return { slug: ICONS[k][0], color: ICONS[k][1] };
  return null;
}

// Shorten a stack entry for display under an icon: drop parenthetical asides
// and version numbers, which are noise once the logo carries the identity.
export const shortLabel = (label, max = 28) => {
  const s = String(label)
    .replace(/\([^)]*\)/g, "")            // drop parenthetical asides
    .replace(/\s+\d+(\.\d+)*\b/g, "")     // drop version numbers
    .split(/\s+(?:\+|→|->)\s+/)[0]        // "A + B" / "A → B" -> the headline tool
    .replace(/\s+/g, " ")
    .trim();
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
};
