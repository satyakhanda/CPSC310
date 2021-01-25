import InsightFacade from "./InsightFacade";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import JSZip = require("jszip");
import {JSZipObject} from "jszip";
import {RoomData} from "../model/RoomData";
import Log from "../Util";
import {DefaultTreeDocument, DefaultTreeNode} from "parse5";
import {BuildingData} from "../model/BuildingData";
import {AddBuilding} from "./AddBuilding";
import {Dataset} from "../model/Dataset";
import {RoomDataset} from "../model/RoomDataset";
export class AddRoom {
    public insightFacade: InsightFacade;
    public buildingList: string[];
    public flag: boolean;
    public destination: string[];
    public roomsList: RoomData[];
    public buildingListBuildingType: BuildingData[];
    constructor(insightFacade: InsightFacade) {
        this.insightFacade = insightFacade;
        this.buildingList = [];
        this.flag = false;
        this.destination = [];
        this.roomsList = [];
        this.buildingListBuildingType = [];
    }

    public addRooms(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let zipFile = JSZip();
        let fs = require("fs-extra");
        const parse5 = require("parse5");
        let document: Promise<Document>;
        // let info = Array<Promise<string>>();
        let map = new Map<Promise<string>, string>();
        let functionPromise: Promise<string[]>;
        // let order: string[] = [];
        functionPromise = new Promise((resolve, reject) => {
            if (this.helper(id, content, kind) === false) {
                return reject(new InsightError("You done messed up"));
            }
            zipFile.loadAsync(content, {base64: true})
                .then((zip: JSZip) => {
                    Log.trace("FIRST HERE");
                    let x = Object.keys(zip.files);
                    if (x[0] !== "rooms/") {
                        return reject(
                            new InsightError("Folder is misnamed inside zip"),
                        );
                    }
                    return zip;
                })
                .then((zip: JSZip) => {
                    return zip.file("rooms/index.htm").async("text")
                        .then((htm) => {
                            let htmlDocument = parse5.parse(htm);
                            Log.trace("SECOND HERE");
                            return htmlDocument;
                        });
                })
                .then((promise: any) => {
                    let htmlDocument = promise;
                    let buildingClassObject = new AddBuilding(this);
                    return buildingClassObject.getBuildingList(htmlDocument, content);
                }).then(() => {
                zipFile.loadAsync(content, {base64: true})
                    .then((zip: JSZip) => {
                        return this.helper4(zip);
                        // zip.folder("rooms/campus/discover/buildings-and-classrooms/")
                        //     .forEach((relativePath: string, file: JSZipObject) => {
                        //         if (this.destination.includes(file.name)) {
                        //             info.push(file.async("text"));
                        //             order.push(relativePath);
                        //         }
                        //         Log.trace("PUSHED FILES");
                        //     })
                    }).then((info) => {
                    return this.helper2(info, id, content, kind);
                }).then((value) => {
                    resolve(this.insightFacade.datasetCollection);
                });
            }).catch((err: any) => {
                reject(new InsightError("wtf"));
            });
        });
        return functionPromise;
    }

    private helper4(zip: JSZip): Promise<any> {
        return new Promise((resolve, reject) => {
            let info = Array<Promise<string>>();
            let order: string[] = [];
            zip.folder("rooms/campus/discover/buildings-and-classrooms/")
                .forEach((relativePath: string, file: JSZipObject) => {
                    if (this.destination.includes(file.name)) {
                        info.push(file.async("text"));
                        order.push(relativePath);
                    }
                    resolve(info);
                });
        });
    }

    private helper2(info: any, id: string, content: string, kind: InsightDatasetKind): Promise<any> {
        let parse5 = require("parse5");
        return Promise.all(info)
            .then((promiseFile: any) => {
                for (let item in promiseFile) {
                    let room = new RoomData();
                    let buildingHTML = parse5.parse(promiseFile[item]);
                    this.findRoomInfo(buildingHTML, room);
                }
                this.match();
            }).catch((e) => {
                Log.error(e);
            }).then(() => {
                let dataSet = new RoomDataset(this.roomsList, id, kind);
                let jsonDataset = JSON.stringify(dataSet);
                this.helper3(id, jsonDataset);
                this.insightFacade.datasetCollection.push(id);
                this.insightFacade.dataMap.set(id, dataSet);
            });
    }


