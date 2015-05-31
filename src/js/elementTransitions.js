var PageTransitions = (function() {
  var each = function(query, callback) {
    return Array.prototype.slice.call(document.querySelectorAll(query), 0).map(callback);
  };
  String.prototype.bool = function() {
    return (/^true$/i).test(this);
  };
  var startElement = 0,
  animEndEventNames = {
    'WebkitAnimation': 'webkitAnimationEnd',
    'OAnimation': 'oAnimationEnd',
    'msAnimation': 'MSAnimationEnd',
    'animation': 'animationend'
  };

  function getTransitionPrefix() {
    var b = document.body || document.documentElement;
    var s = b.style;
    var p = 'animation';
    if(typeof s[p] == 'string'){
      return 'animation';
    }

    // Tests for vendor specific prop
    var v = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'],
    p = p.charAt(0).toUpperCase() + p.substr(1);
    for( var i=0; i<v.length; i++ ) {
      if(typeof s[v[i] + p] == 'string')
        return v[i] + p;
    }
    return false;
  }
  // animation end event name
  animEndEventName = animEndEventNames[getTransitionPrefix()];

  function init() {
    each(".et-page", function(elem) {
      elem.setAttribute('originalClassList', elem.className);
    });
    each(".et-wrapper", function(elem) {
      elem.setAttribute('current', 0);
      elem.setAttribute('isAnimating', false);
      elem.querySelectorAll(".et-page")[startElement].classList.add('et-page-current');
    });
    each(".et-rotate", function(elem) {
      elem.addEventListener('click', function() {
        animate(this);
      });
    });
  }

  function animate(block, callback) {
    var outClass = formatClass(block.getAttribute('et-out')),
        inClass  = formatClass(block.getAttribute('et-in')),
        step     = block.getAttribute('et-step')

    if (step === undefined)
      step = 1;

    if (block.classList.contains('et-rotate') && !block.classList.contains('et-wrapper')) {
      block = block.parentNode;
      if (!block.classList.contains('et-wrapper')) {
        block = block.parentNode;
      }
    }

    var current = parseInt(block.getAttribute('current'), 10),
      $pages = block.querySelectorAll('.et-page'),
      pagesCount = $pages.length,
      endCurrPage = false,
      endNextPage = false;

    if (block.getAttribute('isAnimating') && block.getAttribute('isAnimating').bool()) {
      return false;
    }

    block.setAttribute('isAnimating', true);
    var $currPage = $pages[current];
    current = current*1 + step*1;
    if (current >= pagesCount) {
      current=0;
    }

    block.setAttribute('current', current);

    var $nextPage = $pages[current];

    outClass.forEach(function(c) {
      $currPage.classList.add(c);
    });

    $currPage.addEventListener(animEndEventName, function handlecurr() {
      this.removeEventListener(animEndEventName, handlecurr);
      endCurrPage = true;
      if (endNextPage) {
        if(typeof(callback) === "function") {
          callback(block, $nextPage, this);
        }
        onEndAnimation(this, $nextPage, block);
      }
    });

    inClass.forEach(function(c) {
      $nextPage.classList.add(c);
    });
    $nextPage.classList.add('et-page-current');
    $nextPage.addEventListener(animEndEventName, function handlenext() {
      this.removeEventListener(animEndEventName, handlenext);
      endNextPage = true;
      if(endCurrPage) {
        onEndAnimation($currPage, this, block);
      }
    });
  }

  function onEndAnimation($outpage, $inpage, block) {
    resetPage($outpage, $inpage);
    block.setAttribute('isAnimating', false);
    // $outpage.trigger("animation.out.complete");
    // $inpage.trigger("animation.in.complete");
  }

  function resetPage($outpage, $inpage) {
    $inpage.className = $inpage.getAttribute('originalClassList') + ' et-page-current';
    $outpage.className = $outpage.getAttribute('originalClassList');
  }

  function formatClass(str) {
    var classes = str.split(" ");
    var output = [];
    for(var i = 0; i < classes.length; i++) {
      output.push("pt-page-" + classes[i]);
    }
    return output;
  }

  return {
    init : init,
    animate: animate
  };
})();

document.addEventListener('DOMContentLoaded', function(){
  PageTransitions.init();
});