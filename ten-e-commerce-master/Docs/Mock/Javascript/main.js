(function e(t, n, r) {
  function s(o, u) {
      if (!n[o]) {
          if (!t[o]) {
              var a = typeof require == "function" && require;
              if (!u && a) return a(o, !0);
              if (i) return i(o, !0);
              var f = new Error("Cannot find module '" + o + "'");
              throw f.code = "MODULE_NOT_FOUND", f
          }
          var l = n[o] = {exports: {}};
          t[o][0].call(l.exports, function (e) {
              var n = t[o][1][e];
              return s(n ? n : e)
          }, l, l.exports, e, t, n, r)
      }
      return n[o].exports
  }

  var i = typeof require == "function" && require;
  for (var o = 0; o < r.length; o++) s(r[o]);
  return s
})({
  1: [function (require, module, exports) {
      /*!
       * perfect-scrollbar v1.3.0
       * (c) 2017 Hyunje Jun
       * @license MIT
       */
      'use strict';

      function get(element) {
          return getComputedStyle(element);
      }

      function set(element, obj) {
          for (var key in obj) {
              var val = obj[key];
              if (typeof val === 'number') {
                  val = val + "px";
              }
              element.style[key] = val;
          }
          return element;
      }

      function div(className) {
          var div = document.createElement('div');
          div.className = className;
          return div;
      }

      var elMatches =
          typeof Element !== 'undefined' &&
          (Element.prototype.matches ||
              Element.prototype.webkitMatchesSelector ||
              Element.prototype.msMatchesSelector);

      function matches(element, query) {
          if (!elMatches) {
              throw new Error('No element matching method supported');
          }

          return elMatches.call(element, query);
      }

      function remove(element) {
          if (element.remove) {
              element.remove();
          } else {
              if (element.parentNode) {
                  element.parentNode.removeChild(element);
              }
          }
      }

      function searchPages(name) {
          var brand = $("#select_brand_id").val();
          var country = $("#select_country_id").val();
          var language = $("#select_language_id").val();
          if (brand !== null && country !== null && language !== null) {
              $.ajax({
                  type: 'POST',
                  url: route('pages.search'),
                  data: {
                      brand_id: brand,
                      country_id: country,
                      language_id: language,
                      name: name,
                  },
                  statusCode: {
                      419: function () {
                          window.location.href = URL_PROJECT;
                      }
                  },
                  success: function (r) {
                      if (r.code === 200) {
                          $("#panel").css('display', 'block');
                          $('#sort-wrap').html(r.data);
                      } else {
                          $("#panel").css('display', 'none');
                          $('#sort-wrap').html(r.data);
                      }
                  }
              });
          }
      }

      function queryChildren(element, selector) {
          return Array.prototype.filter.call(element.children, function (child) {
                  return matches(child, selector);
              }
          );
      }

      var cls = {
          main: 'ps',
          element: {
              thumb: function (x) {
                  return ("ps__thumb-" + x);
              },
              rail: function (x) {
                  return ("ps__rail-" + x);
              },
              consuming: 'ps__child--consume',
          },
          state: {
              focus: 'ps--focus',
              active: function (x) {
                  return ("ps--active-" + x);
              },
              scrolling: function (x) {
                  return ("ps--scrolling-" + x);
              },
          },
      };

      /*
       * Helper methods
       */
      var scrollingClassTimeout = {x: null, y: null};

      function addScrollingClass(i, x) {
          var classList = i.element.classList;
          var className = cls.state.scrolling(x);

          if (classList.contains(className)) {
              clearTimeout(scrollingClassTimeout[x]);
          } else {
              classList.add(className);
          }
      }

      function removeScrollingClass(i, x) {
          scrollingClassTimeout[x] = setTimeout(
              function () {
                  return i.isAlive && i.element.classList.remove(cls.state.scrolling(x));
              },
              i.settings.scrollingThreshold
          );
      }

      function setScrollingClassInstantly(i, x) {
          addScrollingClass(i, x);
          removeScrollingClass(i, x);
      }

      var EventElement = function EventElement(element) {
          this.element = element;
          this.handlers = {};
      };

      var prototypeAccessors = {isEmpty: {configurable: true}};

      EventElement.prototype.bind = function bind(eventName, handler) {
          if (typeof this.handlers[eventName] === 'undefined') {
              this.handlers[eventName] = [];
          }
          this.handlers[eventName].push(handler);
          this.element.addEventListener(eventName, handler, false);
      };

      EventElement.prototype.unbind = function unbind(eventName, target) {
          var this$1 = this;

          this.handlers[eventName] = this.handlers[eventName].filter(function (handler) {
              if (target && handler !== target) {
                  return true;
              }
              this$1.element.removeEventListener(eventName, handler, false);
              return false;
          });
      };

      EventElement.prototype.unbindAll = function unbindAll() {
          var this$1 = this;

          for (var name in this$1.handlers) {
              this$1.unbind(name);
          }
      };

      prototypeAccessors.isEmpty.get = function () {
          var this$1 = this;

          return Object.keys(this.handlers).every(
              function (key) {
                  return this$1.handlers[key].length === 0;
              }
          );
      };

      Object.defineProperties(EventElement.prototype, prototypeAccessors);

      var EventManager = function EventManager() {
          this.eventElements = [];
      };

      EventManager.prototype.eventElement = function eventElement(element) {
          var ee = this.eventElements.filter(function (ee) {
              return ee.element === element;
          })[0];
          if (!ee) {
              ee = new EventElement(element);
              this.eventElements.push(ee);
          }
          return ee;
      };

      EventManager.prototype.bind = function bind(element, eventName, handler) {
          this.eventElement(element).bind(eventName, handler);
      };

      EventManager.prototype.unbind = function unbind(element, eventName, handler) {
          var ee = this.eventElement(element);
          ee.unbind(eventName, handler);

          if (ee.isEmpty) {
              // remove
              this.eventElements.splice(this.eventElements.indexOf(ee), 1);
          }
      };

      EventManager.prototype.unbindAll = function unbindAll() {
          this.eventElements.forEach(function (e) {
              return e.unbindAll();
          });
          this.eventElements = [];
      };

      EventManager.prototype.once = function once(element, eventName, handler) {
          var ee = this.eventElement(element);
          var onceHandler = function (evt) {
              ee.unbind(eventName, onceHandler);
              handler(evt);
          };
          ee.bind(eventName, onceHandler);
      };

      function createEvent(name) {
          if (typeof window.CustomEvent === 'function') {
              return new CustomEvent(name);
          } else {
              var evt = document.createEvent('CustomEvent');
              evt.initCustomEvent(name, false, false, undefined);
              return evt;
          }
      }

      var processScrollDiff = function (
          i,
          axis,
          diff,
          useScrollingClass,
          forceFireReachEvent
      ) {
          if (useScrollingClass === void 0) useScrollingClass = true;
          if (forceFireReachEvent === void 0) forceFireReachEvent = false;

          var fields;
          if (axis === 'top') {
              fields = [
                  'contentHeight',
                  'containerHeight',
                  'scrollTop',
                  'y',
                  'up',
                  'down'];
          } else if (axis === 'left') {
              fields = [
                  'contentWidth',
                  'containerWidth',
                  'scrollLeft',
                  'x',
                  'left',
                  'right'];
          } else {
              throw new Error('A proper axis should be provided');
          }

          processScrollDiff$1(i, diff, fields, useScrollingClass, forceFireReachEvent);
      };

      function processScrollDiff$1(
          i,
          diff,
          ref,
          useScrollingClass,
          forceFireReachEvent
      ) {
          var contentHeight = ref[0];
          var containerHeight = ref[1];
          var scrollTop = ref[2];
          var y = ref[3];
          var up = ref[4];
          var down = ref[5];
          if (useScrollingClass === void 0) useScrollingClass = true;
          if (forceFireReachEvent === void 0) forceFireReachEvent = false;

          var element = i.element;

          // reset reach
          i.reach[y] = null;

          // 1 for subpixel rounding
          if (element[scrollTop] < 1) {
              i.reach[y] = 'start';
          }

          // 1 for subpixel rounding
          if (element[scrollTop] > i[contentHeight] - i[containerHeight] - 1) {
              i.reach[y] = 'end';
          }

          if (diff) {
              element.dispatchEvent(createEvent(("ps-scroll-" + y)));

              if (diff < 0) {
                  element.dispatchEvent(createEvent(("ps-scroll-" + up)));
              } else if (diff > 0) {
                  element.dispatchEvent(createEvent(("ps-scroll-" + down)));
              }

              if (useScrollingClass) {
                  setScrollingClassInstantly(i, y);
              }
          }

          if (i.reach[y] && (diff || forceFireReachEvent)) {
              element.dispatchEvent(createEvent(("ps-" + y + "-reach-" + (i.reach[y]))));
          }
      }

      function toInt(x) {
          return parseInt(x, 10) || 0;
      }

      function isEditable(el) {
          return (
              matches(el, 'input,[contenteditable]') ||
              matches(el, 'select,[contenteditable]') ||
              matches(el, 'textarea,[contenteditable]') ||
              matches(el, 'button,[contenteditable]')
          );
      }

      function outerWidth(element) {
          var styles = get(element);
          return (
              toInt(styles.width) +
              toInt(styles.paddingLeft) +
              toInt(styles.paddingRight) +
              toInt(styles.borderLeftWidth) +
              toInt(styles.borderRightWidth)
          );
      }

      var env = {
          isWebKit:
              typeof document !== 'undefined' &&
              'WebkitAppearance' in document.documentElement.style,
          supportsTouch:
              typeof window !== 'undefined' &&
              ('ontouchstart' in window ||
                  (window.DocumentTouch && document instanceof window.DocumentTouch)),
          supportsIePointer:
              typeof navigator !== 'undefined' && navigator.msMaxTouchPoints,
          isChrome:
              typeof navigator !== 'undefined' &&
              /Chrome/i.test(navigator && navigator.userAgent),
      };

      var updateGeometry = function (i) {
          var element = i.element;

          i.containerWidth = element.clientWidth;
          i.containerHeight = element.clientHeight;
          i.contentWidth = element.scrollWidth;
          i.contentHeight = element.scrollHeight;

          if (!element.contains(i.scrollbarXRail)) {
              // clean up and append
              queryChildren(element, cls.element.rail('x')).forEach(function (el) {
                      return remove(el);
                  }
              );
              element.appendChild(i.scrollbarXRail);
          }
          if (!element.contains(i.scrollbarYRail)) {
              // clean up and append
              queryChildren(element, cls.element.rail('y')).forEach(function (el) {
                      return remove(el);
                  }
              );
              element.appendChild(i.scrollbarYRail);
          }

          if (
              !i.settings.suppressScrollX &&
              i.containerWidth + i.settings.scrollXMarginOffset < i.contentWidth
          ) {
              i.scrollbarXActive = true;
              i.railXWidth = i.containerWidth - i.railXMarginWidth;
              i.railXRatio = i.containerWidth / i.railXWidth;
              i.scrollbarXWidth = getThumbSize(
                  i,
                  toInt(i.railXWidth * i.containerWidth / i.contentWidth)
              );
              i.scrollbarXLeft = toInt(
                  (i.negativeScrollAdjustment + element.scrollLeft) *
                  (i.railXWidth - i.scrollbarXWidth) /
                  (i.contentWidth - i.containerWidth)
              );
          } else {
              i.scrollbarXActive = false;
          }

          if (
              !i.settings.suppressScrollY &&
              i.containerHeight + i.settings.scrollYMarginOffset < i.contentHeight
          ) {
              i.scrollbarYActive = true;
              i.railYHeight = i.containerHeight - i.railYMarginHeight;
              i.railYRatio = i.containerHeight / i.railYHeight;
              i.scrollbarYHeight = getThumbSize(
                  i,
                  toInt(i.railYHeight * i.containerHeight / i.contentHeight)
              );
              i.scrollbarYTop = toInt(
                  element.scrollTop *
                  (i.railYHeight - i.scrollbarYHeight) /
                  (i.contentHeight - i.containerHeight)
              );
          } else {
              i.scrollbarYActive = false;
          }

          if (i.scrollbarXLeft >= i.railXWidth - i.scrollbarXWidth) {
              i.scrollbarXLeft = i.railXWidth - i.scrollbarXWidth;
          }
          if (i.scrollbarYTop >= i.railYHeight - i.scrollbarYHeight) {
              i.scrollbarYTop = i.railYHeight - i.scrollbarYHeight;
          }

          updateCss(element, i);

          if (i.scrollbarXActive) {
              element.classList.add(cls.state.active('x'));
          } else {
              element.classList.remove(cls.state.active('x'));
              i.scrollbarXWidth = 0;
              i.scrollbarXLeft = 0;
              element.scrollLeft = 0;
          }
          if (i.scrollbarYActive) {
              element.classList.add(cls.state.active('y'));
          } else {
              element.classList.remove(cls.state.active('y'));
              i.scrollbarYHeight = 0;
              i.scrollbarYTop = 0;
              element.scrollTop = 0;
          }
      };

      function getThumbSize(i, thumbSize) {
          if (i.settings.minScrollbarLength) {
              thumbSize = Math.max(thumbSize, i.settings.minScrollbarLength);
          }
          if (i.settings.maxScrollbarLength) {
              thumbSize = Math.min(thumbSize, i.settings.maxScrollbarLength);
          }
          return thumbSize;
      }

      function updateCss(element, i) {
          var xRailOffset = {width: i.railXWidth};
          if (i.isRtl) {
              xRailOffset.left =
                  i.negativeScrollAdjustment +
                  element.scrollLeft +
                  i.containerWidth -
                  i.contentWidth;
          } else {
              xRailOffset.left = element.scrollLeft;
          }
          if (i.isScrollbarXUsingBottom) {
              xRailOffset.bottom = i.scrollbarXBottom - element.scrollTop;
          } else {
              xRailOffset.top = i.scrollbarXTop + element.scrollTop;
          }
          set(i.scrollbarXRail, xRailOffset);

          var yRailOffset = {top: element.scrollTop, height: i.railYHeight};
          if (i.isScrollbarYUsingRight) {
              if (i.isRtl) {
                  yRailOffset.right =
                      i.contentWidth -
                      (i.negativeScrollAdjustment + element.scrollLeft) -
                      i.scrollbarYRight -
                      i.scrollbarYOuterWidth;
              } else {
                  yRailOffset.right = i.scrollbarYRight - element.scrollLeft;
              }
          } else {
              if (i.isRtl) {
                  yRailOffset.left =
                      i.negativeScrollAdjustment +
                      element.scrollLeft +
                      i.containerWidth * 2 -
                      i.contentWidth -
                      i.scrollbarYLeft -
                      i.scrollbarYOuterWidth;
              } else {
                  yRailOffset.left = i.scrollbarYLeft + element.scrollLeft;
              }
          }
          set(i.scrollbarYRail, yRailOffset);

          set(i.scrollbarX, {
              left: i.scrollbarXLeft,
              width: i.scrollbarXWidth - i.railBorderXWidth,
          });
          set(i.scrollbarY, {
              top: i.scrollbarYTop,
              height: i.scrollbarYHeight - i.railBorderYWidth,
          });
      }

      var clickRail = function (i) {
          i.event.bind(i.scrollbarY, 'mousedown', function (e) {
              return e.stopPropagation();
          });
          i.event.bind(i.scrollbarYRail, 'mousedown', function (e) {
              var positionTop =
                  e.pageY -
                  window.pageYOffset -
                  i.scrollbarYRail.getBoundingClientRect().top;
              var direction = positionTop > i.scrollbarYTop ? 1 : -1;

              i.element.scrollTop += direction * i.containerHeight;
              updateGeometry(i);

              e.stopPropagation();
          });

          i.event.bind(i.scrollbarX, 'mousedown', function (e) {
              return e.stopPropagation();
          });
          i.event.bind(i.scrollbarXRail, 'mousedown', function (e) {
              var positionLeft =
                  e.pageX -
                  window.pageXOffset -
                  i.scrollbarXRail.getBoundingClientRect().left;
              var direction = positionLeft > i.scrollbarXLeft ? 1 : -1;

              i.element.scrollLeft += direction * i.containerWidth;
              updateGeometry(i);

              e.stopPropagation();
          });
      };

      var dragThumb = function (i) {
          bindMouseScrollHandler(i, [
              'containerWidth',
              'contentWidth',
              'pageX',
              'railXWidth',
              'scrollbarX',
              'scrollbarXWidth',
              'scrollLeft',
              'x']);
          bindMouseScrollHandler(i, [
              'containerHeight',
              'contentHeight',
              'pageY',
              'railYHeight',
              'scrollbarY',
              'scrollbarYHeight',
              'scrollTop',
              'y']);
      };

      function bindMouseScrollHandler(
          i,
          ref
      ) {
          var containerHeight = ref[0];
          var contentHeight = ref[1];
          var pageY = ref[2];
          var railYHeight = ref[3];
          var scrollbarY = ref[4];
          var scrollbarYHeight = ref[5];
          var scrollTop = ref[6];
          var y = ref[7];

          var element = i.element;

          var startingScrollTop = null;
          var startingMousePageY = null;
          var scrollBy = null;

          function mouseMoveHandler(e) {
              element[scrollTop] =
                  startingScrollTop + scrollBy * (e[pageY] - startingMousePageY);
              addScrollingClass(i, y);
              updateGeometry(i);

              e.stopPropagation();
              e.preventDefault();
          }

          function mouseUpHandler() {
              removeScrollingClass(i, y);
              i.event.unbind(i.ownerDocument, 'mousemove', mouseMoveHandler);
          }

          i.event.bind(i[scrollbarY], 'mousedown', function (e) {
              startingScrollTop = element[scrollTop];
              startingMousePageY = e[pageY];
              scrollBy =
                  (i[contentHeight] - i[containerHeight]) /
                  (i[railYHeight] - i[scrollbarYHeight]);

              i.event.bind(i.ownerDocument, 'mousemove', mouseMoveHandler);
              i.event.once(i.ownerDocument, 'mouseup', mouseUpHandler);

              e.stopPropagation();
              e.preventDefault();
          });
      }

      var keyboard = function (i) {
          var element = i.element;

          var elementHovered = function () {
              return matches(element, ':hover');
          };
          var scrollbarFocused = function () {
              return matches(i.scrollbarX, ':focus') || matches(i.scrollbarY, ':focus');
          };

          function shouldPreventDefault(deltaX, deltaY) {
              var scrollTop = element.scrollTop;
              if (deltaX === 0) {
                  if (!i.scrollbarYActive) {
                      return false;
                  }
                  if (
                      (scrollTop === 0 && deltaY > 0) ||
                      (scrollTop >= i.contentHeight - i.containerHeight && deltaY < 0)
                  ) {
                      return !i.settings.wheelPropagation;
                  }
              }

              var scrollLeft = element.scrollLeft;
              if (deltaY === 0) {
                  if (!i.scrollbarXActive) {
                      return false;
                  }
                  if (
                      (scrollLeft === 0 && deltaX < 0) ||
                      (scrollLeft >= i.contentWidth - i.containerWidth && deltaX > 0)
                  ) {
                      return !i.settings.wheelPropagation;
                  }
              }
              return true;
          }

          i.event.bind(i.ownerDocument, 'keydown', function (e) {
              if (
                  (e.isDefaultPrevented && e.isDefaultPrevented()) ||
                  e.defaultPrevented
              ) {
                  return;
              }

              if (!elementHovered() && !scrollbarFocused()) {
                  return;
              }

              var activeElement = document.activeElement
                  ? document.activeElement
                  : i.ownerDocument.activeElement;
              if (activeElement) {
                  if (activeElement.tagName === 'IFRAME') {
                      activeElement = activeElement.contentDocument.activeElement;
                  } else {
                      // go deeper if element is a webcomponent
                      while (activeElement.shadowRoot) {
                          activeElement = activeElement.shadowRoot.activeElement;
                      }
                  }
                  if (isEditable(activeElement)) {
                      return;
                  }
              }

              var deltaX = 0;
              var deltaY = 0;

              switch (e.which) {
                  case 37: // left
                      if (e.metaKey) {
                          deltaX = -i.contentWidth;
                      } else if (e.altKey) {
                          deltaX = -i.containerWidth;
                      } else {
                          deltaX = -30;
                      }
                      break;
                  case 38: // up
                      if (e.metaKey) {
                          deltaY = i.contentHeight;
                      } else if (e.altKey) {
                          deltaY = i.containerHeight;
                      } else {
                          deltaY = 30;
                      }
                      break;
                  case 39: // right
                      if (e.metaKey) {
                          deltaX = i.contentWidth;
                      } else if (e.altKey) {
                          deltaX = i.containerWidth;
                      } else {
                          deltaX = 30;
                      }
                      break;
                  case 40: // down
                      if (e.metaKey) {
                          deltaY = -i.contentHeight;
                      } else if (e.altKey) {
                          deltaY = -i.containerHeight;
                      } else {
                          deltaY = -30;
                      }
                      break;
                  case 32: // space bar
                      if (e.shiftKey) {
                          deltaY = i.containerHeight;
                      } else {
                          deltaY = -i.containerHeight;
                      }
                      break;
                  case 33: // page up
                      deltaY = i.containerHeight;
                      break;
                  case 34: // page down
                      deltaY = -i.containerHeight;
                      break;
                  case 36: // home
                      deltaY = i.contentHeight;
                      break;
                  case 35: // end
                      deltaY = -i.contentHeight;
                      break;
                  default:
                      return;
              }

              if (i.settings.suppressScrollX && deltaX !== 0) {
                  return;
              }
              if (i.settings.suppressScrollY && deltaY !== 0) {
                  return;
              }

              element.scrollTop -= deltaY;
              element.scrollLeft += deltaX;
              updateGeometry(i);

              if (shouldPreventDefault(deltaX, deltaY)) {
                  e.preventDefault();
              }
          });
      };

      var wheel = function (i) {
          var element = i.element;

          function shouldPreventDefault(deltaX, deltaY) {
              var isTop = element.scrollTop === 0;
              var isBottom =
                  element.scrollTop + element.offsetHeight === element.scrollHeight;
              var isLeft = element.scrollLeft === 0;
              var isRight =
                  element.scrollLeft + element.offsetWidth === element.offsetWidth;

              var hitsBound;

              // pick axis with primary direction
              if (Math.abs(deltaY) > Math.abs(deltaX)) {
                  hitsBound = isTop || isBottom;
              } else {
                  hitsBound = isLeft || isRight;
              }

              return hitsBound ? !i.settings.wheelPropagation : true;
          }

          function getDeltaFromEvent(e) {
              var deltaX = e.deltaX;
              var deltaY = -1 * e.deltaY;

              if (typeof deltaX === 'undefined' || typeof deltaY === 'undefined') {
                  // OS X Safari
                  deltaX = -1 * e.wheelDeltaX / 6;
                  deltaY = e.wheelDeltaY / 6;
              }

              if (e.deltaMode && e.deltaMode === 1) {
                  // Firefox in deltaMode 1: Line scrolling
                  deltaX *= 10;
                  deltaY *= 10;
              }

              if (deltaX !== deltaX && deltaY !== deltaY /* NaN checks */) {
                  // IE in some mouse drivers
                  deltaX = 0;
                  deltaY = e.wheelDelta;
              }

              if (e.shiftKey) {
                  // reverse axis with shift key
                  return [-deltaY, -deltaX];
              }
              return [deltaX, deltaY];
          }

          function shouldBeConsumedByChild(target, deltaX, deltaY) {
              // FIXME: this is a workaround for <select> issue in FF and IE #571
              if (!env.isWebKit && element.querySelector('select:focus')) {
                  return true;
              }

              if (!element.contains(target)) {
                  return false;
              }

              var cursor = target;

              while (cursor && cursor !== element) {
                  if (cursor.classList.contains(cls.element.consuming)) {
                      return true;
                  }

                  var style = get(cursor);
                  var overflow = [style.overflow, style.overflowX, style.overflowY].join(
                      ''
                  );

                  // if scrollable
                  if (overflow.match(/(scroll|auto)/)) {
                      var maxScrollTop = cursor.scrollHeight - cursor.clientHeight;
                      if (maxScrollTop > 0) {
                          if (
                              !(cursor.scrollTop === 0 && deltaY > 0) &&
                              !(cursor.scrollTop === maxScrollTop && deltaY < 0)
                          ) {
                              return true;
                          }
                      }
                      var maxScrollLeft = cursor.scrollLeft - cursor.clientWidth;
                      if (maxScrollLeft > 0) {
                          if (
                              !(cursor.scrollLeft === 0 && deltaX < 0) &&
                              !(cursor.scrollLeft === maxScrollLeft && deltaX > 0)
                          ) {
                              return true;
                          }
                      }
                  }

                  cursor = cursor.parentNode;
              }

              return false;
          }

          function mousewheelHandler(e) {
              var ref = getDeltaFromEvent(e);
              var deltaX = ref[0];
              var deltaY = ref[1];

              if (shouldBeConsumedByChild(e.target, deltaX, deltaY)) {
                  return;
              }

              var shouldPrevent = false;
              if (!i.settings.useBothWheelAxes) {
                  // deltaX will only be used for horizontal scrolling and deltaY will
                  // only be used for vertical scrolling - this is the default
                  element.scrollTop -= deltaY * i.settings.wheelSpeed;
                  element.scrollLeft += deltaX * i.settings.wheelSpeed;
              } else if (i.scrollbarYActive && !i.scrollbarXActive) {
                  // only vertical scrollbar is active and useBothWheelAxes option is
                  // active, so let's scroll vertical bar using both mouse wheel axes
                  if (deltaY) {
                      element.scrollTop -= deltaY * i.settings.wheelSpeed;
                  } else {
                      element.scrollTop += deltaX * i.settings.wheelSpeed;
                  }
                  shouldPrevent = true;
              } else if (i.scrollbarXActive && !i.scrollbarYActive) {
                  // useBothWheelAxes and only horizontal bar is active, so use both
                  // wheel axes for horizontal bar
                  if (deltaX) {
                      element.scrollLeft += deltaX * i.settings.wheelSpeed;
                  } else {
                      element.scrollLeft -= deltaY * i.settings.wheelSpeed;
                  }
                  shouldPrevent = true;
              }

              updateGeometry(i);

              shouldPrevent = shouldPrevent || shouldPreventDefault(deltaX, deltaY);
              if (shouldPrevent && !e.ctrlKey) {
                  e.stopPropagation();
                  e.preventDefault();
              }
          }

          if (typeof window.onwheel !== 'undefined') {
              i.event.bind(element, 'wheel', mousewheelHandler);
          } else if (typeof window.onmousewheel !== 'undefined') {
              i.event.bind(element, 'mousewheel', mousewheelHandler);
          }
      };

      var touch = function (i) {
          if (!env.supportsTouch && !env.supportsIePointer) {
              return;
          }

          var element = i.element;

          function shouldPrevent(deltaX, deltaY) {
              var scrollTop = element.scrollTop;
              var scrollLeft = element.scrollLeft;
              var magnitudeX = Math.abs(deltaX);
              var magnitudeY = Math.abs(deltaY);

              if (magnitudeY > magnitudeX) {
                  // user is perhaps trying to swipe up/down the page

                  if (
                      (deltaY < 0 && scrollTop === i.contentHeight - i.containerHeight) ||
                      (deltaY > 0 && scrollTop === 0)
                  ) {
                      // set prevent for mobile Chrome refresh
                      return window.scrollY === 0 && deltaY > 0 && env.isChrome;
                  }
              } else if (magnitudeX > magnitudeY) {
                  // user is perhaps trying to swipe left/right across the page

                  if (
                      (deltaX < 0 && scrollLeft === i.contentWidth - i.containerWidth) ||
                      (deltaX > 0 && scrollLeft === 0)
                  ) {
                      return true;
                  }
              }

              return true;
          }

          function applyTouchMove(differenceX, differenceY) {
              element.scrollTop -= differenceY;
              element.scrollLeft -= differenceX;

              updateGeometry(i);
          }

          var startOffset = {};
          var startTime = 0;
          var speed = {};
          var easingLoop = null;

          function getTouch(e) {
              if (e.targetTouches) {
                  return e.targetTouches[0];
              } else {
                  // Maybe IE pointer
                  return e;
              }
          }

          function shouldHandle(e) {
              if (e.pointerType && e.pointerType === 'pen' && e.buttons === 0) {
                  return false;
              }
              if (e.targetTouches && e.targetTouches.length === 1) {
                  return true;
              }
              if (
                  e.pointerType &&
                  e.pointerType !== 'mouse' &&
                  e.pointerType !== e.MSPOINTER_TYPE_MOUSE
              ) {
                  return true;
              }
              return false;
          }

          function touchStart(e) {
              if (!shouldHandle(e)) {
                  return;
              }

              var touch = getTouch(e);

              startOffset.pageX = touch.pageX;
              startOffset.pageY = touch.pageY;

              startTime = new Date().getTime();

              if (easingLoop !== null) {
                  clearInterval(easingLoop);
              }
          }

          function shouldBeConsumedByChild(target, deltaX, deltaY) {
              if (!element.contains(target)) {
                  return false;
              }

              var cursor = target;

              while (cursor && cursor !== element) {
                  if (cursor.classList.contains(cls.element.consuming)) {
                      return true;
                  }

                  var style = get(cursor);
                  var overflow = [style.overflow, style.overflowX, style.overflowY].join(
                      ''
                  );

                  // if scrollable
                  if (overflow.match(/(scroll|auto)/)) {
                      var maxScrollTop = cursor.scrollHeight - cursor.clientHeight;
                      if (maxScrollTop > 0) {
                          if (
                              !(cursor.scrollTop === 0 && deltaY > 0) &&
                              !(cursor.scrollTop === maxScrollTop && deltaY < 0)
                          ) {
                              return true;
                          }
                      }
                      var maxScrollLeft = cursor.scrollLeft - cursor.clientWidth;
                      if (maxScrollLeft > 0) {
                          if (
                              !(cursor.scrollLeft === 0 && deltaX < 0) &&
                              !(cursor.scrollLeft === maxScrollLeft && deltaX > 0)
                          ) {
                              return true;
                          }
                      }
                  }

                  cursor = cursor.parentNode;
              }

              return false;
          }

          function touchMove(e) {
              if (shouldHandle(e)) {
                  var touch = getTouch(e);

                  var currentOffset = {pageX: touch.pageX, pageY: touch.pageY};

                  var differenceX = currentOffset.pageX - startOffset.pageX;
                  var differenceY = currentOffset.pageY - startOffset.pageY;

                  if (shouldBeConsumedByChild(e.target, differenceX, differenceY)) {
                      return;
                  }

                  applyTouchMove(differenceX, differenceY);
                  startOffset = currentOffset;

                  var currentTime = new Date().getTime();

                  var timeGap = currentTime - startTime;
                  if (timeGap > 0) {
                      speed.x = differenceX / timeGap;
                      speed.y = differenceY / timeGap;
                      startTime = currentTime;
                  }

                  if (shouldPrevent(differenceX, differenceY)) {
                      e.preventDefault();
                  }
              }
          }

          function touchEnd() {
              if (i.settings.swipeEasing) {
                  clearInterval(easingLoop);
                  easingLoop = setInterval(function () {
                      if (i.isInitialized) {
                          clearInterval(easingLoop);
                          return;
                      }

                      if (!speed.x && !speed.y) {
                          clearInterval(easingLoop);
                          return;
                      }

                      if (Math.abs(speed.x) < 0.01 && Math.abs(speed.y) < 0.01) {
                          clearInterval(easingLoop);
                          return;
                      }

                      applyTouchMove(speed.x * 30, speed.y * 30);

                      speed.x *= 0.8;
                      speed.y *= 0.8;
                  }, 10);
              }
          }

          if (env.supportsTouch) {
              i.event.bind(element, 'touchstart', touchStart);
              i.event.bind(element, 'touchmove', touchMove);
              i.event.bind(element, 'touchend', touchEnd);
          } else if (env.supportsIePointer) {
              if (window.PointerEvent) {
                  i.event.bind(element, 'pointerdown', touchStart);
                  i.event.bind(element, 'pointermove', touchMove);
                  i.event.bind(element, 'pointerup', touchEnd);
              } else if (window.MSPointerEvent) {
                  i.event.bind(element, 'MSPointerDown', touchStart);
                  i.event.bind(element, 'MSPointerMove', touchMove);
                  i.event.bind(element, 'MSPointerUp', touchEnd);
              }
          }
      };

      var defaultSettings = function () {
          return ({
              handlers: ['click-rail', 'drag-thumb', 'keyboard', 'wheel', 'touch'],
              maxScrollbarLength: null,
              minScrollbarLength: null,
              scrollingThreshold: 1000,
              scrollXMarginOffset: 0,
              scrollYMarginOffset: 0,
              suppressScrollX: false,
              suppressScrollY: false,
              swipeEasing: true,
              useBothWheelAxes: false,
              wheelPropagation: false,
              wheelSpeed: 1,
          });
      };

      var handlers = {
          'click-rail': clickRail,
          'drag-thumb': dragThumb,
          keyboard: keyboard,
          wheel: wheel,
          touch: touch,
      };

      var PerfectScrollbar = function PerfectScrollbar(element, userSettings) {
          var this$1 = this;
          if (userSettings === void 0) userSettings = {};

          if (typeof element === 'string') {
              element = document.querySelector(element);
          }

          if (!element || !element.nodeName) {
              throw new Error('no element is specified to initialize PerfectScrollbar');
          }

          this.element = element;

          element.classList.add(cls.main);

          this.settings = defaultSettings();
          for (var key in userSettings) {
              this$1.settings[key] = userSettings[key];
          }

          this.containerWidth = null;
          this.containerHeight = null;
          this.contentWidth = null;
          this.contentHeight = null;

          var focus = function () {
              return element.classList.add(cls.state.focus);
          };
          var blur = function () {
              return element.classList.remove(cls.state.focus);
          };

          this.isRtl = get(element).direction === 'rtl';
          this.isNegativeScroll = (function () {
              var originalScrollLeft = element.scrollLeft;
              var result = null;
              element.scrollLeft = -1;
              result = element.scrollLeft < 0;
              element.scrollLeft = originalScrollLeft;
              return result;
          })();
          this.negativeScrollAdjustment = this.isNegativeScroll
              ? element.scrollWidth - element.clientWidth
              : 0;
          this.event = new EventManager();
          this.ownerDocument = element.ownerDocument || document;

          this.scrollbarXRail = div(cls.element.rail('x'));
          element.appendChild(this.scrollbarXRail);
          this.scrollbarX = div(cls.element.thumb('x'));
          this.scrollbarXRail.appendChild(this.scrollbarX);
          this.scrollbarX.setAttribute('tabindex', 0);
          this.event.bind(this.scrollbarX, 'focus', focus);
          this.event.bind(this.scrollbarX, 'blur', blur);
          this.scrollbarXActive = null;
          this.scrollbarXWidth = null;
          this.scrollbarXLeft = null;
          var railXStyle = get(this.scrollbarXRail);
          this.scrollbarXBottom = parseInt(railXStyle.bottom, 10);
          if (isNaN(this.scrollbarXBottom)) {
              this.isScrollbarXUsingBottom = false;
              this.scrollbarXTop = toInt(railXStyle.top);
          } else {
              this.isScrollbarXUsingBottom = true;
          }
          this.railBorderXWidth =
              toInt(railXStyle.borderLeftWidth) + toInt(railXStyle.borderRightWidth);
          // Set rail to display:block to calculate margins
          set(this.scrollbarXRail, {display: 'block'});
          this.railXMarginWidth =
              toInt(railXStyle.marginLeft) + toInt(railXStyle.marginRight);
          set(this.scrollbarXRail, {display: ''});
          this.railXWidth = null;
          this.railXRatio = null;

          this.scrollbarYRail = div(cls.element.rail('y'));
          element.appendChild(this.scrollbarYRail);
          this.scrollbarY = div(cls.element.thumb('y'));
          this.scrollbarYRail.appendChild(this.scrollbarY);
          this.scrollbarY.setAttribute('tabindex', 0);
          this.event.bind(this.scrollbarY, 'focus', focus);
          this.event.bind(this.scrollbarY, 'blur', blur);
          this.scrollbarYActive = null;
          this.scrollbarYHeight = null;
          this.scrollbarYTop = null;
          var railYStyle = get(this.scrollbarYRail);
          this.scrollbarYRight = parseInt(railYStyle.right, 10);
          if (isNaN(this.scrollbarYRight)) {
              this.isScrollbarYUsingRight = false;
              this.scrollbarYLeft = toInt(railYStyle.left);
          } else {
              this.isScrollbarYUsingRight = true;
          }
          this.scrollbarYOuterWidth = this.isRtl ? outerWidth(this.scrollbarY) : null;
          this.railBorderYWidth =
              toInt(railYStyle.borderTopWidth) + toInt(railYStyle.borderBottomWidth);
          set(this.scrollbarYRail, {display: 'block'});
          this.railYMarginHeight =
              toInt(railYStyle.marginTop) + toInt(railYStyle.marginBottom);
          set(this.scrollbarYRail, {display: ''});
          this.railYHeight = null;
          this.railYRatio = null;

          this.reach = {
              x:
                  element.scrollLeft <= 0
                      ? 'start'
                      : element.scrollLeft >= this.contentWidth - this.containerWidth
                      ? 'end'
                      : null,
              y:
                  element.scrollTop <= 0
                      ? 'start'
                      : element.scrollTop >= this.contentHeight - this.containerHeight
                      ? 'end'
                      : null,
          };

          this.isAlive = true;

          this.settings.handlers.forEach(function (handlerName) {
              return handlers[handlerName](this$1);
          });

          this.lastScrollTop = element.scrollTop; // for onScroll only
          this.lastScrollLeft = element.scrollLeft; // for onScroll only
          this.event.bind(this.element, 'scroll', function (e) {
              return this$1.onScroll(e);
          });
          updateGeometry(this);
      };

      PerfectScrollbar.prototype.update = function update() {
          if (!this.isAlive) {
              return;
          }

          // Recalcuate negative scrollLeft adjustment
          this.negativeScrollAdjustment = this.isNegativeScroll
              ? this.element.scrollWidth - this.element.clientWidth
              : 0;

          // Recalculate rail margins
          set(this.scrollbarXRail, {display: 'block'});
          set(this.scrollbarYRail, {display: 'block'});
          this.railXMarginWidth =
              toInt(get(this.scrollbarXRail).marginLeft) +
              toInt(get(this.scrollbarXRail).marginRight);
          this.railYMarginHeight =
              toInt(get(this.scrollbarYRail).marginTop) +
              toInt(get(this.scrollbarYRail).marginBottom);

          // Hide scrollbars not to affect scrollWidth and scrollHeight
          set(this.scrollbarXRail, {display: 'none'});
          set(this.scrollbarYRail, {display: 'none'});

          updateGeometry(this);

          processScrollDiff(this, 'top', 0, false, true);
          processScrollDiff(this, 'left', 0, false, true);

          set(this.scrollbarXRail, {display: ''});
          set(this.scrollbarYRail, {display: ''});
      };

      PerfectScrollbar.prototype.onScroll = function onScroll(e) {
          if (!this.isAlive) {
              return;
          }

          updateGeometry(this);
          processScrollDiff(this, 'top', this.element.scrollTop - this.lastScrollTop);
          processScrollDiff(
              this,
              'left',
              this.element.scrollLeft - this.lastScrollLeft
          );

          this.lastScrollTop = this.element.scrollTop;
          this.lastScrollLeft = this.element.scrollLeft;
      };

      PerfectScrollbar.prototype.destroy = function destroy() {
          if (!this.isAlive) {
              return;
          }

          this.event.unbindAll();
          remove(this.scrollbarX);
          remove(this.scrollbarY);
          remove(this.scrollbarXRail);
          remove(this.scrollbarYRail);
          this.removePsClasses();

          // unset elements
          this.element = null;
          this.scrollbarX = null;
          this.scrollbarY = null;
          this.scrollbarXRail = null;
          this.scrollbarYRail = null;

          this.isAlive = false;
      };

      PerfectScrollbar.prototype.removePsClasses = function removePsClasses() {
          this.element.className = this.element.className
              .split(' ')
              .filter(function (name) {
                  return !name.match(/^ps([-_].+|)$/);
              })
              .join(' ');
      };

      module.exports = PerfectScrollbar;

  }, {}], 2: [function (require, module, exports) {
      'use strict';

      Object.defineProperty(exports, "__esModule", {
          value: true
      });

      var _createClass = function () {
          function defineProperties(target, props) {
              for (var i = 0; i < props.length; i++) {
                  var descriptor = props[i];
                  descriptor.enumerable = descriptor.enumerable || false;
                  descriptor.configurable = true;
                  if ("value" in descriptor) descriptor.writable = true;
                  Object.defineProperty(target, descriptor.key, descriptor);
              }
          }

          return function (Constructor, protoProps, staticProps) {
              if (protoProps) defineProperties(Constructor.prototype, protoProps);
              if (staticProps) defineProperties(Constructor, staticProps);
              return Constructor;
          };
      }();

      function _classCallCheck(instance, Constructor) {
          if (!(instance instanceof Constructor)) {
              throw new TypeError("Cannot call a class as a function");
          }
      }

      var GoToStep = function () {
          function GoToStep(selector) {
              _classCallCheck(this, GoToStep);

              this.container = document.querySelector(selector);

              if (this.container === null) return;

              this.config = {cssClass: 'step', cssId: 'step'};

              this.links = this.container.querySelectorAll('[data-to]');
              this.pages = this.container.querySelectorAll('.' + this.config.cssClass);

              this.activePage = this.container.querySelector('.' + this.config.cssClass + '.active') || this.pages[0];
              this.positionList = this.container.querySelectorAll('.tabs-static__item');
              this.positionListActive = this.container.querySelector('.tabs-static__item.active') || this.positionList[0];

              this.goToPage = this.goToPage.bind(this);
              this.addActive = this.addActive.bind(this);

              this.bindEvents();
          }

          _createClass(GoToStep, [{
              key: 'bindEvents',
              value: function bindEvents() {
                  var _this = this;

                  var _loop = function _loop(i) {
                      _this.links[i].addEventListener('click', function (e) {
                          e.preventDefault();
                          _this.goToPage(_this.links[i], e);
                      }, false);
                  };

                  for (var i = 0; i < this.links.length; i += 1) {
                      _loop(i);
                  }
              }
          }, {
              key: 'goToPage',
              value: function goToPage(btn, e) {
                  e.preventDefault();

                  var to = btn.dataset.to;
                  var id = parseInt(to.replace(/[^\d]+/, ''), 10);
                  var elem = this.container.querySelector('#' + to);

                  if (this.beforeChange.call(this, this.activePage, elem, id)) {
                      this.addActive(elem, id);
                  }
              }
          }, {
              key: 'addActive',
              value: function addActive(page, id) {
                  this.activePage.classList.remove('active');
                  this.positionListActive.classList.remove('active');
                  page.classList.add('active');
                  this.positionList[id - 1].classList.add('active');

                  this.activePage = page;
                  this.positionListActive = this.positionList[id - 1];
                  this.afterChange.call(this, this.activePage, id);
              }
          }, {
              key: 'beforeChange',
              value: function beforeChange(activePage, elem, id) {
                  return true;
              }
          }, {
              key: 'afterChange',
              value: function afterChange(activePage, id) {
              }
          }]);

          return GoToStep;
      }();

      exports.default = GoToStep;

  }, {}], 3: [function (require, module, exports) {
      'use strict';

      Object.defineProperty(exports, "__esModule", {
          value: true
      });
      exports.whichAnimationEvent = whichAnimationEvent;
      exports.getOffsetTop = getOffsetTop;

// prefix correct event animation
      function whichAnimationEvent() {
          var t;
          var el = document.createElement('fakeelement');
          var animations = {
              'animation': 'animationend',
              'OAnimation': 'oAnimationEnd',
              'MozAnimation': 'animationend',
              'WebkitAnimation': 'webkitAnimationEnd'
          };

          for (t in animations) {
              if (el.style[t] !== undefined) {
                  return animations[t];
              }
          }
      }

// bubbler offset top info
      function getOffsetTop(elem) {
          // Set our distance placeholder
          var distance = 0;

          // Loop up the DOM
          if (elem.offsetParent) {
              do {
                  distance += elem.offsetTop;
                  elem = elem.offsetParent;
              } while (elem);
          }

          // Return our distance
          return distance < 0 ? 0 : distance;
      };

  }, {}], 4: [function (require, module, exports) {
      'use strict';

      Object.defineProperty(exports, "__esModule", {
          value: true
      });

      var _createClass = function () {
          function defineProperties(target, props) {
              for (var i = 0; i < props.length; i++) {
                  var descriptor = props[i];
                  descriptor.enumerable = descriptor.enumerable || false;
                  descriptor.configurable = true;
                  if ("value" in descriptor) descriptor.writable = true;
                  Object.defineProperty(target, descriptor.key, descriptor);
              }
          }

          return function (Constructor, protoProps, staticProps) {
              if (protoProps) defineProperties(Constructor.prototype, protoProps);
              if (staticProps) defineProperties(Constructor, staticProps);
              return Constructor;
          };
      }();

      function _classCallCheck(instance, Constructor) {
          if (!(instance instanceof Constructor)) {
              throw new TypeError("Cannot call a class as a function");
          }
      }

      var Jumbotron = function () {
          function Jumbotron(containerSelector) {
              _classCallCheck(this, Jumbotron);

              if (containerSelector === null) return;

              this.container = containerSelector;
              this.video = this.container.querySelector('video');
              this.playBtn = this.container.querySelector('.play-button');
              this.pauseBtn = this.container.querySelector('.pause-button');

              this.bindEvents();
          }

          _createClass(Jumbotron, [{
              key: 'playVideo',
              value: function playVideo() {
                  this.container.classList.add('playing');
                  this.video.play();
              }
          }, {
              key: 'playPauseVideo',
              value: function playPauseVideo() {
                  var _this = this;

                  if (this.video.paused) return this.playVideo();

                  this.video.pause();
                  this.container.classList.add('pausing');
                  this.container.classList.remove('playing');

                  window.setTimeout(function () {
                      _this.container.classList.remove('pausing');
                  }, 500);
              }
          }, {
              key: 'bindEvents',
              value: function bindEvents() {
                  //this.video.addEventListener('click', this.playPauseVideo.bind(this), false);
                  //this.video.addEventListener('ended', this.playVideo.bind(this), false);

                  //this.playBtn.addEventListener('click', this.playVideo.bind(this), false);
              }
          }]);

          return Jumbotron;
      }();

      exports.default = Jumbotron;

  }, {}], 5: [function (require, module, exports) {
      'use strict';

      var _createClass = function () {
          function defineProperties(target, props) {
              for (var i = 0; i < props.length; i++) {
                  var descriptor = props[i];
                  descriptor.enumerable = descriptor.enumerable || false;
                  descriptor.configurable = true;
                  if ("value" in descriptor) descriptor.writable = true;
                  Object.defineProperty(target, descriptor.key, descriptor);
              }
          }

          return function (Constructor, protoProps, staticProps) {
              if (protoProps) defineProperties(Constructor.prototype, protoProps);
              if (staticProps) defineProperties(Constructor, staticProps);
              return Constructor;
          };
      }();

      var _perfectScrollbar = require('perfect-scrollbar');

      var _perfectScrollbar2 = _interopRequireDefault(_perfectScrollbar);
      document.perfectScrollbar = _perfectScrollbar;

      var _slider = require('./slider');

      var _slider2 = _interopRequireDefault(_slider);
      document.slider = _slider2;

      var _openClose = require('./openClose');

      var _openClose2 = _interopRequireDefault(_openClose);

      var _search = require('./search');

      var _search2 = _interopRequireDefault(_search);

      var _tabs = require('./tabs');

      var _tabs2 = _interopRequireDefault(_tabs);

      var _gotostep = require('./gotostep');

      var _gotostep2 = _interopRequireDefault(_gotostep);

      var _numericInput = require('./numeric-input');

      var _numericInput2 = _interopRequireDefault(_numericInput);

      var _jumbotron = require('./jumbotron');

      var _jumbotron2 = _interopRequireDefault(_jumbotron);

      var _helpers = require('./helpers');

      var helpers = _interopRequireWildcard(_helpers);

      function _interopRequireWildcard(obj) {
          if (obj && obj.__esModule) {
              return obj;
          } else {
              var newObj = {};
              if (obj != null) {
                  for (var key in obj) {
                      if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
                  }
              }
              newObj.default = obj;
              return newObj;
          }
      }

      function _interopRequireDefault(obj) {
          return obj && obj.__esModule ? obj : {default: obj};
      }

      function _classCallCheck(instance, Constructor) {
          if (!(instance instanceof Constructor)) {
              throw new TypeError("Cannot call a class as a function");
          }
      }

// global const
      var isMobile = window.innerWidth < 1024;

// init home modules
      (function () {
          var homeSlider = document.getElementById('main-slider');

          //Comentado para mayor flexibilidad con los banners
          //if (homeSlider === null) return;

          // slider home
          new _slider2.default('main-slider', {
              // autoSlide: true,
              // timeTransition: 2000,
              navBullets: true,
              navArrows: true,
              muteControl: true,
              muteVideos: false,
              navArrowPrev: '\n      <svg class="icon icon-arrow-left" viewBox="0 0 27 46">\n        <path d="M7.485 23.042l17.678 17.677a3 3 0 0 1-4.243 4.243L1.121 25.163a3 3 0 0 1 0-4.243l19.8-19.799a3 3 0 1 1 4.242 4.243L7.485 23.042z"></path>\n      </svg>',
              navArrowNext: '\n      <svg class="icon icon-arrow-right" viewBox="0 0 26 46">\n        <path d="M18.598 23.042L.92 5.364a3 3 0 0 1 4.243-4.243l19.799 19.8a3 3 0 0 1 0 4.242L5.163 44.962A3 3 0 0 1 .92 40.719l17.678-17.677z"></path>\n      </svg>'
          });

          // testimonials slider
          new _slider2.default('testimonials-slider', {
              navArrows: true,
              navBullets: true
          });

          // products slider
          new _slider2.default('products-slider', {
              navBullets: true,
              onlyMobile: true
          });

          // business slider
          new _slider2.default('business-slider', {
              navBullets: true,
              onlyMobile: true
          });
      })();

// menu
      new _openClose2.default(document.querySelector('#imenu'), document.querySelector('.main-nav'), true);

// cart
      new _openClose2.default(document.querySelector('#icart'), document.querySelector('.cart-preview.aside'), false, true);

// login
      new _openClose2.default([document.querySelector('#iuser'), document.querySelector('#iuser-mobile'),
          document.querySelector('#login-btn-mov'), document.querySelector('#login-btn')], document.querySelector('.login'), false, true);

// search
      _search2.default.init();

// slider products
      (function () {
          var productsPage = document.querySelector('.products-page');

          if (productsPage === null) return;

          var productsBlock = productsPage.querySelectorAll('.products');

          for (var i = 0; i < productsBlock.length; i++) {
              new _slider2.default(productsBlock[i].id, {
                  navBullets: true,
                  onlyMobile: true
              });
          }
      })();

// temporal dropdowns
      (function () {
          var Dropdown = function () {
              function Dropdown(elem) {
                  _classCallCheck(this, Dropdown);

                  this.dropdown = elem;

                  if (this.dropdown === null) return;

                  this.toggle = this.toggle.bind(this);

                  this.bindEvents();
              }

              _createClass(Dropdown, [{
                  key: 'bindEvents',
                  value: function bindEvents() {
                      var _this = this;

                      if ('ontouchstart' in document.documentElement) {
                          window.addEventListener('touchstart', function (e) {
                              _this.startTouch = +new Date();
                          }, false);
                          /*window.addEventListener('touchend', function (e) {
                            if (e.target.classList.contains('dropdown-item')) return;
                            var currentTime = +new Date();
                            var dt = currentTime - _this.startTouch;

                            if (dt < 500) {
                              _this.clearDropdowns();
                            }
                          }, false);*/
                      } else {
                          window.addEventListener('click', this.clearDropdowns, false);
                      }

                      this.dropdown.addEventListener('click', this.toggle, false);
                  }
              }, {
                  key: 'clearDropdowns',
                  value: function clearDropdowns() {
                      var dropdowns = document.querySelectorAll('.dropdown.active');

                      if (dropdowns.length === 0) {
                          return;
                      }

                      for (var i = 0; i < dropdowns.length; i += 1) {
                          dropdowns[i].classList.remove('active');
                      }
                  }
              }, {
                  key: 'toggle',
                  value: function toggle(e) {
                      //e.preventDefault();
                      e.stopPropagation();

                      var target = e.target;
                      var dropdown = target.classList.contains('dropdown') ? target : target.parentElement;
                      var isActive = dropdown.classList.contains('active');

                      this.clearDropdowns();
                      if (isActive) {
                          return;
                      }

                      dropdown.classList.toggle('active');
                  }
              }]);

              return Dropdown;
          }();

          var dropdownElems = document.querySelectorAll('.dropdown');
          var dropdowns = [];

          if (dropdownElems.length === 0) return;

          for (var i = 0; i < dropdownElems.length; i++) {
              dropdowns.push(new Dropdown(dropdownElems[i]));
          }
      })();

// tabs
      (function () {
          var tabs = document.querySelectorAll('.tabs');

          if (tabs.length === 0) return;

          for (var i = 0; i < tabs.length; i += 1) {
              new _tabs2.default(tabs[i]);
          }
      })();

// modals
      (function () {
          var modalsLink = document.querySelectorAll('[data-modal]');

          if (modalsLink.length === 0) return;

          var beforeShow = function beforeShow(e, btn, elem) {
              e.preventDefault();
          };

          var modalElem = void 0;
          var modal = void 0;
          var to = void 0;
          for (var i = 0; i < modalsLink.length; i += 1) {
              to = modalsLink[i].dataset.modal === 'true' ? modalsLink[i].getAttribute('href') : modalsLink[i].dataset.modal;
              modalElem = document.querySelector(to);

              if (modalElem === null) continue;

              modal = new _openClose2.default(modalsLink[i], modalElem, false, true);
              modal.beforeShow = beforeShow;
          }
      })();

      (function () {
          // show options on register radio
          var invitedRadios = document.querySelectorAll('[name=invited]');

          if (invitedRadios.length === 0) return;

          var showExtraInput = function showExtraInput(e) {
              var val = parseInt(e.target.value, 10);
              var no = document.querySelector('#invited-no');
              var yes = document.querySelector('#invited-yes');

              if (val === 0) {
                  no.classList.remove('hidden');
                  yes.classList.add('hidden');
              } else if (val === 1) {
                  yes.classList.remove('hidden');
                  no.classList.add('hidden');
              }
          };

          for (var i = 0; i < invitedRadios.length; i += 1) {
              invitedRadios[i].addEventListener('change', showExtraInput, false);
          }
      })();

      (function () {
          // register / cart steps
          var goTo = new _gotostep2.default('.fullsteps');

          // fake make payment
          var modalElem = document.querySelector('#realizando-pago');

          if (modalElem === null) return;

          goTo.beforeChange = function (activeElem, nextActive, id) {
              var _this2 = this;

              var cartContent = nextActive.parentElement.parentElement.querySelector('.cart__content'),
                  isCart = cartContent !== null;

              window.scrollTo(0, 0);

              if (nextActive.classList.contains('register__step') && nextActive.id === 'step4' || isCart && nextActive.id === 'step3') {
                  var modal = new _openClose2.default(null, modalElem, false, true);
                  window.setTimeout(function () {
                      modal.close();

                      if (isCart && nextActive.id === 'step3') {
                          cartContent.style.position = 'absolute';
                          cartContent.style.zIndex = '-1';
                          cartContent.style.right = 0;
                          cartContent.style.opacity = 0;
                          _this2.container.querySelector('#cart-preview-mov').style.display = 'none';
                      }
                      goTo.addActive(nextActive, id);

                      return true;
                  }, 3000);
              } else {
                  return true;
              }
          };
      })();

// cart preview checkout
      new _openClose2.default(document.querySelector('#cart-preview-mov'), document.querySelector('.cart-preview.cart__right'), false, false);

// add perfect scroll to cart items
      (function () {
          var cartItemsContainer = document.querySelectorAll('.cart-preview .cart-product__list');

          if (cartItemsContainer.length === 0) return;

          for (var i = 0; i < cartItemsContainer.length; i += 1) {
              new _perfectScrollbar2.default(cartItemsContainer[i]);
          }
      })();

// numeric inputs
      (function () {
          var numeric = document.querySelectorAll('.numeric');

          if (numeric.length === 0) return;

          for (var i = 0; i < numeric.length; i += 1) {
              new _numericInput2.default(numeric[i]);
          }
      })();

// apply perfect scrollbar
      (function () {
          var psItems = document.querySelectorAll('.ps-container');

          if (psItems.length === 0) return;

          for (var i = 0; i < psItems.length; i += 1) {
              if (psItems[i].classList.contains('desk-only')) {
                  if (!isMobile) {
                      new _perfectScrollbar2.default(psItems[i]);
                  }
              } else {
                  new _perfectScrollbar2.default(psItems[i]);
              }
          }
      })();

// play/pause videos detalles (noticias/viajes/bonos etc)
      (function () {
          var jumbotron = document.querySelectorAll('.ezone__jumbotron');
          if (jumbotron.length === 0) return;

          for (var i = 0; i < jumbotron.length; i++) {
              new _jumbotron2.default(jumbotron[i]);
          }
      })();

// switcher
      (function () {

          var switchers = document.querySelectorAll('.switcher-ctrl');

          if (!switchers) return;

          // bind vents
          for (var i = 0; i < switchers.length; i++) {
              switchers[i].addEventListener('click', _onClickCtrl, false);
          }

          // logic
          function _onClickCtrl(evt) {
              var target = evt.currentTarget;
              var switcherTo = document.querySelector('[data-switcher-id=' + target.getAttribute('data-switcher-to') + ']');
              var switcherFrom = document.querySelector('[data-switcher-id=' + target.getAttribute('data-switcher-from') + ']');

              switcherTo.classList.add('active');
              switcherFrom.classList.remove('active');
          }
      })();

// simulator steps
      (function () {

          var goTo = new _gotostep2.default('.simulator');
          var simulatorFooter = document.querySelector('.simulator__footer');

          if (simulatorFooter === null) {
              return;
          }

          var stepCtrl = document.querySelector('.simulator__step-ctrl');
          var steps = simulatorFooter.querySelectorAll('.tabs-static__item:not(.hidden)');

          goTo.afterChange = function (activePage, id) {
              // show hide footer
              var display = id === 1 ? 'none' : 'block';
              simulatorFooter.style.display = display;

              // dinamic step and copy for one ctrl
              var step = id < 4 ? 'step' + (id + 1) : 'step1';
              stepCtrl.setAttribute('data-to', step);

              var copy = id < 4 ? 'Continuar' : 'Reiniciar simulador';
              stepCtrl.textContent = copy;

              // apply active to previous steps
              if (id > 2) steps[id - 3].classList.add('active-prev');

              if (id === 1) {
                  for (var i = 0; i < steps.length; i++) {
                      steps[i].classList.remove('active-prev');
                  }
              }
          };
      })();

// casos de exito toggler
      (function () {
          var cases = document.querySelectorAll('.cases__item');

          if (cases.length === 0) return;

          var _loop = function _loop(i) {
              var caseItem = cases[i];
              var ctrls = cases[i].querySelectorAll('.cases__open, .cases__close');

              for (var _i = 0; _i < ctrls.length; _i++) {
                  ctrls[_i].addEventListener('click', function (e) {
                      e.preventDefault();
                      if (!isMobile) {
                          var activeCase = document.querySelector('.cases__item.active');

                          if (activeCase !== null && activeCase !== caseItem) {
                              activeCase.classList.remove('active');
                          }
                      }
                      caseItem.classList.toggle('active');
                  });
              }
          };

          for (var i = 0; i < cases.length; i++) {
              _loop(i);
          }
      })();

// casos de exito control de posisión scroll en mobile
      (function () {

          if (!isMobile) return;

          var closeCtrls = document.querySelectorAll('.cases__close');
          var plusOffset = 120;

          for (var i = 0; i < closeCtrls.length; i++) {
              closeCtrls[i].addEventListener('click', function (e) {
                  var container = e.currentTarget.parentElement.parentElement.parentElement;
                  var offset = helpers.getOffsetTop(container);
                  window.scrollTo(0, offset - plusOffset);
              });
          }
      })();

// hostorias de exito control de videos automatico, al cerrar tarjeta de testimonio detener video interno
// al reproducir un video asegurar que se detenga algun otro que este en play ( este caso solo ocurre en mobile donde pueden estar varias tarjetas )
      (function () {

          var ctrls = document.querySelectorAll('.cases__open, .cases__close');
          if (ctrls.length === 0) return;

          var activeVideo = null;

          var videoCtrls = document.querySelectorAll('.play-button, video');

          for (var i = 0; i < videoCtrls.length; i++) {
              videoCtrls[i].addEventListener('click', function (e) {
                  var videoTarget = e.target.nodeName === 'VIDEO' ? e.currentTarget : e.currentTarget.parentElement.querySelector('video');

                  stopAndCleanActiveVideo(videoTarget);
              });
          }

          for (var _i2 = 0; _i2 < ctrls.length; _i2++) {
              ctrls[_i2].addEventListener('click', function () {
                  stopAndCleanActiveVideo();
              });
          }

          function stopAndCleanActiveVideo() {
              var videoTarget = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

              if (videoTarget === activeVideo) return;

              if (activeVideo !== null && !activeVideo.paused) {
                  activeVideo.click();
                  activeVideo = null;
              }

              activeVideo = videoTarget;
          }
      })();

// loader toggle temp
      (function () {

          var loader = document.querySelector('.loader');
//  var triggerLoader = document.querySelector('.trigger-loader');

//  if (triggerLoader === null) return;
//  
//  triggerLoader.addEventListener('click', function (e) {
//    e.preventDefault();

//   loader.classList.add('show');
//
//   window.setTimeout(function () {
//     return loader.classList.remove('show');
//   }, 1000);
          //});
      })();

// logic toggle form user info
      (function () {

          var toggleCtrls = document.querySelectorAll('.ezone__info-edit, .ezone__info-save');
          var container = document.querySelector('.ezone__section.user-info');
          var containerInfo = document.querySelector('.ezone__info-personal');

          var plusOffset = 100;

          for (var i = 0; i < toggleCtrls.length; i++) {
              toggleCtrls[i].addEventListener('click', function (e) {
                  e.preventDefault();

                  container.classList.toggle('active-edition');

                  if (!container.classList.contains('active-edition')) {
                      var offsetTop = helpers.getOffsetTop(containerInfo);

                      if (window.scrollY < offsetTop) return;

                      window.scrollTo(0, offsetTop - plusOffset);
                  }
              });
          }
      })();

  }, {
      "./gotostep": 2,
      "./helpers": 3,
      "./jumbotron": 4,
      "./numeric-input": 6,
      "./openClose": 7,
      "./search": 8,
      "./slider": 9,
      "./tabs": 10,
      "perfect-scrollbar": 1
  }], 6: [function (require, module, exports) {
      'use strict';

      Object.defineProperty(exports, "__esModule", {
          value: true
      });

      var _createClass = function () {
          function defineProperties(target, props) {
              for (var i = 0; i < props.length; i++) {
                  var descriptor = props[i];
                  descriptor.enumerable = descriptor.enumerable || false;
                  descriptor.configurable = true;
                  if ("value" in descriptor) descriptor.writable = true;
                  Object.defineProperty(target, descriptor.key, descriptor);
              }
          }

          return function (Constructor, protoProps, staticProps) {
              if (protoProps) defineProperties(Constructor.prototype, protoProps);
              if (staticProps) defineProperties(Constructor, staticProps);
              return Constructor;
          };
      }();

      function _classCallCheck(instance, Constructor) {
          if (!(instance instanceof Constructor)) {
              throw new TypeError("Cannot call a class as a function");
          }
      }

      var NumericInput = function () {
          function NumericInput(element) {
              var restrain = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

              _classCallCheck(this, NumericInput);

              this.el = element;

              if (this.el === null) return;

              this.restrain = restrain;
              this.plus = this.el.querySelector('span.plus');
              this.minus = this.el.querySelector('span.minus');
              this.input = this.el.querySelector('input');

              this.add = this.add.bind(this);
              this.sub = this.sub.bind(this);

              this.bindEvents();
          }

          _createClass(NumericInput, [{
              key: 'bindEvents',
              value: function bindEvents() {
                  if (this.plus !== null) {
                      this.plus.addEventListener('click', this.add, false);
                  }
                  if (this.minus !== null) {
                      this.minus.addEventListener('click', this.sub, false);
                  }
                  this.input.addEventListener('keydown', this.validate, false);
              }
          }, {
              key: 'validate',
              value: function validate(e) {
                  e = e ? e : window.event;
                  var charCode = e.which ? e.which : e.keyCode;
                  if (charCode === 8 || charCode >= 37 && charCode <= 40 || charCode >= 47 && charCode <= 57 || charCode >= 96 && charCode <= 105) {
                      return true;
                  }

                  e.preventDefault();
              }
          }, {
              key: 'add',
              value: function add(e) {
                  this.input.value = this.input.value === '' ? 1 : parseInt(this.input.value, 10) + 1;
              }
          }, {
              key: 'sub',
              value: function sub(e) {
                  if (this.input.value == this.restrain) return;

                  if (e.target.classList.contains('valid-min')) {
                      console.log(this.input.value);

                      if (this.input.value == 1) {
                          this.input.value = 1;
                      } else {
                          this.input.value = this.input.value === '' ? -1 : parseInt(this.input.value, 10) - 1;
                      }
                  } else {
                      this.input.value = this.input.value === '' ? -1 : parseInt(this.input.value, 10) - 1;
                  }
              }
          }]);

          return NumericInput;
      }();

      exports.default = NumericInput;

  }, {}], 7: [function (require, module, exports) {
      'use strict';

      Object.defineProperty(exports, "__esModule", {
          value: true
      });

      var _createClass = function () {
          function defineProperties(target, props) {
              for (var i = 0; i < props.length; i++) {
                  var descriptor = props[i];
                  descriptor.enumerable = descriptor.enumerable || false;
                  descriptor.configurable = true;
                  if ("value" in descriptor) descriptor.writable = true;
                  Object.defineProperty(target, descriptor.key, descriptor);
              }
          }

          return function (Constructor, protoProps, staticProps) {
              if (protoProps) defineProperties(Constructor.prototype, protoProps);
              if (staticProps) defineProperties(Constructor, staticProps);
              return Constructor;
          };
      }();

      function _classCallCheck(instance, Constructor) {
          if (!(instance instanceof Constructor)) {
              throw new TypeError("Cannot call a class as a function");
          }
      }

      var OpenClose = function () {
          function OpenClose(btn, elem) {
              var blockWindow = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
              var overlay = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

              _classCallCheck(this, OpenClose);

              this.btn = btn;
              this.elem = elem;

              if (this.elem === null) return;

              this.closeBtn = this.elem.querySelector('.close');
              this.blockWindow = blockWindow;
              this.overlay = overlay ? document.querySelector('.overlay') : null;

              this.show = this.show.bind(this);
              this.close = this.close.bind(this);

              this.beforeShow = this.beforeShow.bind(this);
              this.afterShow = this.afterShow.bind(this);
              this.beforeClose = this.beforeClose.bind(this);
              this.afterClose = this.afterClose.bind(this);

              this.bindEvents();
          }

          _createClass(OpenClose, [{
              key: 'bindEvents',
              value: function bindEvents() {
                  var _this = this;

                  if (Array.isArray(this.btn)) {
                      var _loop = function _loop(i) {
                          if (_this.btn[i]) {
                              _this.btn[i].addEventListener('click', function (e) {
                                  _this.show(e, _this.btn[i]);
                              }, false);
                          }
                      };

                      for (var i = 0; i < this.btn.length; i += 1) {
                          _loop(i);
                      }
                  } else if (this.btn !== null) {
                      this.btn.addEventListener('click', function (e) {
                          _this.show(e, _this.btn);
                      }, false);
                  } else {
                      this.show();
                  }

                  if (this.closeBtn !== null) {
                      this.closeBtn.addEventListener('click', this.close, false);
                  }

                  if (this.overlay !== null && !$(".modal").hasClass('closeable_modal')) {
                      this.overlay.addEventListener('click', this.close, false);

                  }
              }
          }, {
              key: 'show',
              value: function show(e, btn) {
                  /*if (typeof e !== 'undefined') {
                    e.stopPropagation();
                  }*/

                  this.beforeShow(e, btn, this.elem);

                  if (this.blockWindow) {
                      document.body.style.overflow = 'hidden';
                      document.body.style.position = 'fixed';
                      document.body.style.width = '100%';
                  }
                  if (this.overlay !== null) {
                      this.overlay.style.display = 'block';
                  }
                  this.elem.classList.add('active');

                  this.afterShow(e, btn, this.elem);
              }
          }, {
              key: 'close',
              value: function close(e) {
                  if (typeof e !== 'undefined') {
                      e.stopPropagation();
                  }

                  this.beforeClose(e, this.closeBtn, this.elem);

                  if (this.elem.classList.contains('active')) {
                      if (this.blockWindow) {
                          document.body.removeAttribute('style');
                      }
                      if (this.overlay !== null && typeof(PREVENT_CLOSE_OVERLAY)=='undefined') {
                          this.overlay.removeAttribute('style');
                      }
                      this.elem.classList.remove('active');

                      var form = this.elem.querySelector('form');

                      if (form !== null) {
                          form.reset();
                      }

                      this.afterClose(e, this.closeBtn, this.elem);
                  }
              }
          }, {
              key: 'clearInputs',
              value: function clearInputs(form) {
                  form.reset();
              }
          }, {
              key: 'beforeShow',
              value: function beforeShow(e, btn, elem) {
              }
          }, {
              key: 'afterShow',
              value: function afterShow(e, btn, elem) {
              }
          }, {
              key: 'beforeClose',
              value: function beforeClose(e, closeBtn, elem) {
              }
          }, {
              key: 'afterClose',
              value: function afterClose(e, closeBtn, elem) {
              }
          }]);

          return OpenClose;
      }();

      exports.default = OpenClose;

  }, {}], 8: [function (require, module, exports) {
      'use strict';

      Object.defineProperty(exports, "__esModule", {
          value: true
      });

      var _perfectScrollbar = require('perfect-scrollbar');

      var _perfectScrollbar2 = _interopRequireDefault(_perfectScrollbar);

      var _openClose = require('./openClose');

      var _openClose2 = _interopRequireDefault(_openClose);

      function _interopRequireDefault(obj) {
          return obj && obj.__esModule ? obj : {default: obj};
      }

      exports.default = {
          init: function init() {
              var searchElem = document.querySelector('.search');

              this.search = new _openClose2.default(document.querySelector('#isearch'), searchElem, true);
              this.searchElem = searchElem;
              this.input = searchElem.querySelector('.form-control');

              this.close = this.close.bind(this);

              this.scrollPosition = 0;

              this.start();
          },
          start: function start() {
              // initialize perfect scrollbar
              this.ps = new _perfectScrollbar2.default(this.searchElem.querySelector('.search-results'));

              this.searchElem.addEventListener('click', this.close, false);
          },
          hideShowSearchBar: function hideShowSearchBar(pos) {
              if (this.scrollPosition > pos && this.searchElem.classList.contains('hide')) {
                  this.searchElem.classList.remove('hide');
              } else if (pos > 60 && this.scrollPosition < pos && !this.searchElem.classList.contains('hide')) {
                  this.searchElem.classList.add('hide');
              }

              this.scrollPosition = pos;
          },
          close: function close(e) {
              e.stopPropagation();
              /*
              if (e.target.className === 'search active') {
                this.search.close(e);
              }
              */
          }
      };

  }, {"./openClose": 7, "perfect-scrollbar": 1}], 9: [function (require, module, exports) {
      'use strict';

      Object.defineProperty(exports, "__esModule", {
          value: true
      });

      var _createClass = function () {
          function defineProperties(target, props) {
              for (var i = 0; i < props.length; i++) {
                  var descriptor = props[i];
                  descriptor.enumerable = descriptor.enumerable || false;
                  descriptor.configurable = true;
                  if ("value" in descriptor) descriptor.writable = true;
                  Object.defineProperty(target, descriptor.key, descriptor);
              }
          }

          return function (Constructor, protoProps, staticProps) {
              if (protoProps) defineProperties(Constructor.prototype, protoProps);
              if (staticProps) defineProperties(Constructor, staticProps);
              return Constructor;
          };
      }();

      var _helpers = require('./helpers');

      function _classCallCheck(instance, Constructor) {
          if (!(instance instanceof Constructor)) {
              throw new TypeError("Cannot call a class as a function");
          }
      }

      var Slider = function () {
          function Slider(id, userOptions) {
              _classCallCheck(this, Slider);

              this.instanceID = id;
              this.instance = document.getElementById(id);
              if (!this.instance) {
                  return true;
              }

              this.isMobile = window.innerWidth < 768;
              this.isTouchDevice = window.innerWidth <= 1024;

              this.rangeTouchSize = 50;

              // default config
              this.options = {
                  navArrows: false,
                  navArrowPrev: false,
                  navArrowNext: false,
                  navBullets: false,
                  videoDetector: true,
                  muteVideos: true,
                  muteControl: false,
                  autoSlide: false,
                  autoSlideTime: 5000,
                  timeTransition: false,
                  onlyMobile: false
              };
              // set user config
              if (userOptions) {
                  for (var option in userOptions) {
                      this.options[option] = userOptions[option];
                  }
              }

              //stop constructor if mobile ctrl is active and resolution is not mobile state
              if (this.options.onlyMobile && !this.isMobile) return;

              this.activeIndex = 0;
              this.slides = document.querySelectorAll('#' + id + ' .slider__item');
              this.videos = document.querySelectorAll('#' + id + ' video');

              // validate mobile state for muteControl
              if (this.isMobile) {
                  this.options.muteControl = false;
              }

              this.init();
          }

          _createClass(Slider, [{
              key: 'init',
              value: function init() {
                  if (this.options.navArrows) {
                      this.makeArrows();
                  }
                  if (this.options.navBullets) {
                      this.makeBullets();
                  }
                  if (this.options.muteControl && !this.isMobile) {
                      this.makeMuteControl();
                  }
                  if (this.options.timeTransition) {
                      this.applyTimeTransition();
                  }

                  if (this.options.autoSlide) {
                      this.initAutoSlide();
                  } else if (this.videos !== null) {
                      for (var i = 0; i < this.videos.length; i++) {
                          this.videos[i].loop = true;
                      }
                  }

                  if (this.options.muteVideos && this.videos !== null) {
                      this.audioVideosControl();
                  }

                  this.instance.classList.add('initialized');
                  if (this.slides.length > 0) {
                      this.slides[0].classList.add('active');
                  }

                  if (this.options.videoDetector) {
                      this.videoDetector();
                  }

                  this.bindEvents();
              }
          }, {
              key: 'applyTimeTransition',
              value: function applyTimeTransition() {
                  for (var i = 0; i < this.slides.length; i++) {
                      var styles = this.slides[i].getAttribute('style');
                      styles = styles ? styles : '';
                      styles += 'animation-duration: ' + this.options.timeTransition + 'ms;';
                      this.slides[i].setAttribute('style', styles);
                  }
              }
          }, {
              key: 'makeArrows',
              value: function makeArrows() {
                  var arrow = document.createElement('a');
                  arrow.setAttribute('href', '#');
                  arrow.setAttribute('class', 'slider__ctrl');

                  var prevArrow = arrow.cloneNode();
                  prevArrow.setAttribute('data-dir', 'prev');
                  prevArrow.classList.add('prev');
                  if (this.options.navArrowPrev) {
                      prevArrow.innerHTML = this.options.navArrowPrev;
                  }

                  var nextArrow = arrow.cloneNode();
                  nextArrow.setAttribute('data-dir', 'next');
                  nextArrow.classList.add('next');
                  if (this.options.navArrowNext) {
                      nextArrow.innerHTML = this.options.navArrowNext;
                  }

                  this.instance.appendChild(prevArrow);
                  this.instance.appendChild(nextArrow);

                  this.arrows = document.querySelectorAll('#' + this.instanceID + ' .slider__ctrl');
              }
          }, {
              key: 'makeBullets',
              value: function makeBullets() {
                  var bulletLink = document.createElement('a');
                  bulletLink.setAttribute('href', '#');

                  var bullet = document.createElement('li');
                  bullet.setAttribute('class', 'slider__bullet');
                  bullet.appendChild(bulletLink);

                  var bulletsContainer = document.createElement('ul');
                  bulletsContainer.setAttribute('class', 'slider__bullets list-nostyle');

                  for (var i = 0; i < this.slides.length; i++) {
                      var bulletNode = bullet.cloneNode(true);
                      bulletNode.setAttribute('data-index', i);

                      bulletsContainer.appendChild(bulletNode);
                  }

                  this.instance.appendChild(bulletsContainer);
                  this.bullets = bulletsContainer.children;
                  if (this.bullets.length > 0) {
                      this.bullets[0].classList.add('active');
                  }
              }
          }, {
              key: 'makeMuteControl',
              value: function makeMuteControl() {
                  this.muteCtrl = null;

                  var ctrlWrap = document.createElement('a');
                  ctrlWrap.setAttribute('href', '#');
                  ctrlWrap.setAttribute('id', 'mute-ctrl');
                  ctrlWrap.setAttribute('class', 'slider__mutectrl mute');

                  var ctrlImage = document.createElement('img');
                  ctrlImage.setAttribute('src', _MUTE_CONTROL_ICON);
                  ctrlWrap.appendChild(ctrlImage);

                  var ctrlItem = document.createElement('span');

                  for (var i = 0; i < 5; i++) {
                      var itemNode = ctrlItem.cloneNode();
                      ctrlWrap.appendChild(itemNode);
                  }
                  this.muteCtrl = ctrlWrap;
                  this.instance.appendChild(this.muteCtrl);
              }
          }, {
              key: 'initAutoSlide',
              value: function initAutoSlide() {
                  this.timer = setInterval(this.nextHandler.bind(this), this.options.autoSlideTime);
              }
          }, {
              key: 'audioVideosControl',
              value: function audioVideosControl() {
                  if (this.options.muteControl) {
                      this.muteCtrl.classList.toggle('mute');
                  }

                  if (_YOUTUBE_PATCH == true) {
                      if (players[1].isMuted()) {
                          players[1].unMute();
                      } else {
                          players[1].mute();
                      }
                      videoIndex = 1;
                      this.activeYoutube = document.querySelector('#' + this.instanceID + ' .slider__item.active iframe');
                      _YOUTUBE_PATCH = false;
                  }
                  if (this.activeVideo != null) {
                      if (this.activeVideo.muted) {
                          this.activeVideo.muted = false;
                      } else {
                          this.activeVideo.muted = true;
                      }
                  }
                  if (this.activeYoutube != null) {
                      var videoIndex = $(this.activeYoutube).data('index');
                      if (players[videoIndex].isMuted()) {
                          players[videoIndex].unMute();
                      } else {
                          players[videoIndex].mute();
                      }
                  }

                  for (var i = 0; i < this.videos.length; i++) {
                      this.videos[i].muted = this.options.muteControl ? this.muteCtrl.classList.contains('mute') : this.options.muteVideos;
                  }
              }
          }, {
              key: 'resetAutoSlide',
              value: function resetAutoSlide() {
                  clearInterval(this.timer);
                  this.initAutoSlide();
              }
          }, {
              key: 'stopAutoSlide',
              value: function stopAutoSlide() {
                  clearInterval(this.timer);
              }
          }, {
              key: 'bindEvents',
              value: function bindEvents() {
                  var _this = this;

                  if (this.isTouchDevice) {
                      this.instance.addEventListener('touchstart', function (e) {
                          _this.touchStartPos = e.changedTouches[0].clientX;
                      }, false);

                      this.instance.addEventListener('touchend', function (e) {
                          _this.touchEndPos = e.changedTouches[0].clientX;

                          _this.validateTouchGesture();
                      }, false);
                  }

                  if (this.options.navArrows) {
                      for (var i = 0; i < this.arrows.length; i++) {
                          this.arrows[i].addEventListener('click', this.onClickArrow.bind(this), false);
                      }
                  }

                  if (this.options.navBullets) {
                      for (var _i = 0; _i < this.bullets.length; _i++) {
                          this.bullets[_i].addEventListener('click', this.onClickBullet.bind(this), false);
                      }
                  }

                  var animationEvent = (0, _helpers.whichAnimationEvent)();
                  for (var _i2 = 0; _i2 < this.slides.length; _i2++) {
                      this.slides[_i2].addEventListener(animationEvent, this.onAnimationSlideEnd.bind(this), false);
                  }

                  if (this.options.muteControl && this.muteControl !== null) {
                      this.muteCtrl.addEventListener('click', function (e) {
                          e.preventDefault();
                          _this.audioVideosControl();
                      }, false);

                      if (this.videos !== null) {
                          for (var _i3 = 0; _i3 < this.videos.length; _i3++) {
                              this.videos[_i3].addEventListener('playing', this.onPlayingVideo.bind(this), false);
                              //this.videos[_i3].addEventListener('waiting', this.onWaitingVideo.bind(this), false);
                              // this.videos[i].addEventListener('progress', () => { alert('progress trigger!!!'); } , false);
                              // this.videos[i].addEventListener('loadeddata', () => { alert('loaded data trigger!!!'); } , false);
                              // this.videos[i].addEventListener('error', () => { alert('error trigger!!!'); } , false);
                              // this.videos[i].addEventListener('abort', () => { alert('abort trigger!!!'); } , false);
                              // this.videos[i].addEventListener('suspend', () => { alert('suspend trigger!!!'); } , false);
                              // this.videos[i].addEventListener('emptied', () => { alert('emptied trigger!!!'); } , false);
                              // this.videos[i].addEventListener('canplay', () => { alert('canplay trigger!!!'); } , false);
                              // this.videos[i].addEventListener('stalled', () => { alert('stalled trigger!!!'); } , false);
                              // this.videos[i].addEventListener('loadstart', () => { alert('loadstart trigger!!!'); } , false);
                          }
                      }
                  }
              }
          }, {
              key: 'onPlayingVideo',
              value: function onPlayingVideo() {
                  if (this.activeVideo != null) {
                      this.activeVideo.classList.add('show');
                      this.muteCtrl.classList.add('show');
                  }
                  // alert('play!!');
              }
          }, {
              key: 'onWaitingVideo',
              value: function onWaitingVideo() {
                  this.muteCtrl.classList.remove('show');
              }
          }, {
              key: 'validateTouchGesture',
              value: function validateTouchGesture() {
                  var diference = Math.abs(this.touchStartPos - this.touchEndPos);

                  if (diference > this.rangeTouchSize) {

                      if (this.touchStartPos < this.touchEndPos) {
                          this.prevHandler();
                      } else {
                          this.nextHandler();
                      }
                  }
              }
          }, {
              key: 'onAnimationSlideEnd',
              value: function onAnimationSlideEnd(e) {
                  var target = e.target;

                  target.classList.remove('moving', 'entry', 'leave', 'next', 'prev');
              }
          }, {
              key: 'onClickArrow',
              value: function onClickArrow(e) {
                  e.preventDefault();

                  var target = e.currentTarget,
                      dir = target.getAttribute('data-dir'),
                      method = this[dir + 'Handler'].bind(this);

                  if (this.options.autoSlide) {
                      this.resetAutoSlide();
                  }

                  method();
              }
          }, {
              key: 'onClickBullet',
              value: function onClickBullet(e) {
                  e.preventDefault();

                  var targetIndex = parseInt(e.currentTarget.getAttribute('data-index'));

                  // stop function if click on active bullet
                  if (targetIndex === this.activeIndex) return;

                  var dir = targetIndex > this.activeIndex ? 'next' : 'prev';

                  if (this.options.autoSlide) {
                      this.resetAutoSlide();
                  }

                  this.changeSlide(targetIndex, dir);

                  this.activeIndex = targetIndex;

                  this.updateBullets();
              }
          }, {
              key: 'nextHandler',
              value: function nextHandler() {
                  var nextIndex = this.activeIndex < this.slides.length - 1 ? this.activeIndex + 1 : 0;

                  this.changeSlide(nextIndex, 'next');

                  this.activeIndex = this.activeIndex < this.slides.length - 1 ? this.activeIndex + 1 : 0;

                  if (this.options.navBullets) {
                      this.updateBullets();
                  }
              }
          }, {
              key: 'prevHandler',
              value: function prevHandler() {
                  var prevIndex = this.activeIndex > 0 ? this.activeIndex - 1 : this.slides.length - 1;

                  this.changeSlide(prevIndex, 'prev');

                  this.activeIndex = this.activeIndex > 0 ? this.activeIndex - 1 : this.slides.length - 1;

                  if (this.options.navBullets) {
                      this.updateBullets();
                  }
              }
          }, {
              key: 'changeSlide',
              value: function changeSlide(comingIndex, dir) {
                  var current = this.slides[this.activeIndex],
                      comingSlide = this.slides[comingIndex];
                  if (_YOUTUBE_PATCH) {
                      _YOUTUBE_PATCH = false;
                  }

                  if (this.options.videoDetector && this.activeVideo !== null) {
                      this.stopActiveVideo();
                  }
                  if (this.activeYoutube !== null) {
                      var index = $(this.activeYoutube).data('index');
                      players[index].pauseVideo();
                  }

                  current.classList.remove('active');
                  current.classList.add('moving', 'leave', dir);

                  comingSlide.classList.add('active', 'entry', 'moving', dir);

                  if (this.options.videoDetector) {
                      this.videoDetector();
                  }
              }
          }, {
              key: 'updateBullets',
              value: function updateBullets() {
                  var currentBullet = document.querySelector('#' + this.instanceID + ' .slider__bullet.active');
                  currentBullet.classList.remove('active');

                  this.bullets[this.activeIndex].classList.add('active');
              }
          }, {
              key: 'videoDetector',
              value: function videoDetector() {
                  //this.activeVideo = document.querySelector('#' + this.instanceID + ' .slider__item.active video');
                  this.activeVideo = document.querySelector('#' + this.instanceID + ' .slider__item.active stream');
                  this.activeYoutube = document.querySelector('#' + this.instanceID + ' .slider__item.active iframe');
                  if (this.options.muteControl) {
                      this.muteCtrl.classList.add('mute');
                  }
                  $(this.activeVideo).prop('muted', true); //mute
                  if (this.activeVideo !== null || this.activeYoutube != null) {
                      if (this.activeYoutube != null) {
                          var videoIndex = $(this.activeYoutube).data('index');
                          if (!_IS_MOBILE) {
                              players[videoIndex].playVideo().mute();
                          }
                      }
                      if (this.activeVideo != null) {
                          if (!_IS_MOBILE) {
                              try {
                                  this.activeVideo.play();
                                  this.activeVideo.classList.add('show');
                              } catch (err) {
                                  console.log(err);
                              }
                              $('#mute-ctrl').addClass('show');
                          }
                          this.bindVideoEvents();
                      }
                      if (this.options.autoSlide) {
                          this.stopAutoSlide();
                      }
                  } else if (this.options.muteControl) {
                      this.muteCtrl.classList.remove('show');
                  }
              }
          }, {
              key: 'stopActiveVideo',
              value: function stopActiveVideo() {
                  //this.activeVideo.onended = null;
                  this.activeVideo.muted = true;
                  this.activeVideo.pause();
                  //this.activeVideo.currentTime = 0;
                  this.activeVideo.classList.remove('show');
              }
          }, {
              key: 'bindVideoEvents',
              value: function bindVideoEvents() {
                  this.activeVideo.onended = this.endVideoHandler.bind(this);
              }
          }, {
              key: 'endVideoHandler',
              value: function endVideoHandler() {
                  if (this.options.autoSlide) {
                      this.nextHandler();
                      this.resetAutoSlide();
                  }
              }
          }]);

          return Slider;
      }();

      exports.default = Slider;

  }, {"./helpers": 3}], 10: [function (require, module, exports) {
      'use strict';

      Object.defineProperty(exports, "__esModule", {
          value: true
      });

      var _createClass = function () {
          function defineProperties(target, props) {
              for (var i = 0; i < props.length; i++) {
                  var descriptor = props[i];
                  descriptor.enumerable = descriptor.enumerable || false;
                  descriptor.configurable = true;
                  if ("value" in descriptor) descriptor.writable = true;
                  Object.defineProperty(target, descriptor.key, descriptor);
              }
          }

          return function (Constructor, protoProps, staticProps) {
              if (protoProps) defineProperties(Constructor.prototype, protoProps);
              if (staticProps) defineProperties(Constructor, staticProps);
              return Constructor;
          };
      }();

      function _classCallCheck(instance, Constructor) {
          if (!(instance instanceof Constructor)) {
              throw new TypeError("Cannot call a class as a function");
          }
      }

      var Tab = function () {
          function Tab(elem) {
              _classCallCheck(this, Tab);

              if (elem === null) return;

              this.elem = elem;

              this.show = this.show.bind(this);

              this.init();
          }

          _createClass(Tab, [{
              key: 'init',
              value: function init() {
                  var _this = this;

                  var links = this.elem.querySelectorAll('.tabs__item');
                  this.activeItem = this.elem.querySelector('.tabs__item.active');
                  this.activePane = this.elem.querySelector('.tabs__pane.active');

                  var _loop = function _loop(i) {
                      links[i].addEventListener('click', function (e) {
                          e.preventDefault();
                          _this.show.call(null, links[i]);
                      }, false);
                  };

                  for (var i = 0; i < links.length; i += 1) {
                      _loop(i);
                  }
              }
          }, {
              key: 'show',
              value: function show(target) {
                  var link = target.querySelector('a').getAttribute('href');
                  var pane = this.elem.querySelector(link);

                  if (pane === null) return;

                  this.activePane.classList.remove('active');
                  pane.classList.add('active');
                  this.activeItem.classList.remove('active');
                  target.classList.add('active');

                  this.activeItem = target;
                  this.activePane = pane;
              }
          }]);

          return Tab;
      }();

      exports.default = Tab;

  }, {}]
}, {}, [5]);


