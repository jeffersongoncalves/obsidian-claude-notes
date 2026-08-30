import { ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import type ClaudeNotesPlugin from './main';

export const VIEW_TYPE_CLAUDE_NOTES = 'claude-notes-view';

interface NoteEntry {
	file: TFile;
	title: string;
	project: string;
}

export class ClaudeNotesView extends ItemView {
	constructor(
		leaf: WorkspaceLeaf,
		private plugin: ClaudeNotesPlugin
	) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_CLAUDE_NOTES;
	}

	getDisplayText(): string {
		return 'Claude Notes';
	}

	getIcon(): string {
		return 'file-text';
	}

	async onOpen(): Promise<void> {
		await this.refresh();
	}

	async refresh(): Promise<void> {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.createEl('h4', { text: 'Claude Notes' });

		const entries = this.collectNotes();

		if (entries.length === 0) {
			container.createEl('p', { text: 'No Claude Code notes yet.', cls: 'claude-notes-empty' });

			return;
		}

		const byProject = new Map<string, NoteEntry[]>();

		for (const entry of entries) {
			const list = byProject.get(entry.project) ?? [];
			list.push(entry);
			byProject.set(entry.project, list);
		}

		for (const [project, notes] of byProject) {
			container.createEl('div', { text: project, cls: 'claude-notes-project' });
			const ul = container.createEl('ul', { cls: 'claude-notes-list' });

			for (const note of notes) {
				const li = ul.createEl('li', { text: note.title, cls: 'claude-notes-item' });
				this.registerDomEvent(li, 'click', () => {
					this.app.workspace.getLeaf(false).openFile(note.file);
				});
			}
		}
	}

	/**
	 * Reads frontmatter from Obsidian's own metadata cache — already indexed, no need
	 * for this plugin to parse Markdown files itself.
	 */
	private collectNotes(): NoteEntry[] {
		const entries: NoteEntry[] = [];

		for (const file of this.app.vault.getMarkdownFiles()) {
			const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;

			if (frontmatter?.source !== 'claude-code') {
				continue;
			}

			entries.push({
				file,
				title: frontmatter.title ?? file.basename,
				project: frontmatter.project ?? '-',
			});
		}

		return entries;
	}
}
