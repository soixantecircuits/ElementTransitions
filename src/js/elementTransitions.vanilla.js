/**
 * ElementTransition.js
 * Initially by @dan-silver
 * Re-mastered version by @hugohil
 *
 * @todo Support an autoload attribute
 */
var ElementTransition = function(){
  var self = this;

  /**
   * [init description]
   * @return {void}
   */
  function init (){
    self.animationEndEventName = getAnimationEndVendorName();
    self.supportedEvents = ['click', 'touchend'];

    var blocks = document.querySelectorAll('.et-block');
    for (var i = 0; i < blocks.length; i++) {
      blocks[i].dataset.originalClassList = blocks[i].className;
    };

    var wrappers = document.querySelectorAll(".et-wrapper");
    for (var i = 0; i < wrappers.length; i++) {
      var wrapper = wrappers[i];
      wrapper.dataset.current = 0;
      toggleClass(wrapper.querySelectorAll('.et-block')[wrapper.dataset.current], 'et-block-current');
      wrapper.dataset.isAnimating = false;

      var trigger = (wrapper.className.indexOf('et-trigger') > -1) ? wrapper : wrapper.querySelector('.et-trigger');
      initializeAnimations(trigger, wrapper);
    }
  }

  /**
   * Initialize event handlers and animations.
   * @param  {HTMLElement} trigger The HTML element on which you clickt to trigger animations.
   * @param  {HTMLElement} wrapper The HTML element containing the blocks (may be the same as trigger).
   * @return {void}
   */
  function initializeAnimations (trigger, wrapper){
    var step = trigger.getAttribute('et-step') || 1,
        blocks = wrapper.querySelectorAll('.et-block'),
        current = wrapper.dataset.current;

    var currentBlock = blocks[current];

    addMultipleEventsListener(trigger, self.supportedEvents, function (event){
      // Not sure if the `event.preventDefault()` is a good idea. Need to cancel double events on touch devices.
      // I'm open to suggestions: ping @hugohil pretty much anywhere :)
      event.preventDefault();
      if(wrapper.dataset.isAnimating == 'true'){
        return false;
      }
      wrapper.dataset.isAnimating = true;

      var outClass = formatClass(trigger.getAttribute('et-out')),
          inClass = formatClass(trigger.getAttribute('et-in'));

      for (var i = 0; i < outClass.length; i++) {
        toggleClass(currentBlock, outClass[i]);
      }

      currentBlock.addEventListener(self.animationEndEventName, function (event){
        currentBlock.removeEventListener(self.animationEndEventName, arguments.callee);

        // Switch current block
        var prevBlock = currentBlock;
        current = ((Number(current) + step) > blocks.length - 1) ? 0 : Number(current) + step;
        wrapper.dataset.current = current;
        currentBlock = blocks[current];

        for (var i = 0; i < inClass.length; i++) {
          toggleClass(currentBlock, inClass[i]);
          toggleClass(currentBlock, 'et-block-current');
        }

        currentBlock.addEventListener(self.animationEndEventName, function (event){
          currentBlock.removeEventListener(self.animationEndEventName, arguments.callee);

          prevBlock.className = prevBlock.dataset.originalClassList;
          currentBlock.className = currentBlock.dataset.originalClassList + ' et-block-current';

          wrapper.dataset.isAnimating = false;
        });
      });
    });
  }

  /**
   * Utilities functions
   */

  /**
   * Browser may have vendor prefix for the animationend event
   * @link https://developer.mozilla.org/en-US/docs/Web/Events/animationend
   * @return {String} The browser animationend event name.
   */
  function getAnimationEndVendorName(){
    var postfix = 'Animation';
    var animationEndEventNames = {
      'WebkitAnimation': 'webkitAnimationEnd',
      'OAnimation': 'oAnimationEnd',
      'msAnimation': 'MSAnimationEnd',
      'animation': 'animationend'
    }

    if(typeof document.body.style[postfix] == 'string'){
      return animationEndEventNames[postfix.toLowerCase()];
    }

    var vendors = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'];
    for(var i = 0; i < vendors.length; i++){
      if(typeof document.body.style[vendors[i] + postfix] == 'string'){
        return animationEndEventNames[vendors[i] + postfix];
      }
    }
    return false;
  }

  /**
   * Will prefix input to match CSS animation classes.
   * @param  {String} input The string to be concatenate with animation class prefix.
   * @return {void}
   */
  function formatClass (input) {
    var output = [];
    var classes = input.split(/\s/);
    for(var i = 0; i < classes.length; i++){
      output.push('et-' + classes[i]);
    }
    return output;
  }

  /**
   * This binds multiples event listeners to a single HTML element.
   * @param {HTMLElement} element The element to bind the events.
   * @param {Events[]} events An array of Events.
   * @param {Function} handler The function to be called when one of the events is triggered.
   * @return {void}
   */
  function addMultipleEventsListener (element, events, handler){
    for (var i = 0; i < events.length; i++) {
      element.addEventListener(events[i], function (event){
        handler(event);
      });
    }
  }

  /**
   * Toggle a class on a single HTML element.
   * @param  {HTMLElement} element The element to modify.
   * @param  {String} classname The class to be toggled.
   * @return {void}
   */
  function toggleClass(element, classname){
    var re = new RegExp(classname, 'gi');
    element.className = (element.className.indexOf(classname) > -1) ? element.className.replace(re, '') : element.className + ' ' + classname;
  }

  return {
    init: init
  }
}

var elementTransition = ElementTransition();
elementTransition.init();