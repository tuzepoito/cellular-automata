// JavaScript implementation of 1-dimensional, 2-state cellular automata
// (also known as "Elementary Cellular Automata")
// author: Cédric "tuzepoito" Chartron

var TABLE_WIDTH = 160;
var TABLE_HEIGHT = 64;
var CANVAS_SIZE = 4;
var COLOR_WHITE = 0xFFFFFFFF;
var COLOR_BLACK = 0xFF000000;
var TYPE_SIMPLE = 0;
var TYPE_RANDOM = 1;

var rule = [0,1,0,1,1,0,1,0];

var canvas;

var image;
var u8cimage; // Uint8Clamped
var u32image;
var currentLine = 1;
var offset = 0;
var currentType = TYPE_SIMPLE;
var wrap = true;

function setPixel(x, y, color) {
  u32image[y * TABLE_WIDTH + x] = color;
}

function applyRule(left, center, right) {
  return rule[4 * (left == COLOR_WHITE ? 0 : 1) + 2 * (center == COLOR_WHITE ? 0 : 1) +
    (right == COLOR_WHITE ? 0 : 1)] == 0 ? COLOR_WHITE : COLOR_BLACK;
}

function reset() {
  offset = 0;
  currentLine = 1;

  while (offset < u32image.length) {
    u32image[offset++] = COLOR_WHITE;
  }

  if (currentType == TYPE_SIMPLE) {
    setPixel(~~(TABLE_WIDTH / 2), 0, COLOR_BLACK);
  } else {
    offset = 0;
    while (offset < TABLE_WIDTH)
      u32image[offset++] = Math.random() < 0.5 ? COLOR_WHITE : COLOR_BLACK;
  }
}

function step() {
  if (currentLine == TABLE_HEIGHT) {
    offset = 0;
    while (offset < u32image.length - TABLE_WIDTH) {
      u32image[offset] = u32image[offset + TABLE_WIDTH];
      offset++;
    }
  } else {
    offset = TABLE_WIDTH * currentLine;
  }

  // unrolling loop for performance (?)
  var left = u32image[offset-1];
  var center = u32image[offset-TABLE_WIDTH];
  var right = u32image[offset-TABLE_WIDTH+1];

  if (wrap)
    u32image[offset++] = applyRule(left, center, right);
  else
    u32image[offset++] = center;

  for (var i = 1; i < TABLE_WIDTH-1; i++) {
    left = center;
    center = right;
    right = u32image[offset-TABLE_WIDTH+1];
    u32image[offset++] = applyRule(left, center, right);
  }

  if (wrap) {
    left = center;
    center = right;
    right = u32image[offset-2*TABLE_WIDTH+1];
    u32image[offset] = applyRule(left, center, right);
  } else {
    u32image[offset] = right;
  }

  if (currentLine < TABLE_HEIGHT) {
    currentLine++;
  }
}

var buttons = new Array(8);

function updateHash() {
  console.log("hash updated " + location.hash);
  // parse hash
  var ruleNum = parseInt(location.hash.substr(1), 10);
  if (!isNaN(ruleNum) && ruleNum >= 0 && ruleNum < 256) {
    for (var i = 0; i < 8; i++) {
      rule[i] = (ruleNum & 1) == 0 ? 0 : 1;
      ruleNum >>= 1;
    }
  }
  for (var i = 0; i < 8; i++) {
    buttons[i].className = rule[i] == 0 ? "white" : "black";
  }
  console.log(rule);

  reset();
}

window.onload = function () {
  var controls = document.getElementById("controls");
  for (var i = 7; i >= 0; i--) {
    var td = document.createElement('td');
    var el = document.createElement('div');
    el.onclick = (function(i) {
      return function() {
        var newhash = 0;
        for (var k = 7; k >= 0; k--) {
          newhash *= 2;
          if (k == i) {
            newhash += rule[k] == 0 ? 1 : 0;
          } else {
            newhash += rule[k] == 0 ? 0 : 1;
          }
        }
        location.hash = '#' + newhash;
      };
    })(i);
    buttons[i] = el;
    td.appendChild(el);

    controls.appendChild(td);
  }

  document.getElementById("reset-simple").onclick = function() {
    currentType = TYPE_SIMPLE;
    reset();
  };

  document.getElementById("reset-random").onclick = function() {
    currentType = TYPE_RANDOM;
    reset();
  };

  var checkWrap = document.getElementById("wrap");
  wrap = checkWrap.checked;
  checkWrap.onclick = function () {
    wrap = checkWrap.checked;
    reset();
  }

  window.onhashchange = updateHash;

  canvas = document.getElementById('canvas');
  canvas.width = TABLE_WIDTH;
  canvas.height = TABLE_HEIGHT;
  canvas.style.width = TABLE_WIDTH * CANVAS_SIZE + "px";
  canvas.style.height = TABLE_HEIGHT * CANVAS_SIZE + "px";

  var ctx = canvas.getContext('2d');

  image = ctx.createImageData(TABLE_WIDTH, TABLE_HEIGHT);
  u8cimage = image.data; // Uint8Clamped
  u32image = new Uint32Array(u8cimage.buffer);

  updateHash();

  var index = 0;
  requestAnimationFrame(function render() {
    if (index++ % 2 == 0) {
      step();
      ctx.putImageData(image, 0, 0);
    }
    requestAnimationFrame(render);
  });
};
