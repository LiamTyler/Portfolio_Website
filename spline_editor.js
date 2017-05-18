var ctx;
var editMode = false;

var timer;
var time = 0;
var interval = 10;

var lineWidth = 1;
var lineColor = "#0000FF";
var circleColor = "#FF0000";
var current_spline;
var all_splines = new Array();
var selectedSpline = null;
var selectedPoint = null;

var radius = 5;
var circleLineWidth = 1;
var width;
var height;

function Point() {
    this.x = 0;
    this.y = 0;
    this.dx = 0;
    this.dy = 0;
    this.t = 0;
}
function Point(x, y) {
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
    this.t = 0;
}
function Point(x, y, dx, dy) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.t = 0;
}
function Point(x, y, dx, dy, t) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.t = t;
}

function magnitude(end, start) {
    var dx = (end.x - start.x) * (end.x - start.x);
    var dy = (end.y - start.y) * (end.y - start.y);
    return Math.sqrt(dx + dy);
}

function Spline() {
    this.points = new Array();
    this.time = 1;
    this.length = 0;
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
        this.length += magnitude(p, p0);
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
    this.fixTimes();
}

Spline.prototype.fixTimes = function() {
    var tot = 0;
    var m = 0;
    this.points[0].t = 0;
    for (var i = 1; i < this.points.length; i++) {
        m = magnitude(this.points[i], this.points[i - 1]);
        tot += m;
        this.points[i].t = this.time * (tot / this.length);
    }
}

Spline.prototype.animate = function() {
    if (time == current_spline.time)
        clearInterval(timer);

    // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    var ret1 = current_spline.getPosition(time);
    time += interval / 1000.0 
    var ret2 = current_spline.getPosition(time);
    ctx.beginPath();
    ctx.moveTo(ret1[0], ret1[1]);
    ctx.lineTo(ret2[0], ret2[1]);
    ctx.closePath();
    ctx.stroke();
}

Spline.prototype.getSegment = function(t) {
    var i;
    var n = this.points.length;
    for(i = 0; i < (n - 1) && !(this.points[i].t <= t && t <= this.points[i + 1].t); i++);
    return i;
}

Spline.prototype.getPosition = function (t) {
    t = Math.max(Math.min(this.time, t), 0);
    var seg = this.getSegment(t);
    var p0 = this.points[seg];
    var p1 = this.points[seg + 1];
    var tRange = p1.t - p0.t;
    t = (t - p0.t) / tRange;
    var p0dx = p0.dx;
    var p0dy = p0.dy;
    var p1dx = p1.dx;
    var p1dy = p1.dy;
    var t2 = t*t;
    var t3 = t*t*t;
    var x = (2*t3 - 3*t2 + 1)*p0.x + (t3 - 2*t2 + t)*p0dx +
            (-2*t3 + 3*t2)*p1.x + (t3 - t2)*p1dx;
    var y = (2*t3 - 3*t2 + 1)*p0.y + (t3 - 2*t2 + t)*p0dy +
            (-2*t3 + 3*t2)*p1.y + (t3 - t2)*p1dy;
    return [x, y];
}

Spline.prototype.drawT = function() {
    if (this.points.length < 2)
        return;
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    var p = new Point();
    p.x = this.points[0].x;
    p.y = this.points[0].y;
    for (var t = 0; t <= this.time + .01; t += .01) {
        var ret = this.getPosition(t);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(ret[0], ret[1]);
        p.x = ret[0];
        p.y = ret[1];
        ctx.closePath();
        ctx.stroke();
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

        for (var t = 0; t <= 1.0; t += .1) {
            var t2 = t*t;
            var t3 = t*t*t;
            var npx = (2*t3 - 3*t2 + 1)*p0.x + (t3 - 2*t2 + t)*p0.dx +
                      (-2*t3 + 3*t2)*p1.x + (t3 - t2)*p1.dx;
            var npy = (2*t3 - 3*t2 + 1)*p0.y + (t3 - 2*t2 + t)*p0.dy +
                      (-2*t3 + 3*t2)*p1.y + (t3 - t2)*p1.dy;
            ctx.lineTo(npx, npy);
            // ctx.stroke();
        }
    }
    ctx.stroke();
}

Spline.prototype.draw = function() {
    this.drawPoints();
    this.drawCurve();
    // this.drawT();
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
    current_spline.addPoint(54, 127);
    current_spline.addPoint(297, 227);
    current_spline.addPoint(347, 145);
    current_spline.addPoint(245, 145);
    current_spline.addPoint(129, 409);
    current_spline.addPoint(67, 395);
    current_spline.addPoint(102, 305);
    current_spline.addPoint(349, 436);
    all_splines.push(current_spline);
    // redraw();
    timer = setInterval(current_spline.animate, interval);

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
                spline = s;
                var points = all_splines[s].points;
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
            all_splines[selectedSpline].changePoint(selectedPoint, mouseX, mouseY);
            redraw();
        }
    });

    $("#canvas").mouseup(function(e) {
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
        } else if (e.which == 83 || e.which == 115) {
            editMode = !editMode;
            redraw();
        } else if (editMode && e.which == 100 && selectedPoint != null) {
            var newspline = new Spline();
            newspline.time = all_splines[selectedSpline].time;
            for(var i = 0; i < all_splines[selectedSpline].points.length; i++) {
                if (i != selectedPoint) {
                    var p = all_splines[selectedSpline].points[i];
                    newspline.addPoint(p.x, p.y);
                }
            }
            all_splines[selectedSpline] = newspline;
            current_spline = newspline;
            selectedPoint = null;
            selectedSpline = null;
            redraw();
        }
    });
});

