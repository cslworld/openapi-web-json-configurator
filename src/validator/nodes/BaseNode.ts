import { DataType } from "../enum/DataType.enum";
import { ISchemaNode } from "../interfaces/ISchemaNode";
import { rootDataNode } from "../Validator";

export type BaseNodes = { [key: string]: BaseNode };
export type IData =
  | BaseNodes
  | BaseNode[]
  | string
  | number
  | boolean
  | undefined;
export type Discriminator = {
  mapping: { [key: string]: string };
  propertyName: string;
};

export enum CombineType {
  ALLOF, ONEOF, ANYOF, NOT
}
export class BaseNode {
  public type?: DataType;
  public description?: string;
  public isRequired?: boolean;
  public combineType;
  public discriminator?: Discriminator;
  public example: any;
  public subSchemas: BaseNode[] = [];
  protected _data: IData;

  constructor(
    type: DataType,
    schema: ISchemaNode,
    data: IData,
    isRequired: boolean
  ) {
    this.type = type;
    this.description = schema.description;
    this.discriminator = schema.discriminator;

    this._data = data;
    this.isRequired = isRequired;
    this.example = schema.example;

    if(schema.allOf){
      this.combineType = CombineType.ALLOF;
    } 
    if(schema.oneOf){
      this.combineType = CombineType.ONEOF
    }
    if(schema.anyOf){
      this.combineType = CombineType.ANYOF;
    }
    if(schema.not){
      this.combineType = CombineType.NOT
    }
  }

  /**
   * Dicriminator:
   * This method returns a object as {key(discriminator type): values{object related to that type}}
   * But from CogniteJsonEditorOptions class, it dynamically get the type of json and replace this object with
   * correct object type
   */
  public get data(): IData {
    if (this.discriminator && this.discriminator.mapping ) {

      const result: BaseNodes = {};
      const possibleTypeValues = Object.keys(this.discriminator.mapping);      

      for (const [key, val] of Object.entries(this.discriminator.mapping)) {
        const schemaPath = val.split("/");

        // Get node for specific type of dicriminator. It is the last section of the schemaPath array
        const node = rootDataNode[schemaPath[schemaPath.length - 1]];

        if(node._data instanceof Object){
          // TODO: avoid any type.
          // TODO: create StringNode here.
          (node._data as any)[this.discriminator.propertyName] = {
            type: 'string',
            data: key,
            possibleValues: possibleTypeValues,
            isRequired: true
          };
        }
        result[key] = node;
      }
      /**
       * {
       *    customHierarchy: { data: { type: {data: "customHierarchy", type: "string"}}... }
       *    fullAssetHierarchy: { data... }
       *    noHierarchy: { data... }
       * }
       */
      return result;
    } else {
      return this._data;
    }
  }

  public set data(data: IData) {
    this._data = data;
  }

  public get rowData(): IData {
    return this._data;
  }
}
