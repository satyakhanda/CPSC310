import {Data} from "./Data";


export class SectionData extends Data {

    private coursesDept: string;
    private coursesId: string;
    private coursesAvg: number;
    private coursesInstructor: string;
    private coursesTitle: string;
    private coursesPass: number;
    private coursesFail: number;
    private coursesAudit: number;
    private coursesUuid: string;
    private coursesYear: string;


    constructor(coursesDept: string, coursesId: string, coursesAvg: number,
                coursesInstructor: string, coursesTitle: string, coursesPass: number,
                coursesFail: number, coursesAudit: number, coursesUuid: string, coursesYear: string) {
        super();
        this.coursesDept = coursesDept;
        this.coursesId = coursesId;
        this.coursesAvg = coursesAvg;
        this.coursesInstructor = coursesInstructor;
        this.coursesTitle = coursesTitle;
        this.coursesPass = coursesPass;
        this.coursesFail = coursesFail;
        this.coursesAudit = coursesAudit;
        this.coursesUuid = coursesUuid;
        this.coursesYear = coursesYear;
    }


    public get(keyid: string) {
        if (keyid === "dept") {
            return this.coursesDept;
        } else if (keyid === "id") {
            return this.coursesId;
        } else if (keyid === "avg") {
            return this.coursesAvg;
        } else if (keyid === "instructor") {
            return this.coursesInstructor;
        } else if (keyid === "title") {
            return this.coursesTitle;
        } else if (keyid === "pass") {
            return this.coursesPass;
        } else if (keyid === "fail") {
            return this.coursesFail;
        } else if (keyid === "audit") {
            return this.coursesAudit;
        } else if (keyid === "uuid") {
            return String(this.coursesUuid);
        } else if (keyid === "year") {
            return Number(this.coursesYear);
        }
    }
}
