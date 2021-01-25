import {Data} from "./Data";


export class RoomData extends Data {
    public roomFullname: string;
    public roomShortName: string;
    public roomNumber: string;
    public roomName: string;
    public roomAddress: string;
    public roomLat: number;
    public roomLan: number;
    public roomSeats: number;
    public roomFurniture: string;
    public roomHref: string;
    public roomType: string;

    public get(keyid: string) {
        if (keyid === "fullname") {
            return this.roomFullname;
        } else if (keyid === "shortname") {
            return this.roomShortName;
        } else if (keyid === "number") {
            return this.roomNumber;
        } else if (keyid === "name") {
            return this.roomName;
        } else if (keyid === "address") {
            return this.roomAddress;
        } else if (keyid === "lat") {
            return this.roomLat;
        } else if (keyid === "lon") {
            return this.roomLan;
        } else if (keyid === "seats") {
            return this.roomSeats;
        } else if (keyid === "type") {
            return this.roomType;
        } else if (keyid === "furniture") {
            return this.roomFurniture;
        } else if (keyid === "href") {
            return this.roomHref;
        }
    }

    // constructor() {
    //
    // }
}
