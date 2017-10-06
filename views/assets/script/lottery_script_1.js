document.ontouchmove = function(event) {
    event.preventDefault();
}

function changeView(page) {
    if (page === 1 && couponList.length !== 0) {
        $('div').remove();
        $('body').html('<img id="background" src="/assets/icon/background.png" alt="cannot find image"><img id="text" src="/assets/icon/drawing.png" alt="cannot find image">');
        $('#background').css({
            'position': 'absolute',
            'width': '50%',
            'height': 'auto',
            'max-width': '500px',
            'max-height': 'auto',
            'animation': 'spin 0.5s linear infinite'
        });
        $('#text').css({
            'position': 'absolute',
            'width': '20%',
            'height': 'auto',
            'max-width': 'calc(20 / 48 * 100%)',
            'max-height': 'auto'
        });
        var obj;
        var funcList = [];
        funcList.push(new Promise((resolve, reject) => { setTimeout(resolve, 1500); }));
        funcList.push(new Promise((resolve, reject) => {
            $.ajax({
                url: '/lottery/sendcoupon/' + couponList[couponList.length - 1],
                type: 'GET',
                success: function(data) {
                    obj = data;
                    couponList.pop();
                    resolve();
                }
            });
        }));
        Promise
            .all(funcList)
            .then(() => endView(obj));
    } else if (page === 0) {
        $('div').remove();
        $('body').html('<div class="content">' +
            '<p id="first_part">您目前有抽獎機會</p>' +
            '<div class="top_icons">' +
            '<img id="icon_1" src="/assets/icon/left_top_deco.png" alt "左上角裝飾" width="130" height="130">' +
            '<img id="icon_2" src="/assets/icon/mid_top_deco.png" alt "中間裝飾" width="130" height="130">' +
            '<img id="icon_3" src="/assets/icon/right_top_deco.png" alt "右上角裝飾" width="130" height="130">' +
            '</div>' +
            '<div id="container"><span id="time">' + couponList.length + '</span><br/><br/><span id="timeText">次</span></div>' +
            '<div class="bottom_icons">' +
            '<img id="icon_4" src="/assets/icon/left_bottom_deco.png" alt "左下角裝飾" width="130" height="130">' +
            '<img id="icon_5" src="/assets/icon/mid_bottom_deco.png" alt "中間裝飾" width="130" height="130">' +
            '<img id="icon_6" src="/assets/icon/right_bottom_deco.png" alt "右下角裝飾" width="130" height="130">' +
            '</div>' +
            '<input type="button" id="start" value="開始抽獎" onclick="changeView(1)">' +
            '</div>');
    }
}

function endView(data) {
   var htmlStr;
    htmlStr = (data.isWin) ?
        ('<div class="content">' +
            '<img id="gift" src="/assets/icon/gotPrize.png" alt="cannot load image">' + // 改成圖片
            '<p id="first_part_1">恭喜您抽中了</br>' + data.prizeName + '</p>' +
            '<img id="gift" src="/assets/icon/gift.png" alt="cannot load image" style="height: 40vh;">' +
            '<p id="second_part_1">獎品兌換券 #' + data.couponId + ' 已傳送至你的LINE</br>請憑兌換券至容器租借攤位兌換，謝謝！：)</p>' +
            '<input type="button" id="start" value="確定" onclick="changeView(0)">' +
            '</div>') :
        ('<div class="content">' +
            '<img id="gift" src="/assets/icon/nonPrize.png" alt="cannot load image">' + // 改成圖片
            '<p id="first_part">好可惜！您這次沒有中獎</p>' +
            '<div id="img_container"><img id="lose_icon" src="/assets/icon/noGift.png" alt="cannot load image" style="height: 540px;" /></div>' +
            '<input type="button" id="start" value="確定" onclick="changeView(0)">' +
            '</div>');

    $('#background').remove();
    $('#text').remove();
    $('body').html(htmlStr)
    $('.content').css({
        'margin-top': '10vh'
    })
    $('#first_part').css({
        'font-size': '2.4vh',
        'margin-top': '7vh',
        'width': '100%'
    })
    $('#first_part_1').css({
        'font-size': '2.4vh',
        'margin-top': '2vh',
        'width': '100%'
    })
    $('#second_part').css({
        'margin-bottom': '0',
        'font-size': '20pt',
        'width': '100%'
    })
    $('#second_part_1').css({
        'margin-bottom': '0',
        'font-size': '2.4vh',
        'width': '100%'
    })
    $('#gift').css({
        'margin-top': '0',
        'display': 'inline',
        'text-align': 'center',
        'white-space': 'pre-wrap',
        'width': 'auto',
        'height': '10vh'
    })

    $('#lose_icon').css({
        'height': '50vh'
    })

    $('#start').css({
        'margin-top': '4vh'
    })
}