import {SectionData} from "./SectionData";
import Log from "../Util";
import {InsightDataset, InsightDatasetKind, InsightError} from "../controller/IInsightFacade";
import {Dataset} from "./Dataset";


export class CoursesDataset extends Dataset {

    public id: string;
    public sections: SectionData[];
    public kind: InsightDatasetKind;
    public insightDataset: InsightDataset;

    constructor(array: string[], id: string, kind: InsightDatasetKind) {
        super();
        this.id = "";
        this.sections = [];
        this.id = id;
        this.kind = kind;
        this.insightDataset =
            {id: id, numRows: this.sections.length, kind: kind} as InsightDataset;
        this.parse(array);
    }

    public parse(array: string[]) {
        for (let item of array) {
            let parseData: JSON;
            try {
                parseData = JSON.parse(item);
                this.parseCourses(parseData);
            } catch (e) {
                continue;
            }
        }
    }

    public parseCourses(data: any) {
        for (let num in data.result) {
            let coursesDept = data.result[num].Subject;
            let coursesId = data.result[num].Course;
            let coursesAvg = data.result[num].Avg;
            let coursesInstructor = data.result[num].Professor;
            let coursesTitle = data.result[num].Title;
            let coursesPass = data.result[num].Pass;
            let coursesFail = data.result[num].Fail;
            let coursesAudit = data.result[num].Audit;
            let coursesUuid = data.result[num].id;
            let coursesYear = data.result[num].Year;
            let coursesSection = data.result[num].Section;

            if (coursesSection.toUpperCase() === "OVERALL") {
                coursesYear = "1900";
            }

            if (!(data.result[num].hasOwnProperty("Subject")) || !(data.result[num].hasOwnProperty("Course")) ||
                !(data.result[num].hasOwnProperty("Avg")) || !(data.result[num].hasOwnProperty("Professor")) ||
                !(data.result[num].hasOwnProperty("Title")) || !(data.result[num].hasOwnProperty("Pass")) ||
                !(data.result[num].hasOwnProperty("Fail")) || !(data.result[num].hasOwnProperty("Audit")) ||
                !(data.result[num].hasOwnProperty("id")) || !(data.result[num].hasOwnProperty("Year"))) {
                continue;
            }

            let section = new SectionData(coursesDept, coursesId, coursesAvg, coursesInstructor, coursesTitle,
                coursesPass, coursesFail, coursesAudit, coursesUuid, coursesYear);
            this.sections.push(section);
        }
        this.insightDataset.numRows = this.sections.length;
    }
}

