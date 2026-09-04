# nevyn-lm — understand it before you build it

## What it is, in plain words

Every other week used a language model as a black box you call over the network. This week you build the box. You write the transformer yourself in PyTorch (the same architecture family as Llama), train a small one (about 125 million parameters) on real text using your own GPUs, teach it to follow instructions, and serve it. Then you plug it into Week 3's serving layer so Week 1's agent can use a model *you trained* for its cheap steps.

The point is not to beat anyone. A 125M model writes mediocre text. The point is that afterwards, when an interviewer asks *"why does the KV cache matter?"* or *"what actually uses the VRAM during training?"*, you answer from memory of watching it happen on your own hardware, not from a blog post.

## Why employers care

AMD, Deepgram, and every ML-systems role want people who understand what happens below the API. Applied-AI roles increasingly ask "do you understand how the model works?" A from-scratch implementation with a training log, a serving benchmark, and a write-up of what you learned is the strongest possible answer, and it makes every earlier project's model-routing and quantization decisions credible.

## The picture

```
 TEXT IN                                        THE MODEL (model/)
 "The parcel at 8307 Garcreek" ──► tokenizer ──► [1523, 88, 4410, ...]   (BPE: text → integer ids)
                                                        │
                                                        ▼
                                              embedding table  (id → vector of 768 numbers)
                                                        │
                                          ┌─────────────▼──────────────┐
                                          │  transformer block × 12    │
                                          │   RMSNorm                  │
                                          │   attention (GQA + RoPE)   │  each token looks at earlier tokens
                                          │   + residual               │  (causal mask: never at later ones)
                                          │   RMSNorm                  │
                                          │   SwiGLU MLP               │  per-token computation
                                          │   + residual               │
                                          └─────────────┬──────────────┘
                                                        ▼
                                              LM head → probabilities over the next token
                                                        ▼
                                              sample → next id → append → repeat (KV cache makes this cheap)

 TRAINING (train/)                                          SERVING (serve/)
 FineWeb-Edu text ──► batches of token ids                  prompt ──► your server: KV cache, continuous batching, streaming
      │                                                              ──► vLLM (same weights, HF format)
      ▼                                                              ──► Triton
 forward → loss (cross-entropy on next token)                        └──► benchmark: tokens/s, TTFT, P95, VRAM
 backward → gradients                                                          │
 AdamW step (bf16 autocast, grad accumulation, clipping)              Week 3 router ──► Week 1 agent
 DDP across your GPUs · checkpoint every N steps · W&B loss curve

 POST-TRAINING (post/)
 base model ──► SFT with LoRA on instruction data ──► DPO on preference pairs ──► judged before/after (Week 1's judge)
```

## Follow one token through the model

1. **Tokenize.** "Garcreek" is not one token. The BPE tokenizer you trained splits text into the pieces that were most common in the training corpus, and maps each to an integer.
2. **Embed.** Each integer indexes a row of the embedding matrix: a vector of 768 learned numbers. Position is not in the vector yet.
3. **RoPE.** Rotary position embedding rotates the query and key vectors by an angle that depends on position, so attention can tell "two tokens back" from "ten tokens back" without a separate position table. (You write down *why* this generalizes better than learned positions.)
4. **Attention.** For the current token, compute a query; for every earlier token, a key and a value. Score = query · key. Softmax the scores, weight the values, sum. The **causal mask** sets scores for future tokens to negative infinity so the model cannot cheat during training. **GQA** (grouped-query attention) shares one key/value head among several query heads, cutting the KV cache memory by that ratio at almost no quality cost.
5. **MLP.** A two-layer feed-forward network with the SwiGLU gate, applied to each token independently. This is where most of the parameters live.
6. **Residual + RMSNorm.** Add the block's output back onto its input (so gradients flow through deep stacks) and normalize scale (RMSNorm is LayerNorm without the mean subtraction: cheaper, works as well).
7. **Repeat 12 times, then the LM head** turns the final vector into a score for every token in the vocabulary. Softmax gives probabilities. **Sampling** (temperature, top-p) picks one.
8. **KV cache.** To generate the next token you would recompute keys and values for the whole prefix. Instead you keep them. Generation goes from quadratic to linear in sequence length, and the cache becomes the thing that fills VRAM at long context. This is exactly what vLLM's paged attention manages.

**Training** is step 1 to 7 on a batch of sequences, comparing predicted next-token probabilities to the real next tokens (cross-entropy), then backpropagating. You will see with your own eyes that VRAM is weights + gradients + two Adam moments (so roughly 16 bytes per parameter in mixed precision) + activations, and that gradient checkpointing trades compute for activation memory.

## The tools, and why each one is here

