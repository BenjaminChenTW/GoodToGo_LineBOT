var fs = require('fs');
var debug = require('debug')('goodtogo-linebot:lotteryProcess');
debug.log = console.log.bind(console);
var Coupon = require('../models/DB/couponDB.js');

var prizeList;
var userRecord = {};
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
Coupon.find({ 'isWin': true }, { '_id': 0, 'userId': 1, 'picIndex': 1, 'prizeType': 1 }, function(err, list) {
    for (var i = 0; i < list.length; i++) {
        if (!(list[i].userId in userRecord)) {
            userRecord[list[i].userId] = [];
        }
        userRecord[list[i].userId].push({
            prizeType: list[i].prizeType,
            picIndex: list[i].picIndex
        });
    }
    debug("UserRecord init!");
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
    getTicket: function(totalAmount, userId, picIndex, callback) {
        if (prizeList.rank.length === 0) return callback(false, 'Z', 'No Prize');
        var maxNum = prizeList.rank.length - 1;
        var minNum = 0;
        var random = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;

        var rank = prizeList.rank[random];
        var thisAmount = 0;

        if (!(userId in userRecord)) { // 使用者第一次抽獎
            if (prizeList[rank].amount > 0) {
                var winProb = Math.random();
                if (winProb <= prizeList[rank].probability) {
                    prizeList[rank].amount--;
                    if (prizeList[rank].amount === 0) prizeList.rank.splice(prizeList.rank.indexOf(rank), 1);
                    userRecord[userId] = [];
                    userRecord[userId].push({
                        prizeType: rank,
                        picIndex: picIndex
                    });
                    return callback(true, rank, prizeList[rank].name);
                }
            }
            return callback(false, rank, prizeList[rank].name);
        } else { // 使用者抽獎紀錄已被記錄到變數
            list = userRecord[userId];
            for (var i = 0; i < list.length; i++) {
                if (list[i].picIndex === picIndex)
                    thisAmount++;
                if (list[i].prizeType === rank)
                    return callback(false, rank, prizeList[rank].name);
            }
            if (prizeList[rank].amount > 0 && thisAmount < (totalAmount / 2)) {
                var winProb = Math.random();
                if (winProb <= prizeList[rank].probability) {
                    prizeList[rank].amount--;
                    if (prizeList[rank].amount === 0) prizeList.rank.splice(prizeList.rank.indexOf(rank), 1);
                    userRecord[userId].push({
                        prizeType: rank,
                        picIndex: picIndex
                    });
                    return callback(true, rank, prizeList[rank].name);
                }
            }
            return callback(false, rank, prizeList[rank].name);
        }
    },
    saveFile: function() {
        saveFile(prizeList);
    }
};