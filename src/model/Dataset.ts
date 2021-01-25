
import Log from "../Util";
import {InsightDataset, InsightDatasetKind, InsightError} from "../controller/IInsightFacade";
import {Data} from "./Data";


export class Dataset {
    public id: string;
    public kind: InsightDatasetKind;
    public insightDataset: InsightDataset;

}

