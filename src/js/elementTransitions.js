/**
 * ElementTransitions.js
 * Initially by @dan-silver
 * Re-mastered version by @hugohil
 *
 * @todo Support an autoload attribute
 */
var ElementTransitions = function(){
  var self = this;

  /**
   * [init description]
   * @return {void}
   */
  function init (afterAnimation){
    self.animationEndEventName = getAnimationEndVendorName();
    self.supportedEvents = ['click', 'touchend'];
    self.afterAnimation = afterAnimation;

    var blocks = document.querySelectorAll('.et-block');
    for (var i = 0; i < blocks.length; i++) {
      initializeBlock(blocks[i]);
    };

    var wrappers = document.querySelectorAll(".et-wrapper");
    for (var i = 0; i < wrappers.length; i++) {
      var wrapper = wrappers[i];
      wrapper.loop = wrapper.getAttribute('et-loop') || true;
      wrapper.multiTrigger = wrapper.getAttribute('et-multi-trigger') || false;
      wrapper.noTrigger = wrapper.getAttribute('et-no-trigger') || false;
      wrapper.dataset.current = 0;
      toggleClass(wrapper.querySelectorAll('.et-block')[wrapper.dataset.current], 'et-block-current');
      wrapper.dataset.isAnimating = false;

      var trigger = document.querySelectorAll(wrapper.getAttribute('et-trigger-selector'));
      if(!trigger.length){
        trigger = (wrapper.className.indexOf('et-trigger') > -1) ? wrapper : wrapper.querySelector('.et-trigger');
      }
      initializeAnimations(trigger, wrapper);
    }
  }

  /**
   * Create required attributes on a specific element
   * @param  {HTMLElement} block The block to apply attributes
   * @return {void}
   */
  function initializeBlock (block){
    block.dataset.originalClassList = block.className;
  }

  /**
   * Initialize event handlers and animations.
   * @param  {HTMLElement} trigger The HTML element on which you click to trigger animations.
   * @param  {HTMLElement} wrapper The HTML element containing the blocks (may be the same as trigger).
   * @return {void}
   */
  function initializeAnimations (triggers, wrapper){
    if(!wrapper.noTrigger) return;

    triggers = (wrapper.multiTrigger == 'true') ? triggers : [triggers];
    for (var i = 0; i < triggers.length; i++) {
      var trigger = triggers[i];
      addMultipleEventsListener(trigger, self.supportedEvents, function (event){
        trigger = event.target;
        // Not sure if the `event.preventDefault()` is a good idea. Need to cancel double events on touch devices.
        // I'm open to suggestions: ping @hugohil pretty much anywhere :)
        event.preventDefault();
        // `trigger` variable here is in reality the last passed in the loop. Need to scope this.
        animate(wrapper, trigger);
      });
    }
  }

  /**
   * Acutally animate the element
   * @param  {HTMLElement} trigger The HTML element on which you clicked to trigger animations.
   * @param  {HTMLElement} wrapper The HTML element containing the blocks (may be the same as trigger).
   * @return {void}
   */
  function animate(wrapper, trigger){
    var step = trigger.getAttribute('et-step') || 1,
        blocks = wrapper.querySelectorAll('.et-block'),
        current = wrapper.dataset.current,
        currentBlock = blocks[current],
        reverse = (trigger.getAttribute('et-reverse') == 'true'),
        overflow = null;

    if(reverse){
      overflow = (+current - +step) < 0;
    } else {
      overflow = (+current + +step) > (blocks.length - 1);
    }

    if((wrapper.dataset.isAnimating == 'true') || (overflow && wrapper.loop == 'false')){
      return false;
    }
    wrapper.dataset.isAnimating = true;

    var outAttribute = (trigger.getAttribute('et-out')) ? trigger.getAttribute('et-out') : wrapper.getAttribute('et-out'),
        inAttribute = (trigger.getAttribute('et-in')) ? trigger.getAttribute('et-in') : wrapper.getAttribute('et-in');

    if(!outAttribute || !inAttribute){
      console.error('elementTransitions.js - No `et-out` or `et-in` attribute specified.');
    }

    var outClass = formatClass(outAttribute),
        inClass = formatClass(inAttribute);

    for (var i = 0; i < outClass.length; i++) {
      toggleClass(currentBlock, outClass[i]);
    }

    currentBlock.addEventListener(self.animationEndEventName, function (event){
      currentBlock.removeEventListener(self.animationEndEventName, arguments.callee);

      // Switch current block
      var prevBlock = currentBlock;
      // + operator in front of variable cast it to Number(). Less readable but more concise.
      if(reverse){
        current = (overflow) ? (+current - +step) + blocks.length : +current - +step;
      } else {
        current = (overflow) ? (+current + +step) - blocks.length : +current + +step;
      }
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
        if(typeof self.afterAnimation == 'function'){
          self.afterAnimation(prevBlock, currentBlock);
        }
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

  /**
   * return isAnimating property
   * @param {HTMLElement} wrapper the wrapper on which to check.
   * @return {Boolean} weither an animation is currently processing or not.
   */
  function getIsAnimating (wrapper){
    wrapper = (wrapper.length) ? wrapper[0] : wrapper;
    return wrapper.dataset.isAnimating;
  }

  /**
   * reset the data-current attribute for the wrapper
   * @param  {HTMLElement} wrapper wrapper to reset
   * @return {void}
   */
  function resetCurrent (wrapper){
    wrapper = (wrapper.length) ? wrapper[0] : wrapper;
    wrapper.dataset.current = 0;
  }

  return {
    init: init,
    animate: animate,
    initializeBlock: initializeBlock,
    isAnimating: getIsAnimating,
    resetCurrent: resetCurrent
  }
}

var elementTransitions = ElementTransitions();