function hideCookiesDocument(type) {
  form = $("#save_cookies");
  $("#type_option").val(type);
  var request = $.ajax({
      type: "POST",
      url: form.attr('action'),
      data: form.serialize(),
      statusCode: {
          419: function () {
              window.location.href = URL_PROJECT;
          }
      }
  });
  return request;
}

function hidePanel(type) {
  form = $("#save_cookies");
  $("#type_option").val(type);
  country = $("#country_current_selected").val();
  $("#country_selected").val(country);
  $.ajax({
      type: "POST",
      url: form.attr('action'),
      data: form.serialize(),
      statusCode: {
          419: function () {
              window.location.href = URL_PROJECT;
          }
      }
  })
      .done(function (data) {
          $("#cookies").hide();
      })
      .fail(function (data) {
          console.log(data);
      });
}


function existSurvey() {
  form = $("#exist_survey");
  var request = $.ajax({
      type: "POST",
      url: form.attr('action'),
      data: form.serialize(),
      statusCode: {
          419: function () {
              window.location.href = URL_PROJECT;
          }
      }
  });
  return request;
}

function hideSurvay() {
  $("#survey").hide();
//    localStorage.removeItem("clicks");
  //localStorage.setItem("made_survay", true);
  localStorage.setItem("made_survay_"+typeSurveyAvailable, true);
}

