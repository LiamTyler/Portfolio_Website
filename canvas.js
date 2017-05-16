var ctx;
var paint = false;
var lastX, lastY;
var inCanvas = false;


function Draw(x, y, dragging) {
    if (dragging) {
        ctx.beginPath();
        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = 5;
        ctx.lineJoin = "round";
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.stroke();
    }
    // lastX = x; lastY = y;
}

$(document).ready(function() {
    ctx = document.getElementById("canvas").getContext("2d");

    $(document).mousedown(function(e) {
        paint = true;
    });

    $(document).mouseup(function(e) {
        paint = false;
    });

    $('#canvas').mouseleave(function(e) {
        inCanvas = false;
    });

    $('#canvas').mouseenter(function(e) {
        inCanvas = true;
    });

    $('#canvasDiv').mousemove(function(e) {
        var mouseX = e.pageX - this.offsetLeft - 20;
        var mouseY = e.pageY - this.offsetTop - 20;
        if (paint && inCanvas) {
            Draw(mouseX, mouseY, true);
        }

        lastX = mouseX;
        lastY = mouseY;
    });

});

