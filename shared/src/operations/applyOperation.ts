import type { Operation } from "./operation.js";
import { validateOperation } from "./validateOperation.js";

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
    }
}
