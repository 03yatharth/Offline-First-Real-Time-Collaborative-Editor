import { Operation } from "./operation.js";

export function validateOperation(
    document: string,
    operation: Operation
): void {

    if (operation.position < 0) {
        throw new Error("Invalid position");
    }

    switch (operation.type) {

        case "insert":

            if (operation.position > document.length) {
                throw new Error("Invalid insert position");
            }

            break;

        case "delete":

            if (operation.length < 0) {
                throw new Error("Invalid delete length");
            }

            if (operation.position + operation.length > document.length) {
                throw new Error("Invalid delete range");
            }

            break;
    }
}