import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {Dataset} from "../model/Dataset";
import Log from "../Util";
import InsightFacade from "./InsightFacade";
import {CoursesDataset} from "../model/CoursesDataset";

export class AddCourse {

    private insightFacade: InsightFacade;

    constructor(insightFacade: InsightFacade) {
        this.insightFacade = insightFacade;
    }

    public addCourse(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let zipFile = JSZip();
        let fs = require("fs-extra");
        let dataset: CoursesDataset;
        let info = Array<Promise<string>>();
        let functionPromise: Promise<string[]>;

        functionPromise = new Promise((resolve, reject) => {
            if (this.helper(id, content, kind) === false) {
                return reject(new InsightError("You dont messed up"));
            }
            zipFile.loadAsync(content, {base64: true})
                .then((zip: JSZip) => {
                    let x = Object.keys(zip.files);
                    if (x[0] !== "courses/") {
                        return reject(new InsightError("Folder is misnamed inside zip"));
                    }
                    zip.folder("courses").forEach(function (relativePath, file) {
                        info.push(file.async("text"));
                    });
                    Promise.all(info).then((promise: string[]) => {
                        dataset = new CoursesDataset(promise, id, kind);
                        if (dataset.sections.length === 0) {
                            return reject(new InsightError("No valid sections to add"));
                        }
                        let jsonDataset = JSON.stringify(dataset);
                        this.insightFacade.datasetCollection.push(id);
                        return this.helper2(id, jsonDataset);
                    }).then(() => {
                        this.insightFacade.dataMap.set(id, dataset);
                        resolve(this.insightFacade.datasetCollection);
                    }).catch((err: any) => {
                        reject("Error");
                    });
                })
                .catch((err: any) => {
                    Log.trace("Error Caught12");
                    return reject(new InsightError("You done fucked up"));
                });
        });
        return functionPromise;
    }

    private helper2(id: string, jsonDataset: string): Promise<any> {
        let fs = require("fs-extra");
        return new Promise((innerResolve, innerReject) => {
            fs.writeFile("data/" + id + ".txt", jsonDataset, (err: any) => {
                if (err) {
                    innerReject(err);
                } else {
                    innerResolve(jsonDataset);
                }
            });
        });
    }


    public helper(id: string, content: string, kind: InsightDatasetKind): boolean {
        let fs = require("fs");
        if (!id || id === null) {
            return false;
        }
        if (id.includes("_") || id.trim().length === 0) {
            return false;
        }
        if (this.insightFacade.datasetCollection.includes(id)) {
            return false;
        }
        if (fs.existsSync("data/" + id + ".txt")) {
            return false;
        }
        if (kind !== InsightDatasetKind.Courses) {
            return false;
        }
        if (content === null) {
            return false;
        }
    }
}
