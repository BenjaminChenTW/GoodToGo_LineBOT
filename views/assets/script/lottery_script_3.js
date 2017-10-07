document.ontouchmove = function(event) {
    event.preventDefault();
}

function changeView(page) {
    if (page === 1 && couponList.length !== 0) {
        document.getElementById('first_view').style.display = 'none';        
        document.getElementById('second_view').style.display = 'block';
        document.getElementById('third_view').style.display = 'none';

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
        document.getElementById('second_view').style.display = 'none';
        document.getElementById('third_view').style.display = 'none';
        document.getElementById('first_view').style.display = 'block';

        document.getElementById('time').textContent = couponList.length;

        if ($('#time').text() === '0') {
            $('input#start').css('background-color', 'gray');
        }
    }
}

function endView(data) {
    document.getElementById('second_view').style.display = 'none';
    document.getElementById('third_view').style.display = 'block';
    document.getElementById('first_view').style.display = 'none';

    if (data.isWin) {
        document.getElementById('first_part_1').innerHTML = '恭喜您抽中了</br>' + data.prizeName;
        document.getElementById('second_part_1').innerHTML = '獎品兌換券 #' + data.couponId + ' 已傳送至你的LINE</br>請憑兌換券至容器租借攤位兌換，謝謝！：)';
    
        document.getElementById('lose').style.display = 'none';
        document.getElementById('win').style.display = 'block';        
    } else {
        document.getElementById('lose').style.display = 'block';
        document.getElementById('win').style.display = 'none'; 
    }

}