function showSurvay() {
  form = $("#list_cuestions");
  //a comment for dinamic surver by global var config
  //$("#type").val("portal");
  $.ajax({
      type: "POST",
      url: form.attr('action'),
      data: form.serialize(),
      statusCode: {
          419: function () {
              window.location.href = URL_PROJECT;
          }
      }
  }).done(function (data) {
      if (data.exist) {
          //var cuestions=$("#msform");
          $("#panel-survey").html(data.view);
          $("#survey").fadeIn(2000);
      }
  })
      .fail(function (data) {
          console.log(data);
      });
}

var survay_show = false;
var survay_showing = false;

//$(document).ready(showSurveyExist);

/**
* update function by change portal question
* @author: ECORONA
*/

function showSurveyExist() {
  var flat_survay = localStorage.getItem('made_survay_'+typeSurveyAvailable);
  if (flat_survay !== "true" && survay_show === false) {
      if (survay_showing === false) {
          setTimeout(function () {
              existSurvey().done(function (data) {
                  if (data === "true") {
                      survay_showing = true;
                      survay_show = true;
                      var showSurvayPage = true;
                      if(surveyInDA == 1 && zoneDistributorArea == 0){
                          showSurvayPage = false;
                      }
                      showSurvayPage ? showSurvay() : '';
                  } else {
                      survay_showing = true;
                      survay_show = true;
                  }
              });
          }, 120000);
      }
  }
}


