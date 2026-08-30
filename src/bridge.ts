import * as http from 'http';
import type ClaudeNotesPlugin from './main';

/**
 * CLI -> plugin only, best-effort. The CLI has already written the note to disk before
 * calling this — that file is the single source of truth. The POST body is informational;
 * all we do here is nudge the sidebar to refresh shortly after, once Obsidian's own file
 * watcher has had a moment to pick up the change. If the bridge is off or unreachable the
 * CLI just ignores the failure — Obsidian still notices the new file natively on focus.
 */
export class BridgeServer {
	private server: http.Server | null = null;

	constructor(private plugin: ClaudeNotesPlugin) {}

	start(port: number): void {
		if (this.server) {
			return;
		}

		this.server = http.createServer((req, res) => {
			if (req.method !== 'POST' || req.url !== '/notes') {
				res.writeHead(404);
				res.end();

				return;
			}

			req.resume();
			req.on('end', () => {
				res.writeHead(200);
				res.end('ok');
				window.setTimeout(() => this.plugin.refreshView(), 150);
			});
		});

		this.server.on('error', () => {
			// ponytail: port already in use or blocked — surfaced via the settings toggle
			// staying on with a stale server; add a Notice here if that proves confusing.
		});

		this.server.listen(port, '127.0.0.1');
	}

	stop(): void {
		this.server?.close();
		this.server = null;
	}
}
