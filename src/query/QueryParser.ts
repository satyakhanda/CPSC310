import {SectionData} from "../model/SectionData";
import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";
import {isNullOrUndefined} from "../Util";
import {ApplyObject} from "./QueryObjects/ApplyObject";
import {GroupMethods} from "./QueryObjects/GroupMethods";
import {Dataset} from "../model/Dataset";
import {CoursesDataset} from "../model/CoursesDataset";
import {QueryUtil} from "./QueryUtil";
import {RoomParser} from "./RoomParser";


export class QueryParser {
    private datasetRef: Dataset;
    public dataset: CoursesDataset;
    public sectionData: SectionData[];
    public returnData: SectionData[] = [];
    public applyObject: ApplyObject;
    public transformations: boolean = false;

    public mkey = ["avg", "pass", "fail", "audit", "year"];
    public skey = ["dept", "id", "instructor", "title", "uuid"];

    constructor(dataset: Dataset) {
        this.datasetRef = dataset;
        if (dataset.kind === InsightDatasetKind.Courses) {
            this.dataset = dataset as CoursesDataset;
            this.sectionData = Array.from(this.dataset.sections);
        }
        // this.sectionData = Array.from(dataset.sections);
    }

    public setupData(columns: string[]): any[] {
        // purpose is just to put in only the relevant columns
        let retArray: any[] = [];
        for (let item of this.returnData) {   // changed sectionData to dataset.sections
            let relevantSectionData: any = {};
            for (let col of columns) {
                relevantSectionData[this.dataset.id + "_" + col] = item.get(col); // assuming id_key is right
                if (relevantSectionData[this.dataset.id + "_" + col] == null) {
                    throw new InsightError("Column idkey not valid");
                }
            }
            retArray.push(relevantSectionData);
        }
        return retArray;
    }

    // NOTE: all items should be in sectionData that have been search
    public LT(a: number, b: number): boolean {
        return a < b;
    }

    public GT(a: number, b: number): boolean {
        return a > b;
    }

    private EQ(a: number, b: number): boolean {
        return a === b;
    }

    public IS(a: string, b: string): boolean {
        let pos: number = b.indexOf("*", 1);
        if (pos !== -1 && !(pos === b.length - 1)) {
            throw new InsightError("Asterik in wrong place");
        } else if (b.trim() === "*") {
            return true;
        } else if (b[0] === "*" && b[b.length - 1] === "*") {
            if (a.includes(b.substring(1, b.length - 1))) {
                return true;
            }
        } else if (b[0] === "*") {
            if (a.endsWith(b.substring(1, b.length))) {
                return true;
            }
        } else if (b[b.length - 1] === "*") {
            if (a.startsWith(b.substring(0, b.length - 1))) {
                return true;
            }
        } else if (a === b) {
            return true;
        }
        return false;
    }

    public sortItems(order: string, arrayToSort: any[], sortdir: string): any[] {
        // NOTE: this is a way to stable sort (found on stackoverflow)
        return QueryUtil.sortItems(order, arrayToSort, sortdir);
    }

    private parseWhereHelper(filter: any[]) {
        // TODO: parse WHERE and run function (LT,GT,EQ,IS) accordingly to sort sectionData
        for (let item of this.sectionData) {
            // TODO: add IFs for filter, maybe throw in some recursion, and add them to sectionData
            if (filter.length === 0) {
                this.returnData.push(item);
                continue;
            }
            for (let i in filter) {
                let shouldAdd = this.doComparisons(item, filter[i]);
                if (shouldAdd) {
                    this.returnData.push(item);
                }
            }
        }
    }


