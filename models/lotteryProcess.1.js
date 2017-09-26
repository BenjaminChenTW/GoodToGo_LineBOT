var fs = require('fs');
var priceList;
fs.readFile("./config/price.json", 'utf8', function(err, data) {
    if (err) throw err;
    priceList = JSON.parse(data);
});

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
        return callback(false, rank, priceList[rank].name);
    }
};