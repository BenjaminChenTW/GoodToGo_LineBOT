var socket = io.connect(window.location.origin);

socket.on('init', function(obj) {
    console.log('has unchecked img: ' + obj.img);
    console.log('has unread message: ' + obj.chatroom);
    if (obj.img) {
        if (document.getElementsByClassName('active')[0].firstChild.textContent != '審核') {
            document.getElementById('checkimg').style.display = 'block';
        }
    }
    if (obj.chatroom) {
        if (document.getElementsByClassName('active')[0].firstChild.textContent != '對話') {
            document.getElementById('chatroom').style.display = 'block';
        }
    }
});

/*
 ** from origin /checkimg
 */
socket.on('add', function(index) {
    console.log('add: ' + index);

    if (document.getElementsByClassName('active')[0].firstChild.textContent != '審核') {
        document.getElementById('checkimg').style.display = 'block';
        return;
    }

    if (index <= end_index) {
        return;
    }

    $.ajax({
        url: '/img/' + index,
        type: 'GET',
        dataType: 'JSON',
        success: function(data) {
            let list = data.list;
            console.log("index " + index + " end_index " + end_index)
            for (var i = 0; i < list.length; i++) {
                if (pic_data.length == 0) break;
                if (end_index != pic_data[pic_data.length - 1].indexId) break;
                var imgstr = "/getImg/" + list[i].indexId;
                create_pic('back', data.list[i].indexId, imgstr, list[i].userName, list[i].uploadTime, list[i].ignoreButton);
                end_index = data.list[i].indexId;
            }

            if (pic_data.length == 0) {
                var imgstr = "/getImg/" + list[0].indexId;
                create_pic('back', list[0].indexId, imgstr, list[0].userName, list[0].uploadTime, list[0].ignoreButton);
                end_index = data.list[0].indexId;
            }

            pic_data = pic_data.concat(list);
        }
    });
});

socket.on('pop', function(object) {
    var index = object.index;
    var remain = object.remain;
    console.log('pop: ' + index + ' remain: ' + remain);
    if (remain == false) {
        document.getElementById('checkimg').style.display = 'none';
    }
    
    if (document.getElementsByClassName('active')[0].firstChild.textContent != '審核') {
        if (remain != false)
            document.getElementById('checkimg').style.display = 'block';
        return;
    }

    var pics = document.getElementsByClassName('container')
    var gallery = document.getElementById('picture_view');

    for (var i = 0; i < pics.length; i++) {
        if (pics[i].firstChild.firstChild.getAttribute('indexId') == index) {
            gallery.removeChild(pics[i]);
            break;
        }
    }

    for (var i = 0; i < pic_data.length; i++) {
        if (pic_data[i].indexId == index) {
            pic_data.splice(i, 1);
            break;
        }
    }

    if ($('.container').length == 0) {
        $('.default_text')[0].innerHTML = '已經審核完全部照片了噢～';
    } else {
        $('.default_text')[0].innerHTML = '請點選照片以審核';
    }
});

/*
 ** from origin /chatroom
 */

