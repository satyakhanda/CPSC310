import Log, {isNullOrUndefined} from "../Util";
import {CoursesDataset} from "../model/CoursesDataset";
import {InsightDatasetKind} from "../controller/IInsightFacade";
import {type} from "os";
import {Dataset} from "../model/Dataset";

export class QueryUtil {
    public datasetsQueried = new Set();
    public dataMap: Map<string, Dataset>;
    public datasetKind: InsightDatasetKind;
    // private static util: QueryUtil;

    /* private constructor() {
         // private constructor
     }*/

    /*
        public static getUtil(): QueryUtil {
            if (!QueryUtil.util || QueryUtil.util === null) {
                QueryUtil.util = new QueryUtil();
                return QueryUtil.util;
            }
            return QueryUtil.util;
        }*/
    public static sortItems(order: string, arrayToSort: any[], sortdir: string): any[] {
        // NOTE: this is a way to stable sort (found on stackoverflow)
        let sortArray = arrayToSort.map(function (data: any, index: any) {
            return {index: index, data: data};
        });

        if (sortdir === "DOWN") {
            Log.trace(sortdir);
            sortArray.sort(function (a: any, b: any) {
                if (a.data[order] < b.data[order]) {
                    return 1;
                }
                if (a.data[order] > b.data[order]) {
                    return -1;

                }
                return a.index - b.index;   // this part does stable sorting
            });

        } else if (sortdir === "UP") {
            Log.trace("up");
            sortArray.sort(function (a: any, b: any) {
                if (a.data[order] < b.data[order]) {
                    return -1;
                }
                if (a.data[order] > b.data[order]) {
                    return 1;

                }
                return a.index - b.index;   // this part does stable sorting
            });
        } else {
            Log.trace("Else");
            sortArray.sort(function (a: any, b: any) {
                if (a.data[order] < b.data[order]) {
                    return -1;
                }
                if (a.data[order] > b.data[order]) {
                    return 1;
                }
                return b.index - a.index;   // this part does stable sorting
            });
        }
        let ab = sortArray.map(function (val: any) {
            return val.data;
        });
        return ab;

    }

    public checkIfIdKeyValid(key: string, val?: any): boolean {
        let idKey = key.split("_");
        if (idKey.length !== 2) {
            return false;
        }
        this.datasetsQueried.add(idKey[0]);
        if (this.datasetsQueried.size > 1) {
            this.datasetsQueried.delete(idKey[0]);
            return false;
        }


        let iter = this.datasetsQueried.values();
        let idToQuery = String(iter.next().value);
        let dataset = this.dataMap.get(idToQuery);
        if (isNullOrUndefined(dataset)) {
            return false;
        }
        // set dataset type
        this.datasetKind = dataset.kind;

        if (!isNullOrUndefined(val) || val === "") {
            return this.validateQueryKey(idKey[1], val);
        } else {
            return QueryUtil.validateKey(idKey[1], this.datasetKind);
        }
        return true;
    }

    public static validateKey(key: string, kind: InsightDatasetKind): boolean {
        if (kind === InsightDatasetKind.Courses) {
            if (key === "dept") {
                return true;
            } else if (key === "id") {
                return true;
            } else if (key === "avg") {
                return true;
            } else if (key === "instructor") {
                return true;
            } else if (key === "title") {
                return true;
            } else if (key === "pass") {
                return true;
            } else if (key === "fail") {
                return true;
            } else if (key === "audit") {
                return true;
            } else if (key === "uuid") {
                return true;
            } else if (key === "year") {
                return true;
            }
        } else {
            if (key === "fullname") {
                return true;
            } else if (key === "shortname") {
                return true;
            } else if (key === "number") {
                return true;
            } else if (key === "name") {
                return true;
            } else if (key === "address") {
                return true;
            } else if (key === "lat") {
                return true;
            } else if (key === "lon") {
                return true;
            } else if (key === "seats") {
                return true;
            } else if (key === "type") {
                return true;
            } else if (key === "furniture") {
                return true;
            } else if (key === "href") {
                return true;
            }
        }
        return false;
    }

    // ASSUMES that you can split string
    public getKey(obj: any) {
        let idKey = obj.split("_");
        return idKey[1];
    }

    private validateQueryKey(key: string, val: any): boolean {
        if (this.datasetKind === InsightDatasetKind.Courses) {
            if (key === "dept") {
                return (typeof val === "string");
            } else if (key === "id") {
                return (typeof val === "string");
            } else if (key === "avg") {
                return (typeof val === "number");
            } else if (key === "instructor") {
                return (typeof val === "string");
            } else if (key === "title") {
                return (typeof val === "string");
            } else if (key === "pass") {
                return (typeof val === "number");
            } else if (key === "fail") {
                return (typeof val === "number");
            } else if (key === "audit") {
                return (typeof val === "number");
            } else if (key === "uuid") {
                return (typeof val === "string");
            } else if (key === "year") {
                return (typeof val === "number");
            }
        } else if (this.datasetKind === InsightDatasetKind.Rooms) {
            if (key === "fullname") {
                return (typeof val === "string");
            } else if (key === "shortname") {
                return (typeof val === "string");
            } else if (key === "number") {
                return (typeof val === "string");
            } else if (key === "name") {
                return (typeof val === "string");
            } else if (key === "address") {
                return (typeof val === "string");
            } else if (key === "lat") {
                return (typeof val === "number");
            } else if (key === "lon") {
                return (typeof val === "number");
            } else if (key === "seats") {
                return (typeof val === "number");
            } else if (key === "type") {
                return (typeof val === "string");
            } else if (key === "furniture") {
                return (typeof val === "string");
            } else if (key === "href") {
                return (typeof val === "string");
            }
        }
        return false;
    }

}

