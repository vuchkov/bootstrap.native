/* Native JavaScript for Bootstrap Polyfill
--------------------------------------------*/
(function () {

  // document | window | element + corrections
  var
    _DOCUMENT = this.Document || this.HTMLDocument, // IE8
    _WINDOW = this.constructor || this.Window || Window; // old Safari

  // Element
  if (!window.HTMLElement) { window.HTMLElement = window.Element; }

  // Array.prototype.indexOf
  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement) {
      if (this === undefined || this === null) {
        throw new TypeError(this + ' is not an object');
      }

      var arraylike = this instanceof String ? this.split('') : this,
        lengthValue = Math.max(Math.min(arraylike.length, 9007199254740991), 0) || 0,
        index = Number(arguments[1]) || 0;

      index = (index < 0 ? Math.max(lengthValue + index, 0) : index) - 1;

      while (++index < lengthValue) {
        if (index in arraylike && arraylike[index] === searchElement) {
          return index;
        }
      }

      return -1;
    };
  }

  if (!String.prototype.trim) {
    String.prototype.trim = function () {
      return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    };
  }

  // Element.prototype.classList by thednp, inspired by Remy Sharp
  if (!('classList' in Element.prototype)) {
    var ClassLIST = function (elem) {
      var classArr = (elem.getAttribute('class') || '').trim().split(/\s+/) || [],

        // methods
        hasClass = this.contains = function (classNAME) {
          return classArr.indexOf(classNAME) > -1;
        },
        addClass = this.add = function (classNAME) {
          if (!hasClass(classNAME)) {
            classArr.push(classNAME);
            elem.setAttribute('class', classArr.join(' '));
          }
        },
        removeClass = this.remove = function (classNAME) {
          if (hasClass(classNAME)) {
            classArr.splice(classArr.indexOf(classNAME), 1);
            elem.setAttribute('class', classArr.join(' '));
          }
        },
        toggleClass = this.toggle = function (classNAME) {
          if (hasClass(classNAME)) { removeClass(classNAME); }
          else { addClass(classNAME); }
        };
    }
    Object.defineProperty(Element.prototype, 'classList', { get: function () { return new ClassLIST(this); } });
  }

  // Element.prototype.closest 
  // https://github.com/idmadj/element-closest-polyfill/blob/master/index.js
  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  }

  if (!Element.prototype.closest) {
    Element.prototype.closest = function (s) {
      var el = this;

      do {
        if (el.matches(s)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      return null;
    };
  }

  // Event
  if (!window.Event || !_WINDOW.prototype.Event) {
    window.Event = _WINDOW.prototype.Event = _DOCUMENT.prototype.Event = Element.prototype.Event = function (type, eventInitDict) {
      if (!type) { throw new Error('Not enough arguments'); }
      var event,
        bubblesValue = eventInitDict && eventInitDict.bubbles !== undefined ? eventInitDict.bubbles : false,
        cancelableValue = eventInitDict && eventInitDict.cancelable !== undefined ? eventInitDict.cancelable : false;
      if ('createEvent' in document) {
        event = document.createEvent('Event');
        event.initEvent(type, bubblesValue, cancelableValue);
      } else {
        event = document.createEventObject();
        event.etype = type;
        event.bubbles = bubblesValue;
        event.cancelable = cancelableValue;
      }
      return event;
    };
  }

  // CustomEvent
  if (!window.CustomEvent || !_WINDOW.prototype.CustomEvent) {
    window.CustomEvent = _WINDOW.prototype.CustomEvent = _DOCUMENT.prototype.CustomEvent = Element.prototype.CustomEvent = function (type, eventInitDict) {
      if (!type) {
        throw Error('CustomEvent TypeError: An event name must be provided.');
      }
      var event = new Event(type, eventInitDict);
      event.detail = eventInitDict && eventInitDict.detail || null;
      return event;
    };
  }

  // addEventListener | removeEventListener
  if (!window.addEventListener || !_WINDOW.prototype.addEventListener) {
    window.addEventListener = _WINDOW.prototype.addEventListener = _DOCUMENT.prototype.addEventListener = Element.prototype.addEventListener = function () {
      var element = this,
        type = arguments[0],
        listener = arguments[1];

      if (!element._events) { element._events = {}; }

      if (!element._events.type) {
        element._events.type = function (event) {
          var list = element._events[event.etype].list,
            events = list.slice(),
            index = -1,
            lengthValue = events.length,
            eventElement;

          event.preventDefault = function () {
            if (event.cancelable !== false) {
              event.returnValue = false;
            }
          };

          event.stopPropagation = function () {
            event.cancelBubble = true;
          };

          event.stopImmediatePropagation = function () {
            event.cancelBubble = true;
            event.cancelImmediate = true;
          };

          event.currentTarget = element;
          event.relatedTarget = event.relatedTarget || event.fromElement || null;
          event.target = event.target || event.srcElement || element;
          event.timeStamp = new Date().getTime();

          if (event.clientX) {
            event.pageX = event.clientX + document.documentElement.scrollLeft;
            event.pageY = event.clientY + document.documentElement.scrollTop;
          }

          while (++index < lengthValue && !event.cancelImmediate) {
            if (index in events) {
              eventElement = events[index];

              if (list.indexOf(eventElement) !== -1 && typeof eventElement === 'function') {
                eventElement.call(element, event);
              }
            }
          }
        };

        element._events.type.list = [];

        if (element.attachEvent) {
          element.attachEvent('on' + type, element._events.type);
        }
      }

      element._events.type.list.push(listener);
    };

    window.removeEventListener = _WINDOW.prototype.removeEventListener = _DOCUMENT.prototype.removeEventListener = Element.prototype.removeEventListener = function () {
      var element = this,
        type = arguments[0],
        listener = arguments[1],
        index;

      if (element._events && element._events.type && element._events.type.list) {
        index = element._events.type.list.indexOf(listener);

        if (index !== -1) {
          element._events.type.list.splice(index, 1);

          if (!element._events.type.list.length) {
            if (element.detachEvent) {
              element.detachEvent('on' + type, element._events.type);
            }
            delete element._events.type;
          }
        }
      }
    };
  }

  // Event dispatcher
  if (!window.dispatchEvent || !_WINDOW.prototype.dispatchEvent || !_DOCUMENT.prototype.dispatchEvent || !Element.prototype.dispatchEvent) {
    window.dispatchEvent = _WINDOW.prototype.dispatchEvent = _DOCUMENT.prototype.dispatchEvent = Element.prototype.dispatchEvent = function (event) {
      if (!arguments.length) {
        throw new Error('Not enough arguments');
      }

      if (!event || typeof event.etype !== 'string') {
        throw new Error('DOM Events Exception 0');
      }

      var element = this, type = event.etype;

      try {
        if (!event.bubbles) {
          event.cancelBubble = true;

          var cancelBubbleEvent = function (event) {
            event.cancelBubble = true;

            (element || window).detachEvent('on' + type, cancelBubbleEvent);
          };

          this.attachEvent('on' + type, cancelBubbleEvent);
        }

        this.fireEvent('on' + type, event);
      } catch (error) {
        event.target = element;

        do {
          event.currentTarget = element;

          if ('_events' in element && typeof element._events.type === 'function') {
            element._events.type.call(element, event);
          }

          if (typeof element['on' + type] === 'function') {
            element['on' + type].call(element, event);
          }

          element = element.nodeType === 9 ? element.parentWindow : element.parentNode;
        } while (element && !event.cancelBubble);
      }

      return true;
    };
  }

  // Production steps of ECMA-262, Edition 6, 22.1.2.1
  if (!Array.from) {
    Array.from = (function () {
      var toStr = Object.prototype.toString;
      var isCallable = function (fn) {
        return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
      };
      var toInteger = function (value) {
        var number = Number(value);
        if (isNaN(number)) { return 0; }
        if (number === 0 || !isFinite(number)) { return number; }
        return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
      };
      var maxSafeInteger = Math.pow(2, 53) - 1;
      var toLength = function (value) {
        var len = toInteger(value);
        return Math.min(Math.max(len, 0), maxSafeInteger);
      };

      return function from(arrayLike/*, mapFn, thisArg */) {
        var C = this;

        var items = Object(arrayLike);

        if (arrayLike == null) {
          throw new TypeError('Array.from requires an array-like object - not null or undefined');
        }

        var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
        var T;
        if (typeof mapFn !== 'undefined') {
          if (!isCallable(mapFn)) {
            throw new TypeError('Array.from: when provided, the second argument must be a function');
          }

          if (arguments.length > 2) {
            T = arguments[2];
          }
        }
        var len = toLength(items.length);
        var A = isCallable(C) ? Object(new C(len)) : new Array(len);

        // 16. Let k be 0.
        var k = 0;
        // 17. Repeat, while k < len… (also steps a - h)
        var kValue;
        while (k < len) {
          kValue = items[k];
          if (mapFn) {
            A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
          } else {
            A[k] = kValue;
          }
          k += 1;
        }
        A.length = len;
        return A;
      };
    }());
  }
  if (!Node.prototype.contains) {
    Node.prototype.contains = function (el) {
      while (el = el.parentNode) {
        if (el === this) return true;
      }
      return false;
    }
  }
}());