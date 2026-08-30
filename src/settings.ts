import { App, PluginSettingTab, Setting } from 'obsidian';
import type ClaudeNotesPlugin from './main';
import { writeVaultConfig } from './vaultConfig';

export interface ClaudeNotesSettings {
	cliPath: string;
	bridgeEnabled: boolean;
	bridgePort: number;
	folderPattern: string;
}

export const DEFAULT_SETTINGS: ClaudeNotesSettings = {
	cliPath: '',
	bridgeEnabled: false,
	bridgePort: 27124,
	folderPattern: 'Claude Notes/{project}/{date}-{slug}.md',
};

export class ClaudeNotesSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private plugin: ClaudeNotesPlugin
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('CLI binary path')
			.setDesc('Absolute path to the obsidian-notes CLI binary. Needed for the "Generate note here" command. Desktop only.')
			.addText((text) =>
				text
					.setPlaceholder('/usr/local/bin/obsidian-notes')
					.setValue(this.plugin.settings.cliPath)
					.onChange(async (value) => {
						this.plugin.settings.cliPath = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Folder pattern')
			.setDesc('Where generated notes go. Placeholders: {project} {date} {slug}. Shared with the CLI via .claude-notes.json.')
			.addText((text) =>
				text.setValue(this.plugin.settings.folderPattern).onChange(async (value) => {
					this.plugin.settings.folderPattern = value;
					await this.plugin.saveSettings();
					await this.syncVaultConfig();
				})
			);

		new Setting(containerEl)
			.setName('Enable local bridge')
			.setDesc(
				'Lets the CLI push instant sidebar refreshes over 127.0.0.1. Off by default — an always-open local port is unnecessary attack surface for most setups; without it, Obsidian still picks up new notes natively on focus.'
			)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.bridgeEnabled).onChange(async (value) => {
					this.plugin.settings.bridgeEnabled = value;
					await this.plugin.saveSettings();

					if (value) {
						this.plugin.bridge.start(this.plugin.settings.bridgePort);
					} else {
						this.plugin.bridge.stop();
					}
				})
			);

		new Setting(containerEl)
			.setName('Bridge port')
			.setDesc('Restart Obsidian (or toggle the bridge off/on) after changing this for it to take effect.')
			.addText((text) =>
				text.setValue(String(this.plugin.settings.bridgePort)).onChange(async (value) => {
					const port = Number(value) || DEFAULT_SETTINGS.bridgePort;
					this.plugin.settings.bridgePort = port;
					await this.plugin.saveSettings();
					await this.syncVaultConfig();
				})
			);
	}

	private async syncVaultConfig(): Promise<void> {
		await writeVaultConfig(this.app, {
			folderPattern: this.plugin.settings.folderPattern,
			frontmatterDefaults: { source: 'claude-code', tags: [] },
			bridgePort: this.plugin.settings.bridgePort,
		});
	}
}
