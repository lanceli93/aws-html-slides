# The Economics of Generative AI

---

## Slide 01: Title
type: title

### heading
The Economics of Generative AI

### subtitle
What it really costs to build, run, and scale models in production — and where the money actually goes.

---

## Slide 02: The Cost Curve
type: content

### heading
Inference Is the New Line Item

### body
- Training is a one-time capital cost; inference is a forever operating cost
- Token volume — not user count — is the true cost driver
- Price per million tokens has fallen ~10x in two years, but usage rose faster

### chart
type: line
labels: 23 Q1, 23 Q3, 24 Q1, 24 Q3, 25 Q1, 25 Q3
Cost / 1M tokens ($): 30, 18, 9, 5, 2.5, 1.2
Monthly tokens (B): 4, 9, 21, 48, 95, 180

---

## Slide 03: Where the Budget Goes
type: content

### heading
Anatomy of a Model Bill

### body
- Compute dominates, but it is no longer the whole story
- Data pipelines and human evaluation are the silent budget lines
- Serving overhead grows with every nine of reliability

### chart
type: doughnut
labels: Inference compute, Training compute, Data + labeling, Eval + safety, Serving + ops
Share (%): 46, 22, 14, 10, 8

---

## Slide 04: Build vs Buy
type: content

### heading
Build vs. Buy vs. Blend

### body
- Most teams land on a blend: hosted frontier models for the hard tasks, small open models for the rest
- Routing cheap tokens to small models is the single biggest lever on cost

### table
| Dimension | Hosted Frontier API | Self-Hosted Open Model |
|-----------|---------------------|------------------------|
| Time to first token | Minutes | Weeks |
| Cost at low volume | Low | High |
| Cost at high volume | High | Low |
| Data control | Shared boundary | Full control |
| Ops burden | Near zero | Significant |

---

## Slide 05: Unit Economics
type: content

### heading
The Numbers That Matter

### body
- Track cost per successful task, not cost per token
- Caching, batching, and routing routinely cut bills by half or more

### chart
type: bar
labels: Baseline, + Caching, + Batching, + Routing, + Distillation
Cost / 1K tasks ($): 100, 72, 58, 34, 21

---

## Slide 06: Levers
type: content

### heading
Five Levers on the Bill

### body
- Right-size the model — most prompts never need a frontier model
- Cache aggressively — repeated context is repeated spend
- Batch offline work — real-time pricing for non-real-time jobs is waste
- Compress prompts — every token in the window is billed
- Measure per-outcome — optimize the metric that maps to revenue

---

## Slide 07: The Takeaway
type: content

### heading
Spend Follows Value

### body
- The cheapest token is the one you never send
- Architecture decisions, not vendor discounts, determine the bill
- Treat tokens like a metered utility — instrument everything

---

## Slide 08: Closing
type: title

### heading
Build for the Bill You Can Defend

### subtitle
Thank you — questions welcome.

---
