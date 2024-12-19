import * as vscode from 'vscode';
import { SystemctlService } from './service';
import { SystemctlProvider, ServiceTreeItem } from './systemctlProvider';
import { Logger } from './logger';

export function activate(context: vscode.ExtensionContext) {
    Logger.initialize();
    Logger.info('Systemctl Manager extension activated');
    
    const systemctlService = SystemctlService.getInstance(context);
    
    // Создаем провайдеры для обоих представлений
    const servicesProvider = new SystemctlProvider(systemctlService);

    // Регистрируем провайдеры
    vscode.window.registerTreeDataProvider('systemctlExplorer', servicesProvider);

    // Регистрируем команды
    context.subscriptions.push(
        vscode.commands.registerCommand('systemctl.refreshServices', () => {
            servicesProvider.refresh();
        }),

        vscode.commands.registerCommand('systemctl.startService', async (item: ServiceTreeItem) => {
            await systemctlService.startService(item.name);
            servicesProvider.refresh();
        }),

        vscode.commands.registerCommand('systemctl.stopService', async (item: ServiceTreeItem) => {
            await systemctlService.stopService(item.name);
            servicesProvider.refresh();
        }),

        vscode.commands.registerCommand('systemctl.restartService', async (item: ServiceTreeItem) => {
            await systemctlService.restartService(item.name);
            servicesProvider.refresh();
        }),

        vscode.commands.registerCommand('systemctl.toggleFavorite', (item: ServiceTreeItem) => {
            if (!item || !item.name) {
                Logger.error('Toggle favorite: item or item.name is undefined');
                return;
            }
            systemctlService.toggleFavorite(item.name);
            servicesProvider.refresh();
        }),

        vscode.commands.registerCommand('systemctl.viewLogs', (item: ServiceTreeItem) => {
            systemctlService.viewLogs(item.name);
        }),

        vscode.commands.registerCommand('systemctl.createService', async () => {
            const serviceName = await vscode.window.showInputBox({
                prompt: 'Enter new service name',
                placeHolder: 'my-service',
                validateInput: (value: string) => {
                    if (!value) {
                        return 'Service name is required';
                    }
                    if (!/^[a-z0-9-]+$/.test(value.trim())) {
                        return 'Service name can only contain lowercase letters, numbers and hyphens';
                    }
                    return null;
                }
            });

            const trimmedName = serviceName?.trim();
            if (trimmedName) {
                const document = await vscode.workspace.openTextDocument({
                    language: 'ini',
                    content: systemctlService.getDefaultServiceConfig(trimmedName)
                });
                await vscode.window.showTextDocument(document);
            }
        }),

        vscode.commands.registerCommand('systemctl.openConfig', async (item: ServiceTreeItem) => {
            await systemctlService.openConfig(item.name);
        }),

        vscode.commands.registerCommand('systemctl.reloadDaemon', async () => {
            await systemctlService.reloadDaemon();
            servicesProvider.refresh();
        }),

        vscode.commands.registerCommand('systemctl.moveUp', (item: ServiceTreeItem) => {
            systemctlService.moveServiceUp(item.name);
            servicesProvider.refresh();
        }),

        vscode.commands.registerCommand('systemctl.moveDown', (item: ServiceTreeItem) => {
            systemctlService.moveServiceDown(item.name);
            servicesProvider.refresh();
        }),

        vscode.commands.registerCommand('systemctl.search', async () => {
            const searchTerm = await vscode.window.showInputBox({
                prompt: 'Search services',
                placeHolder: 'Enter service name or description'
            });

            if (searchTerm !== undefined) {
                systemctlService.setSearchFilter(searchTerm);
                servicesProvider.refresh();
            }
        })
    );
}

export function deactivate() {}
