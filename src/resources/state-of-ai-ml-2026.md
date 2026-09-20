# The State of AI & ML — September 2026
### Historical foundations, modern systems, frontier research, and the 2026 landscape

*Converted from the source PDF (50 pp, 26 chapters). Evidence cutoff September 18, 2026.*


## How to use this guide

Artificial intelligence is a collection of approaches to perception, prediction, reasoning, decision-making, and
action. Modern foundation models connect many of these activities through shared representations and
interfaces, but they do not replace the statistical, causal, optimization, and systems principles that make reliable
engineering possible. The central argument of this guide is that capability belongs to a complete system: data,
learned model, inference procedure, tools, environment, evaluation, and human institutions all contribute.
This is a broad technical synthesis, not an exhaustive inventory of every paper or product. It assumes linear
algebra, multivariable calculus, probability, basic optimization, and programming. The chapters develop
conceptual connections, equations, practical failure modes, and research questions. The paper catalog supplies
historical anchors; the reading curriculum turns them into an executable study plan. Read Chapters 1-8 in
order, then follow application interests, and return to the evaluation and systems chapters before deploying
anything consequential.
Dates refer to first public versions unless a publication year is explicitly specified. Bracketed reference IDs
resolve to the bibliography. Papers with long author lists use the first author and “et al.”; the linked original
contains the complete list. Historical influence statements in the catalog are this guide's synthesis, not claims
that one paper was the sole origin of a field.
Evidence labels have specific meanings. Established describes a mathematical result under stated assumptions
or a method with substantial accumulated evidence. Demonstrated describes a result in a particular experiment
or benchmark. Emerging describes a promising direction with limited validation. Contested describes an
interpretation for which assumptions, measurements, or opposing evidence materially affect the conclusion.
Developer-reported means that an organization reports a result about its own system; it does not imply
independent replication.
The 2026 landscape is a snapshot through September 18, not through the end of the month. Stanford's AI Index
2026 is a major landscape source, but its underlying observations often concern 2025 or early 2026. Recent
primary announcements supplement it. Public reports do not reveal every frontier model's data, compute,
architecture, or training recipe. Unknown details remain unknown here; benchmark scores and marketing
language are not used to infer undisclosed mechanisms.

## 1 A map of the field

### 1.1 Five complementary ways to classify AI

A useful taxonomy has several axes rather than a single family tree. By objective, systems predict labels,
estimate distributions, generate observations, choose actions, infer causes, or solve constraints. By supervision,
learning can use labeled examples, unlabeled observations, self-generated targets, preferences, or rewards. By
representation, it can operate on explicit symbols, probabilities, vectors, graphs, programs, or hybrids. By
environment, it can be offline, interactive, embodied, adversarial, or nonstationary. By deployment, it can be a
fixed predictor, an assistant, an autonomous policy, or a tool embedded in a larger workflow.
Deep learning is a subset of machine learning, while machine learning is one route to AI. Search, automated
theorem proving, planning, constraint programming, and knowledge representation remain AI even when
nothing is learned. Conversely, a regression used for demand forecasting is ML without requiring humanlike
reasoning. A language model agent can combine a neural policy with symbolic software, database retrieval,
probabilistic estimation, and explicit search. These categories overlap in working systems.

Axis

Main branches

Engineering question

Task

Prediction, generation, control,
inference, discovery

What observable outcome defines success?

Learning signal

Supervised, self-supervised,
unsupervised, reinforcement,
preference

Who or what supplies the target?

Structure

Tabular, sequence, image, graph,
geometry, multimodal

Which invariances should the model respect?

Reasoning

Amortized neural inference, search,
symbolic deduction, causal
inference

What must be computed afresh for each problem?

Adaptation

In-context, retrieval, fine-tuning,
online, continual

Where is new information stored?

Assurance

Calibration, robustness, fairness,
security, interpretability

Which failures matter and how are they detected?

### 1.2 The system as the unit of analysis

Figure 1 presents the field as a pipeline with feedback. Data construction determines which regularities can be
learned. Optimization compresses those regularities into parameters. Post-training changes the distribution of
behavior. Inference allocates computation to a particular request. Tools connect outputs to external facts and
effects. Evaluation and monitoring test whether those effects match the intended objective. Feedback can
improve any stage, but it can also reinforce selection bias or reward exploitation.

Figure 1. The complete AI system and its feedback loop.

For an engineer, this map prevents category mistakes. More parameters may not fix missing access
permissions. Retrieval cannot repair an incorrect source. A larger context window does not guarantee that
relevant evidence is used. A reward model is not a specification of human welfare. A formally verified
subroutine cannot certify the natural-language assumptions that selected its inputs. Many failures attributed to
“the model” are failures of composition.
The mathematical thread is optimization under uncertainty. We choose a hypothesis class, collect imperfect
observations, optimize a surrogate, and evaluate generalization under constraints. Constraints include latency,
memory, energy, privacy, data rights, and the cost of an error. The most sophisticated system is not necessarily
the best choice: a calibrated linear model with reliable data may outperform an expensive generative workflow
on a narrow operational objective. This is an architectural conclusion, not a claim that classical methods
universally outperform deep models.

## 2 Historical foundations and the chronological arc

### 2.1 Symbols, neurons, and early optimism

McCulloch and Pitts modeled neurons as logical units in 1943, connecting neural computation to formal logic.
Turing's 1950 paper reframed machine intelligence through behavior and the imitation game. The 1955
Dartmouth proposal, followed by the 1956 workshop, helped establish artificial intelligence as a research
agenda. Early programs pursued theorem proving, game playing, language, and general problem solving. Search
through explicit states and rules made reasoning inspectable, but the number of possible states grew rapidly.
[R01-R03]
Rosenblatt's perceptron learned a linear decision boundary from examples. Its importance was the idea that
behavior could be acquired through adaptation rather than manually enumerated rules. A single linear
threshold unit cannot represent XOR in its original input space; that limitation is not a limitation of all neural
networks. The later history is often oversimplified into “one criticism stopped connectionism.” Funding,
hardware, data, and expectations all mattered. Neural and symbolic research continued through changing
institutional support. [R04]
Expert systems in the 1970s and 1980s encoded domain knowledge as rules. DENDRAL and MYCIN
demonstrated the usefulness of narrow expertise; systems such as XCON showed commercial value in
configuration. Their bottlenecks included eliciting knowledge, resolving inconsistent rules, representing
uncertainty, and maintaining brittle assumptions as the world changed. AI winters were periods of reduced
funding and confidence after ambitious promises exceeded deliverable capability, rather than periods with no
scientific progress.

### 2.2 Statistical learning and the deep learning resurgence

Statistical approaches made uncertainty, sample complexity, and held-out evaluation central. Bayesian
networks structured conditional dependencies; hidden Markov models supported speech and sequence
analysis; kernel methods supplied powerful nonlinear predictors; bagging and boosting combined weak or
unstable learners. These developments were not a detour. Their concerns about inductive bias, uncertainty,
regularization, and evaluation remain essential to foundation models. [R07-R12]
Backpropagation became widely influential in the 1980s as a practical means of learning internal
representations. CNNs added spatial weight sharing, while recurrent networks and later LSTMs addressed
sequences. The 2000s brought better datasets, accelerators, initialization, nonlinearities, optimization, and
software. ImageNet organized large-scale visual recognition; AlexNet's 2012 result made the combination of
learned features, GPU training, and large labeled data hard to ignore. No single ingredient explains the
transition. [R05-R06, R13-R16]

### 2.3 Timeline of interacting developments

Period

Milestone or transition

Lasting technical consequence

1943-1956

Logical neurons, Turing, Dartmouth

Computation, learning, and reasoning become explicit research
objects

1957-1960s

Perceptrons, heuristic search, early
language systems

Learned classifiers coexist with symbolic state-space methods

1970s-1980s

Expert systems and funding
contractions

Domain knowledge proves useful; maintenance and brittle
assumptions become visible

Period

Milestone or transition

Lasting technical consequence

1980s-1990s

Backpropagation, Bayesian
networks, SVMs, boosting

Representation learning and statistical generalization mature
together

1997-2009

LSTM, practical CNNs, ensembles,
large datasets

Sequence memory and scalable supervised learning improve

2012-2016

AlexNet, embeddings, seq2seq,
attention, ResNet, AlphaGo

Deep learning spreads across perception and decision-making

2017-2020

Transformers, BERT, GPT, selfsupervision, scaling studies

Pretraining and adaptation become a reusable development
pattern

2021-2023

CLIP, diffusion, instruction tuning,
retrieval and tool use

Foundation models become multimodal and interactive

2024-2025

Reasoning post-training, inference
Capability depends increasingly on verifiers, tools, and trajectory
scaling, coding and computer agents budgets

January-September
2026

Rapid model updates, embodied
systems, science tools, evaluation
revision

Deployment and measurement become as important as headline
capability

History is not a sequence of complete replacements. Modern agents revive planning; retrieval revives external
knowledge; neural theorem provers combine learning with formal deduction; probabilistic forecasting returns
distributions rather than point answers. Recognizing these recurrences helps distinguish a new
implementation from a new underlying problem.

## 3 Statistical learning, kernels, ensembles, and probabilistic models

### 3.1 Risk, generalization, and regularization

For observations (x_i, y_i), empirical risk minimization chooses parameters that reduce average training loss.
Regularization encodes a preference among solutions, for example smaller coefficients or smoother functions.
The population risk is an expectation over the deployment distribution, which is not directly available. A low
training error therefore establishes successful optimization, not successful deployment.

Bias-variance reasoning explains why a flexible estimator may fit sample noise while a rigid estimator misses
real structure. Modern overparameterized networks complicate the simplest U-shaped picture: interpolation
and double-descent phenomena show that parameter count alone is a poor proxy for effective complexity. Data
geometry, optimization, implicit regularization, and the evaluation distribution matter. Cross-validation must
respect the unit of independence: patients, users, devices, geographic sites, or time periods often require
grouped or temporal splits.
Classification probability is not decision quality. With asymmetric costs, the optimal decision threshold
depends on false-positive and false-negative losses and class prevalence. Calibration asks whether predicted
probabilities match observed frequencies. Discrimination asks whether positives rank above negatives. A

model can be well ranked and poorly calibrated. Under distribution shift, both may degrade; recalibration
cannot recover information absent from the features.

### 3.2 Kernels and ensembles

A support vector machine maximizes a margin while penalizing violations. With y_i in {-1, +1}, the soft-margin
objective combines half the squared weight norm with hinge loss. The kernel trick replaces an inner product in
an implicit feature space with k(x, x′), allowing nonlinear boundaries without explicitly constructing all
features. Valid positive-semidefinite kernels correspond to inner products in a reproducing kernel Hilbert
space. The computational burden of large kernel matrices motivates approximations and careful scaling. [R08]

Bagging reduces variance by averaging models trained on resampled data. Random forests add feature
randomization to decorrelate trees. Boosting builds an additive predictor, sequentially correcting residual
errors or following a functional gradient. Gradient-boosted trees are often strong baselines for heterogeneous
tabular data, particularly when sample sizes are moderate and feature engineering is meaningful. Their
practical strengths do not eliminate leakage, subgroup error, or extrapolation problems. [R09-R11]

### 3.3 Bayesian and graphical perspectives

Bayesian inference combines a likelihood with prior beliefs to produce a posterior. Predictive uncertainty
averages over parameter uncertainty instead of substituting a single estimate. Exact inference is frequently
intractable, leading to Markov chain Monte Carlo, variational inference, Laplace approximations, and structured
approximations. Aleatoric uncertainty concerns variability conditional on available information; epistemic
uncertainty concerns imperfect knowledge of the model or its parameters. The separation depends on
modeling choices. [R07, R12]

Graphical models express factorization and conditional independence. Directed acyclic graphs factor a joint
distribution into conditional distributions; undirected models use potentials; hidden Markov models impose a
latent Markov structure. Belief propagation, dynamic programming, and variational methods exploit this
structure. A Bayesian network is not automatically causal: causal interpretation requires assumptions about
interventions and the generating process. These distinctions become crucial when a model is asked what will
happen if an organization changes its policy.

## 4 Deep learning and representation learning

### 4.1 Learning intermediate features

A deep network composes differentiable transformations. Each layer maps the previous representation into a
new coordinate system in which useful patterns may be easier to separate. Backpropagation applies the chain
rule in reverse through the computational graph, reusing intermediate derivatives. It is an efficient gradient
algorithm, not a theory that every local optimum generalizes or that the brain uses the same mechanism.
Rumelhart, Hinton, and Williams helped demonstrate the representation-learning consequences of this
approach. [R05]

Stochastic gradient descent estimates the gradient from a minibatch. Momentum smooths updates across steps;
Adam rescales coordinates using moving estimates of first and second moments. Learning-rate schedules,
weight decay, gradient clipping, normalization, initialization, and numerical precision are part of the training
method. They alter stability and effective regularization. Reporting “the architecture” without these choices
rarely specifies a reproducible experiment. [R17]
CNNs exploit locality and translation-related structure through shared filters. This reduces parameters and
encodes an inductive bias appropriate to many images. Pooling trades exact location for tolerance, while
striding and resizing can introduce aliasing. ResNet uses an identity shortcut so a block learns a residual
correction. The derivative includes a direct identity path, helping optimization of deeper networks; residual
connections do not make all gradients stable in every architecture. [R06, R18]

### 4.2 Self-supervision and useful invariances

Representation learning includes autoencoders, contrastive learning, masked prediction, clustering-based
targets, and predictive coding. An autoencoder reconstructs inputs through a bottleneck; without constraints,
reconstruction may favor details irrelevant to the downstream task. Contrastive learning makes related views
similar and unrelated views distinguishable. Its success depends on which transformations preserve semantic
identity. An augmentation suitable for object recognition may destroy medically important evidence or text
orientation.
Self-supervised learning derives training targets from the data itself. Language modeling predicts withheld
tokens; masked image modeling reconstructs or predicts hidden patches; contrastive vision-language training
aligns paired modalities. “Self-supervised” does not mean free of human choices: corpus collection, filtering,
captions, augmentation, and loss design carry substantial supervision. Nor does it guarantee label-free
evaluation. [R27-R29]
For a contrastive pair, the InfoNCE-style loss compares the positive similarity against a set of alternatives.
Temperature controls how sharply differences in similarity influence the loss. Batch composition and false
negatives matter: two semantically equivalent examples may accidentally be pushed apart. Evaluation should
test both a frozen representation and a fine-tuned model because they answer different questions about
reusable information.

A practical experiment separates representation quality from downstream capacity. Freeze an encoder, train a
linear probe, then compare with end-to-end adaptation at matched data budgets. Test distribution shifts and
minority subgroups. If a large improvement disappears under a stronger baseline or a corrected split, the
representation claim was overstated. This experimental discipline is as relevant to a small image classifier as to
a multimodal foundation model.

## 5 From word embeddings to Transformers

### 5.1 Sequence modeling before attention

Distributional word embeddings represent words as vectors learned from neighboring words. Word2vec made
efficient local prediction especially influential; GloVe emphasized global co-occurrence statistics. Geometry
captured useful similarities, but a single vector per word conflates senses and reflects corpus biases. Contextual
models later made a token's representation depend on its surrounding sequence. [R19-R20]
Recurrent networks process sequences through a state h_t = f(h_{t-1}, x_t). Backpropagation through time
multiplies Jacobians across steps, making vanishing and exploding gradients a central difficulty. LSTM gates
control information flow and provide a more persistent cell state. Encoder-decoder seq2seq models mapped an
input sequence to an output sequence, but compressing a long input into one fixed vector created a bottleneck.
Attention let the decoder access different encoder states at each output step. [R13, R21-R22]

### 5.2 Attention as content-addressed computation

Scaled dot-product attention computes similarities between queries and keys, normalizes them, and uses the
weights to combine values. Multiple heads allow different projections and relations. Positional information is
necessary because attention alone does not encode sequence order. Causal masking prevents a language model
from reading future tokens during next-token training. [R23]

Here Q, K, and V are learned projections of token representations; M contains masking values. The square-root
factor moderates the scale of dot products as key dimension grows. A Transformer block combines attention, a
positionwise feed-forward transformation, normalization, and residual connections. Attention is a mechanism
for routing information, not proof that a model's attention weights explain its final decision.
For n tokens, conventional dense attention forms n² pairwise scores. Training can process token positions in
parallel, unlike a strictly sequential recurrent update, though autoregressive generation still produces new
tokens sequentially. Encoder-only architectures such as BERT use bidirectional context and masked objectives;
decoder-only GPT-style models use causal factorization; encoder-decoder systems naturally condition one
sequence on another. [R23-R25]

