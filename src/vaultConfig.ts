import { App } from 'obsidian';

export interface VaultNotesConfig {
	folderPattern: string;
	frontmatterDefaults: { source: string; tags: string[] };
	bridgePort: number;
}

const CONFIG_PATH = '.claude-notes.json';

export const DEFAULT_VAULT_CONFIG: VaultNotesConfig = {
	folderPattern: 'Claude Notes/{project}/{date}-{slug}.md',
	frontmatterDefaults: { source: 'claude-code', tags: [] },
	bridgePort: 27124,
};

/**
 * .claude-notes.json lives at the vault root and is the single source of truth shared
 * with the obsidian-notes-cli — read/written via the raw adapter (not the indexed Vault
 * API) because Obsidian doesn't index dotfiles.
 */
export async function readVaultConfig(app: App): Promise<VaultNotesConfig> {
	try {
		if (!(await app.vault.adapter.exists(CONFIG_PATH))) {
			return DEFAULT_VAULT_CONFIG;
		}

		const raw = await app.vault.adapter.read(CONFIG_PATH);

		return { ...DEFAULT_VAULT_CONFIG, ...JSON.parse(raw) };
	} catch {
		return DEFAULT_VAULT_CONFIG;
	}
}

export async function writeVaultConfig(app: App, config: VaultNotesConfig): Promise<void> {
	await app.vault.adapter.write(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
}
