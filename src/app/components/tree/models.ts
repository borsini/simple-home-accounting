import { Observable } from "rxjs/Observable";

export interface TreeItem {
    id: string;
    title: string;
    subtitle: string;
    isChecked: boolean;
    childrenIds: string[];
}

export interface TreeDatasource {
    getItemForId(id: string): Observable<TreeItem | undefined>;
}

export interface TreeDelegate {
    onItemClicked(item: TreeItem);
    onItemChecked(item: TreeItem, isChecked: boolean);
}