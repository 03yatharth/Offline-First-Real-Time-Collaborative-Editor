interface BaseOperation {

    documentId: string;

    baseVersion: number;
}

export interface InsertOperation
extends BaseOperation {

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

function validateOperation(
    document: string,
    operation: Operation
){
    if(operation.type == "insert"){
        let position = operation.position;
        if (position < 0 || position > document.length) {
            throw new Error("invalid operation");
        }
    }
    else if(operation.type == "delete"){
        let position = operation.position;
        if (position + length > document.length)
            throw new Error("invalid operation");
    }
}

export function applyOperation(
    document: string,
    operation: Operation
): string {

    validateOperation(document, operation);
    switch (operation.type) {

        case "insert":
            return (
                document.slice(0, operation.position) +
                operation.text +
                document.slice(operation.position)
            );

        case "delete":
            return (
                document.slice(0, operation.position) +
                document.slice(operation.position + operation.length)
            );

        default: {
            const exhaustiveCheck: never = operation;
            throw new Error(`Unknown operation: ${exhaustiveCheck}`);
        }
    }

}