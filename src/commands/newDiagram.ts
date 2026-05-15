import { App, Modal, Setting, Notice, TFolder, normalizePath } from 'obsidian';
import type ObDrawIOPlugin from '../main';
import { EMPTY_DIAGRAM } from '../types';

export class NewDiagramModal extends Modal {
	private name = '';
	private folder = '';
	private onSubmit: (path: string) => Promise<void>;

	constructor(app: App, defaultFolder: string, onSubmit: (path: string) => Promise<void>) {
		super(app);
		this.folder = defaultFolder;
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl('h2', { text: 'New diagram' });

		new Setting(contentEl)
			.setName('Diagram name')
			.setDesc('Name for the new .drawio file (without extension).')
			.addText(text =>
				text
					.setPlaceholder('My diagram')
					.onChange(value => {
						this.name = value.trim();
					})
					.inputEl.focus()
			);

		const folders = this.app.vault
			.getAllLoadedFiles()
			.filter((f): f is TFolder => f instanceof TFolder)
			.map(f => f.path)
			.sort();

		new Setting(contentEl)
			.setName('Folder')
			.setDesc('Folder in the vault where the diagram will be saved.')
			.addDropdown(drop => {
				drop.addOption('', '/ (vault root)');
				for (const f of folders) {
					drop.addOption(f, f);
				}
				drop.setValue(this.folder);
				drop.onChange(value => {
					this.folder = value;
				});
			});

		new Setting(contentEl)
			.addButton(btn =>
				btn
					.setButtonText('Create')
					.setCta()
					.onClick(() => {
						if (!this.name) {
							new Notice('Please enter a diagram name.');
							return;
						}
						const dir = this.folder ? `${this.folder}/` : '';
						const path = normalizePath(`${dir}${this.name}.drawio`);
						this.close();
						void this.onSubmit(path);
					})
			)
			.addButton(btn =>
				btn
					.setButtonText('Cancel')
					.onClick(() => this.close())
			);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

export async function createAndOpenDiagram(app: App, plugin: ObDrawIOPlugin): Promise<void> {
	const modal = new NewDiagramModal(app, plugin.settings.defaultFolder, async (path: string) => {
		try {
			const existing = app.vault.getAbstractFileByPath(path);
			if (existing) {
				new Notice(`File already exists: ${path}`);
				return;
			}

			const file = await app.vault.create(path, EMPTY_DIAGRAM);
			const leaf = app.workspace.getLeaf(false);
			await leaf.openFile(file, { active: true });
		} catch (err) {
			console.error('[ObDrawIO] Failed to create diagram:', err);
			new Notice('Failed to create diagram. Check the console for details.');
		}
	});
	modal.open();
}
