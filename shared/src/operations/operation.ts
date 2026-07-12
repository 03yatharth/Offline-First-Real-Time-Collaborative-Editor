export interface BaseOperation {
    documentId: string;
    baseVersion: number;
}

export interface InsertOperation extends BaseOperation {
    type: "insert";
    position: number;
    text: string;
}

export interface DeleteOperation extends BaseOperation {
    type: "delete";
    position: number;
    length: number;
}

export type Operation =
    | InsertOperation
    | DeleteOperation;

export interface GenerateOperationsInput {
    documentId: string;
    baseVersion: number;
    oldText: string;
    newText: string;
}