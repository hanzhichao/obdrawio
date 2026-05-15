import { App, PluginSettingTab, Setting } from 'obsidian';
import type ObDrawIOPlugin from './main';
import { DEFAULT_DRAWIO_URL } from './types';

export interface ObDrawIOSettings {
	drawioUrl: string;
	followTheme: boolean;
	autoSave: boolean;
	defaultFolder: string;
	language: string;
}

export const DEFAULT_SETTINGS: ObDrawIOSettings = {
	drawioUrl: DEFAULT_DRAWIO_URL,
	followTheme: true,
	autoSave: true,
	defaultFolder: '',
	language: '',
};

export class ObDrawIOSettingTab extends PluginSettingTab {
	plugin: ObDrawIOPlugin;

	constructor(app: App, plugin: ObDrawIOPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Draw.io server URL')
			.setDesc('URL for the draw.io editor. Use the default for the hosted version, or enter a self-hosted URL for offline use.')
			.addText(text =>
				text
					.setPlaceholder(DEFAULT_DRAWIO_URL)
					.setValue(this.plugin.settings.drawioUrl)
					.onChange(async value => {
						this.plugin.settings.drawioUrl = value.trim() || DEFAULT_DRAWIO_URL;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Follow Obsidian theme')
			.setDesc('Automatically switch the diagram editor to dark or light mode based on the current Obsidian theme.')
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.followTheme)
					.onChange(async value => {
						this.plugin.settings.followTheme = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Auto-save')
			.setDesc('Automatically save diagram changes as you edit.')
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.autoSave)
					.onChange(async value => {
						this.plugin.settings.autoSave = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Default diagram folder')
			.setDesc('Folder where new diagrams are created. Leave empty to use the vault root.')
			.addText(text =>
				text
					.setPlaceholder('e.g. Diagrams')
					.setValue(this.plugin.settings.defaultFolder)
					.onChange(async value => {
						this.plugin.settings.defaultFolder = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Language')
			.setDesc('Language code for the diagram editor (e.g. "en", "zh", "de"). Leave empty to use the browser default.')
			.addText(text =>
				text
					.setPlaceholder('e.g. zh')
					.setValue(this.plugin.settings.language)
					.onChange(async value => {
						this.plugin.settings.language = value.trim();
						await this.plugin.saveSettings();
					})
			);
	}
}
