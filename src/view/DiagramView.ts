import { TextFileView, WorkspaceLeaf } from 'obsidian';
import type ObDrawIOPlugin from '../main';
import { DRAW_IO_VIEW_TYPE, EMPTY_DIAGRAM, type DrawIOMessage, type DrawIOCommand } from '../types';

export class DiagramView extends TextFileView {
	private iframe: HTMLIFrameElement | null = null;
	private iframeReady = false;
	private pendingXml: string | null = null;
	private messageHandler: ((evt: MessageEvent) => void) | null = null;

	constructor(leaf: WorkspaceLeaf, private plugin: ObDrawIOPlugin) {
		super(leaf);
	}

	getViewType(): string {
		return DRAW_IO_VIEW_TYPE;
	}

	getDisplayText(): string {
		return this.file?.basename ?? 'Diagram';
	}

	getIcon(): string {
		return 'workflow';
	}

	async onOpen(): Promise<void> {
		this.buildIframe();
	}

	async onClose(): Promise<void> {
		if (this.messageHandler) {
			window.removeEventListener('message', this.messageHandler);
			this.messageHandler = null;
		}
		this.iframe = null;
		this.iframeReady = false;
	}

	getViewData(): string {
		return this.data;
	}

	setViewData(data: string, clear: boolean): void {
		this.data = data || EMPTY_DIAGRAM;
		if (this.iframeReady) {
			this.loadXmlIntoEditor(this.data);
		} else {
			this.pendingXml = this.data;
		}
	}

	clear(): void {
		this.data = EMPTY_DIAGRAM;
		this.pendingXml = null;
		if (this.iframeReady) {
			this.loadXmlIntoEditor(EMPTY_DIAGRAM);
		}
	}

	private buildIframeUrl(): string {
		const base = (this.plugin.settings.drawioUrl || 'https://embed.diagrams.net').replace(/\/$/, '');
		const params = new URLSearchParams({
			embed: '1',
			proto: 'json',
			spin: '1',
		});

		if (this.plugin.settings.followTheme && document.body.classList.contains('theme-dark')) {
			params.set('ui', 'dark');
		}

		if (this.plugin.settings.language) {
			params.set('lang', this.plugin.settings.language);
		}

		return `${base}?${params.toString()}`;
	}

	private buildIframe(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('drawio-view-container');

		const iframe = contentEl.createEl('iframe', {
			cls: 'drawio-iframe',
			attr: {
				src: this.buildIframeUrl(),
				frameborder: '0',
				allowfullscreen: 'true',
			},
		});
		this.iframe = iframe;
		this.iframeReady = false;

		this.messageHandler = (evt: MessageEvent) => {
			if (evt.source !== iframe.contentWindow) return;
			this.handleMessage(evt.data);
		};
		window.addEventListener('message', this.messageHandler);
	}

	private handleMessage(raw: unknown): void {
		if (typeof raw !== 'string') return;

		let msg: DrawIOMessage;
		try {
			msg = JSON.parse(raw) as DrawIOMessage;
		} catch {
			return;
		}

		switch (msg.event) {
			case 'init': {
				this.iframeReady = true;
				const xml = this.pendingXml ?? this.data ?? EMPTY_DIAGRAM;
				this.loadXmlIntoEditor(xml);
				this.pendingXml = null;
				break;
			}
			case 'autosave': {
				if (this.plugin.settings.autoSave && msg.xml !== undefined) {
					this.data = msg.xml;
					this.requestSave();
				}
				break;
			}
			case 'save': {
				if (msg.xml !== undefined) {
					this.data = msg.xml;
					this.requestSave();
				}
				if (msg.exit) {
					this.leaf.detach();
				}
				break;
			}
			case 'exit': {
				this.leaf.detach();
				break;
			}
		}
	}

	private loadXmlIntoEditor(xml: string): void {
		const cmd: DrawIOCommand = { action: 'load', xml, autosave: this.plugin.settings.autoSave ? 1 : 0 };
		this.postToIframe(cmd);
	}

	private postToIframe(cmd: DrawIOCommand): void {
		this.iframe?.contentWindow?.postMessage(JSON.stringify(cmd), '*');
	}
}
