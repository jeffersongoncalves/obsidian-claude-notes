import { App, PluginSettingTab, SettingDefinitionItem } from 'obsidian';
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

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: 'CLI binary path',
				desc: 'Absolute path to the obsidian-notes CLI binary. Needed for the "Generate note here" command. Desktop only.',
				control: { type: 'text', key: 'cliPath', placeholder: '/usr/local/bin/obsidian-notes' },
			},
			{
				name: 'Folder pattern',
				desc: 'Where generated notes go. Placeholders: {project} {date} {slug}. Shared with the CLI via .claude-notes.json.',
				control: { type: 'text', key: 'folderPattern', defaultValue: DEFAULT_SETTINGS.folderPattern },
			},
			{
				name: 'Enable local bridge',
				desc: 'Lets the CLI push instant sidebar refreshes over 127.0.0.1. Off by default — an always-open local port is unnecessary attack surface for most setups; without it, Obsidian still picks up new notes natively on focus.',
				control: { type: 'toggle', key: 'bridgeEnabled', defaultValue: DEFAULT_SETTINGS.bridgeEnabled },
			},
			{
				name: 'Bridge port',
				desc: 'Restart Obsidian (or toggle the bridge off/on) after changing this for it to take effect.',
				control: { type: 'number', key: 'bridgePort', defaultValue: DEFAULT_SETTINGS.bridgePort },
			},
		];
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		await super.setControlValue(key, value);

		if (key === 'bridgeEnabled') {
			if (value) {
				this.plugin.bridge.start(this.plugin.settings.bridgePort);
			} else {
				this.plugin.bridge.stop();
			}
		}

		if (key === 'folderPattern' || key === 'bridgePort') {
			await this.syncVaultConfig();
		}
	}

	private async syncVaultConfig(): Promise<void> {
		await writeVaultConfig(this.app, {
			folderPattern: this.plugin.settings.folderPattern,
			frontmatterDefaults: { source: 'claude-code', tags: [] },
			bridgePort: this.plugin.settings.bridgePort,
		});
	}
}
