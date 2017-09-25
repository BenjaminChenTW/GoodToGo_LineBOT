
function select_picture(pic){
    var blockers = picture_view.getElementsByClassName('pic');
    for (var i = 0 ; i < blockers.length ; i+=1) {
        if (blockers[i].getElementsByTagName('img')[0] != pic) {
            blockers[i].style.opacity = "0.3";
        } else {
            blockers[i].style.opacity = "1";
            document.getElementById('main_pic').src = pic.src;
            document.getElementById('detail').style.display = "block";
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

function send_message(){    
    var msg = document.getElementById('message_text').value;
    var msg_ul = document.getElementById('message_ul');

    var new_msg = document.createElement('li');
    var new_span = document.createElement('span');
    var new_p = document.createElement('p');
    var new_a = document.createElement('a');
    
    new_span.setAttribute('class', 'helper');
    new_a.appendChild(document.createTextNode(msg));
    new_a.setAttribute('class','box');
    new_p.appendChild(new_a);    
    new_msg.appendChild(new_span);
    new_msg.appendChild(new_p);
    new_msg.setAttribute('class','me');
    msg_ul.append(new_msg);
    msg_ul.scrollTop = msg_ul.scrollHeight;
}

function showDialog(customer){

    var message_field = document.getElementsByClassName('message')[0];

    message_field.style.display = 'block';
    var nav_text = message_field.getElementsByTagName('nav')[0].getElementsByTagName('p')[0];
    nav_text.textContent = customer.getElementsByTagName('p')[0].textContent;
}

function closeDialog(){
    document.getElementsByClassName('message')[0].style.display = 'none';
}