import {SectionData} from "./SectionData";
import {InsightDataset, InsightDatasetKind} from "../controller/IInsightFacade";
import {RoomData} from "./RoomData";
import {Dataset} from "./Dataset";

export class RoomDataset extends Dataset {
    public id: string;
    public rooms: RoomData[];
    public kind: InsightDatasetKind;
    public insightDataset: InsightDataset;


    constructor(array: RoomData[], id: string, kind: InsightDatasetKind) {
        super();
        this.rooms = array;
        this.id = id;
        this.kind = kind;
        this.insightDataset =
            {id: id, numRows: this.rooms.length, kind: kind} as InsightDataset;
    }
}
