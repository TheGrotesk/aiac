# aiac — AI as Code

Run AI agent workflows defined in YAML files.

## Install

```bash
npm install
npm run build
npm link   # makes `aiac` available globally
```

Or run directly without building:

```bash
npm run dev -- run examples/code-review.yaml --prompt "path/to/file.ts"
```

## Usage

### Run a workflow

```bash
aiac run workflow.yaml --prompt "your input here"
aiac run workflow.yaml --prompt-file input.txt
aiac run workflow.yaml --prompt "input" --output result.md
aiac run workflow.yaml --prompt "input" --var KEY=value --var FOO=bar
```

### Dry run (no API calls)

```bash
aiac run workflow.yaml --prompt "test input" --dry-run
```

### Validate a workflow YAML

```bash
aiac validate workflow.yaml
```

### Scaffold a new workflow

```bash
aiac init my-workflow
# creates my-workflow.yaml
```

## Workflow YAML format

```yaml
name: My Workflow
description: Optional description
version: "1.0"

stages:
  - id: analyze
    type: llm
    provider: anthropic
    model: claude-sonnet-4-6
    system: You are a helpful assistant.
    prompt: "Analyze this: {{input}}"
    temperature: 0.7
    max_tokens: 2048

  - id: save
    type: file
    action: write
    path: ./output-{{timestamp}}.txt
    content: "{{stages.analyze.output}}"

  - id: fetch
    type: http
    method: GET
    url: "https://api.example.com/data?q={{input}}"
    headers:
      Authorization: "Bearer {{env.MY_TOKEN}}"

  - id: run_script
    type: shell
    command: "echo '{{input}}' | wc -w"
```

## Template variables

| Variable | Description |
|---|---|
| `{{input}}` | Current stage input (previous stage output, or original prompt for first stage) |
| `{{stages.ID.output}}` | Output of a specific stage by id |
| `{{env.VAR}}` | Environment variable |
| `{{timestamp}}` | ISO timestamp at run start |

## Conditional branching

```yaml
stages:
  - id: classify
    type: llm
    provider: anthropic
    model: claude-haiku-4-5-20251001
    prompt: "Reply with only 'urgent' or 'normal': {{input}}"
    next:
      - condition: "output.trim() === 'urgent'"
        stage: handle_urgent
      - stage: handle_normal   # default (no condition)

  - id: handle_urgent
    type: llm
    provider: anthropic
    model: claude-sonnet-4-6
    prompt: "Handle this urgently: {{input}}"

  - id: handle_normal
    type: llm
    provider: anthropic
    model: claude-haiku-4-5-20251001
    prompt: "Handle normally: {{input}}"
```

## Required environment variables

Set the API keys for the providers you use:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export GOOGLE_API_KEY=AIza...
```

## Examples

- `examples/code-review.yaml` — Multi-provider code review pipeline
- `examples/research-pipeline.yaml` — Research and summarization pipeline