### 5.3 What next-token prediction does and does not imply

Predicting text can reward learning syntax, facts, discourse, code patterns, and latent structures that support
reasoning. The objective alone does not tell us which algorithm a trained model implements. It also does not
guarantee truth: plausible continuations can be wrong, contradictory, or unsupported. A model can internalize
a useful computation while failing systematically outside its training distribution.
Tokenization influences sequence length, multilingual efficiency, spelling behavior, and numerical processing.
Perplexity comparisons are meaningful only with compatible tokenization and evaluation data. In-context
learning changes behavior through the input sequence without necessarily updating weights. It can resemble

task inference, pattern matching, or execution of a learned algorithm; these explanations are not mutually
exclusive across tasks and layers. An engineer should test the specific generalization needed rather than infer it
from fluent output.

## 6 Foundation models, scaling, and data

### 6.1 Pretraining as a reusable investment

A foundation model is trained broadly enough to support many downstream uses through prompting,
adaptation, or composition. The term describes a development role and associated societal consequences
rather than one architecture. Pretraining amortizes a large investment across tasks, while adaptation trades
generality for domain performance, cost, or control. Foundation models may operate over language, vision,
audio, molecules, time series, or combinations. [R30]
Scaling studies fit empirical relationships between validation loss and model size, data, and compute. A
common simplified form combines an irreducible term with power-law contributions from parameter count N
and token count D. Under a fixed training budget, allocation matters as much as scale. The Kaplan and
Chinchilla studies differed in their experimental regimes and resulting allocation prescriptions. These are
empirical models, not universal laws of intelligence. [R31-R32]

The compute approximation applies to a conventional dense Transformer regime and omits important details
such as attention costs, sparsity, and hardware utilization. It should not be used as a precise accounting formula
for arbitrary multimodal or mixture-of-experts systems. Training-optimal allocation also differs from lifetimecost-optimal allocation: a smaller model trained longer can be preferable when it will serve many requests.
[R33]

### 6.2 Data quality is a multidimensional property

Useful data must be relevant, diverse, legally usable, well documented, and compatible with evaluation
boundaries. Deduplication reduces repeated memorization and accidental leakage. Filtering may improve
average quality while erasing minority language, dialect, or unusual scientific content. Domain mixture weights
change which abilities receive optimization pressure. A dataset with more tokens may contain less new
information than a smaller, carefully constructed collection.
Synthetic data can provide instructions, reasoning traces, adversarial examples, code tasks, or simulated
interactions. Its value depends on an independent signal: execution tests, formal proof checking, environmental
rewards, human review, or diversity from a different source. Repeatedly training on unfiltered model outputs
can amplify mistakes and underrepresent distribution tails. Model collapse results concern particular recursive
replacement or mixing conditions; they do not establish that all synthetic data is harmful. [R53-R54]

### 6.3 Measuring scaling claims responsibly

“Emergence” can refer to a sharp change in a measured score, a genuinely new algorithm, or an observer's
inability to predict a capability. These are different claims. Thresholded exact-match metrics can turn smooth
improvements in token probabilities into apparently abrupt jumps. Conversely, smooth average loss does not
rule out meaningful qualitative changes. Plot continuous metrics, inspect individual behavior, and compare
matched-compute baselines before interpreting a discontinuity. [R55]

Data limitations are partly economic and institutional. High-quality interaction, proprietary domain data, rare
languages, and reliable negative examples are expensive. Simulators and self-play create data but encode
assumptions about the world. A promising research question is not simply “Will text run out?” but “Which
additional observations or experiments yield the greatest improvement per unit cost?” Active learning,
curriculum design, and scientifically grounded feedback address that more actionable question.

## 7 Instruction tuning and post-training

### 7.1 From continuation to useful behavior

Pretraining produces a distribution over continuations. Supervised fine-tuning teaches a desired interaction
format by optimizing likelihood on demonstrations. Instruction tuning broadens the task distribution so the
model responds to natural-language requests. Data selection, response quality, coverage, and handling of
uncertainty matter more than simply accumulating many instruction pairs. A model can learn a polished
response style without acquiring the underlying factual or reasoning competence.
RLHF commonly collects comparisons between outputs, fits a reward model, then optimizes a policy to obtain
high reward while constraining divergence from a reference. InstructGPT established a particularly influential
implementation of this recipe. Preference optimization can improve perceived usefulness even when the model
is smaller than a less carefully post-trained alternative. The result concerns a specified preference distribution,
not universal alignment. [R34]

The reward model is a learned proxy. Optimizing it too aggressively can exploit its blind spots, favor verbosity,
or create agreeable but false answers. The KL penalty constrains change; it does not make the reward correct.
PPO uses a clipped policy-ratio objective to limit excessively large updates. Online sampling, reward evaluation,
reference probabilities, and policy updates introduce substantial systems and statistical complexity. [R35]

### 7.2 Preferences, constitutions, and verifiable rewards

Direct Preference Optimization derives a pairwise objective from a KL-regularized reward formulation. For a
preferred response y+ and rejected response y-, it increases the preferred response's log-probability ratio
relative to a reference. It avoids fitting a separate explicit reward model in its basic form. Its derivation and
empirical usefulness do not establish that every preference dataset is consistent or unbiased. [R36]

RLAIF substitutes or supplements human judgments with model-generated feedback. Constitutional AI uses
written principles to guide critique, revision, and preference generation. This can scale supervision and make
some normative choices explicit, but the judging model can share errors with the model being trained. The
constitution's authorship, ambiguity, cultural scope, and conflict resolution remain substantive design
questions. [R37]
Reinforcement learning with verifiable rewards uses outcomes such as passing tests or matching a
mathematically checkable answer. Verification can provide a stronger signal than subjective preference, but
only for the property being checked. A program may pass incomplete tests while being insecure; a numerical
answer may be correct for the wrong reason; a proof may formalize a statement that differs from the intended
question. General tasks often lack cheap, reliable verifiers.

### 7.3 A practical post-training experiment

Start from a fixed base model and retain an untouched test set. Compare supervised fine-tuning, preference
optimization, and any online RL stage under matched budgets. Evaluate task correctness, calibration, refusal
appropriateness, style, subgroup performance, and regression on unrelated tasks. Keep training prompts
distinct from evaluation prompts at the level of underlying problems, not just surface wording.
An ablation should isolate whether improvement comes from better data, additional sampling, reward quality,
or the optimization algorithm. Report the cost of generating training trajectories and the judge's error rate.
Rejection sampling followed by supervised learning can be a strong baseline: if it achieves similar gains, a
complicated RL system needs a more specific justification. Post-training is an experimental pipeline, not a
magic transformation from prediction into reliable agency.

## 8 Reasoning models and inference-time computation

### 8.1 Computation before the answer

Chain-of-thought prompting demonstrated that intermediate textual steps can improve some reasoning tasks.
Self-consistency samples multiple solutions and aggregates answers. Explicit search explores alternative
trajectories using a value function or verifier. A reasoning model is trained or configured to allocate more
computation before producing its final answer. These mechanisms can coexist; a long visible explanation does
not establish which mechanism is responsible for success. [R38-R40]
DeepSeek-R1 provides a documented example of large-scale reasoning-oriented reinforcement learning. R1Zero investigated RL directly from a pretrained base without an initial supervised fine-tuning stage; R1 used a
multistage pipeline including cold-start data. “RL-only” in this context does not mean the model learned
language and reasoning from random initialization. The pretrained model supplied extensive prior capability.
[R41]
If independent candidate attempts each succeed with probability p, at least one of k attempts succeeds with
probability 1-(1-p)^k. This illustrates the potential of sampling, but the independence assumption is often false
and a system still must identify the correct candidate. Correlated mistakes and imperfect verifiers sharply
reduce the practical gain. A best-of-k result with an oracle selector is not equivalent to a deployable system.

### 8.2 Allocation and the verifier bottleneck

Inference compute can be spent on longer trajectories, parallel candidates, critique, external retrieval, program
execution, or tree search. The optimal allocation depends on problem difficulty and how informative feedback
is. Snell and colleagues show why adaptive allocation can outperform a fixed strategy in studied settings. Their
findings do not imply that inference compute can always substitute for pretraining, especially when necessary
knowledge or reasoning primitives are absent. [R40]
A useful decision model chooses compute budget c to maximize expected utility U(c) minus a cost term λc. The
utility curve may flatten or even decline if extra steps introduce errors. A stopping policy should consider
uncertainty, value of additional information, latency, and the cost of being wrong. “Think longer” is not a
universal prescription.
Reasoning traces need not be faithful explanations of internal computation. A model can omit influential factors
or rationalize a conclusion. Training directly against a monitored trace may change what is observable.

Verification of the final artifact, intervention on internal representations, and external behavioral testing
answer different questions. None should be treated as a complete substitute for the others.

### 8.3 Learned reasoning versus explicit search

Learned reasoning amortizes experience into parameters, making inference fast when the task resembles
training. Search spends computation on the particular instance, allowing alternatives to be explored and
checked. AlphaGo and AlphaZero demonstrate the productive combination of learned policy/value functions
and tree search in environments with clear rules. Formal theorem proving similarly combines a learned
proposer with a trusted checker. [R42-R43]
The open issue is how these combinations generalize to ambiguous real environments. Search requires a useful
state representation, transition model, and evaluation signal. Language can describe candidate plans cheaply,
but those descriptions may not correspond to executable world states. A serious reasoning evaluation therefore
tests invariance to irrelevant wording, compositional novelty, longer horizons, tool errors, and changed
assumptions. Successful examples are evidence of capability; robust distributions of success and failure are
evidence about reliability.

## 9 Retrieval, context, memory, and agents

### 9.1 Retrieval and long context solve different bottlenecks

Retrieval-augmented generation conditions a generator on external evidence. A common pipeline parses
documents, chunks them, indexes lexical and dense representations, retrieves candidates, reranks, and
constructs an evidence-bearing prompt. Lewis and colleagues supplied an influential learned formulation
combining parametric and nonparametric memory. Modern implementations often use modular retrieval
without end-to-end training. [R44]
Chunk boundaries should preserve meaning and provenance. A paragraph separated from its table header can
become misleading; a retrieved policy may have been superseded. Hybrid search combines exact lexical
matching with semantic similarity. Reranking improves precision at additional cost. Access-control filtering
must happen before evidence reaches the model, not merely before the final answer is displayed.
Long context allows more information into one request but increases prefill work, memory, and the burden of
selecting relevant evidence. Needle retrieval is a narrow diagnostic; synthesis across conflicting sources is
harder. Lost-in-the-middle results illustrate positional sensitivity in tested models and tasks. Test the actual
document distribution and context layout rather than assume a nominal token limit is an effective reasoning
span. [R45]

### 9.2 Four kinds of memory

Parametric memory resides in weights and is difficult to update precisely. Working memory resides in the
current context. Episodic memory stores past events or interactions externally. Semantic memory stores
consolidated facts or abstractions. A persistent database is not automatically useful memory: records need
provenance, timestamps, permission boundaries, retrieval policies, correction, and deletion. Incorrect
summaries can become self-reinforcing when later retrieval treats them as facts.
Fine-tuning, retrieval, and context construction should be chosen according to the update. New policies and
changing facts generally favor an authoritative external store. Repeated behavior or specialized output formats
may favor adaptation. Large task-local evidence may favor context. These are engineering defaults, not strict
boundaries; combinations are common and should be evaluated against cost and correctness.

### 9.3 The agent loop

An agent observes state, proposes an action, invokes a tool, evaluates the result, and repeats until a stopping
condition. ReAct made the interleaving of reasoning and action influential; Toolformer explored learning tooluse decisions; Reflexion explored using verbal feedback as external experience. The word agent covers a wide
spectrum from a scripted workflow with model calls to a policy choosing its own sequence of actions. [R46R48]

Figure 2. An agent loop with validation, bounded actions, and recovery.

The controller should maintain explicit task state, budgets, action permissions, and durable observations. Tool
outputs are evidence, not privileged instructions. Actions that change external state require idempotency,
validation, and recovery plans. Computer-use agents introduce perception uncertainty: a click may target the
wrong element, a page may change, and visual appearance may not reveal underlying application state.
Structured APIs are often easier to validate when available.
For a simplified sequence of m necessary steps with independent per-step success q, end-to-end success is
q^m. At q = 0.99 and m = 100, this is about 0.366. Real errors are dependent and recovery can help, so this is
not a performance forecast; it illustrates why long-horizon reliability needs checkpoints and repair. Multi-agent
designs can provide specialization or independent criticism, but they also increase coordination cost and can
share correlated errors. More agents do not automatically create independent evidence.

## 10 Vision and multimodal understanding

### 10.1 From classification to structured perception

Computer vision spans classification, detection, segmentation, tracking, depth, optical flow, pose,
reconstruction, and visual reasoning. ImageNet and AlexNet accelerated supervised recognition; ResNet
improved deep optimization; vision Transformers applied patch-token processing at scale. Detection adds
localization and set prediction; semantic segmentation assigns categories to pixels; instance segmentation
distinguishes individual objects. These objectives require different metrics and error analyses. [R14-R16, R18,
R26]
For detection, intersection-over-union compares predicted and true regions. Average precision aggregates
precision-recall behavior at chosen overlap thresholds. A high aggregate score may conceal failures on small
objects, unusual lighting, occlusion, or rare classes. Dataset labels encode ontology choices: what counts as an
object, which objects matter, and what ambiguities annotators resolve.
CLIP learns representations from paired images and text, enabling classification through text descriptions
without a conventional task-specific classifier. SAM makes segmentation promptable, while self-supervised
visual encoders such as DINO learn reusable features from unlabeled images. Open-vocabulary capability
changes the interface but does not remove domain shift or guarantee grounded recognition. [R28-R29, R49]

### 10.2 Multimodal fusion and grounding

Vision-language systems may connect a visual encoder to a language model through a projector, use crossattention, or train unified token processing. Their apparent reasoning can fail at the perceptual stage: an
incorrect axis reading contaminates an otherwise coherent chart explanation. OCR, spatial relations, counting,
fine detail, and multi-image comparison deserve separate tests. A fluent description may rely on textual priors
instead of the image.
Multimodal alignment means related observations share useful representations; grounding means symbols are
tied to relevant entities, observations, or actions. Alignment does not imply complete grounding. For example, a
model may align a photograph with a caption about a cup without knowing whether that cup can be safely
grasped from a particular pose. Embodied tasks require geometry, dynamics, and consequences beyond
semantic association.
Video adds time, persistence, and causality. Frame sampling can miss a brief but decisive event. A system may
recognize objects correctly while reversing temporal order or inferring an action that never occurred.
Evaluation should distinguish event detection, tracking, long-video retrieval, temporal reasoning, and causal
interpretation. Audio and visual streams may disagree; fusion systems need a policy for conflict rather than
blindly averaging evidence.

### 10.3 Geometric and scientific vision

Three-dimensional learning uses point clouds, meshes, voxel grids, implicit fields, and differentiable rendering.
NeRF popularized neural radiance fields for view synthesis; Gaussian splatting provided an efficient explicit
representation for rendering. Photorealistic reconstruction does not guarantee physically accurate geometry,
material properties, or collision behavior. Those distinctions matter for robotics, surveying, and simulation.
Medical and industrial imaging often has small datasets, expensive labels, and severe consequences for rare
errors. Patient-level splits, site transfer, acquisition protocols, and calibration are central. A visual foundation
model should be compared with strong specialized baselines and tested under realistic shifts. General
pretraining may help representation quality, but deployment requires evidence specific to the imaging
modality and intended decision.

## 11 Speech, audio, music, and generative media

### 11.1 Listening and speaking

Speech recognition maps audio to text, historically using probabilistic acoustic and language models and
increasingly using end-to-end neural systems. Connectionist temporal classification sums over alignments
between frames and tokens; attention-based encoder-decoders learn another alignment route. Wav2vec 2.0
uses self-supervised audio representations; Whisper demonstrates large-scale weakly supervised speech
recognition. Word error rate measures substitutions, insertions, and deletions relative to a transcript, but it
does not capture every semantic or safety-relevant error. [R50-R51]
Speech synthesis separates or jointly learns linguistic content, prosody, speaker identity, and waveform
generation. Neural codecs compress audio into learned discrete representations that support language-modelstyle generation. Audio systems also perform diarization, separation, event detection, enhancement, and
soundscape understanding. Overlapping speech, accents, low-resource languages, background noise, and
domain-specific vocabulary remain important evaluation slices.
Music generation must coordinate structure at many timescales: waveform texture, notes, rhythm, phrases,
harmony, and long-form development. AudioCraft/MusicGen illustrates generation over compressed audio
tokens with text or melody conditioning. Perceptual quality, controllability, novelty, and preservation of