var current_fs, next_fs, previous_fs; //fieldsets
var left, opacity, scale; //fieldset properties which we will animate
var animating; //flag to prevent quick multi-click glitches


function nextQuestion(boton) {
  var boton_actual = $("#" + boton.id);
  current_fs = boton_actual.parent();
  next_fs = boton_actual.parent().next();
  var inputs = current_fs.find('.inputs_surveys');
  var existsRadioChecked = false;var countRadios = 0;
  var existsTextValue = false;var countsText = 0;
  continuar = true;
  $.each(inputs, function (index, input) {
      var type = input.type;
      switch (type) {
          case 'radio':
              countRadios++;
              input.checked ? existsRadioChecked = true : '';
              break;
          case 'text':case 'textarea':
              countsText++;
              input.value.trim().length != 0 ? existsTextValue = true : '';
              break;
      }
  });
  if(countRadios > 0 && !existsRadioChecked){
      continuar = false;
  }if(countsText > 0 && !existsTextValue){
      continuar = false;
  }
  if (continuar) {
      //activate next step on progressbar using the index of next_fs
      $("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");
      next_fs.show();
      current_fs.animate({opacity: 0}, {
          step: function (now, mx) {
              scale = 1 - (1 - now) * 0.2;
              left = (now * 50) + "%";
              opacity = 1 - now;
              current_fs.css({
                  'transform': 'scale(' + scale + ')',
                  'position': 'absolute'
              });
              next_fs.css({'left': left, 'opacity': opacity});
          },
          duration: 700,
          complete: function () {
              current_fs.hide();
              animating = false;
          },
          //this comes from the custom easing plugin
          easing: 'easeInOutBack'
      });
  } else {
      var div = current_fs.children('div');
      div.css("border", "red");
      div.css("border-style", "solid");
      div.css("border-width", "thin");
      setTimeout(function () {
          div.css("border", "");
          div.css("border-style", "");
          div.css("border-width", "");
      }, 1000);
  }

}


