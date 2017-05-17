var ctx;
var editMode = false;

var lineWidth = 1;
var lineColor = "#0000FF";
var circleColor = "#FF0000";
var current_spline;
var all_splines = new Array();
var selectedSpline = null;
var selectedPoint = null;

var radius = 3;
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
        p.dx = (p.x - p0.x) / 2.0;
        p.dy = (p.y - p0.y) / 2.0;
    }
    // Now can calculate the next average derivative
    if (len >= 3) {
        var p0 = this.points[len - 3];
        var p1 = this.points[len - 2];
        p1.dx = (p.x - p0.x) / 2.0;
        p1.dy = (p.y - p0.y) / 2.0;
    } else if (len == 2) {
        // fix first point derivative
        var p0 = this.points[0];
        p0.dx = (p.x - p0.x) / 2.0;
        p0.dy = (p.y - p0.y) / 2.0;
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
    var len = this.points.length;
    if (editMode) {
        for (var i = 0; i < len; i++) {
            x = this.points[i].x;
            y = this.points[i].y;
            drawCircle(x,y);
        }
    } else {
        if (len != 0) {
            var s = this.points[0];
            var e = this.points[len - 1];
            drawCircle(s.x, s.y);
            drawCircle(e.x, e.y);
        }
    }
}

Spline.prototype.changePoint = function(index, x, y) {
    var p = this.points[index];
    p.x = x;
    p.y = y;
    var len = this.points.length;
    if (index == 0 && len >= 2) {
        var p1 = this.points[1];
        p.dx = (p1.x - p.x) / 2.0;
        p.dy = (p1.y - p.y) / 2.0;
    } else if (index >= 1) {
        var p1 = this.points[index - 1];
        var p0;
        if (index >= 2) {
            p0 = this.points[index - 2];
        } else {
            p0 = p1;
        }
        p1.dx = (p.x - p0.x) / 2.0;
        p1.dy = (p.y - p0.y) / 2.0;
    }

    var remain = len - index - 1;
    if (remain >= 1) {
        var p1 = this.points[index + 1];
        var p2;
        if (remain == 1) {
            p2 = p1;
        } else {
            p2 = this.points[index + 2];
        }
        p1.dx = (p2.x - p.x) / 2.0;
        p1.dy = (p2.y - p.y) / 2.0;
    } else if (remain == 0 && index >= 1) {
        p1 = this.points[len - 2];
        p.dx = (p.x - p1.x) / 2.0;
        p.dy = (p.y - p1.y) / 2.0;
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
    for (var i = 0; i < all_splines.length; i++) 
        all_splines[i].draw();
}

$(document).ready(function() {
    var canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    ctx.lineJoin = "round";
    width = canvas.width;
    height = canvas.height;

    current_spline = new Spline();
    all_splines.push(current_spline);

    $("#canvas").mousedown(function(e) {
        var mouseX = e.pageX - this.offsetLeft;
        var mouseY = e.pageY - this.offsetTop;
        if (!editMode) {
            current_spline.addPoint(mouseX, mouseY);
            redraw();
        } else {
            // look for mouse inside a point
            var spline;
            var point = -1;
            for (var s = 0; s < all_splines.length; s++) {
                spline = all_splines[s];
                var points = spline.points;
                for (var p = 0; p < points.length; p++) {
                    if (Math.abs(points[p].x - mouseX) <= radius &&
                        Math.abs(points[p].y - mouseY) <= radius) {
                        point = p;
                        break;
                    }
                }
            }
            if (point == -1)
                return;
            selectedPoint = point;
            selectedSpline = spline;
        }
    });

    $("#canvas").mousemove(function(e) {
        if (selectedPoint != null) {
            var mouseX = e.pageX - this.offsetLeft;
            var mouseY = e.pageY - this.offsetTop;
            selectedSpline.changePoint(selectedPoint, mouseX, mouseY);
            redraw();
        }
    });

    $("#canvas").mouseup(function(e) {
        if (selectedPoint != null) {
            selectedPoint = null;
            selectedSpline = null;
        }
    });
    $("#canvas").mouseleave(function(e) {
        if (selectedPoint != null) {
            selectedPoint = null;
            selectedSpline = null;
        }
    });

    $(window).keypress(function(e) {
        if (e.which == 32) {
            if (current_spline.points.length != 0) {
                current_spline = new Spline();
                all_splines.push(current_spline);
            }
        }
        else if (e.which == 83 || e.which == 115) {
            editMode = !editMode;
            redraw();
        }
    });
});

