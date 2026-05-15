export const DRAW_IO_VIEW_TYPE = 'drawio-diagram';
export const DRAWIO_EXTENSIONS = ['drawio', 'dio'];
export const DEFAULT_DRAWIO_URL = 'https://embed.diagrams.net';

export const EMPTY_DIAGRAM = `<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>`;

export interface DrawIOMessage {
	event: 'init' | 'autosave' | 'save' | 'exit' | 'load';
	xml?: string;
	exit?: boolean;
}

export interface DrawIOCommand {
	action: 'load' | 'merge' | 'dialog' | 'prompt' | 'export';
	xml?: string;
	autosave?: number;
	format?: string;
}
