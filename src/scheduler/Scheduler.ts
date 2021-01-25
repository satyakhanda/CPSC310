import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import Log from "../Util";
import {Dataset} from "../model/Dataset";
import {TooManyRequestsError} from "restify";
import {hasOwnProperty} from "tslint/lib/utils";

export default class Scheduler implements IScheduler {
    private timeSlot: TimeSlot[] = ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100", "MWF 1100-1200", "MWF 1200-1300",
        "MWF 1300-1400", "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700", "TR  0800-0930", "TR  0930-1100",
        "TR  1100-1230", "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];

    private returnTable: Array<[SchedRoom, SchedSection, TimeSlot]> = [];

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        rooms = Scheduler.optimizePath(rooms);
        sections = Scheduler.sortSections(sections);
        let roomsMap: Map<SchedRoom, Map<TimeSlot, SchedSection>> = new Map<SchedRoom, Map<TimeSlot, SchedSection>>();
        // let timeSlotMap: Map<TimeSlot, SchedSection> = new Map<TimeSlot, SchedSection>();
        // for (let time in this.timeSlot) {
        //     timeSlotMap.set(this.timeSlot[time], null);
        // }
        // for (let room in rooms) {
        //     roomsMap.set(rooms[room], timeSlotMap);
        // }
        for (let room in rooms) {
            let timeSlotMap: Map<TimeSlot, SchedSection> = new Map<TimeSlot, SchedSection>();
            for (let time in this.timeSlot) {
                timeSlotMap.set(this.timeSlot[time], null);
            }
            roomsMap.set(rooms[room], timeSlotMap);
        }
        while (sections.length > 0) {
            let curr = sections[0];
            let totalStudents = curr.courses_audit + curr.courses_fail + curr.courses_pass;
            for (let room in rooms) {
                let flag = false;
                let currTimeSlot: TimeSlot = null;
                if (rooms[room].rooms_seats >= totalStudents) {
                    let returnValue = Scheduler.findTimeSlot(roomsMap, rooms[room], curr);
                    flag = returnValue.has(true);
                    if (flag === true) {
                        currTimeSlot = returnValue.get(true);
                    }
                }
                if (flag === true) {
                    this.returnTable.push([rooms[room], sections[0], currTimeSlot]);
                    break;
                }
            }
            sections.shift();
        }
        return this.returnTable;
    }

    private static findTimeSlot(roomsMap: Map<SchedRoom, Map<TimeSlot, SchedSection>>,
                                schedRoom: SchedRoom, curr: SchedSection): Map<boolean, TimeSlot> {
        let timeSlot = roomsMap.get(schedRoom);
        let returnMap: Map<boolean, TimeSlot> = new Map<boolean, TimeSlot>();
        returnMap.set(false, null);
        for (let [k, v] of timeSlot) {
            if (v === null) {
                if (Scheduler.checkTimeSlot(roomsMap, k, curr, schedRoom)) {
                    roomsMap.get(schedRoom).set(k, curr);
                    returnMap.clear();
                    return returnMap.set(true, k);
                }
            }
        }
        return returnMap;
    }

    private static checkTimeSlot(roomsMap: Map<SchedRoom, Map<TimeSlot, SchedSection>>,
                                 time: TimeSlot, curr: SchedSection, schedRoom: SchedRoom): boolean {
        for (let [k, v] of roomsMap) {
            let section = v.get(time);
            if (section !== null) {
                if (curr.courses_dept + curr.courses_id === section.courses_dept + section.courses_id) {
                    return false;
                }
            }
        }
        return true;
    }

    private static optimizePath(rooms: SchedRoom[]): SchedRoom[] {
        let greedyPath: SchedRoom[] = [];
        let map: Map<number, SchedRoom> = new Map<number, SchedRoom>();
        let distance = [];

        // find centroid
        let x = 0;
        let y = 0;
        for (let room in rooms) {
            x += rooms[room].rooms_lat;
            y += rooms[room].rooms_lon;
        }
        let centerX = x / rooms.length;
        let centerY = y / rooms.length;
        // find euclidean distance
        for (let room in rooms) {
            let eDistance = Math.pow(Math.pow(rooms[room].rooms_lat - centerX, 2)
                + Math.pow(rooms[room].rooms_lon - centerY, 2), 1 / 2);
            map.set(eDistance, rooms[room]);
            distance.push(eDistance);
        }
        let startingNode = map.get(Math.min.apply(null, distance));
        return greedyPath = this.getGreedyPath(startingNode, rooms);
    }

    private static getGreedyPath(startingNode: SchedRoom, rooms: SchedRoom[]): SchedRoom[] {
        let tempArray = rooms;
        let startingIndex = tempArray.indexOf(startingNode);
        if (startingIndex > -1) {
            tempArray.splice(startingIndex, 1);
        }
        let greedyPath: SchedRoom[] = [];
        greedyPath.push(startingNode);
        while (tempArray.length > 0) {
            let curr = greedyPath[greedyPath.length - 1];
            let minDist = Number.MAX_VALUE;
            let nextNode = tempArray[0];
            for (let i in tempArray) {
                let currDist = Scheduler.calculateDist(curr, tempArray[i]);
                if (currDist < minDist) {
                    minDist = currDist;
                    nextNode = tempArray[i];
                }
            }
            greedyPath.push(nextNode);
            let index = tempArray.indexOf(nextNode);
            if (index > -1) {
                tempArray.splice(index, 1);
            }
        }
        return greedyPath;
    }

    public static calculateDist(room1: SchedRoom, room2: SchedRoom): number {
        let R = 6371e3;
        let room1Lat = room1.rooms_lat;
        let room2Lat = room2.rooms_lat;
        let room1Lon = room1.rooms_lon;
        let room2Lon = room2.rooms_lon;

        let latDistance = this.toRadian(room1Lat - room2Lat);
        let lonDistance = this.toRadian(room1Lon - room2Lon);

        let a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
            Math.cos(Scheduler.toRadian(room1Lat)) * Math.cos(this.toRadian(room2Lat)) *
            Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private static toRadian(deg: number): number {
        return deg * (Math.PI / 180);
    }


    private static sortSections(sections: SchedSection[]): SchedSection[] {
        return sections.sort((n1, n2) => {
            let n1Total = n1.courses_audit + n1.courses_pass + n1.courses_fail;
            let n2Total = n2.courses_audit + n2.courses_pass + n2.courses_fail;
            if (n1Total < n2Total) {
                return 1;
            }
            if (n1Total > n2Total) {
                return -1;
            }
            return 0;
        });
    }
    //
    // public static getSchedSection(sections: any[]): SchedSection[] {
    //     let globalBool0 = sections[0].hasOwnProperty("courses_dept");
    //     let globalBool1 = sections[0].hasOwnProperty("courses_id");
    //     let globalBool2 = sections[0].hasOwnProperty("courses_uuid");
    //     let globalBool3 = sections[0].hasOwnProperty("courses_pass");
    //     let globalBool4 = sections[0].hasOwnProperty("courses_fail");
    //     let globalBool5 = sections[0].hasOwnProperty("courses_audit");
    //     if (globalBool0 === false || globalBool1 === false || globalBool2 === false || globalBool3 === false ||
    //         globalBool4 === false || globalBool5 === false) {
    //         throw new Error("Can't convert to SchedSection");
    //     }
    //     let schedSection = [];
    //     for (let section in sections) {
    //         let data = JSON.parse(section);
    //
    //         for (let num in data.result) {
    //             data.result[num].courses_dept;
    //         }
    //         const curr: SchedSection = {
    //             courses_dept: section,
    //             courses_id: "string",
    //             courses_uuid: "string",
    //             courses_pass: 3,
    //             courses_fail: 3,
    //             courses_audit: 3,
    //         };
    //         return [];
    //     }
    // }
    //
    // public static getSchedRoom(sections: any[]): SchedRoom[] {
    //     return [];
    // }
}
