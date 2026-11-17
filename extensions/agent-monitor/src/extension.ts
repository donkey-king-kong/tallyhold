import { randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";

import * as vscode from "vscode";

import { createPanelOptions, renderPanelHtml } from "./host/monitorPanel";
import { createSourceController } from "./host/sourceReader";

function nonce(): string {
  return randomBytes(18).toString("base64url");
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("tallyholdAgentMonitor.open", async () => {
      const mediaRoot = vscode.Uri.joinPath(context.extensionUri, "media");
      const options = createPanelOptions(mediaRoot.toString());
      const panel = vscode.window.createWebviewPanel(
        "tallyholdAgentMonitor",
        "Tallyhold Agent Monitor",
        vscode.ViewColumn.One,
        {
          enableScripts: options.enableScripts,
          retainContextWhenHidden: true,
          localResourceRoots: [mediaRoot],
        },
      );
      const script = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(mediaRoot, "webview.js"),
      );
      const style = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(mediaRoot, "styles.css"),
      );
      panel.webview.html = renderPanelHtml({
        scriptUri: script.toString(),
        styleUri: style.toString(),
        nonce: nonce(),
      });

      const reader = createSourceController();
      const generation = 1;
      let closed = false;
      const publish = () =>
        panel.webview.postMessage({
          type: "state",
          generation,
          ...reader.getState(),
        });
      const timer = setInterval(async () => {
        await reader.refresh();
        if (!closed) await publish();
      }, 1000);
      panel.onDidDispose(() => {
        closed = true;
        clearInterval(timer);
        reader.dispose();
      });

      const selected = await vscode.window.showOpenDialog({
        canSelectMany: false,
        canSelectFiles: true,
        canSelectFolders: false,
        openLabel: "Monitor JSONL stream",
        filters: { "JSON Lines": ["jsonl"] },
      });
      if (selected?.[0]) {
        await reader.selectSource(pathToFileURL(selected[0].fsPath));
      }
      await publish();
    }),
  );
}

export function deactivate() {}