requested structure are distinct dimensions. A short pleasing sample does not establish coherent long-form
composition. Training-data rights, voice consent, and attribution are additional system requirements. [R52]

### 11.2 Generative families

Autoregressive models generate one component conditioned on previous components. Variational
autoencoders learn a latent-variable model by optimizing a tractable lower bound on likelihood. GANs train a
generator against a discriminator, producing sharp samples but potentially suffering instability and mode
dropping. Diffusion models learn to reverse progressive corruption; flow-matching methods learn vector fields
transporting a simple distribution toward data. These families share probabilistic ideas but make different
tradeoffs in training, sampling, and controllability. [R56-R60]

In a common diffusion parameterization, a noisy sample is a weighted combination of clean data and Gaussian
noise. The network predicts the noise at a randomly chosen timestep. Denoising repeatedly at inference creates
a sample. Latent diffusion moves much of this process into a compressed representation, reducing computation
while inheriting the autoencoder's information loss. [R58-R59]

The conditioning c can include text, an image, pose, depth, or an editing mask. Guidance strengthens adherence
to conditioning but can reduce diversity or distort samples. Fewer sampling steps improve latency, sometimes
at a quality cost; distillation and improved solvers alter that tradeoff. Evaluation must specify resolution,
duration, conditioning, and compute budget.

### 11.3 Video generation and world simulation

Video generation adds temporal consistency, identity persistence, camera motion, and physical interactions.
Impressive visual continuity does not establish a valid simulator for planning. A simulator must respond
correctly to interventions, preserve hidden state, and represent the consequences of actions over the relevant
horizon. A generated video may look plausible while violating conservation, contact, or causality.
Metrics such as FID summarize feature-distribution differences and can miss semantic errors, memorization, or
prompt failure. Human comparisons are useful but sensitive to presentation and sampling. For an imageediting application, preservation of unedited content may matter more than global aesthetics. For a scientific
simulator, calibrated physical error matters more than realism. Evaluate against the purpose of generation
rather than one universal quality score.

## 12 Reinforcement learning, robotics, and autonomous systems

### 12.1 Learning from consequences

An MDP specifies states, actions, transition probabilities, rewards, and a discount factor. A policy chooses
actions to maximize expected cumulative reward. The Bellman equation decomposes value into immediate
reward and discounted future value. Model-free algorithms learn values or policies directly; model-based
methods learn or use a transition model for planning. Partial observability requires a history or belief state
instead of assuming the current observation is sufficient. [R61-R63]

DQN combined neural value approximation with replay and target networks; policy-gradient methods optimize
action probabilities; actor-critic methods combine policy and value estimation. PPO prioritizes practical update
stability, while maximum-entropy approaches such as SAC encourage useful exploration in continuous control.
Offline RL learns from a fixed dataset and must avoid assigning unjustified value to actions poorly represented
in that dataset. [R35, R61-R64]
Reward design is specification design. A robot rewarded for moving quickly may damage its environment; an
assistant rewarded for user approval may become sycophantic. Sparse rewards make exploration difficult,
while dense proxies can be exploited. Reward shaping has theoretical invariance results under particular
conditions, but arbitrary shaping can change the optimal policy. Safety constraints and reward penalties are not
interchangeable in general.

### 12.2 Embodied intelligence and VLA models

Robotics adds sensors, actuation, contact, delays, wear, and irreversible consequences. Classical estimation,
control, motion planning, and system identification remain central. A vision-language-action model maps
observations and instructions to action representations, often learning from heterogeneous demonstrations.
RT-2 and OpenVLA illustrate routes for transferring broad visual-language representations into robot behavior.
Diffusion policies model multimodal action sequences, supporting multiple valid ways to perform a task. [R65R67]
Demonstration learning can fail when small action errors move the robot into unfamiliar states. Interactive
data collection, corrective demonstrations, simulation, and reinforcement learning address parts of this
distribution shift. Sim-to-real transfer requires modeling or randomizing relevant dynamics, sensors, textures,
and delays. More visual diversity does not necessarily cover a new friction regime or actuator fault.
World models predict future observations or latent states conditional on actions. Dreamer learns policies using
imagined trajectories in a learned latent model. Planning can then be cheaper than interacting with the real
world, but model errors compound and the policy may exploit simulator inaccuracies. Latent prediction need
not reconstruct every pixel; it should preserve information relevant to reward and control. [R68]

### 12.3 Autonomy as an operating envelope

Autonomous driving combines perception, localization, prediction, planning, and control, whether modules are
explicit or learned jointly. Safety must be evaluated within an operational design domain: geography, weather,
roads, speeds, and allowed interactions. Aggregate distance traveled is insufficient without exposure conditions
and definitions of intervention and incident severity. Rare-event simulation helps but inherits the simulator's
blind spots.
For robots and vehicles, the relevant question is not whether a video demonstration looks general. It is whether
performance transfers across objects, environments, instructions, embodiments, and unexpected disturbances
with a measured failure rate. Human oversight is effective only if the human has enough time, information, and
authority to intervene. Emergency stops, conservative fallback behavior, and reliable state estimation are
architectural components, not evidence that a general policy is intrinsically safe.

## 13 Search, recommendation, graphs, and time series

### 13.1 Retrieval and ranking at scale

Search systems combine candidate generation with increasingly expensive ranking. Lexical retrieval captures
exact terms and rare entities; dense retrieval captures learned similarity; cross-encoders score a query and
candidate jointly. Recommendation adds user history, item features, context, and feedback loops. Matrix
factorization learns latent user and item factors, while two-tower systems make large-scale approximate
nearest-neighbor retrieval practical. The retrieval stage constrains what the ranker can ever select. [R69]
Clicks are not unbiased relevance labels. Position, interface, previous recommendations, and user exposure
affect what is observed. Optimizing engagement may select content that increases a measured short-term
action while reducing long-term satisfaction. Counterfactual evaluation uses logged propensities where valid,
but weak support makes estimates unstable. Online experiments remain important, with guardrails for
diversity, supplier fairness, retention, and user harm.
Recommendation is also a sequential decision problem: current actions influence future preferences and data.
Contextual bandits optimize one-step reward under exploration, while full RL models longer consequences.
More complex control is useful only when the additional state and reward assumptions are credible. A poorly
measured long-term objective can make an elaborate system worse than a simple, transparent ranking policy.

### 13.2 Graph learning

Graph neural networks update node representations by aggregating information from neighbors. The
aggregation should respect permutation invariance. Edge features, direction, heterogeneous node types, and
temporal structure can be essential. GCNs and GraphSAGE made message passing influential across semisupervised learning and inductive prediction. [R70-R71]

Repeated aggregation can oversmooth representations; distant information can be compressed through
narrow graph bottlenecks, producing oversquashing. Homophily assumptions fail when linked nodes tend to
have different labels. Graph splits also leak easily: allowing test-time edges or future interactions into training
can create a transductive advantage inconsistent with deployment. State whether the task predicts unseen
labels on a known graph, new nodes, new graphs, or future edges.

### 13.3 Time-series modeling

Forecasting includes point estimates, quantiles, full distributions, anomaly detection, classification, and
decision support. ARIMA, state-space models, exponential smoothing, boosted trees, recurrent networks,
temporal convolutions, and Transformers all remain relevant. Foundation models aim to transfer across series,
but benchmark mixtures can conceal failures on unusual frequencies, intermittent demand, or regime changes.
[R72]
Temporal evaluation must reproduce the information available at the forecast origin. Revised economic data,
future covariates, interpolation, and global normalization can leak information. Rolling-origin backtests reveal
performance across seasons and regimes. Compare with seasonal naive baselines and use metrics appropriate
to zero-valued or differently scaled series. Quantile loss and proper scoring rules assess probabilistic forecasts;
coverage alone can be improved trivially by making intervals uninformatively wide.
Decision quality may differ from forecast accuracy. Inventory, staffing, or energy dispatch impose asymmetric
costs and constraints. Evaluate the downstream policy, including uncertainty and delayed feedback. Causal

explanations of a time-series change require assumptions beyond predictive feature importance; a variable that
forecasts demand may not be an effective intervention.

## 14 Causality, adaptation, and privacy

### 14.1 Prediction is not intervention

Causal inference distinguishes observing X = x from setting X to x. A treatment may correlate with worse
outcomes because sicker patients receive it. A predictive model can exploit that correlation correctly while
giving a wrong answer about treatment effects. Structural causal models specify mechanisms among variables;
potential outcomes define outcomes under alternative treatments. Identification asks whether a causal quantity
can be determined from available data and assumptions, before estimation asks how to compute it. [R73-R74]
Under consistency, conditional exchangeability, and positivity, an average treatment effect can be identified by
adjustment over covariates X. These assumptions are substantive: hidden confounders violate exchangeability,
and no observed treatment overlap makes positivity fail. Flexible ML improves nuisance-function estimation
but cannot manufacture identification from an invalid design.

Double/debiased ML uses orthogonal scores and sample splitting or cross-fitting to reduce sensitivity to
nuisance estimation errors. Causal discovery tries to infer structure, but observational equivalence classes
often prevent unique recovery without interventions or extra assumptions. Causal representation learning asks
how meaningful causal variables can emerge from high-dimensional observations. It is an emerging program,
not a solved route to universal out-of-distribution generalization. [R74-R75]

### 14.2 Meta-learning and continual learning

Meta-learning optimizes how quickly a learner adapts across a distribution of tasks. MAML learns an
initialization from which a small number of gradient steps perform well. Metric-based methods learn an
embedding in which a few examples suffice. Success depends on the relationship between training tasks and
future tasks; few-shot performance within a familiar task family does not establish open-ended learning. [R76]
Continual learning faces the stability-plasticity dilemma: learning new information may overwrite earlier
competence, while excessive stability prevents adaptation. Replay retains old examples or generated
approximations; regularization constrains changes to important parameters; modular systems allocate new
capacity. EWC uses a Fisher-information-based importance estimate to discourage destructive updates.
Evaluate forward transfer, backward transfer, forgetting, memory cost, and performance after long task
sequences. [R77]
External memory can preserve facts without updating weights, but it does not solve every continual-learning
problem. The system still must learn when to retrieve, resolve contradictions, and incorporate new skills.
Machine unlearning adds a different requirement: removing the influence of selected data. Approximate
forgetting in outputs is not necessarily certified removal of training influence.

### 14.3 Federated and privacy-preserving learning

Federated averaging trains local models on distributed clients and aggregates their updates. It reduces central
collection of raw data, but client heterogeneity, availability, communication cost, poisoning, and representation
imbalance remain. Keeping data on a device does not by itself guarantee privacy: gradients and updates can
leak information. Secure aggregation hides individual updates from the aggregator under its threat model; it
does not automatically prevent inference from the final model. [R78]

Differential privacy bounds how much the output distribution changes when one protected unit's data changes.
DP-SGD clips per-example gradients and adds calibrated noise, with composition tracked over training. The
privacy unit, sampling method, accounting procedure, epsilon, and delta must all be reported. A large epsilon
can provide a weak guarantee even when a system is technically labeled differentially private. [R79]

Here D and D′ are neighboring datasets under the declared privacy unit. Homomorphic encryption, secure
multiparty computation, trusted execution environments, and differential privacy address different adversaries
and leakage channels. Their costs and guarantees differ. The engineering task begins by specifying who may
observe what, which information must be protected, and whether training, inference, outputs, or all three are in
scope.

## 15 AI for science and medicine

### 15.1 Prediction, design, and experimental feedback

Scientific AI can emulate expensive simulations, infer latent structure, propose experiments, search designs,
and organize literature. These roles differ epistemically. A surrogate predicts a quantity under a training
distribution. A design model proposes a candidate. An experiment tests whether the candidate works. A
scientific explanation additionally connects evidence to a mechanism. Combining these stages can accelerate
discovery, but skipping the validation stage turns predictions into unsupported claims.
AlphaFold 2 demonstrated exceptional protein-structure prediction using learned representations with
biological and geometric structure. AlphaFold 3 extends modeling to biomolecular interactions using a
diffusion-based approach. Structure prediction is not the same as predicting dynamics, binding affinity, cellular
effect, toxicity, or clinical benefit. Confidence measures help prioritize inspection but do not certify every
biological claim. [R80-R81]
RFdiffusion generates protein backbones under design constraints, illustrating how generative modeling can
create experimentally testable candidates. Sequence design, folding validation, expression, stability, binding,
and function are distinct stages. A successful computational filter can still leave many candidates that fail in the
laboratory. Closed-loop design is strongest when wet-lab measurements feed back into a carefully controlled
learning process. [R82]

### 15.2 Genomics, cells, and clinical systems

Sequence models predict regulatory activity, expression-related signals, and variant effects. Cell models
integrate transcriptomic and other molecular measurements, but batch effects and incomplete observation
complicate transfer. Perturbation prediction is especially demanding: correlations among cell states do not
automatically determine the effect of an intervention. Evaluation should hold out meaningful genes,
perturbations, cell types, or laboratories, depending on the intended use.
Medicine introduces workflow and causal questions beyond diagnostic accuracy. Retrospective discrimination
does not prove prospective benefit. Clinicians may react to an AI recommendation, altering the data-generating
process. A useful evaluation measures changes in decisions, patient outcomes, workload, equity, and errors
under realistic supervision. Data provenance, missingness, site shift, and label construction can dominate
model architecture. This guide discusses research methods, not patient-specific medical advice.

### 15.3 Weather, climate, materials, and physics

GraphCast demonstrated learned medium-range weather prediction, while GenCast models probabilistic
forecasts. Weather forecast skill must be measured against strong operational baselines at specified lead times,
variables, resolutions, and initialization conditions. Reanalysis datasets are reconstructed estimates, not direct
ground truth everywhere. A fast learned forecast can complement numerical weather prediction, observation
assimilation, and ensemble methods. [R83-R84]
Climate projection requires reasoning about changed forcing and distributions over decades. Good short-range
weather forecasting does not alone establish valid climate extrapolation. Conservation laws, uncertainty,
physical consistency, and extreme-event behavior matter. Hybrid physics-ML models can learn unresolved
processes or accelerate solvers while retaining known structure, but adding a physics penalty is not a universal
guarantee of correctness.
Materials discovery uses graph networks, interatomic potentials, generative structures, and active learning
over expensive simulations. Predicted thermodynamic stability does not imply synthesizability, kinetic
accessibility, or a useful manufactured material. GNoME exemplifies large-scale candidate discovery;
experimental confirmation and realistic baselines remain necessary. Neural operators learn mappings between
function spaces and can accelerate PDE-related tasks, subject to boundary conditions and distribution shift.
[R85-R86]

### 15.4 Mathematics and algorithm discovery

Formal proof assistants provide a rare combination: a large search space and a precise verifier. A learned
model can propose proof steps while the kernel checks validity. Natural-language proofs require additional
scrutiny because persuasive exposition can omit a crucial condition. AlphaGeometry combines learned
guidance with symbolic deduction; AlphaEvolve combines generated programs, evaluation, and evolutionary
search. [R87-R88]
The verifier defines what success means. Improving an algorithm on a benchmark may overfit the benchmark
or exploit an implementation defect. A mathematically proved construction has a different evidential status
from a speedup measured on one hardware configuration. The most promising scientific systems connect
proposals to checks that are independent of the proposer and preserve a clear audit trail from hypothesis to
result.

## 16 Coding and software-engineering agents

### 16.1 From completion to repository-level work

Code generation initially emphasized short functions and local completion. Repository-level work requires
locating relevant files, understanding APIs, changing multiple components, building, testing, reviewing, and
preserving system behavior. HumanEval measures a narrow function-synthesis setting; SWE-bench introduced
real repository issues with executable evaluation. Computer and terminal benchmarks extend the action space
further. [R89-R91]
A coding agent benefits from an explicit loop: inspect the issue and repository, form a bounded hypothesis,
make a change, execute relevant checks, interpret failures, and revise. Tests are tools for falsifying a proposed
fix, not ceremonial proof that a patch is correct. An agent can accidentally weaken a test, alter the environment,
or fix only the visible example. Hidden tests, independent review, and specification-based checks help
distinguish repair from benchmark gaming.

### 16.2 What to measure

