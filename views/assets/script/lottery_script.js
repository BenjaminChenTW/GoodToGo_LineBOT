document.ontouchmove = function(event) {
    event.preventDefault();
}

function changeView(page) {
    if (page === 1 && couponList.length !== 0) {
        $('div').remove();
        $('body').html('<img id="background" src="/assets/icon/background.png" alt="cannot find image">' + '<img id="text" src="/assets/icon/drawing.png" alt="cannot find image">');
        $('#background').css({
            'position': 'absolute',
            'top': '35%',
            'width': '40%',
            'height': 'auto',
            'max-width': '500px',
            'max-height': 'auto',
            'animation': 'spin 0.5s linear infinite',
            'animation-iteration-count': '8'
        });
        $('#text').css({
            'position': 'absolute',
            'top': '46%',
            'left': '40%',
            'width': '20%',
            'height': 'auto',
            'max-width': 'calc(20 / 48 * 100%)',
            'max-height': 'auto'
        });
        console.log(couponList[couponList.length - 1])
        $.ajax({
            url: '/lottery/sendcoupon/' + couponList[couponList.length - 1],
            type: 'GET',
            success: function(data) {
                endView(data);
                console.log(data)
                couponList.pop();
            }
        });
    } else if (page === 0) {
        $('div').remove();
        $('body').html('<div class="content">' +
            '<p id="first_part">您目前有抽獎機會</p>' +
            '<div class="top_icons">' +
            '<img id="icon_1" src="/assets/icon/left_top_deco.png" alt "左上角裝飾" width="130" height="130">' +
            '<img id="icon_2" src="/assets/icon/mid_top_deco.png" alt "中間裝飾" width="130" height="130">' +
            '<img id="icon_3" src="/assets/icon/right_top_deco.png" alt "右上角裝飾" width="130" height="130">' +
            '</div>' +
            '<p id="second_part"><span id="time">' + couponList.length + '</span><br/>次</p>' +
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
            '<p id="first_part">中獎了</p>' + // 改成圖片
            '<p id="first_part">恭喜您抽中了</br>' + data.prizeName + '</p>' +
            '<img id="gift" src="/assets/icon/gift.png" alt="cannot load image">' +
            '<p id="second_part">獎品兌換券 #' + data.couponId + ' 已傳送至你的LINE</br>請憑兌換券至容器租借攤位兌換，謝謝！：)</p>' +
            '<input type="button" id="start" value="確定" onclick="changeView(0)">' +
            '</div>') :
        ('<div class="content">' +
            '<p id="first_part">沒中獎</p>' + // 改成圖片
            '<p id="first_part">好可惜！您這次沒有中獎</p>' +
            '<img id="gift" src="/assets/icon/gift.png" alt="cannot load image">' +
            '<input type="button" id="start" value="確定" onclick="changeView(0)">' +
            '</div>');

    $('#background').remove();
    $('#text').remove();
    $('body').html(htmlStr)
    $('.content').css({
        'margin-top': '10%'
    })
    $('#first_part').css({
        'font-size': '40pt',
        'margin-top': '5%',
        'width': '100%'
    })
    $('#second_part').css({
        'margin-top': '5%',
        'font-size': '20px',
        'width': '100%'
    })
    $('#gift').css({
        'margin-top': '5%',
        'display': 'inline',
        'text-align': 'center',
        'white-space': 'pre-wrap',
        'width': '40%',
        'height': 'auto'
    })
}