export type InsertOperation = {
    type: "insert";
    position: number;
    text: string;
};

export type DeleteOperation = {
    type: "delete";
    position: number;
    length: number;
};

export type Operation = InsertOperation | DeleteOperation;

export function findCommonPrefix(
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

export function findCommonSuffix(
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


export function generateOperations(
    oldText: string,
    newText: string
): Operation[] {

    const prefixLength = findCommonPrefix(oldText, newText);

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

    // Delete
    if (oldChanged.length > 0) {
        operations.push({
            type: "delete",
            position: prefixLength,
            length: oldChanged.length,
        });
    }

    // Insert
    if (newChanged.length > 0) {
        operations.push({
            type: "insert",
            position: prefixLength,
            text: newChanged,
        });
    }

    return operations;
}

export function applyOperation(
    document: string,
    operation: Operation
): string {

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