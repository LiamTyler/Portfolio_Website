$(document).ready(function() {
    var w = $("#original").width();
    var h = $("#original").height();
    $(".scale").each(function(){
        $(this).width(w);
        $(this).height(h);
    });
});

$(window).bind("resize", function() {
    var w = $("#original").width();
    var h = $("#original").height();
    $(".scale").each(function(){
        $(this).width(w);
        $(this).height(h);
    });
});
