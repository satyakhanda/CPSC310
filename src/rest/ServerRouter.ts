import restify = require("restify");
import InsightFacade from "../controller/InsightFacade";
import Log, {isNullOrUndefined} from "../Util";
import {InsightDatasetKind, InsightError, NotFoundError} from "../controller/IInsightFacade";

export class ServerRouter {

    private insightFacade: InsightFacade = new InsightFacade();

    constructor() {
        this.insightFacade = new InsightFacade();
    }

    public putDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        if (isNullOrUndefined(this.insightFacade)) {
            this.insightFacade = new InsightFacade();
        }
        let id = req.params.id;
        let kind = req.params.kind;
        if (isNullOrUndefined(req.body) || req.body === "") {
            res.json(400, {error: "Invalid File"});
        }
        let base64Data = req.body.toString("base64");
        Log.trace("adding dataset");
        this.insightFacade.addDataset(id, base64Data, kind).then((res1: string[]) => {
            res.json(200, {result: res1});
        }).catch((err1: any) => {
            res.json(400, {error: "Error"});
        });
        return next();
    }

    public deleteDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        if (isNullOrUndefined(this.insightFacade)) {
            this.insightFacade = new InsightFacade();
        }

        let id = req.params.id;
        try {
            return this.insightFacade.removeDataset(id).then((response) => {
                res.json(200, {result: response});
            }).catch((err: any) => {
                if (err instanceof InsightError) {
                    res.json(400, {error: "Error"});
                } else if (err instanceof NotFoundError) {
                    res.json(404, {error: "Error"});
                }
            });
        } catch (err) {
            res.json(400, {error: "Error"});
        }
        return next();
    }

    public postQuery(req: restify.Request, res: restify.Response, next: restify.Next) {
        let query: any = req.params;
        if (isNullOrUndefined(this.insightFacade)) {
            this.insightFacade = new InsightFacade();
        }
        this.insightFacade.performQuery(query).then((result1) => {
            Log.trace("result: " + result1);
            res.json(200, {result: result1});
        }).catch((err: any) => {
            Log.trace("server error:" + err.stack);
            res.json(400, {error: String(err)});
        });
        Log.trace("Exiting");
        return next();
    }

    public getDatasetsQuery(req: restify.Request, res: restify.Response, next: restify.Next) {
        if (isNullOrUndefined(this.insightFacade)) {
            this.insightFacade = new InsightFacade();
        }
        return this.insightFacade.listDatasets().then((result1) => {
            res.json(200, {result: result1});
        });
        return next();
    }

}
