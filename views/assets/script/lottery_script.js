document.ontouchmove = function(event){
    event.preventDefault();
}

function changeView(){
    $('div').remove();
    $('body').html('<img id="background" src="assets/icon/background.png" alt="cannot find image">' + '<img id="text" src="assets/icon/drawing.png" alt="cannot find image">');
    $('#background').css({
        'position': 'absolute',
        'top': '35%',
        'width': '40%',
        'height': 'auto', 
        'max-width' : '500px',
        'max-height' : 'auto',
        'animation': 'spin 0.5s linear infinite',
        'animation-iteration-count': '8'
    });
    $('#text').css({
        'position': 'absolute',
        'top': '46%',
        'left': '40%',
        'width': '20%',
        'height': 'auto',
        'max-width' : 'calc(20 / 48 * 100%)',
        'max-height' : 'auto'
    });

    setTimeout(function(){
        $('#background').remove();
        $('#text').remove(); 
        $('body').html(
            '<div class="content">'+
            '<p id="first_part">中獎了</p>'+
            '<p id="second_part">恭喜您抽中了<br />由 臺中市政府 提供的<br />臺中GO悠遊卡(內有100元) 1張</p>'+
            '<img id="gift" src="assets/icon/gift.png" alt="cannot load image">' +
            '<input type="button" id="start" value="傳送兌換卷至LINE" onclick="changeView()">'+
            '</div>'
        )  
        $('.content').css({
            'margin-top': '10%'
        })
        $('#first_part').css({
            'font-size': '120px',
            'margin-bottom': '0'
        })
        $('#second_part').css({
            'margin-top': '5%',
            'font-size': '40px',
            'width': '100%'
        })
        $('#gift').css({
            'margin-top': '5%',
            'display': 'inline',
            'text-align': 'center',
            'white-space' : 'pre-wrap',
            'width':'40%',
            'height': 'auto'
        })
    },4000)
}





