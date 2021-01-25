import {expect} from "chai";
import * as fs from "fs-extra";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";
import * as assert from "assert";
import {Dataset} from "../src/model/Dataset";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    // this is a comment
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

// smd
describe("InsightFacade Add/Remove/List CoursesDataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        "courses": "./test/data/courses.zip",
        "invalidCourses": "./test/data/invalidCourses.zip",
        "invalid_Name": "./test/data/invalid_Name.zip",
        "coursesNoContent": "./test/data/coursesNoContent.zip",
        "courses2": "./test/data/courses.zip",
        "invalidJson": "./test/data/invalidJson.zip",
        "invalidExtensionAndJson": "./test/data/invalidJson.zip",
        "   ": "./test/data/   .zip",
        "rooms": "./test/data/rooms.zip",
        "rooms2": "./test/data/rooms.zip",
        "roomsEmpty": "./test/data/roomsEmpty.zip",
        "invalidRooms": "./test/data/invalidRooms.zip"
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            if (id === "courses") {
                let x = fs.readFileSync(datasetsToLoad[id]).toString("base64");
                Log.trace(x);
            }
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // This is a unit test. You should create more like this!
    it("Should add a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });


    // This is a unit test. You should create more like this!
    it("Should add a valid rooms basic", function () {
        const id: string = "rooms";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should not add a dataset—underscore", function () {
        const id: string = "courses_";
        const expected = new InsightError("ID has underscore");
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, expected, "Should have been rejected");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
                // assert(err instanceof InsightError, "Promise rejected");
            });
    });


    it("Should not add a dataset—underscore rooms", function () {
        const id: string = "rooms_";
        const expected = new InsightError("ID has underscore");
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms)
            .then((result: string[]) => {
                expect.fail(result, expected, "Should have been rejected");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
                // assert(err instanceof InsightError, "Promise rejected");
            });
    });

    it("Should not add a dataset null content", function () {
        const id: string = "courses";
        const expected = new InsightError("ID has underscore");
        return insightFacade
            .addDataset(id, null, InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, expected, "Should have been rejected");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
                // assert(err instanceof InsightError, "Promise rejected");
            });
    });

    it("Should not add a dataset null content rooms", function () {
        const id: string = "rooms";
        const expected = new InsightError("ID has underscore");
        return insightFacade
            .addDataset(id, null, InsightDatasetKind.Rooms)
            .then((result: string[]) => {
                expect.fail(result, expected, "Should have been rejected");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
                // assert(err instanceof InsightError, "Promise rejected");
            });
    });

    it("Many nulls or undefineds!", function () {
        const expected = new InsightError("undefined");
        return insightFacade
            .addDataset(null, null, InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, expected, "Should have been rejected");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
                // assert(err instanceof InsightError, "Promise rejected");
            });


    });

    it("Many nulls or undefineds! rooms", function () {
        const expected = new InsightError("undefined");
        return insightFacade
            .addDataset(null, null, InsightDatasetKind.Rooms)
            .then((result: string[]) => {
                expect.fail(result, expected, "Should have been rejected");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
                // assert(err instanceof InsightError, "Promise rejected");
            });
    });

    it("should not add a duplicate dataset across instances", function () {
        this.timeout(10000);
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((res: string[]) => {
                expect(res).to.deep.equal(expected);
                return new InsightFacade().addDataset(id, datasets[id], InsightDatasetKind.Courses);
            })
            .then((res: string[]) => {
                Log.trace("RESOLVED SUCCESSFULLY: " + res);
                expect.fail("adding across instances passed unexpectedly: ${res}");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });

    it("load dataset courses", function () {
        this.timeout(10000);
        const id: string = "courses";
        const expected: InsightDataset[] = [];
        const coursesDataset1: InsightDataset =
            {id: "courses", numRows: 64612, kind: InsightDatasetKind.Courses} as InsightDataset;
        expected.push(coursesDataset1);
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((res: string[]) => {
                return insightFacade.loadDataset(id);
            })
            .then((res: Dataset) => {
                assert(res.id === expected[0].id);
                Log.trace("Wow");
                assert(res.kind === expected[0].kind);
                Log.trace("Wow");
            })
            .catch((err: any) => {
                expect.fail();
            });
    });

    it("load dataset rooms", function () {
        this.timeout(10000);
        const id: string = "rooms";
        const expected: InsightDataset[] = [];
        const coursesDataset1: InsightDataset =
            {id: "rooms", numRows: 364, kind: InsightDatasetKind.Rooms} as InsightDataset;
        expected.push(coursesDataset1);
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms)
            .then((res: string[]) => {
                return insightFacade.loadDataset(id);
            })
            .then((res: Dataset) => {
                assert(res.id === expected[0].id);
                Log.trace("Wow");
                assert(res.kind === expected[0].kind);
                Log.trace("Wow");
            })
            .catch((err: any) => {
                expect.fail();
            });
    });

    it("should not add a duplicate dataset across instances rooms", function () {
        this.timeout(10000);
        const id: string = "rooms";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms)
            .then((res: string[]) => {
                expect(res).to.deep.equal(expected);
                return new InsightFacade().addDataset(id, datasets[id], InsightDatasetKind.Rooms);
            })
            .then((res: string[]) => {
                Log.trace("RESOLVED SUCCESSFULLY: " + res);
                expect.fail("adding across instances passed unexpectedly: ${res}");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });

    it("Should not add a dataset-empty courses", function () {
        const id: string = "coursesEmpty";
        const expected: any = new InsightError("Zip file does not contain courses");
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, expected, "Should have been rejected");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
                // assert(err instanceof InsightError, "Promise rejected");
            });
    });

    it("Should not add a dataset-empty rooms", function () {
        const id: string = "roomsEmpty";
        const expected: any = new InsightError("Zip file does not contain courses");
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, expected, "Should have been rejected");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
                // assert(err instanceof InsightError, "Promise rejected");
            });
    });

    it("listDatasets Test- One item Room", function () {
        const id: string = "rooms";
        const expected: InsightDataset[] = [];
        const coursesDataset1: InsightDataset =
            {id: "rooms", numRows: 364, kind: InsightDatasetKind.Rooms} as InsightDataset;
        expected.push(coursesDataset1);

        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms)
            .then((result: string[]) => {
                return insightFacade.listDatasets()
                    .then((resultNew: InsightDataset[]) => {
                        assert(resultNew[0].id === expected[0].id);
                        Log.trace("Wow");
                        assert(resultNew[0].kind === expected[0].kind);
                        Log.trace("Wow");
                        assert(resultNew[0].numRows === expected[0].numRows);
                        Log.trace("Wow");
                        expect(resultNew).to.deep.equal(expected);
                    });
            })
            .catch((err: any) => {
                expect.fail();
            });
    });

    it("Should not remove a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.removeDataset(id).then((result: string) => {
                expect.fail(result, NotFoundError, "Valid data was not yet added");
            }
        ).catch((err: any) => {
            expect(err).instanceOf(NotFoundError, "id was not yet added");
        });
    });

    it("Should not remove a valid dataset rooms", function () {
        const id: string = "rooms";
        const expected: string[] = [id];
        return insightFacade.removeDataset(id).then((result: string) => {
                expect.fail(result, NotFoundError, "Valid data was not yet added");
            }
        ).catch((err: any) => {
            expect(err).instanceOf(NotFoundError, "id was not yet added");
        });
    });

    it("Should remove a valid dataset", function () {
        const id: string = "courses";
        const expected: string = id;

        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal([expected]);
            return insightFacade.removeDataset(id).then((result1: string) => {
                expect(result1).to.deep.equal(id);
            });
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    /*it("Should remove a valid dataset rooms", function () {
        const id: string = "rooms";
        const expected: string = id;

        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect(result).to.deep.equal([expected]);
            return insightFacade.removeDataset(id).then((result1: string) => {
                expect(result1).to.deep.equal(id);
            });
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });
/!*


/!*
    it("listDatasets Test- Two items", function () {
        const id: string = "courses";
        const id2: string = "courses2";
        const expected: InsightDataset[] = [];
        const coursesDataset1: InsightDataset =
            {id: "courses", numRows: 64612, kind: InsightDatasetKind.Courses} as InsightDataset;
        const coursesDataset2: InsightDataset =
            {id: "courses2", numRows: 64612, kind: InsightDatasetKind.Courses} as InsightDataset;
        expected.push(coursesDataset1);
        expected.push(coursesDataset2);

        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses)
                    .then((result2: string[]) => {
                        return insightFacade.listDatasets()
                            .then( (resultNew: InsightDataset[]) => {
                                // assert(resultNew[0].id === expected[0].id);
                                // assert(resultNew[0].kind === expected[0].kind);
                                // assert(resultNew[0].numRows === expected[0].numRows);
                                // assert(resultNew[1].id === expected[1].id);
                                // assert(resultNew[1].kind === expected[1].kind);
                                // assert(resultNew[1].numRows === expected[1].numRows);
                                expect(resultNew[0]).to.deep.equal(expected[0]);
                                expect(resultNew[1]).to.deep.equal(expected[1]);
                            });
                    });
            })
            .catch((err: any) => {
                expect.fail();
            });
    });

*!/
    it("Should reject due to misnamed inside file", function () {
        const id: string = "invalidCourses";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should not have fulfilled");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });

    it("Should reject due to misnamed inside file rooms", function () {
        const id: string = "invalidRooms";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should not have fulfilled");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });

    it("Check two folders", function () {
        const id: string = "twoFolders";

        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should not have fulfilled");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });

    it("Should reject due to whitespace name", function () {
        const id: string = "     ";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should not have fulfilled");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });

    it("Should reject due to whitespace name rooms", function () {
        const id: string = "     ";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should not have fulfilled");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });

    it("Should reject due to no such id name", function () {
        const id: string = "courses3";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should not have fulfilled");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });

    it("Should reject due to no such id name rooms", function () {
        const id: string = "rooms3";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should not have fulfilled");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });

    it("Should reject when attempting to add duplicate dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result1: string[]) => {
            return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);

        }).then((result: string[]) => {
            expect.fail(result, InsightError, "Should not have fulfilled");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject when attempting to add duplicate dataset rooms", function () {
        const id: string = "rooms";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result1: string[]) => {
            return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        }).then((result: string[]) => {
            expect.fail(result, InsightError, "Should not have fulfilled");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject when attempting to add duplicate dataset rooms", function () {
        const id: string = "rooms";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result1: string[]) => {
            return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        }).then((result: string[]) => {
            expect.fail(result, InsightError, "Should not have fulfilled");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject due to no course sections", function () {
        const id: string = "coursesNoContent";
        const expected: string[] = [id];
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should not have fulfilled");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });

    it("Adding two courses successfully", function () {
        const id1: string = "courses";
        const id2: string = "courses2";
        const expected: string[] = [id1, id2];
        return insightFacade.addDataset(
            id1,
            datasets[id1],
            InsightDatasetKind.Courses,
        ).then((result1: string[]) => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);

        }).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Adding two rooms/courses successfully", function () {
        const id1: string = "rooms";
        const id2: string = "courses2";
        const expected: string[] = [id1, id2];
        return insightFacade.addDataset(
            id1,
            datasets[id1],
            InsightDatasetKind.Rooms,
        ).then((result1: string[]) => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        }).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Adding two rooms successfully", function () {
        const id1: string = "rooms";
        const id2: string = "rooms2";
        const expected: string[] = [id1, id2];
        return insightFacade.addDataset(
            id1,
            datasets[id1],
            InsightDatasetKind.Rooms,
        ).then((result1: string[]) => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Rooms);
        }).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Adding two rooms/courses successfully", function () {
        const id1: string = "rooms";
        const id2: string = "courses2";
        const expected: string[] = [id1, id2];
        return insightFacade.addDataset(
            id1,
            datasets[id1],
            InsightDatasetKind.Rooms,
        ).then((result1: string[]) => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        }).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Adding two rooms successfully", function () {
        const id1: string = "rooms";
        const id2: string = "rooms2";
        const expected: string[] = [id1, id2];
        return insightFacade.addDataset(
            id1,
            datasets[id1],
            InsightDatasetKind.Rooms,
        ).then((result1: string[]) => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Rooms);
        }).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Add rooms dataset", function () {
        const id: string = "courses";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms)
            .then((result: string[]) => {
                expect.fail("shouldn't have got here");
            })
            .catch((err: any) => {
                // expect.fail(err, expected, "Should not have rejected");
                expect(err).to.be.instanceOf(InsightError);
            });
    });

    it("Add dataset with invalid json", function () {
        const id: string = "invalidJson";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail("shouldn't have got here");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });

    // it("Add dataset with no valid sections", function () {
    //     const id: string = "shouldBreak";
    //     return insightFacade
    //         .addDataset(id, datasets[id], InsightDatasetKind.Courses)
    //         .then((result: string[]) => {
    //             expect.fail("shouldn't have got here");
    //         })
    //         .catch((err: any) => {
    //             expect(err).to.be.instanceOf(InsightError);
    //         });
    // });


    it("Add dataset with invalid json file", function () {
        const id: string = "invalidExtensionAndJson";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms)
            .then((result: string[]) => {
                expect.fail("shouldn't have got here");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });

    it("Add dataset with bad file extension", function () {
        const id: string = "badFile";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms)
            .then((result: string[]) => {
                expect.fail("shouldn't have got here");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });
    // Tests for removing datasets

    it("Attempt to remove dataset with invalid ID", function () {
        const id: string = "_courses";
        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect.fail(result, InsightError, "Should not have fulfilled");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });

    it("Attempt to remove dataset not added", function () {
        const id: string = "courses";
        insightFacade.datasetCollection.push("courses");
        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect.fail(result, InsightError, "Should not have fulfilled");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(NotFoundError);
            });
    });

    it("Attempt to remove dataset with id not in set", function () {
        const id: string = "courses";
        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect.fail(result, NotFoundError, "Should not have fulfilled");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(NotFoundError);
            });
    });
    it("Remove a dataset successfully", function () {
        const id: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result1: string[]) => {
            return insightFacade.removeDataset(id);
        }).then((result: string) => {
            Log.trace(insightFacade.datasetCollection);
            expect(result).to.deep.equal(id);
        }).catch((err: any) => {
            expect.fail();
        });

        /!*return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect(result, id);
            })
            .catch((err: any) => {
                expect.fail();
            });*!/
    });
    it("Removing two datasets", function () {
        const id: string = "courses";
        const id2: string = "courses2";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result1: string[]) => {
            return insightFacade.addDataset(
                id2,
                datasets[id2],
                InsightDatasetKind.Courses,
            );
        }).then((result2: string[]) => {
            return insightFacade.removeDataset(id);
        }).then((result: string) => {
            expect(result).to.deep.equal(id);
            return insightFacade.removeDataset(id2);
        }).then((result: string) => {
            expect(result).to.deep.equal(id2);
        }).catch((err: any) => {
            expect.fail();
        });
    });

    it("Removing with whitespace ID", function () {
        const id: string = "   ";
        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect.fail();
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });

    it("Removing weird dataset", function () {
        const id: string = "";
        return insightFacade
            .removeDataset(null)
            .then((result: string) => {
                expect.fail();
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });*/
});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: { path: string, kind: InsightDatasetKind } } = {
        courses: {path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
        courses2: {path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
        courses3: {path: "./test/data/courses3.zip", kind: InsightDatasetKind.Courses},
        rooms: {path: "./test/data/rooms.zip", kind: InsightDatasetKind.Rooms}
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * TODO For C1, remove this catch block (but keep the Promise.all)
             */
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries.
// Creates an extra "test" called "Should run test queries" as a byproduct.
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    const resultChecker = TestUtil.getQueryChecker(test, done);
                    insightFacade.performQuery(test.query)
                        .then(resultChecker)
                        .catch(resultChecker);
                });
            }
        });
    });
});