| Tool | What it is | Why it is in this project | What you could use instead |
|------|------------|---------------------------|----------------------------|
| **PyTorch** | Tensor library with autograd | The thing you implement the model in | JAX |
| **sentencepiece / your own BPE** | Tokenizer training | Understanding tokens explains half of LLM behavior | HF `tokenizers` |
| **FlashAttention 2** | Fused, memory-efficient attention kernel | Makes attention not be the bottleneck; you measure before/after | Naive attention (fine at tiny scale, then not) |
| **DDP / FSDP** | Distributed data parallel / fully sharded | Use both GPUs; FSDP shards weights when they do not fit on one | Single GPU (slower) |
| **bf16 autocast** | Mixed precision training | ~2× faster and half the activation memory with stable numerics | fp32 (slow), fp16 (overflow risk) |
| **Gradient accumulation / checkpointing** | Bigger effective batch / trade compute for memory | Fit a real batch size on consumer GPUs | Smaller batches (noisier) |
| **Weights & Biases** | Experiment tracking | Loss curves, LR, throughput, GPU util, all in one place | MLflow (Week 3), TensorBoard |
| **FineWeb-Edu** | Cleaned web text corpus | Public, good quality, big enough to sample 2B tokens | OpenWebText, The Pile |
| **lm-eval-harness** | Standard evaluation suite | Sanity numbers on public tasks so you know training worked | Your own eval only |
| **peft (LoRA)** | Low-rank adapters | Fine-tune by training ~1% of the weights; the standard way to adapt models cheaply | Full fine-tuning |
| **trl (DPO)** | Preference optimization | Teach the model which of two answers people prefer, without a reward model | RLHF with PPO (much more complex) |
| **vLLM** | LLM serving engine | Compare your hand-written server to the industry standard; understand what paged attention buys | TGI, llama.cpp |
| **Triton** | GPU inference server | Same server as Week 3; third serving option in the benchmark | TorchServe |
| **Week 1's LLM judge** | Your own eval harness | Measure SFT/DPO before-and-after with something you already trust | Human-only |

## What the week produces

A repo with a from-scratch transformer whose every module matches a reference implementation in tests; a training run you can show (loss curve, tokens/sec, MFU, VRAM breakdown, one crash-and-resume); a small instruction-following model after SFT and DPO with a before/after judged table; a three-way serving benchmark (your server vs vLLM vs Triton, FP16 vs INT8, concurrency 1/8/32); `docs/why.md` explaining RoPE, RMSNorm, GQA, KV cache, FlashAttention, quantization, and training stability in your own words with your own numbers; and one end-to-end trace where Week 1 uses this model through Week 3's router.

## Words you will hear this week

- **Token / vocabulary / BPE**: unit of text the model sees / the set of all tokens / the algorithm that builds them from frequency.
- **Embedding dimension / hidden size**: length of each token's vector (768 here).
- **Attention head / GQA**: one parallel attention computation / several query heads sharing one key/value head.
- **Causal mask**: hides future tokens during training.
- **RoPE**: rotary position encoding.
- **RMSNorm / residual**: cheap normalization / add-the-input-back connection.
- **SwiGLU**: the gated MLP variant modern models use.
- **Cross-entropy / perplexity**: the training loss / e to the loss, "how surprised the model is."
- **Learning-rate warmup and cosine decay**: ramp LR up, then slowly down; the schedule that makes training stable.
- **Gradient clipping**: cap the gradient norm to avoid blow-ups.
- **MFU**: model FLOPs utilization, what fraction of the GPU's peak math you actually use.
- **Checkpoint / resume**: save weights and optimizer state; continue after a crash.
- **SFT / LoRA / DPO**: supervised fine-tuning on instructions / low-rank adapters / direct preference optimization.
- **KV cache / paged attention / continuous batching**: keep past keys and values / manage them in pages / add requests to a running batch.
- **TTFT / tokens per second / P95**: time to first token / generation throughput / 95th-percentile latency.
- **Speculative decoding**: a small model drafts several tokens, the big model verifies them in one pass.

## The day-by-day in one line each

29. Tokenizer and every model module written and tested against a reference; `docs/why.md` started.
30. Training stack: loader, AdamW, schedule, bf16, accumulation, checkpointing, DDP, W&B; launch 125M; kill and resume once.
31. While it trains: your own inference server with KV cache and continuous batching; first serving benchmark.
32. Stop at the token budget; lm-eval sanity; SFT with LoRA; DPO; judged before/after.
33. Serve with vLLM and Triton; three-way benchmark; speculative decoding experiment; `docs/why.md` complete.
34. Integration: register in Week 3's router, Week 1 uses it, one trace across all five systems, ecosystem README.
35. Website with five case studies, résumé with measured numbers, mock interviews per repo, final applications.
