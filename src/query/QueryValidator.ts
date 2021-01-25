import Log, {isNullOrUndefined} from "../Util";
import instantiate = WebAssembly.instantiate;
import {ApplyObject} from "./QueryObjects/ApplyObject";
import {CoursesDataset} from "../model/CoursesDataset";
import {Dataset} from "../model/Dataset";
import {Data} from "../model/Data";
import {QueryUtil} from "./QueryUtil";
import {type} from "os";
import {RoomParser} from "./RoomParser";


export class QueryValidator {

    public validWhereComparators: string[] = ["LT", "GT", "EQ", "IS"];
    public validLogicStatements: string[] = ["AND", "OR"];
    public datasetsQueried = new Set();
    public FILTER: any[] = [];
    public COLUMNS: any[] = [];
    public ORDER: any[] = [];
    public GROUP: any[] = [];
    public APPLY: ApplyObject;
    public queryUtil: QueryUtil = new QueryUtil();
    public transformations: boolean = false;
    public datasetsMap: Map<string, Dataset>;
    public sortdir: string = "";

    public validateQuery(query: any, dataMap: Map<string, Dataset>): string {
        let keys = Object.keys(query);
        this.datasetsMap = dataMap;
        this.queryUtil.dataMap = dataMap;
        let res1 = this.checkMissingItem(keys);
        if (!(res1 === "")) {
            return res1;
        }
        let res2 = this.checkNullWhereOrOptions(query);
        if (res2 !== "") {
            return res2;
        }
        let whereLength = Object.keys(query.WHERE).length;
        if (whereLength > 1) {
            return "WHERE should only have 1 key, has " + whereLength;
        }
        if (!(whereLength === 0)) {
            let validateWhereResult = this.validateWhere(query.WHERE);
            if (validateWhereResult !== "") {
                return validateWhereResult;
            }
        }
        this.FILTER.push(query.WHERE);
        if (whereLength === 0) {
            this.FILTER = [];
        }
        if (query.TRANSFORMATIONS && query.TRANSFORMATIONS !== null) {
            this.transformations = true;
            this.APPLY = new ApplyObject();
            this.APPLY.util = this.queryUtil;
            let validTransform = this.validateTransformations(query.TRANSFORMATIONS);
            if (validTransform !== "") {
                return validTransform;
            }
        }
        let result = this.validateOptions(query.OPTIONS);
        if (this.transformations) {
            for (let col of this.COLUMNS) {
                if (!this.GROUP.includes(col) &&
                    (isNullOrUndefined(this.APPLY.hasApplyKey(col)) || !this.APPLY.hasApplyKey(col))) {
                    result = "if you have a transformation, can't have things in col not in transform";
                }
            }
        }
        if (result !== "") {
            return result;
        }
        return "";
    }

    private checkMissingItem(keys: any): string {
        if (!keys.includes("WHERE")) {
            return "Missing WHERE";
        }
        if (!keys.includes("OPTIONS")) {
            return "Missing OPTIONS";
        }
        for (let x of keys) {
            if (x !== "WHERE" && x !== "OPTIONS" && x !== "TRANSFORMATIONS") {
                return "Invalid query string";
            }
        }
        return "";
    }

    private checkNullWhereOrOptions(query: any): string {
        if (!query.WHERE || query.WHERE === null) {
            return "Bad query";
        }
        if (typeof query.WHERE !== "object" || (Array.isArray(query.WHERE))) {
            return "where not object";
        }
        if (!query.OPTIONS || query.OPTIONS === null) {
            return "Bad query";
        }
        return "";
    }

    public validateWhere(whereObject: any): string {
        // console.log("Before loop: " + whereObject);
        // console.log(whereObject);
        /*if (whereObject === undefined || whereObject === null) {
            return "";
        }*/
        for (let item in whereObject) {
            let key = item.toString();
            // Log.trace(whereObject[key]);
            if (this.validLogicStatements.includes(key)) {
                // Log.trace(whereObject[key] instanceof Array);
                if (!(Array.isArray(whereObject[key]))) {
                    return "AND must be a non-empty array";
                }
                if (!(typeof whereObject[key] === "object")) {
                    return "ERROR undefined or null";
                }
                if (!whereObject[key][0] || whereObject[key][0] === null) {
                    return "AND/OR is empty";
                }
                // Log.trace("WHERE key [0] " + whereObject[key][0]);
                let andKeys = Object.keys(whereObject[key][0]);
                if (andKeys.length !== 1) {
                    return "AND should only have 1 key, has " + andKeys.length;
                }


                for (let inner in whereObject[key]) {
                    // Log.trace("Log " + inner + "val: " + whereObject[key][inner]);
                    let val = this.validateWhere(whereObject[key][inner]);
                    if (val !== "") {
                        return val;
                    }
                }
            } else if (this.validWhereComparators.includes(key)) {
                let queryKey = Object.keys(whereObject[key]);
                if (queryKey.length !== 1) {
                    return "Too many keys";
                }
                let valTest = whereObject[key][queryKey[0]];
                let isValidIdKey = this.queryUtil.checkIfIdKeyValid(queryKey[0], valTest);
                if (key === "LT" || key === "GT" || key === "EQ") {
                    if (typeof valTest !== "number") {
                        return "WRONG KEY TYPE";
                    }
                } else {
                    if (typeof valTest !== "string") {
                        return "WRONG KEY TYPE 2";
                    }
                }
                if (!isValidIdKey) {
                    return "Bad ID Key";
                }
            } else if (key === "NOT") {
                return this.validateWhere(whereObject[key]);
            } else {
                return "insight Error";
            }
        }
        return "";
    }

