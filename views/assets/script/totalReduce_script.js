if (/iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase())) {
    console.log("in phone")
} else {
    $("#css_style").attr("href","assets/css/totalReduce.css"); 
    console.log("in web");
}
