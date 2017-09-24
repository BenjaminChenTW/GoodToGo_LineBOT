
function select_picture(pic){
    var blockers = picture_view.getElementsByClassName('pic');
    for (var i = 0 ; i < blockers.length ; i+=1) {
        if (blockers[i].getElementsByTagName('img')[0] != pic) {
            blockers[i].style.opacity = "0.3";
        } else {
            blockers[i].style.opacity = "1";
            document.getElementById('main_pic').src = pic.src;
            
            document.getElementById('main_pic').style.display = "inline-block";
            document.getElementById('main_pic_section').style.display = "inline-block";
            
            document.getElementById('detail_data').style.display = "inline";
        }
    }
}

function submit(){
    
}

function change_tab(tab){
    let elements = document.getElementById('cssmenu').getElementsByTagName('ul')[0].getElementsByTagName('li');
    if (!tab.classList.contains('active')) {
        for(var i = 0 ; i < elements.length ; i++){
            if (elements[i] != tab) {
                elements[i].classList.remove('active');
            } else {
                elements[i].classList.add('active');
            }
        }

        if (tab.value == "0") {
            document.getElementById('picture_view').style.left = '0vw';
            document.getElementById('detail').style.left = '0vw';

            document.getElementById('messenger_view').style.left = '150vw';
        } else if (tab.value == "1") {
            document.getElementById('picture_view').style.left = '-150vw';
            document.getElementById('detail').style.left = '-150vw';

            document.getElementById('messenger_view').style.display = 'inline';
            document.getElementById('messenger_view').style.left = '0vw';
        }
    }
}

function send_message(){
    
    var msg = document.getElementById('message_text').value;
    var msg_ul = document.getElementById('message_ul');
    var new_msg = document.createElement('li');
    var new_p = document.createElement('p');
    new_p.appendChild(document.createTextNode(msg));
    new_msg.appendChild(new_p);
    new_msg.setAttribute('class','me');
    msg_ul.append(new_msg);
    msg_ul.scrollTop = msg_ul.scrollHeight;
}