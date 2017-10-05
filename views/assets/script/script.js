var selected_customer;
var pic_data = [];

var selected_picture;

var end_index = 0;

var reasons = ["不在現場", "非好盒器"];

var customer_message_data;

function reset_button() {
    document.getElementById('check_availible_num_bag').value = '0';
    document.getElementById('check_availible_num_container').value = '0';
    document.getElementById('check_availible_num_tableware').value = '0';
    document.getElementById('reasons').value = '0';
    document.getElementById('reasons_tag').style.display = 'block';
    document.getElementById('other_reasons').value = '';
    document.getElementById('other_reasons').style.display = 'none';
}

function zoomIn(pic) {
    document.getElementById('zoom_in').style.display = 'flex';
    document.getElementById('zoom_in').appendChild(pic.cloneNode(true));
    document.getElementById('zoom_in').getElementsByTagName('img')[0].removeAttribute('onclick');
}

function close_zoom_in() {
    document.getElementById('zoom_in').style.display = 'none';
    document.getElementById('zoom_in').removeChild(document.getElementById('zoom_in').getElementsByTagName('img')[0]);
}

function intReLength(data, length) {
    var str = data.toString();
    if (length - str.length) {
        for (j = 0; j <= length - str.length; j++) {
            str = "0" + str;
        }
    }
    return str;
}

function custom_date(date, shouldBreak) {
    var year = date.getFullYear();
    var month = date.getMonth();
    var d = intReLength(date.getDate(), 2);
    var hour = intReLength(date.getHours(), 2);
    var minute = intReLength(date.getMinutes(), 2);
    var second = intReLength(date.getSeconds(), 2);

    var b = (shouldBreak) ? '\n' : ' ';

    var result = (year + '/' + (month + 1) + '/' + d + b + hour + ':' + minute);

    if (!shouldBreak) {
        result += ':' + second;
    }

    return result;
}

function select_picture(pic) {
    if (pic === selected_picture) {
        return;
    }

    selected_picture = pic;

    var blockers = picture_view.getElementsByClassName('pic');
    reset_button();

    for (var i = 0; i < blockers.length; i += 1) {
        if (blockers[i].getElementsByTagName('img')[0] != pic) {
            blockers[i].style.opacity = "0.3";
        } else {
            blockers[i].style.opacity = "1";

            let main_pic = document.getElementById('main_pic');
            let detail = document.getElementById('detail');

            main_pic.src = pic.src;

            detail.style.display = "block";

            document.getElementById('user_id').textContent = pic.getAttribute('userName') + ' (#' + pic.getAttribute('indexId') + ')';
            let timeInterval = pic.getAttribute('uploadTime');
            let time = new Date(Number(timeInterval));

            document.getElementById('upload_time').textContent = time.toLocaleString()

            if (pic.getAttribute('shouldIgnore') == 'true') {
                document.getElementById('ignore_button').style.display = 'inline-block';
            }

        }
    }
}

function show_success_box(msg = '保存成功') {
    var box = document.createElement('div');
    box.innerHTML = "<div class='icon'><p>&#x2713</p></div><span class='helper'></span>" + msg;
    box.setAttribute('class', 'submit_result');
    box.setAttribute('type', 'success');
    document.getElementsByTagName('body')[0].appendChild(box);
    box.style.opacity = '1';

    setTimeout(function(obj) {
        obj.style.opacity = '0';
        setTimeout(function() { document.getElementsByTagName('body')[0].removeChild(obj); }, 1000)
    }, 2000, box);
}

function show_failed_box(msg = '保存失敗') {
    var box = document.createElement('div');
    box.innerHTML = "<div class='icon'><p>X</p></div><span class='helper'></span>" + msg;
    box.setAttribute('class', 'submit_result');
    box.setAttribute('type', 'failed');
    document.getElementsByTagName('body')[0].appendChild(box);
    box.style.opacity = '1';

    setTimeout(function(obj) {
        obj.style.opacity = '0';
        setTimeout(function() { document.getElementsByTagName('body')[0].removeChild(obj); }, 1000)
    }, 2000, box);
}

function ignore() {
    let id = selected_picture.getAttribute('indexId');

    var selected_container = selected_picture.parentNode.parentNode;
    var next_container = selected_container.nextSibling;

    $.ajax({
        url: '/img/ignore/' + id,
        type: 'POST',
        success: function() {
            document.getElementById('detail').style.display = 'none';

            if (next_container) {
                select_picture(next_container.getElementsByClassName('button')[0]);
            }
        },
        complete: function(xhr, statusText) {
            console.log(xhr.status);
            if (xhr.status == 402) {
                show_failed_box('忽略失敗');
            } else if (xhr.status == 200) {
                show_success_box('忽略成功');
            }
        }
    })
}

