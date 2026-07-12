import { applyOperation } from "./applyOperation.js";
import { Operation } from "./operation.js";

export function applyOperations(
    document: string,
    operations: Operation[]
): string {

    let content = document;

    for (const operation of operations) {
        content = applyOperation(content, operation);
    }

    return content;
}