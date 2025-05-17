import * as vscode from 'vscode';
import { readdirSync } from 'fs';
import transpile from './transpile';
import {dirname, join} from 'path';

async function select(): Promise<string>
{
	const data  = join(dirname(__dirname), "data");
	const items : string[] = readdirSync(join(data, "api"));

	const choice = await vscode.window.showQuickPick(
		items.map(x => x.replace(".txt", ''))) ?? '';

	return choice;
}

export function activate(context: vscode.ExtensionContext) 
{

	const entry =
	vscode.commands.registerCommand("pinvoke.entry", () =>
	{

		const editor = vscode.window.activeTextEditor;
		if (!editor) return;

		select().then(choice =>
		{
			const template = transpile(choice, 
				editor.document.languageId);
			
			vscode.env.clipboard.writeText(template);
			vscode.window.showInformationMessage(
				`\"${choice}\" is saved in clipboard`)
		});

	});

	context.subscriptions.push(entry);
}

export function deactivate()
{
	;;
}
