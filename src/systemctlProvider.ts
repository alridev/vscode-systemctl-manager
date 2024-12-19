import * as vscode from 'vscode';
import { SystemctlService, IService } from './service';

export class SystemctlProvider implements vscode.TreeDataProvider<ServiceTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ServiceTreeItem | undefined | null | void> = new vscode.EventEmitter<ServiceTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ServiceTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(
        private systemctlService: SystemctlService
    ) { }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ServiceTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ServiceTreeItem): Promise<ServiceTreeItem[]> {
        if (element) {
            return [];
        }

        const services = await this.systemctlService.getServices();
        const favorites = this.systemctlService.getFavorites();
        const items: ServiceTreeItem[] = [];
        const searchFilter = this.systemctlService.getSearchFilter();

        // Фильтруем сервисы по поисковому запросу
        const filteredServices = services.filter(service => 
            service.name.toLowerCase().includes(searchFilter) ||
            (service.description || '').toLowerCase().includes(searchFilter)
        );

        // Добавляем избранные сервисы в порядке сохраненных позиций
        const favoriteServices = filteredServices.filter(service => favorites.includes(service.name));
        favorites.forEach(favName => {
            const service = favoriteServices.find(s => s.name === favName);
            if (service) {
                const item = this.createServiceTreeItem(service);
                item.contextValue = 'service-favorite';
                items.push(item);
            }
        });

        // Добавляем разделитель
        if (items.length > 0) {
            const separator = new vscode.TreeItem('──────────', vscode.TreeItemCollapsibleState.None);
            separator.contextValue = 'separator';
            items.push(separator as ServiceTreeItem);
        }

        // Добавляем остальные сервисы
        filteredServices
            .filter(service => !favorites.includes(service.name))
            .forEach(service => items.push(this.createServiceTreeItem(service)));

        return items;
    }

    private createServiceTreeItem(service: IService): ServiceTreeItem {
        let description = `${service.status} ${service.isEnabled ? '(enabled)' : '(disabled)'}`;
        let label = service.name;

        if (this.systemctlService.isFavorite(service.name)) {
            label = `★ ${service.name}`;
            description = `${description} [Favorite]`;
        }

        const treeItem = new vscode.TreeItem(
            label,
            vscode.TreeItemCollapsibleState.None
        );

        (treeItem as any).description = description;
        treeItem.tooltip = `${service.name}\nStatus: ${service.status}\nEnabled: ${service.isEnabled}`;
        treeItem.contextValue = this.systemctlService.isFavorite(service.name) ? 'service-favorite' : 'service';

        // Устанавливаем иконку в зависимости от статуса
        if (this.systemctlService.isFavorite(service.name)) {
            treeItem.iconPath = new vscode.ThemeIcon('star-full', new vscode.ThemeColor('charts.yellow'));
        } else {
            if (service.status === 'active') {
                treeItem.iconPath = new vscode.ThemeIcon('play', new vscode.ThemeColor('charts.green'));
            } else if (service.status === 'failed') {
                treeItem.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('charts.red'));
            } else {
                treeItem.iconPath = new vscode.ThemeIcon('stop', new vscode.ThemeColor('charts.gray'));
            }
        }

        // Добавляем дополнительные свойства для доступа в командах
        (treeItem as any).name = service.name;
        (treeItem as any).serviceStatus = service.status;
        (treeItem as any).isEnabled = service.isEnabled;

        return treeItem as ServiceTreeItem;
    }
}

export type ServiceTreeItem = vscode.TreeItem & {
    name: string;
    serviceStatus: 'active' | 'inactive' | 'failed';
    isEnabled: boolean;
};