function submit() {

    $('.default_text')[0].innerHTML = '已經審核完全部照片了噢～';

    let id = selected_picture.getAttribute('indexId');
    var request_url = '/img/';
    var para1 = document.getElementById('check_availible_num_bag').value;
    var para2 = document.getElementById('check_availible_num_container').value;
    var para3 = document.getElementById('check_availible_num_tableware').value;
    var type = 'accept';

    var para = para1 + '/' + para2 + '/' + para3;

    if (para1 === '0' && para2 === '0' && para3 === '0') {
        para = document.getElementById('reasons').value;
        type = 'decline';
    }

    var selected_container = selected_picture.parentNode.parentNode;
    var next_container = selected_container.nextSibling;

    request_url += type + '/' + id + '/' + para;
    $.ajax({
        url: request_url,
        type: 'POST',
        success: function() {
            console.log('success');

            document.getElementById('detail').style.display = 'none';

            if (next_container) {
                select_picture(next_container.getElementsByClassName('button')[0]);
            }
        },
        error: function(xhr, statusText, err) {
            console.log('error:' + xhr.status);
            show_failed_box('請檢察網路連線');
        },
        complete: function(xhr, statusText) {
            console.log(xhr.status);
            if (xhr.status == 402) {
                show_failed_box('此照片已被審核');
            } else if (xhr.status == 200) {
                show_success_box();
            }
        }
    })
}

function change_tab(tab) {
    let elements = document.getElementById('cssmenu').getElementsByTagName('ul')[0].getElementsByTagName('li');
    if (!tab.classList.contains('active')) {
        for (var i = 0; i < elements.length; i++) {
            if (elements[i] != tab) {
                elements[i].classList.remove('active');
            } else {
                elements[i].classList.add('active');
            }
        }

        if (tab.value == "0") {
            document.getElementById('picture_view').style.display = 'block';
            document.getElementById('detail').style.visibility = 'visible';

            document.getElementById('messenger_view').style.display = 'none';
        } else if (tab.value == "1") {
            document.getElementById('picture_view').style.display = 'none';
            document.getElementById('detail').style.visibility = 'hidden';

            document.getElementById('messenger_view').style.display = 'inline';

        }
    }
}

function create_message(type, message, img, shouldScroll=true, pos='back') {
    var msg_ul = document.getElementById('message_ul');

    var new_msg = document.createElement('li');
    var new_span = document.createElement('span');
    var new_p = document.createElement('p');
    var new_a = document.createElement('a');

    var index;
    var new_href;

    if (type === 'customer') {
        new_span.setAttribute('class', 'helper customer');
        new_span.appendChild(img);
        new_msg.setAttribute('class', 'customer');
    } else if (type === 'system') {
        new_span.setAttribute('class', 'helper');
        index = message.indexOf('https:');
        if (index >= 0) {
            var hrefLink = message.slice(index, message.length);
            var hrefStr = '圖片';
            message = message.slice(0, 7);
            new_href = document.createElement('a');
            new_href.appendChild(document.createTextNode(hrefStr));
            new_href.setAttribute('class', 'href');
            new_href.setAttribute('href', hrefLink);
            new_href.setAttribute('target', '_blank');
        }
        if (img !== undefined) {
            var new_div = document.createElement('div');
            new_div.appendChild(img);
            new_p.appendChild(new_div);
        }
        new_msg.setAttribute('class', 'system');
    } else {
        new_span.setAttribute('class', 'helper');
        new_msg.setAttribute('class', 'me');
    }

    new_a.appendChild(document.createTextNode(message));
    new_a.setAttribute('class', 'box');
    new_p.appendChild(new_a);
    if (new_href)
        new_p.appendChild(new_href);
    new_msg.appendChild(new_span);
    new_msg.appendChild(new_p);
    
    if (pos == 'front') {
        msg_ul.insertBefore(new_msg, msg_ul.firstChild);
    } else if (pos == 'back') {
        msg_ul.appendChild(new_msg);
    }

    if (shouldScroll) msg_ul.scrollTop = msg_ul.scrollHeight;

    return new_msg;
}

