import {BuildingData} from "../model/BuildingData";
import Log from "../Util";
import {AddRoom} from "./AddRoom";

export class AddBuilding {

    public addRoomObject: AddRoom;

    constructor(room: AddRoom) {
        this.addRoomObject = room;
    }

    public getBuildingList(document: any, content: string): Promise<any> {
        return this.getBuildingIndexHTM(document);
    }

    private getBuildingIndexHTM(document: any): Promise<any> {
        let arr = [];
        for (let index in document) {
            if (index === "parentNode") {
                continue;
            }
            if (typeof document[index] === "object" && document[index] !== null) {
                 arr.push(this.getBuildingIndexHTM(document[index]));
            } else {
                if (document[index] === "table") {
                    return this.getBuildingInformationFromIndexHTM(document);
                }
            }
        }
        return Promise.all(arr);
    }

    private getBuildingInformationFromIndexHTM(document: any): Promise<any> {
        if (!this.verifyTable(document)) {
            return;
        }
        let buildingInformation = document.childNodes[3].childNodes.filter((node: any) => node.nodeName === "tr");
        for (let building of buildingInformation) {
            if (building.nodeName === "tr") {
                let buildingObject = new BuildingData();
                this.getBuildingInformationFromIndexHTMTD(building, buildingObject);
                this.addRoomObject.buildingListBuildingType.push(buildingObject);
            }
        }
        let promise: Array<Promise<any>> = [];
        for (let b of this.addRoomObject.buildingListBuildingType) {
            promise.push(this.getGeoLocation(b.buildingAddress, b));
        }
        let intermediateArray: any[] = [];
        return Promise.all(promise).then((finishedBuildings: any[]) => {
            for (let item of finishedBuildings) {
                item.buildingShortname = item.buildingShortname.trim();
                Log.trace("trimmed");
                item.buildingAddress = item.buildingAddress.trim();
                Log.trace(item.buildingLatitude);
                if (item.buildingLatitude !== 404 && item.buildingLongitude !== 404) {
                    intermediateArray.push(item);
                    Log.trace("looping");
                }
            }
            return intermediateArray;
        }).then((res) => {
            this.addRoomObject.buildingListBuildingType = res;
           // Log.trace(this.addRoomObject.buildingListBuildingType);
            Log.trace("PROCESSED BUILDINGLIST");
        });
    }

    private getGeoLocation(address: string, buildingObject: BuildingData): Promise<any> {
        return new Promise((resolve, reject) => {
            const http = require("http");
            address = address.trim();
            let URI = encodeURI(address);
            let parsedData: any;
            let URL = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team160/" + URI;
            try {
                http.get(URL, (result: any) => {
                    let data = "";
                    result.on("data", (chunk: any) => {
                        data += chunk;
                    });
                    result.on("end", () => {
                        try {
                            parsedData = JSON.parse(data);
                            buildingObject.buildingLatitude = parsedData.lat;
                            buildingObject.buildingLongitude = parsedData.lon;
                            return resolve(buildingObject);
                        } catch (e) {
                            // parsedData = {error: "something failed"};
                            return resolve(404);
                        }
                    });
                }).on("error", (err: any) => {
                    // parsedData = {error: "something failed" + err};
                    buildingObject.buildingLongitude = 404;
                    buildingObject.buildingLatitude = 404;
                    Log.trace("123" + err);
                    return resolve(buildingObject);
                });
            } catch (e) {
                return resolve(buildingObject);
            }
        });
    }

    private getBuildingInformationFromIndexHTMTD(building: any, buildingObject: BuildingData) {
        let buildingInformation = building.childNodes.filter((node: any) => node.nodeName === "td");
        for (let td of buildingInformation) {
            if (td.attrs[0].value === "views-field views-field-field-building-code") {
                buildingObject.buildingShortname = td.childNodes[0].value;
            }
            if (td.attrs[0].value === "views-field views-field-title") {
                buildingObject.buildingLongName = td.childNodes[1].childNodes[0].value;
                buildingObject.buildingRelativePath = td.childNodes[1].attrs[0].value;
                let destinationKey = "rooms" + buildingObject.buildingRelativePath.slice(1);
                this.addRoomObject.destination.push(destinationKey);
            }
            if (td.attrs[0].value === "views-field views-field-field-building-address") {
                buildingObject.buildingAddress = td.childNodes[0].value;
            }
        }
    }

    private verifyTable(buildingElement: any): boolean {
        for (let element in buildingElement) {
            if (this.addRoomObject.flag === true) {
                return true;
            }
            if (element === "parentNode") {
                continue;
            }
            if (typeof buildingElement[element] === "object" && buildingElement[element] !== null) {
                this.verifyTable(buildingElement[element]);
            } else {
                if (buildingElement[element] === "views-table cols-5 table") {
                    this.addRoomObject.flag = true;
                    return true;
                }
            }
        }
    }
}
