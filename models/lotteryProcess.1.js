var fs = require('fs');
var prizeList;
fs.readFile("./config/prize.json", 'utf8', function(err, data) {
    if (err) throw err;
    prizeList = JSON.parse(data);
});

function saveFile(data) {
    var str = JSON.stringify(data);
    fs.writeFile("./config/prize.json", str, 'utf8', function(err) {
        if (err) throw err;
    });
}
// getTicket(function(isWin, rank, name) {
//     console.log(isWin, name)
// })

module.exports = {
    getTicket: function(callback) {
        var maxNum = prizeList.rank.length - 1;
        var minNum = 0;
        var random = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
        var didAppear = [];

        var rank = prizeList.rank[random];

        // console.log(rank)
        var winProb = 1 / prizeList["A"].probability - 1;
        random = Math.floor(Math.random() * (winProb - minNum + 1)) + minNum;
        if (prizeList[rank].amount > 0) {
            for (var i = 0; i < winProb * prizeList[rank].probability; i++) {
                var random2 = Math.floor(Math.random() * (winProb - minNum + 1)) + minNum;
                //console.log(didAppear.indexOf(random2));
                if (didAppear.indexOf(random2) === -1) {
                    didAppear.push(random2);
                } else {
                    i--;
                }
            }
            if (didAppear.indexOf(random) !== -1) {
                prizeList[rank].amount--;
                // console.log("in " + rank + " win")
                // console.log(random)
                // console.log(didAppear)
                saveFile(prizeList);
                return callback(true, rank, prizeList[rank].name);
            }
        }
        // console.log("in " + rank + " lose")
        // console.log(random)
        // console.log(didAppear)
        return callback(false, rank, prizeList[rank].name);
    }
};