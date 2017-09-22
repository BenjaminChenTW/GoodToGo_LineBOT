
function select_picture(pic){
    var picture_view = document.getElementById('picture_view');
    //picture_view.style.height = "10vh";
    //pic.style.visibility = "hidden"
    var blockers = picture_view.getElementsByClassName('pic');
    for (var i = 0 ; i < blockers.length ; i+=1) {
        if (blockers[i].getElementsByTagName('img')[0] != pic) {
            blockers[i].style.opacity = "0.3";
        } else {
            blockers[i].style.opacity = "1";
            document.getElementById('main_pic').src = pic.src;
            
            document.getElementById('main_pic').style.display = "inline-block";
            document.getElementById('main_pic_section').style.display = "inline-block";
            
            document.getElementById('data').style.display = "block";
        }
    }
}

function submit(){
    
}