function previousFieldset(boton) {
  if (animating)
      return false;
  animating = true;
  var boton_actual = $("#" + boton.id);

  current_fs = boton_actual.parent();
  previous_fs = boton_actual.parent().prev();

  //de-activate current step on progressbar
  $("#progressbar li").eq($("fieldset").index(current_fs)).removeClass("active");

  //show the previous fieldset
  previous_fs.show();
  //hide the current fieldset with style
  current_fs.animate({opacity: 0}, {
      step: function (now, mx) {
          //as the opacity of current_fs reduces to 0 - stored in "now"
          //1. scale previous_fs from 80% to 100%
          scale = 0.8 + (1 - now) * 0.2;
          //2. take current_fs to the right(50%) - from 0%
          left = ((1 - now) * 50) + "%";
          //3. increase opacity of previous_fs to 1 as it moves in
          opacity = 1 - now;
          current_fs.css({'left': left});
          previous_fs.css({'transform': 'scale(' + scale + ')', 'opacity': opacity});
      },
      duration: 800,
      complete: function () {
          current_fs.hide();
          animating = false;
      },
      //this comes from the custom easing plugin
      easing: 'easeInOutBack'
  });

}

function check(event, form) {
  event.preventDefault();

  var current_fs = $("#fieldset-1");
  var next_fs = $("#fieldset-2");
  var inputs = current_fs.find('input');
  continuar = false;
  $.each(inputs, function (index, value) {
      if (value.checked === true) {
          continuar = true;
      }
  });
  if (continuar) {
      $("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");

      next_fs.show();
      current_fs.animate({opacity: 0}, {
          step: function (now, mx) {
              scale = 1 - (1 - now) * 0.2;
              left = (now * 50) + "%";
              opacity = 1 - now;
              current_fs.css({
                  'transform': 'scale(' + scale + ')',
                  'position': 'absolute'
              });
              next_fs.css({'left': left, 'opacity': opacity});
          },
          duration: 700,
          complete: function () {
              current_fs.hide();
              animating = false;
          },
          //this comes from the custom easing plugin
          easing: 'easeInOutBack'
      });


  } else {
      var div = current_fs.children('div');
      div.css("border", "red");
      div.css("border-style", "solid");
      div.css("border-width", "thin");
      setTimeout(function () {
          div.css("border", "");
          div.css("border-style", "");
          div.css("border-width", "");
      }, 1000);
  }

}

