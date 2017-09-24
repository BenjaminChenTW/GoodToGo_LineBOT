
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
        } else if (tab.value == "1") {
            document.getElementById('picture_view').style.left = '-150vw';
            document.getElementById('detail').style.left = '-150vw';
        }
    }
}

