var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
    res.render('coupons');
});

// router.get('/:id', function(req, res, next) {
//     let id = req.params.id;
// });


module.exports = router;