# Video Diagram 4: Model Pass/Fail Matrix

**Beat:** ~2:40  ·  **Claim:** Model choice materially changes quest-chain success — DeepSeek R1 passes where Qwen 3 14B fails.

> **Data honesty disclaimer.** This table is **illustrative**. Only the two anchor rows (Qwen 3 14B = FAIL, DeepSeek R1 = PASS) reflect explicit claims from the video strategy. Every other result cell is a representative placeholder that **must be replaced with measured data** before this diagram is shown as fact. Temperatures are real and pulled from `config/llm.js`.

## Diagram (table — strategy specifies a TABLE here)

| Model | Dialogue temp | Resolution temp | Quest-chain result |
|-------|--------------|-----------------|--------------------|
| `google/gemma-3-27b-it:free` | 0.8 | 0.2 | illustrative — replace with measured data |
| `qwen/qwen3-14b-04-28:free` | 0.7 | 0.1 | **FAIL** *(anchor — strategy claim)* |
| `openai/gpt-oss-20b:free` | 0.7 | 0.05 | illustrative — replace with measured data |
| `deepseek/deepseek-chat-v3-0324:free` | 0.6 | 0.1 | illustrative — replace with measured data |
| `deepseek/deepseek-r1-0528:free` | 0.5 | 0.05 | illustrative — replace with measured data |
| `deepseek/deepseek-r1:free` | 0.5 | 0.05 | **PASS** *(anchor — strategy claim)* |

## Speaker Notes (beat ~2:40)

- Same prompt templates, same quest conditions, same evaluator code — swap the model and the quest chain can flip from solved to broken.
- The two anchors come straight from the strategy: DeepSeek R1 carries the chain across the finish line; Qwen 3 14B does not. The other four rows are placeholders — do **not** present them as measured. Before this slide ships, run the chain against each model and fill in the result column.
- Two configured levers worth naming: dialogue temperature (higher = more creative NPC voice) and resolution temperature (near-zero so the yes/no stays deterministic). Notice R1's resolution temp is 0.05 — it's basically being asked to be a reliable judge.
- Takeaway for the viewer: when an LLM-driven quest silently fails, the bug may not be your code — it may be the model. Model selection is a load-bearing config decision.

## Source References

- `config/models.js:12-19` — `AVAILABLE_MODELS`: the six model ids in the table above (gemma-3-27b, qwen3-14b, gpt-oss-20b, deepseek-chat-v3, deepseek-r1-0528, deepseek-r1).
- `config/llm.js:10-23` — gemma-3-27b: dialogue temp 0.8, resolution temp 0.2.
- `config/llm.js:25-39` — qwen3-14b: dialogue temp 0.7, resolution temp 0.1.
- `config/llm.js:40-54` — gpt-oss-20b: dialogue temp 0.7, resolution temp 0.05.
- `config/llm.js:55-69` — deepseek-chat-v3: dialogue temp 0.6, resolution temp 0.1.
- `config/llm.js:70-84` — deepseek-r1-0528: dialogue temp 0.5, resolution temp 0.05.
- `config/llm.js:85-99` — deepseek-r1: dialogue temp 0.5, resolution temp 0.05.
- *Result column (PASS/FAIL): anchors from video strategy; non-anchors are illustrative placeholders, not measured.*