    private helper3(id: string, jsonDataset: string): Promise<any> {
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

    private match() {
        for (let room of this.roomsList) {
            let roomhref = room.roomHref;
            roomhref = roomhref.replace("http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/", "");
            let result = roomhref.split("-");
            roomhref = result[0];
            for (let find in this.buildingListBuildingType) {
                if (roomhref === this.buildingListBuildingType[find].buildingShortname) {
                    room.roomAddress = this.buildingListBuildingType[find].buildingAddress;
                    room.roomLat = this.buildingListBuildingType[find].buildingLatitude;
                    room.roomLan = this.buildingListBuildingType[find].buildingLongitude;
                    room.roomFullname = this.buildingListBuildingType[find].buildingLongName;
                    room.roomShortName = this.buildingListBuildingType[find].buildingShortname;
                    room.roomName = room.roomShortName + "_" + room.roomNumber;
                }
            }
        }
        Log.trace("ROOMS ADDED");
    }

    private findRoomInfo(buildingHTML: DefaultTreeDocument | object, room: RoomData) {
        let building = this.findTable(buildingHTML, room);
        return building;
    }

    private findTable(building: any, room: RoomData): any {
        for (let index in building) {
            if (index === "parentNode") {
                continue;
            }
            if (typeof building[index] === "object" && building[index] !== null) {
                this.findTable(building[index], room);
            } else {
                if (building[index] === "table") {
                    this.getBuildingInformation(building, room);
                    return;
                }
            }
        }
    }

    private getBuildingInformation(buildingElement: any, room: RoomData) {
        if (!this.verifyTable(buildingElement)) {
            return;
        }
        for (let element in buildingElement) {
            if (element === "parentNode") {
                continue;
            }
            if (typeof buildingElement[element] === "object" && buildingElement[element] !== null) {
                if (buildingElement.nodeName === "tbody") {
                    this.processTBody(buildingElement, room);
                    return;
                } else {
                    this.getBuildingInformation(buildingElement[element], room);
                }
            }
        }
    }

    private processTBody(buildingElement: any, room: RoomData) {
        for (let child of buildingElement.childNodes) {
            if (child.nodeName === "tr") {
                let rightRoom = new RoomData();
                this.processRoomsTr(child, rightRoom);
                this.roomsList.push(rightRoom);
            }
        }
    }

    private processRoomsTr(trElement: DefaultTreeNode | any, room: RoomData) {
        let roomInfoMap: Map<string, string> = new Map<string, string>();
        roomInfoMap.set("views-field views-field-field-room-number", "roomNumber");
        roomInfoMap.set("views-field views-field-field-room-capacity", "roomSeats");
        roomInfoMap.set("views-field views-field-field-room-furniture", "roomFurniture");
        roomInfoMap.set("views-field views-field-field-room-type", "roomType");
        roomInfoMap.set("views-field views-field-nothing", "roomHref");
        let roomInformation: any[] = trElement.childNodes.filter((node: any) => node.nodeName === "td");
        for (let info of roomInformation) {
            if (roomInfoMap.has(info.attrs[0].value)) {
                if (roomInfoMap.get(info.attrs[0].value) === "roomNumber") {
                    room.roomNumber = this.processRoomTd(info, "roomNumber");
                    room.roomNumber = room.roomNumber.trim();
                }
                if (roomInfoMap.get(info.attrs[0].value) === "roomSeats") {
                    room.roomSeats = this.processRoomTd(info, "roomSeats");
                    room.roomSeats = Number(room.roomSeats.toString().trim().valueOf());
                }
                if (roomInfoMap.get(info.attrs[0].value) === "roomFurniture") {
                    room.roomFurniture = this.processRoomTd(info, "roomFurniture");
                    room.roomFurniture = room.roomFurniture.trim();
                }
                if (roomInfoMap.get(info.attrs[0].value) === "roomType") {
                    room.roomType = this.processRoomTd(info, "roomType");
                    room.roomType = room.roomType.trim();
                }
                if (roomInfoMap.get(info.attrs[0].value) === "roomHref") {
                    room.roomHref = this.processRoomTd(info, "roomHref");
                    room.roomHref = room.roomHref.trim();
                }
            }
        }
    }

    private processRoomTd(info: any, value: string): any {
        if (info === null || info === undefined) {
            return "undefined";
        }
        if (value === "roomHref") {
            return info.childNodes[1].attrs[0].value;
        } else if (value === "roomType" || value === "roomFurniture" || value === "roomSeats") {
            return info.childNodes[0].value;
        } else {
            return info.childNodes[1].childNodes[0].value;
        }
    }

    private verifyTable(buildingElement: any): boolean {
        for (let element in buildingElement) {
            if (this.flag === true) {
                return true;
            }
            if (element === "parentNode") {
                continue;
            }
            if (typeof buildingElement[element] === "object" && buildingElement[element] !== null) {
                this.verifyTable(buildingElement[element]);
            } else {
                if (buildingElement[element] === "views-table cols-5 table") {
                    this.flag = true;
                    return true;
                }
            }
        }
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
        if (content === null) {
            return false;
        }
    }
}
