# howdoi

**Intent-based Unix & Git command discovery — right in your terminal.**

You know what you want to do. You just don't remember the exact command or flags.
`howdoi` meets you there — describe your intent, get real copy-paste-ready examples instantly.
No internet. No LLM at runtime. Just fast local lookup.

```
$ howdoi find files modified recently

  INSPECT  find  Search for files and directories in a hierarchy
────────────────────────────────────────────────────────────────

  ▸ Find files modified in the last 7 days
    find . -mtime -7

  ▸ Find files not modified in over 30 days
    find . -mtime +30

  ▸ Find files modified today
    find . -mtime 0

────────────────────────────────────────────────────────────────
```

---

## Install

### Option 1 — Global install (recommended)

Install once, use anywhere. The fastest experience — no network call on every run.

```bash
npm install -g @howdoi-cli/cli
```

Then just use it:

```bash
howdoi
howdoi search for string in file
howdoi undo last commit
```

> **Requires Node.js ≥ 18.** Check with `node --version`.

---

### Option 2 — Run without installing (npx)

No install needed. npm downloads and runs it on demand.
There will be a short delay on first run while npm fetches the package.

```bash
npx @howdoi-cli/cli
npx @howdoi-cli/cli search for string in file
npx @howdoi-cli/cli undo last commit
```

---

### Option 3 — Build from source

For contributors or if you want to hack on it.

**Requirements:** [Bun](https://bun.sh) ≥ 1.0

```bash
git clone https://github.com/SiphoChris/howdoi-cli.git
cd howdoi-cli
bun install
bun run build
npm install -g .
```

---

## Usage

### Guided browser — `howdoi` (no args)

Browse tools by category interactively. Good for exploration when you're not sure what tool you need.

```bash
howdoi
```

Walk through:
1. Pick a category (File Management, Text Processing, File Inspection, Git)
2. Pick a tool
3. See all examples

---

### Intent search — `howdoi <what you want to do>`

Describe your intent in plain English. Autocomplete suggestions appear as you type — select the closest match and hit Enter.

```bash
howdoi search for string in file
howdoi delete folder recursively
howdoi undo last commit
howdoi count lines in file
howdoi follow log file live
howdoi find large files
howdoi squash commits
howdoi recover lost commit
```

---

### Direct tool lookup — `howdoi <toolname>`

Already know the tool? Jump straight to all its examples.

```bash
howdoi grep
howdoi sed
howdoi find
howdoi tail
howdoi git log
howdoi git stash
howdoi git rebase
```

---

### List all tools — `howdoi --list`

See every available tool grouped by category.

```bash
howdoi --list
```

---

## What's included

### File Management
| Tool | Description |
|------|-------------|
| `ls` | List directory contents |
| `find` | Search for files and directories |
| `cp` | Copy files and directories |
| `mv` | Move or rename files |
| `rm` | Remove files and directories |
| `mkdir` | Create directories |
| `touch` | Create empty files |
| `chmod` | Change file permissions |
| `chown` | Change file ownership |
| `ln` | Create symbolic and hard links |

### Text Processing
| Tool | Description |
|------|-------------|
| `grep` | Search for patterns in files |
| `sed` | Find and replace, delete lines |
| `awk` | Column extraction and processing |
| `sort` | Sort lines of text |
| `uniq` | Remove or count duplicate lines |
| `wc` | Count lines, words, characters |
| `cut` | Extract columns from text |
| `head` | Show first N lines of a file |
| `tail` | Show last N lines, follow live |
| `diff` | Compare files line by line |
| `tr` | Translate or delete characters |
| `cat` | Print and concatenate files |

### File Inspection
| Tool | Description |
|------|-------------|
| `tree` | Display directory as a tree |
| `stat` | Show file metadata |
| `du` | Check directory/file sizes |
| `df` | Check filesystem disk space |

### Git
| Tool | Description |
|------|-------------|
| `git log` | View commit history |
| `git diff` | Show what changed |
| `git stash` | Save changes temporarily |
| `git rebase` | Rebase and clean up history |
| `git reset` | Undo commits or unstage |
| `git restore` | Discard changes in files |
| `git reflog` | Recover lost commits |
| `git bisect` | Binary search for bad commit |
| `git cherry-pick` | Apply commits from another branch |

---

## How it works

All knowledge lives in local YAML files bundled with the package.
No network calls at runtime. No LLM. Fast startup every time.

```
howdoi delete folder recursively
         ↓
  fuzzy match against intent index (fuse.js)
         ↓
  best match: rm  →  intent: "delete folder recursively"
         ↓
  render examples tagged to that intent
```

Each tool is a YAML file:

```yaml
tool: rm
category: file-management
description: Remove files and directories
intents:
  - delete file
  - remove folder
  - delete folder recursively
  - force delete file
examples:
  - intent: delete folder recursively
    title: Delete a directory and all its contents
    command: rm -rf dir/
```

---

## Publishing to npm

```bash
# Make sure you're logged in
npm login

# Update the version in package.json first, then:
bun run build
npm publish --access public
```

The `prepublishOnly` script runs the build automatically, so you can also just:

```bash
npm publish --access public
```

---

## Contributing

Adding a new tool is a single YAML file. No code changes needed.

### Steps

1. Choose the right category under `data/`:
   - `data/file-management/`
   - `data/text-processing/`
   - `data/file-inspection/`
   - `data/git/`

2. Create `your-tool.yaml`:

```yaml
tool: mytool
category: file-management
description: One-line description of what it does
intents:
  - natural phrase describing what someone wants to do
  - another way someone might phrase this
  - yet another phrasing
examples:
  - intent: natural phrase describing what someone wants to do
    title: Human-readable title for this example
    command: mytool --flag argument
  - intent: another way someone might phrase this
    title: Another example
    command: mytool --other-flag
```

3. Build and test:

```bash
bun run build
howdoi your intent here
```

**Tips for great intents:**
- Write them as someone would naturally say them, not as documentation
- Aim for 8–15 intent phrases per tool — variety helps fuzzy matching
- Think of all the phrasings: "delete file", "remove file", "erase file"

**Tips for great examples:**
- Commands must be real and copy-paste ready
- Use realistic placeholders: `file.txt`, `app.log`, `dir/`
- Keep `title` short and scannable

---

## Project structure

```
howdoi-cli/
├── src/
│   ├── cli/
│   │   └── index.ts          # Entry point, arg parsing, all modes
│   ├── engine/
│   │   ├── types.ts          # Shared TypeScript types
│   │   ├── loader.ts         # YAML loader (resolves path for npm + dev)
│   │   └── search.ts         # Fuse.js search engine
│   └── renderer/
│       └── display.ts        # Chalk-powered card renderer
├── data/
│   ├── file-management/      # ls, find, cp, mv, rm, mkdir ...
│   ├── text-processing/      # grep, sed, awk, sort, uniq ...
│   ├── file-inspection/      # tree, stat, du, df
│   └── git/                  # log, diff, stash, rebase ...
├── dist/                     # Built output (git-ignored, npm-included)
│   ├── cli.js                # Bundled binary
│   └── data/                 # YAML files copied here by build
├── tsup.config.ts
├── tsconfig.json
└── package.json
```

---

## Development

```bash
# Run without building
bun run dev
bun run dev -- search for string in file
bun run dev -- grep
bun run dev -- --list

# Build (bundles JS + copies data/ into dist/)
bun run build

# Test the built output directly
node dist/cli.js --help
node dist/cli.js grep
```

---

## License

MIT — see [LICENSE](./LICENSE)