Measure functional correctness, regressions, security, maintainability, review burden, and elapsed human
effort. Report the repository snapshot, dependency environment, tool access, time budget, sampling count, and
whether internet access was permitted. A model with a powerful scaffold and multiple attempts should not be
compared directly with a single-shot model lacking tools. Cost per accepted change is often more useful than
raw token throughput.
Developer productivity studies can disagree because participants, tasks, repositories, and measurement
methods differ. Completing a familiar small task faster does not establish faster architectural work in a mature
system. Self-reported productivity differs from measured completion time, and generated code volume differs
from useful software. The right unit is a validated outcome under a realistic workflow.

### 16.3 Security and research automation

Agents executing code need isolated environments, restricted credentials, dependency provenance, and
controlled network access. Repository instructions and issue text may contain malicious content. Static
analysis, fuzzing, type checking, property-based tests, and formal methods can complement model review. A
natural-language assessment of safety cannot replace enforcing the boundary in the operating environment.
AI-assisted research adds experiment design, data analysis, infrastructure changes, and interpretation.
Automating many subtasks can increase research throughput without making the system independently
capable of choosing valuable research directions. A fraction of tasks labeled AI-led is not a direct measure of the
fraction of scientific insight produced by AI, and neither quantity directly determines future capability growth.
Chapter 21 discusses a recent developer-reported measurement with these distinctions intact.
An instructive student project is a repair agent over a small private benchmark of newly written defects. Keep
the agent unable to read hidden tests. Compare a fixed scripted workflow with a more autonomous controller
using the same model and budget. Record failure categories: misunderstood requirements, wrong file
localization, invalid patch, inadequate testing, environment failure, and unnecessary changes. This gives more
transferable insight than merely reproducing a leaderboard score.

## 17 Evaluation, benchmarks, and reliability

### 17.1 The evolution of evaluation

Benchmarks progressed from constrained recognition and game tasks toward language understanding,
multitask knowledge, difficult reasoning, multimodal tasks, and interactive work. Each step changes what is
measured. ImageNet rewarded category recognition; GLUE and SuperGLUE organized language-understanding
tasks; MMLU tested broad academic knowledge; GPQA and Humanity's Last Exam raised question difficulty;
SWE-bench and OSWorld evaluate actions in software environments. No single benchmark spans the entire
field. [R14, R90-R95]
Family

Representative benchmarks

What to inspect beyond the headline

Vision

ImageNet, COCO

Label ontology, long-tail classes, corruption and domain shift

Language

GLUE, SuperGLUE, SQuAD

Dataset artifacts, overlap, task-specific fine-tuning

Knowledge and
reasoning

MMLU, GPQA, GSM8K, MATH, HLE

Memorization, answer format, tools, pass count, evaluator quality

Family

Representative benchmarks

What to inspect beyond the headline

Coding

HumanEval, SWE-bench and
successors

Hidden tests, contamination, harness, repository access

Interactive agents

OSWorld, WebArena, terminal tasks

Task reset, strict completion, permissions, recovery, time budget

Embodied control

Simulation suites and real robot
task sets

Embodiment, intervention rates, physical safety and transfer

Science

CASP, forecast skill, experimental
assays

Held-out structure families, temporal split, real-world validation

Safety and
robustness

Adversarial suites and red-team
protocols

Adaptive attacks, coverage, false refusals, deployment conditions

### 17.2 Contamination and saturation

Training contamination includes exact examples, paraphrases, solutions, benchmark-specific tutorials, or
public repository patches. Deduplicating strings cannot remove every conceptual overlap. Temporal holdouts,
private tests, procedural generation, and newly collected tasks help, but each has limitations. Procedural tasks
can expose generator artifacts; private tests can be underpowered or hard to audit; human-authored tests can
contain mistakes.
Saturation means a benchmark has little remaining discriminatory power under its scoring rules. It does not
mean the broader task is solved. OpenAI's February 2026 analysis reports flawed tests and contamination in
SWE-bench Verified; its July follow-up examines weaknesses in coding evaluation more broadly. These are
primary developer analyses that warrant inspection, not a reason to replace one headline score with another
uncritically. [S08-S09]
The AI Index's broad summary of coding progress and an individual benchmark audit may use different dates,
systems, and protocols. This guide does not merge their numerical claims into one time series. A defensible
comparison needs the same dataset version, scoring rule, scaffold, tool budget, and sampling policy. When these
differ, the difference itself is part of the result.

### 17.3 Statistical and operational evaluation

For an observed proportion p over n independent tasks, a rough standard error is sqrt(p(1-p)/n).
Independence is often violated by shared templates or repositories. Use paired comparisons and cluster-aware
uncertainty where appropriate. A two-point difference on a small correlated benchmark may not support a
ranking. Predeclare important slices and avoid selecting only favorable metrics after seeing results.
Judge models can scale evaluation but exhibit position, style, verbosity, and self-preference biases. Calibrate
them against human or executable labels, randomize presentation order, and audit disagreements. Human
judges also need clear rubrics and inter-rater checks. Report uncertainty and missing evidence rather than
force every case into a confident binary label.
Reliability requires measuring the full distribution of outcomes, including catastrophic tails. Calibration,
selective prediction, abstention, redundancy, and escalation can improve a deployed system. Conformal
prediction offers coverage guarantees under exchangeability and related assumptions; those guarantees do not
automatically survive arbitrary distribution shift. A safe deployment policy depends on error severity and
recoverability, not only average accuracy. [R96]

### 17.4 A minimum evaluation record

An inspectable result states the model version and date; dataset and split; system prompt and scaffold; tool
permissions; context and output limits; retry and selection policy; compute and monetary budget; scoring code;
uncertainty; and known contamination risks. For agents, retain complete action trajectories with sensitive
information protected. For learned systems, record training-data lineage and adaptation history. This record
turns a leaderboard claim into an experiment another engineer can reason about.

## 18 Interpretability, alignment, security, and fairness

### 18.1 Explanation versus mechanism

Interpretability includes inherently understandable models, feature attribution, examples, counterfactual
explanations, probing, and mechanistic analysis. SHAP connects additive feature attribution to a game-theoretic
formulation, but the result depends on how missing features and dependencies are modeled. Attribution is not
causation. A plausible explanation can be unstable or describe a surrogate rather than the actual computation.
[R97]
Mechanistic interpretability tries to identify computations implemented in network parameters and
activations. Probes test whether information is decodable; activation patching tests whether a component
affects an output under an intervention; sparse autoencoders seek more interpretable features in distributed
representations. Superposition suggests that features can share representational dimensions. Discovering a
feature with an appealing name is only a starting point: intervention, completeness, and transfer tests are
necessary. [R98-R99]
Circuit tracing constructs approximate computational explanations using learned features and attribution
graphs. The approximation can miss important computation and may not scale uniformly to all behaviors. A
local explanation of one prompt does not prove a global safety property. Strong evidence combines predictive
explanatory power, causal intervention, and robustness across related inputs.

### 18.2 Alignment and control

Alignment asks how system behavior can remain compatible with intended goals and human values. Problems
include underspecified preferences, reward hacking, sycophancy, deceptive behavior, distribution shift, and
oversight of tasks humans cannot easily evaluate. Scalable oversight, debate, process supervision,
constitutional methods, and adversarial training explore different parts of this problem. None has established a
general guarantee for arbitrarily capable agents.
Behavioral safety, model alignment, and deployment control are related but distinct. A model may usually
refuse dangerous requests while still being vulnerable to a novel prompt. A well-behaved model can cause
harm through faulty tools or excessive privileges. Defense in depth combines training, constrained interfaces,
monitoring, isolation, and incident response. Evaluation should test both malicious users and failures arising
during apparently legitimate work.

### 18.3 Adversarial ML and agent security

Adversarial examples exploit sensitivity to input perturbations. Data poisoning manipulates training data;
backdoors induce conditional behavior; model extraction and membership inference threaten intellectual
property or privacy. Robust optimization trains against a specified perturbation set, but robustness to one
threat model does not imply robustness to all others. [R100]

Prompt injection is a system-level confusion between untrusted content and instructions. Retrieved documents,
web pages, emails, and repository files can try to redirect an agent. A strong boundary keeps authorization and
secrets outside the model's discretionary control, restricts tool capabilities, validates outputs, and treats
external text as data. Merely asking the model to ignore malicious instructions is an incomplete defense.

### 18.4 Fairness and governance

Fairness has incompatible formalizations under common conditions. Demographic parity, equalized odds,
calibration, and individual fairness answer different questions. A single metric cannot decide which errors
society should tolerate or how benefits should be distributed. Group definitions, label quality, historical
disadvantage, and the legitimacy of the use case require explicit judgment. [R101]
Governance connects technical evidence to accountability: documentation, ownership, risk assessment,
auditing, incident reporting, procurement, and recourse. NIST's Generative AI Profile organizes risk
management considerations. The EU's official implementation guidance, checked for this edition, describes
enforcement and transparency requirements beginning August 2, 2026, alongside changed timelines for some
high-risk obligations. Applicability depends on role, system, and jurisdiction; do not infer a universal deadline
from a brief summary. [S10-S12]
Model cards and dataset documentation make intended use, limitations, evaluation, and provenance easier to
inspect. They are useful only when kept accurate and connected to operational decisions. A polished document
that omits known failure modes is not assurance. For an engineer, governance becomes concrete when a
release can be blocked, rolled back, or corrected based on evidence.

## 19 Data engineering, MLOps, and efficient systems

### 19.1 Reproducibility begins before training

A reliable ML pipeline versions data, transformations, labels, code, model artifacts, and evaluation. Data
contracts define schema, units, expected ranges, timing, and ownership. Point-in-time joins prevent future
information from entering historical training examples. Feature stores can help consistency, but they cannot
repair a wrong definition or an upstream measurement process that changes silently.
MLOps manages experimentation, deployment, monitoring, and rollback. LLMOps adds prompts, retrieval
indexes, model-provider changes, tool schemas, and nondeterministic trajectories to the versioned surface. A
prompt change is a software change with possible regressions. A vector index update can change answers even
when the model is fixed. Record enough configuration to reproduce the effective system, not just the weight file.
Hidden Technical Debt in Machine Learning Systems remains a useful conceptual anchor. [R102]
Monitor input quality, covariate shift, label availability, prediction distributions, calibration, business outcomes,
latency, and cost. Distribution change does not necessarily imply performance loss, and stable inputs do not
guarantee stable outcomes. When labels arrive slowly, proxy monitoring must be interpreted cautiously.
Canary releases, shadow evaluation, and rollback reduce the blast radius of a bad update.

### 19.2 Training across accelerators

Data parallelism replicates the model and distributes examples, synchronizing gradients. Tensor parallelism
splits large operations across devices. Pipeline parallelism splits layers and schedules microbatches. Expert
parallelism distributes mixture-of-experts components. Sharded approaches such as ZeRO partition optimizer
states, gradients, and parameters to reduce redundant memory. The best combination depends on network
topology, model size, sequence length, and batch size. [R103]

Memory contains more than weights: gradients, optimizer moments, activations, communication buffers, and
temporary kernels can dominate. Activation checkpointing trades recomputation for memory. Mixed precision
reduces memory and can improve throughput but needs attention to underflow, overflow, scaling, and
accumulation. Fault recovery and checkpoint bandwidth become critical at large scale because a long run must
survive hardware and software failures.
A roofline perspective compares arithmetic intensity with compute and memory-bandwidth limits. Peak
FLOP/s is not achieved throughput. Small kernels, communication, padding, load imbalance, and memory traffic
can waste theoretical capacity. Report useful tokens or examples per second, model FLOPs utilization under a
stated definition, and time to reach a quality target.

### 19.3 Serving and the KV cache

Autoregressive serving has a prefill phase that processes the prompt and a decode phase that generates tokens.
Their bottlenecks differ with batch size and context length. KV caching avoids recomputing previous keys and
values but consumes memory proportional to active sequence length. Continuous batching improves utilization
as requests arrive and finish; scheduling must balance throughput against tail latency.
For L layers, T cached tokens, h_kv key/value heads, head dimension d, and b bytes per element, a simple persequence cache estimate is 2LTh_kvdb. Grouped-query attention reduces h_kv relative to query heads. Prefix
caching shares repeated work where privacy and exact-prefix validity allow it. Long reasoning traces increase
both computation and active memory pressure.
FlashAttention reduces memory traffic through tiled exact attention computation; it does not make ordinary
dense attention's arithmetic complexity linear in sequence length. PagedAttention manages KV memory in
blocks to reduce waste and support flexible sharing. Speculative decoding proposes tokens with a cheaper
mechanism and verifies them with the target model; correct acceptance procedures can preserve the target
distribution. [R104-R106]

### 19.4 Compression and conditional computation

Distillation trains a student from a teacher's probabilities, outputs, or trajectories. It transfers behavior under
the training distribution, including some teacher errors. Quantization reduces numeric precision; post-training
methods use calibration data, while quantization-aware training adapts the model to numerical constraints.
Weight-only quantization and activation quantization have different performance implications. Nominal bit
width alone does not determine speed on real hardware. [R107-R108]
LoRA learns low-rank updates while freezing most base weights, reducing adaptation memory and storage. It is
not inherently a method for shrinking the base model at inference. Sparsity can prune weights or activate only
selected components. A mixture-of-experts router chooses a subset of expert networks per token, increasing
total capacity without activating all parameters. Routing balance, inter-device communication, and capacity
limits can offset the theoretical compute saving. [R109-R110]
Mamba and related state-space approaches explore efficient sequence processing with selective recurrent
state. Hybrid architectures combine recurrent, convolutional, and attention mechanisms. Their value depends
on the workload: exact retrieval of arbitrary past details, long streaming sequences, and hardware efficiency
impose different requirements. A linear asymptotic complexity claim should be complemented by quality and
wall-clock measurements. [R111]

## 20 Hardware, open ecosystems, and economics

### 20.1 Accelerators and infrastructure

GPUs combine parallel execution with high-bandwidth memory and specialized matrix units. TPUs use
specialized tensor computation and interconnects. Other accelerators explore different memory hierarchies,
dataflows, numerical formats, and integration strategies. Software kernels, compilers, networking, and
reliability determine whether hardware advantages translate into useful application performance.
Current vendor documentation includes NVIDIA's Rubin platform and Google's seventh-generation Ironwood
TPUs. Their emphasis on memory, interconnects, and inference illustrates the system nature of modern
accelerator design. Vendor performance multipliers depend on precision, sparsity, baseline, and workload; this
guide does not present them as independent head-to-head measurements. Availability also varies by region,
provider, and configuration. [S13-S14]
Data centers require power delivery, cooling, water where applicable, networking, storage, and physical
construction. Energy is not interchangeable with carbon emissions: the electricity mix, location, and time of use
matter. Water withdrawal and water consumption are different measures. The IEA reports that global datacenter electricity demand grew 17% in 2025; that is a data-center statistic, not an estimate that all such
electricity was used by AI. [S15]
For a particular workload, estimate energy from measured power over time, including the relevant
infrastructure overhead. Avoid dividing a global data-center estimate by an unrelated count of chatbot
requests. Training and inference footprints vary by model, utilization, hardware, and output length. Efficiency
improvements can reduce unit cost while increased demand raises total consumption; both effects can occur
simultaneously.

### 20.2 What open actually means

Open weights permit inspection or local execution of parameters under a license. Open-source code permits
reuse under specified terms. Open training data, recipes, checkpoints, and evaluation artifacts provide
additional reproducibility. These are separate dimensions. A released checkpoint may still have use restrictions
or undisclosed training data. Read the license of the exact version rather than infer rights from a model-family
name.
Llama, Qwen, DeepSeek, Mistral, Gemma, OLMo, and community projects illustrate different approaches to
model release and reuse. Their scientific and practical value includes adaptation, independent evaluation, local
deployment, and competition. Their limitations can include incomplete reproducibility, support burden,
security maintenance, and dependence on upstream training decisions. Mozilla's 2026 report highlights both
adoption and the gap between experimentation and production; its survey findings should be read in the
context of its sample. [R112-R114, S16]

### 20.3 Cost per useful outcome

Training cost includes data acquisition, preprocessing, experiments that fail, researcher time, infrastructure,
and the final run. A published final-run compute estimate is not the total cost of developing a model. Serving
cost includes input and output computation, retrieval, tools, retries, monitoring, and human review. Comparing
API prices with raw self-hosted GPU cost omits substantial operational work.

This accounting suggests routing easy requests to cheaper systems and reserving expensive reasoning for cases
with higher expected benefit. Caching and batching can reduce cost, while excessive retries can erase apparent
savings. Self-hosting becomes attractive under some utilization, privacy, customization, and control
requirements; managed services become attractive under others. There is no universal break-even point
without workload measurements.
The economics of AI also involve complements: workflow redesign, trusted data, integration, training, and
organizational change. A capable model may produce little value if no one can use its output safely. Market
concentration can arise from compute scale, distribution, data access, or switching costs. Open ecosystems can
reduce some dependencies while leaving others, such as chip supply and cloud capacity, intact.

