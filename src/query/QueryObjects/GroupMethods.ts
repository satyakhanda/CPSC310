import {SectionData} from "../../model/SectionData";
import {isNullOrUndefined} from "../../Util";

import {Data} from "../../model/Data";

export class GroupMethods {

    public groupObjects(group: any[], returnData: Data[]) {
        // let groupedObjects = new Map<any, SectionData[]>();
        let firstSort = this.sortIntoGroups(group[0], returnData);
        let groupedFinalObject: any[] = [];
        if (group.length === 1) {
            for (let value of firstSort.values()) {
                groupedFinalObject.push(value);
            }
            return groupedFinalObject;
        }
        let innerDataStorage: Data[][] = [];
        for (let value of firstSort.values()) {
            innerDataStorage.push(value);
        }
        for (let i in group) {
            if (Number(i) + 1 < group.length) {
                // iterate through map arrays
                // sort those arrays into further groups based on keys
                let temp: Data[][] = [];
                for (let arr of innerDataStorage) {
                    let subSortedItems = this.sortIntoGroups(group[Number(i) + 1], arr);
                    for (let value of subSortedItems.values()) {
                        temp.push(value);
                    }
                }
                innerDataStorage = temp;
            } else {
                return innerDataStorage;
            }
        }
        // return groupedObjects;
    }


    private sortIntoGroups(groupKey: string, items: Data[]): Map<any, Data[]> {
        let groupedObjects = new Map<any, Data[]>();
        for (let item of items) {
            let objVal = item.get(groupKey);
            if (isNullOrUndefined(groupedObjects.get(objVal))) {
                groupedObjects.set(objVal, []);
                groupedObjects.get(objVal).push(item);
            } else {
                groupedObjects.get(objVal).push(item);
            }
        }
        return groupedObjects;
    }

    public getKeyVals(groupedObjects: Data[][], group: any[]): any[] {
        let groupPairings: any[] = [];
        for (let sectionList of groupedObjects) {
            let obj: any = [];
            for (let groupItem of group) {
                obj[groupItem] = sectionList[0].get(groupItem);
            }
            groupPairings.push(obj);
        }
        return groupPairings;
    }
}
