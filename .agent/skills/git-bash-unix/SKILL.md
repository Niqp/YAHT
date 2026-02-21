---
name: git-bash-unix
description: Run all repo terminal commands via Git Bash and prefer Unix-style command syntax and paths.
---

# Git Bash + Unix Style Skill

Use this skill when working in this repository to keep command usage consistent with Unix shells even on Windows.

## Core Rule

- Execute terminal commands through Git Bash, not PowerShell syntax, unless Git Bash is unavailable.

## Command Execution Pattern

Use one of these launch forms:

```powershell
& "C:/Program Files/Git/bin/bash.exe" -lc "<command>"
```

```powershell
bash -lc "<command>"
```

## Unix-Style Conventions

- Prefer Unix commands (`ls`, `cat`, `grep`, `find`, `sed`, `awk`, `chmod`, `rm`, `cp`, `mv`).
- Prefer Unix path separators (`/`) in commands.
- Convert Windows drive paths to Git Bash style:
  - `d:\WebDev\YAHT` -> `/d/WebDev/YAHT`
  - `C:\Users\Nikita` -> `/c/Users/Nikita`
- Use forward slashes in script arguments and glob patterns whenever possible.

## Working Directory

- Start commands from repo root in Bash style:

```bash
cd /d/WebDev/YAHT
```

- For one-off commands, combine `cd` and command:

```bash
cd /d/WebDev/YAHT && npm test
```

## Fallback Rule

- If Git Bash is not installed or fails to launch, report it briefly and fall back to the default shell while keeping Unix-like command patterns where possible.