function saveSurvey(boton) {
  form = $("#msform");
  var boton_actual = $("#" + boton.id);
  var enviado = false;
  if (!enviado) {
      //boton_actual.attr("disabled", true);
      current_fs = boton_actual.parent();
      previous_fs = boton_actual.parent().prev();
      var inputs = current_fs.find('.inputs_surveys');
      var existsRadioChecked = false;var countRadios = 0;
      var existsTextValue = false;var countsText = 0;
      continuar = true;
      $.each(inputs, function (index, input) {
          var type = input.type;
          switch (type) {
              case 'radio':
                  countRadios++;
                  input.checked ? existsRadioChecked = true : '';
                  break;
              case 'text':case 'textarea':
                  countsText++;
                  input.value.trim().length != 0 ? existsTextValue = true : '';
                  break;
          }
      });
      if(countRadios > 0 && !existsRadioChecked){
          continuar = false;
      }if(countsText > 0 && !existsTextValue){
          continuar = false;
      }
      if (continuar) {
          enviado = true;
          result = form.serialize();
          //$("#type").val("portal");
          $.ajax({
              type: "POST",
              url: form.attr('action'),
              data: result,
              statusCode: {
                  419: function () {
                      window.location.href = URL_PROJECT;
                  }
              }
          }).done(function (data) {
              if (data === "1") {
                  nextQuestion(boton);
                  setTimeout(function () {
                      hideSurvay();
                  }, 2000);
              }
          })
              .fail(function (data) {
                  hideSurvay();
              });

      } else {
          var div = current_fs.children('div');
          div.css("border", "red");
          div.css("border-style", "solid");
          div.css("border-width", "thin");
          setTimeout(function () {
              div.css("border", "");
              div.css("border-style", "");
              div.css("border-width", "");
          }, 1000);
      }

  }


}

