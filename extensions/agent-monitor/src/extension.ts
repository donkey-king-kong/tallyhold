import { randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";

import * as vscode from "vscode";

import { createPanelOptions, renderPanelHtml } from "./host/monitorPanel";
import { createSourceController } from "./host/sourceReader";
import { validateWebviewMessage } from "./shared/protocol";

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
      let generation = 0;
      let closed = false;
      const publish = () =>
        panel.webview.postMessage({
          type: "state",
          generation,
          ...reader.getState(),
        });
      const chooseSource = async () => {
        const selected = await vscode.window.showOpenDialog({
          canSelectMany: false,
          canSelectFiles: true,
          canSelectFolders: false,
          openLabel: "Monitor JSONL stream",
          filters: { "JSON Lines": ["jsonl"] },
        });
        if (!selected?.[0]) return false;
        generation++;
        await reader.selectSource(pathToFileURL(selected[0].fsPath));
        await publish();
        return true;
      };
      const messageSubscription = panel.webview.onDidReceiveMessage(
        async (value: unknown) => {
          const message = validateWebviewMessage(value, generation);
          if (message?.type === "selectSource" && !("uri" in message)) {
            await chooseSource();
          }
        },
      );
      const timer = setInterval(async () => {
        await reader.refresh();
        if (!closed) await publish();
      }, 1000);
      panel.onDidDispose(() => {
        closed = true;
        clearInterval(timer);
        messageSubscription.dispose();
        reader.dispose();
      });

      if (!(await chooseSource())) await publish();
    }),
  );
}

export function deactivate() {}