    public parse(filter: any[], columns: any[], order: any[],
                 group: any[], applyObj: ApplyObject, sortdir: string, transformations: boolean): SectionData[] {
        // test
        // TODO: get section data, store only the relevant columns, sort by relevant columns

        this.transformations = transformations;
        this.applyObject = applyObj;
        if (this.datasetRef.kind === InsightDatasetKind.Rooms) {
            let rParser: RoomParser = new RoomParser(this.datasetRef);
            return rParser.parse(filter, columns, order, group, applyObj, sortdir, transformations);
        }
        this.parseWhereHelper(filter);
        // let columns: string[] = []; // TODO: will have to parse to get this
        if (columns.length === 0) {
            throw new InsightError("COLUMNS empty");
        }
        if (transformations) {
            let retArray: any[] = [];
            retArray = this.applyTransformation(group, columns);
            // return sorted query here, only proceed if transfom NOT being applied
            for (let key of order) {
                if (!isNullOrUndefined(retArray[0])) {

                    if (QueryUtil.validateKey(key, this.dataset.kind)) {
                        retArray = this.sortItems(this.dataset.id + "_" + key, retArray, sortdir);
                    } else if (this.transformations && applyObj.hasApplyKey(key)) {
                        retArray = this.sortItems(key, retArray, sortdir);
                    } else {
                        throw new InsightError("order key must be valid");
                    }
                }
            }
            return retArray;
        }
        let onlyNecessaryColumns = this.setupData(columns);
        // let order: string[];
        // if (order.length > 0) {
        // TODO: organize data by APPLY

        for (let x of order) {  // (order is array incase I can figure out how to sort by 2...)
            if (onlyNecessaryColumns[0] != null && onlyNecessaryColumns[0][this.dataset.id + "_" + x] == null) {
                throw  new InsightError("order key must be in columns");
            }
            onlyNecessaryColumns = this.sortItems(this.dataset.id + "_" + x, onlyNecessaryColumns, sortdir);
        }
        // }
        return onlyNecessaryColumns;
    }

    private doComparisons(item: SectionData, filterVal: any): boolean {
        let operation = Object.keys(filterVal)[0];
        let opVal = Object.values(filterVal)[0];
        let field = Object.keys(opVal)[0];
        let value = Object.values(opVal)[0];    // e.g. courses_field
        if (operation === "EQ" || operation === "GT" || operation === "LT" || operation === "IS") {
            let id: string = field.split("_")[0];
            if (id.trim() === "" || id.startsWith("_")) {
                throw new InsightError("Massive Error!");
            }
        }
        if (operation === "EQ" || operation === "GT" || operation === "LT") {
            let keyType = field.split("_")[1];
            if (!this.mkey.includes(keyType)) {
                throw new InsightError("IS Invalid Key Type");
            }
        }
        if (operation === "EQ") {
            return this.EQ(Number(item.get(field.split("_")[1])), value);
        } else if (operation === "IS") {
            let keyType = field.split("_")[1];
            if (!this.skey.includes(keyType)) {
                throw new InsightError("IS Invalid Key Type");
            }
            return this.IS(String(item.get(field.split("_")[1])), value);
        } else if (operation === "GT") {
            return this.GT(Number(item.get(field.split("_")[1])), value);
        } else if (operation === "LT") {
            return this.LT(Number(item.get(field.split("_")[1])), value);
        } else if (operation === "NOT") {
            if (!value || value === null || Object.keys(opVal).length !== 1) {
                throw new InsightError("NOT has wrong number of items");
            }
            return !(this.doComparisons(item, opVal));
        } else if (operation === "AND") {
            return this.parseAnd(opVal, item);

        } else if (operation === "OR") {
            return this.parseOr(opVal, item);
        }
        return true;
    }

    private parseOr(opVal: any, item: SectionData) {
        let children = Object.values(opVal);
        let shouldAdd: boolean = false;
        for (let j of children) {
            shouldAdd = this.doComparisons(item, j) || shouldAdd;
        }
        return shouldAdd;
    }

    private parseAnd(opVal: any, item: SectionData) {
        let children = Object.values(opVal);
        let shouldAdd: boolean = true;
        for (let j of children) {
            shouldAdd = this.doComparisons(item, j) && shouldAdd;
        }
        return shouldAdd;
    }

    private applyTransformation(group: any[], columns: any[]): any[] {
        let grpMethods: GroupMethods = new GroupMethods();
        let groupedObjects: SectionData[][] = grpMethods.groupObjects(group, this.returnData);
        let appliedValues = this.applyObject.apply(groupedObjects);
        let groupValues = grpMethods.getKeyVals(groupedObjects, group);
        let retArray = this.buildAfterTransformations(groupValues, appliedValues, columns);
        return retArray;
    }

    private buildAfterTransformations(groupValues: any[], appliedValues: any[], columns: any[]): any[] {
        let retArray: any[] = [];
        for (let item of groupValues) {
            let obj: any = {};
            let keys = Object.keys(item);
            for (let key of keys) {
                if (columns.includes(key)) {

                    obj[this.dataset.id + "_" + key] = item[key];
                }
            }
            retArray.push(obj);
        }

        for (let index in appliedValues) {
            let keys = Object.keys(appliedValues[index]);
            for (let key of keys) {
                if (columns.includes(key)) {
                    retArray[index][key] = appliedValues[index][key];
                }
            }
        }

        return retArray;
    }
}