setTimeout(function () {
  $('#blank-overlay').attr('style', '');
}, 180);

if (!_IS_MOBILE && $('#cloudflare-slide-1')) {
  $('#cloudflare-slide-1').attr('autoplay', '');
}

function checkTinkerbell() {
  var tinkerbell = $('#itinkerbell');
  if (tinkerbell != null) {
      if (tinkerbell.data('ids') != undefined && tinkerbell.data('ids') != '') {
          var ids = tinkerbell.data('ids').toString();
          var advertisementsIds = ids.split(',');
          var notifications = advertisementsIds.length;

          advertisementsIds.forEach(function (item) {
              if (localStorage.getItem('advertisement-id-' + item) === '1') {
                  notifications--;
              }
          });
          if (notifications > 0) {
              $('#tinkerbell-counter').html(notifications).show();
          }
      }
      tinkerbell.click(function () {
          window.location.href = $(this).data('url');
      });
  }
}

checkTinkerbell();

$(document).ready(function(){
  showSurveyExist();
  $('body').on('click','input.inputs_surveys',function(){
      var input = $(this);
      if(!input.hasClass('input_comment')){
          var comment = input.closest('fieldset').find('input.input_comment');
          comment.length != 0 && comment.data('add_validation') == 0 ? comment.removeClass('inputs_surveys') : '';
          if(input.attr('type') == 'radio'){
              if(input.val() == 'other'){
                  comment.length == 0 ? '': comment.addClass('inputs_surveys');
              }
          }
      }
  });
});