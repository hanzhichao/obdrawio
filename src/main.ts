import { Plugin, TFile, WorkspaceLeaf, Menu } from 'obsidian';
import { DEFAULT_SETTINGS, ObDrawIOSettings, ObDrawIOSettingTab } from './settings';
import { DiagramView } from './view/DiagramView';
import { registerCommands } from './commands/index';
import { createAndOpenDiagram } from './commands/newDiagram';
import { DRAW_IO_VIEW_TYPE, DRAWIO_EXTENSIONS } from './types';

export default class ObDrawIOPlugin extends Plugin {
	settings: ObDrawIOSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerView(DRAW_IO_VIEW_TYPE, leaf => new DiagramView(leaf, this));
		this.registerExtensions(DRAWIO_EXTENSIONS, DRAW_IO_VIEW_TYPE);

		this.addRibbonIcon('workflow', 'New diagram', () => {
			createAndOpenDiagram(this.app, this);
		});

		registerCommands(this);

		this.addSettingTab(new ObDrawIOSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu: Menu, file) => {
				if (file instanceof TFile && DRAWIO_EXTENSIONS.includes(file.extension)) {
					menu.addItem(item => {
						item.setTitle('Open in diagram editor')
							.setIcon('workflow')
							.onClick(async () => {
								const leaf = this.app.workspace.getLeaf(false);
								await leaf.openFile(file, { active: true });
							});
					});
				}
			})
		);

		this.registerEvent(
			this.app.workspace.on('files-menu', (menu: Menu, files) => {
				const drawioFiles = files.filter(
					(f): f is TFile => f instanceof TFile && DRAWIO_EXTENSIONS.includes(f.extension)
				);
				if (drawioFiles.length > 0) {
					menu.addItem(item => {
						item.setTitle(`Open ${drawioFiles.length} diagram(s)`)
							.setIcon('workflow')
							.onClick(async () => {
								for (const file of drawioFiles) {
									const leaf = this.app.workspace.getLeaf('tab');
									await leaf.openFile(file, { active: false });
								}
							});
					});
				}
			})
		);
	}

	onunload(): void {
		this.app.workspace.detachLeavesOfType(DRAW_IO_VIEW_TYPE);
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<ObDrawIOSettings>);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
