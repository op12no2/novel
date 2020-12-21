
var version = '7.0';

// globals

var gt      = 10000.0;                 // population
var gs      = 9999.0;                  // suscpetibles
var gi      = 1.0;                    // infected
var gp      = 6000.0;                  // max prevalence
var gcmax   = 0.6;                    // max contact rate (first curve)
var gcmin   = 0.25;                    // min contact rate (slider)
var gcgov   = 0.05;                   // intervention contact rate
var gigov   = 20;                     // intervention iterations
var gk      = 0.1;                    // recovery rate
var gz      = 300;                    // model iterations
var gres    = 100;                    // slider resolution
var gcrate  = (gcmax - gcmin) / gres; // scaling factor for contact rate slider
var gpeak   = 0;                      // the peak of the second curve 
var gx      = 480;                    // canvas width
var gy      = 200;                    // canvas height
var gw      = 3;                      // line width
var gh      = 50;                     // healthcare threshold in pixels 

var gColOverload  = "#DB5F40";
var gColCapacity  = "#A8D49A";
var gColCurve1    = "#FFFFFF";
var gColCurve2    = "#FFFFFF";
var gColCurve3    = "#FFFFFF";
  
var score = 0;

function px(x) {
  return x * gx/gz;
}

function py (y) {
  return gy - y * gy/gp - gw;
}

//  funcs

function sir1() {

  var ss = gs;
  var ii = gi;
  var rr = gt - ss - ii;

  ctx.fillStyle = '#1b4f72';
  //ctx.fillRect(0,0,gx,gy-gh);
  ctx.fillRect(0,0,gx,gy);

  //ctx.fillStyle = '#216a8c';
  //ctx.fillRect(0,gy-gh,gx,gh);

  ctx.fillStyle = '#bbbbbb';
  ctx.fillRect(px(i1Start()),0,px(i1End()-i1Start()),10);

  ctx.fillStyle = '#cccccc';
  ctx.fillRect(px(i2Start()),0,px(i2End()-i2Start()),10);

  ctx.beginPath();
  ctx.strokeStyle = '#eeeeee';
  ctx.lineWidth   = 1;
  ctx.moveTo(px(i1Start()),0);
  ctx.lineTo(px(i1Start()),gy);
  ctx.moveTo(px(i1End()),0);
  ctx.lineTo(px(i1End()),gy);
  ctx.moveTo(px(i2Start()),0);
  ctx.lineTo(px(i2Start()),gy);
  ctx.moveTo(px(i2End()),0);
  ctx.lineTo(px(i2End()),gy);
  ctx.stroke();

  ctx.beginPath();

  ctx.strokeStyle = gColCurve1;
  ctx.lineWidth   = gw;

  ctx.setLineDash([3,5]);
  ctx.moveTo(px(0),py(ii));

  for (var i=1; i<gz; i++) {

    var sf = ss / gt;
  
    var infected = gcmax * sf * ii;

    var ssa = ss - infected;
    var iia = ii + infected - gk * ii;
    var rra = rr + gk * ii;

    ss = ssa;
    ii = iia;
    rr = rra;

    ctx.lineTo(px(i),py(ii));
  }

  ctx.stroke();
}

function sir2() {

  gpeak = 0;

  var ss = gs;
  var ii = gi;
  var rr = gt - ss - ii;

  ctx.beginPath();

  ctx.strokeStyle = gColCurve2;
  ctx.lineWidth   = gw;

  ctx.setLineDash([2,3]);
  ctx.moveTo(px(0),py(ii));

  for (var i=1; i<gz; i++) {

    var lastii   = ii;
    var sf       = ss / gt;
    var infected = gcmin * sf * ii;

    var ssa = ss - infected;
    var iia = ii + infected - gk * ii;
    var rra = rr + gk * ii;

    ss = ssa;
    ii = iia;
    rr = rra;

    if (!gpeak && ii < lastii) {
      gpeak = i;  
    }

    ctx.lineTo(px(i),py(ii));
  }

  ctx.stroke();
}

var cInfected     = 1;
var cOverload     = 10;
var cIntervention = 150;
var cDisruption   = 0.7;

function sir3() {

  var ss = gs;
  var ii = gi;
  var rr = gt - ss - ii;
  var cc = 0.0;

  var cost = gi;

  ctx.beginPath();
  
  ctx.strokeStyle = gColCurve3;
  ctx.lineWidth   = gw;

  ctx.setLineDash([]);
  ctx.moveTo(px(0),py(ii));

  for (var i=1; i<gz; i++) {

    var sf = ss / gt;

    if (bslide && i > i1Start() && i < i1End()) { 
      cc = gcgov; 
      //cost += cIntervention;
    }
    else if (fslide && i > i2Start() && i < i2End()) { 
      cc = gcgov; 
      //cost += cIntervention;
    }
    else 
      cc = gcmin;

    var infected = cc * sf * ii;

    var ssa = ss - infected;
    var iia = ii + infected - gk * ii;
    var rra = rr + gk * ii;

    ss = ssa;
    ii = iia;
    rr = rra;

    cost += infected;

    //cost += ii * cInfected;    

    //if (ii/3 > gh) {
      //cost += (ii/3-gh) * cOverload;
    //}

    //cost += ii * (0.6/gcmin) * cDisruption;

    ctx.lineTo(px(i),py(ii));
  }

  ctx.stroke();

  score = Math.round(cost);

  ctx.font = "40px Sans Serif";
  ctx.fillStyle = "white";
  ctx.fillText(score,390,40);
}

var dslide      = 0;  // social distancing slider
var islide      = 0;  // social intervention slider
var islideCache = 0;
var bslide      = 0;
var cslide      = 0;
var fslide      = 0;
var eslide      = 0;

var canvas = 0;
var ctx    = 0;

function islideUpdate() {
  islide = gpeak - islideCache * gpeak / gres | 0;
}

function gcminUpdate() {
  gcmin  = gcmax - dslide * gcrate;
}

function i1Start () {
  return bslide;
}

function i1End () {
  return i1Start() + cslide/3;
}

function i2Start () {
  return i1End() + fslide;
}

function i2End () {
  return i2Start() + eslide/4;
}

$(function() {

  gcminUpdate();

  $('#ver').html(version);

  canvas = document.getElementById("graphs");
  ctx    = canvas.getContext("2d");

  $('#aslider').on('input', function (e) {
    dslide = parseInt($('#aslider').val());
    gcminUpdate();
    sir1()
    sir2();
    islideUpdate(); 
    sir3();
  });

  $('#bslider').on('input', function (e) {
    bslide = parseInt($('#bslider').val());
    sir1()
    sir2();
    sir3();
  });
  $('#cslider').on('input', function (e) {
    cslide = parseInt($('#cslider').val());
    //console.log(cslide);
    sir1()
    sir2();
    sir3();
  });
  $('#dslider').on('input', function (e) {
    fslide = parseInt($('#dslider').val());
    sir1()
    sir2();
    sir3();
  });
  $('#eslider').on('input', function (e) {
    eslide = parseInt($('#eslider').val());
    sir1()
    sir2();
    sir3();
  });

  sir1();
  sir2();
  islide = gpeak;
  sir3();

});



