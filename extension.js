const vscode = require('vscode');
const path = require('path');
const cp = require('child_process');

var diagnosticCollection, username, cookie;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection('spi');
    context.subscriptions.push(diagnosticCollection);
    vscode.workspace.onDidSaveTextDocument(async (document) => {
        if (document.languageId === "spi" && document.uri.scheme === "file") {
            if (!cookie) {
                try {
                    username = await vscode.window.showInputBox({
                        prompt: 'Please enter your Adelaide University username.',
                        placeHolder: 'e.g. a1234567'
                    });
                    if (!username) return;
                    const password = await vscode.window.showInputBox({
                        password: true,
                        prompt: `Please enter the password for ${username}.`
                    });
                    if (!password) return;
                    const child = cp.exec(`python3 ${path.join(context.extensionPath, 'getcookie.py')} "${username}" "${password}"`);
                    child.stdout.on('data', d => {
                        cookie = d.trim();
                        verify(context, document);
                    });
                }
                catch (e) {
                    console.error(e.message);
                    cookie = null;
                }
            }
            else {
                verify(context, document);
            }
        }
    });
}

/**
 * @param {vscode.ExtensionContext} context
 * @param {vscode.TextDocument} document
 */
function verify(context, document) {
    const classname = path.basename(document.fileName, '.spi');
    try {
        const child = cp.exec(`python3 ${path.join(context.extensionPath, 'compile.py')} "${username}" "${cookie}" "${classname}" "${document.fileName}"`);
        child.stdout.on('data', d => {
            const { Info, Errors, Data } = JSON.parse(d);
            if (Errors.length > 0) throw Errors;
            if (Data.errors.length == 0) return diagnosticCollection.clear();
            const diagnostics = [];
            for (const e in Data.errors) {
                const lines = Data.errors[e].trim().split('\n');
                const message = lines[lines.length - 1];
                const line = parseInt(lines[lines.length - 3].split(':')[0].trim()) - 1;
                const character = lines[lines.length - 2].length - 6;
                diagnostics.push({
                    message: message,
                    severity: vscode.DiagnosticSeverity.Error,
                    range: new vscode.Range(
                        new vscode.Position(line, 0),
                        new vscode.Position(line, character)
                    )
                });
            }
            diagnosticCollection.set(document.uri, diagnostics);
        });
    }
    catch (e) {
        console.error(e.message);
        cookie = null;
    }
}

module.exports = {
    activate
}
