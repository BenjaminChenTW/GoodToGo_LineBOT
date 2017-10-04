if (/iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase())) {
    console.log("in phone")
} else {
    $("#css_style").attr("href","assets/css/personalReduce.css"); 
    console.log("in web");
}