## 21 The verified September 2026 landscape

### 21.1 Landscape indicators and their scope

Stanford's AI Index 2026 provides the broad statistical frame for this edition: capability, investment,
deployment, responsible AI, science, medicine, and governance. Its reported observations span different dates
and populations. The following are selected indicators, not a universal market census or a September
leaderboard. [S01]
Indicator reported
by AI Index 2026

Observation

Interpretation boundary

Industry share of
notable frontier
models in 2025

Over 90%

Depends on the report's definition of notable models

Organizational AI
adoption

88%

Adoption does not measure depth, return, or reliability

US private AI
investment in 2025

$285.9 billion

Private investment is not total national spending

Documented AI
incidents

362 versus 233 in 2024

Recorded incidents depend on reporting and classification

The report's “jagged frontier” framing is useful: strong performance on advanced tasks can coexist with basic
perceptual and operational failures. Its broad indicators should guide questions about measurement, access,
and institutions, while task-level decisions require the primary evidence below. This guide treats the resulting
engineering implications as synthesis, not as additional measurements from the Index.

### 21.2 General models and developer-reported capabilities

OpenAI released GPT-6 Astra on September 3, 2026, positioning it around demanding professional work and
computer use. Its safety overview classifies it at the company's Critical cybersecurity capability level and
describes stronger controls. This is a threshold within OpenAI's framework, not a universal scientific scale. The
release supports the conclusion that tool-enabled work and security are central deployment concerns; it does
not establish a consensus definition or achievement of general intelligence. [S02-S03]
Anthropic's September 1 announcement introduces Claude Fable 5.1 and Mythos 5.1. Its reported Fable 5.1
OSWorld 2.0 scores differ sharply under partial credit and strict completion: 77.9% and 41.7%, respectively.
The announcement describes safeguards affecting evaluations, so these results concern a configured deployed

system. The gap illustrates how a scoring rule changes the apparent level of capability. These numbers should
not be compared directly with an older OSWorld protocol. [S04]
On September 17, Anthropic proposed internal development metrics and reported that Claude led 26% of its AI
R&D work as of August while remaining under human supervision. This is an organizational self-report with an
operational definition of AI-led work. It is evidence about task delegation inside one lab, not proof of
autonomous recursive self-improvement, an independently measured research speedup, or a prediction of
future capability. [S05]

### 21.3 Embodied and scientific frontiers

Google DeepMind's July 30 Gemini Robotics 2 announcement emphasizes whole-body control, dexterity, and
collaboration, with Robotics-ER 2 providing embodied reasoning capabilities. The research direction is toward
combining perception, language, planning, and action across embodiments. Public demonstrations and
reported evaluations support progress under described conditions; broad household or industrial reliability
still requires independent, long-duration evidence across operating environments. [S06]
AlphaGenome Atlas, announced September 8, precomputes predicted effects for approximately nine billion
single-nucleotide variants and supplies tools for ranking and interpretation. This expands access to modelderived hypotheses at genomic scale. Its predictions are not nine billion experimentally measured effects, and a
ranking score is not a clinical diagnosis. The distinction between predictive resource and validated mechanism
is central to responsible scientific use. [S07]
DeepMind's May 2026 AlphaEvolve update describes extensions of algorithmic and scientific applications.
Together with the underlying research, it supports interest in systems that generate candidates and evaluate
them computationally. The most convincing results have independently checkable artifacts: valid constructions,
correct algorithms, or measured improvements under disclosed conditions. Broad claims of automated science
remain emerging. [R88, S17]

### 21.4 What the snapshot does not establish

The public evidence does not settle whether one model family is best across all tasks, how much undisclosed
training compute each system used, or which internal architecture explains every gain. It does not establish
that benchmark progress translates proportionally into productivity, that general robotic autonomy is solved,
or that any particular route to AGI will succeed.
The frontier is better described as several coupled research programs: scalable pretraining; increasingly
elaborate post-training; inference-time search and verification; multimodal grounding; agent reliability;
efficient deployment; and scientific feedback. Their contributions interact. An improved verifier can make extra
inference compute useful; better memory management can make that compute affordable; better evaluation
can reveal that the apparent gain came from a benchmark artifact.
The practical consequence is to maintain a versioned evidence ledger. For each consequential claim, record the
source date, model version, task, budget, evaluator, disclosure level, and replication status. Revisit fast-moving
sources before a purchasing, research, or deployment decision. This edition preserves a dated snapshot rather
than pretending that a static document can remain a live leaderboard.

## 22 Unresolved problems and competing paradigms

### 22.1 Scaling and algorithms

Scaling and algorithmic improvement are not exclusive alternatives. Better kernels, architectures, data
curation, objectives, and optimizers change the capability obtained from a compute budget. Larger scale can

reveal which methods remain stable and useful. The unresolved question is how returns vary across tasks and
resource regimes, especially where data quality, verification, or interaction is the limiting factor.
Empirical scaling curves are valuable for allocation within observed regimes. Extrapolation beyond them
becomes uncertain when the data distribution, architecture, objective, or bottleneck changes. A useful research
program measures equal-quality compute reductions and equal-compute quality gains, including the cost of
discovering the method. A spectacular final run can conceal an expensive search over failed alternatives.

### 22.2 World models and generalization

One view emphasizes predicting rich sensory futures; another emphasizes compact latent dynamics sufficient
for control; a third emphasizes symbolic abstractions and causal structure. Each has advantages. Pixel
prediction supplies dense signals but may spend capacity on irrelevant detail. Task-specific latent models can
discard information needed for future tasks. Explicit abstractions can support compositional reasoning but may
be difficult to learn or maintain.
A decisive evaluation asks whether the representation supports new interventions and goals, not just familiar
prediction. Can an agent infer a changed physical rule, retain it, and transfer it to another task? Can it
distinguish observation from action? Can it recognize when its model is wrong? These questions connect world
modeling, causal learning, uncertainty, and continual adaptation.

### 22.3 Reliability, oversight, and interpretability

Verification is easier where outputs have formal semantics. Most real-world goals are ambiguous, delayed, and
socially negotiated. Scalable oversight must preserve the intended goal when evaluators are weaker than the
system or when outcomes arrive late. Mechanistic understanding could improve diagnosis, but current tools do
not provide complete explanations of arbitrary frontier behavior.
External control can limit damage even without full interpretability, while interpretability can reveal risks that
behavioral tests miss. The approaches are complementary. The unresolved challenge is to combine them into
evidence strong enough for the deployment stakes, accounting for adaptive adversaries and changes after
release. Absence of observed failure is weaker evidence when the evaluation has low coverage of relevant
situations.

### 22.4 Paths toward more general intelligence

Potential routes include scaled multimodal foundation models; agents trained through interaction; explicit
search with learned heuristics; neuro-symbolic systems; causal and world-model-based learning; and modular
systems with durable memory. These are research paradigms, not a forecast that one will prevail. A system can
broaden its abilities without matching every human capability or sharing human cognitive mechanisms.
Open problem

Competing emphasis

Evidence that would materially strengthen a claim

General reasoning

Learned trajectories versus explicit
search

Novel compositional tasks with matched compute and reliable
verification

Continual learning

Weight updates versus external
memory and modules

Long task sequences with bounded forgetting and realistic storage
budgets

Embodied transfer

Massive imitation versus interaction
Transfer across bodies, environments, and physical disturbances
and dynamics models

Data limits

More natural data versus synthetic
and experimental feedback

Measured marginal value and preserved tail coverage

Open problem

Competing emphasis

Evidence that would materially strengthen a claim

Alignment

Better objectives versus oversight
and containment

Robust performance under adaptive attacks and deployment
shifts

Scientific autonomy

End-to-end agents versus humandirected tools

Reproducible discoveries with independent experimental or
formal validation

The appropriate stance is conditional and empirical. Define the capability, identify the evidence that would
distinguish explanations, and measure failures as carefully as successes. For a student entering the field, this
discipline is more durable than memorizing the current model ranking.

### 22.5 Worked design study A research assistant with evidence

Consider a hypothetical assistant that answers technical questions from an organization's versioned research
library. The objective is a correct, source-supported answer within a latency budget. A strong baseline is lexical
search plus a fixed answer template. The candidate system adds dense retrieval, reranking, a language model,
and optional code execution. The research question is whether this additional complexity improves validated
answers per unit cost, especially when sources conflict or the answer is absent.
Construct an evaluation before tuning the system. Sample questions by topic and difficulty, including exact
lookup, cross-document synthesis, numerical calculation, and unanswerable requests. Split by underlying
document family and publication time to reduce leakage. Human reviewers create reference evidence sets and
adjudicate ambiguous questions. The test set stays hidden from prompt and retriever tuning. Treat retrieval
relevance, answer correctness, and citation support as separate labels.
The algorithm first checks user access, retrieves candidates, reranks evidence, and checks document version
dates. It then generates an answer tied to specific passages. Numerical claims trigger deterministic calculation
where feasible. A verification stage checks that every important factual claim has support and that
contradictory sources are acknowledged. The system abstains or requests missing information when the
evidence is inadequate. A stopping rule limits retrieval iterations and tool calls so an uncertain question cannot
cause unbounded cost.
Suppose the retriever finds sufficient evidence on 90% of answerable questions, the generator answers
correctly on 95% of those, and citation support is valid on 98% of that subset. Under this explicitly conditional
decomposition, fully successful output occurs on 0.90 × 0.95 × 0.98, or about 83.8%, of answerable questions.
These are illustrative assumptions, not measured results. They show why optimizing generator accuracy alone
may have limited effect when retrieval is the dominant bottleneck.
Run ablations that remove dense retrieval, reranking, tool execution, and the verification stage. Keep the total
budget comparable and report confidence intervals, failure severity, and reviewer effort. If verification reduces
unsupported answers but increases unnecessary abstention, plot that tradeoff rather than hide it in one
average. Test permission boundaries separately with adversarial documents. The final decision should reflect
the use case: a literature-discovery aid can tolerate different errors from a system that automatically changes
production code.
This example connects the guide's themes without presuming that an agent is required. Representation
learning helps retrieval; probabilistic evaluation quantifies uncertainty; causal discipline prevents overclaiming
from ablations; systems engineering controls cost; and security defines the action boundary. The useful
research result is an explained improvement over a credible baseline, with known limits and reproducible
evidence.

## 23 Pivotal paper catalog

The following catalog selects influential papers and a few foundational books from the bibliography. It is
organized chronologically by first public year, with publication-year exceptions identified in the references. The
contribution column states the technical idea; the importance and legacy columns explain this guide's
assessment of its role. Inclusion is not a ranking of scientific merit, and later work usually has multiple
intellectual ancestors. Full titles, publication context, and links appear in Chapter 26.
Year

Paper and authors

Contribution

Why it mattered and legacy

1943

Warren McCulloch and Walter Pitts
A Logical Calculus of the Ideas Immanent in
Nervous Activity [R01]

Formal threshold-neuron
networks

Connected neural activity with logic
Enables: Computational neuroscience and
neural-network theory

1950

Alan Turing
Computing Machinery and Intelligence [R02]

Behavioral framing of machine
intelligence

Made machine intelligence an explicit
scientific question
Enables: Evaluation debates and
conversational AI

1955

John McCarthy, Marvin Minsky, Nathaniel
Rochester, and Claude Shannon
A Proposal for the Dartmouth Summer Research
Project on Artificial Intelligence [R03]

Outlined an AI research
program

Helped establish a shared field
Enables: Symbolic reasoning and AI
institutions

1958

Frank Rosenblatt
The Perceptron: A Probabilistic Model for
Information Storage and Organization in the
Brain [R04]

Learning with threshold units

Demonstrated adaptive classification
Enables: Connectionist learning

1986

David Rumelhart, Geoffrey Hinton, and Ronald
Williams
Learning Representations by Back-Propagating
Errors [R05]

Learning internal features by
gradient propagation

Popularized multilayer representation
learning
Enables: Modern differentiable models

1988

Judea Pearl
Probabilistic Reasoning in Intelligent Systems
[R07]

Graphical representation of
uncertainty

Made structured probabilistic reasoning
tractable
Enables: Bayesian networks and
graphical-model research

1995

Corinna Cortes and Vladimir Vapnik
Support-Vector Networks [R08]

Soft-margin support vector
classification

Combined margin maximization with
nonlinear features
Enables: Kernel learning and large-margin
methods

1996

Leo Breiman
Bagging Predictors [R09]

Bootstrap aggregation

Reduced variance of unstable predictors
Enables: Random forests and ensemble
practice

1997

Sepp Hochreiter and Jurgen Schmidhuber
Long Short-Term Memory [R13]

Gated recurrent memory

Addressed long-range gradient difficulties
Enables: Sequence learning and gated
architectures

1998

Yann LeCun, Leon Bottou, Yoshua Bengio, and
Patrick Haffner
Gradient-Based Learning Applied to Document
Recognition [R06]

Convolutional documentrecognition systems

Integrated architecture and learning in
practical recognition
Enables: Modern CNN pipelines

2001

Leo Breiman
Random Forests [R10]

Randomized tree ensembles

Strong practical prediction with limited
tuning
Enables: Tabular ML and feature analysis

Year

Paper and authors

Contribution

Why it mattered and legacy

2001

Jerome Friedman
Greedy Function Approximation: A Gradient
Boosting Machine [R11]

Boosting as functional gradient
descent

Unified additive predictive modeling
Enables: Modern gradient-boosted trees

2009

Jia Deng et al.
ImageNet: A Large-Scale Hierarchical Image
Database [R14]

Large labeled visual dataset

Enabled comparable large-scale
recognition
Enables: ImageNet challenge and visual
pretraining

2012

Alex Krizhevsky, Ilya Sutskever, and Geoffrey
Hinton
ImageNet Classification with Deep
Convolutional Neural Networks [R15]

GPU-trained deep CNN

Demonstrated a major large-scale
recognition improvement
Enables: Deep visual learning adoption

2013

Tomas Mikolov, Kai Chen, Greg Corrado, and
Jeffrey Dean
Efficient Estimation of Word Representations in
Vector Space [R19]

Efficient distributional
embeddings

Made useful lexical representations
scalable
Enables: Neural NLP and embeddingbased retrieval

2013

Diederik Kingma and Max Welling
Auto-Encoding Variational Bayes [R56]

Reparameterized variational
latent learning

Scalable latent-variable training
Enables: VAEs and learned latent spaces

2013

Volodymyr Mnih et al.
Playing Atari with Deep Reinforcement Learning Deep Q-learning from pixels
[R61]

Combined neural perception and control
Enables: Deep reinforcement learning

2014

Ian Goodfellow, Jonathon Shlens, and Christian
Szegedy
Explaining and Harnessing Adversarial
Examples [R100]

Efficient adversarial
perturbations

Exposed input-sensitivity risks
Enables: Adversarial training and
robustness

2014

Diederik Kingma and Jimmy Ba
Adam: A Method for Stochastic Optimization
[R17]

Adaptive moment-based
updates

Practical optimizer across architectures
Enables: Large-scale neural training

2014

Ilya Sutskever, Oriol Vinyals, and Quoc Le
Sequence to Sequence Learning with Neural
Networks [R21]

Encoder-decoder sequence
mapping

Unified variable-length input and output
modeling
Enables: Translation, summarization, and
generative tasks

2014

Dzmitry Bahdanau, Kyunghyun Cho, and Yoshua
Bengio
Neural Machine Translation by Jointly Learning
to Align and Translate [R22]

Learned alignment through
attention

Removed the fixed-vector bottleneck
Enables: Attention-based sequence
models

2014

Ian Goodfellow et al.
Generative Adversarial Nets [R57]

Adversarial generatordiscriminator training

New route to high-quality generation
Enables: GANs and adversarial objectives

2015

D. Sculley et al.
Hidden Technical Debt in Machine Learning
Systems [R102]

Showed model code is a small part of
System-level maintenance risks deployment
Enables: MLOps engineering

2015

Geoffrey Hinton, Oriol Vinyals, and Jeff Dean
Distilling the Knowledge in a Neural Network
[R107]

Teacher-to-student soft-target
training

Transferred ensemble or large-model
behavior
Enables: Model compression and
reasoning distillation

Year

Paper and authors

Contribution

Why it mattered and legacy

2015

Kaiming He, Xiangyu Zhang, Shaoqing Ren, and
Jian Sun
Deep Residual Learning for Image Recognition
[R18]

