import { Modes } from "../userInterface/util/enums/Modes";
import { CogniteJsonEditor } from "./CogniteJsonEditor";
import { CogniteJsonEditorOptions } from "./CogniteJsonEditorOptions";
import { saveAs } from 'file-saver';
import { DigitalTwinApi } from "./DigitalTwinApi";
import { Api } from "./Api";
import { LOCALIZATION } from "../constants";
import { JSONEditorMode } from "jsoneditor";
import { SchemaResolver } from "../validator/SchemaResolver";
import YAML from "yamljs";
import ymlFile from "../config/twinconfig.yaml";
import { IOpenApiSchema } from "../validator/interfaces/IOpenApiSchema";

export class JsonConfigCommandCenter {
    public static titleUpdateCallback: (text: string, mode: JSONEditorMode) => void;
    public static getOriginalJsonConfig: () => any;
    public static editorErrors: Map<string, string[]> = new Map();
    public static hasErrors = false;
    public static schemaErrors: string[] = [];
    private static editorInstance: CogniteJsonEditor;
    private static apiInstance: Api;

    public static async createEditor(elm: HTMLElement, schema: IOpenApiSchema): Promise<void> {
        // Schema errors need to reset before loading new schema
        this.schemaErrors = [];

        await SchemaResolver.parseYAMLFile(schema);
        JsonConfigCommandCenter.apiInstance = new DigitalTwinApi();
        const options = new CogniteJsonEditorOptions();
        
        // To forced reload the content, innerHTML needs to be changed
        elm.innerHTML = '<div/>';
        JsonConfigCommandCenter.editorInstance = new CogniteJsonEditor(elm, options);
    }

    public static get editor(): CogniteJsonEditor | null {
        if (JsonConfigCommandCenter.editorInstance) {
            return JsonConfigCommandCenter.editorInstance;
        } else {
            console.error("Cannot retrieve editor before instantiation!");
            return null;
        }
    }

    public static get api(): Api {
        if (!JsonConfigCommandCenter.apiInstance) {
            JsonConfigCommandCenter.apiInstance = new DigitalTwinApi();
        }
        return JsonConfigCommandCenter.apiInstance;
    }

    public static get currentJson(): any {
        const currentJsonText = JsonConfigCommandCenter.editor?.getText();
        let currentJson;
        if (currentJsonText) {
            try {
                currentJson = JSON.parse(currentJsonText);
            } catch (e: any) {
                console.error("Error occurred while parsing json!", e);
            }
        }
        return currentJson;
    }

    public static get currentFileName(): string {
        const currentJson = JsonConfigCommandCenter.currentJson;
        return currentJson?.header?.name;
    }

    // is local file is edited
    public static isEdited(): boolean {
        const currentJson = JsonConfigCommandCenter.currentJson;
        const originalJsonConfig = JsonConfigCommandCenter.getOriginalJsonConfig();
        if (currentJson) {
            if (originalJsonConfig === null) {
                return !!Object.keys(currentJson).length;
            }
            else {
                return !!(JSON.stringify(originalJsonConfig) !== JSON.stringify(currentJson));
            }
        }
        return false;
    }

    public static updateTitle = (): void => {
        if (JsonConfigCommandCenter.editor && JsonConfigCommandCenter.titleUpdateCallback && JsonConfigCommandCenter.getOriginalJsonConfig) {
            const edited = JsonConfigCommandCenter.isEdited();
            const currentTitle = (edited ? '*' : '') + (JsonConfigCommandCenter.currentFileName || LOCALIZATION.UNTITLED);
            const currentMode = JsonConfigCommandCenter.editor?.getMode();
            JsonConfigCommandCenter.titleUpdateCallback(currentTitle, currentMode);
        }
    }

    public static loadJsonConfigs = async (): Promise<any> => {
        return await JsonConfigCommandCenter.api.jsonList();
    }

    public static onModeChange(mode: Modes): void {
        if (JsonConfigCommandCenter.editor) {
            JsonConfigCommandCenter.editor.setMode(mode);
        }
    }

    public static onSaveAs = async (): Promise<any> => {
        const currentJson = JsonConfigCommandCenter.currentJson;
        return await JsonConfigCommandCenter.api.saveJson(currentJson);
    }

    public static onUpdate = async (selectedJsonConfigId: number | null, args: any): Promise<any> => {
        let currentJson = JsonConfigCommandCenter.currentJson;
        // override currentJson with resolved one
        if (args) {
            currentJson = args;
        }

        if (selectedJsonConfigId) {
            return await JsonConfigCommandCenter.api.updateJson(selectedJsonConfigId, currentJson);
        }
    }

    public static onDelete = async (selectedJsonConfigId: number | null): Promise<any> => {
        if (selectedJsonConfigId) {
            return await JsonConfigCommandCenter.api.deleteJson(selectedJsonConfigId);
        }
    }

    public static onDownload = (): void => {
        const currentJson = JSON.stringify(JsonConfigCommandCenter.currentJson);
        let fileName = JsonConfigCommandCenter.currentFileName;
        if (!fileName || fileName === "") {
            fileName = "Untitled Json Config";
        }
        const blob = new Blob([currentJson], { type: 'application/json;charset=utf-8' });
        saveAs(blob, fileName);
    }

    public static onLoadSchema = async (elm: HTMLElement | null, schema?: IOpenApiSchema): Promise<void> => {
        if (elm) {
            if(schema){
                JsonConfigCommandCenter.createEditor(elm, schema);
            } else {
                YAML.load(ymlFile, async (schema: IOpenApiSchema) => {    
                    JsonConfigCommandCenter.createEditor(elm, schema);
                });
            }
        }
    }
}
