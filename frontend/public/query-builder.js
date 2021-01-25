/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function () {
    let query = {};
    // console.log("CampusExplorer.buildQuery not implemented yet.");
    let activePanel = document.getElementsByClassName("tab-panel active");
    let kind = activePanel.item(0).getAttribute("data-type");

    let condsExtract = activePanel.item(0).children[0].children[0];
    let colsExtract = activePanel.item(0).children[0].children[1];
    let orderExtract = activePanel.item(0).children[0].children[2];
    let groupsExtract = activePanel.item(0).children[0].children[3];
    let transformExtract = activePanel.item(0).children[0].children[4];

    // console.log(colsExtract);

    query.WHERE = getWhere(condsExtract, kind);
    query.OPTIONS = getOptions(colsExtract, orderExtract, kind);

    let transformations = getTransform(groupsExtract, transformExtract, kind);
    if (transformations !== "no-transform") {
        query.TRANSFORMATIONS = transformations;
    }

    return query;
};

function getTransform(groupsExtract, transformExtract, kind) {
    let groups = processGroupsExtract(groupsExtract, kind);
    let transform = processTransformExtract(transformExtract, kind);
    if (groups === "no-groups" && transform === "no-transform") {
        return "no-transform";
    }

    let retObject = {
        GROUP: groups,
        APPLY: transform
    }
    return retObject;
}

function processTransformExtract(transformExtract, kind) {

    let transforms = transformExtract.children[1];
    if (transforms.children.length === 0) {
        return "no-transform";
    }
    let applyArray = [];
    // console.log(transforms);
    for (let transform of transforms.children) {
        if (!transform.children[0].children[0].hasAttribute("value")) {
            return "no-transform";
        }
        let name = transform.children[0].children[0].getAttribute("value"); // name
        console.log(name);
        let selectedVal;
        let actualValue;
        for (let trans of transform.children[1].children[0]) {
            if (trans.hasAttribute("selected")) {
                selectedVal = trans.getAttribute("value");
            }
        }

        for (let trans of transform.children[2].children[0]) {
            if (trans.hasAttribute("selected")) {
                if (kind === "courses") {
                    actualValue = "courses_" + trans.getAttribute("value");
                } else {
                    actualValue = "rooms_" + trans.getAttribute("value");
                }
            }
        }
        let newObj = {
            [name]: {
                [selectedVal]: actualValue
            }
        }
        applyArray.push(newObj);
    }

    return applyArray;
}

function processGroupsExtract(groupsExtract, kind) {
    // console.log(groupsExtract.children[1]);
    let groups = [];
    for (let child of groupsExtract.children[1].children) {
        if (child.children[0].hasAttribute("checked")) {
            let pushVal = "";
            if (kind === "courses") {
                pushVal = "courses_" + child.children[0].getAttribute("value");
            } else {
                pushVal = "rooms_" + child.children[0].getAttribute("value");
            }
            groups.push(pushVal);
        }
    }
    console.log(groups);
    if (groups.length === 0) {
        return "no-groups";
    }
    return groups;
}


function getOptions(colsExtract, orderExtract, kind) {
    let cols = colsExtract.children[1].children;
    let retObject = {}
    // console.log(cols);
    let columns = [];
    for (let col of cols) {
        if (col.children[0].checked) {
            let key = col.children[0].getAttribute("data-key");
            if (isANormalKey(key, kind)) {
                if (kind === "courses") {
                    columns.push("courses_" + key);
                } else {
                    columns.push("rooms_" + key);
                }
            } else {
                columns.push(key);
            }
        }
    }

    let order = getOrder(orderExtract, kind);
    if (order === "no-order") {
        return {
            COLUMNS: columns
        }
    }

    retObject = {
        COLUMNS: columns,
        ORDER: order
    };
    return retObject
}

function getOrder(orderExtract, kind) {
    let orderArray = [];
    let ordersSelected = orderExtract.children[1].children[0].children[0];
    for (let order of ordersSelected) {
        if (order.hasAttribute("selected")) {
            let pushString;
            let key = order.getAttribute("value");
            if (isANormalKey(key, kind)) {
                if (kind === "courses") {
                    pushString = "courses_" + key;
                } else if (kind === "rooms") {
                    pushString = "rooms_" + key;
                }
            } else {
                pushString = key;
            }
            orderArray.push(pushString);
        }
    }
    let dir = orderExtract.children[1].children[1].children[0].checked;
    if (orderArray.length === 0) {
        return "no-order";
    } else if (orderArray.length === 1 && dir === false) {
        return orderArray[0];
    }
    let direction = dir ? "DOWN" : "UP";
    let retObject = {
        dir: direction,
        keys: orderArray
    };

    return retObject;

}