Residual connections

Enabled optimization of much deeper
networks
Enables: Residual architectures across
modalities

2016

David Silver et al.
Mastering the Game of Go with Deep Neural
Networks and Tree Search [R42]

Learned policy/value with
search

Combined learning and planning at high
performance
Enables: AlphaZero and neural search

2016

Thomas Kipf and Max Welling
Semi-Supervised Classification with Graph
Convolutional Networks [R70]

Graph convolution for node
prediction

Simple scalable graph learning
Enables: Message-passing GNNs

2016

James Kirkpatrick et al.
Overcoming Catastrophic Forgetting in Neural
Networks [R77]

Elastic weight consolidation

Importance-weighted parameter
protection
Enables: Continual learning

2016

Brendan McMahan et al.
Communication-Efficient Learning of Deep
Networks from Decentralized Data [R78]

Federated averaging

Practical decentralized optimization
Enables: Federated learning systems

2016

Martin Abadi et al.
Deep Learning with Differential Privacy [R79]

Private gradient training and
accounting

Practical privacy-preserving deep
learning
Enables: DP-SGD deployments

2017

Ashish Vaswani et al.
Attention Is All You Need [R23]

Transformer architecture

Parallel sequence training with attention
Enables: BERT, GPT, vision and
multimodal Transformers

2017

John Schulman et al.
Proximal Policy Optimization Algorithms [R35]

Clipped policy optimization

Practical policy-gradient updates
Enables: RL systems and RLHF
implementations

2017

David Silver et al.
Mastering Chess and Shogi by Self-Play with a
General Reinforcement Learning Algorithm
[R43]

AlphaZero self-play and search

Reduced reliance on human game data
Enables: General self-play research

2017

William Hamilton, Rex Ying, and Jure Leskovec
Inductive Representation Learning on Large
Graphs [R71]

GraphSAGE neighborhood
sampling

Generalization to unseen nodes
Enables: Scalable inductive graph learning

2017

Chelsea Finn, Pieter Abbeel, and Sergey Levine
Model-Agnostic Meta-Learning for Fast
Adaptation of Deep Networks [R76]

Learned initialization for
adaptation

General gradient-based meta-learning
recipe
Enables: Few-shot adaptation

2017

Scott Lundberg and Su-In Lee
A Unified Approach to Interpreting Model
Predictions [R97]

SHAP additive attribution
framework

Unified several explanation approaches
Enables: Feature-attribution practice

2018

Jacob Devlin, Ming-Wei Chang, Kenton Lee, and
Kristina Toutanova
BERT: Pre-training of Deep Bidirectional
Transformers for Language Understanding
[R24]

Bidirectional masked
pretraining

Strong transferable language
representations
Enables: Encoder-based NLP and retrieval

2018

Victor Chernozhukov et al.
Double/Debiased Machine Learning for
Treatment and Structural Parameters [R75]

Orthogonal scores and crossfitting

Robust use of flexible nuisance estimates
Enables: Causal ML estimation

Year

Paper and authors

Contribution

Why it mattered and legacy

2019

Samyam Rajbhandari, Jeff Rasley, Olatunji
Ruwase, and Yuxiong He
ZeRO: Memory Optimizations Toward Training
Trillion Parameter Models [R103]

Sharded training states

Reduced redundant memory
Enables: Large distributed training

2020

Tom Brown et al.
Language Models are Few-Shot Learners [R25]

Large autoregressive model
and in-context evaluation

Demonstrated broad prompting-based
transfer
Enables: Foundation-model interfaces

2020

Alexey Dosovitskiy et al.
An Image is Worth 16x16 Words: Transformers
for Image Recognition at Scale [R26]

Patch-based vision
Transformer

Extended Transformer scaling to vision
Enables: Visual and multimodal
backbones

2020

Ting Chen, Simon Kornblith, Mohammad
Norouzi, and Geoffrey Hinton
SimCLR contrastive learning
A Simple Framework for Contrastive Learning of
Visual Representations [R27]

Clarified roles of augmentation and
projection
Enables: Self-supervised visual learning

2020

Jared Kaplan et al.
Scaling Laws for Neural Language Models [R31]

Empirical loss-scaling
relationships

Made resource allocation more
quantitative
Enables: Large-model scaling analysis

2020

Patrick Lewis et al.
Retrieval-Augmented Generation for
Knowledge-Intensive NLP Tasks [R44]

Retrieved evidence with
generation

Externalized some knowledge access
Enables: RAG systems

2020

Alexei Baevski, Yuhao Zhou, Abdelrahman
Mohamed, and Michael Auli
wav2vec 2.0: A Framework for Self-Supervised
Learning of Speech Representations [R50]

Masked speech representation
learning

Reduced labeled-speech dependence
Enables: Speech pretraining

2020

Jonathan Ho, Ajay Jain, and Pieter Abbeel
Denoising Diffusion Probabilistic Models [R58]

Effective diffusion training
formulation

High-quality iterative generation
Enables: Modern diffusion systems

2020

Zongyi Li et al.
Fourier Neural Operator for Parametric Partial
Differential Equations [R86]

Learned operators in Fourier
space

Function-to-function modeling
Enables: Scientific surrogate models

2021

Edward Hu et al.
LoRA: Low-Rank Adaptation of Large Language
Models [R109]

Low-rank trainable updates

Reduced fine-tuning resource
requirements
Enables: Adapter ecosystems

2021

William Fedus, Barret Zoph, and Noam Shazeer
Switch Transformers: Scaling to Trillion
Parameter Models with Simple and Efficient
Sparsity [R110]

Simplified sparse expert
routing

Capacity with limited active computation
Enables: Large MoE models

2021

Alec Radford et al.
Learning Transferable Visual Models From
Natural Language Supervision [R28]

CLIP image-text alignment

Enabled text-driven visual transfer
Enables: Open-vocabulary vision and
multimodal systems

2021

Mathilde Caron et al.
Emerging Properties in Self-Supervised Vision
Transformers [R29]

DINO self-distillation

Learned strong visual features without
labels
Enables: Visual foundation
representations

2021

Robin Rombach et al.
High-Resolution Image Synthesis with Latent
Diffusion Models [R59]

Diffusion in compressed latent
space

Reduced image-generation compute
Enables: Latent generative media

Year

Paper and authors

Contribution

Why it mattered and legacy

2021

Bernhard Scholkopf et al.
Towards Causal Representation Learning [R74]

Causality linked to learned
representations

Frames transfer beyond correlations
Enables: Causal representation research

2021

John Jumper et al.
Highly Accurate Protein Structure Prediction
with AlphaFold [R80]

AlphaFold 2 structure
prediction

Major advance in protein modeling
Enables: Structural biology tools

2022

Tri Dao, Daniel Fu, Stefano Ermon, Atri Rudra,
and Christopher Re
Tiled IO-aware exact attention
FlashAttention: Fast and Memory-Efficient Exact
Attention with IO-Awareness [R104]

Reduced memory traffic
Enables: Efficient Transformer kernels

2022

Elias Frantar, Saleh Ashkboos, Torsten Hoefler,
and Dan Alistarh
GPTQ: Accurate Post-Training Quantization for
Generative Pre-trained Transformers [R108]

Efficient low-bit weight
quantization

Made large-model compression practical
Enables: Quantized local inference

2022

Jordan Hoffmann et al.
Training Compute-Optimal Large Language
Models [R32]

Revised model/data allocation
estimates

Showed importance of sufficient training
tokens
Enables: Chinchilla-style planning

2022

Long Ouyang et al.
Training Language Models to Follow
Instructions with Human Feedback [R34]

Demonstrations, preferences,
and RLHF

Made instruction-following systems more
useful
Enables: Modern assistant post-training

2022

Yuntao Bai et al.
Constitutional AI: Harmlessness from AI
Feedback [R37]

Principle-guided critique and
AI feedback

Scaled some preference supervision
Enables: RLAIF and explicit behavior
principles

2022

Jason Wei et al.
Chain-of-Thought Prompting Elicits Reasoning
in Large Language Models [R38]

Intermediate-step prompting

Improved studied multistep tasks
Enables: Reasoning prompts and
trajectory training

2022

Xuezhi Wang et al.
Self-Consistency Improves Chain of Thought
Reasoning in Language Models [R39]

Aggregate sampled reasoning
paths

Showed value of inference diversity
Enables: Sampling-based reasoning
systems

2022

Shunyu Yao et al.
ReAct: Synergizing Reasoning and Acting in
Language Models [R46]

Interleaved reasoning and
actions

Connected language models to interactive
evidence
Enables: Tool-using agents

2022

Alec Radford et al.
Robust Speech Recognition via Large-Scale
Weak Supervision [R51]

Whisper large-scale weak
supervision

Broad speech recognition transfer
Enables: Multilingual audio systems

2022

Yizhong Wang et al.
Self-Instruct: Aligning Language Models with
Self-Generated Instructions [R53]

Synthetic instruction
generation

Reduced dependence on manually written
instructions
Enables: Synthetic post-training data

2022

Yaron Lipman et al.
Flow Matching for Generative Modeling [R60]

Learning continuous
generative vector fields

Flexible transport-based training
Enables: Flow-based image and media
generation

2022

Nelson Elhage et al.
Toy Models of Superposition [R98]

Controlled study of shared
feature dimensions

Explained a difficulty in neuron-level
interpretation
Enables: Sparse feature and circuit
research

Year

Paper and authors

Contribution

Why it mattered and legacy

2023

Woosuk Kwon et al.
Efficient Memory Management for Large
Language Model Serving with PagedAttention
[R105]

Block-based KV cache
management

Reduced serving memory waste
Enables: vLLM-style serving

2023

Albert Gu and Tri Dao
Mamba: Linear-Time Sequence Modeling with
Selective State Spaces [R111]

Input-selective state-space
modeling

Efficient alternative sequence backbone
Enables: Recurrent and hybrid
architectures

2023

Rafael Rafailov et al.
Direct Preference Optimization: Your Language
Model is Secretly a Reward Model [R36]

Direct pairwise preference
objective

Simplified preference optimization
Enables: DPO variants and alignment
experiments

2023

Alexander Kirillov et al.
Segment Anything [R49]

Promptable segmentation and
large dataset

Reusable segmentation interface
Enables: Segmentation foundation models

2023

Anthony Brohan et al.
RT-2: Vision-Language-Action Models Transfer
Web Knowledge to Robotic Control [R65]

VLA transfer from web
representations

Connected broad pretraining with action
Enables: Generalist robot policies

2023

Cheng Chi et al.
Diffusion Policy: Visuomotor Policy Learning via
Action Diffusion [R67]

Diffusion over action
sequences

Represented multimodal control behavior
Enables: Generative robot policies

2023

Danijar Hafner, Jurgis Pasukonis, Jimmy Ba, and
Timothy Lillicrap
Mastering Diverse Domains through World
Models [R68]

Broad learning through imagined
DreamerV3 latent world-model
trajectories
control
Enables: Model-based RL research

2023

Joseph Watson et al.
De Novo Design of Protein Structure and
Function with RFdiffusion [R82]

Generative protein backbone
design

Linked diffusion to experimental design
Enables: Conditional protein design

2023

Remi Lam et al.
Learning Skillful Medium-Range Global Weather
Forecasting [R83]

GraphCast weather prediction

Strong learned global forecasting
Enables: ML weather systems

2023

Amil Merchant et al.
Scaling Deep Learning for Materials Discovery
[R85]

GNoME large-scale crystal
candidates

Scaled learned materials screening
Enables: Materials discovery pipelines

2023

Carlos Jimenez et al.
Repository issue resolution
SWE-bench: Can Language Models Resolve Realbenchmark
World GitHub Issues? [R90]

Moved evaluation beyond isolated
functions
Enables: Software-engineering agent
evaluation

2023

David Rein et al.
GPQA: A Graduate-Level Google-Proof Q&A
Benchmark [R94]

Expert science questions

Raised difficulty beyond common exams
Enables: Frontier reasoning evaluation

2024

Dirk Groeneveld et al.
OLMo: Accelerating the Science of Language
Models [R113]

Open model, data, and training
artifacts

Improved reproducibility of languagemodel science
Enables: Transparent model research

2024

DeepSeek-AI et al.
DeepSeek-V3 Technical Report [R114]

Efficient large MoE training
system

Detailed a competitive resource-conscious
recipe
Enables: Reasoning base models and
systems research

Year

Paper and authors

Contribution

Why it mattered and legacy

2024

Charlie Snell, Jaehoon Lee, Kelvin Xu, and Aviral
Kumar
Scaling LLM Test-Time Compute Optimally can
be More Effective than Scaling Model
Parameters [R40]

Adaptive inference-compute
allocation

Linked difficulty, verification, and
compute
Enables: Test-time scaling research

2024

Ilia Shumailov et al.
AI Models Collapse When Trained on
Recursively Generated Data [R54]

Analysis of recursive syntheticdata degradation

Highlighted tail loss and feedback risks
Enables: Data-mixture and provenance
research

2024

Moo Jin Kim et al.
OpenVLA: An Open-Source Vision-LanguageAction Model [R66]

Released VLA model and
adaptation approach

Improved accessibility of VLA research
Enables: Open robot-policy development

2024

Josh Abramson et al.
Accurate Structure Prediction of Biomolecular
Interactions with AlphaFold 3 [R81]

Diffusion-based interaction
structure modeling

Broadened biomolecular coverage
Enables: Complex structure prediction

2024

Ilan Price et al.
Probabilistic Weather Forecasting with Machine
Learning [R84]

GenCast probabilistic forecasts

Joint ensemble prediction with diffusion
Enables: Uncertainty-aware weather ML

2024

Trieu Trinh et al.
Solving Olympiad Geometry without Human
Demonstrations [R87]

AlphaGeometry neuralsymbolic reasoning

Combined generation and deduction
Enables: Hybrid mathematical systems

2024

Tianbao Xie et al.
OSWorld: Benchmarking Multimodal Agents for
Open-Ended Tasks in Real Computer
Environments [R91]

Executable desktop task
evaluation

Measured computer interaction outcomes
Enables: Computer-use agent research

2025

DeepSeek-AI et al.
DeepSeek-R1: Incentivizing Reasoning
Capability in LLMs via Reinforcement Learning
[R41]

Reasoning-oriented RL and
distillation

Provided a documented reasoning
training pipeline
Enables: Open-weight reasoning research

2025

Alexander Novikov et al.
AlphaEvolve: A Coding Agent for Scientific and
Algorithmic Discovery [R88]

Program generation with
evolutionary evaluation

Connected agents to checkable discovery
Enables: Algorithm-search systems

2025

Long Phan et al.
Humanity's Last Exam [R95]

Difficult multidisciplinary
evaluation

Tests remaining academic question gaps
Enables: Frontier evaluation debate

2025

Emmanuel Ameisen et al.
Circuit Tracing: Revealing Computational
Graphs in Language Models [R99]

Feature-based attribution
graphs

More detailed mechanistic hypotheses
Enables: Causal circuit analysis

## 24 A prioritized reading and implementation curriculum

### 24.1 Study method and prerequisites

Use a roughly twenty-four-week plan at eight to twelve hours per week, adjusting the pace to your
mathematical background. This is a suggested workload, not an estimate guaranteed for every reader. Priority
A readings establish ideas needed across many domains. Priority B readings deepen a chosen specialty.
Frontier readings are provisional evidence to evaluate, not facts to memorize.
Before the papers, confirm that you can differentiate matrix expressions, reason with conditional probability,
explain maximum likelihood, implement gradient descent, and distinguish an estimator from an estimand.
Review eigendecomposition, singular values, numerical stability, concentration, and basic hypothesis testing as
needed. Bishop [R12] and Sutton-Barto [R62] provide coherent background rather than isolated paper
summaries.
For every paper, write a one-page note with the problem, assumptions, objective, algorithm, strongest
evidence, limitations, and one experiment that could challenge the conclusion. Reproduce a small central result
before attempting the full scale. Read appendices for data splits, hyperparameters, and evaluation details. If
compute is limited, reproduce an ablation or failure mode rather than a smaller but scientifically incomparable
headline result.

### 24.2 Foundation stage Weeks 1 to 6

