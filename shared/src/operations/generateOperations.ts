import type {
    GenerateOperationsInput,
    Operation,
} from "./operation.js";

function findCommonPrefix(
    oldText: string,
    newText: string
): number {

    let prefix = 0;

    while (
        prefix < oldText.length &&
        prefix < newText.length &&
        oldText[prefix] === newText[prefix]
    ) {
        prefix++;
    }

    return prefix;
}

function findCommonSuffix(
    oldText: string,
    newText: string,
    prefixLength: number
): number {

    let oldIndex = oldText.length - 1;
    let newIndex = newText.length - 1;

    let suffix = 0;

    while (
        oldIndex >= prefixLength &&
        newIndex >= prefixLength &&
        oldText[oldIndex] === newText[newIndex]
    ) {
        suffix++;
        oldIndex--;
        newIndex--;
    }

    return suffix;
}

export function generateOperations({
    documentId,
    baseVersion,
    oldText,
    newText,
}: GenerateOperationsInput): Operation[] {

    const prefixLength = findCommonPrefix(
        oldText,
        newText
    );

    const suffixLength = findCommonSuffix(
        oldText,
        newText,
        prefixLength
    );

    const oldChanged = oldText.substring(
        prefixLength,
        oldText.length - suffixLength
    );

    const newChanged = newText.substring(
        prefixLength,
        newText.length - suffixLength
    );

    const operations: Operation[] = [];

    if (oldChanged.length > 0) {
        operations.push({
            documentId,
            baseVersion,
            type: "delete",
            position: prefixLength,
            length: oldChanged.length,
        });
    }

    if (newChanged.length > 0) {
        operations.push({
            documentId,
            baseVersion,
            type: "insert",
            position: prefixLength,
            text: newChanged,
        });
    }

    return operations;
}