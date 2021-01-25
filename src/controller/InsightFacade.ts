import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError
} from "./IInsightFacade";
import {QueryValidator} from "../query/QueryValidator";
import * as JSZip from "jszip";
import {QueryParser} from "../query/QueryParser";
import {SectionData} from "../model/SectionData";
import ErrnoException = NodeJS.ErrnoException;
import {Dataset} from "../model/Dataset";
import {AddCourse} from "./AddCourse";
import {AddRoom} from "./AddRoom";
import {CoursesDataset} from "../model/CoursesDataset";
import {RoomDataset} from "../model/RoomDataset";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 * test
 */

export default class InsightFacade implements IInsightFacade {

    public datasetCollection: string[];
    public dataMap: Map<string, Dataset>;

    constructor() {
        this.dataMap = new Map<string, Dataset>();
        this.datasetCollection = [];
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {

        let functionPromise: Promise<string[]>;
        functionPromise = new Promise((resolve, reject) => {

            if (kind === InsightDatasetKind.Courses) {
                let courses = new AddCourse(this);
                courses.addCourse(id, content, kind).then(() => {
                    return resolve(this.datasetCollection);
                }).catch((err: any) => {

                    Log.trace("Error Caught");
                    return reject(new InsightError("You done fucked up"));
                });
            }
            if (kind === InsightDatasetKind.Rooms) {
                let rooms = new AddRoom(this);
                rooms.addRooms(id, content, kind).then(() => {
                    return resolve(this.datasetCollection);
                }).catch((err: any) => {
                    return reject(new InsightError("Fuck you"));
                });
            }
        });
        return functionPromise;
    }

    public removeDataset(id: string): Promise<string> {
        let fs = require("fs");
        let functionPromise: Promise<string>;
        let path = "data/" + id + ".txt";
        functionPromise = new Promise((removeDatasetResolve, removeDatasetReject) => {
            if (!id || typeof id === null) {
                return removeDatasetReject(new InsightError("Invalid ID"));
            }
            if (id.includes("_") || id.trim().length === 0) {
                return removeDatasetReject(new InsightError("ID not formatted correctly"));
            }
            if (!this.datasetCollection.includes(id)) {
                fs.unlink(path, (err: ErrnoException) => {
                    if (err) {
                        return removeDatasetReject(new NotFoundError("Id not in Disk"));
                    }
                });
                let x = this.datasetCollection.indexOf(id);
                delete this.datasetCollection[x];
                this.dataMap.delete(id);
                return removeDatasetReject(new NotFoundError("Id was not added yet"));
            }
            fs.unlink(path, (err: ErrnoException) => {
                if (err) {
                    return removeDatasetReject(new NotFoundError("Id not in Disk"));
                }
                const index = this.datasetCollection.indexOf(id);
                if (index > -1) {
                    this.datasetCollection.splice(index, 1);
                }
                let x = this.datasetCollection.indexOf(id);
                delete this.datasetCollection[x];
                this.dataMap.delete(id);
                removeDatasetResolve(id);
            });
        });

        return functionPromise;
    }

    public loadDataset(id: string): Promise<Dataset> {
        let returnDataset: Dataset;
        let fs = require("fs");
        let path = "data/" + id + ".txt";
        let functionPromise: Promise<Dataset>;
        functionPromise = new Promise((resolve, reject) => {
            fs.readFile(path, "utf8", (err: any, data: any) => {
                if (err) {
                    return reject(err);
                }
                let jsonData = JSON.parse(data);
                if (jsonData.kind === InsightDatasetKind.Courses) {
                    let courseDataset = new CoursesDataset(jsonData.sections, jsonData.id, jsonData.kind);
                    let sectionsList: SectionData[] = [];
                    for (let item of jsonData.sections) {
                        let section = new SectionData(item.coursesDept, item.coursesId, item.coursesAvg,
                            item.coursesInstructor, item.coursesTitle, item.coursesPass,
                            item.coursesFail, item.coursesAudit, item.coursesUuid, item.coursesYear);
                        sectionsList.push(section);
                    }
                    courseDataset.sections = sectionsList;
                    courseDataset.insightDataset.numRows = courseDataset.sections.length;
                    returnDataset = courseDataset;
                } else if (jsonData.kind === InsightDatasetKind.Rooms) {
                    let roomDataset = new RoomDataset(jsonData.rooms, jsonData.id, jsonData.kind);
                    returnDataset = roomDataset;
                }
                resolve(returnDataset);
            });
        });
        return functionPromise;
    }

    public performQuery(query: any): Promise<any[]> {
        let fs = require("fs");
        let qv = new QueryValidator();
        let validateResult: string = qv.validateQuery(query, this.dataMap);
        if (!(validateResult === "")) {
            if (validateResult === "Bad ID Key") {
                let iter1 = qv.queryUtil.datasetsQueried.values();
                let idToQuery1 = String(iter1.next().value);
                if (!fs.existsSync("data/" + idToQuery1 + ".txt")) {
                    return Promise.reject(new InsightError("ID has not been added to set"));
                }
                return this.loadDataset(idToQuery1).then((loadedDataset) => {
                    this.dataMap.set(idToQuery1, loadedDataset);
                    this.datasetCollection.push(idToQuery1);
                    return this.performQuery(query);
                }).catch((err: any) => {
                    return Promise.reject(new InsightError(err));
                });
            }
            return Promise.reject(new InsightError(validateResult));
        }
        let iter = qv.queryUtil.datasetsQueried.values();
        let idToQuery = String(iter.next().value);
        Log.trace(idToQuery);
        if (!this.datasetCollection.includes(idToQuery)) {
            return Promise.reject(new InsightError("ID has not been added to set"));
            // TODO: try load something from file

        }
        let parser = new QueryParser(this.dataMap.get(idToQuery));
        let parserResult: SectionData[];
        try {
            Log.trace(qv.ORDER);
            parserResult = parser.parse(qv.FILTER, qv.COLUMNS, qv.ORDER, qv.GROUP, qv.APPLY,
                qv.sortdir, qv.transformations);
        } catch (err) {
            Log.trace("HERE");
            return Promise.reject(new InsightError(err.message));
        }
        if (parserResult.length > 5000) {
            let x: ResultTooLargeError = new ResultTooLargeError();
            return Promise.reject(x);
        }
        Log.trace(parserResult);
        return Promise.resolve(parserResult);
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let functionPromise: Promise<InsightDataset[]>;
        let insightDatasetCollection: InsightDataset[] = [];
        functionPromise = new Promise((resolve, reject) => {
            for (let [k, v] of this.dataMap.entries()) {
                insightDatasetCollection.push(v.insightDataset);
            }
            resolve(insightDatasetCollection);
        });
        return functionPromise;
    }
}