function getWhere(conditions, kind) {
    let whereObj = {};
    let condContainer = conditions.children[2];
    let conditionType = conditions.children[1];

    let condition = "";

    if (condContainer.children.length === 0) {
        return whereObj;
    }

    //console.log("test");
    for (let option of conditionType.children) {
        //console.log(option);
        if (option.children[0].hasAttribute("checked")) {
            condition = option.children[0].getAttribute("id").toString().split("-")[2];
        }
    }

    let allParsedConds = [];
    for (let cond of condContainer.children) {
        // iterate through conditions, extracting info
        let parsedCond = parseCond(cond);
        allParsedConds.push(parsedCond);
    }
    console.log(condition);
    console.log(allParsedConds);
    if (allParsedConds.length === 1) {
        whereObj = whereSingle(allParsedConds[0], kind);
        if (condition === "none") {
            let retObject = {
                NOT: whereObj
            };
            return retObject;
        }
    }  else if (condition === "all") {
        whereObj = whereAnd(allParsedConds, kind);
    } else {
        whereObj = whereOr(allParsedConds, kind);
    }
     if (condition === "none") {
        let x = whereOr(allParsedConds, kind);
        let retObject = {
            NOT: x
        };
        return retObject;
    }
    return whereObj;
}


function getSingleObject(cond, kind) {
    let key = cond.operator;
    let value = "";
    let control;
    let not = cond.not;
    control = getControl(cond.value, cond.control);
    if (kind === "courses") {
        value = "courses_" + cond.value;
    } else {
        value = "rooms_" + cond.value;
    }

    console.log("Original object: " + cond.value + " | Other item: " + value);
    let retObj = {
        [key]: {
            [value]: control
        }
    }
    return retObj;
}


function whereSingle(cond, kind) {
    let x = getSingleObject(cond, kind);
    if (cond.not) {
        return {
            NOT: x
        };
    }
    return x;
}

function whereAnd(allConds, kind) {
    let returnObj = {
        AND: []
    };

    for (let cond of allConds) {
        let newObj = getSingleObject(cond, kind);
        if (cond.not) {
            newObj = {
                NOT: newObj
            }
        }
        returnObj.AND.push(newObj);
    }
    console.log(returnObj);
    return returnObj;
}

function whereOr(allConds, kind) {
    let returnObj = {
        OR: []
    };
    for (let cond of allConds) {
        let newObj = getSingleObject(cond, kind);
        if (cond.not) {
            newObj = {
                NOT: newObj
            }
        }

        returnObj.OR.push(newObj);
    }
    return returnObj;
}

function getControl(key, control) {
    let retVal;
    switch (key) {
        case "address":
            retVal = String(control);
            break;
        case "fullname":
            retVal = String(control);
            break;
        case "furniture":
            retVal = String(control);
            break;
        case "link":
            retVal = String(control);
            break;
        case "lat":
            retVal = Number(control);
            break;
        case "lon":
            retVal = Number(control);
            break;
        case "name":
            retVal = String(control);
            break;
        case "number":
            retVal = String(control);
            break;
        case "seats":
            retVal = Number(control);
            break;
        case "shortname":
            retVal = String(control);
            break;
        case "type":
            retVal = String(control);
            break;
        case "audit":
            retVal = Number(control);
            break;
        case "avg":
            retVal = Number(control);
            break;
        case "dept":
            retVal = String(control);
            break;
        case "fail":
            retVal = Number(control);
            break;
        case "id":
            retVal = String(control);
            break;
        case "instructor":
            retVal = String(control);
            break;
        case "pass":
            retVal = Number(control);
            break;
        case "title":
            retVal = String(control);
            break;
        case "uuid":
            retVal = String(control);
            break;
        case "year":
            retVal = Number(control);
            break;
        default:
            retVal = "err";
            break;
    }
    return retVal;
}


function isANormalKey(key, kind) {
    if (kind === "courses") {
        if (key === "dept") {
            return true;
        } else if (key === "id") {
            return true;
        } else if (key === "avg") {
            return true;
        } else if (key === "instructor") {
            return true;
        } else if (key === "title") {
            return true;
        } else if (key === "pass") {
            return true;
        } else if (key === "fail") {
            return true;
        } else if (key === "audit") {
            return true;
        } else if (key === "uuid") {
            return true;
        } else if (key === "year") {
            return true;
        }
    } else {
        if (key === "fullname") {
            return true;
        } else if (key === "shortname") {
            return true;
        } else if (key === "number") {
            return true;
        } else if (key === "name") {
            return true;
        } else if (key === "address") {
            return true;
        } else if (key === "lat") {
            return true;
        } else if (key === "lon") {
            return true;
        } else if (key === "seats") {
            return true;
        } else if (key === "type") {
            return true;
        } else if (key === "furniture") {
            return true;
        } else if (key === "href") {
            return true;
        }
    }
    return false;
}

function parseCond(cond) {
    let ret = {};


    if (cond.children[0].children[0].hasAttribute("checked")) {
        // console.log("NOT is checked");
        ret.not = true;
    } else {
        ret.not = false;
    }
    for (let item of cond.children[1].children[0]) {
        if (item.hasAttribute("selected")) {
            ret.value = item.getAttribute("value");
        }
    }

    for (let item of cond.children[2].children[0]) {
        if (item.hasAttribute("selected")) {
            ret.operator = item.getAttribute("value");
            //console.log(ret.operator);
        }
    }

    if (cond.children[3].children[0].hasAttribute("value")) {
        ret.control = cond.children[3].children[0].getAttribute("value");
    } else {
        ret.value = "error";
    }
    return ret;
}

