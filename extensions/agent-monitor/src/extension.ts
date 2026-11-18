import { randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";

import * as vscode from "vscode";

import {
  createPanelOptions,
  renderPanelHtml,
  resolveInitialSource,
} from "./host/monitorPanel";
import { createSourceController } from "./host/sourceReader";
import { validateWebviewMessage } from "./shared/protocol";

function nonce(): string {
  return randomBytes(18).toString("base64url");
}

const SOURCE_KEY = "tallyholdAgentMonitor.selectedSource";

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
        cspSource: panel.webview.cspSource,
        nonce: nonce(),
      });

      const reader = createSourceController();
      let generation = 0;
      let closed = false;
      let lastPublishedState: unknown;
      const publish = (force = false) => {
        const nextState = reader.getState();
        if (!force && nextState === lastPublishedState) return;
        lastPublishedState = nextState;
        return panel.webview.postMessage({
          type: "state",
          generation,
          ...nextState,
        });
      };
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
        const source = pathToFileURL(selected[0].fsPath);
        await context.workspaceState.update(SOURCE_KEY, source.href);
        await reader.selectSource(source);
        await publish(true);
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

      const roots =
        vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath) ??
        [];
      const initial = await resolveInitialSource(
        context.workspaceState.get<string>(SOURCE_KEY) ?? null,
        roots,
        { trusted: vscode.workspace.isTrusted },
      );
      if (initial) {
        generation++;
        await reader.selectSource(new URL(initial));
        await publish(true);
      } else if (!(await chooseSource())) {
        await publish(true);
      }
    }),
  );
}

export function deactivate() {}
