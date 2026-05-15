import { App, Editor, MarkdownView, Modal, Notice, TFile } from 'obsidian';
import type ObDrawIOPlugin from '../main';
import { createAndOpenDiagram } from './newDiagram';
import { DRAWIO_EXTENSIONS } from '../types';

export function registerCommands(plugin: ObDrawIOPlugin): void {
	plugin.addCommand({
		id: 'new-diagram',
		name: 'New diagram',
		callback: () => {
			void createAndOpenDiagram(plugin.app, plugin);
		},
	});

	plugin.addCommand({
		id: 'insert-diagram-link',
		name: 'Insert diagram link into note',
		editorCallback: (editor: Editor, view: MarkdownView) => {
			const files = plugin.app.vault.getAllLoadedFiles().filter(
				(f): f is TFile =>
					f instanceof TFile && DRAWIO_EXTENSIONS.includes(f.extension)
			);

			if (files.length === 0) {
				new Notice('No .drawio files found in vault. Create one first.');
				return;
			}

			new DiagramPickerModal(plugin.app, files, (file: TFile) => {
				const link = plugin.app.fileManager.generateMarkdownLink(file, view.file?.path ?? '');
				editor.replaceSelection(link);
			}).open();
		},
	});

	plugin.addCommand({
		id: 'open-diagram-in-new-tab',
		name: 'Open diagram in new tab',
		checkCallback: (checking: boolean) => {
			const active = plugin.app.workspace.getActiveFile();
			const isDiagram = active && DRAWIO_EXTENSIONS.includes(active.extension);
			if (isDiagram && !checking) {
				const leaf = plugin.app.workspace.getLeaf('tab');
				void leaf.openFile(active);
			}
			return !!isDiagram;
		},
	});
}

// Inline simple picker modal to avoid extra file
class DiagramPickerModal extends Modal {
	private files: TFile[];
	private onSelect: (file: TFile) => void;
	private searchInput: HTMLInputElement | null = null;

	constructor(app: App, files: TFile[], onSelect: (file: TFile) => void) {
		super(app);
		this.files = files;
		this.onSelect = onSelect;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl('h3', { text: 'Insert diagram link' });

		const search = contentEl.createEl('input', {
			type: 'text',
			placeholder: 'Search diagrams…',
			cls: 'drawio-picker-search',
		});
		this.searchInput = search;

		const list = contentEl.createEl('ul', { cls: 'drawio-picker-list' });
		const render = (filter: string) => {
			list.empty();
			const filtered = this.files.filter(f =>
				f.basename.toLowerCase().includes(filter.toLowerCase())
			);
			for (const file of filtered) {
				const li = list.createEl('li', { cls: 'drawio-picker-item' });
				li.createEl('span', { text: file.basename, cls: 'drawio-picker-name' });
				li.createEl('small', { text: file.parent?.path ?? '', cls: 'drawio-picker-path' });
				li.addEventListener('click', () => {
					this.close();
					this.onSelect(file);
				});
			}
		};

		render('');
		search.addEventListener('input', () => render(search.value));
		window.setTimeout(() => search.focus(), 50);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
