var priceList = {
    rank: ['A', 'B', 'C', 'D', 'E'],
    A: {
        name: "huge cock",
        amount: 7,
        probability: 0.01
    },
    B: {
        name: "big cock",
        amount: 10,
        probability: 0.1
    },
    C: {
        name: "middle cock",
        amount: 20,
        probability: 0.5
    },
    D: {
        name: "little cock",
        amount: 30,
        probability: 0.9
    },
    E: {
        name: "tiny cock",
        amount: 100000,
        probability: 1.0
    }
};

// getTicket(function(isWin, rank, name) {
//     console.log(isWin, name)
// })

module.exports = {
    getTicket: function(callback) {
        var maxNum = priceList.rank.length - 1;
        var minNum = 0;
        var random = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
        var didAppear = [];

        var rank = priceList.rank[random];

        console.log(rank)
        var winProb = 1 / priceList["A"].probability - 1;
        random = Math.floor(Math.random() * (winProb - minNum + 1)) + minNum;
        if (rank === "E") {
            console.log("in E win")
            return callback(true, 'E', priceList[rank].name);
        } else if (priceList[rank].amount > 0) {
            for (var i = 0; i < winProb * priceList[rank].probability; i++) {
                var random2 = Math.floor(Math.random() * (winProb - minNum + 1)) + minNum;
                //console.log(didAppear.indexOf(random2));
                if (didAppear.indexOf(random2) === -1) {
                    didAppear.push(random2);
                } else {
                    i--;
                }
            }
            if (didAppear.indexOf(random) !== -1) {
                priceList[rank].amount--;
                console.log("in " + rank + " win")
                console.log(random)
                console.log(didAppear)
                return callback(true, rank, priceList[rank].name);
            }
        }
        console.log("in " + rank + " lose")
        console.log(random)
        console.log(didAppear)
        return callback(false);
    }
};