import { spawn } from 'child_process';
import { FileSystemAdapter, MarkdownView, Notice, Plugin, WorkspaceLeaf } from 'obsidian';
import { BridgeServer } from './bridge';
import { ClaudeNotesSettings, ClaudeNotesSettingTab, DEFAULT_SETTINGS } from './settings';
import { readVaultConfig } from './vaultConfig';
import { ClaudeNotesView, VIEW_TYPE_CLAUDE_NOTES } from './view';

export default class ClaudeNotesPlugin extends Plugin {
	settings!: ClaudeNotesSettings;
	bridge!: BridgeServer;

	async onload(): Promise<void> {
		await this.loadSettings();

		// .claude-notes.json (vault root) is the shared source of truth with the CLI —
		// it wins over whatever this plugin had cached in its own settings.
		const vaultConfig = await readVaultConfig(this.app);
		this.settings.folderPattern = vaultConfig.folderPattern;
		this.settings.bridgePort = vaultConfig.bridgePort;

		this.bridge = new BridgeServer(this);

		this.registerView(VIEW_TYPE_CLAUDE_NOTES, (leaf) => new ClaudeNotesView(leaf, this));

		this.addRibbonIcon('file-text', 'Claude Notes', () => this.activateView());

		this.addCommand({
			id: 'generate-note-here',
			name: 'Generate note here',
			callback: () => this.generateNote(),
		});

		this.addSettingTab(new ClaudeNotesSettingTab(this.app, this));

		if (this.settings.bridgeEnabled) {
			this.bridge.start(this.settings.bridgePort);
		}
	}

	onunload(): void {
		this.bridge?.stop();
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_CLAUDE_NOTES)[0] ?? null;

		if (!leaf) {
			const rightLeaf: WorkspaceLeaf | null = workspace.getRightLeaf(false);

			if (!rightLeaf) {
				return;
			}

			leaf = rightLeaf;
			await leaf.setViewState({ type: VIEW_TYPE_CLAUDE_NOTES, active: true });
		}

		workspace.revealLeaf(leaf);
	}

	refreshView(): void {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_CLAUDE_NOTES)) {
			if (leaf.view instanceof ClaudeNotesView) {
				leaf.view.refresh();
			}
		}
	}

	/**
	 * ponytail: title defaults to the active file's name (or a timestamp with no file
	 * open) and body to the current selection/note content — swap for a proper input
	 * modal if you want to type a custom title per note.
	 */
	generateNote(): void {
		if (!this.settings.cliPath) {
			new Notice('Claude Notes: set the CLI binary path in settings first.');

			return;
		}

		const adapter = this.app.vault.adapter;

		if (!(adapter instanceof FileSystemAdapter)) {
			new Notice('Claude Notes: the CLI command only works on desktop.');

			return;
		}

		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		const body = activeView?.editor.getSelection() || activeView?.editor.getValue() || '';
		const title = activeView?.file?.basename ?? `Note ${new Date().toISOString()}`;

		const child = spawn(this.settings.cliPath, [
			'note:create',
			`--project=${this.app.vault.getName()}`,
			`--title=${title}`,
			`--vault=${adapter.getBasePath()}`,
		]);

		child.stdin.write(body);
		child.stdin.end();

		child.on('error', (err) => new Notice(`Claude Notes: failed to run CLI — ${err.message}`));
		child.on('exit', (code) => {
			new Notice(code === 0 ? 'Claude Notes: note created.' : `Claude Notes: CLI exited with code ${code}.`);
		});
	}
}
