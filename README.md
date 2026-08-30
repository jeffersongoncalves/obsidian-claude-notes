<div class="filament-hidden">

![Claude Notes](https://raw.githubusercontent.com/jeffersongoncalves/obsidian-claude-notes/main/art/jeffersongoncalves-obsidian-claude-notes.png)

</div>

# Claude Notes (Obsidian plugin)

<p align="center">
  <a href="https://github.com/jeffersongoncalves/obsidian-claude-notes/releases/latest"><img src="https://img.shields.io/github/v/release/jeffersongoncalves/obsidian-claude-notes" alt="Latest Release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/jeffersongoncalves/obsidian-claude-notes" alt="License" /></a>
</p>

Obsidian plugin for notes written by the Claude Code [`obsidian-notes-cli`](https://github.com/jeffersongoncalves/obsidian-notes-cli): a sidebar of those notes, a command to generate one from inside Obsidian, and live refresh when the CLI writes a new one.

Part of a 3-repo integration:

- [`obsidian-notes-cli`](https://github.com/jeffersongoncalves/obsidian-notes-cli) — writes the notes; this plugin reads them.
- **`obsidian-claude-notes`** (this repo).
- [`claude-code-obsidian-notes`](https://github.com/jeffersongoncalves/claude-code-obsidian-notes) — Claude Code plugin that shells out to the CLI.

## Features

- **Sidebar** — lists every note with `source: claude-code` frontmatter, grouped by `project`. Click to open. Read via Obsidian's own metadata cache — no separate index.
- **"Generate note here" command** — runs the CLI with the current selection (or whole note) as the body. Desktop only (spawns a child process). Set the CLI binary path in settings first.
- **Live refresh** — if the local bridge is enabled, the CLI pings `127.0.0.1:<port>/notes` after writing a file and the sidebar refreshes within ~150ms instead of waiting for Obsidian's normal file-watcher cadence.

## Settings

| Setting | Notes |
|---|---|
| CLI binary path | Absolute path to `obsidian-notes`. Required for the command; not needed just to browse the sidebar. |
| Folder pattern | `{project}` `{date}` `{slug}` placeholders. Written to `.claude-notes.json` at the vault root — the CLI reads the same file. |
| Enable local bridge | Off by default. An always-open local port is unnecessary attack surface for most setups; without it, Obsidian still picks up new notes natively on focus, just not instantly. |
| Bridge port | Default `27124`. |

## Install (manual, until this is on the community plugin list)

1. `npm install && npm run build` (or `bun install && bun run build`).
2. Copy `manifest.json`, `main.js`, `styles.css` into `<vault>/.obsidian/plugins/claude-notes/`.
3. Enable "Claude Notes" in Obsidian's Community Plugins settings.

## Development

```bash
npm install
npm run dev   # esbuild watch — rebuilds main.js on change
```
