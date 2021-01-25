import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import Log from "../src/Util";
import * as fs from "fs-extra";

describe("Facade D3", function () {

    const SERVER_URL = "http://localhost:4321";

    let facade: InsightFacade = null;
    let server: Server = null;
    chai.use(chaiHttp);

    const datasetsToLoad: { [id: string]: string } = {
        mycourses: "./test/data/courses.zip",
        myrooms: "./test/data/rooms.zip"
    };

    let datasets: { [id: string]: Buffer } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        facade = new InsightFacade();
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]);
        }
        server = new Server(4321);
        try {
            server.start();
        } catch (err) {
            Log.trace("Error starting server");
        }
        // TODO: start server here once and handle errors properly
    });

    after(function () {
        // TODO: stop server here once!
        server.stop();
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        // TODO: remove when testing cache
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    // TODO: assert the codes as well
    it("PUT test for courses dataset", function () {
        const id = "mycourses";
        const kind = "courses";
        return chai.request(SERVER_URL)
            .put("/dataset/" + id + "/" + kind)
            .send(datasets[id])
            .set("Content-Type", "application/x-zip-compressed")
            .then(function (res: Response) {
                Log.trace("Success, here is the response: " + res.body.result);
                expect(res.body.result).to.deep.equals([id]);
                expect(res.status).to.deep.equals(200);
            }).catch(function (err) {
                Log.trace("entered failure zone: " + err);
                expect.fail("FAILED");
            });
    });

    it("PUT for courses dataset invalid", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/courses")
                .send(null)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(err);
            expect.fail();
        }
    });

    it("PUT for courses invalid name", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/_loved_courses/courses")
                .send(datasets["mycourses"])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(err);
            expect.fail();
        }
    });
    it("PUT for same id twice", function () {
        const id = "mycourses";
        const kind = "courses";
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/mycourses/courses")
                .send(datasets[id])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("DataSet PUT (course) is NOT successful");
                    expect.fail();
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(err);
            expect.fail();
        }
    });
    it("PUT test for rooms dataset", function () {
        server.stop();
        server.start();
        const id = "myrooms";
        const kind = "rooms";
        return chai.request(SERVER_URL)
            .put("/dataset/" + id + "/" + kind)
            .send(datasets[id])
            .set("Content-Type", "application/x-zip-compressed")
            .then(function (res: Response) {
                Log.trace("Success, here is the response: " + res.body.result);
                expect(res.body.result).to.deep.equals([id]);
                expect(res.status).to.deep.equals(200);
            }).catch(function (err) {
                Log.trace("entered failure zone: " + err);
                expect.fail("FAILED");
            });
    });
    it("DELETE test that should succeed", function () {
        const id = "mycourses1";
        const kind = "courses";
        return chai.request(SERVER_URL)
            .put("/dataset/" + id + "/" + kind)
            .send(datasets["mycourses"])
            .set("Content-Type", "application/x-zip-compressed")
            .then(function (res: Response) {
                return chai.request(SERVER_URL).del("/dataset/" + id);
            }).then((res) => {
                expect(res.body.result).to.deep.equals(id);
                expect(res.status).to.deep.equals(200);
            }).catch(function (err) {
                Log.trace("entered failure zone: " + err);
                expect.fail("FAILED");
            });
    });

    it("GET datasets test", function () {
        return chai.request(SERVER_URL)
            .get("/datasets")
            .then(function (res: Response) {
                Log.trace(res);
                expect(res.status).to.deep.equals(200);
            }).catch(function (err) {
                Log.trace("entered failure zone: " + err);
                expect.fail("FAILED");
            });
    });

    it("POST query datasets test", function () {
        const id = "courses";
        const kind = "courses";
        return chai.request(SERVER_URL)
            .put("/dataset/" + id + "/" + kind)
            .send(datasets["mycourses"])
            .set("Content-Type", "application/x-zip-compressed")
            .then(function (res: Response) {
                Log.trace("Success, here is the response: " + res.body.result);
                return chai.request(SERVER_URL)
                    .post("/query")
                    .set("Content-Type", "application/json")
                    .send("{\"WHERE\": {\"GT\": { \"courses_avg\": 97 } },\"OPTIONS\": " +
                        "{\"COLUMNS\": [\"courses_dept\",\"courses_avg\"],\"ORDER\": \"courses_avg\"}}");
            }).then((res) => {
                Log.trace(res);
            }).catch(function (err) {
                Log.trace("entered failure zone: " + err);
                expect.fail("FAILED");
            });
    });

    it("POST query datasets test 2", function () {
        const id = "courses2";
        const kind = "courses";
        return chai.request(SERVER_URL)
            .put("/dataset/" + id + "/" + kind)
            .send(datasets["mycourses"])
            .set("Content-Type", "application/x-zip-compressed")
            .then(function (res: Response) {
                return server.stop();
            }).then((res) => {
                return server.start();
            }).then(() => {
                return chai.request(SERVER_URL)
                    .post("/query")
                    .set("Content-Type", "application/json")
                    .send("{\"WHERE\": {\"GT\": { \"courses2_avg\": 97 } },\"OPTIONS\": " +
                        "{\"COLUMNS\": [\"courses2_dept\",\"courses2_avg\"]," +
                        "\"ORDER\": \"courses2_avg\"}}").then((res) => {
                        Log.trace(res.body.result);
                    });
            }).catch(function (err) {
                Log.trace("entered failure zone: " + err);
                expect.fail("FAILED");
            });
    });

    it("POST room query", function () {
        let tesQuery: any = {
            WHERE: {},
            OPTIONS: {
                COLUMNS: [
                    "rooms_name"
                ]
            }
        };
        const id = "rooms";
        const kind = "rooms";
        return chai.request(SERVER_URL)
            .put("/dataset/" + id + "/" + kind)
            .send(datasets["myrooms"])
            .set("Content-Type", "application/x-zip-compressed")
            .then(function (res: Response) {
                Log.trace("Success, here is the response: " + res.body.result);
                return chai.request(SERVER_URL)
                    .post("/query")
                    .send(tesQuery);
            }).then((res) => {
                Log.trace(res);
            }).catch(function (err) {
                Log.trace("entered failure zone: " + err);
                expect.fail("FAILED");
            });
    });
    it("Invalid POST reqest", function () {
        let testQuery: any = {
            WHERE: {},
            OPTIONS: {
                COLUMNS: [
                    "courses_title",
                    "overallAvg"
                ]
            },
            TRANSFORMATIONS: {
                GROUP: [
                    "courses_title"
                ],
                APPLY: [
                    {
                        overallAvg: {
                            AVG: "courses_avg"
                        },
                        overallAvg1: {
                            AVG: "courses_avg"
                        }
                    }
                ]
            }
        };
        try {
            return chai.request("http://localhost:4321")
                .post("/query")
                .send(testQuery)
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    expect(err.status).to.deep.equal(400);
                });
        } catch (err) {
            Log.trace(err);
        }
    });

    it("POST testing response", function () {
        let testQuery1: any = {
            WHERE: {
                EQ: {
                    courses2_avg: 97
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses2_dept",
                    "courses2_avg"
                ],
                ORDER: "courses2_avg"
            }
        };
        try {
            return chai.request("http://localhost:4321")
                .post("/query")
                .send(testQuery1)
                .then(function (res: Response) {
                    Log.trace("in here b");
                    expect(res.body).to.deep.equal({
                        result: [{courses2_dept: "psyc", courses2_avg: 97},
                            {courses2_dept: "epse", courses2_avg: 97}, {courses2_dept: "crwr", courses2_avg: 97}]
                    });
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect.fail(err);
                });
        } catch (err) {
            Log.trace(err);
            expect.fail();
        }
    });
    // Sample on how to format PUT requests
    /*
    it("PUT test for courses dataset", function () {
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    expect(res.status).to.be.equal(204);
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });
    */

    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
