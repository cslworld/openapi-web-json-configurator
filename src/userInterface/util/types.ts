import { JSONEditorOptions } from "jsoneditor";

export interface JsonConfig {
    id: number;
    data: {
        assets?: any[];
        header: {
            name: string;
            type: string;
        }
    }
}

export interface MergeOptions {
    localConfig: any;
    serverConfig: any;
    diffMode: string;
    onOk: (mergedJson: any) => void;
    onCancel: () => void;
}

export interface JsonEditorOptions extends JSONEditorOptions {
    limitDragging?: boolean;
}