Week 1, Priority A: Read Turing [R02] and selected chapters of Bishop [R12]. Contrast behavioral evaluation
with statistical generalization. Implement linear and logistic regression from scratch, compare numerical and
analytic gradients, and build a grouped train/validation/test split. Deliver a short analysis of why a high test
score can still fail under a changed population.
Week 2, Priority A: Read Cortes-Vapnik [R08], Breiman's Random Forests [R10], and Friedman [R11]. Compare
a linear model, kernel SVM, random forest, and boosted trees on one tabular dataset with a justified split.
Report calibration and error costs, not only accuracy. Explain which inductive bias matches the data and how
model selection uncertainty affects the conclusion.
Week 3, Priority A: Read Rumelhart-Hinton-Williams [R05] and LeCun et al. [R06]. Implement a multilayer
network and a small CNN. Verify gradients and inspect optimization failure with poor initialization. Explain
parameter sharing and receptive fields. Priority B: read LSTM [R13] and compare a recurrent model on a task
requiring memory across time.
Week 4, Priority A: Read AlexNet [R15], ResNet [R18], and Adam [R17]. Reproduce a residual-versus-plain
network comparison at manageable scale with matched training conditions. Track training and validation
curves. The goal is to distinguish optimization improvement from data augmentation, parameter count, and
regularization effects.
Week 5, Priority A: Read word2vec [R19], seq2seq [R21], and Bahdanau attention [R22]. Implement a small
sequence transduction task and inspect errors as input length increases. Priority B: compare static and
contextual word representations. Demonstrate a case where semantic similarity is useful and another where it
confuses an important distinction.
Week 6, Priority A: Read the Transformer [R23] and BERT [R24]. Implement scaled dot-product attention,
causal masking, and a compact decoder. Verify that no future token leaks into training. Explain the difference
between teacher-forced training and autoregressive generation. Deliver a diagram with tensor shapes, a
compute estimate, and an analysis of tokenization effects.

### 24.3 Intermediate stage Weeks 7 to 12

Week 7, Priority A: Read GPT-3 [R25], the foundation-model report [R30], and the two scaling studies [R31R32]. Fit a simple learning curve across several small training budgets, reporting uncertainty and the range
over which the fit is credible. Do not extrapolate a tiny experiment into a frontier forecast. Explain why training
and serving optima can differ using [R33].
Week 8, Priority A: Read SimCLR [R27] and CLIP [R28]. Compare a frozen representation with fine-tuning on a
distribution-shifted dataset. Priority B: DINO [R29] and ViT [R26]. Write an augmentation audit: which
transformations preserve labels and which destroy task-relevant information?
Week 9, Priority A: Read VAE [R56] and DDPM [R58]. Train a small generative model, inspect mode coverage,
and study how sampling budget affects quality. Priority B: GAN [R57], latent diffusion [R59], and flow matching
[R60]. Explain why a visual-quality metric cannot prove physical realism or absence of memorization.
Week 10, Priority A: Read InstructGPT [R34] and DPO [R36]. Build a small preference dataset with a written
rubric and measure annotator disagreements. Compare supervised fine-tuning with preference optimization
using a held-out task set. Priority B: Constitutional AI [R37]. Audit whether a judging model rewards verbosity
or agreement instead of correctness.
Week 11, Priority A: Read RAG [R44] and Lost in the Middle [R45]. Build an evidence-grounded questionanswering system over a versioned document collection. Measure retrieval recall, answer support, citation
correctness, and abstention separately. Include stale and conflicting sources. Compare retrieval with a longcontext baseline at a matched cost.
Week 12, Priority A: Read ReAct [R46] and SWE-bench [R90]. Create a bounded agent using two or three tools
in an isolated environment. Log complete trajectories and measure recovery from tool errors. Priority B:
Toolformer [R47] and Reflexion [R48]. Produce a failure taxonomy and compare against a fixed workflow.

### 24.4 Advanced stage Weeks 13 to 18

Week 13, Priority A: Read Sutton-Barto selections [R62], DQN [R61], and PPO [R35]. Implement value learning
or a policy gradient on a small control task. Measure variability across seeds and sensitivity to reward design.
Priority B: SAC [R64]. Demonstrate how optimizing an imperfect reward can produce unintended behavior.
Week 14, Priority A for embodied specialization: Read AlphaGo [R42], DreamerV3 [R68], and Diffusion Policy
[R67]. Compare planning with a perfect simulator against planning with a deliberately imperfect learned
model. Priority B: RT-2 and OpenVLA [R65-R66]. Define a transfer test before changing the policy.
Week 15, Priority A: Read LoRA [R109], distillation [R107], and GPTQ [R108]. Adapt and compress a small
model. Report quality, memory, latency, and calibration before and after each intervention. Do not assume
fewer bits imply lower latency. Keep the same prompts and decoding policy across comparisons.
Week 16, Priority A: Read FlashAttention [R104], PagedAttention [R105], and ZeRO [R103]. Profile an inference
workload by prefill, decode, memory, and batching. Priority B: Switch Transformers [R110] and Mamba [R111].
Explain the bottleneck from measurements and propose one change whose expected effect is falsifiable.
Week 17, Priority A: Read causal representation learning [R74], double ML [R75], and the conformal tutorial
[R96]. Simulate a confounded treatment problem and show that prediction accuracy does not identify the
treatment effect. Test a coverage guarantee before and after violating exchangeability. Priority B: federated
learning [R78] and DP-SGD [R79].
Week 18, Priority A: Read adversarial examples [R100], fairness tradeoffs [R101], and technical debt [R102].
Audit a complete system for leakage, subgroup failure, threat boundaries, and rollback. Priority B:
superposition [R98] and circuit tracing [R99]. Distinguish a useful explanation from a causal or safety
guarantee.

### 24.5 Frontier stage Weeks 19 to 24

Week 19: Read chain of thought [R38], self-consistency [R39], and inference scaling [R40]. Compare one long
trajectory with multiple short candidates at equal total budget. Use an independently checkable task. Measure
selection error separately from candidate-generation success and study when extra computation stops helping.
Week 20: Read DeepSeek-R1 [R41] and its base-model context [R114]. Draw the training pipeline and identify
which stages use demonstrations, generated trajectories, and rewards. Reproduce a small verifier-based
experiment if resources permit. The central question is what the experiment says about the optimization
method versus the pretrained model's existing capability.
Week 21: Read the original benchmarks [R90-R95] alongside the 2026 coding-evaluation critiques [S08-S09].
Build a small fresh evaluation with a declared protocol and hidden tests. Compare strict completion with partial
credit. Quantify how ranking changes with sampling, tools, and scoring, and document any ambiguity in the
tasks.
Week 22: Choose one scientific track. For biology, read AlphaFold 2, AlphaFold 3, and RFdiffusion [R80-R82].
For weather, read GraphCast and GenCast [R83-R84]. For mathematical discovery, read AlphaGeometry and
AlphaEvolve [R87-R88]. Deliver an evidence chain separating model prediction, computational validation, and
experimental or formal confirmation.
Week 23: Read the current landscape sources [S01-S07, S13-S17]. Make a claim ledger with dates, definitions,
disclosure gaps, and replication status. Compare a developer announcement with its underlying technical or
safety report. Identify one claim whose interpretation changes when the evaluation budget or population is
specified.
Week 24: Complete a capstone that combines a useful task, a strong simple baseline, a learned system, an
independent evaluation, and cost accounting. Deliver a reproducible report and a short model/system card. A
negative result with a sound experiment is a successful capstone. An impressive demonstration without heldout evidence is incomplete.

### 24.6 Specialization branches and mastery checks

For an AI engineer, prioritize Chapters 7-9 and 16-20, then build retrieval, evaluation, and serving expertise.
For a research scientist, prioritize mathematical assumptions, ablation design, and replication across Chapters
3-8, 14-15, and 22. For an embodied-AI path, deepen control, state estimation, geometry, and RL before relying
on language-model interfaces. For a data scientist, keep causal inference, tabular modeling, time series, and
decision costs central even while learning foundation models.
You are ready for frontier reading when you can reconstruct a paper's objective, explain its baselines, identify
what its metric omits, and propose a discriminating experiment. You are ready to deploy when you can also
explain the system's permissions, provenance, monitoring, rollback, and cost per useful outcome. These are
different thresholds, and both require practice.

## 25 Glossary

Activation. The intermediate numerical output of a neuron, layer, or network component for a particular input.
Agent. A system that repeatedly observes an environment and selects actions toward an objective, often using
tools and persistent state.
Alignment. The problem of making system behavior compatible with intended goals and human values across
relevant circumstances.
Attention. A learned mechanism that uses query-key similarities to combine value representations.
Autoregressive model. A model that factors a joint distribution into conditional predictions of successive
elements.
Backpropagation. Reverse-mode differentiation through a computational graph to compute parameter
gradients efficiently.
Bayesian inference. Updating a distribution over hypotheses or parameters using a likelihood and a prior.
Calibration. Agreement between predicted probabilities and observed event frequencies under a specified
evaluation distribution.
Causal identification. Determining whether a causal quantity is recoverable from available data and
assumptions.
Chain of thought. Intermediate reasoning expressed in a sequence of tokens; it need not faithfully reveal all
internal computation.
Checkpoint. A saved state of model parameters and, for training recovery, associated optimizer and run state.
Concept drift. Change over time in the relationship between inputs and targets, under a specified task
definition.
Conformal prediction. A framework for prediction sets or intervals with coverage guarantees under stated
assumptions such as exchangeability.
Context window. The amount of input and generated sequence a model can process within one invocation; not
a guarantee of effective use.
Continual learning. Learning from a changing stream while retaining useful prior abilities and adapting to
new information.
Contrastive learning. Learning representations by comparing related and unrelated examples under a
similarity objective.
Covariate shift. A change in the input distribution, often studied while assuming the conditional target
distribution remains fixed.
Data leakage. Information unavailable at prediction time entering model training, selection, or evaluation.
Differential privacy. A bound on changes in an algorithm's output distribution when one protected data unit
changes.
Diffusion model. A generative model trained to reverse a progressive corruption process, usually through
iterative denoising.
Distillation. Training a student model to imitate selected behavior or distributions of a teacher or ensemble.
Embedding. A learned vector representation of an item such as a token, image, user, or graph node.

Emergence. An apparent or substantive qualitative change in behavior; its meaning depends on the metric and
explanatory claim.
Epistemic uncertainty. Uncertainty associated with limited knowledge of a model, its parameters, or the
underlying process.
Expert system. A system using explicitly represented domain knowledge and rules to solve specialized
problems.
Federated learning. Training across distributed data holders without necessarily centralizing raw data; not a
privacy guarantee by itself.
Fine-tuning. Further training of a pretrained model for a task, domain, behavior, or data distribution.
Foundation model. A broadly trained model that can be adapted or composed for many downstream uses.
Generalization. Performance on data or tasks beyond the training examples, under a specified relationship
between distributions.
Gradient. The vector of local partial derivatives of an objective with respect to parameters.
Graph neural network. A neural architecture that processes graph structure, commonly through permutationrespecting message passing.
Grounding. Connecting representations or symbols to relevant observations, entities, actions, or consequences.
Hallucination. Generated content that is false or unsupported relative to the relevant evidence or task;
definitions vary by application.
In-context learning. Adaptation of behavior through examples or instructions in the input without necessarily
updating model weights.
Inductive bias. Assumptions or preferences that favor some learned functions over others and make
generalization possible.
Inference. Using a trained model to compute outputs; in statistics, also reasoning about unknown quantities
from observations.
Instruction tuning. Training on instruction-response examples to improve task following and interaction
behavior.
Kernel. A similarity function that can represent an inner product in a feature space when the required
mathematical conditions hold.
KV cache. Stored attention keys and values used to avoid repeated computation during autoregressive
decoding.
Latent variable. An unobserved variable used to represent underlying structure in a probabilistic or learned
model.
LoRA. Low-rank adaptation: learning compact parameter updates while freezing most base-model weights.
Mechanistic interpretability. Investigation of the computations implemented by model parameters and
internal activations.
Meta-learning. Learning an adaptation strategy or representation across a distribution of tasks.
Mixture of experts. An architecture in which a router selects or weights specialized subnetworks, often
activating only a subset per input.
Model card. Documentation of a model's intended uses, training and evaluation context, limitations, and
relevant risks.

Multimodal model. A model processing or generating more than one modality, such as text, images, audio, or
actions.
Offline reinforcement learning. Learning a policy from a fixed dataset of interactions without unrestricted
new environment sampling.
Open weights. Publicly accessible model parameters under a specified license, distinct from complete opensource reproducibility.
Overfitting. Learning sample-specific patterns that reduce performance on the intended generalization
distribution.
Policy. A rule or learned distribution for choosing actions given states, observations, or histories.
Post-training. Training stages after broad pretraining, including instruction, preference, safety, and reasoning
adaptation.
Prefill. The inference phase that processes the input context before autoregressive token generation.
Prompt injection. An attempt by untrusted content to redirect an AI system's instructions, actions, or
information handling.
Quantization. Representing values with reduced numerical precision, with tradeoffs in accuracy, memory, and
hardware efficiency.
RAG. Retrieval-augmented generation: conditioning generation on evidence retrieved from an external
collection.
Reward hacking. Obtaining high measured reward by exploiting a proxy or evaluator instead of satisfying the
intended objective.
RLHF. Reinforcement learning from human feedback, commonly using human preferences to learn a reward
signal.
RLAIF. Reinforcement learning from AI feedback, using model-generated judgments as part of the supervision.
Self-supervision. Learning from targets derived from the data itself, such as masked content or subsequent
tokens.
Sparsity. Using only a subset of possible parameters, activations, connections, or components in a computation.
Superposition. A representational arrangement in which multiple features share dimensions, complicating
single-neuron interpretation.
Synthetic data. Data produced by models, simulators, or algorithms rather than directly collected natural
observations.
Test-time compute. Computation allocated during inference, including sampling, search, reasoning,
verification, and tool use.
Token. A discrete unit in a model's sequence representation, which may be a text fragment, image code, audio
code, or action.
Transformer. An architecture combining attention, feed-forward transformations, residual paths, and
normalization.
VLA. Vision-language-action model: a model connecting visual observations and language to action
representations.
World model. A learned or specified representation of environment dynamics used for prediction, planning, or
control.

## 26 Bibliography and source notes

References R01-R114 cover foundational papers, books, and technical reports. Sources S01-S17 support the
dated landscape and current institutional context. All web sources were consulted or cataloged for this edition
on September 18, 2026. Primary paper links are provided so the reader can inspect complete authorship,
revisions, methods, and limitations. An arXiv preprint is not automatically peer reviewed; venues and later
publication dates are supplied where relevant.
The catalog's short descriptions and the comparative discussion are original synthesis. No source's abstract is
reproduced. Primary 2026 product announcements are explicitly treated as developer reports. The Stanford
report overview supplies the selected landscape statistics; its linked full report should be used for deeper
methodological detail. This is a curated technical guide, not a systematic review with an exhaustive search
protocol.

Foundational and technical references
[R01] Warren McCulloch and Walter Pitts (1943). A Logical Calculus of the Ideas Immanent in Nervous Activity.
Bulletin of Mathematical Biophysics.
[R02] Alan Turing (1950). Computing Machinery and Intelligence. Mind.
[R03] John McCarthy, Marvin Minsky, Nathaniel Rochester, and Claude Shannon (1955). A Proposal for the
Dartmouth Summer Research Project on Artificial Intelligence. Research proposal.
[R04] Frank Rosenblatt (1958). The Perceptron: A Probabilistic Model for Information Storage and
Organization in the Brain. Psychological Review.
[R05] David Rumelhart, Geoffrey Hinton, and Ronald Williams (1986). Learning Representations by BackPropagating Errors. Nature.
[R06] Yann LeCun, Leon Bottou, Yoshua Bengio, and Patrick Haffner (1998). Gradient-Based Learning Applied
to Document Recognition. Proceedings of the IEEE.
[R07] Judea Pearl (1988). Probabilistic Reasoning in Intelligent Systems. Morgan Kaufmann book.
[R08] Corinna Cortes and Vladimir Vapnik (1995). Support-Vector Networks. Machine Learning.
[R09] Leo Breiman (1996). Bagging Predictors. Machine Learning.
[R10] Leo Breiman (2001). Random Forests. Machine Learning.
[R11] Jerome Friedman (2001). Greedy Function Approximation: A Gradient Boosting Machine. Annals of
Statistics.
[R12] Christopher Bishop (2006). Pattern Recognition and Machine Learning. Springer book.
[R13] Sepp Hochreiter and Jurgen Schmidhuber (1997). Long Short-Term Memory. Neural Computation.
[R14] Jia Deng et al. (2009). ImageNet: A Large-Scale Hierarchical Image Database. CVPR.
[R15] Alex Krizhevsky, Ilya Sutskever, and Geoffrey Hinton (2012). ImageNet Classification with Deep
Convolutional Neural Networks. NeurIPS.
[R16] Yann LeCun, Yoshua Bengio, and Geoffrey Hinton (2015). Deep Learning. Nature review.
[R17] Diederik Kingma and Jimmy Ba (2014). Adam: A Method for Stochastic Optimization. ICLR 2015; first
preprint 2014.

