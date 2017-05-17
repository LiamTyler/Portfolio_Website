var ctx;
var lineWidth = 1;
var lineColor = "#0000FF";
var circleColor = "#FF0000";
var current_spline;
var all_splines = new Array();

var radius = 2;
var circleLineWidth = 1;
var width;
var height;

function Point() {
        this.x = 0;
        this.y = 0;
        this.dx = 0;
        this.dy = 0;
}
function Point(x, y) {
        this.x = x;
        this.y = y;
        this.dx = 0;
        this.dy = 0;
}
function Point(x, y, dx, dy) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
}

function Spline() {
    this.points = new Array();
}

Spline.prototype.addPoint = function(x, y) {
    var p = new Point(x, y);
    this.points.push(p);
    var len = this.points.length;
    // fix end point derivatives
    if (len != 1) {
        var p0 = this.points[len - 2];
        var p1 = this.points[len - 1];
        this.points[len - 1].dx = (p1.x - p0.x) / 2.0;
        this.points[len - 1].dy = (p1.y - p0.y) / 2.0;
    }
    // Now can calculate the next average derivative
    if (len >= 3) {
        var p0 = this.points[len - 3];
        var p1 = this.points[len - 2];
        var p2 = this.points[len - 1];
        this.points[len - 2].dx = (p2.x - p0.x) / 2.0;
        this.points[len - 2].dy = (p2.y - p0.y) / 2.0;
    } else if (len == 2) {
        // fix first point derivative
        var p0 = this.points[0];
        var p1 = this.points[1];
        this.points[0].dx = (p1.x - p0.x) / 2.0;
        this.points[0].dy = (p1.y - p0.y) / 2.0;
    }
}

Spline.prototype.drawCurve = function () {
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    var p0 = this.points[0];
    var p1 = this.points[1];
    ctx.moveTo(p0.x, p0.y);

    for (var i = 0; i < this.points.length - 1; i++) {
        p0 = this.points[i];
        p1 = this.points[i + 1];

        for (var t = 0.1; t <= 1.0; t += .1) {
            var t2 = t*t;
            var t3 = t*t*t;
            var npx = (2*t3 - 3*t2 + 1)*p0.x + (t3 - 2*t2 + t)*p0.dx +
                      (-2*t3 + 3*t2)*p1.x + (t3 - t2)*p1.dx;
            var npy = (2*t3 - 3*t2 + 1)*p0.y + (t3 - 2*t2 + t)*p0.dy +
                      (-2*t3 + 3*t2)*p1.y + (t3 - t2)*p1.dy;
            ctx.lineTo(npx, npy);
        }
    }
    ctx.stroke();
}

Spline.prototype.draw = function() {
    this.drawPoints();
    this.drawCurve();
}

Spline.prototype.drawPoints = function() {
    for (var i = 0; i < this.points.length; i++) {
        x = this.points[i].x;
        y = this.points[i].y;
        drawCircle(x,y);
    }
}

function drawCircle(x, y) {
    ctx.beginPath();
    ctx.strokeStyle = circleColor;
    ctx.lineWidth = circleLineWidth;
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();
}

function redraw() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    current_spline.draw();
    for (var i = 0; i < all_splines.length; i++) {
        all_splines[i].draw();
    }
}

$(document).ready(function() {
    var canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    ctx.lineJoin = "round";
    width = canvas.width;
    height = canvas.height;

    current_spline = new Spline();

    $("#canvas").mousedown(function(e) {
        var mouseX = e.pageX - this.offsetLeft;
        var mouseY = e.pageY - this.offsetTop;
        current_spline.addPoint(mouseX, mouseY);
        redraw();
    });
    $(window).keypress(function(e) {
        if (e.which == 32) {
            if (current_spline.points.length != 0) {
                all_splines.push(current_spline);
                current_spline = new Spline();
            }
        }
    });
});