    public validateOptions(optionsObject: any): string {
        let columns: string[][] = [];
        if (!optionsObject.hasOwnProperty("COLUMNS")) {
            return "OPTIONS missing COLUMNS";
        }
        for (let key in optionsObject) {
            if (key === "COLUMNS") {
                for (let col in optionsObject[key]) {
                    let fullIdKey = optionsObject[key][col];
                    if (!(typeof fullIdKey === "string")) {
                        return "Invalid Order Type";
                    }
                    // let idKey = fullIdKey.split("_");
                    let isIdKeyValid = this.queryUtil.checkIfIdKeyValid(fullIdKey);
                    if (this.transformations && this.APPLY.hasApplyKey(fullIdKey)) {
                        this.COLUMNS.push(fullIdKey);    // fullIdKey is an applykey that wants to be a column
                        continue;
                    }
                    if (!isIdKeyValid) {
                        if (!this.transformations || !this.APPLY.hasApplyKey(fullIdKey)) {
                            return "trying to query multiple datasets";
                        }
                    }
                    // TODO: maybe also add in check to see if 2nd part is valid (ex: avg, etc)
                    columns.push(fullIdKey.split("_"));
                    this.COLUMNS.push(this.queryUtil.getKey(fullIdKey));
                }
            } else if (key === "ORDER") {
                let selectedOrder = optionsObject[key];
                if (typeof selectedOrder === "object") {
                    if (!this.validateComplexOrder(selectedOrder)) {
                        return "Invalid complex order";
                    }
                } else if (!(typeof selectedOrder === "string")) {
                    return "error in order type";
                } else {
                    if (!this.queryUtil.checkIfIdKeyValid(selectedOrder)) {
                        Log.trace(selectedOrder);
                        if (!this.transformations || !this.APPLY.hasApplyKey(selectedOrder)) {
                            return "invalid id key in order1";
                        }
                        this.ORDER.push(selectedOrder);
                        continue;
                    }
                    this.ORDER.push(this.queryUtil.getKey(selectedOrder));
                }
            } else {
                return "Invalid Keys Option";
            }
        }
        return "";
    }

    // returns false if id key is invalid, true if it's fine
    public checkIfIdKeyValid(idKey: string[]): boolean {
        if (idKey.length !== 2) {
            return false;
        }
        this.datasetsQueried.add(idKey[0]);
        if (this.datasetsQueried.size > 1) {
            return false;
        }
        return true;
    }

    private validateComplexOrder(orderObj: any) {
        if (!orderObj || orderObj === null) {
            return false;
        }
        if (orderObj.dir === null || !orderObj.dir || !orderObj.keys || orderObj.keys === null) {
            return false;
        }
        let sortOrder = orderObj.dir;
        if (sortOrder !== "UP" && sortOrder !== "DOWN") {
            return false;
        }
        this.sortdir = sortOrder;
        if (!Array.isArray(orderObj.keys) || !orderObj.keys.length) {
            return false;
        }
        for (let key of orderObj.keys) {
            let valid = this.queryUtil.checkIfIdKeyValid(key);
            if (valid) {
                this.ORDER.push(this.queryUtil.getKey(key));
            } else {
                if (!this.transformations || !this.APPLY.hasApplyKey(key)) {
                    return false;
                }
                this.ORDER.push(key);
            }
        }
        return true;
    }

    private validateTransformations(trans: any): string {
        let keys = Object.keys(trans);
        if (keys.length !== 2)  {
            return "Extra keys in transformations";
        }
        if (isNullOrUndefined(trans.APPLY) || isNullOrUndefined(trans.GROUP)) {
            return "Transformations is invalid";
        }
        if (!Array.isArray(trans.GROUP)) {
            return "error group needs to be array";
        }
        if (trans.GROUP.length === 0) {
            return "group must be a non empty array";
        }
        for (let id of trans.GROUP) {
            // Log.trace(id);
            let idKey = id.split("_");
            if (this.checkIfIdKeyValid(idKey)) {
                this.GROUP.push(idKey[1]);
            } else {
                return "invalid key in group";
            }
        }
        if (!Array.isArray(trans.APPLY)) {
            return "Apply should be array";
        }
        for (let x of trans.APPLY) {
            this.APPLY.addApplyObject(x);
            if (!this.APPLY.isValid()) {
                return "BAD APPLY";
            }
            // TODO: check if apply is querying same dataset as rest of query
        }
        return "";
        // loop through apply array, verify things inside
    }
}
