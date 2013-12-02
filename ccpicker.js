/*! CcPicker - v0.9 - 2013-12-01
 * https://github.com/JoTrdl/ccpicker
 *
 * Copyright (c) 2013 Johann Troendle <johann.troendle@gmail.com>;
 * Licensed under the MIT license */
(function(w, d, $) {
  "use strict";

  var alphaBackground = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==";

  var isTouch = !!('ontouchstart' in window);
  var events = {
    start: isTouch ? 'touchstart' : 'mousedown',
    move: isTouch ? 'touchmove' : 'mousemove',
    end: isTouch ? 'touchend' : 'mouseup'
  };

  var jQueryEnabled = false;

  var applyAngle = function (point, angle, distance) {
    return {
      x : Math.round(point.x + (Math.cos(angle) * distance)),
      y : Math.round(point.y + (Math.sin(angle) * distance)) 
    };
  };

  var ctx, ctxTmp;
  var width, height, lineWidth, centerPoint, radius, knobRadius;
  var resultCircle, satCircle;
  var TWO_PI = 2 * Math.PI;
  var PI_TWO = Math.PI/2;

  var ALPHA_MIN_ANGLE = Math.PI/12;
  var ALPHA_MAX_ANGLE = 23*Math.PI/12;

  var alphaStartAngle = Math.PI/12;
  var alphaEndAngle = (23/12) * Math.PI;

  var colors = ['red', 'purple', '#8000FF', 'blue', 'cyan', 'green', 'yellow', 'orange'];
  var borderLine = {
    width: 2,
    color: "rgb(176,176,176)"
  }

  var knobs = {
    hue: {elem: null, active: false},
    color: {elem: null, active: false},
    alpha: {elem: null, active: false}
  }

  var drawGradiantCircle = function(ctx, radius, lineWidth, colors) {
    ctx.save();
    ctx.lineWidth = lineWidth;
    var p1, p2, gradient;
    p1 = applyAngle(centerPoint, 0, radius);
    var angleSteps = TWO_PI / colors.length;
    var adjustment = TWO_PI / 360;
    for (var color = 0, step = 0; color < colors.length; color++, step += angleSteps) {
      p2 = applyAngle(centerPoint, step + angleSteps, radius);
     
      gradient = ctx.createLinearGradient(p1.x,p1.y, p2.x, p2.y);
      gradient.addColorStop(0, colors[color]);
      gradient.addColorStop(1, colors[color + 1] || colors[0]);
      ctx.strokeStyle = gradient;
    
      ctx.beginPath(); 
      ctx.arc(centerPoint.x,centerPoint.y,radius,step - adjustment, step + angleSteps + adjustment); // little hack to avoid gap in circle...
      ctx.stroke();

      p1 = p2;
    }

    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;// 3;
    ctx.shadowColor = "rgb(100,100,100)";
    ctx.strokeStyle = "rgb(176,176,176)";
    ctx.beginPath(); 
    ctx.arc(centerPoint.x,centerPoint.y,radius + lineWidth/2 + 1,0,2*Math.PI);
   // ctx.stroke();

    ctx.beginPath(); 
    ctx.arc(centerPoint.x,centerPoint.y,radius - lineWidth/2,0,2*Math.PI);
   // ctx.stroke();

    ctx.restore();
  }

  var drawAlphaCircle = function(ctx, radius, lineWidth) {

    var pattern;

    var draw = function() {
      ctx.save();
      ctx.translate(centerPoint.x, centerPoint.y);
      ctx.rotate( -Math.PI / 2);
      ctx.translate(-centerPoint.x, -centerPoint.y);

      // draw border
      ctx.lineCap = 'round';
      ctx.lineWidth = lineWidth + 2;
      ctx.strokeStyle = borderLine.color;
      ctx.beginPath(); 
      ctx.arc(centerPoint.x,centerPoint.y,radius, alphaStartAngle, alphaEndAngle);
      ctx.stroke();

      // draw background pattern
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = pattern;
      ctx.beginPath(); 
      ctx.arc(centerPoint.x, centerPoint.y, radius, alphaStartAngle, alphaEndAngle);
      ctx.stroke();

      // draw gradient
      var rectWidth = (radius + lineWidth/2) * 2;
      var rectHeight = radius + lineWidth/2;

      var gradient1 = ctx.createLinearGradient(centerPoint.x - radius, centerPoint.y + rectHeight/2, centerPoint.x + radius, centerPoint.y + rectHeight/2);
      gradient1.addColorStop(0, 'rgba(74, 134, 232, .5)');
      gradient1.addColorStop(1, 'rgba(74, 134, 232, 0)');

      var gradient2 = ctx.createLinearGradient(centerPoint.x - radius, centerPoint.y + rectHeight/2, centerPoint.x + radius, centerPoint.y + rectHeight/2);
      gradient2.addColorStop(0, 'rgba(74, 134, 232, .5)');
      gradient2.addColorStop(1, 'rgba(74, 134, 232, 1)');

      ctx.save();
      ctx.beginPath();
      ctx.rect(centerPoint.x - radius - lineWidth/2, centerPoint.y, rectWidth, rectHeight);
      ctx.clip();

      ctx.strokeStyle = gradient1;
      ctx.beginPath();
      ctx.arc(centerPoint.x, centerPoint.y, radius, alphaStartAngle, alphaEndAngle);
      ctx.stroke();
      ctx.restore(); 

      ctx.save();
      ctx.beginPath();
      ctx.rect(centerPoint.x - radius - lineWidth/2, centerPoint.y - radius - lineWidth/2, rectWidth, rectHeight);
      ctx.clip();

      ctx.strokeStyle = gradient2;
      ctx.beginPath();
      ctx.arc(centerPoint.x, centerPoint.y, radius, alphaStartAngle, alphaEndAngle);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }

    var alphaImage = new Image();
    alphaImage.onload = function() {
      pattern = ctx.createPattern(alphaImage, "repeat");
      draw();
    }
    alphaImage.src = alphaBackground;
  }

  var initPicker = function(container) {
    var c = d.createElement('canvas');
    c.width = width;
    c.height = height;
    c.style.position = "relative";
    c.style.zIndex = "1";
    container.appendChild(c);
    ctx = c.getContext('2d');

    c = d.createElement('canvas');
    c.width = width;
    c.height = height;
    c.style.display = "none";
    container.appendChild(c);
    ctxTmp = c.getContext('2d');
    
    ctxTmp.translate(centerPoint.x, centerPoint.y);
    ctxTmp.rotate( Math.PI /4 + Math.PI/2);
    ctxTmp.translate(-centerPoint.x, -centerPoint.y);

    resultCircle = d.createElement('div');
    resultCircle.style.position = "absolute";
    resultCircle.style.borderRadius = "100%";
    resultCircle.style.webkitTouchCallout = "none";
    resultCircle.style.webkitUserSelect = "none";
    resultCircle.style.khtmlUserSelect = "none";
    resultCircle.style.mozUserSelect = "none";
    resultCircle.style.msUserSelect = "none";
    resultCircle.style.userSelect = "none";
    resultCircle.style.border = "1px solid " + borderLine.color;
    resultCircle.style.zIndex = 5;
    resultCircle.style.width = width * 0.3 + 'px'; 
    resultCircle.style.height = height * 0.3 + 'px'; 
    resultCircle.style.left = centerPoint.x - width * 0.3/2 - 1 + 'px';
    resultCircle.style.top = centerPoint.y - height * 0.3/2 - 1 + 'px';
    container.appendChild(resultCircle);

    c = resultCircle.cloneNode();
    c.border = 'none';
    c.style.zIndex = 0;
    c.style.background = 'url(' + alphaBackground + ')';
    container.appendChild(c);

    satCircle = resultCircle.cloneNode();
    satCircle.style.border = lineWidth + 'px solid red';
    satCircle.style.background = 'none';
    satCircle.style.zIndex = 0;
    container.appendChild(satCircle);

    var createKnob = function() {
      var knob = d.createElement('div');
      knob.classname = 'knob';
      knob.innerText = '+';
      knob.style.position = 'absolute';
      knob.style.borderRadius = '100%';
      knob.style.boxShadow = 'rgba(90, 90, 90, 1) 0px 0px 0px 2px, rgba(85, 85, 85, 0.65098) 0px 2px 40px 2px inset';
      knob.style.textAlign = 'center';
      knob.style.lineHeight = knobRadius*2 + 'px';
      knob.style.fontSize = '40px';
      knob.style.color = 'rgba(85, 85, 85, 1)';
      knob.style.webkitUserSelect = "none";
      knob.style.khtmlUserSelect = "none";
      knob.style.mozUserSelect = "none";
      knob.style.msUserSelect = "none";
      knob.style.userSelect = "none";
      knob.style.cursor = "pointer";
      knob.style.zIndex = "2";
      knob.style.width = knobRadius*2 + 'px';
      knob.style.height = knobRadius*2 + 'px';
      return knob;
    }

    knobs.hue.elem = createKnob();
    container.appendChild(knobs.hue.elem);

    knobs.color.elem = createKnob();
    container.appendChild(knobs.color.elem);
    
    knobs.alpha.elem = createKnob();
    container.appendChild(knobs.alpha.elem);
  }

  var CCPicker = function(container, options) {
    if (!container) {
      console.log('container must be defined');
      return;
    }

    var alphaValue = 1;
    var colorValue = [255, 0, 0]; // start red

    width = options && options.width || container.offsetWidth;
    height = options && options.height || container.offsetHeight;
    lineWidth = Math.ceil(options && options.lineWidth || width * .08 + 1); // 8% of width
    centerPoint = {x: width/2, y: height/2};
    radius = width/2 - lineWidth/2 - borderLine.width;
    knobRadius = ((lineWidth + 10) / 2) >> 0;
    initPicker(container);
    drawGradiantCircle(ctx, radius, lineWidth, colors);
    var callback = options && options.callback || function() {};

    var space = (radius - lineWidth/2 - width/2 * 0.3 - 2* lineWidth) / 3 ;

    var radiusAlpha = width * 0.3/2 + lineWidth/2 + space
    drawAlphaCircle(ctx, radiusAlpha, lineWidth);

    var radiusColor = Math.ceil(radiusAlpha + lineWidth + space);
    satCircle.style.width = satCircle.style.height = Math.ceil(2*radiusColor - lineWidth + 2) + 'px';
    satCircle.style.left = Math.floor(centerPoint.x - radiusColor - lineWidth/2 - 1)  + 'px';
    satCircle.style.top = Math.floor(centerPoint.y - radiusColor - lineWidth/2 - 1)  + 'px';
    drawGradiantCircle(ctxTmp, radiusColor, lineWidth, ['black', 'red', 'red', 'white']);

    ctx.save();
    ctx.translate(centerPoint.x, centerPoint.y);
    ctx.rotate( Math.PI /4 + Math.PI/2);
    ctx.translate(-centerPoint.x, -centerPoint.y);

    drawGradiantCircle(ctx, radiusColor, lineWidth+2, ['black', 'rgba(0,0,0,0)', 'rgba(255,255,255,0)', 'white']);
    ctx.restore();

    var _setKnobPosition = function(knob, point) {
      knob.style.left = point.x - knobRadius + 'px';
      knob.style.top = point.y - knobRadius + 'px';
    }

    var p = applyAngle(centerPoint, 0, radius);
    _setKnobPosition(knobs.hue.elem, p);

    p = applyAngle(centerPoint, -Math.PI/2, radiusColor);
    _setKnobPosition(knobs.color.elem, p);

    p = applyAngle(centerPoint, (23/12) * Math.PI -Math.PI / 2, radiusAlpha);
    _setKnobPosition(knobs.alpha.elem, p);

    var _moveHandler = function(e) {
      if (knobs.hue.active) {
        e.preventDefault();
        var targetEvent = (isTouch) ? e.touches.item(0) : e;
        var angle = Math.atan2(targetEvent.clientY - centerPoint.y, targetEvent.clientX - centerPoint.x);
        var p = applyAngle(centerPoint, angle, radius);
        _setKnobPosition(knobs.hue.elem, p);
        colorValue = ctx.getImageData(p.x, p.y, 1, 1).data;

        var color = 'rgb(' + colorValue[0] + ',' + colorValue[1] + ',' + colorValue[2] + ')';
        satCircle.style.borderColor = color;
      } else if (knobs.color.active) {
        e.preventDefault();
        var targetEvent = (isTouch) ? e.touches.item(0) : e;
        var angle = Math.atan2(targetEvent.clientY - centerPoint.y, targetEvent.clientX - centerPoint.x);
        var p = applyAngle(centerPoint, angle, radiusColor);
        _setKnobPosition(knobs.color.elem, p);
        colorValue = ctxTmp.getImageData(p.x, p.y, 1, 1).data;
      } else if (knobs.alpha.active) {
        e.preventDefault();
        var targetEvent = (isTouch) ? e.touches.item(0) : e;
        var angle = Math.atan2(targetEvent.clientY - centerPoint.y, targetEvent.clientX - centerPoint.x);

        angle += PI_TWO;
        if (angle < 0)
          angle = TWO_PI + angle;

        if (angle < ALPHA_MIN_ANGLE) 
          angle = ALPHA_MIN_ANGLE;
        else if (angle > ALPHA_MAX_ANGLE)
          angle = ALPHA_MAX_ANGLE;

        var p = applyAngle(centerPoint, angle-PI_TWO, radiusAlpha);
        _setKnobPosition(knobs.alpha.elem, p);

        alphaValue = Math.abs(angle/ALPHA_MAX_ANGLE).toFixed(2);
      }

      var color = 'rgba(' + colorValue[0] + ',' + colorValue[1] + ',' + colorValue[2] + ',' + alphaValue + ')';
      resultCircle.style.backgroundColor = color;
    };
  
    var _endHandler = function(e) {
      e.preventDefault();

      if (knobs.hue.active) {
        var color = 'rgb(' + colorValue[0] + ',' + colorValue[1] + ',' + colorValue[2] + ')';
        drawGradiantCircle(ctxTmp, radiusColor, lineWidth, ['black', color, color, 'white']);
      }

      knobs.hue.active = knobs.color.active = knobs.alpha.active = false;

      var color = 'rgba(' + colorValue[0] + ',' + colorValue[1] + ',' + colorValue[2] + ',' + alphaValue + ')';
      if (jQueryEnabled)
        $(container).trigger('change', [color]);
      else
        callback(color);

    }

    var handlers = {
      start: {
        hue: function(e) {e.preventDefault(); knobs.hue.active = true;},
        color: function(e) {e.preventDefault(); knobs.color.active = true;},
        alpha: function(e) {e.preventDefault(); knobs.alpha.active = true;}
      },
      move: _moveHandler,
      end: _endHandler
    };

    knobs.hue.elem.addEventListener(events.start, handlers.start.hue);
    knobs.color.elem.addEventListener(events.start, handlers.start.color);
    knobs.alpha.elem.addEventListener(events.start, handlers.start.alpha);

    document.addEventListener(events.move, handlers.move);
    document.addEventListener(events.end, handlers.end);

    return {

    }
  }

  // export CCPicker
  w.CCPicker = CCPicker;
  // if $, add the plugin
  if (typeof $ == 'function') {
    $.fn.ccpicker = function(options) {
      jQueryEnabled = true;
      return this.each(function() {
        var el = $(this);
        var inst = el.data('ccpicker');
        if(!inst) {
          el.data('ccpicker', new CCPicker(this, options || {}));
        } 
      });
    }
  }

})(window, document, window.jQuery || window.Zepto);