function showDialog(customer, customerId, customerName) {
    if (selected_customer === customer) {
        return;
    }

    document.getElementsByClassName('manager')[0].setAttribute('status', 'collapse');

    // socket.on(customerId, function(data) {
    //     var img = customer.getElementsByTagName('img')[0].cloneNode(true);

    //     var type = data.type;
    //     var msg = data.msg;

    //     create_message(type, msg, img);

    //     document.getElementById('name').setAttribute('status', 'unread');
    //     document.getElementById('time').setAttribute('status', 'unread');
    //     document.getElementById('text').setAttribute('status', 'unread');
    // })

    clear_message_field();

    customer.setAttribute('customerId', customerId);

    if (selected_customer != undefined) {
        selected_customer.style.backgroundColor = 'white';
    }
    selected_customer = customer;

    customer.style.backgroundColor = 'rgb(240, 240, 240)';

    // Show the message field
    var message_field = document.getElementById('message_field');
    var text_field = document.getElementById('text_field');
    message_field.style.display = 'block';
    text_field.style.display = 'block';

    var nav_text = message_field.getElementsByTagName('nav')[0].getElementsByTagName('p')[0];
    nav_text.textContent = customerName;

    document.getElementById('default_words').style.display = 'none';

    var msg_ul = document.getElementById('message_ul');
    msg_ul.scrollTop = msg_ul.scrollHeight;


    //Set the loader animation
    var loader = document.createElement('div');
    loader.setAttribute('class', 'loader');

    document.getElementById('message_ul_container').appendChild(loader);

    $.ajax({
        url: "/chatroom/" + customerId,
        type: "GET",
        dataType: "JSON",
        success: function(data) {
            customer_message_data = data;
            for (var i = 0; i < 30; i++) {

                var img = undefined;
                let record = data.userMessage[i];

                if (!record) {
                    return;
                } 

                if (record.type === 'customer') {
                    img = customer.getElementsByTagName('img')[0].cloneNode(true);
                }
                create_message(record.type, record.text, img, true, 'front');

                customer_msg_index = i;
            }
        },
        error: function() {
            alert('error')
        },
        complete: function() {
            document.getElementById('message_ul_container').removeChild(loader);
        }

    });
}

function clear_message_field() {
    var msg_ul = document.getElementById('message_ul');

    while (msg_ul.firstChild)
        msg_ul.removeChild(msg_ul.firstChild);
}

function closeDialog() {
    selected_customer.style.backgroundColor = '';
    selected_customer = undefined;
    document.getElementById('default_words').style.display = 'flex';
    document.getElementById('message_field').style.display = 'none';
    document.getElementById('text_field').style.display = 'none';
    document.getElementsByClassName('manager')[0].removeAttribute('status');

}

function create_pic(place, indexId, imgstr, userName, uploadTime, shouldIgnore) {
    let gallery = document.getElementById('picture_view');

    var imgtag = document.createElement('img');
    imgtag.setAttribute('class', 'button');
    imgtag.setAttribute('type', 'button');
    imgtag.setAttribute('src', imgstr);
    imgtag.setAttribute('onclick', "select_picture(this)");
    imgtag.setAttribute('userName', userName);
    imgtag.setAttribute('uploadTime', uploadTime);
    imgtag.setAttribute('indexId', indexId)
    imgtag.setAttribute('shouldIgnore', shouldIgnore);

    var container = document.createElement('div');
    container.setAttribute('class', 'container');

    var pic_a = document.createElement('a');
    pic_a.setAttribute('class', 'pic');

    pic_a.appendChild(imgtag);

    var name_p = document.createElement('p');
    name_p.appendChild(document.createTextNode(userName));

    pic_a.appendChild(name_p);

    if (selected_picture) {
        pic_a.style.opacity = 0.3;
    }

    container.appendChild(pic_a);


    if (place === 'front') {
        gallery.prepend(container);
    } else if (place === 'back') {
        gallery.appendChild(container);
    }

}

function load_pic_data(last_index) {
    $.ajax({
        url: "/img/" + last_index,
        type: "GET",
        dataType: "JSON",
        success: function(data) {
            pic_data = data.list;

            for (var i = 0; i < 20; i++) {
                if (!pic_data[i]) {
                    break;
                }
                var imgstr = "/getImg/" + pic_data[i].indexId;
                end_index = pic_data[i].indexId;
                create_pic('back', pic_data[i].indexId, imgstr, pic_data[i].userName, pic_data[i].uploadTime, pic_data[i].ignoreButton);
            }

            document.getElementById('picture_view').scrollLeft = 0;
        },
        error: function() {

        },
        complete: function() {
            document.getElementsByClassName('loader')[0].style.display = 'none';

            if (pic_data.length == 0) {
                $('.default_text')[0].innerHTML = '已經審核完全部照片了噢～';
            } else {
                $('.default_text')[0].innerHTML = '請點選照片以審核'
            }
        }
    });
}