var fs = require('fs');
var debug = require('debug')('goodtogo-linebot:lotteryProcess');
debug.log = console.log.bind(console);

var prizeList;
fs.readFile("./config/prize.json", 'utf8', function(err, data) {
    if (err) throw err;
    prizeList = JSON.parse(data);
    prizeList.rank = Object.keys(prizeList);
    for (var i = 0; i < prizeList.rank.length; i++) {
        if (prizeList[prizeList.rank[i]].amount === 0) {
            prizeList.rank.splice(prizeList.rank.indexOf(prizeList.rank[i]), 1);
            i--;
        }
    }
    debug("Prize init!");
});

function saveFile(data) {
    var obj = Object.assign({}, data);
    obj.rank = undefined;
    var str = JSON.stringify(obj);
    fs.writeFile("./config/prize.json", str, 'utf8', function(err) {
        if (err) throw err;
    });
}

module.exports = {
    getTicket: function(callback) {
        if (prizeList.rank.length === 0) return callback(false, 'Z', 'No Prize');
        var maxNum = prizeList.rank.length - 1;
        var minNum = 0;
        var random = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;

        var rank = prizeList.rank[random];

        if (prizeList[rank].amount > 0) {
            var winProb = Math.random();
            if (winProb <= prizeList[rank].probability) {
                prizeList[rank].amount--;
                if (prizeList[rank].amount === 0) prizeList.rank.splice(prizeList.rank.indexOf(rank), 1);
                return callback(true, rank, prizeList[rank].name);
            } else {
                return callback(false, rank, prizeList[rank].name);
            }
        }
        callback(false, rank, prizeList[rank].name)
    },
    saveFile: function() {
        saveFile(prizeList);
    }
};