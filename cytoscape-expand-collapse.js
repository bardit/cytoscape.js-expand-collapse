(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cytoscapeExpandCollapse = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var boundingBoxUtilities = {
  equalBoundingBoxes: function(bb1, bb2){
      return bb1.x1 == bb2.x1 && bb1.x2 == bb2.x2 && bb1.y1 == bb2.y1 && bb1.y2 == bb2.y2;
  },
  getUnion: function(bb1, bb2){
      var union = {
      x1: Math.min(bb1.x1, bb2.x1),
      x2: Math.max(bb1.x2, bb2.x2),
      y1: Math.min(bb1.y1, bb2.y1),
      y2: Math.max(bb1.y2, bb2.y2),
    };

    union.w = union.x2 - union.x1;
    union.h = union.y2 - union.y1;

    return union;
  }
};

module.exports = boundingBoxUtilities;
},{}],2:[function(_dereq_,module,exports){
var debounce = _dereq_('./debounce');
var elementUtilities;//test

module.exports = function (params, cy) {
  var fn = params;

  var eMouseOver, eMouseOut, ePosition, eRemove, eTap, eZoom, eAdd, eFree;
  var functions = {
    init: function () {
      var self = this;
      var opts = params;
      var $container = this;
      var cy = this.cytoscape('get');
      var $canvas = $('<canvas></canvas>');
      elementUtilities = _dereq_('./elementUtilities')(cy);

      $container.append($canvas);

      var _sizeCanvas = debounce(function () {
        $canvas
          .attr('height', $container.height())
          .attr('width', $container.width())
          .css({
            'position': 'absolute',
            'top': 0,
            'left': 0,
            'z-index': '999'
          })
        ;

        setTimeout(function () {
          var canvasBb = $canvas.offset();
          var containerBb = $container.offset();

          $canvas
            .css({
              'top': -(canvasBb.top - containerBb.top),
              'left': -(canvasBb.left - containerBb.left)
            })
          ;

          // refresh the cues on canvas resize
          if(cy){
            clearDraws(true);
          }
        }, 0);

      }, 250);

      function sizeCanvas() {
        _sizeCanvas();
      }

      sizeCanvas();

      $(window).bind('resize', function () {
        sizeCanvas();
      });

      var ctx = $canvas[0].getContext('2d');

      // write options to data
      var data = $container.data('cyexpandcollapse');
      if (data == null) {
        data = {};
      }
      data.options = opts;

      var optCache;

      function options() {
        return optCache || (optCache = $container.data('cyexpandcollapse').options);
      }

      function clearDraws() {

        var w = $container.width();
        var h = $container.height();

        ctx.clearRect(0, 0, w, h);
      }

      function drawExpandCollapseCue(node) {
        var cy = node.cy();
        var children = node.children();
        var collapsedChildren = node._private.data.collapsedChildren;
        var hasChildren = children != null && children.length > 0;
        // If this is a simple node with no collapsed children return directly
        if (!hasChildren && collapsedChildren == null) {
          return;
        }

        var isCollapsed = node.hasClass('cy-expand-collapse-collapsed-node');

        //Draw expand-collapse rectangles
        var rectSize = options().expandCollapseCueSize;
        var lineSize = options().expandCollapseCueLineSize;
        var diff;

        var expandcollapseStartX;
        var expandcollapseStartY;
        var expandcollapseEndX;
        var expandcollapseEndY;
        var expandcollapseRectSize;

        var expandcollapseCenterX;
        var expandcollapseCenterY;
        var cueCenter;

        if (options().expandCollapseCuePosition === 'top-left') {
          var offset = 1;
        
          var x = node.position('x') - node.width() / 2 - parseFloat(node.css('padding-left')) 
                  + parseFloat(node.css('border-width')) + rectSize / 2 + offset;
          var y = node.position('y') - node.height() / 2 - parseFloat(node.css('padding-top')) 
                  + parseFloat(node.css('border-width')) + rectSize / 2 + offset;

          cueCenter = {
            x : x,
            y : y
          };
        } else {
          var option = options().expandCollapseCuePosition;
          cueCenter = typeof option === 'function' ? option.call(this, node) : option;
        }
        
        var expandcollapseCenter = elementUtilities.convertToRenderedPosition(cueCenter);

        // convert to rendered sizes
        rectSize = rectSize * cy.zoom();
        lineSize = lineSize * cy.zoom();
        diff = (rectSize - lineSize) / 2;

        expandcollapseCenterX = expandcollapseCenter.x;
        expandcollapseCenterY = expandcollapseCenter.y;

        expandcollapseStartX = expandcollapseCenterX - rectSize / 2;
        expandcollapseStartY = expandcollapseCenterY - rectSize / 2;
        expandcollapseEndX = expandcollapseStartX + rectSize;
        expandcollapseEndY = expandcollapseStartY + rectSize;
        expandcollapseRectSize = rectSize;

        // Draw expand/collapse cue if specified use an image else render it in the default way
        if (!isCollapsed && options().expandCueImage) {
          var img=new Image();
          img.src = options().expandCueImage;
          ctx.drawImage(img, expandcollapseCenterX, expandcollapseCenterY, rectSize, rectSize);
        }
        else if (isCollapsed && options().collapseCueImage) {
          var img=new Image();
          img.src = options().collapseCueImage;
          ctx.drawImage(img, expandcollapseCenterX, expandcollapseCenterY, rectSize, rectSize);
        }
        else {
          var oldFillStyle = ctx.fillStyle;
          var oldWidth = ctx.lineWidth;
          var oldStrokeStyle = ctx.strokeStyle;

          ctx.fillStyle = "black";
          ctx.strokeStyle = "black";

          ctx.ellipse(expandcollapseCenterX, expandcollapseCenterY, rectSize / 2, rectSize / 2, 0, 0, 2 * Math.PI);
          ctx.fill();

          ctx.beginPath();

          ctx.strokeStyle = "white";
          ctx.lineWidth = 2.6 * cy.zoom();

          ctx.moveTo(expandcollapseStartX + diff, expandcollapseStartY + rectSize / 2);
          ctx.lineTo(expandcollapseStartX + lineSize + diff, expandcollapseStartY + rectSize / 2);

          if (isCollapsed) {
            ctx.moveTo(expandcollapseStartX + rectSize / 2, expandcollapseStartY + diff);
            ctx.lineTo(expandcollapseStartX + rectSize / 2, expandcollapseStartY + lineSize + diff);
          }

          ctx.closePath();
          ctx.stroke();

          ctx.strokeStyle = oldStrokeStyle;
          ctx.fillStyle = oldFillStyle;
          ctx.lineWidth = oldWidth;
        }

        node._private.data.expandcollapseRenderedStartX = expandcollapseStartX;
        node._private.data.expandcollapseRenderedStartY = expandcollapseStartY;
        node._private.data.expandcollapseRenderedCueSize = expandcollapseRectSize;
      }

      $container.cytoscape(function (e) {
        cy = this;

        cy.bind('zoom pan', eZoom = function () {
          clearDraws();
        });


        cy.on('mouseover', 'node', eMouseOver = function (e) {
          var node = this
          clearDraws();
          drawExpandCollapseCue(node);
        });

        cy.on('mouseout tapdragout', 'node', eMouseOut = function (e) {
          clearDraws();
        });

        cy.on('position', 'node', ePosition = function () {
          clearDraws();
        });

        cy.on('remove', 'node', eRemove = function () {
          clearDraws();
        });
        
        cy.on('free', 'node', eFree = function () {
          var node = this;
          clearDraws();
          drawExpandCollapseCue(node);
        });
        
        var ur;
        cy.on('tap', 'node', eTap = function (event) {
          var node = this;

          var expandcollapseRenderedStartX = node._private.data.expandcollapseRenderedStartX;
          var expandcollapseRenderedStartY = node._private.data.expandcollapseRenderedStartY;
          var expandcollapseRenderedRectSize = node._private.data.expandcollapseRenderedCueSize;
          var expandcollapseRenderedEndX = expandcollapseRenderedStartX + expandcollapseRenderedRectSize;
          var expandcollapseRenderedEndY = expandcollapseRenderedStartY + expandcollapseRenderedRectSize;

          var cyRenderedPosX = event.cyRenderedPosition.x;
          var cyRenderedPosY = event.cyRenderedPosition.y;
          var factor = (options().expandCollapseCueSensitivity - 1) / 2;

          if (cyRenderedPosX >= expandcollapseRenderedStartX - expandcollapseRenderedRectSize * factor
            && cyRenderedPosX <= expandcollapseRenderedEndX + expandcollapseRenderedRectSize * factor
            && cyRenderedPosY >= expandcollapseRenderedStartY - expandcollapseRenderedRectSize * factor
            && cyRenderedPosY <= expandcollapseRenderedEndY + expandcollapseRenderedRectSize * factor) {
            if(opts.undoable && !ur)
              ur = cy.undoRedo({
                defaultActions: false
              });
            if(node.isCollapsible())
              if (opts.undoable)
                ur.do("collapse", {
                  nodes: node,
                  options: opts
                });
              else
                node.collapse(opts);
            else if(node.isExpandable())
              if (opts.undoable)
                ur.do("expand", {
                  nodes: node,
                  options: opts
                });
              else
                node.expand(opts);
          }
        });
      });

      $container.data('cyexpandcollapse', data);
    },
    unbind: function () {
        var cy = this.cytoscape('get');
        cy.off('mouseover', 'node', eMouseOver)
          .off('mouseout tapdragout', 'node', eMouseOut)
          .off('position', 'node', ePosition)
          .off('remove', 'node', eRemove)
          .off('tap', 'node', eTap)
          .off('add', 'node', eAdd)
          .off('free', 'node', eFree);

        cy.unbind("zoom pan", eZoom);
    }
  };

  if (functions[fn]) {
    return functions[fn].apply($(cy.container()), Array.prototype.slice.call(arguments, 1));
  } else if (typeof fn == 'object' || !fn) {
    return functions.init.apply($(cy.container()), arguments);
  } else {
    $.error('No such function `' + fn + '` for cytoscape.js-expand-collapse');
  }

  return $(this);
};

},{"./debounce":3,"./elementUtilities":4}],3:[function(_dereq_,module,exports){
var debounce = (function () {
  /**
   * lodash 3.1.1 (Custom Build) <https://lodash.com/>
   * Build: `lodash modern modularize exports="npm" -o ./`
   * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   * Available under MIT license <https://lodash.com/license>
   */
  /** Used as the `TypeError` message for "Functions" methods. */
  var FUNC_ERROR_TEXT = 'Expected a function';

  /* Native method references for those with the same name as other `lodash` methods. */
  var nativeMax = Math.max,
          nativeNow = Date.now;

  /**
   * Gets the number of milliseconds that have elapsed since the Unix epoch
   * (1 January 1970 00:00:00 UTC).
   *
   * @static
   * @memberOf _
   * @category Date
   * @example
   *
   * _.defer(function(stamp) {
   *   console.log(_.now() - stamp);
   * }, _.now());
   * // => logs the number of milliseconds it took for the deferred function to be invoked
   */
  var now = nativeNow || function () {
    return new Date().getTime();
  };

  /**
   * Creates a debounced function that delays invoking `func` until after `wait`
   * milliseconds have elapsed since the last time the debounced function was
   * invoked. The debounced function comes with a `cancel` method to cancel
   * delayed invocations. Provide an options object to indicate that `func`
   * should be invoked on the leading and/or trailing edge of the `wait` timeout.
   * Subsequent calls to the debounced function return the result of the last
   * `func` invocation.
   *
   * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
   * on the trailing edge of the timeout only if the the debounced function is
   * invoked more than once during the `wait` timeout.
   *
   * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
   * for details over the differences between `_.debounce` and `_.throttle`.
   *
   * @static
   * @memberOf _
   * @category Function
   * @param {Function} func The function to debounce.
   * @param {number} [wait=0] The number of milliseconds to delay.
   * @param {Object} [options] The options object.
   * @param {boolean} [options.leading=false] Specify invoking on the leading
   *  edge of the timeout.
   * @param {number} [options.maxWait] The maximum time `func` is allowed to be
   *  delayed before it's invoked.
   * @param {boolean} [options.trailing=true] Specify invoking on the trailing
   *  edge of the timeout.
   * @returns {Function} Returns the new debounced function.
   * @example
   *
   * // avoid costly calculations while the window size is in flux
   * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
   *
   * // invoke `sendMail` when the click event is fired, debouncing subsequent calls
   * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
   *   'leading': true,
   *   'trailing': false
   * }));
   *
   * // ensure `batchLog` is invoked once after 1 second of debounced calls
   * var source = new EventSource('/stream');
   * jQuery(source).on('message', _.debounce(batchLog, 250, {
   *   'maxWait': 1000
   * }));
   *
   * // cancel a debounced call
   * var todoChanges = _.debounce(batchLog, 1000);
   * Object.observe(models.todo, todoChanges);
   *
   * Object.observe(models, function(changes) {
   *   if (_.find(changes, { 'user': 'todo', 'type': 'delete'})) {
   *     todoChanges.cancel();
   *   }
   * }, ['delete']);
   *
   * // ...at some point `models.todo` is changed
   * models.todo.completed = true;
   *
   * // ...before 1 second has passed `models.todo` is deleted
   * // which cancels the debounced `todoChanges` call
   * delete models.todo;
   */
  function debounce(func, wait, options) {
    var args,
            maxTimeoutId,
            result,
            stamp,
            thisArg,
            timeoutId,
            trailingCall,
            lastCalled = 0,
            maxWait = false,
            trailing = true;

    if (typeof func != 'function') {
      throw new TypeError(FUNC_ERROR_TEXT);
    }
    wait = wait < 0 ? 0 : (+wait || 0);
    if (options === true) {
      var leading = true;
      trailing = false;
    } else if (isObject(options)) {
      leading = !!options.leading;
      maxWait = 'maxWait' in options && nativeMax(+options.maxWait || 0, wait);
      trailing = 'trailing' in options ? !!options.trailing : trailing;
    }

    function cancel() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (maxTimeoutId) {
        clearTimeout(maxTimeoutId);
      }
      lastCalled = 0;
      maxTimeoutId = timeoutId = trailingCall = undefined;
    }

    function complete(isCalled, id) {
      if (id) {
        clearTimeout(id);
      }
      maxTimeoutId = timeoutId = trailingCall = undefined;
      if (isCalled) {
        lastCalled = now();
        result = func.apply(thisArg, args);
        if (!timeoutId && !maxTimeoutId) {
          args = thisArg = undefined;
        }
      }
    }

    function delayed() {
      var remaining = wait - (now() - stamp);
      if (remaining <= 0 || remaining > wait) {
        complete(trailingCall, maxTimeoutId);
      } else {
        timeoutId = setTimeout(delayed, remaining);
      }
    }

    function maxDelayed() {
      complete(trailing, timeoutId);
    }

    function debounced() {
      args = arguments;
      stamp = now();
      thisArg = this;
      trailingCall = trailing && (timeoutId || !leading);

      if (maxWait === false) {
        var leadingCall = leading && !timeoutId;
      } else {
        if (!maxTimeoutId && !leading) {
          lastCalled = stamp;
        }
        var remaining = maxWait - (stamp - lastCalled),
                isCalled = remaining <= 0 || remaining > maxWait;

        if (isCalled) {
          if (maxTimeoutId) {
            maxTimeoutId = clearTimeout(maxTimeoutId);
          }
          lastCalled = stamp;
          result = func.apply(thisArg, args);
        }
        else if (!maxTimeoutId) {
          maxTimeoutId = setTimeout(maxDelayed, remaining);
        }
      }
      if (isCalled && timeoutId) {
        timeoutId = clearTimeout(timeoutId);
      }
      else if (!timeoutId && wait !== maxWait) {
        timeoutId = setTimeout(delayed, wait);
      }
      if (leadingCall) {
        isCalled = true;
        result = func.apply(thisArg, args);
      }
      if (isCalled && !timeoutId && !maxTimeoutId) {
        args = thisArg = undefined;
      }
      return result;
    }

    debounced.cancel = cancel;
    return debounced;
  }

  /**
   * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
   * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(1);
   * // => false
   */
  function isObject(value) {
    // Avoid a V8 JIT bug in Chrome 19-20.
    // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
    var type = typeof value;
    return !!value && (type == 'object' || type == 'function');
  }

  return debounce;

})();

module.exports = debounce;
},{}],4:[function(_dereq_,module,exports){
function elementUtilities(cy) {
 return {
  moveNodes: function (positionDiff, nodes, notCalcTopMostNodes) {
    var topMostNodes = notCalcTopMostNodes ? nodes : this.getTopMostNodes(nodes);
    for (var i = 0; i < topMostNodes.length; i++) {
      var node = topMostNodes[i];
      var oldX = node.position("x");
      var oldY = node.position("y");
      node.position({
        x: oldX + positionDiff.x,
        y: oldY + positionDiff.y
      });
      var children = node.children();
      this.moveNodes(positionDiff, children, true);
    }
  },
  getTopMostNodes: function (nodes) {//*//
    var nodesMap = {};
    for (var i = 0; i < nodes.length; i++) {
      nodesMap[nodes[i].id()] = true;
    }
    var roots = nodes.filter(function (i, ele) {
      var parent = ele.parent()[0];
      while (parent != null) {
        if (nodesMap[parent.id()]) {
          return false;
        }
        parent = parent.parent()[0];
      }
      return true;
    });

    return roots;
  },
  rearrange: function (layoutBy) {
    if (typeof layoutBy === "function") {
      layoutBy();
    } else if (layoutBy != null) {
      cy.layout(layoutBy);
    }
  },
  convertToRenderedPosition: function (modelPosition) {
    var pan = cy.pan();
    var zoom = cy.zoom();

    var x = modelPosition.x * zoom + pan.x;
    var y = modelPosition.y * zoom + pan.y;

    return {
      x: x,
      y: y
    };
  }
 };
}

module.exports = elementUtilities;

},{}],5:[function(_dereq_,module,exports){
var boundingBoxUtilities = _dereq_('./boundingBoxUtilities');

// Expand collapse utilities
function expandCollapseUtilities(cy) {
var elementUtilities = _dereq_('./elementUtilities')(cy);
return {
  //the number of nodes moving animatedly after expand operation
  animatedlyMovingNodeCount: 0,
  //A funtion basicly expanding a node it is to be called when a node is expanded anyway
  expandNodeBaseFunction: function (node, triggerLayout, single, layoutBy) {//*//
    //check how the position of the node is changed
    var positionDiff = {
      x: node.position('x') - node.data('position-before-collapse').x,
      y: node.position('y') - node.data('position-before-collapse').y
    };

    node.removeData("infoLabel");
    node.removeClass('cy-expand-collapse-collapsed-node');

    node.trigger("beforeExpand");
    node._private.data.collapsedChildren.restore();
    this.repairEdges(node);
    node._private.data.collapsedChildren = null;
    node.trigger("afterExpand");


    elementUtilities.moveNodes(positionDiff, node.children());
    node.removeData('position-before-collapse');

    if (single)
      this.endOperation(layoutBy);
    // refreshPaddings();
   /* if (triggerLayout)
      elementUtilities.rearrange(layoutBy);*/
  },
  simpleCollapseGivenNodes: function (nodes) {//*//
    nodes.data("collapse", true);
    var roots = elementUtilities.getTopMostNodes(nodes);
    for (var i = 0; i < roots.length; i++) {
      var root = roots[i];
      
      // Collapse the nodes in bottom up order
      this.collapseBottomUp(root);
    }
    
    return nodes;
  },
  simpleExpandGivenNodes: function (nodes, applyFishEyeViewToEachNode) {//*//
    nodes.data("expand", true);
    var roots = elementUtilities.getTopMostNodes(nodes);
    for (var i = 0; i < roots.length; i++) {
      var root = roots[i];
      this.expandTopDown(root, applyFishEyeViewToEachNode);
    }
    return nodes;
  },
  simpleExpandAllNodes: function (nodes, applyFishEyeViewToEachNode) {//*//
    if (nodes === undefined) {
      nodes = cy.nodes();
    }
    var orphans;
    orphans = elementUtilities.getTopMostNodes(nodes);
    var expandStack = [];
    for (var i = 0; i < orphans.length; i++) {
      var root = orphans[i];
      this.expandAllTopDown(root, expandStack, applyFishEyeViewToEachNode);
    }
    return expandStack;
  },
  endOperation: function (layoutBy) {
    var self = this;
    cy.ready(function () {
      elementUtilities.rearrange(layoutBy);
    });
  },
  expandAllNodes: function (nodes, options) {//*//
    var expandedStack = this.simpleExpandAllNodes(nodes, options.fisheye);

    this.endOperation(options.layoutBy);

    //elementUtilities.rearrange(options.layoutBy);

    /*
     * return the nodes to undo the operation
     */
    return expandedStack;
  },
  expandAllTopDown: function (root, expandStack, applyFishEyeViewToEachNode) {//*//
    if (root._private.data.collapsedChildren != null) {
      expandStack.push(root);
      this.simpleExpandNode(root, applyFishEyeViewToEachNode);
    }
    var children = root.children();
    for (var i = 0; i < children.length; i++) {
      var node = children[i];
      this.expandAllTopDown(node, expandStack, applyFishEyeViewToEachNode);
    }
  },
  //Expand the given nodes perform incremental layout after expandation
  expandGivenNodes: function (nodes, options) {//*//
    if (nodes.length === 1) {
      this.expandNode(nodes[0], options.fisheye, options.animate, options.layoutBy);

    } else {
      this.simpleExpandGivenNodes(nodes, options.fisheye);
      this.endOperation(options.layoutBy);

      //elementUtilities.rearrange(options.layoutBy);
    }

    /*
     * return the nodes to undo the operation
     */
    return nodes;
  },
  //collapse the given nodes then make incremental layout
  collapseGivenNodes: function (nodes, options) {//*//
    cy.startBatch();
    this.simpleCollapseGivenNodes(nodes, options);
    cy.endBatch();

    this.endOperation(options.layoutBy);

    // Update the style
    cy.style().update();

    /*
     * return the nodes to undo the operation
     */
    return nodes;
  },
  //collapse the nodes in bottom up order starting from the root
  collapseBottomUp: function (root) {//*//
    var children = root.children();
    for (var i = 0; i < children.length; i++) {
      var node = children[i];
      this.collapseBottomUp(node);
    }
    //If the root is a compound node to be collapsed then collapse it
    if (root.data("collapse") && root.children().length > 0) {
      this.simpleCollapseNode(root);
      root.removeData("collapse");
    }
  },
  //expand the nodes in top down order starting from the root
  expandTopDown: function (root, applyFishEyeViewToEachNode) {//*//
    if (root.data("expand") && root._private.data.collapsedChildren != null) {
      this.simpleExpandNode(root, applyFishEyeViewToEachNode);
      root.removeData("expand");
    }
    var children = root.children();
    for (var i = 0; i < children.length; i++) {
      var node = children[i];
      this.expandTopDown(node);
    }
  },
  expandNode: function (node, fisheye, animate, layoutBy) {
    if (node._private.data.collapsedChildren != null) {
      this.simpleExpandNode(node, fisheye, true, animate, layoutBy);

      /*
       * return the node to undo the operation
       */
      return node;
    }
  },
  convertToModelPosition: function (renderedPosition) {
    var pan = cy.pan();
    var zoom = cy.zoom();

    var x = (renderedPosition.x - pan.x) / zoom;
    var y = (renderedPosition.y - pan.y) / zoom;

    return {
      x: x,
      y: y
    };
  },
  /*
   *
   * This method expands the given node
   * without making incremental layout
   * after expand operation it will be simply
   * used to undo the collapse operation
   */
  simpleExpandNode: function (node, applyFishEyeViewToEachNode, singleNotSimple, animate, layoutBy) {//*//
    var self = this;
    
    if( !animate ) {
      cy.startBatch();
    }

    var commonExpandOperation = function (node, applyFishEyeViewToEachNode, singleNotSimple, animate, layoutBy) {
      if (applyFishEyeViewToEachNode) {

        node.data('width-before-fisheye', node.data('size-before-collapse').w);
        node.data('height-before-fisheye', node.data('size-before-collapse').h);

        self.fishEyeViewExpandGivenNode(node, singleNotSimple, node, animate, layoutBy);
      }

      if (!singleNotSimple || !applyFishEyeViewToEachNode || !animate) {
        self.expandNodeBaseFunction(node, singleNotSimple, singleNotSimple, layoutBy); //*****
      }
    };

    if (node._private.data.collapsedChildren != null) {
      this.storeWidthHeight(node);
      if (applyFishEyeViewToEachNode && singleNotSimple) {
        var topLeftPosition = this.convertToModelPosition({x: 0, y: 0});
        var bottomRightPosition = this.convertToModelPosition({x: cy.width(), y: cy.height()});
        var padding = 80;
        var bb = {
          x1: topLeftPosition.x,
          x2: bottomRightPosition.x,
          y1: topLeftPosition.y,
          y2: bottomRightPosition.y
        };

        var nodeBB = {
          x1: node.position('x') - node.data('size-before-collapse').w / 2 - padding,
          x2: node.position('x') + node.data('size-before-collapse').w / 2 + padding,
          y1: node.position('y') - node.data('size-before-collapse').h / 2 - padding,
          y2: node.position('y') + node.data('size-before-collapse').h / 2 + padding
        };

        var unionBB = boundingBoxUtilities.getUnion(nodeBB, bb);
        var animating = false;

        if (!boundingBoxUtilities.equalBoundingBoxes(unionBB, bb)) {
          var viewPort = cy.getFitViewport(unionBB, 10);
          var self = this;
          animating = animate;
          if (animate) {
            cy.animate({
              pan: viewPort.pan,
              zoom: viewPort.zoom,
              complete: function () {
                commonExpandOperation(node, applyFishEyeViewToEachNode, singleNotSimple, animate, layoutBy);
              }
            }, {
              duration: 1000
            });
          }
          else {
            cy.zoom(viewPort.zoom);
            cy.pan(viewPort.pan);
          }
        }
        if (!animating) {
          commonExpandOperation(node, applyFishEyeViewToEachNode, singleNotSimple, animate, layoutBy);
        }
      }
      else {
        commonExpandOperation(node, applyFishEyeViewToEachNode, singleNotSimple, animate, layoutBy);
      }
      
      if( !animate ) {
        cy.endBatch();
      }

      //return the node to undo the operation
      return node;
    }
  },
  //collapse the given node without making incremental layout
  simpleCollapseNode: function (node) {//*//
    if (node._private.data.collapsedChildren == null) {
      node.data('position-before-collapse', {
        x: node.position().x,
        y: node.position().y
      });

      node.data('size-before-collapse', {
        w: node.outerWidth(),
        h: node.outerHeight()
      });

      var children = node.children();

      children.unselect();
      children.connectedEdges().unselect();

      node.trigger("beforeCollapse");
      
      this.barrowEdgesOfcollapsedChildren(node);
      this.removeChildren(node, node);
      node.addClass('cy-expand-collapse-collapsed-node');

      node.trigger("afterCollapse");
      
      node.position(node.data('position-before-collapse'));

      //return the node to undo the operation
      return node;
    }
  },
  storeWidthHeight: function (node) {//*//
    if (node != null) {
      node.data('x-before-fisheye', this.xPositionInParent(node));
      node.data('y-before-fisheye', this.yPositionInParent(node));
      node.data('width-before-fisheye', node.outerWidth());
      node.data('height-before-fisheye', node.outerHeight());

      if (node.parent()[0] != null) {
        this.storeWidthHeight(node.parent()[0]);
      }
    }

  },
  fishEyeViewExpandGivenNode: function (node, singleNotSimple, nodeToExpand, animate, layoutBy) {//*//
    var siblings = this.getSiblings(node);

    var x_a = this.xPositionInParent(node);
    var y_a = this.yPositionInParent(node);

    var d_x_left = Math.abs((node.data('width-before-fisheye') - node.outerWidth()) / 2);
    var d_x_right = Math.abs((node.data('width-before-fisheye') - node.outerWidth()) / 2);
    var d_y_upper = Math.abs((node.data('height-before-fisheye') - node.outerHeight()) / 2);
    var d_y_lower = Math.abs((node.data('height-before-fisheye') - node.outerHeight()) / 2);

    var abs_diff_on_x = Math.abs(node.data('x-before-fisheye') - x_a);
    var abs_diff_on_y = Math.abs(node.data('y-before-fisheye') - y_a);

    // Center went to LEFT
    if (node.data('x-before-fisheye') > x_a) {
      d_x_left = d_x_left + abs_diff_on_x;
      d_x_right = d_x_right - abs_diff_on_x;
    }
    // Center went to RIGHT
    else {
      d_x_left = d_x_left - abs_diff_on_x;
      d_x_right = d_x_right + abs_diff_on_x;
    }

    // Center went to UP
    if (node.data('y-before-fisheye') > y_a) {
      d_y_upper = d_y_upper + abs_diff_on_y;
      d_y_lower = d_y_lower - abs_diff_on_y;
    }
    // Center went to DOWN
    else {
      d_y_upper = d_y_upper - abs_diff_on_y;
      d_y_lower = d_y_lower + abs_diff_on_y;
    }

    var xPosInParentSibling = [];
    var yPosInParentSibling = [];

    for (var i = 0; i < siblings.length; i++) {
      xPosInParentSibling.push(this.xPositionInParent(siblings[i]));
      yPosInParentSibling.push(this.yPositionInParent(siblings[i]));
    }

    for (var i = 0; i < siblings.length; i++) {
      var sibling = siblings[i];

      var x_b = xPosInParentSibling[i];
      var y_b = yPosInParentSibling[i];

      var slope = (y_b - y_a) / (x_b - x_a);

      var d_x = 0;
      var d_y = 0;
      var T_x = 0;
      var T_y = 0;

      // Current sibling is on the LEFT
      if (x_a > x_b) {
        d_x = d_x_left;
      }
      // Current sibling is on the RIGHT
      else {
        d_x = d_x_right;
      }
      // Current sibling is on the UPPER side
      if (y_a > y_b) {
        d_y = d_y_upper;
      }
      // Current sibling is on the LOWER side
      else {
        d_y = d_y_lower;
      }

      if (isFinite(slope)) {
        T_x = Math.min(d_x, (d_y / Math.abs(slope)));
      }

      if (slope !== 0) {
        T_y = Math.min(d_y, (d_x * Math.abs(slope)));
      }

      if (x_a > x_b) {
        T_x = -1 * T_x;
      }

      if (y_a > y_b) {
        T_y = -1 * T_y;
      }

      this.fishEyeViewMoveNode(sibling, T_x, T_y, nodeToExpand, singleNotSimple, animate, layoutBy);
    }

    if (siblings.length == 0) {
      this.expandNodeBaseFunction(nodeToExpand, singleNotSimple, true, layoutBy);
    }

    if (node.parent()[0] != null) {
      this.fishEyeViewExpandGivenNode(node.parent()[0], singleNotSimple, nodeToExpand, animate, layoutBy);
    }

    return node;
  },
  getSiblings: function (node) {//*//
    var siblings;

    if (node.parent()[0] == null) {
      siblings = cy.collection();
      var orphans = cy.nodes().orphans();

      for (var i = 0; i < orphans.length; i++) {
        if (orphans[i] != node) {
          siblings = siblings.add(orphans[i]);
        }
      }
    } else {
      siblings = node.siblings();
    }

    return siblings;
  },
  /*
   * Move node operation specialized for fish eye view expand operation
   * Moves the node by moving its descandents. Movement is animated if singleNotSimple flag is truthy.
   */
  fishEyeViewMoveNode: function (node, T_x, T_y, nodeToExpand, singleNotSimple, animate, layoutBy) {//*//
    var childrenList = node.children();
    var self = this;

    if (childrenList.length == 0) {
      var newPosition = {x: node.position('x') + T_x, y: node.position('y') + T_y};
      if (!singleNotSimple || !animate) {
        node.position(newPosition);
      }
      else {
        this.animatedlyMovingNodeCount++;
        node.animate({
          position: newPosition,
          complete: function () {
            self.animatedlyMovingNodeCount--;
            if (self.animatedlyMovingNodeCount > 0 || !nodeToExpand.hasClass('cy-expand-collapse-collapsed-node')) {

              return;
            }

            self.expandNodeBaseFunction(nodeToExpand, singleNotSimple, true, layoutBy);

          }
        }, {
          duration: 1000
        });
      }
    }
    else {

      for (var i = 0; i < childrenList.length; i++) {
        this.fishEyeViewMoveNode(childrenList[i], T_x, T_y, nodeToExpand, singleNotSimple, animate, layoutBy);
      }
    }
  },
  xPositionInParent: function (node) {//*//
    var parent = node.parent()[0];
    var x_a = 0.0;

    // Given node is not a direct child of the the root graph
    if (parent != null) {
      x_a = node.relativePosition('x') + (parent.width() / 2);
    }
    // Given node is a direct child of the the root graph

    else {
      x_a = node.position('x');
    }

    return x_a;
  },
  yPositionInParent: function (node) {//*//
    var parent = node.parent()[0];

    var y_a = 0.0;

    // Given node is not a direct child of the the root graph
    if (parent != null) {
      y_a = node.relativePosition('y') + (parent.height() / 2);
    }
    // Given node is a direct child of the the root graph

    else {
      y_a = node.position('y');
    }

    return y_a;
  },
  /*
   * for all children of the node parameter call this method
   * with the same root parameter,
   * remove the child and add the removed child to the collapsedchildren data
   * of the root to restore them in the case of expandation
   * root._private.data.collapsedChildren keeps the nodes to restore when the
   * root is expanded
   */
  removeChildren: function (node, root) {//*//
    var children = node.children();
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      this.removeChildren(child, root);
      var removedChild = child.remove();
      if (root._private.data.collapsedChildren == null) {
        root._private.data.collapsedChildren = removedChild;
      }
      else {
        root._private.data.collapsedChildren = root._private.data.collapsedChildren.union(removedChild);
      }
    }
  },
  isMetaEdge: function(edge) {
    return edge.hasClass("cy-expand-collapse-meta-edge");
  },
  barrowEdgesOfcollapsedChildren: function(node) {
    var relatedNodes = node.descendants();
    var edges = relatedNodes.edgesWith(cy.nodes().not(relatedNodes.union(node)));
    
    var relatedNodeMap = {};
    
    relatedNodes.each(function(i, ele) {
      relatedNodeMap[ele.id()] = true;
    });
    
    for (var i = 0; i < edges.length; i++) {
      var edge = edges[i];
      var source = edge.source();
      var target = edge.target();
      
      if (!this.isMetaEdge(edge)) { // is original
        var originalEndsData = {
          source: source,
          target: target
        };
        
        edge.addClass("cy-expand-collapse-meta-edge");
        edge.data('originalEnds', originalEndsData);
      }
      
      edge.move({
        target: !relatedNodeMap[target.id()] ? target.id() : node.id(),
        source: !relatedNodeMap[source.id()] ? source.id() : node.id()
      });
    }
  },
  findNewEnd: function(node) {
    var current = node;
    
    while( !current.inside() ) {
      current = current.parent();
    }
    
    return current;
  },
  repairEdges: function(node) {
    var connectedMetaEdges = node.connectedEdges('.cy-expand-collapse-meta-edge');
    
    for (var i = 0; i < connectedMetaEdges.length; i++) {
      var edge = connectedMetaEdges[i];
      var originalEnds = edge.data('originalEnds');
      var currentSrcId = edge.data('source');
      var currentTgtId = edge.data('target');
      
      if ( currentSrcId === node.id() ) {
        edge = edge.move({
          source: this.findNewEnd(originalEnds.source).id()
        });
      } else {
        edge = edge.move({
          target: this.findNewEnd(originalEnds.target).id()
        });
      }
      
      if ( edge.data('source') === originalEnds.source.id() && edge.data('target') === originalEnds.target.id() ) {
        edge.removeClass('cy-expand-collapse-meta-edge');
        edge.removeData('originalEnds');
      }
    }
  },
  /*node is an outer node of root
   if root is not it's anchestor
   and it is not the root itself*/
  isOuterNode: function (node, root) {//*//
    var temp = node;
    while (temp != null) {
      if (temp == root) {
        return false;
      }
      temp = temp.parent()[0];
    }
    return true;
  }
}
};

module.exports = expandCollapseUtilities;

},{"./boundingBoxUtilities":1,"./elementUtilities":4}],6:[function(_dereq_,module,exports){
;
(function () {
  'use strict';

  // registers the extension on a cytoscape lib ref
  var register = function (cytoscape, $) {

    if (!cytoscape) {
      return;
    } // can't register if cytoscape unspecified

    var expandCollapseUtilities = _dereq_('./expandCollapseUtilities');
    var undoRedoUtilities = _dereq_('./undoRedoUtilities');
    var elementUtilities = _dereq_('./elementUtilities');
    var cueUtilities = _dereq_("./cueUtilities");

    var options = {
      layoutBy: null, // for rearrange after expand/collapse. It's just layout options or whole layout function. Choose your side!
      fisheye: true, // whether to perform fisheye view after expand/collapse you can specify a function too
      animate: true, // whether to animate on drawing changes you can specify a function too
      ready: function () { }, // callback when expand/collapse initialized
      undoable: true, // and if undoRedoExtension exists,

      cueEnabled: true, // Whether cues are enabled
      expandCollapseCuePosition: 'top-left', // default cue position is top left you can specify a function per node too
      expandCollapseCueSize: 12, // size of expand-collapse cue
      expandCollapseCueLineSize: 8, // size of lines used for drawing plus-minus icons
      expandCueImage: undefined, // image of expand icon if undefined draw regular expand cue
      collapseCueImage: undefined, // image of collapse icon if undefined draw regular collapse cue
      expandCollapseCueSensitivity: 1 // sensitivity of expand-collapse cues
    };

    function setOptions(from) {
      var tempOpts = {};
      for (var key in options)
        tempOpts[key] = options[key];

      for (var key in from)
        if (tempOpts.hasOwnProperty(key))
          tempOpts[key] = from[key];
      return tempOpts;
    }
    
    // evaluate some specific options in case of they are specified as functions to be dynamically changed
    function evalOptions(options) {
      var animate = typeof options.animate === 'function' ? options.animate.call() : options.animate;
      var fisheye = typeof options.fisheye === 'function' ? options.fisheye.call() : options.fisheye;
      
      options.animate = animate;
      options.fisheye = fisheye;
    }


    // cy.expandCollapse()
    cytoscape("core", "expandCollapse", function (opts) {
      var cy = this;
      options = setOptions(opts);

      undoRedoUtilities(cy);
      
      if(options.cueEnabled)
        cueUtilities(options, cy);
      else
        cueUtilities("unbind");


      options.ready();


      return cy;
    });
    
    // set functions
    
    // set all options at once
    cytoscape("core", "setExpandCollapseOptions", function (opts) {
      options = opts;
    });
    
    // set the option whose name is given
    cytoscape("core", "setExpandCollapseOption", function (name, value) {
      options[name] = value;
    });

    // Collection functions

    // eles.collapse(options)
    cytoscape('collection', 'collapse', function (opts) {
      var eles = this.collapsibleNodes();
      var tempOptions = setOptions(opts);
      evalOptions(tempOptions);

      return expandCollapseUtilities(this.cy()).collapseGivenNodes(eles, tempOptions);
    });

    // eles.collapseAll(options)
    cytoscape('collection', 'collapseRecursively', function (opts) {
      var eles = this.collapsibleNodes();
      var tempOptions = setOptions(opts);
      evalOptions(tempOptions);

      return eles.union(eles.descendants()).collapse(tempOptions);
    });

    // eles.expand(options)
    cytoscape('collection', 'expand', function (opts) {
      var eles = this.expandableNodes();
      var tempOptions = setOptions(opts);
      evalOptions(tempOptions);

      return expandCollapseUtilities(this.cy()).expandGivenNodes(eles, tempOptions);
    });

    // eles.expandAll(options)
    cytoscape('collection', 'expandRecursively', function (opts) {
      var eles = this.expandableNodes();
      var tempOptions = setOptions(opts);
      evalOptions(tempOptions);

      return expandCollapseUtilities(this.cy()).expandAllNodes(eles, tempOptions);
    });


    // Core functions

    // cy.collapseAll(options)
    cytoscape('core', 'collapseAll', function (opts) {
      var cy = this;
      var tempOptions = setOptions(opts);
      evalOptions(tempOptions);

      return cy.collapsibleNodes().collapseRecursively(tempOptions);
    });

    // cy.expandAll(options)
    cytoscape('core', 'expandAll', function (opts) {
      var cy = this;
      var tempOptions = setOptions(opts);
      evalOptions(tempOptions);

      return cy.expandableNodes().expandRecursively(tempOptions);
    });


    // Utility functions

    // ele.isCollapsible()
    cytoscape('collection', 'isExpandable', function () {
      var ele = this;
      
      return ele.hasClass('cy-expand-collapse-collapsed-node');
    });

    // ele.isExpandable()
    cytoscape('collection', 'isCollapsible', function () {
      var ele = this;
      return !ele.isExpandable() && ele.isParent();
    });

    // eles.collapsed()
    cytoscape('collection', 'collapsibleNodes', function () {
      var eles = this;

      return eles.filter(function (i, ele) {
        return ele.isCollapsible();
      });
    });

    // eles.expanded()
    cytoscape('collection', 'expandableNodes', function () {
      var eles = this;

      return eles.filter(function (i, ele) {
        return ele.isExpandable();
      });
    });
    // eles.collapsed()
    cytoscape('core', 'collapsibleNodes', function () {
      var cy = this;

      return cy.nodes().collapsibleNodes();
    });

    // eles.expanded()
    cytoscape('core', 'expandableNodes', function () {
      var cy = this;

      return cy.nodes().expandableNodes();
    });
  };

  if (typeof module !== 'undefined' && module.exports) { // expose as a commonjs module
    module.exports = register;
  }

  if (typeof define !== 'undefined' && define.amd) { // expose as an amd/requirejs module
    define('cytoscape-expand-collapse', function () {
      return register;
    });
  }

    if (typeof cytoscape !== 'undefined' && typeof jQuery !== 'undefined') { // expose to global cytoscape (i.e. window.cytoscape)
      register(cytoscape, jQuery);
  }

})();

},{"./cueUtilities":2,"./elementUtilities":4,"./expandCollapseUtilities":5,"./undoRedoUtilities":7}],7:[function(_dereq_,module,exports){
module.exports = function (cy) {
  if (cy.undoRedo == null)
    return;

  var ur = cy.undoRedo({}, true);

  function getEles(_eles) {
    return (typeof _eles === "string") ? cy.$(_eles) : _eles;
  }

  function getNodePositionsAndSizes() {
    var positionsAndSizes = {};
    var nodes = cy.nodes();

    for (var i = 0; i < nodes.length; i++) {
      var ele = nodes[i];
      positionsAndSizes[ele.id()] = {
        width: ele.width(),
        height: ele.height(),
        x: ele.position("x"),
        y: ele.position("y")
      };
    }

    return positionsAndSizes;
  }

  function returnToPositionsAndSizes(nodesData) {
    var currentPositionsAndSizes = {};
    cy.nodes().positions(function (i, ele) {
      currentPositionsAndSizes[ele.id()] = {
        width: ele.width(),
        height: ele.height(),
        x: ele.position("x"),
        y: ele.position("y")
      };
      var data = nodesData[ele.id()];
      ele._private.data.width = data.width;
      ele._private.data.height = data.height;
      return {
        x: data.x,
        y: data.y
      };
    });

    return currentPositionsAndSizes;
  }

  var secondTimeOpts = {
    layoutBy: null,
    animate: false,
    fisheye: false
  };

  function doIt(func) {
    return function (args) {
      var result = {};
      var nodes = getEles(args.nodes);
      if (args.firstTime) {
        result.oldData = getNodePositionsAndSizes();
        result.nodes = func.indexOf("All") > 0 ? cy[func](args.options) : nodes[func](args.options);
      } else {
        result.oldData = getNodePositionsAndSizes();
        result.nodes = func.indexOf("All") > 0 ? cy[func](secondTimeOpts) : cy.collection(nodes)[func](secondTimeOpts);
        returnToPositionsAndSizes(args.oldData);
      }

      return result;
    };
  }

  var actions = ["collapse", "collapseRecursively", "collapseAll", "expand", "expandRecursively", "expandAll"];

  for (var i = 0; i < actions.length; i++) {
    ur.action(actions[i], doIt(actions[i]), doIt(actions[(i + 3) % 6]));
  }

};

},{}]},{},[6])(6)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYm91bmRpbmdCb3hVdGlsaXRpZXMuanMiLCJzcmMvY3VlVXRpbGl0aWVzLmpzIiwic3JjL2RlYm91bmNlLmpzIiwic3JjL2VsZW1lbnRVdGlsaXRpZXMuanMiLCJzcmMvZXhwYW5kQ29sbGFwc2VVdGlsaXRpZXMuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvdW5kb1JlZG9VdGlsaXRpZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsbUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGJvdW5kaW5nQm94VXRpbGl0aWVzID0ge1xyXG4gIGVxdWFsQm91bmRpbmdCb3hlczogZnVuY3Rpb24oYmIxLCBiYjIpe1xyXG4gICAgICByZXR1cm4gYmIxLngxID09IGJiMi54MSAmJiBiYjEueDIgPT0gYmIyLngyICYmIGJiMS55MSA9PSBiYjIueTEgJiYgYmIxLnkyID09IGJiMi55MjtcclxuICB9LFxyXG4gIGdldFVuaW9uOiBmdW5jdGlvbihiYjEsIGJiMil7XHJcbiAgICAgIHZhciB1bmlvbiA9IHtcclxuICAgICAgeDE6IE1hdGgubWluKGJiMS54MSwgYmIyLngxKSxcclxuICAgICAgeDI6IE1hdGgubWF4KGJiMS54MiwgYmIyLngyKSxcclxuICAgICAgeTE6IE1hdGgubWluKGJiMS55MSwgYmIyLnkxKSxcclxuICAgICAgeTI6IE1hdGgubWF4KGJiMS55MiwgYmIyLnkyKSxcclxuICAgIH07XHJcblxyXG4gICAgdW5pb24udyA9IHVuaW9uLngyIC0gdW5pb24ueDE7XHJcbiAgICB1bmlvbi5oID0gdW5pb24ueTIgLSB1bmlvbi55MTtcclxuXHJcbiAgICByZXR1cm4gdW5pb247XHJcbiAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBib3VuZGluZ0JveFV0aWxpdGllczsiLCJ2YXIgZGVib3VuY2UgPSByZXF1aXJlKCcuL2RlYm91bmNlJyk7XHJcbnZhciBlbGVtZW50VXRpbGl0aWVzOy8vdGVzdFxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocGFyYW1zLCBjeSkge1xyXG4gIHZhciBmbiA9IHBhcmFtcztcclxuXHJcbiAgdmFyIGVNb3VzZU92ZXIsIGVNb3VzZU91dCwgZVBvc2l0aW9uLCBlUmVtb3ZlLCBlVGFwLCBlWm9vbSwgZUFkZCwgZUZyZWU7XHJcbiAgdmFyIGZ1bmN0aW9ucyA9IHtcclxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICB2YXIgb3B0cyA9IHBhcmFtcztcclxuICAgICAgdmFyICRjb250YWluZXIgPSB0aGlzO1xyXG4gICAgICB2YXIgY3kgPSB0aGlzLmN5dG9zY2FwZSgnZ2V0Jyk7XHJcbiAgICAgIHZhciAkY2FudmFzID0gJCgnPGNhbnZhcz48L2NhbnZhcz4nKTtcclxuICAgICAgZWxlbWVudFV0aWxpdGllcyA9IHJlcXVpcmUoJy4vZWxlbWVudFV0aWxpdGllcycpKGN5KTtcclxuXHJcbiAgICAgICRjb250YWluZXIuYXBwZW5kKCRjYW52YXMpO1xyXG5cclxuICAgICAgdmFyIF9zaXplQ2FudmFzID0gZGVib3VuY2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICRjYW52YXNcclxuICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCAkY29udGFpbmVyLmhlaWdodCgpKVxyXG4gICAgICAgICAgLmF0dHIoJ3dpZHRoJywgJGNvbnRhaW5lci53aWR0aCgpKVxyXG4gICAgICAgICAgLmNzcyh7XHJcbiAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICd0b3AnOiAwLFxyXG4gICAgICAgICAgICAnbGVmdCc6IDAsXHJcbiAgICAgICAgICAgICd6LWluZGV4JzogJzk5OSdcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciBjYW52YXNCYiA9ICRjYW52YXMub2Zmc2V0KCk7XHJcbiAgICAgICAgICB2YXIgY29udGFpbmVyQmIgPSAkY29udGFpbmVyLm9mZnNldCgpO1xyXG5cclxuICAgICAgICAgICRjYW52YXNcclxuICAgICAgICAgICAgLmNzcyh7XHJcbiAgICAgICAgICAgICAgJ3RvcCc6IC0oY2FudmFzQmIudG9wIC0gY29udGFpbmVyQmIudG9wKSxcclxuICAgICAgICAgICAgICAnbGVmdCc6IC0oY2FudmFzQmIubGVmdCAtIGNvbnRhaW5lckJiLmxlZnQpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICA7XHJcblxyXG4gICAgICAgICAgLy8gcmVmcmVzaCB0aGUgY3VlcyBvbiBjYW52YXMgcmVzaXplXHJcbiAgICAgICAgICBpZihjeSl7XHJcbiAgICAgICAgICAgIGNsZWFyRHJhd3ModHJ1ZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSwgMCk7XHJcblxyXG4gICAgICB9LCAyNTApO1xyXG5cclxuICAgICAgZnVuY3Rpb24gc2l6ZUNhbnZhcygpIHtcclxuICAgICAgICBfc2l6ZUNhbnZhcygpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBzaXplQ2FudmFzKCk7XHJcblxyXG4gICAgICAkKHdpbmRvdykuYmluZCgncmVzaXplJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHNpemVDYW52YXMoKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB2YXIgY3R4ID0gJGNhbnZhc1swXS5nZXRDb250ZXh0KCcyZCcpO1xyXG5cclxuICAgICAgLy8gd3JpdGUgb3B0aW9ucyB0byBkYXRhXHJcbiAgICAgIHZhciBkYXRhID0gJGNvbnRhaW5lci5kYXRhKCdjeWV4cGFuZGNvbGxhcHNlJyk7XHJcbiAgICAgIGlmIChkYXRhID09IG51bGwpIHtcclxuICAgICAgICBkYXRhID0ge307XHJcbiAgICAgIH1cclxuICAgICAgZGF0YS5vcHRpb25zID0gb3B0cztcclxuXHJcbiAgICAgIHZhciBvcHRDYWNoZTtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIG9wdGlvbnMoKSB7XHJcbiAgICAgICAgcmV0dXJuIG9wdENhY2hlIHx8IChvcHRDYWNoZSA9ICRjb250YWluZXIuZGF0YSgnY3lleHBhbmRjb2xsYXBzZScpLm9wdGlvbnMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmdW5jdGlvbiBjbGVhckRyYXdzKCkge1xyXG5cclxuICAgICAgICB2YXIgdyA9ICRjb250YWluZXIud2lkdGgoKTtcclxuICAgICAgICB2YXIgaCA9ICRjb250YWluZXIuaGVpZ2h0KCk7XHJcblxyXG4gICAgICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgdywgaCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZ1bmN0aW9uIGRyYXdFeHBhbmRDb2xsYXBzZUN1ZShub2RlKSB7XHJcbiAgICAgICAgdmFyIGN5ID0gbm9kZS5jeSgpO1xyXG4gICAgICAgIHZhciBjaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW4oKTtcclxuICAgICAgICB2YXIgY29sbGFwc2VkQ2hpbGRyZW4gPSBub2RlLl9wcml2YXRlLmRhdGEuY29sbGFwc2VkQ2hpbGRyZW47XHJcbiAgICAgICAgdmFyIGhhc0NoaWxkcmVuID0gY2hpbGRyZW4gIT0gbnVsbCAmJiBjaGlsZHJlbi5sZW5ndGggPiAwO1xyXG4gICAgICAgIC8vIElmIHRoaXMgaXMgYSBzaW1wbGUgbm9kZSB3aXRoIG5vIGNvbGxhcHNlZCBjaGlsZHJlbiByZXR1cm4gZGlyZWN0bHlcclxuICAgICAgICBpZiAoIWhhc0NoaWxkcmVuICYmIGNvbGxhcHNlZENoaWxkcmVuID09IG51bGwpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBpc0NvbGxhcHNlZCA9IG5vZGUuaGFzQ2xhc3MoJ2N5LWV4cGFuZC1jb2xsYXBzZS1jb2xsYXBzZWQtbm9kZScpO1xyXG5cclxuICAgICAgICAvL0RyYXcgZXhwYW5kLWNvbGxhcHNlIHJlY3RhbmdsZXNcclxuICAgICAgICB2YXIgcmVjdFNpemUgPSBvcHRpb25zKCkuZXhwYW5kQ29sbGFwc2VDdWVTaXplO1xyXG4gICAgICAgIHZhciBsaW5lU2l6ZSA9IG9wdGlvbnMoKS5leHBhbmRDb2xsYXBzZUN1ZUxpbmVTaXplO1xyXG4gICAgICAgIHZhciBkaWZmO1xyXG5cclxuICAgICAgICB2YXIgZXhwYW5kY29sbGFwc2VTdGFydFg7XHJcbiAgICAgICAgdmFyIGV4cGFuZGNvbGxhcHNlU3RhcnRZO1xyXG4gICAgICAgIHZhciBleHBhbmRjb2xsYXBzZUVuZFg7XHJcbiAgICAgICAgdmFyIGV4cGFuZGNvbGxhcHNlRW5kWTtcclxuICAgICAgICB2YXIgZXhwYW5kY29sbGFwc2VSZWN0U2l6ZTtcclxuXHJcbiAgICAgICAgdmFyIGV4cGFuZGNvbGxhcHNlQ2VudGVyWDtcclxuICAgICAgICB2YXIgZXhwYW5kY29sbGFwc2VDZW50ZXJZO1xyXG4gICAgICAgIHZhciBjdWVDZW50ZXI7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zKCkuZXhwYW5kQ29sbGFwc2VDdWVQb3NpdGlvbiA9PT0gJ3RvcC1sZWZ0Jykge1xyXG4gICAgICAgICAgdmFyIG9mZnNldCA9IDE7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICB2YXIgeCA9IG5vZGUucG9zaXRpb24oJ3gnKSAtIG5vZGUud2lkdGgoKSAvIDIgLSBwYXJzZUZsb2F0KG5vZGUuY3NzKCdwYWRkaW5nLWxlZnQnKSkgXHJcbiAgICAgICAgICAgICAgICAgICsgcGFyc2VGbG9hdChub2RlLmNzcygnYm9yZGVyLXdpZHRoJykpICsgcmVjdFNpemUgLyAyICsgb2Zmc2V0O1xyXG4gICAgICAgICAgdmFyIHkgPSBub2RlLnBvc2l0aW9uKCd5JykgLSBub2RlLmhlaWdodCgpIC8gMiAtIHBhcnNlRmxvYXQobm9kZS5jc3MoJ3BhZGRpbmctdG9wJykpIFxyXG4gICAgICAgICAgICAgICAgICArIHBhcnNlRmxvYXQobm9kZS5jc3MoJ2JvcmRlci13aWR0aCcpKSArIHJlY3RTaXplIC8gMiArIG9mZnNldDtcclxuXHJcbiAgICAgICAgICBjdWVDZW50ZXIgPSB7XHJcbiAgICAgICAgICAgIHggOiB4LFxyXG4gICAgICAgICAgICB5IDogeVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdmFyIG9wdGlvbiA9IG9wdGlvbnMoKS5leHBhbmRDb2xsYXBzZUN1ZVBvc2l0aW9uO1xyXG4gICAgICAgICAgY3VlQ2VudGVyID0gdHlwZW9mIG9wdGlvbiA9PT0gJ2Z1bmN0aW9uJyA/IG9wdGlvbi5jYWxsKHRoaXMsIG5vZGUpIDogb3B0aW9uO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB2YXIgZXhwYW5kY29sbGFwc2VDZW50ZXIgPSBlbGVtZW50VXRpbGl0aWVzLmNvbnZlcnRUb1JlbmRlcmVkUG9zaXRpb24oY3VlQ2VudGVyKTtcclxuXHJcbiAgICAgICAgLy8gY29udmVydCB0byByZW5kZXJlZCBzaXplc1xyXG4gICAgICAgIHJlY3RTaXplID0gcmVjdFNpemUgKiBjeS56b29tKCk7XHJcbiAgICAgICAgbGluZVNpemUgPSBsaW5lU2l6ZSAqIGN5Lnpvb20oKTtcclxuICAgICAgICBkaWZmID0gKHJlY3RTaXplIC0gbGluZVNpemUpIC8gMjtcclxuXHJcbiAgICAgICAgZXhwYW5kY29sbGFwc2VDZW50ZXJYID0gZXhwYW5kY29sbGFwc2VDZW50ZXIueDtcclxuICAgICAgICBleHBhbmRjb2xsYXBzZUNlbnRlclkgPSBleHBhbmRjb2xsYXBzZUNlbnRlci55O1xyXG5cclxuICAgICAgICBleHBhbmRjb2xsYXBzZVN0YXJ0WCA9IGV4cGFuZGNvbGxhcHNlQ2VudGVyWCAtIHJlY3RTaXplIC8gMjtcclxuICAgICAgICBleHBhbmRjb2xsYXBzZVN0YXJ0WSA9IGV4cGFuZGNvbGxhcHNlQ2VudGVyWSAtIHJlY3RTaXplIC8gMjtcclxuICAgICAgICBleHBhbmRjb2xsYXBzZUVuZFggPSBleHBhbmRjb2xsYXBzZVN0YXJ0WCArIHJlY3RTaXplO1xyXG4gICAgICAgIGV4cGFuZGNvbGxhcHNlRW5kWSA9IGV4cGFuZGNvbGxhcHNlU3RhcnRZICsgcmVjdFNpemU7XHJcbiAgICAgICAgZXhwYW5kY29sbGFwc2VSZWN0U2l6ZSA9IHJlY3RTaXplO1xyXG5cclxuICAgICAgICAvLyBEcmF3IGV4cGFuZC9jb2xsYXBzZSBjdWUgaWYgc3BlY2lmaWVkIHVzZSBhbiBpbWFnZSBlbHNlIHJlbmRlciBpdCBpbiB0aGUgZGVmYXVsdCB3YXlcclxuICAgICAgICBpZiAoIWlzQ29sbGFwc2VkICYmIG9wdGlvbnMoKS5leHBhbmRDdWVJbWFnZSkge1xyXG4gICAgICAgICAgdmFyIGltZz1uZXcgSW1hZ2UoKTtcclxuICAgICAgICAgIGltZy5zcmMgPSBvcHRpb25zKCkuZXhwYW5kQ3VlSW1hZ2U7XHJcbiAgICAgICAgICBjdHguZHJhd0ltYWdlKGltZywgZXhwYW5kY29sbGFwc2VDZW50ZXJYLCBleHBhbmRjb2xsYXBzZUNlbnRlclksIHJlY3RTaXplLCByZWN0U2l6ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGlzQ29sbGFwc2VkICYmIG9wdGlvbnMoKS5jb2xsYXBzZUN1ZUltYWdlKSB7XHJcbiAgICAgICAgICB2YXIgaW1nPW5ldyBJbWFnZSgpO1xyXG4gICAgICAgICAgaW1nLnNyYyA9IG9wdGlvbnMoKS5jb2xsYXBzZUN1ZUltYWdlO1xyXG4gICAgICAgICAgY3R4LmRyYXdJbWFnZShpbWcsIGV4cGFuZGNvbGxhcHNlQ2VudGVyWCwgZXhwYW5kY29sbGFwc2VDZW50ZXJZLCByZWN0U2l6ZSwgcmVjdFNpemUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHZhciBvbGRGaWxsU3R5bGUgPSBjdHguZmlsbFN0eWxlO1xyXG4gICAgICAgICAgdmFyIG9sZFdpZHRoID0gY3R4LmxpbmVXaWR0aDtcclxuICAgICAgICAgIHZhciBvbGRTdHJva2VTdHlsZSA9IGN0eC5zdHJva2VTdHlsZTtcclxuXHJcbiAgICAgICAgICBjdHguZmlsbFN0eWxlID0gXCJibGFja1wiO1xyXG4gICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gXCJibGFja1wiO1xyXG5cclxuICAgICAgICAgIGN0eC5lbGxpcHNlKGV4cGFuZGNvbGxhcHNlQ2VudGVyWCwgZXhwYW5kY29sbGFwc2VDZW50ZXJZLCByZWN0U2l6ZSAvIDIsIHJlY3RTaXplIC8gMiwgMCwgMCwgMiAqIE1hdGguUEkpO1xyXG4gICAgICAgICAgY3R4LmZpbGwoKTtcclxuXHJcbiAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcblxyXG4gICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gXCJ3aGl0ZVwiO1xyXG4gICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IDIuNiAqIGN5Lnpvb20oKTtcclxuXHJcbiAgICAgICAgICBjdHgubW92ZVRvKGV4cGFuZGNvbGxhcHNlU3RhcnRYICsgZGlmZiwgZXhwYW5kY29sbGFwc2VTdGFydFkgKyByZWN0U2l6ZSAvIDIpO1xyXG4gICAgICAgICAgY3R4LmxpbmVUbyhleHBhbmRjb2xsYXBzZVN0YXJ0WCArIGxpbmVTaXplICsgZGlmZiwgZXhwYW5kY29sbGFwc2VTdGFydFkgKyByZWN0U2l6ZSAvIDIpO1xyXG5cclxuICAgICAgICAgIGlmIChpc0NvbGxhcHNlZCkge1xyXG4gICAgICAgICAgICBjdHgubW92ZVRvKGV4cGFuZGNvbGxhcHNlU3RhcnRYICsgcmVjdFNpemUgLyAyLCBleHBhbmRjb2xsYXBzZVN0YXJ0WSArIGRpZmYpO1xyXG4gICAgICAgICAgICBjdHgubGluZVRvKGV4cGFuZGNvbGxhcHNlU3RhcnRYICsgcmVjdFNpemUgLyAyLCBleHBhbmRjb2xsYXBzZVN0YXJ0WSArIGxpbmVTaXplICsgZGlmZik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgICAgY3R4LnN0cm9rZSgpO1xyXG5cclxuICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IG9sZFN0cm9rZVN0eWxlO1xyXG4gICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IG9sZEZpbGxTdHlsZTtcclxuICAgICAgICAgIGN0eC5saW5lV2lkdGggPSBvbGRXaWR0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG5vZGUuX3ByaXZhdGUuZGF0YS5leHBhbmRjb2xsYXBzZVJlbmRlcmVkU3RhcnRYID0gZXhwYW5kY29sbGFwc2VTdGFydFg7XHJcbiAgICAgICAgbm9kZS5fcHJpdmF0ZS5kYXRhLmV4cGFuZGNvbGxhcHNlUmVuZGVyZWRTdGFydFkgPSBleHBhbmRjb2xsYXBzZVN0YXJ0WTtcclxuICAgICAgICBub2RlLl9wcml2YXRlLmRhdGEuZXhwYW5kY29sbGFwc2VSZW5kZXJlZEN1ZVNpemUgPSBleHBhbmRjb2xsYXBzZVJlY3RTaXplO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAkY29udGFpbmVyLmN5dG9zY2FwZShmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIGN5ID0gdGhpcztcclxuXHJcbiAgICAgICAgY3kuYmluZCgnem9vbSBwYW4nLCBlWm9vbSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGNsZWFyRHJhd3MoKTtcclxuICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgICAgIGN5Lm9uKCdtb3VzZW92ZXInLCAnbm9kZScsIGVNb3VzZU92ZXIgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgdmFyIG5vZGUgPSB0aGlzXHJcbiAgICAgICAgICBjbGVhckRyYXdzKCk7XHJcbiAgICAgICAgICBkcmF3RXhwYW5kQ29sbGFwc2VDdWUobm9kZSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGN5Lm9uKCdtb3VzZW91dCB0YXBkcmFnb3V0JywgJ25vZGUnLCBlTW91c2VPdXQgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgY2xlYXJEcmF3cygpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjeS5vbigncG9zaXRpb24nLCAnbm9kZScsIGVQb3NpdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGNsZWFyRHJhd3MoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY3kub24oJ3JlbW92ZScsICdub2RlJywgZVJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGNsZWFyRHJhd3MoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICBjeS5vbignZnJlZScsICdub2RlJywgZUZyZWUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2YXIgbm9kZSA9IHRoaXM7XHJcbiAgICAgICAgICBjbGVhckRyYXdzKCk7XHJcbiAgICAgICAgICBkcmF3RXhwYW5kQ29sbGFwc2VDdWUobm9kZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHVyO1xyXG4gICAgICAgIGN5Lm9uKCd0YXAnLCAnbm9kZScsIGVUYXAgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgIHZhciBub2RlID0gdGhpcztcclxuXHJcbiAgICAgICAgICB2YXIgZXhwYW5kY29sbGFwc2VSZW5kZXJlZFN0YXJ0WCA9IG5vZGUuX3ByaXZhdGUuZGF0YS5leHBhbmRjb2xsYXBzZVJlbmRlcmVkU3RhcnRYO1xyXG4gICAgICAgICAgdmFyIGV4cGFuZGNvbGxhcHNlUmVuZGVyZWRTdGFydFkgPSBub2RlLl9wcml2YXRlLmRhdGEuZXhwYW5kY29sbGFwc2VSZW5kZXJlZFN0YXJ0WTtcclxuICAgICAgICAgIHZhciBleHBhbmRjb2xsYXBzZVJlbmRlcmVkUmVjdFNpemUgPSBub2RlLl9wcml2YXRlLmRhdGEuZXhwYW5kY29sbGFwc2VSZW5kZXJlZEN1ZVNpemU7XHJcbiAgICAgICAgICB2YXIgZXhwYW5kY29sbGFwc2VSZW5kZXJlZEVuZFggPSBleHBhbmRjb2xsYXBzZVJlbmRlcmVkU3RhcnRYICsgZXhwYW5kY29sbGFwc2VSZW5kZXJlZFJlY3RTaXplO1xyXG4gICAgICAgICAgdmFyIGV4cGFuZGNvbGxhcHNlUmVuZGVyZWRFbmRZID0gZXhwYW5kY29sbGFwc2VSZW5kZXJlZFN0YXJ0WSArIGV4cGFuZGNvbGxhcHNlUmVuZGVyZWRSZWN0U2l6ZTtcclxuXHJcbiAgICAgICAgICB2YXIgY3lSZW5kZXJlZFBvc1ggPSBldmVudC5jeVJlbmRlcmVkUG9zaXRpb24ueDtcclxuICAgICAgICAgIHZhciBjeVJlbmRlcmVkUG9zWSA9IGV2ZW50LmN5UmVuZGVyZWRQb3NpdGlvbi55O1xyXG4gICAgICAgICAgdmFyIGZhY3RvciA9IChvcHRpb25zKCkuZXhwYW5kQ29sbGFwc2VDdWVTZW5zaXRpdml0eSAtIDEpIC8gMjtcclxuXHJcbiAgICAgICAgICBpZiAoY3lSZW5kZXJlZFBvc1ggPj0gZXhwYW5kY29sbGFwc2VSZW5kZXJlZFN0YXJ0WCAtIGV4cGFuZGNvbGxhcHNlUmVuZGVyZWRSZWN0U2l6ZSAqIGZhY3RvclxyXG4gICAgICAgICAgICAmJiBjeVJlbmRlcmVkUG9zWCA8PSBleHBhbmRjb2xsYXBzZVJlbmRlcmVkRW5kWCArIGV4cGFuZGNvbGxhcHNlUmVuZGVyZWRSZWN0U2l6ZSAqIGZhY3RvclxyXG4gICAgICAgICAgICAmJiBjeVJlbmRlcmVkUG9zWSA+PSBleHBhbmRjb2xsYXBzZVJlbmRlcmVkU3RhcnRZIC0gZXhwYW5kY29sbGFwc2VSZW5kZXJlZFJlY3RTaXplICogZmFjdG9yXHJcbiAgICAgICAgICAgICYmIGN5UmVuZGVyZWRQb3NZIDw9IGV4cGFuZGNvbGxhcHNlUmVuZGVyZWRFbmRZICsgZXhwYW5kY29sbGFwc2VSZW5kZXJlZFJlY3RTaXplICogZmFjdG9yKSB7XHJcbiAgICAgICAgICAgIGlmKG9wdHMudW5kb2FibGUgJiYgIXVyKVxyXG4gICAgICAgICAgICAgIHVyID0gY3kudW5kb1JlZG8oe1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdEFjdGlvbnM6IGZhbHNlXHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGlmKG5vZGUuaXNDb2xsYXBzaWJsZSgpKVxyXG4gICAgICAgICAgICAgIGlmIChvcHRzLnVuZG9hYmxlKVxyXG4gICAgICAgICAgICAgICAgdXIuZG8oXCJjb2xsYXBzZVwiLCB7XHJcbiAgICAgICAgICAgICAgICAgIG5vZGVzOiBub2RlLFxyXG4gICAgICAgICAgICAgICAgICBvcHRpb25zOiBvcHRzXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBub2RlLmNvbGxhcHNlKG9wdHMpO1xyXG4gICAgICAgICAgICBlbHNlIGlmKG5vZGUuaXNFeHBhbmRhYmxlKCkpXHJcbiAgICAgICAgICAgICAgaWYgKG9wdHMudW5kb2FibGUpXHJcbiAgICAgICAgICAgICAgICB1ci5kbyhcImV4cGFuZFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgIG5vZGVzOiBub2RlLFxyXG4gICAgICAgICAgICAgICAgICBvcHRpb25zOiBvcHRzXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBub2RlLmV4cGFuZChvcHRzKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICAkY29udGFpbmVyLmRhdGEoJ2N5ZXhwYW5kY29sbGFwc2UnLCBkYXRhKTtcclxuICAgIH0sXHJcbiAgICB1bmJpbmQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3kgPSB0aGlzLmN5dG9zY2FwZSgnZ2V0Jyk7XHJcbiAgICAgICAgY3kub2ZmKCdtb3VzZW92ZXInLCAnbm9kZScsIGVNb3VzZU92ZXIpXHJcbiAgICAgICAgICAub2ZmKCdtb3VzZW91dCB0YXBkcmFnb3V0JywgJ25vZGUnLCBlTW91c2VPdXQpXHJcbiAgICAgICAgICAub2ZmKCdwb3NpdGlvbicsICdub2RlJywgZVBvc2l0aW9uKVxyXG4gICAgICAgICAgLm9mZigncmVtb3ZlJywgJ25vZGUnLCBlUmVtb3ZlKVxyXG4gICAgICAgICAgLm9mZigndGFwJywgJ25vZGUnLCBlVGFwKVxyXG4gICAgICAgICAgLm9mZignYWRkJywgJ25vZGUnLCBlQWRkKVxyXG4gICAgICAgICAgLm9mZignZnJlZScsICdub2RlJywgZUZyZWUpO1xyXG5cclxuICAgICAgICBjeS51bmJpbmQoXCJ6b29tIHBhblwiLCBlWm9vbSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgaWYgKGZ1bmN0aW9uc1tmbl0pIHtcclxuICAgIHJldHVybiBmdW5jdGlvbnNbZm5dLmFwcGx5KCQoY3kuY29udGFpbmVyKCkpLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcclxuICB9IGVsc2UgaWYgKHR5cGVvZiBmbiA9PSAnb2JqZWN0JyB8fCAhZm4pIHtcclxuICAgIHJldHVybiBmdW5jdGlvbnMuaW5pdC5hcHBseSgkKGN5LmNvbnRhaW5lcigpKSwgYXJndW1lbnRzKTtcclxuICB9IGVsc2Uge1xyXG4gICAgJC5lcnJvcignTm8gc3VjaCBmdW5jdGlvbiBgJyArIGZuICsgJ2AgZm9yIGN5dG9zY2FwZS5qcy1leHBhbmQtY29sbGFwc2UnKTtcclxuICB9XHJcblxyXG4gIHJldHVybiAkKHRoaXMpO1xyXG59O1xyXG4iLCJ2YXIgZGVib3VuY2UgPSAoZnVuY3Rpb24gKCkge1xyXG4gIC8qKlxyXG4gICAqIGxvZGFzaCAzLjEuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cHM6Ly9sb2Rhc2guY29tLz5cclxuICAgKiBCdWlsZDogYGxvZGFzaCBtb2Rlcm4gbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXHJcbiAgICogQ29weXJpZ2h0IDIwMTItMjAxNSBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cclxuICAgKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuOC4zIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxyXG4gICAqIENvcHlyaWdodCAyMDA5LTIwMTUgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcclxuICAgKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxyXG4gICAqL1xyXG4gIC8qKiBVc2VkIGFzIHRoZSBgVHlwZUVycm9yYCBtZXNzYWdlIGZvciBcIkZ1bmN0aW9uc1wiIG1ldGhvZHMuICovXHJcbiAgdmFyIEZVTkNfRVJST1JfVEVYVCA9ICdFeHBlY3RlZCBhIGZ1bmN0aW9uJztcclxuXHJcbiAgLyogTmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cclxuICB2YXIgbmF0aXZlTWF4ID0gTWF0aC5tYXgsXHJcbiAgICAgICAgICBuYXRpdmVOb3cgPSBEYXRlLm5vdztcclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0aGF0IGhhdmUgZWxhcHNlZCBzaW5jZSB0aGUgVW5peCBlcG9jaFxyXG4gICAqICgxIEphbnVhcnkgMTk3MCAwMDowMDowMCBVVEMpLlxyXG4gICAqXHJcbiAgICogQHN0YXRpY1xyXG4gICAqIEBtZW1iZXJPZiBfXHJcbiAgICogQGNhdGVnb3J5IERhdGVcclxuICAgKiBAZXhhbXBsZVxyXG4gICAqXHJcbiAgICogXy5kZWZlcihmdW5jdGlvbihzdGFtcCkge1xyXG4gICAqICAgY29uc29sZS5sb2coXy5ub3coKSAtIHN0YW1wKTtcclxuICAgKiB9LCBfLm5vdygpKTtcclxuICAgKiAvLyA9PiBsb2dzIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGl0IHRvb2sgZm9yIHRoZSBkZWZlcnJlZCBmdW5jdGlvbiB0byBiZSBpbnZva2VkXHJcbiAgICovXHJcbiAgdmFyIG5vdyA9IG5hdGl2ZU5vdyB8fCBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIGRlYm91bmNlZCBmdW5jdGlvbiB0aGF0IGRlbGF5cyBpbnZva2luZyBgZnVuY2AgdW50aWwgYWZ0ZXIgYHdhaXRgXHJcbiAgICogbWlsbGlzZWNvbmRzIGhhdmUgZWxhcHNlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gd2FzXHJcbiAgICogaW52b2tlZC4gVGhlIGRlYm91bmNlZCBmdW5jdGlvbiBjb21lcyB3aXRoIGEgYGNhbmNlbGAgbWV0aG9kIHRvIGNhbmNlbFxyXG4gICAqIGRlbGF5ZWQgaW52b2NhdGlvbnMuIFByb3ZpZGUgYW4gb3B0aW9ucyBvYmplY3QgdG8gaW5kaWNhdGUgdGhhdCBgZnVuY2BcclxuICAgKiBzaG91bGQgYmUgaW52b2tlZCBvbiB0aGUgbGVhZGluZyBhbmQvb3IgdHJhaWxpbmcgZWRnZSBvZiB0aGUgYHdhaXRgIHRpbWVvdXQuXHJcbiAgICogU3Vic2VxdWVudCBjYWxscyB0byB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIHJldHVybiB0aGUgcmVzdWx0IG9mIHRoZSBsYXN0XHJcbiAgICogYGZ1bmNgIGludm9jYXRpb24uXHJcbiAgICpcclxuICAgKiAqKk5vdGU6KiogSWYgYGxlYWRpbmdgIGFuZCBgdHJhaWxpbmdgIG9wdGlvbnMgYXJlIGB0cnVlYCwgYGZ1bmNgIGlzIGludm9rZWRcclxuICAgKiBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dCBvbmx5IGlmIHRoZSB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIGlzXHJcbiAgICogaW52b2tlZCBtb3JlIHRoYW4gb25jZSBkdXJpbmcgdGhlIGB3YWl0YCB0aW1lb3V0LlxyXG4gICAqXHJcbiAgICogU2VlIFtEYXZpZCBDb3JiYWNobydzIGFydGljbGVdKGh0dHA6Ly9kcnVwYWxtb3Rpb24uY29tL2FydGljbGUvZGVib3VuY2UtYW5kLXRocm90dGxlLXZpc3VhbC1leHBsYW5hdGlvbilcclxuICAgKiBmb3IgZGV0YWlscyBvdmVyIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIGBfLmRlYm91bmNlYCBhbmQgYF8udGhyb3R0bGVgLlxyXG4gICAqXHJcbiAgICogQHN0YXRpY1xyXG4gICAqIEBtZW1iZXJPZiBfXHJcbiAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gZGVib3VuY2UuXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IFt3YWl0PTBdIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIGRlbGF5LlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gVGhlIG9wdGlvbnMgb2JqZWN0LlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubGVhZGluZz1mYWxzZV0gU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgbGVhZGluZ1xyXG4gICAqICBlZGdlIG9mIHRoZSB0aW1lb3V0LlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5tYXhXYWl0XSBUaGUgbWF4aW11bSB0aW1lIGBmdW5jYCBpcyBhbGxvd2VkIHRvIGJlXHJcbiAgICogIGRlbGF5ZWQgYmVmb3JlIGl0J3MgaW52b2tlZC5cclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnRyYWlsaW5nPXRydWVdIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIHRyYWlsaW5nXHJcbiAgICogIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXHJcbiAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZGVib3VuY2VkIGZ1bmN0aW9uLlxyXG4gICAqIEBleGFtcGxlXHJcbiAgICpcclxuICAgKiAvLyBhdm9pZCBjb3N0bHkgY2FsY3VsYXRpb25zIHdoaWxlIHRoZSB3aW5kb3cgc2l6ZSBpcyBpbiBmbHV4XHJcbiAgICogalF1ZXJ5KHdpbmRvdykub24oJ3Jlc2l6ZScsIF8uZGVib3VuY2UoY2FsY3VsYXRlTGF5b3V0LCAxNTApKTtcclxuICAgKlxyXG4gICAqIC8vIGludm9rZSBgc2VuZE1haWxgIHdoZW4gdGhlIGNsaWNrIGV2ZW50IGlzIGZpcmVkLCBkZWJvdW5jaW5nIHN1YnNlcXVlbnQgY2FsbHNcclxuICAgKiBqUXVlcnkoJyNwb3N0Ym94Jykub24oJ2NsaWNrJywgXy5kZWJvdW5jZShzZW5kTWFpbCwgMzAwLCB7XHJcbiAgICogICAnbGVhZGluZyc6IHRydWUsXHJcbiAgICogICAndHJhaWxpbmcnOiBmYWxzZVxyXG4gICAqIH0pKTtcclxuICAgKlxyXG4gICAqIC8vIGVuc3VyZSBgYmF0Y2hMb2dgIGlzIGludm9rZWQgb25jZSBhZnRlciAxIHNlY29uZCBvZiBkZWJvdW5jZWQgY2FsbHNcclxuICAgKiB2YXIgc291cmNlID0gbmV3IEV2ZW50U291cmNlKCcvc3RyZWFtJyk7XHJcbiAgICogalF1ZXJ5KHNvdXJjZSkub24oJ21lc3NhZ2UnLCBfLmRlYm91bmNlKGJhdGNoTG9nLCAyNTAsIHtcclxuICAgKiAgICdtYXhXYWl0JzogMTAwMFxyXG4gICAqIH0pKTtcclxuICAgKlxyXG4gICAqIC8vIGNhbmNlbCBhIGRlYm91bmNlZCBjYWxsXHJcbiAgICogdmFyIHRvZG9DaGFuZ2VzID0gXy5kZWJvdW5jZShiYXRjaExvZywgMTAwMCk7XHJcbiAgICogT2JqZWN0Lm9ic2VydmUobW9kZWxzLnRvZG8sIHRvZG9DaGFuZ2VzKTtcclxuICAgKlxyXG4gICAqIE9iamVjdC5vYnNlcnZlKG1vZGVscywgZnVuY3Rpb24oY2hhbmdlcykge1xyXG4gICAqICAgaWYgKF8uZmluZChjaGFuZ2VzLCB7ICd1c2VyJzogJ3RvZG8nLCAndHlwZSc6ICdkZWxldGUnfSkpIHtcclxuICAgKiAgICAgdG9kb0NoYW5nZXMuY2FuY2VsKCk7XHJcbiAgICogICB9XHJcbiAgICogfSwgWydkZWxldGUnXSk7XHJcbiAgICpcclxuICAgKiAvLyAuLi5hdCBzb21lIHBvaW50IGBtb2RlbHMudG9kb2AgaXMgY2hhbmdlZFxyXG4gICAqIG1vZGVscy50b2RvLmNvbXBsZXRlZCA9IHRydWU7XHJcbiAgICpcclxuICAgKiAvLyAuLi5iZWZvcmUgMSBzZWNvbmQgaGFzIHBhc3NlZCBgbW9kZWxzLnRvZG9gIGlzIGRlbGV0ZWRcclxuICAgKiAvLyB3aGljaCBjYW5jZWxzIHRoZSBkZWJvdW5jZWQgYHRvZG9DaGFuZ2VzYCBjYWxsXHJcbiAgICogZGVsZXRlIG1vZGVscy50b2RvO1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcclxuICAgIHZhciBhcmdzLFxyXG4gICAgICAgICAgICBtYXhUaW1lb3V0SWQsXHJcbiAgICAgICAgICAgIHJlc3VsdCxcclxuICAgICAgICAgICAgc3RhbXAsXHJcbiAgICAgICAgICAgIHRoaXNBcmcsXHJcbiAgICAgICAgICAgIHRpbWVvdXRJZCxcclxuICAgICAgICAgICAgdHJhaWxpbmdDYWxsLFxyXG4gICAgICAgICAgICBsYXN0Q2FsbGVkID0gMCxcclxuICAgICAgICAgICAgbWF4V2FpdCA9IGZhbHNlLFxyXG4gICAgICAgICAgICB0cmFpbGluZyA9IHRydWU7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicpIHtcclxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xyXG4gICAgfVxyXG4gICAgd2FpdCA9IHdhaXQgPCAwID8gMCA6ICgrd2FpdCB8fCAwKTtcclxuICAgIGlmIChvcHRpb25zID09PSB0cnVlKSB7XHJcbiAgICAgIHZhciBsZWFkaW5nID0gdHJ1ZTtcclxuICAgICAgdHJhaWxpbmcgPSBmYWxzZTtcclxuICAgIH0gZWxzZSBpZiAoaXNPYmplY3Qob3B0aW9ucykpIHtcclxuICAgICAgbGVhZGluZyA9ICEhb3B0aW9ucy5sZWFkaW5nO1xyXG4gICAgICBtYXhXYWl0ID0gJ21heFdhaXQnIGluIG9wdGlvbnMgJiYgbmF0aXZlTWF4KCtvcHRpb25zLm1heFdhaXQgfHwgMCwgd2FpdCk7XHJcbiAgICAgIHRyYWlsaW5nID0gJ3RyYWlsaW5nJyBpbiBvcHRpb25zID8gISFvcHRpb25zLnRyYWlsaW5nIDogdHJhaWxpbmc7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2FuY2VsKCkge1xyXG4gICAgICBpZiAodGltZW91dElkKSB7XHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKG1heFRpbWVvdXRJZCkge1xyXG4gICAgICAgIGNsZWFyVGltZW91dChtYXhUaW1lb3V0SWQpO1xyXG4gICAgICB9XHJcbiAgICAgIGxhc3RDYWxsZWQgPSAwO1xyXG4gICAgICBtYXhUaW1lb3V0SWQgPSB0aW1lb3V0SWQgPSB0cmFpbGluZ0NhbGwgPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY29tcGxldGUoaXNDYWxsZWQsIGlkKSB7XHJcbiAgICAgIGlmIChpZCkge1xyXG4gICAgICAgIGNsZWFyVGltZW91dChpZCk7XHJcbiAgICAgIH1cclxuICAgICAgbWF4VGltZW91dElkID0gdGltZW91dElkID0gdHJhaWxpbmdDYWxsID0gdW5kZWZpbmVkO1xyXG4gICAgICBpZiAoaXNDYWxsZWQpIHtcclxuICAgICAgICBsYXN0Q2FsbGVkID0gbm93KCk7XHJcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcclxuICAgICAgICBpZiAoIXRpbWVvdXRJZCAmJiAhbWF4VGltZW91dElkKSB7XHJcbiAgICAgICAgICBhcmdzID0gdGhpc0FyZyA9IHVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkZWxheWVkKCkge1xyXG4gICAgICB2YXIgcmVtYWluaW5nID0gd2FpdCAtIChub3coKSAtIHN0YW1wKTtcclxuICAgICAgaWYgKHJlbWFpbmluZyA8PSAwIHx8IHJlbWFpbmluZyA+IHdhaXQpIHtcclxuICAgICAgICBjb21wbGV0ZSh0cmFpbGluZ0NhbGwsIG1heFRpbWVvdXRJZCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGltZW91dElkID0gc2V0VGltZW91dChkZWxheWVkLCByZW1haW5pbmcpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbWF4RGVsYXllZCgpIHtcclxuICAgICAgY29tcGxldGUodHJhaWxpbmcsIHRpbWVvdXRJZCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGVib3VuY2VkKCkge1xyXG4gICAgICBhcmdzID0gYXJndW1lbnRzO1xyXG4gICAgICBzdGFtcCA9IG5vdygpO1xyXG4gICAgICB0aGlzQXJnID0gdGhpcztcclxuICAgICAgdHJhaWxpbmdDYWxsID0gdHJhaWxpbmcgJiYgKHRpbWVvdXRJZCB8fCAhbGVhZGluZyk7XHJcblxyXG4gICAgICBpZiAobWF4V2FpdCA9PT0gZmFsc2UpIHtcclxuICAgICAgICB2YXIgbGVhZGluZ0NhbGwgPSBsZWFkaW5nICYmICF0aW1lb3V0SWQ7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKCFtYXhUaW1lb3V0SWQgJiYgIWxlYWRpbmcpIHtcclxuICAgICAgICAgIGxhc3RDYWxsZWQgPSBzdGFtcDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHJlbWFpbmluZyA9IG1heFdhaXQgLSAoc3RhbXAgLSBsYXN0Q2FsbGVkKSxcclxuICAgICAgICAgICAgICAgIGlzQ2FsbGVkID0gcmVtYWluaW5nIDw9IDAgfHwgcmVtYWluaW5nID4gbWF4V2FpdDtcclxuXHJcbiAgICAgICAgaWYgKGlzQ2FsbGVkKSB7XHJcbiAgICAgICAgICBpZiAobWF4VGltZW91dElkKSB7XHJcbiAgICAgICAgICAgIG1heFRpbWVvdXRJZCA9IGNsZWFyVGltZW91dChtYXhUaW1lb3V0SWQpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgbGFzdENhbGxlZCA9IHN0YW1wO1xyXG4gICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIW1heFRpbWVvdXRJZCkge1xyXG4gICAgICAgICAgbWF4VGltZW91dElkID0gc2V0VGltZW91dChtYXhEZWxheWVkLCByZW1haW5pbmcpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBpZiAoaXNDYWxsZWQgJiYgdGltZW91dElkKSB7XHJcbiAgICAgICAgdGltZW91dElkID0gY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIXRpbWVvdXRJZCAmJiB3YWl0ICE9PSBtYXhXYWl0KSB7XHJcbiAgICAgICAgdGltZW91dElkID0gc2V0VGltZW91dChkZWxheWVkLCB3YWl0KTtcclxuICAgICAgfVxyXG4gICAgICBpZiAobGVhZGluZ0NhbGwpIHtcclxuICAgICAgICBpc0NhbGxlZCA9IHRydWU7XHJcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoaXNDYWxsZWQgJiYgIXRpbWVvdXRJZCAmJiAhbWF4VGltZW91dElkKSB7XHJcbiAgICAgICAgYXJncyA9IHRoaXNBcmcgPSB1bmRlZmluZWQ7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBkZWJvdW5jZWQuY2FuY2VsID0gY2FuY2VsO1xyXG4gICAgcmV0dXJuIGRlYm91bmNlZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHRoZSBbbGFuZ3VhZ2UgdHlwZV0oaHR0cHM6Ly9lczUuZ2l0aHViLmlvLyN4OCkgb2YgYE9iamVjdGAuXHJcbiAgICogKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXHJcbiAgICpcclxuICAgKiBAc3RhdGljXHJcbiAgICogQG1lbWJlck9mIF9cclxuICAgKiBAY2F0ZWdvcnkgTGFuZ1xyXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxyXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxyXG4gICAqIEBleGFtcGxlXHJcbiAgICpcclxuICAgKiBfLmlzT2JqZWN0KHt9KTtcclxuICAgKiAvLyA9PiB0cnVlXHJcbiAgICpcclxuICAgKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XHJcbiAgICogLy8gPT4gdHJ1ZVxyXG4gICAqXHJcbiAgICogXy5pc09iamVjdCgxKTtcclxuICAgKiAvLyA9PiBmYWxzZVxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XHJcbiAgICAvLyBBdm9pZCBhIFY4IEpJVCBidWcgaW4gQ2hyb21lIDE5LTIwLlxyXG4gICAgLy8gU2VlIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0yMjkxIGZvciBtb3JlIGRldGFpbHMuXHJcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcclxuICAgIHJldHVybiAhIXZhbHVlICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZGVib3VuY2U7XHJcblxyXG59KSgpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBkZWJvdW5jZTsiLCJmdW5jdGlvbiBlbGVtZW50VXRpbGl0aWVzKGN5KSB7XHJcbiByZXR1cm4ge1xyXG4gIG1vdmVOb2RlczogZnVuY3Rpb24gKHBvc2l0aW9uRGlmZiwgbm9kZXMsIG5vdENhbGNUb3BNb3N0Tm9kZXMpIHtcclxuICAgIHZhciB0b3BNb3N0Tm9kZXMgPSBub3RDYWxjVG9wTW9zdE5vZGVzID8gbm9kZXMgOiB0aGlzLmdldFRvcE1vc3ROb2Rlcyhub2Rlcyk7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRvcE1vc3ROb2Rlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICB2YXIgbm9kZSA9IHRvcE1vc3ROb2Rlc1tpXTtcclxuICAgICAgdmFyIG9sZFggPSBub2RlLnBvc2l0aW9uKFwieFwiKTtcclxuICAgICAgdmFyIG9sZFkgPSBub2RlLnBvc2l0aW9uKFwieVwiKTtcclxuICAgICAgbm9kZS5wb3NpdGlvbih7XHJcbiAgICAgICAgeDogb2xkWCArIHBvc2l0aW9uRGlmZi54LFxyXG4gICAgICAgIHk6IG9sZFkgKyBwb3NpdGlvbkRpZmYueVxyXG4gICAgICB9KTtcclxuICAgICAgdmFyIGNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbigpO1xyXG4gICAgICB0aGlzLm1vdmVOb2Rlcyhwb3NpdGlvbkRpZmYsIGNoaWxkcmVuLCB0cnVlKTtcclxuICAgIH1cclxuICB9LFxyXG4gIGdldFRvcE1vc3ROb2RlczogZnVuY3Rpb24gKG5vZGVzKSB7Ly8qLy9cclxuICAgIHZhciBub2Rlc01hcCA9IHt9O1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBub2Rlc01hcFtub2Rlc1tpXS5pZCgpXSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICB2YXIgcm9vdHMgPSBub2Rlcy5maWx0ZXIoZnVuY3Rpb24gKGksIGVsZSkge1xyXG4gICAgICB2YXIgcGFyZW50ID0gZWxlLnBhcmVudCgpWzBdO1xyXG4gICAgICB3aGlsZSAocGFyZW50ICE9IG51bGwpIHtcclxuICAgICAgICBpZiAobm9kZXNNYXBbcGFyZW50LmlkKCldKSB7XHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQoKVswXTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiByb290cztcclxuICB9LFxyXG4gIHJlYXJyYW5nZTogZnVuY3Rpb24gKGxheW91dEJ5KSB7XHJcbiAgICBpZiAodHlwZW9mIGxheW91dEJ5ID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgbGF5b3V0QnkoKTtcclxuICAgIH0gZWxzZSBpZiAobGF5b3V0QnkgIT0gbnVsbCkge1xyXG4gICAgICBjeS5sYXlvdXQobGF5b3V0QnkpO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgY29udmVydFRvUmVuZGVyZWRQb3NpdGlvbjogZnVuY3Rpb24gKG1vZGVsUG9zaXRpb24pIHtcclxuICAgIHZhciBwYW4gPSBjeS5wYW4oKTtcclxuICAgIHZhciB6b29tID0gY3kuem9vbSgpO1xyXG5cclxuICAgIHZhciB4ID0gbW9kZWxQb3NpdGlvbi54ICogem9vbSArIHBhbi54O1xyXG4gICAgdmFyIHkgPSBtb2RlbFBvc2l0aW9uLnkgKiB6b29tICsgcGFuLnk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgeDogeCxcclxuICAgICAgeTogeVxyXG4gICAgfTtcclxuICB9XHJcbiB9O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGVsZW1lbnRVdGlsaXRpZXM7XHJcbiIsInZhciBib3VuZGluZ0JveFV0aWxpdGllcyA9IHJlcXVpcmUoJy4vYm91bmRpbmdCb3hVdGlsaXRpZXMnKTtcclxuXHJcbi8vIEV4cGFuZCBjb2xsYXBzZSB1dGlsaXRpZXNcclxuZnVuY3Rpb24gZXhwYW5kQ29sbGFwc2VVdGlsaXRpZXMoY3kpIHtcclxudmFyIGVsZW1lbnRVdGlsaXRpZXMgPSByZXF1aXJlKCcuL2VsZW1lbnRVdGlsaXRpZXMnKShjeSk7XHJcbnJldHVybiB7XHJcbiAgLy90aGUgbnVtYmVyIG9mIG5vZGVzIG1vdmluZyBhbmltYXRlZGx5IGFmdGVyIGV4cGFuZCBvcGVyYXRpb25cclxuICBhbmltYXRlZGx5TW92aW5nTm9kZUNvdW50OiAwLFxyXG4gIC8vQSBmdW50aW9uIGJhc2ljbHkgZXhwYW5kaW5nIGEgbm9kZSBpdCBpcyB0byBiZSBjYWxsZWQgd2hlbiBhIG5vZGUgaXMgZXhwYW5kZWQgYW55d2F5XHJcbiAgZXhwYW5kTm9kZUJhc2VGdW5jdGlvbjogZnVuY3Rpb24gKG5vZGUsIHRyaWdnZXJMYXlvdXQsIHNpbmdsZSwgbGF5b3V0QnkpIHsvLyovL1xyXG4gICAgLy9jaGVjayBob3cgdGhlIHBvc2l0aW9uIG9mIHRoZSBub2RlIGlzIGNoYW5nZWRcclxuICAgIHZhciBwb3NpdGlvbkRpZmYgPSB7XHJcbiAgICAgIHg6IG5vZGUucG9zaXRpb24oJ3gnKSAtIG5vZGUuZGF0YSgncG9zaXRpb24tYmVmb3JlLWNvbGxhcHNlJykueCxcclxuICAgICAgeTogbm9kZS5wb3NpdGlvbigneScpIC0gbm9kZS5kYXRhKCdwb3NpdGlvbi1iZWZvcmUtY29sbGFwc2UnKS55XHJcbiAgICB9O1xyXG5cclxuICAgIG5vZGUucmVtb3ZlRGF0YShcImluZm9MYWJlbFwiKTtcclxuICAgIG5vZGUucmVtb3ZlQ2xhc3MoJ2N5LWV4cGFuZC1jb2xsYXBzZS1jb2xsYXBzZWQtbm9kZScpO1xyXG5cclxuICAgIG5vZGUudHJpZ2dlcihcImJlZm9yZUV4cGFuZFwiKTtcclxuICAgIG5vZGUuX3ByaXZhdGUuZGF0YS5jb2xsYXBzZWRDaGlsZHJlbi5yZXN0b3JlKCk7XHJcbiAgICB0aGlzLnJlcGFpckVkZ2VzKG5vZGUpO1xyXG4gICAgbm9kZS5fcHJpdmF0ZS5kYXRhLmNvbGxhcHNlZENoaWxkcmVuID0gbnVsbDtcclxuICAgIG5vZGUudHJpZ2dlcihcImFmdGVyRXhwYW5kXCIpO1xyXG5cclxuXHJcbiAgICBlbGVtZW50VXRpbGl0aWVzLm1vdmVOb2Rlcyhwb3NpdGlvbkRpZmYsIG5vZGUuY2hpbGRyZW4oKSk7XHJcbiAgICBub2RlLnJlbW92ZURhdGEoJ3Bvc2l0aW9uLWJlZm9yZS1jb2xsYXBzZScpO1xyXG5cclxuICAgIGlmIChzaW5nbGUpXHJcbiAgICAgIHRoaXMuZW5kT3BlcmF0aW9uKGxheW91dEJ5KTtcclxuICAgIC8vIHJlZnJlc2hQYWRkaW5ncygpO1xyXG4gICAvKiBpZiAodHJpZ2dlckxheW91dClcclxuICAgICAgZWxlbWVudFV0aWxpdGllcy5yZWFycmFuZ2UobGF5b3V0QnkpOyovXHJcbiAgfSxcclxuICBzaW1wbGVDb2xsYXBzZUdpdmVuTm9kZXM6IGZ1bmN0aW9uIChub2Rlcykgey8vKi8vXHJcbiAgICBub2Rlcy5kYXRhKFwiY29sbGFwc2VcIiwgdHJ1ZSk7XHJcbiAgICB2YXIgcm9vdHMgPSBlbGVtZW50VXRpbGl0aWVzLmdldFRvcE1vc3ROb2Rlcyhub2Rlcyk7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJvb3RzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHZhciByb290ID0gcm9vdHNbaV07XHJcbiAgICAgIFxyXG4gICAgICAvLyBDb2xsYXBzZSB0aGUgbm9kZXMgaW4gYm90dG9tIHVwIG9yZGVyXHJcbiAgICAgIHRoaXMuY29sbGFwc2VCb3R0b21VcChyb290KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIG5vZGVzO1xyXG4gIH0sXHJcbiAgc2ltcGxlRXhwYW5kR2l2ZW5Ob2RlczogZnVuY3Rpb24gKG5vZGVzLCBhcHBseUZpc2hFeWVWaWV3VG9FYWNoTm9kZSkgey8vKi8vXHJcbiAgICBub2Rlcy5kYXRhKFwiZXhwYW5kXCIsIHRydWUpO1xyXG4gICAgdmFyIHJvb3RzID0gZWxlbWVudFV0aWxpdGllcy5nZXRUb3BNb3N0Tm9kZXMobm9kZXMpO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByb290cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICB2YXIgcm9vdCA9IHJvb3RzW2ldO1xyXG4gICAgICB0aGlzLmV4cGFuZFRvcERvd24ocm9vdCwgYXBwbHlGaXNoRXllVmlld1RvRWFjaE5vZGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5vZGVzO1xyXG4gIH0sXHJcbiAgc2ltcGxlRXhwYW5kQWxsTm9kZXM6IGZ1bmN0aW9uIChub2RlcywgYXBwbHlGaXNoRXllVmlld1RvRWFjaE5vZGUpIHsvLyovL1xyXG4gICAgaWYgKG5vZGVzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgbm9kZXMgPSBjeS5ub2RlcygpO1xyXG4gICAgfVxyXG4gICAgdmFyIG9ycGhhbnM7XHJcbiAgICBvcnBoYW5zID0gZWxlbWVudFV0aWxpdGllcy5nZXRUb3BNb3N0Tm9kZXMobm9kZXMpO1xyXG4gICAgdmFyIGV4cGFuZFN0YWNrID0gW107XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9ycGhhbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdmFyIHJvb3QgPSBvcnBoYW5zW2ldO1xyXG4gICAgICB0aGlzLmV4cGFuZEFsbFRvcERvd24ocm9vdCwgZXhwYW5kU3RhY2ssIGFwcGx5RmlzaEV5ZVZpZXdUb0VhY2hOb2RlKTtcclxuICAgIH1cclxuICAgIHJldHVybiBleHBhbmRTdGFjaztcclxuICB9LFxyXG4gIGVuZE9wZXJhdGlvbjogZnVuY3Rpb24gKGxheW91dEJ5KSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICBjeS5yZWFkeShmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGVsZW1lbnRVdGlsaXRpZXMucmVhcnJhbmdlKGxheW91dEJ5KTtcclxuICAgIH0pO1xyXG4gIH0sXHJcbiAgZXhwYW5kQWxsTm9kZXM6IGZ1bmN0aW9uIChub2Rlcywgb3B0aW9ucykgey8vKi8vXHJcbiAgICB2YXIgZXhwYW5kZWRTdGFjayA9IHRoaXMuc2ltcGxlRXhwYW5kQWxsTm9kZXMobm9kZXMsIG9wdGlvbnMuZmlzaGV5ZSk7XHJcblxyXG4gICAgdGhpcy5lbmRPcGVyYXRpb24ob3B0aW9ucy5sYXlvdXRCeSk7XHJcblxyXG4gICAgLy9lbGVtZW50VXRpbGl0aWVzLnJlYXJyYW5nZShvcHRpb25zLmxheW91dEJ5KTtcclxuXHJcbiAgICAvKlxyXG4gICAgICogcmV0dXJuIHRoZSBub2RlcyB0byB1bmRvIHRoZSBvcGVyYXRpb25cclxuICAgICAqL1xyXG4gICAgcmV0dXJuIGV4cGFuZGVkU3RhY2s7XHJcbiAgfSxcclxuICBleHBhbmRBbGxUb3BEb3duOiBmdW5jdGlvbiAocm9vdCwgZXhwYW5kU3RhY2ssIGFwcGx5RmlzaEV5ZVZpZXdUb0VhY2hOb2RlKSB7Ly8qLy9cclxuICAgIGlmIChyb290Ll9wcml2YXRlLmRhdGEuY29sbGFwc2VkQ2hpbGRyZW4gIT0gbnVsbCkge1xyXG4gICAgICBleHBhbmRTdGFjay5wdXNoKHJvb3QpO1xyXG4gICAgICB0aGlzLnNpbXBsZUV4cGFuZE5vZGUocm9vdCwgYXBwbHlGaXNoRXllVmlld1RvRWFjaE5vZGUpO1xyXG4gICAgfVxyXG4gICAgdmFyIGNoaWxkcmVuID0gcm9vdC5jaGlsZHJlbigpO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICB2YXIgbm9kZSA9IGNoaWxkcmVuW2ldO1xyXG4gICAgICB0aGlzLmV4cGFuZEFsbFRvcERvd24obm9kZSwgZXhwYW5kU3RhY2ssIGFwcGx5RmlzaEV5ZVZpZXdUb0VhY2hOb2RlKTtcclxuICAgIH1cclxuICB9LFxyXG4gIC8vRXhwYW5kIHRoZSBnaXZlbiBub2RlcyBwZXJmb3JtIGluY3JlbWVudGFsIGxheW91dCBhZnRlciBleHBhbmRhdGlvblxyXG4gIGV4cGFuZEdpdmVuTm9kZXM6IGZ1bmN0aW9uIChub2Rlcywgb3B0aW9ucykgey8vKi8vXHJcbiAgICBpZiAobm9kZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgIHRoaXMuZXhwYW5kTm9kZShub2Rlc1swXSwgb3B0aW9ucy5maXNoZXllLCBvcHRpb25zLmFuaW1hdGUsIG9wdGlvbnMubGF5b3V0QnkpO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuc2ltcGxlRXhwYW5kR2l2ZW5Ob2Rlcyhub2Rlcywgb3B0aW9ucy5maXNoZXllKTtcclxuICAgICAgdGhpcy5lbmRPcGVyYXRpb24ob3B0aW9ucy5sYXlvdXRCeSk7XHJcblxyXG4gICAgICAvL2VsZW1lbnRVdGlsaXRpZXMucmVhcnJhbmdlKG9wdGlvbnMubGF5b3V0QnkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qXHJcbiAgICAgKiByZXR1cm4gdGhlIG5vZGVzIHRvIHVuZG8gdGhlIG9wZXJhdGlvblxyXG4gICAgICovXHJcbiAgICByZXR1cm4gbm9kZXM7XHJcbiAgfSxcclxuICAvL2NvbGxhcHNlIHRoZSBnaXZlbiBub2RlcyB0aGVuIG1ha2UgaW5jcmVtZW50YWwgbGF5b3V0XHJcbiAgY29sbGFwc2VHaXZlbk5vZGVzOiBmdW5jdGlvbiAobm9kZXMsIG9wdGlvbnMpIHsvLyovL1xyXG4gICAgY3kuc3RhcnRCYXRjaCgpO1xyXG4gICAgdGhpcy5zaW1wbGVDb2xsYXBzZUdpdmVuTm9kZXMobm9kZXMsIG9wdGlvbnMpO1xyXG4gICAgY3kuZW5kQmF0Y2goKTtcclxuXHJcbiAgICB0aGlzLmVuZE9wZXJhdGlvbihvcHRpb25zLmxheW91dEJ5KTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIHN0eWxlXHJcbiAgICBjeS5zdHlsZSgpLnVwZGF0ZSgpO1xyXG5cclxuICAgIC8qXHJcbiAgICAgKiByZXR1cm4gdGhlIG5vZGVzIHRvIHVuZG8gdGhlIG9wZXJhdGlvblxyXG4gICAgICovXHJcbiAgICByZXR1cm4gbm9kZXM7XHJcbiAgfSxcclxuICAvL2NvbGxhcHNlIHRoZSBub2RlcyBpbiBib3R0b20gdXAgb3JkZXIgc3RhcnRpbmcgZnJvbSB0aGUgcm9vdFxyXG4gIGNvbGxhcHNlQm90dG9tVXA6IGZ1bmN0aW9uIChyb290KSB7Ly8qLy9cclxuICAgIHZhciBjaGlsZHJlbiA9IHJvb3QuY2hpbGRyZW4oKTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdmFyIG5vZGUgPSBjaGlsZHJlbltpXTtcclxuICAgICAgdGhpcy5jb2xsYXBzZUJvdHRvbVVwKG5vZGUpO1xyXG4gICAgfVxyXG4gICAgLy9JZiB0aGUgcm9vdCBpcyBhIGNvbXBvdW5kIG5vZGUgdG8gYmUgY29sbGFwc2VkIHRoZW4gY29sbGFwc2UgaXRcclxuICAgIGlmIChyb290LmRhdGEoXCJjb2xsYXBzZVwiKSAmJiByb290LmNoaWxkcmVuKCkubGVuZ3RoID4gMCkge1xyXG4gICAgICB0aGlzLnNpbXBsZUNvbGxhcHNlTm9kZShyb290KTtcclxuICAgICAgcm9vdC5yZW1vdmVEYXRhKFwiY29sbGFwc2VcIik7XHJcbiAgICB9XHJcbiAgfSxcclxuICAvL2V4cGFuZCB0aGUgbm9kZXMgaW4gdG9wIGRvd24gb3JkZXIgc3RhcnRpbmcgZnJvbSB0aGUgcm9vdFxyXG4gIGV4cGFuZFRvcERvd246IGZ1bmN0aW9uIChyb290LCBhcHBseUZpc2hFeWVWaWV3VG9FYWNoTm9kZSkgey8vKi8vXHJcbiAgICBpZiAocm9vdC5kYXRhKFwiZXhwYW5kXCIpICYmIHJvb3QuX3ByaXZhdGUuZGF0YS5jb2xsYXBzZWRDaGlsZHJlbiAhPSBudWxsKSB7XHJcbiAgICAgIHRoaXMuc2ltcGxlRXhwYW5kTm9kZShyb290LCBhcHBseUZpc2hFeWVWaWV3VG9FYWNoTm9kZSk7XHJcbiAgICAgIHJvb3QucmVtb3ZlRGF0YShcImV4cGFuZFwiKTtcclxuICAgIH1cclxuICAgIHZhciBjaGlsZHJlbiA9IHJvb3QuY2hpbGRyZW4oKTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdmFyIG5vZGUgPSBjaGlsZHJlbltpXTtcclxuICAgICAgdGhpcy5leHBhbmRUb3BEb3duKG5vZGUpO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgZXhwYW5kTm9kZTogZnVuY3Rpb24gKG5vZGUsIGZpc2hleWUsIGFuaW1hdGUsIGxheW91dEJ5KSB7XHJcbiAgICBpZiAobm9kZS5fcHJpdmF0ZS5kYXRhLmNvbGxhcHNlZENoaWxkcmVuICE9IG51bGwpIHtcclxuICAgICAgdGhpcy5zaW1wbGVFeHBhbmROb2RlKG5vZGUsIGZpc2hleWUsIHRydWUsIGFuaW1hdGUsIGxheW91dEJ5KTtcclxuXHJcbiAgICAgIC8qXHJcbiAgICAgICAqIHJldHVybiB0aGUgbm9kZSB0byB1bmRvIHRoZSBvcGVyYXRpb25cclxuICAgICAgICovXHJcbiAgICAgIHJldHVybiBub2RlO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgY29udmVydFRvTW9kZWxQb3NpdGlvbjogZnVuY3Rpb24gKHJlbmRlcmVkUG9zaXRpb24pIHtcclxuICAgIHZhciBwYW4gPSBjeS5wYW4oKTtcclxuICAgIHZhciB6b29tID0gY3kuem9vbSgpO1xyXG5cclxuICAgIHZhciB4ID0gKHJlbmRlcmVkUG9zaXRpb24ueCAtIHBhbi54KSAvIHpvb207XHJcbiAgICB2YXIgeSA9IChyZW5kZXJlZFBvc2l0aW9uLnkgLSBwYW4ueSkgLyB6b29tO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHg6IHgsXHJcbiAgICAgIHk6IHlcclxuICAgIH07XHJcbiAgfSxcclxuICAvKlxyXG4gICAqXHJcbiAgICogVGhpcyBtZXRob2QgZXhwYW5kcyB0aGUgZ2l2ZW4gbm9kZVxyXG4gICAqIHdpdGhvdXQgbWFraW5nIGluY3JlbWVudGFsIGxheW91dFxyXG4gICAqIGFmdGVyIGV4cGFuZCBvcGVyYXRpb24gaXQgd2lsbCBiZSBzaW1wbHlcclxuICAgKiB1c2VkIHRvIHVuZG8gdGhlIGNvbGxhcHNlIG9wZXJhdGlvblxyXG4gICAqL1xyXG4gIHNpbXBsZUV4cGFuZE5vZGU6IGZ1bmN0aW9uIChub2RlLCBhcHBseUZpc2hFeWVWaWV3VG9FYWNoTm9kZSwgc2luZ2xlTm90U2ltcGxlLCBhbmltYXRlLCBsYXlvdXRCeSkgey8vKi8vXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICBcclxuICAgIGlmKCAhYW5pbWF0ZSApIHtcclxuICAgICAgY3kuc3RhcnRCYXRjaCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjb21tb25FeHBhbmRPcGVyYXRpb24gPSBmdW5jdGlvbiAobm9kZSwgYXBwbHlGaXNoRXllVmlld1RvRWFjaE5vZGUsIHNpbmdsZU5vdFNpbXBsZSwgYW5pbWF0ZSwgbGF5b3V0QnkpIHtcclxuICAgICAgaWYgKGFwcGx5RmlzaEV5ZVZpZXdUb0VhY2hOb2RlKSB7XHJcblxyXG4gICAgICAgIG5vZGUuZGF0YSgnd2lkdGgtYmVmb3JlLWZpc2hleWUnLCBub2RlLmRhdGEoJ3NpemUtYmVmb3JlLWNvbGxhcHNlJykudyk7XHJcbiAgICAgICAgbm9kZS5kYXRhKCdoZWlnaHQtYmVmb3JlLWZpc2hleWUnLCBub2RlLmRhdGEoJ3NpemUtYmVmb3JlLWNvbGxhcHNlJykuaCk7XHJcblxyXG4gICAgICAgIHNlbGYuZmlzaEV5ZVZpZXdFeHBhbmRHaXZlbk5vZGUobm9kZSwgc2luZ2xlTm90U2ltcGxlLCBub2RlLCBhbmltYXRlLCBsYXlvdXRCeSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICghc2luZ2xlTm90U2ltcGxlIHx8ICFhcHBseUZpc2hFeWVWaWV3VG9FYWNoTm9kZSB8fCAhYW5pbWF0ZSkge1xyXG4gICAgICAgIHNlbGYuZXhwYW5kTm9kZUJhc2VGdW5jdGlvbihub2RlLCBzaW5nbGVOb3RTaW1wbGUsIHNpbmdsZU5vdFNpbXBsZSwgbGF5b3V0QnkpOyAvLyoqKioqXHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgaWYgKG5vZGUuX3ByaXZhdGUuZGF0YS5jb2xsYXBzZWRDaGlsZHJlbiAhPSBudWxsKSB7XHJcbiAgICAgIHRoaXMuc3RvcmVXaWR0aEhlaWdodChub2RlKTtcclxuICAgICAgaWYgKGFwcGx5RmlzaEV5ZVZpZXdUb0VhY2hOb2RlICYmIHNpbmdsZU5vdFNpbXBsZSkge1xyXG4gICAgICAgIHZhciB0b3BMZWZ0UG9zaXRpb24gPSB0aGlzLmNvbnZlcnRUb01vZGVsUG9zaXRpb24oe3g6IDAsIHk6IDB9KTtcclxuICAgICAgICB2YXIgYm90dG9tUmlnaHRQb3NpdGlvbiA9IHRoaXMuY29udmVydFRvTW9kZWxQb3NpdGlvbih7eDogY3kud2lkdGgoKSwgeTogY3kuaGVpZ2h0KCl9KTtcclxuICAgICAgICB2YXIgcGFkZGluZyA9IDgwO1xyXG4gICAgICAgIHZhciBiYiA9IHtcclxuICAgICAgICAgIHgxOiB0b3BMZWZ0UG9zaXRpb24ueCxcclxuICAgICAgICAgIHgyOiBib3R0b21SaWdodFBvc2l0aW9uLngsXHJcbiAgICAgICAgICB5MTogdG9wTGVmdFBvc2l0aW9uLnksXHJcbiAgICAgICAgICB5MjogYm90dG9tUmlnaHRQb3NpdGlvbi55XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIG5vZGVCQiA9IHtcclxuICAgICAgICAgIHgxOiBub2RlLnBvc2l0aW9uKCd4JykgLSBub2RlLmRhdGEoJ3NpemUtYmVmb3JlLWNvbGxhcHNlJykudyAvIDIgLSBwYWRkaW5nLFxyXG4gICAgICAgICAgeDI6IG5vZGUucG9zaXRpb24oJ3gnKSArIG5vZGUuZGF0YSgnc2l6ZS1iZWZvcmUtY29sbGFwc2UnKS53IC8gMiArIHBhZGRpbmcsXHJcbiAgICAgICAgICB5MTogbm9kZS5wb3NpdGlvbigneScpIC0gbm9kZS5kYXRhKCdzaXplLWJlZm9yZS1jb2xsYXBzZScpLmggLyAyIC0gcGFkZGluZyxcclxuICAgICAgICAgIHkyOiBub2RlLnBvc2l0aW9uKCd5JykgKyBub2RlLmRhdGEoJ3NpemUtYmVmb3JlLWNvbGxhcHNlJykuaCAvIDIgKyBwYWRkaW5nXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHVuaW9uQkIgPSBib3VuZGluZ0JveFV0aWxpdGllcy5nZXRVbmlvbihub2RlQkIsIGJiKTtcclxuICAgICAgICB2YXIgYW5pbWF0aW5nID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICghYm91bmRpbmdCb3hVdGlsaXRpZXMuZXF1YWxCb3VuZGluZ0JveGVzKHVuaW9uQkIsIGJiKSkge1xyXG4gICAgICAgICAgdmFyIHZpZXdQb3J0ID0gY3kuZ2V0Rml0Vmlld3BvcnQodW5pb25CQiwgMTApO1xyXG4gICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgYW5pbWF0aW5nID0gYW5pbWF0ZTtcclxuICAgICAgICAgIGlmIChhbmltYXRlKSB7XHJcbiAgICAgICAgICAgIGN5LmFuaW1hdGUoe1xyXG4gICAgICAgICAgICAgIHBhbjogdmlld1BvcnQucGFuLFxyXG4gICAgICAgICAgICAgIHpvb206IHZpZXdQb3J0Lnpvb20sXHJcbiAgICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNvbW1vbkV4cGFuZE9wZXJhdGlvbihub2RlLCBhcHBseUZpc2hFeWVWaWV3VG9FYWNoTm9kZSwgc2luZ2xlTm90U2ltcGxlLCBhbmltYXRlLCBsYXlvdXRCeSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgZHVyYXRpb246IDEwMDBcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgY3kuem9vbSh2aWV3UG9ydC56b29tKTtcclxuICAgICAgICAgICAgY3kucGFuKHZpZXdQb3J0LnBhbik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghYW5pbWF0aW5nKSB7XHJcbiAgICAgICAgICBjb21tb25FeHBhbmRPcGVyYXRpb24obm9kZSwgYXBwbHlGaXNoRXllVmlld1RvRWFjaE5vZGUsIHNpbmdsZU5vdFNpbXBsZSwgYW5pbWF0ZSwgbGF5b3V0QnkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBjb21tb25FeHBhbmRPcGVyYXRpb24obm9kZSwgYXBwbHlGaXNoRXllVmlld1RvRWFjaE5vZGUsIHNpbmdsZU5vdFNpbXBsZSwgYW5pbWF0ZSwgbGF5b3V0QnkpO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICBpZiggIWFuaW1hdGUgKSB7XHJcbiAgICAgICAgY3kuZW5kQmF0Y2goKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy9yZXR1cm4gdGhlIG5vZGUgdG8gdW5kbyB0aGUgb3BlcmF0aW9uXHJcbiAgICAgIHJldHVybiBub2RlO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgLy9jb2xsYXBzZSB0aGUgZ2l2ZW4gbm9kZSB3aXRob3V0IG1ha2luZyBpbmNyZW1lbnRhbCBsYXlvdXRcclxuICBzaW1wbGVDb2xsYXBzZU5vZGU6IGZ1bmN0aW9uIChub2RlKSB7Ly8qLy9cclxuICAgIGlmIChub2RlLl9wcml2YXRlLmRhdGEuY29sbGFwc2VkQ2hpbGRyZW4gPT0gbnVsbCkge1xyXG4gICAgICBub2RlLmRhdGEoJ3Bvc2l0aW9uLWJlZm9yZS1jb2xsYXBzZScsIHtcclxuICAgICAgICB4OiBub2RlLnBvc2l0aW9uKCkueCxcclxuICAgICAgICB5OiBub2RlLnBvc2l0aW9uKCkueVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIG5vZGUuZGF0YSgnc2l6ZS1iZWZvcmUtY29sbGFwc2UnLCB7XHJcbiAgICAgICAgdzogbm9kZS5vdXRlcldpZHRoKCksXHJcbiAgICAgICAgaDogbm9kZS5vdXRlckhlaWdodCgpXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdmFyIGNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbigpO1xyXG5cclxuICAgICAgY2hpbGRyZW4udW5zZWxlY3QoKTtcclxuICAgICAgY2hpbGRyZW4uY29ubmVjdGVkRWRnZXMoKS51bnNlbGVjdCgpO1xyXG5cclxuICAgICAgbm9kZS50cmlnZ2VyKFwiYmVmb3JlQ29sbGFwc2VcIik7XHJcbiAgICAgIFxyXG4gICAgICB0aGlzLmJhcnJvd0VkZ2VzT2Zjb2xsYXBzZWRDaGlsZHJlbihub2RlKTtcclxuICAgICAgdGhpcy5yZW1vdmVDaGlsZHJlbihub2RlLCBub2RlKTtcclxuICAgICAgbm9kZS5hZGRDbGFzcygnY3ktZXhwYW5kLWNvbGxhcHNlLWNvbGxhcHNlZC1ub2RlJyk7XHJcblxyXG4gICAgICBub2RlLnRyaWdnZXIoXCJhZnRlckNvbGxhcHNlXCIpO1xyXG4gICAgICBcclxuICAgICAgbm9kZS5wb3NpdGlvbihub2RlLmRhdGEoJ3Bvc2l0aW9uLWJlZm9yZS1jb2xsYXBzZScpKTtcclxuXHJcbiAgICAgIC8vcmV0dXJuIHRoZSBub2RlIHRvIHVuZG8gdGhlIG9wZXJhdGlvblxyXG4gICAgICByZXR1cm4gbm9kZTtcclxuICAgIH1cclxuICB9LFxyXG4gIHN0b3JlV2lkdGhIZWlnaHQ6IGZ1bmN0aW9uIChub2RlKSB7Ly8qLy9cclxuICAgIGlmIChub2RlICE9IG51bGwpIHtcclxuICAgICAgbm9kZS5kYXRhKCd4LWJlZm9yZS1maXNoZXllJywgdGhpcy54UG9zaXRpb25JblBhcmVudChub2RlKSk7XHJcbiAgICAgIG5vZGUuZGF0YSgneS1iZWZvcmUtZmlzaGV5ZScsIHRoaXMueVBvc2l0aW9uSW5QYXJlbnQobm9kZSkpO1xyXG4gICAgICBub2RlLmRhdGEoJ3dpZHRoLWJlZm9yZS1maXNoZXllJywgbm9kZS5vdXRlcldpZHRoKCkpO1xyXG4gICAgICBub2RlLmRhdGEoJ2hlaWdodC1iZWZvcmUtZmlzaGV5ZScsIG5vZGUub3V0ZXJIZWlnaHQoKSk7XHJcblxyXG4gICAgICBpZiAobm9kZS5wYXJlbnQoKVswXSAhPSBudWxsKSB7XHJcbiAgICAgICAgdGhpcy5zdG9yZVdpZHRoSGVpZ2h0KG5vZGUucGFyZW50KClbMF0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcbiAgZmlzaEV5ZVZpZXdFeHBhbmRHaXZlbk5vZGU6IGZ1bmN0aW9uIChub2RlLCBzaW5nbGVOb3RTaW1wbGUsIG5vZGVUb0V4cGFuZCwgYW5pbWF0ZSwgbGF5b3V0QnkpIHsvLyovL1xyXG4gICAgdmFyIHNpYmxpbmdzID0gdGhpcy5nZXRTaWJsaW5ncyhub2RlKTtcclxuXHJcbiAgICB2YXIgeF9hID0gdGhpcy54UG9zaXRpb25JblBhcmVudChub2RlKTtcclxuICAgIHZhciB5X2EgPSB0aGlzLnlQb3NpdGlvbkluUGFyZW50KG5vZGUpO1xyXG5cclxuICAgIHZhciBkX3hfbGVmdCA9IE1hdGguYWJzKChub2RlLmRhdGEoJ3dpZHRoLWJlZm9yZS1maXNoZXllJykgLSBub2RlLm91dGVyV2lkdGgoKSkgLyAyKTtcclxuICAgIHZhciBkX3hfcmlnaHQgPSBNYXRoLmFicygobm9kZS5kYXRhKCd3aWR0aC1iZWZvcmUtZmlzaGV5ZScpIC0gbm9kZS5vdXRlcldpZHRoKCkpIC8gMik7XHJcbiAgICB2YXIgZF95X3VwcGVyID0gTWF0aC5hYnMoKG5vZGUuZGF0YSgnaGVpZ2h0LWJlZm9yZS1maXNoZXllJykgLSBub2RlLm91dGVySGVpZ2h0KCkpIC8gMik7XHJcbiAgICB2YXIgZF95X2xvd2VyID0gTWF0aC5hYnMoKG5vZGUuZGF0YSgnaGVpZ2h0LWJlZm9yZS1maXNoZXllJykgLSBub2RlLm91dGVySGVpZ2h0KCkpIC8gMik7XHJcblxyXG4gICAgdmFyIGFic19kaWZmX29uX3ggPSBNYXRoLmFicyhub2RlLmRhdGEoJ3gtYmVmb3JlLWZpc2hleWUnKSAtIHhfYSk7XHJcbiAgICB2YXIgYWJzX2RpZmZfb25feSA9IE1hdGguYWJzKG5vZGUuZGF0YSgneS1iZWZvcmUtZmlzaGV5ZScpIC0geV9hKTtcclxuXHJcbiAgICAvLyBDZW50ZXIgd2VudCB0byBMRUZUXHJcbiAgICBpZiAobm9kZS5kYXRhKCd4LWJlZm9yZS1maXNoZXllJykgPiB4X2EpIHtcclxuICAgICAgZF94X2xlZnQgPSBkX3hfbGVmdCArIGFic19kaWZmX29uX3g7XHJcbiAgICAgIGRfeF9yaWdodCA9IGRfeF9yaWdodCAtIGFic19kaWZmX29uX3g7XHJcbiAgICB9XHJcbiAgICAvLyBDZW50ZXIgd2VudCB0byBSSUdIVFxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGRfeF9sZWZ0ID0gZF94X2xlZnQgLSBhYnNfZGlmZl9vbl94O1xyXG4gICAgICBkX3hfcmlnaHQgPSBkX3hfcmlnaHQgKyBhYnNfZGlmZl9vbl94O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENlbnRlciB3ZW50IHRvIFVQXHJcbiAgICBpZiAobm9kZS5kYXRhKCd5LWJlZm9yZS1maXNoZXllJykgPiB5X2EpIHtcclxuICAgICAgZF95X3VwcGVyID0gZF95X3VwcGVyICsgYWJzX2RpZmZfb25feTtcclxuICAgICAgZF95X2xvd2VyID0gZF95X2xvd2VyIC0gYWJzX2RpZmZfb25feTtcclxuICAgIH1cclxuICAgIC8vIENlbnRlciB3ZW50IHRvIERPV05cclxuICAgIGVsc2Uge1xyXG4gICAgICBkX3lfdXBwZXIgPSBkX3lfdXBwZXIgLSBhYnNfZGlmZl9vbl95O1xyXG4gICAgICBkX3lfbG93ZXIgPSBkX3lfbG93ZXIgKyBhYnNfZGlmZl9vbl95O1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB4UG9zSW5QYXJlbnRTaWJsaW5nID0gW107XHJcbiAgICB2YXIgeVBvc0luUGFyZW50U2libGluZyA9IFtdO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2libGluZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgeFBvc0luUGFyZW50U2libGluZy5wdXNoKHRoaXMueFBvc2l0aW9uSW5QYXJlbnQoc2libGluZ3NbaV0pKTtcclxuICAgICAgeVBvc0luUGFyZW50U2libGluZy5wdXNoKHRoaXMueVBvc2l0aW9uSW5QYXJlbnQoc2libGluZ3NbaV0pKTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNpYmxpbmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHZhciBzaWJsaW5nID0gc2libGluZ3NbaV07XHJcblxyXG4gICAgICB2YXIgeF9iID0geFBvc0luUGFyZW50U2libGluZ1tpXTtcclxuICAgICAgdmFyIHlfYiA9IHlQb3NJblBhcmVudFNpYmxpbmdbaV07XHJcblxyXG4gICAgICB2YXIgc2xvcGUgPSAoeV9iIC0geV9hKSAvICh4X2IgLSB4X2EpO1xyXG5cclxuICAgICAgdmFyIGRfeCA9IDA7XHJcbiAgICAgIHZhciBkX3kgPSAwO1xyXG4gICAgICB2YXIgVF94ID0gMDtcclxuICAgICAgdmFyIFRfeSA9IDA7XHJcblxyXG4gICAgICAvLyBDdXJyZW50IHNpYmxpbmcgaXMgb24gdGhlIExFRlRcclxuICAgICAgaWYgKHhfYSA+IHhfYikge1xyXG4gICAgICAgIGRfeCA9IGRfeF9sZWZ0O1xyXG4gICAgICB9XHJcbiAgICAgIC8vIEN1cnJlbnQgc2libGluZyBpcyBvbiB0aGUgUklHSFRcclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgZF94ID0gZF94X3JpZ2h0O1xyXG4gICAgICB9XHJcbiAgICAgIC8vIEN1cnJlbnQgc2libGluZyBpcyBvbiB0aGUgVVBQRVIgc2lkZVxyXG4gICAgICBpZiAoeV9hID4geV9iKSB7XHJcbiAgICAgICAgZF95ID0gZF95X3VwcGVyO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIEN1cnJlbnQgc2libGluZyBpcyBvbiB0aGUgTE9XRVIgc2lkZVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBkX3kgPSBkX3lfbG93ZXI7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChpc0Zpbml0ZShzbG9wZSkpIHtcclxuICAgICAgICBUX3ggPSBNYXRoLm1pbihkX3gsIChkX3kgLyBNYXRoLmFicyhzbG9wZSkpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHNsb3BlICE9PSAwKSB7XHJcbiAgICAgICAgVF95ID0gTWF0aC5taW4oZF95LCAoZF94ICogTWF0aC5hYnMoc2xvcGUpKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh4X2EgPiB4X2IpIHtcclxuICAgICAgICBUX3ggPSAtMSAqIFRfeDtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHlfYSA+IHlfYikge1xyXG4gICAgICAgIFRfeSA9IC0xICogVF95O1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmZpc2hFeWVWaWV3TW92ZU5vZGUoc2libGluZywgVF94LCBUX3ksIG5vZGVUb0V4cGFuZCwgc2luZ2xlTm90U2ltcGxlLCBhbmltYXRlLCBsYXlvdXRCeSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHNpYmxpbmdzLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgIHRoaXMuZXhwYW5kTm9kZUJhc2VGdW5jdGlvbihub2RlVG9FeHBhbmQsIHNpbmdsZU5vdFNpbXBsZSwgdHJ1ZSwgbGF5b3V0QnkpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChub2RlLnBhcmVudCgpWzBdICE9IG51bGwpIHtcclxuICAgICAgdGhpcy5maXNoRXllVmlld0V4cGFuZEdpdmVuTm9kZShub2RlLnBhcmVudCgpWzBdLCBzaW5nbGVOb3RTaW1wbGUsIG5vZGVUb0V4cGFuZCwgYW5pbWF0ZSwgbGF5b3V0QnkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBub2RlO1xyXG4gIH0sXHJcbiAgZ2V0U2libGluZ3M6IGZ1bmN0aW9uIChub2RlKSB7Ly8qLy9cclxuICAgIHZhciBzaWJsaW5ncztcclxuXHJcbiAgICBpZiAobm9kZS5wYXJlbnQoKVswXSA9PSBudWxsKSB7XHJcbiAgICAgIHNpYmxpbmdzID0gY3kuY29sbGVjdGlvbigpO1xyXG4gICAgICB2YXIgb3JwaGFucyA9IGN5Lm5vZGVzKCkub3JwaGFucygpO1xyXG5cclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcnBoYW5zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKG9ycGhhbnNbaV0gIT0gbm9kZSkge1xyXG4gICAgICAgICAgc2libGluZ3MgPSBzaWJsaW5ncy5hZGQob3JwaGFuc1tpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzaWJsaW5ncyA9IG5vZGUuc2libGluZ3MoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc2libGluZ3M7XHJcbiAgfSxcclxuICAvKlxyXG4gICAqIE1vdmUgbm9kZSBvcGVyYXRpb24gc3BlY2lhbGl6ZWQgZm9yIGZpc2ggZXllIHZpZXcgZXhwYW5kIG9wZXJhdGlvblxyXG4gICAqIE1vdmVzIHRoZSBub2RlIGJ5IG1vdmluZyBpdHMgZGVzY2FuZGVudHMuIE1vdmVtZW50IGlzIGFuaW1hdGVkIGlmIHNpbmdsZU5vdFNpbXBsZSBmbGFnIGlzIHRydXRoeS5cclxuICAgKi9cclxuICBmaXNoRXllVmlld01vdmVOb2RlOiBmdW5jdGlvbiAobm9kZSwgVF94LCBUX3ksIG5vZGVUb0V4cGFuZCwgc2luZ2xlTm90U2ltcGxlLCBhbmltYXRlLCBsYXlvdXRCeSkgey8vKi8vXHJcbiAgICB2YXIgY2hpbGRyZW5MaXN0ID0gbm9kZS5jaGlsZHJlbigpO1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGlmIChjaGlsZHJlbkxpc3QubGVuZ3RoID09IDApIHtcclxuICAgICAgdmFyIG5ld1Bvc2l0aW9uID0ge3g6IG5vZGUucG9zaXRpb24oJ3gnKSArIFRfeCwgeTogbm9kZS5wb3NpdGlvbigneScpICsgVF95fTtcclxuICAgICAgaWYgKCFzaW5nbGVOb3RTaW1wbGUgfHwgIWFuaW1hdGUpIHtcclxuICAgICAgICBub2RlLnBvc2l0aW9uKG5ld1Bvc2l0aW9uKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB0aGlzLmFuaW1hdGVkbHlNb3ZpbmdOb2RlQ291bnQrKztcclxuICAgICAgICBub2RlLmFuaW1hdGUoe1xyXG4gICAgICAgICAgcG9zaXRpb246IG5ld1Bvc2l0aW9uLFxyXG4gICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgc2VsZi5hbmltYXRlZGx5TW92aW5nTm9kZUNvdW50LS07XHJcbiAgICAgICAgICAgIGlmIChzZWxmLmFuaW1hdGVkbHlNb3ZpbmdOb2RlQ291bnQgPiAwIHx8ICFub2RlVG9FeHBhbmQuaGFzQ2xhc3MoJ2N5LWV4cGFuZC1jb2xsYXBzZS1jb2xsYXBzZWQtbm9kZScpKSB7XHJcblxyXG4gICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2VsZi5leHBhbmROb2RlQmFzZUZ1bmN0aW9uKG5vZGVUb0V4cGFuZCwgc2luZ2xlTm90U2ltcGxlLCB0cnVlLCBsYXlvdXRCeSk7XHJcblxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgIGR1cmF0aW9uOiAxMDAwXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG5cclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbkxpc3QubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB0aGlzLmZpc2hFeWVWaWV3TW92ZU5vZGUoY2hpbGRyZW5MaXN0W2ldLCBUX3gsIFRfeSwgbm9kZVRvRXhwYW5kLCBzaW5nbGVOb3RTaW1wbGUsIGFuaW1hdGUsIGxheW91dEJ5KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgeFBvc2l0aW9uSW5QYXJlbnQ6IGZ1bmN0aW9uIChub2RlKSB7Ly8qLy9cclxuICAgIHZhciBwYXJlbnQgPSBub2RlLnBhcmVudCgpWzBdO1xyXG4gICAgdmFyIHhfYSA9IDAuMDtcclxuXHJcbiAgICAvLyBHaXZlbiBub2RlIGlzIG5vdCBhIGRpcmVjdCBjaGlsZCBvZiB0aGUgdGhlIHJvb3QgZ3JhcGhcclxuICAgIGlmIChwYXJlbnQgIT0gbnVsbCkge1xyXG4gICAgICB4X2EgPSBub2RlLnJlbGF0aXZlUG9zaXRpb24oJ3gnKSArIChwYXJlbnQud2lkdGgoKSAvIDIpO1xyXG4gICAgfVxyXG4gICAgLy8gR2l2ZW4gbm9kZSBpcyBhIGRpcmVjdCBjaGlsZCBvZiB0aGUgdGhlIHJvb3QgZ3JhcGhcclxuXHJcbiAgICBlbHNlIHtcclxuICAgICAgeF9hID0gbm9kZS5wb3NpdGlvbigneCcpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB4X2E7XHJcbiAgfSxcclxuICB5UG9zaXRpb25JblBhcmVudDogZnVuY3Rpb24gKG5vZGUpIHsvLyovL1xyXG4gICAgdmFyIHBhcmVudCA9IG5vZGUucGFyZW50KClbMF07XHJcblxyXG4gICAgdmFyIHlfYSA9IDAuMDtcclxuXHJcbiAgICAvLyBHaXZlbiBub2RlIGlzIG5vdCBhIGRpcmVjdCBjaGlsZCBvZiB0aGUgdGhlIHJvb3QgZ3JhcGhcclxuICAgIGlmIChwYXJlbnQgIT0gbnVsbCkge1xyXG4gICAgICB5X2EgPSBub2RlLnJlbGF0aXZlUG9zaXRpb24oJ3knKSArIChwYXJlbnQuaGVpZ2h0KCkgLyAyKTtcclxuICAgIH1cclxuICAgIC8vIEdpdmVuIG5vZGUgaXMgYSBkaXJlY3QgY2hpbGQgb2YgdGhlIHRoZSByb290IGdyYXBoXHJcblxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHlfYSA9IG5vZGUucG9zaXRpb24oJ3knKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4geV9hO1xyXG4gIH0sXHJcbiAgLypcclxuICAgKiBmb3IgYWxsIGNoaWxkcmVuIG9mIHRoZSBub2RlIHBhcmFtZXRlciBjYWxsIHRoaXMgbWV0aG9kXHJcbiAgICogd2l0aCB0aGUgc2FtZSByb290IHBhcmFtZXRlcixcclxuICAgKiByZW1vdmUgdGhlIGNoaWxkIGFuZCBhZGQgdGhlIHJlbW92ZWQgY2hpbGQgdG8gdGhlIGNvbGxhcHNlZGNoaWxkcmVuIGRhdGFcclxuICAgKiBvZiB0aGUgcm9vdCB0byByZXN0b3JlIHRoZW0gaW4gdGhlIGNhc2Ugb2YgZXhwYW5kYXRpb25cclxuICAgKiByb290Ll9wcml2YXRlLmRhdGEuY29sbGFwc2VkQ2hpbGRyZW4ga2VlcHMgdGhlIG5vZGVzIHRvIHJlc3RvcmUgd2hlbiB0aGVcclxuICAgKiByb290IGlzIGV4cGFuZGVkXHJcbiAgICovXHJcbiAgcmVtb3ZlQ2hpbGRyZW46IGZ1bmN0aW9uIChub2RlLCByb290KSB7Ly8qLy9cclxuICAgIHZhciBjaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW4oKTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV07XHJcbiAgICAgIHRoaXMucmVtb3ZlQ2hpbGRyZW4oY2hpbGQsIHJvb3QpO1xyXG4gICAgICB2YXIgcmVtb3ZlZENoaWxkID0gY2hpbGQucmVtb3ZlKCk7XHJcbiAgICAgIGlmIChyb290Ll9wcml2YXRlLmRhdGEuY29sbGFwc2VkQ2hpbGRyZW4gPT0gbnVsbCkge1xyXG4gICAgICAgIHJvb3QuX3ByaXZhdGUuZGF0YS5jb2xsYXBzZWRDaGlsZHJlbiA9IHJlbW92ZWRDaGlsZDtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByb290Ll9wcml2YXRlLmRhdGEuY29sbGFwc2VkQ2hpbGRyZW4gPSByb290Ll9wcml2YXRlLmRhdGEuY29sbGFwc2VkQ2hpbGRyZW4udW5pb24ocmVtb3ZlZENoaWxkKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgaXNNZXRhRWRnZTogZnVuY3Rpb24oZWRnZSkge1xyXG4gICAgcmV0dXJuIGVkZ2UuaGFzQ2xhc3MoXCJjeS1leHBhbmQtY29sbGFwc2UtbWV0YS1lZGdlXCIpO1xyXG4gIH0sXHJcbiAgYmFycm93RWRnZXNPZmNvbGxhcHNlZENoaWxkcmVuOiBmdW5jdGlvbihub2RlKSB7XHJcbiAgICB2YXIgcmVsYXRlZE5vZGVzID0gbm9kZS5kZXNjZW5kYW50cygpO1xyXG4gICAgdmFyIGVkZ2VzID0gcmVsYXRlZE5vZGVzLmVkZ2VzV2l0aChjeS5ub2RlcygpLm5vdChyZWxhdGVkTm9kZXMudW5pb24obm9kZSkpKTtcclxuICAgIFxyXG4gICAgdmFyIHJlbGF0ZWROb2RlTWFwID0ge307XHJcbiAgICBcclxuICAgIHJlbGF0ZWROb2Rlcy5lYWNoKGZ1bmN0aW9uKGksIGVsZSkge1xyXG4gICAgICByZWxhdGVkTm9kZU1hcFtlbGUuaWQoKV0gPSB0cnVlO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWRnZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdmFyIGVkZ2UgPSBlZGdlc1tpXTtcclxuICAgICAgdmFyIHNvdXJjZSA9IGVkZ2Uuc291cmNlKCk7XHJcbiAgICAgIHZhciB0YXJnZXQgPSBlZGdlLnRhcmdldCgpO1xyXG4gICAgICBcclxuICAgICAgaWYgKCF0aGlzLmlzTWV0YUVkZ2UoZWRnZSkpIHsgLy8gaXMgb3JpZ2luYWxcclxuICAgICAgICB2YXIgb3JpZ2luYWxFbmRzRGF0YSA9IHtcclxuICAgICAgICAgIHNvdXJjZTogc291cmNlLFxyXG4gICAgICAgICAgdGFyZ2V0OiB0YXJnZXRcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGVkZ2UuYWRkQ2xhc3MoXCJjeS1leHBhbmQtY29sbGFwc2UtbWV0YS1lZGdlXCIpO1xyXG4gICAgICAgIGVkZ2UuZGF0YSgnb3JpZ2luYWxFbmRzJywgb3JpZ2luYWxFbmRzRGF0YSk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGVkZ2UubW92ZSh7XHJcbiAgICAgICAgdGFyZ2V0OiAhcmVsYXRlZE5vZGVNYXBbdGFyZ2V0LmlkKCldID8gdGFyZ2V0LmlkKCkgOiBub2RlLmlkKCksXHJcbiAgICAgICAgc291cmNlOiAhcmVsYXRlZE5vZGVNYXBbc291cmNlLmlkKCldID8gc291cmNlLmlkKCkgOiBub2RlLmlkKClcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSxcclxuICBmaW5kTmV3RW5kOiBmdW5jdGlvbihub2RlKSB7XHJcbiAgICB2YXIgY3VycmVudCA9IG5vZGU7XHJcbiAgICBcclxuICAgIHdoaWxlKCAhY3VycmVudC5pbnNpZGUoKSApIHtcclxuICAgICAgY3VycmVudCA9IGN1cnJlbnQucGFyZW50KCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiBjdXJyZW50O1xyXG4gIH0sXHJcbiAgcmVwYWlyRWRnZXM6IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIHZhciBjb25uZWN0ZWRNZXRhRWRnZXMgPSBub2RlLmNvbm5lY3RlZEVkZ2VzKCcuY3ktZXhwYW5kLWNvbGxhcHNlLW1ldGEtZWRnZScpO1xyXG4gICAgXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbm5lY3RlZE1ldGFFZGdlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICB2YXIgZWRnZSA9IGNvbm5lY3RlZE1ldGFFZGdlc1tpXTtcclxuICAgICAgdmFyIG9yaWdpbmFsRW5kcyA9IGVkZ2UuZGF0YSgnb3JpZ2luYWxFbmRzJyk7XHJcbiAgICAgIHZhciBjdXJyZW50U3JjSWQgPSBlZGdlLmRhdGEoJ3NvdXJjZScpO1xyXG4gICAgICB2YXIgY3VycmVudFRndElkID0gZWRnZS5kYXRhKCd0YXJnZXQnKTtcclxuICAgICAgXHJcbiAgICAgIGlmICggY3VycmVudFNyY0lkID09PSBub2RlLmlkKCkgKSB7XHJcbiAgICAgICAgZWRnZSA9IGVkZ2UubW92ZSh7XHJcbiAgICAgICAgICBzb3VyY2U6IHRoaXMuZmluZE5ld0VuZChvcmlnaW5hbEVuZHMuc291cmNlKS5pZCgpXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZWRnZSA9IGVkZ2UubW92ZSh7XHJcbiAgICAgICAgICB0YXJnZXQ6IHRoaXMuZmluZE5ld0VuZChvcmlnaW5hbEVuZHMudGFyZ2V0KS5pZCgpXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGlmICggZWRnZS5kYXRhKCdzb3VyY2UnKSA9PT0gb3JpZ2luYWxFbmRzLnNvdXJjZS5pZCgpICYmIGVkZ2UuZGF0YSgndGFyZ2V0JykgPT09IG9yaWdpbmFsRW5kcy50YXJnZXQuaWQoKSApIHtcclxuICAgICAgICBlZGdlLnJlbW92ZUNsYXNzKCdjeS1leHBhbmQtY29sbGFwc2UtbWV0YS1lZGdlJyk7XHJcbiAgICAgICAgZWRnZS5yZW1vdmVEYXRhKCdvcmlnaW5hbEVuZHMnKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgLypub2RlIGlzIGFuIG91dGVyIG5vZGUgb2Ygcm9vdFxyXG4gICBpZiByb290IGlzIG5vdCBpdCdzIGFuY2hlc3RvclxyXG4gICBhbmQgaXQgaXMgbm90IHRoZSByb290IGl0c2VsZiovXHJcbiAgaXNPdXRlck5vZGU6IGZ1bmN0aW9uIChub2RlLCByb290KSB7Ly8qLy9cclxuICAgIHZhciB0ZW1wID0gbm9kZTtcclxuICAgIHdoaWxlICh0ZW1wICE9IG51bGwpIHtcclxuICAgICAgaWYgKHRlbXAgPT0gcm9vdCkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICB0ZW1wID0gdGVtcC5wYXJlbnQoKVswXTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxufVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBleHBhbmRDb2xsYXBzZVV0aWxpdGllcztcclxuIiwiO1xyXG4oZnVuY3Rpb24gKCkge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgLy8gcmVnaXN0ZXJzIHRoZSBleHRlbnNpb24gb24gYSBjeXRvc2NhcGUgbGliIHJlZlxyXG4gIHZhciByZWdpc3RlciA9IGZ1bmN0aW9uIChjeXRvc2NhcGUsICQpIHtcclxuXHJcbiAgICBpZiAoIWN5dG9zY2FwZSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9IC8vIGNhbid0IHJlZ2lzdGVyIGlmIGN5dG9zY2FwZSB1bnNwZWNpZmllZFxyXG5cclxuICAgIHZhciBleHBhbmRDb2xsYXBzZVV0aWxpdGllcyA9IHJlcXVpcmUoJy4vZXhwYW5kQ29sbGFwc2VVdGlsaXRpZXMnKTtcclxuICAgIHZhciB1bmRvUmVkb1V0aWxpdGllcyA9IHJlcXVpcmUoJy4vdW5kb1JlZG9VdGlsaXRpZXMnKTtcclxuICAgIHZhciBlbGVtZW50VXRpbGl0aWVzID0gcmVxdWlyZSgnLi9lbGVtZW50VXRpbGl0aWVzJyk7XHJcbiAgICB2YXIgY3VlVXRpbGl0aWVzID0gcmVxdWlyZShcIi4vY3VlVXRpbGl0aWVzXCIpO1xyXG5cclxuICAgIHZhciBvcHRpb25zID0ge1xyXG4gICAgICBsYXlvdXRCeTogbnVsbCwgLy8gZm9yIHJlYXJyYW5nZSBhZnRlciBleHBhbmQvY29sbGFwc2UuIEl0J3MganVzdCBsYXlvdXQgb3B0aW9ucyBvciB3aG9sZSBsYXlvdXQgZnVuY3Rpb24uIENob29zZSB5b3VyIHNpZGUhXHJcbiAgICAgIGZpc2hleWU6IHRydWUsIC8vIHdoZXRoZXIgdG8gcGVyZm9ybSBmaXNoZXllIHZpZXcgYWZ0ZXIgZXhwYW5kL2NvbGxhcHNlIHlvdSBjYW4gc3BlY2lmeSBhIGZ1bmN0aW9uIHRvb1xyXG4gICAgICBhbmltYXRlOiB0cnVlLCAvLyB3aGV0aGVyIHRvIGFuaW1hdGUgb24gZHJhd2luZyBjaGFuZ2VzIHlvdSBjYW4gc3BlY2lmeSBhIGZ1bmN0aW9uIHRvb1xyXG4gICAgICByZWFkeTogZnVuY3Rpb24gKCkgeyB9LCAvLyBjYWxsYmFjayB3aGVuIGV4cGFuZC9jb2xsYXBzZSBpbml0aWFsaXplZFxyXG4gICAgICB1bmRvYWJsZTogdHJ1ZSwgLy8gYW5kIGlmIHVuZG9SZWRvRXh0ZW5zaW9uIGV4aXN0cyxcclxuXHJcbiAgICAgIGN1ZUVuYWJsZWQ6IHRydWUsIC8vIFdoZXRoZXIgY3VlcyBhcmUgZW5hYmxlZFxyXG4gICAgICBleHBhbmRDb2xsYXBzZUN1ZVBvc2l0aW9uOiAndG9wLWxlZnQnLCAvLyBkZWZhdWx0IGN1ZSBwb3NpdGlvbiBpcyB0b3AgbGVmdCB5b3UgY2FuIHNwZWNpZnkgYSBmdW5jdGlvbiBwZXIgbm9kZSB0b29cclxuICAgICAgZXhwYW5kQ29sbGFwc2VDdWVTaXplOiAxMiwgLy8gc2l6ZSBvZiBleHBhbmQtY29sbGFwc2UgY3VlXHJcbiAgICAgIGV4cGFuZENvbGxhcHNlQ3VlTGluZVNpemU6IDgsIC8vIHNpemUgb2YgbGluZXMgdXNlZCBmb3IgZHJhd2luZyBwbHVzLW1pbnVzIGljb25zXHJcbiAgICAgIGV4cGFuZEN1ZUltYWdlOiB1bmRlZmluZWQsIC8vIGltYWdlIG9mIGV4cGFuZCBpY29uIGlmIHVuZGVmaW5lZCBkcmF3IHJlZ3VsYXIgZXhwYW5kIGN1ZVxyXG4gICAgICBjb2xsYXBzZUN1ZUltYWdlOiB1bmRlZmluZWQsIC8vIGltYWdlIG9mIGNvbGxhcHNlIGljb24gaWYgdW5kZWZpbmVkIGRyYXcgcmVndWxhciBjb2xsYXBzZSBjdWVcclxuICAgICAgZXhwYW5kQ29sbGFwc2VDdWVTZW5zaXRpdml0eTogMSAvLyBzZW5zaXRpdml0eSBvZiBleHBhbmQtY29sbGFwc2UgY3Vlc1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBzZXRPcHRpb25zKGZyb20pIHtcclxuICAgICAgdmFyIHRlbXBPcHRzID0ge307XHJcbiAgICAgIGZvciAodmFyIGtleSBpbiBvcHRpb25zKVxyXG4gICAgICAgIHRlbXBPcHRzW2tleV0gPSBvcHRpb25zW2tleV07XHJcblxyXG4gICAgICBmb3IgKHZhciBrZXkgaW4gZnJvbSlcclxuICAgICAgICBpZiAodGVtcE9wdHMuaGFzT3duUHJvcGVydHkoa2V5KSlcclxuICAgICAgICAgIHRlbXBPcHRzW2tleV0gPSBmcm9tW2tleV07XHJcbiAgICAgIHJldHVybiB0ZW1wT3B0cztcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gZXZhbHVhdGUgc29tZSBzcGVjaWZpYyBvcHRpb25zIGluIGNhc2Ugb2YgdGhleSBhcmUgc3BlY2lmaWVkIGFzIGZ1bmN0aW9ucyB0byBiZSBkeW5hbWljYWxseSBjaGFuZ2VkXHJcbiAgICBmdW5jdGlvbiBldmFsT3B0aW9ucyhvcHRpb25zKSB7XHJcbiAgICAgIHZhciBhbmltYXRlID0gdHlwZW9mIG9wdGlvbnMuYW5pbWF0ZSA9PT0gJ2Z1bmN0aW9uJyA/IG9wdGlvbnMuYW5pbWF0ZS5jYWxsKCkgOiBvcHRpb25zLmFuaW1hdGU7XHJcbiAgICAgIHZhciBmaXNoZXllID0gdHlwZW9mIG9wdGlvbnMuZmlzaGV5ZSA9PT0gJ2Z1bmN0aW9uJyA/IG9wdGlvbnMuZmlzaGV5ZS5jYWxsKCkgOiBvcHRpb25zLmZpc2hleWU7XHJcbiAgICAgIFxyXG4gICAgICBvcHRpb25zLmFuaW1hdGUgPSBhbmltYXRlO1xyXG4gICAgICBvcHRpb25zLmZpc2hleWUgPSBmaXNoZXllO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLyBjeS5leHBhbmRDb2xsYXBzZSgpXHJcbiAgICBjeXRvc2NhcGUoXCJjb3JlXCIsIFwiZXhwYW5kQ29sbGFwc2VcIiwgZnVuY3Rpb24gKG9wdHMpIHtcclxuICAgICAgdmFyIGN5ID0gdGhpcztcclxuICAgICAgb3B0aW9ucyA9IHNldE9wdGlvbnMob3B0cyk7XHJcblxyXG4gICAgICB1bmRvUmVkb1V0aWxpdGllcyhjeSk7XHJcbiAgICAgIFxyXG4gICAgICBpZihvcHRpb25zLmN1ZUVuYWJsZWQpXHJcbiAgICAgICAgY3VlVXRpbGl0aWVzKG9wdGlvbnMsIGN5KTtcclxuICAgICAgZWxzZVxyXG4gICAgICAgIGN1ZVV0aWxpdGllcyhcInVuYmluZFwiKTtcclxuXHJcblxyXG4gICAgICBvcHRpb25zLnJlYWR5KCk7XHJcblxyXG5cclxuICAgICAgcmV0dXJuIGN5O1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIHNldCBmdW5jdGlvbnNcclxuICAgIFxyXG4gICAgLy8gc2V0IGFsbCBvcHRpb25zIGF0IG9uY2VcclxuICAgIGN5dG9zY2FwZShcImNvcmVcIiwgXCJzZXRFeHBhbmRDb2xsYXBzZU9wdGlvbnNcIiwgZnVuY3Rpb24gKG9wdHMpIHtcclxuICAgICAgb3B0aW9ucyA9IG9wdHM7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gc2V0IHRoZSBvcHRpb24gd2hvc2UgbmFtZSBpcyBnaXZlblxyXG4gICAgY3l0b3NjYXBlKFwiY29yZVwiLCBcInNldEV4cGFuZENvbGxhcHNlT3B0aW9uXCIsIGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xyXG4gICAgICBvcHRpb25zW25hbWVdID0gdmFsdWU7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBDb2xsZWN0aW9uIGZ1bmN0aW9uc1xyXG5cclxuICAgIC8vIGVsZXMuY29sbGFwc2Uob3B0aW9ucylcclxuICAgIGN5dG9zY2FwZSgnY29sbGVjdGlvbicsICdjb2xsYXBzZScsIGZ1bmN0aW9uIChvcHRzKSB7XHJcbiAgICAgIHZhciBlbGVzID0gdGhpcy5jb2xsYXBzaWJsZU5vZGVzKCk7XHJcbiAgICAgIHZhciB0ZW1wT3B0aW9ucyA9IHNldE9wdGlvbnMob3B0cyk7XHJcbiAgICAgIGV2YWxPcHRpb25zKHRlbXBPcHRpb25zKTtcclxuXHJcbiAgICAgIHJldHVybiBleHBhbmRDb2xsYXBzZVV0aWxpdGllcyh0aGlzLmN5KCkpLmNvbGxhcHNlR2l2ZW5Ob2RlcyhlbGVzLCB0ZW1wT3B0aW9ucyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBlbGVzLmNvbGxhcHNlQWxsKG9wdGlvbnMpXHJcbiAgICBjeXRvc2NhcGUoJ2NvbGxlY3Rpb24nLCAnY29sbGFwc2VSZWN1cnNpdmVseScsIGZ1bmN0aW9uIChvcHRzKSB7XHJcbiAgICAgIHZhciBlbGVzID0gdGhpcy5jb2xsYXBzaWJsZU5vZGVzKCk7XHJcbiAgICAgIHZhciB0ZW1wT3B0aW9ucyA9IHNldE9wdGlvbnMob3B0cyk7XHJcbiAgICAgIGV2YWxPcHRpb25zKHRlbXBPcHRpb25zKTtcclxuXHJcbiAgICAgIHJldHVybiBlbGVzLnVuaW9uKGVsZXMuZGVzY2VuZGFudHMoKSkuY29sbGFwc2UodGVtcE9wdGlvbnMpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gZWxlcy5leHBhbmQob3B0aW9ucylcclxuICAgIGN5dG9zY2FwZSgnY29sbGVjdGlvbicsICdleHBhbmQnLCBmdW5jdGlvbiAob3B0cykge1xyXG4gICAgICB2YXIgZWxlcyA9IHRoaXMuZXhwYW5kYWJsZU5vZGVzKCk7XHJcbiAgICAgIHZhciB0ZW1wT3B0aW9ucyA9IHNldE9wdGlvbnMob3B0cyk7XHJcbiAgICAgIGV2YWxPcHRpb25zKHRlbXBPcHRpb25zKTtcclxuXHJcbiAgICAgIHJldHVybiBleHBhbmRDb2xsYXBzZVV0aWxpdGllcyh0aGlzLmN5KCkpLmV4cGFuZEdpdmVuTm9kZXMoZWxlcywgdGVtcE9wdGlvbnMpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gZWxlcy5leHBhbmRBbGwob3B0aW9ucylcclxuICAgIGN5dG9zY2FwZSgnY29sbGVjdGlvbicsICdleHBhbmRSZWN1cnNpdmVseScsIGZ1bmN0aW9uIChvcHRzKSB7XHJcbiAgICAgIHZhciBlbGVzID0gdGhpcy5leHBhbmRhYmxlTm9kZXMoKTtcclxuICAgICAgdmFyIHRlbXBPcHRpb25zID0gc2V0T3B0aW9ucyhvcHRzKTtcclxuICAgICAgZXZhbE9wdGlvbnModGVtcE9wdGlvbnMpO1xyXG5cclxuICAgICAgcmV0dXJuIGV4cGFuZENvbGxhcHNlVXRpbGl0aWVzKHRoaXMuY3koKSkuZXhwYW5kQWxsTm9kZXMoZWxlcywgdGVtcE9wdGlvbnMpO1xyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIC8vIENvcmUgZnVuY3Rpb25zXHJcblxyXG4gICAgLy8gY3kuY29sbGFwc2VBbGwob3B0aW9ucylcclxuICAgIGN5dG9zY2FwZSgnY29yZScsICdjb2xsYXBzZUFsbCcsIGZ1bmN0aW9uIChvcHRzKSB7XHJcbiAgICAgIHZhciBjeSA9IHRoaXM7XHJcbiAgICAgIHZhciB0ZW1wT3B0aW9ucyA9IHNldE9wdGlvbnMob3B0cyk7XHJcbiAgICAgIGV2YWxPcHRpb25zKHRlbXBPcHRpb25zKTtcclxuXHJcbiAgICAgIHJldHVybiBjeS5jb2xsYXBzaWJsZU5vZGVzKCkuY29sbGFwc2VSZWN1cnNpdmVseSh0ZW1wT3B0aW9ucyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBjeS5leHBhbmRBbGwob3B0aW9ucylcclxuICAgIGN5dG9zY2FwZSgnY29yZScsICdleHBhbmRBbGwnLCBmdW5jdGlvbiAob3B0cykge1xyXG4gICAgICB2YXIgY3kgPSB0aGlzO1xyXG4gICAgICB2YXIgdGVtcE9wdGlvbnMgPSBzZXRPcHRpb25zKG9wdHMpO1xyXG4gICAgICBldmFsT3B0aW9ucyh0ZW1wT3B0aW9ucyk7XHJcblxyXG4gICAgICByZXR1cm4gY3kuZXhwYW5kYWJsZU5vZGVzKCkuZXhwYW5kUmVjdXJzaXZlbHkodGVtcE9wdGlvbnMpO1xyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIC8vIFV0aWxpdHkgZnVuY3Rpb25zXHJcblxyXG4gICAgLy8gZWxlLmlzQ29sbGFwc2libGUoKVxyXG4gICAgY3l0b3NjYXBlKCdjb2xsZWN0aW9uJywgJ2lzRXhwYW5kYWJsZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIGVsZSA9IHRoaXM7XHJcbiAgICAgIFxyXG4gICAgICByZXR1cm4gZWxlLmhhc0NsYXNzKCdjeS1leHBhbmQtY29sbGFwc2UtY29sbGFwc2VkLW5vZGUnKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIGVsZS5pc0V4cGFuZGFibGUoKVxyXG4gICAgY3l0b3NjYXBlKCdjb2xsZWN0aW9uJywgJ2lzQ29sbGFwc2libGUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBlbGUgPSB0aGlzO1xyXG4gICAgICByZXR1cm4gIWVsZS5pc0V4cGFuZGFibGUoKSAmJiBlbGUuaXNQYXJlbnQoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIGVsZXMuY29sbGFwc2VkKClcclxuICAgIGN5dG9zY2FwZSgnY29sbGVjdGlvbicsICdjb2xsYXBzaWJsZU5vZGVzJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgZWxlcyA9IHRoaXM7XHJcblxyXG4gICAgICByZXR1cm4gZWxlcy5maWx0ZXIoZnVuY3Rpb24gKGksIGVsZSkge1xyXG4gICAgICAgIHJldHVybiBlbGUuaXNDb2xsYXBzaWJsZSgpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIGVsZXMuZXhwYW5kZWQoKVxyXG4gICAgY3l0b3NjYXBlKCdjb2xsZWN0aW9uJywgJ2V4cGFuZGFibGVOb2RlcycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIGVsZXMgPSB0aGlzO1xyXG5cclxuICAgICAgcmV0dXJuIGVsZXMuZmlsdGVyKGZ1bmN0aW9uIChpLCBlbGUpIHtcclxuICAgICAgICByZXR1cm4gZWxlLmlzRXhwYW5kYWJsZSgpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gICAgLy8gZWxlcy5jb2xsYXBzZWQoKVxyXG4gICAgY3l0b3NjYXBlKCdjb3JlJywgJ2NvbGxhcHNpYmxlTm9kZXMnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBjeSA9IHRoaXM7XHJcblxyXG4gICAgICByZXR1cm4gY3kubm9kZXMoKS5jb2xsYXBzaWJsZU5vZGVzKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBlbGVzLmV4cGFuZGVkKClcclxuICAgIGN5dG9zY2FwZSgnY29yZScsICdleHBhbmRhYmxlTm9kZXMnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBjeSA9IHRoaXM7XHJcblxyXG4gICAgICByZXR1cm4gY3kubm9kZXMoKS5leHBhbmRhYmxlTm9kZXMoKTtcclxuICAgIH0pO1xyXG4gIH07XHJcblxyXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgeyAvLyBleHBvc2UgYXMgYSBjb21tb25qcyBtb2R1bGVcclxuICAgIG1vZHVsZS5leHBvcnRzID0gcmVnaXN0ZXI7XHJcbiAgfVxyXG5cclxuICBpZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCkgeyAvLyBleHBvc2UgYXMgYW4gYW1kL3JlcXVpcmVqcyBtb2R1bGVcclxuICAgIGRlZmluZSgnY3l0b3NjYXBlLWV4cGFuZC1jb2xsYXBzZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIHJlZ2lzdGVyO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgY3l0b3NjYXBlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgalF1ZXJ5ICE9PSAndW5kZWZpbmVkJykgeyAvLyBleHBvc2UgdG8gZ2xvYmFsIGN5dG9zY2FwZSAoaS5lLiB3aW5kb3cuY3l0b3NjYXBlKVxyXG4gICAgICByZWdpc3RlcihjeXRvc2NhcGUsIGpRdWVyeSk7XHJcbiAgfVxyXG5cclxufSkoKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY3kpIHtcclxuICBpZiAoY3kudW5kb1JlZG8gPT0gbnVsbClcclxuICAgIHJldHVybjtcclxuXHJcbiAgdmFyIHVyID0gY3kudW5kb1JlZG8oe30sIHRydWUpO1xyXG5cclxuICBmdW5jdGlvbiBnZXRFbGVzKF9lbGVzKSB7XHJcbiAgICByZXR1cm4gKHR5cGVvZiBfZWxlcyA9PT0gXCJzdHJpbmdcIikgPyBjeS4kKF9lbGVzKSA6IF9lbGVzO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZ2V0Tm9kZVBvc2l0aW9uc0FuZFNpemVzKCkge1xyXG4gICAgdmFyIHBvc2l0aW9uc0FuZFNpemVzID0ge307XHJcbiAgICB2YXIgbm9kZXMgPSBjeS5ub2RlcygpO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdmFyIGVsZSA9IG5vZGVzW2ldO1xyXG4gICAgICBwb3NpdGlvbnNBbmRTaXplc1tlbGUuaWQoKV0gPSB7XHJcbiAgICAgICAgd2lkdGg6IGVsZS53aWR0aCgpLFxyXG4gICAgICAgIGhlaWdodDogZWxlLmhlaWdodCgpLFxyXG4gICAgICAgIHg6IGVsZS5wb3NpdGlvbihcInhcIiksXHJcbiAgICAgICAgeTogZWxlLnBvc2l0aW9uKFwieVwiKVxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBwb3NpdGlvbnNBbmRTaXplcztcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHJldHVyblRvUG9zaXRpb25zQW5kU2l6ZXMobm9kZXNEYXRhKSB7XHJcbiAgICB2YXIgY3VycmVudFBvc2l0aW9uc0FuZFNpemVzID0ge307XHJcbiAgICBjeS5ub2RlcygpLnBvc2l0aW9ucyhmdW5jdGlvbiAoaSwgZWxlKSB7XHJcbiAgICAgIGN1cnJlbnRQb3NpdGlvbnNBbmRTaXplc1tlbGUuaWQoKV0gPSB7XHJcbiAgICAgICAgd2lkdGg6IGVsZS53aWR0aCgpLFxyXG4gICAgICAgIGhlaWdodDogZWxlLmhlaWdodCgpLFxyXG4gICAgICAgIHg6IGVsZS5wb3NpdGlvbihcInhcIiksXHJcbiAgICAgICAgeTogZWxlLnBvc2l0aW9uKFwieVwiKVxyXG4gICAgICB9O1xyXG4gICAgICB2YXIgZGF0YSA9IG5vZGVzRGF0YVtlbGUuaWQoKV07XHJcbiAgICAgIGVsZS5fcHJpdmF0ZS5kYXRhLndpZHRoID0gZGF0YS53aWR0aDtcclxuICAgICAgZWxlLl9wcml2YXRlLmRhdGEuaGVpZ2h0ID0gZGF0YS5oZWlnaHQ7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgeDogZGF0YS54LFxyXG4gICAgICAgIHk6IGRhdGEueVxyXG4gICAgICB9O1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIGN1cnJlbnRQb3NpdGlvbnNBbmRTaXplcztcclxuICB9XHJcblxyXG4gIHZhciBzZWNvbmRUaW1lT3B0cyA9IHtcclxuICAgIGxheW91dEJ5OiBudWxsLFxyXG4gICAgYW5pbWF0ZTogZmFsc2UsXHJcbiAgICBmaXNoZXllOiBmYWxzZVxyXG4gIH07XHJcblxyXG4gIGZ1bmN0aW9uIGRvSXQoZnVuYykge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChhcmdzKSB7XHJcbiAgICAgIHZhciByZXN1bHQgPSB7fTtcclxuICAgICAgdmFyIG5vZGVzID0gZ2V0RWxlcyhhcmdzLm5vZGVzKTtcclxuICAgICAgaWYgKGFyZ3MuZmlyc3RUaW1lKSB7XHJcbiAgICAgICAgcmVzdWx0Lm9sZERhdGEgPSBnZXROb2RlUG9zaXRpb25zQW5kU2l6ZXMoKTtcclxuICAgICAgICByZXN1bHQubm9kZXMgPSBmdW5jLmluZGV4T2YoXCJBbGxcIikgPiAwID8gY3lbZnVuY10oYXJncy5vcHRpb25zKSA6IG5vZGVzW2Z1bmNdKGFyZ3Mub3B0aW9ucyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmVzdWx0Lm9sZERhdGEgPSBnZXROb2RlUG9zaXRpb25zQW5kU2l6ZXMoKTtcclxuICAgICAgICByZXN1bHQubm9kZXMgPSBmdW5jLmluZGV4T2YoXCJBbGxcIikgPiAwID8gY3lbZnVuY10oc2Vjb25kVGltZU9wdHMpIDogY3kuY29sbGVjdGlvbihub2RlcylbZnVuY10oc2Vjb25kVGltZU9wdHMpO1xyXG4gICAgICAgIHJldHVyblRvUG9zaXRpb25zQW5kU2l6ZXMoYXJncy5vbGREYXRhKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICB2YXIgYWN0aW9ucyA9IFtcImNvbGxhcHNlXCIsIFwiY29sbGFwc2VSZWN1cnNpdmVseVwiLCBcImNvbGxhcHNlQWxsXCIsIFwiZXhwYW5kXCIsIFwiZXhwYW5kUmVjdXJzaXZlbHlcIiwgXCJleHBhbmRBbGxcIl07XHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgdXIuYWN0aW9uKGFjdGlvbnNbaV0sIGRvSXQoYWN0aW9uc1tpXSksIGRvSXQoYWN0aW9uc1soaSArIDMpICUgNl0pKTtcclxuICB9XHJcblxyXG59O1xyXG4iXX0=