[R18] Kaiming He, Xiangyu Zhang, Shaoqing Ren, and Jian Sun (2015). Deep Residual Learning for Image
Recognition. CVPR 2016; first preprint 2015.
[R19] Tomas Mikolov, Kai Chen, Greg Corrado, and Jeffrey Dean (2013). Efficient Estimation of Word
Representations in Vector Space. ICLR workshop preprint.
[R20] Jeffrey Pennington, Richard Socher, and Christopher Manning (2014). GloVe: Global Vectors for Word
Representation. EMNLP.
[R21] Ilya Sutskever, Oriol Vinyals, and Quoc Le (2014). Sequence to Sequence Learning with Neural Networks.
NeurIPS.
[R22] Dzmitry Bahdanau, Kyunghyun Cho, and Yoshua Bengio (2014). Neural Machine Translation by Jointly
Learning to Align and Translate. ICLR 2015; first preprint 2014.
[R23] Ashish Vaswani et al. (2017). Attention Is All You Need. NeurIPS.
[R24] Jacob Devlin, Ming-Wei Chang, Kenton Lee, and Kristina Toutanova (2018). BERT: Pre-training of Deep
Bidirectional Transformers for Language Understanding. NAACL 2019; first preprint 2018.
[R25] Tom Brown et al. (2020). Language Models are Few-Shot Learners. NeurIPS.
[R26] Alexey Dosovitskiy et al. (2020). An Image is Worth 16x16 Words: Transformers for Image Recognition
at Scale. ICLR 2021; first preprint 2020.
[R27] Ting Chen, Simon Kornblith, Mohammad Norouzi, and Geoffrey Hinton (2020). A Simple Framework for
Contrastive Learning of Visual Representations. ICML.
[R28] Alec Radford et al. (2021). Learning Transferable Visual Models From Natural Language Supervision.
ICML.
[R29] Mathilde Caron et al. (2021). Emerging Properties in Self-Supervised Vision Transformers. ICCV.
[R30] Rishi Bommasani et al. (2021). On the Opportunities and Risks of Foundation Models. Stanford CRFM
report.
[R31] Jared Kaplan et al. (2020). Scaling Laws for Neural Language Models. Preprint.
[R32] Jordan Hoffmann et al. (2022). Training Compute-Optimal Large Language Models. NeurIPS.
[R33] Nikhil Sardana et al. (2024). Beyond Chinchilla-Optimal: Accounting for Inference in Language Model
Scaling Laws. ICML.
[R34] Long Ouyang et al. (2022). Training Language Models to Follow Instructions with Human Feedback.
NeurIPS.
[R35] John Schulman et al. (2017). Proximal Policy Optimization Algorithms. Preprint.
[R36] Rafael Rafailov et al. (2023). Direct Preference Optimization: Your Language Model is Secretly a Reward
Model. NeurIPS.
[R37] Yuntao Bai et al. (2022). Constitutional AI: Harmlessness from AI Feedback. Preprint.
[R38] Jason Wei et al. (2022). Chain-of-Thought Prompting Elicits Reasoning in Large Language Models.
NeurIPS.
[R39] Xuezhi Wang et al. (2022). Self-Consistency Improves Chain of Thought Reasoning in Language Models.
ICLR 2023; first preprint 2022.
[R40] Charlie Snell, Jaehoon Lee, Kelvin Xu, and Aviral Kumar (2024). Scaling LLM Test-Time Compute
Optimally can be More Effective than Scaling Model Parameters. ICLR 2025; first preprint 2024.

[R41] DeepSeek-AI et al. (2025). DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement
Learning. Technical report.
[R42] David Silver et al. (2016). Mastering the Game of Go with Deep Neural Networks and Tree Search. Nature.
[R43] David Silver et al. (2017). Mastering Chess and Shogi by Self-Play with a General Reinforcement Learning
Algorithm. Preprint; related Science article 2018.
[R44] Patrick Lewis et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks.
NeurIPS.
[R45] Nelson Liu et al. (2023). Lost in the Middle: How Language Models Use Long Contexts. TACL 2024; first
preprint 2023.
[R46] Shunyu Yao et al. (2022). ReAct: Synergizing Reasoning and Acting in Language Models. ICLR 2023; first
preprint 2022.
[R47] Timo Schick et al. (2023). Toolformer: Language Models Can Teach Themselves to Use Tools. NeurIPS.
[R48] Noah Shinn et al. (2023). Reflexion: Language Agents with Verbal Reinforcement Learning. NeurIPS.
[R49] Alexander Kirillov et al. (2023). Segment Anything. ICCV.
[R50] Alexei Baevski, Yuhao Zhou, Abdelrahman Mohamed, and Michael Auli (2020). wav2vec 2.0: A
Framework for Self-Supervised Learning of Speech Representations. NeurIPS.
[R51] Alec Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision. ICML 2023;
first preprint 2022.
[R52] Jade Copet et al. (2023). Simple and Controllable Music Generation. NeurIPS.
[R53] Yizhong Wang et al. (2022). Self-Instruct: Aligning Language Models with Self-Generated Instructions.
ACL 2023; first preprint 2022.
[R54] Ilia Shumailov et al. (2024). AI Models Collapse When Trained on Recursively Generated Data. Nature.
[R55] Rylan Schaeffer, Brando Miranda, and Sanmi Koyejo (2023). Are Emergent Abilities of Large Language
Models a Mirage?. NeurIPS.
[R56] Diederik Kingma and Max Welling (2013). Auto-Encoding Variational Bayes. ICLR 2014; first preprint
2013.
[R57] Ian Goodfellow et al. (2014). Generative Adversarial Nets. NeurIPS.
[R58] Jonathan Ho, Ajay Jain, and Pieter Abbeel (2020). Denoising Diffusion Probabilistic Models. NeurIPS.
[R59] Robin Rombach et al. (2021). High-Resolution Image Synthesis with Latent Diffusion Models. CVPR 2022;
first preprint 2021.
[R60] Yaron Lipman et al. (2022). Flow Matching for Generative Modeling. ICLR 2023; first preprint 2022.
[R61] Volodymyr Mnih et al. (2013). Playing Atari with Deep Reinforcement Learning. Preprint.
[R62] Richard Sutton and Andrew Barto (2018). Reinforcement Learning: An Introduction, Second Edition. MIT
Press book.
[R63] Christopher Watkins and Peter Dayan (1992). Q-learning. Machine Learning.
[R64] Tuomas Haarnoja, Aurick Zhou, Pieter Abbeel, and Sergey Levine (2018). Soft Actor-Critic: Off-Policy
Maximum Entropy Deep Reinforcement Learning with a Stochastic Actor. ICML.
[R65] Anthony Brohan et al. (2023). RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic
Control. CoRL.

[R66] Moo Jin Kim et al. (2024). OpenVLA: An Open-Source Vision-Language-Action Model. CoRL.
[R67] Cheng Chi et al. (2023). Diffusion Policy: Visuomotor Policy Learning via Action Diffusion. RSS.
[R68] Danijar Hafner, Jurgis Pasukonis, Jimmy Ba, and Timothy Lillicrap (2023). Mastering Diverse Domains
through World Models. Preprint; later Nature publication.
[R69] Yehuda Koren, Robert Bell, and Chris Volinsky (2009). Matrix Factorization Techniques for
Recommender Systems. Computer.
[R70] Thomas Kipf and Max Welling (2016). Semi-Supervised Classification with Graph Convolutional
Networks. ICLR 2017; first preprint 2016.
[R71] William Hamilton, Rex Ying, and Jure Leskovec (2017). Inductive Representation Learning on Large
Graphs. NeurIPS.
[R72] Abhimanyu Das et al. (2023). A Decoder-Only Foundation Model for Time-Series Forecasting. ICML 2024;
first preprint 2023.
[R73] Judea Pearl (2009). Causality: Models, Reasoning, and Inference, Second Edition. Cambridge University
Press book.
[R74] Bernhard Scholkopf et al. (2021). Towards Causal Representation Learning. Proceedings of the IEEE.
[R75] Victor Chernozhukov et al. (2018). Double/Debiased Machine Learning for Treatment and Structural
Parameters. The Econometrics Journal.
[R76] Chelsea Finn, Pieter Abbeel, and Sergey Levine (2017). Model-Agnostic Meta-Learning for Fast
Adaptation of Deep Networks. ICML.
[R77] James Kirkpatrick et al. (2016). Overcoming Catastrophic Forgetting in Neural Networks. PNAS 2017;
first preprint 2016.
[R78] Brendan McMahan et al. (2016). Communication-Efficient Learning of Deep Networks from
Decentralized Data. AISTATS 2017; first preprint 2016.
[R79] Martin Abadi et al. (2016). Deep Learning with Differential Privacy. ACM CCS.
[R80] John Jumper et al. (2021). Highly Accurate Protein Structure Prediction with AlphaFold. Nature.
[R81] Josh Abramson et al. (2024). Accurate Structure Prediction of Biomolecular Interactions with AlphaFold
3. Nature.
[R82] Joseph Watson et al. (2023). De Novo Design of Protein Structure and Function with RFdiffusion. Nature.
[R83] Remi Lam et al. (2023). Learning Skillful Medium-Range Global Weather Forecasting. Science.
[R84] Ilan Price et al. (2024). Probabilistic Weather Forecasting with Machine Learning. Nature online 2024;
volume 637, 2025.
[R85] Amil Merchant et al. (2023). Scaling Deep Learning for Materials Discovery. Nature.
[R86] Zongyi Li et al. (2020). Fourier Neural Operator for Parametric Partial Differential Equations. ICLR 2021;
first preprint 2020.
[R87] Trieu Trinh et al. (2024). Solving Olympiad Geometry without Human Demonstrations. Nature.
[R88] Alexander Novikov et al. (2025). AlphaEvolve: A Coding Agent for Scientific and Algorithmic Discovery.
Technical report.
[R89] Mark Chen et al. (2021). Evaluating Large Language Models Trained on Code. Technical report.

[R90] Carlos Jimenez et al. (2023). SWE-bench: Can Language Models Resolve Real-World GitHub Issues?. ICLR
2024; first preprint 2023.
[R91] Tianbao Xie et al. (2024). OSWorld: Benchmarking Multimodal Agents for Open-Ended Tasks in Real
Computer Environments. NeurIPS.
[R92] Alex Wang et al. (2018). GLUE: A Multi-Task Benchmark and Analysis Platform for Natural Language
Understanding. ICLR 2019; first preprint 2018.
[R93] Dan Hendrycks et al. (2020). Measuring Massive Multitask Language Understanding. ICLR 2021; first
preprint 2020.
[R94] David Rein et al. (2023). GPQA: A Graduate-Level Google-Proof Q&A Benchmark. COLM 2024; first
preprint 2023.
[R95] Long Phan et al. (2025). Humanity's Last Exam. Preprint; revised through July 2026.
[R96] Anastasios Angelopoulos and Stephen Bates (2021). A Gentle Introduction to Conformal Prediction and
Distribution-Free Uncertainty Quantification. Tutorial preprint.
[R97] Scott Lundberg and Su-In Lee (2017). A Unified Approach to Interpreting Model Predictions. NeurIPS.
[R98] Nelson Elhage et al. (2022). Toy Models of Superposition. Transformer Circuits research.
[R99] Emmanuel Ameisen et al. (2025). Circuit Tracing: Revealing Computational Graphs in Language Models.
Transformer Circuits research.
[R100] Ian Goodfellow, Jonathon Shlens, and Christian Szegedy (2014). Explaining and Harnessing Adversarial
Examples. ICLR 2015; first preprint 2014.
[R101] Jon Kleinberg, Sendhil Mullainathan, and Manish Raghavan (2016). Inherent Trade-Offs in the Fair
Determination of Risk Scores. ITCS 2017; first preprint 2016.
[R102] D. Sculley et al. (2015). Hidden Technical Debt in Machine Learning Systems. NeurIPS.
[R103] Samyam Rajbhandari, Jeff Rasley, Olatunji Ruwase, and Yuxiong He (2019). ZeRO: Memory
Optimizations Toward Training Trillion Parameter Models. SC 2020; first preprint 2019.
[R104] Tri Dao, Daniel Fu, Stefano Ermon, Atri Rudra, and Christopher Re (2022). FlashAttention: Fast and
Memory-Efficient Exact Attention with IO-Awareness. NeurIPS.
[R105] Woosuk Kwon et al. (2023). Efficient Memory Management for Large Language Model Serving with
PagedAttention. SOSP.
[R106] Yaniv Leviathan, Matan Kalman, and Yossi Matias (2022). Fast Inference from Transformers via
Speculative Decoding. ICML 2023; first preprint 2022.
[R107] Geoffrey Hinton, Oriol Vinyals, and Jeff Dean (2015). Distilling the Knowledge in a Neural Network.
Workshop preprint.
[R108] Elias Frantar, Saleh Ashkboos, Torsten Hoefler, and Dan Alistarh (2022). GPTQ: Accurate Post-Training
Quantization for Generative Pre-trained Transformers. ICLR 2023; first preprint 2022.
[R109] Edward Hu et al. (2021). LoRA: Low-Rank Adaptation of Large Language Models. ICLR 2022; first
preprint 2021.
[R110] William Fedus, Barret Zoph, and Noam Shazeer (2021). Switch Transformers: Scaling to Trillion
Parameter Models with Simple and Efficient Sparsity. JMLR 2022; first preprint 2021.
[R111] Albert Gu and Tri Dao (2023). Mamba: Linear-Time Sequence Modeling with Selective State Spaces.
COLM 2024; first preprint 2023.

[R112] Aaron Grattafiori et al. (2024). The Llama 3 Herd of Models. Technical report.
[R113] Dirk Groeneveld et al. (2024). OLMo: Accelerating the Science of Language Models. ACL.
[R114] DeepSeek-AI et al. (2024). DeepSeek-V3 Technical Report. Technical report.

Dated landscape and institutional sources
[S01] Stanford HAI AI Index Steering Committee (2026). The 2026 AI Index Report and official report
overview. Accessed September 18, 2026.
[S02] OpenAI (2026-09-03). GPT-6 Astra: A New Generation of Intelligence. Accessed September 18, 2026.
[S03] OpenAI (2026-09-03). Safety Overview: GPT-6 Astra. Accessed September 18, 2026.
[S04] Anthropic (2026-09-01). Introducing Claude Fable 5.1 and Claude Mythos 5.1. Accessed September 18,
2026.
[S05] Anthropic (2026-09-17). Measurements for Understanding the Pace of AI Development Inside Frontier
Labs. Accessed September 18, 2026.
[S06] Carolina Parada, Google DeepMind (2026-07-30). Gemini Robotics 2 Brings Whole Body Intelligence to
Robots. Accessed September 18, 2026.
[S07] AlphaGenome Atlas team, Google DeepMind (2026-09-08). AlphaGenome Atlas: A Predictive Map of
Every Possible DNA Letter Change in the Human Genome. Accessed September 18, 2026.
[S08] OpenAI (2026-02-23). Why SWE-bench Verified No Longer Measures Frontier Coding Capabilities.
Accessed September 18, 2026.
[S09] OpenAI (2026-07-08). Separating Signal from Noise in Coding Evaluations. Accessed September 18, 2026.
[S10] NIST (2024). Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence
Profile, NIST AI 600-1. Accessed September 18, 2026.
[S11] European Commission (Accessed 2026-09-18). Navigating the AI Act. Accessed September 18, 2026.
[S12] European Commission (2026). Commission Starts Enforcing AI Act Rules and New Transparency
Requirements on 2 August. Accessed September 18, 2026.
[S13] NVIDIA (2026). Inside NVIDIA Rubin GPU Architecture: Powering the Era of Agentic AI. Accessed
September 18, 2026.
[S14] Google Cloud (2025). Ironwood TPUs and New Axion-Based VMs for Your AI Workloads. Accessed
September 18, 2026.
[S15] International Energy Agency (2026). Key Questions on Energy and AI: Executive Summary. Accessed
September 18, 2026.
[S16] Raffi Krikorian, Mozilla (2026-07-14). Mozilla's Inaugural State of Open Source AI Report Is Here.
Accessed September 18, 2026.
[S17] Google DeepMind (2026-05-07). AlphaEvolve: Gemini-Powered Coding Agent Scaling Impact Across
Fields. Accessed September 18, 2026.

