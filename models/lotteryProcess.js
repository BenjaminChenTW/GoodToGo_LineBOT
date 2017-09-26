var rank;
var didAppear = [];

var A = {
    name: "huge cock",
    rank: "A",
    amount: 7
};

var B = {
    name: "big cock",
    rank: "B",
    amount: 10
};

var C = {
    name: "middle cock",
    rank: "C",
    amount: 20
};

var D = {
    name: "little cock",
    rank: "D",
    amount: 30
};

var E = {
    name: "tiny cock",
    rank: "E",
    amount: 100000
};

var probability = {
    "A": 0.01,
    "B": 0.1,
    "C": 0.5,
    "D": 0.9,
    "E": 1.0
};

function getTicket(callback) {

    var maxNum = 4;
    var minNum = 0;
    var random = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
    var winProb;
    // var didAppear = new Array;

    if (random === 0) {
        rank = "A";
    } else if (random === 1) {
        rank = "B";
    } else if (random === 2) {
        rank = "C";
    } else if (random === 3) {
        rank = "D";
    } else if (random === 4) {
        rank = "E";
    }

    console.log(rank)
    winProb = 1 / probability["A"] - 1;
    random = Math.floor(Math.random() * (winProb - minNum + 1)) + minNum;
    if (rank === "A") {
        if (A.amount > 0) {
            for (var i = 0; i < 1; i++) {
                var random2 = Math.floor(Math.random() * (winProb - minNum + 1)) + minNum;
                console.log(didAppear.indexOf(random2));
                if (didAppear.indexOf(random2) === -1) {
                    didAppear.push(random2);
                } else {
                    i--;
                }
            }
            if (didAppear.indexOf(random) !== -1) {
                A.amount--;
                console.log("in A win")
                return callback(true, 'A');
            }
        }
        console.log("in A lose")
        console.log(random)
        console.log(random2)
        return callback(false);
    } else if (rank === "B") {
        if (B.amount > 0) {
            for (var i = 0; i < winProb * probability["B"]; i++) {
                var random2 = Math.floor(Math.random() * (winProb - minNum + 1)) + minNum;
                if (didAppear.indexOf(random2) === -1) {
                    didAppear.push(random2);
                } else {
                    i--;
                }
            }
            if (didAppear.indexOf(random) !== -1) {
                B.amount--;
                console.log("in B win")
                return callback(true, 'B');
            }
        }
        console.log("in B lose")
        return callback(false);
    } else if (rank === "C") {
        if (C.amount > 0) {
            for (var i = 0; i < winProb * probability["C"]; i++) {
                var random2 = Math.floor(Math.random() * (winProb - minNum + 1)) + minNum;
                if (didAppear.indexOf(random2) === -1) {
                    didAppear.push(random2);
                } else {
                    i--;
                }
            }
            if (didAppear.indexOf(random) !== -1) {
                C.amount--
                    console.log("in C win")
                return callback(true, 'C');
            }
        }
        console.log("in C lose")
        return callback(false)
    } else if (rank === "D") {
        if (D.amount > 0) {
            for (var i = 0; i < winProb * probability["D"]; i++) {
                var random2 = Math.floor(Math.random() * (winProb - minNum + 1)) + minNum;
                if (didAppear.indexOf(random2) === -1) {
                    didAppear.push(random2);
                } else {
                    i--;
                }
            }
            if (didAppear.indexOf(random) !== -1) {
                D.amount--;
                console.log("in D win")
                return callback(true, 'D');
            }
        }
        console.log("in D lose")
        return callback(false);
    } else if (rank === "E") {
        console.log("in E win")
        return callback(true, 'E');
    }
}

function callback(isWin, type) {
    console.log(isWin)
    console.log(didAppear)
}

getTicket(callback)

module.exports = getTicket;