socket.on('server', function(obj) {
    if (document.getElementsByClassName('active')[0].firstChild.textContent != '對話') {
        document.getElementById('chatroom').style.display = 'block';
        return;
    }

    if (typeof obj.statusCode !== 'undefined') {
        switch (obj.statusCode) {
            case 0:
                console.log('chatroom: ' + obj.statusCode);

                let time = custom_date(new Date(), true);

                var msg = document.getElementsByClassName(wait_for_check[0])[0].textContent;
                wait_for_check.shift();

                for (var i = 0; i < document.getElementById('customers_list').childNodes.length; i++) {
                    if (document.getElementById('customers_list').childNodes[i].nodeType === 3) {
                        continue;
                    }
                    if (document.getElementById('customers_list').childNodes[i].getAttribute('customerId') == selected_customer.getAttribute('customerId')) {
                        document.getElementById('customers_list').childNodes[i].firstChild.childNodes[2].childNodes[1].textContent = msg;
                        document.getElementById('customers_list').childNodes[i].firstChild.childNodes[3].textContent = time;

                        document.getElementById('customers_list').childNodes[i].firstChild.childNodes[2].removeAttribute('status');
                        document.getElementById('customers_list').childNodes[i].firstChild.childNodes[2].childNodes[1].removeAttribute('status');
                        document.getElementById('customers_list').childNodes[i].firstChild.childNodes[3].removeAttribute('status');

                        document.getElementById('customers_list').insertBefore(document.getElementById('customers_list').childNodes[i], document.getElementById('customers_list').firstChild);
                        break;
                    }
                }

                for (var i = 0; i < extraRoomList.length; i++) {
                    if (extraRoomList[i].userId == selected_customer.getAttribute('customerId')) {
                        extraRoomList[i].text = msg;
                        extraRoomList[i].hasRead = true;
                        extraRoomList[i].time = (new Date()).getTime();

                        var node = extraRoomList[i];
                        extraRoomList.splice(i, 1);
                        extraRoomList.splice(0, 0, node);

                        break;
                    }
                }
                break;
            case 1:
                console.log('chatroom: ' + obj.statusCode);
                document.getElementsByClassName(wait_for_check[0])[0].style.opacity = '0.5';
                wait_for_check.shift();
                create_message('system', '參數錯誤: ' + obj.msg);
                break;
            case 2:
                console.log('chatroom: ' + obj.statusCode);
                document.getElementsByClassName(wait_for_check[0])[0].style.opacity = '0.5';
                wait_for_check.shift();
                create_message('system', '資料庫錯誤: ' + obj.msg);
                break;
            case 3:
                console.log('chatrom: ' + obj.statusCode);
                document.getElementsByClassName(wait_for_check[0])[0].style.opacity = '0.5';
                wait_for_check.shift();
                create_message('system', obj.msg);

                break;
            default:
                console.log('Default: ' + obj.statusCode);
                break;
        }
    }
    console.log('msg: ' + obj.msg);
});
socket.on('user', function(obj) {
    if (document.getElementsByClassName('active')[0].firstChild.textContent != '對話') {
        document.getElementById('chatroom').style.display = 'block';
        return;
    }

    let time = custom_date(new Date(), true);

    var img = document.createElement('img');
    img.src = obj.imgUrl;

    var type = obj.type;
    var msg = obj.msg;

    var isUpdated = false;

    if (selected_customer) {
        if (selected_customer.getAttribute('customerId') == obj.user) {
            isUpdated = true;
            if (type === 'system')
                img.setAttribute('onclick', "zoomIn(this);");
            create_message(type, msg, img);
        }
    }

    for (var i = 0; i < document.getElementById('customers_list').childNodes.length; i++) {
        if (document.getElementById('customers_list').childNodes[i].nodeType === 3) {
            continue;
        }
        if (document.getElementById('customers_list').childNodes[i].getAttribute('customerId') == obj.user) {
            isUpdated = true;

            document.getElementById('customers_list').childNodes[i].firstChild.childNodes[2].childNodes[1].textContent = obj.msg;
            document.getElementById('customers_list').childNodes[i].firstChild.childNodes[3].textContent = time;

            if (type == 'customer') {
                document.getElementById('customers_list').childNodes[i].firstChild.childNodes[2].setAttribute('status', 'unread');
                document.getElementById('customers_list').childNodes[i].firstChild.childNodes[2].childNodes[1].setAttribute('status', 'unread');
                document.getElementById('customers_list').childNodes[i].firstChild.childNodes[3].setAttribute('status', 'unread');
            }

            document.getElementById('customers_list').insertBefore(document.getElementById('customers_list').childNodes[i], document.getElementById('customers_list').firstChild);

            break;
        }
    }

    for (var i = 0; i < extraRoomList.length; i++) {
        if (extraRoomList[i].userId == obj.user) {
            isUpdated = true;
            extraRoomList[i].text = msg;
            extraRoomList[i].hasRead = false;
            extraRoomList[i].time = (new Date()).getTime();

            var node = extraRoomList[i];
            extraRoomList.splice(i, 1);
            extraRoomList.splice(0, 0, node);

            break;
        }
    }

    if (!isUpdated) {
        create_customer_list(obj.name, obj.imgUrl, obj.user, obj.msg, custom_date(new Date(), true), 'unread');
    }

    console.log('user: ' + obj.user)
    console.log('name: ' + obj.name)
    console.log('imgUrl: ' + obj.imgUrl)
    console.log('type: ' + obj.type)
    console.log('msg: ' + obj.msg)
});