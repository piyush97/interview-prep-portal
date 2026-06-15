# Example Profiles

Copy any of these to `~/.interview-prep-portal/profile.yaml` and customize
for your own situation. Each one shows a different career stage and role
type so you can see how the schema adapts.

| File | Persona | Why it helps |
|------|---------|--------------|
| `example-software-engineer.yaml` | Mid-level IC engineer with C2C focus | Shows the original "Piyush-shaped" use case |
| `example-nurse.yaml` | Senior ICU nurse → NP transition | Non-engineer; healthcare career path |
| `example-teacher.yaml` | Mid-career teacher → edtech | Career-pivot case |
| `example-marketer.yaml` | Senior B2B marketer | Non-tech industry |

## How to use

```bash
# Option 1: Copy from the repo
cp profiles/example-nurse.yaml ~/.interview-prep-portal/profile.yaml
$EDITOR ~/.interview-prep-portal/profile.yaml

# Option 2: Use the CLI (in the portal repo)
python -m backend.cli profile init --from profiles/example-nurse.yaml
python -m backend.cli profile validate
python -m backend.cli profile show
```

## What the profile is used for

Every AI tool (evaluate_jd, cover_letter, etc.) reads your profile and
injects it into the prompt. So a cover letter generated for the nurse
profile talks about ICU, ACLS, and patient outcomes — not "AI/LLM stacks".
