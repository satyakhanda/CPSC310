import Log, {isNullOrUndefined} from "../../Util";
import {QueryUtil} from "../QueryUtil";
import {Decimal} from "decimal.js";
import {SectionData} from "../../model/SectionData";
import {Data} from "../../model/Data";
import {InsightError} from "../../controller/IInsightFacade";

export class ApplyObject {
    private isValidApply: boolean = true;
    private applyMapping: Map<string, any>;
    private validApplyTokens: string[] = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
    public util: QueryUtil;

    constructor() {
        this.applyMapping = new Map();
    }

    public addApplyObject(obj: any) {
        let applyKey = Object.keys(obj);
        if (isNullOrUndefined(applyKey)) {
            this.isValidApply = false; // apply is
        } else if (applyKey.length !== 1) {
            this.isValidApply = false; // APPLY rule should have 1 key, has different number
        }
        if (isNullOrUndefined(obj[applyKey[0]])) {
            this.isValidApply = false;
        } else if (applyKey[0] === "") {
            this.isValidApply = false;
        }
        Log.trace(applyKey[0]);
        let applyObj = obj[applyKey[0]];
        if (isNullOrUndefined(applyObj)) {
            this.isValidApply = false;
            return;
        }
        let applyObjKeys = Object.keys(applyObj);
        if (isNullOrUndefined(applyObjKeys) || applyObjKeys.length !== 1) {
            this.isValidApply = false;
        }
        /*if (typeof applyObj === "object") {
            this.isValidApply = false;
        }*/
        let applyObjValueKey = Object.values(applyObj)[0];
        if (isNullOrUndefined(applyObjValueKey) || !(typeof applyObjValueKey === "string") ||
            !this.util.checkIfIdKeyValid(String(applyObjValueKey))) {
            this.isValidApply = false;
        }
        if (!this.isApplyTokenValid(applyObjKeys[0])) {
            this.isValidApply = false;
        }
        if (this.hasApplyKey(applyKey[0])) {
            this.isValidApply = false;
        }
        this.applyMapping.set(applyKey[0], applyObj);

    }

    private isApplyTokenValid(applyToken: string): boolean {
        if (!this.validApplyTokens.includes(applyToken)) {
            return false;
        }
        return true;
    }

    public isValid(): boolean {
        return this.isValidApply;
    }

    public hasApplyKey(keyToCheck: string): boolean {
        if (!isNullOrUndefined(this.applyMapping.get(keyToCheck))) {
            return true;
        }
        return false;
    }

    public apply(groupedObjects: Data[][]): any[] {
        let returnObject: any[] = [];
        for (let item of groupedObjects) {
            returnObject.push(this.calculateApply(item));
        }
        return returnObject;
    }

    private calculateApply(sectionArray: Data[]): any {
        // sectionArray is one of the split up groups of section data's
        let applyValues: any[any] = [];
        for (let applyName of this.applyMapping.keys()) {
            applyValues[applyName] = this.doApply(sectionArray, this.applyMapping.get(applyName));
        }
        return applyValues;
    }

    private doApply(sectionArray: Data[], applyObject: any): number {
        // TODO: check if items are numeric (ex: avg, max, min, sum) noting that count works on all
        let applyToken = Object.keys(applyObject)[0];
        let itemToApplyOn: string = String(Object.values(applyObject)[0]).split("_")[1];
        if (applyToken === "AVG") {
            return this.doAvg(applyToken, itemToApplyOn, sectionArray);
        } else if (applyToken === "MAX") {
            if (!this.checkIfProperlyApply(applyToken, itemToApplyOn)) {
                throw new InsightError("TEST");
            }
            let max: number = Number.MIN_VALUE;
            for (let section of sectionArray) {
                if (Number(section.get(itemToApplyOn)) > max) {
                    max = Number(section.get(itemToApplyOn));
                }
            }
            return max;
        } else if (applyToken === "MIN") {
            if (!this.checkIfProperlyApply(applyToken, itemToApplyOn)) {
                throw new InsightError("TEST");
            }
            let min: number = Number.MAX_VALUE;
            for (let section of sectionArray) {
                if (Number(section.get(itemToApplyOn)) < min) {
                    min = Number(section.get(itemToApplyOn));
                }
            }
            return min;
        } else if (applyToken === "SUM") {
            if (!this.checkIfProperlyApply(applyToken, itemToApplyOn)) {
                throw new InsightError("TEST");
            }
            let total: number = 0;
            for (let section of sectionArray) {
                total += Number(section.get(itemToApplyOn));
            }
            return Number(total.toFixed(2));
        } else if (applyToken === "COUNT") {
            let tempArr: any[] = [];
            let count: number = 0;
            for (let section of sectionArray) {
                if (!tempArr.includes(section.get(itemToApplyOn))) {
                    count++;
                    tempArr.push(section.get(itemToApplyOn));
                }
            }
            return count;
        }
        return null;
    }

    private doAvg(applyToken: any, itemToApplyOn: any, sectionArray: any) {
        if (!this.checkIfProperlyApply(applyToken, itemToApplyOn)) {
            throw new InsightError("TEST");
        }
        let total = new Decimal(0);
        for (let section of sectionArray) {
            let val = section.get(itemToApplyOn);
            let singleVal = new Decimal(val);
            total = Decimal.add(total, singleVal);
        }
        let avg = total.toNumber() / sectionArray.length;
        let res = Number(avg.toFixed(2));
        return res;
    }

    private checkIfProperlyApply(applyToken: string, itemToApplyOn: string): boolean {
        if (applyToken === "MAX" || applyToken === "MIN" || applyToken === "AVG" || applyToken === "SUM") {
            if (itemToApplyOn === "seats" || itemToApplyOn === "lon" || itemToApplyOn === "lat" ||
                itemToApplyOn === "pass" || itemToApplyOn === "fail"
                || itemToApplyOn === "avg" || itemToApplyOn === "year") {
                return true;
            } else {
                return false;
            }
        }
        return true;
    }
}
