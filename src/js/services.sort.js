angular.module('alg.services.sort', ['alg.services'])
  .factory('SortAlgBase', ['$rootScope', 'WordSplitter',
    function($rootScope, WordSplitter) {
      function SortAlgBase(name) {
          this.name = name;
          this.sortData = [];
          this.scope = null;
          this.interval = -1;

          this.style = {
            default: 'fill:rgb(123, 123, 123);stroke:white;stroke-width:1',
            currentlySeen: 'fill:green;',
            smallestInLoop: 'fill:red;',
            nextToCompare: 'fill:blue;'
          };

          this.getName = function() {
            return this.name;
          };

          this.apply = function() {
            setTimeout(function() {$rootScope.$apply();}, 1);
          };

          this.isLarger = function(items, srcIdx, targetIdx) {
            if (parseInt(items[srcIdx].val) > parseInt(items[targetIdx].val)) {
              return true;
            }
            return false;
          };

          this.swap = function(items, srcIdx, targetIdx) {
            var tmp = items[srcIdx];
            items[srcIdx] = items[targetIdx];
            items[targetIdx] = tmp;
          };

          this.start = function(scope, items, interval) {
            this.interval = interval;
            if (!this.scope || !this.scope.processing.isStarted) {
              this.scope = scope;
              this.sortData = items;
              this.init();
            }

            if (interval > 0) {
              this.scope.processing.id = setInterval(this.step.bind(this), interval);
            } else {
              this.step();
            }
          };

          this.stop = function() {
            clearInterval(this.scope.processing.id);
          };

          this.autoStop = function() {
            this.stop();
            this.init();
          };

          this.getAlgText = function() {
            return this.sort.toString();
          };
        }

      SortAlgBase.prototype.init = function() {
        this.scope.init();
      };

      SortAlgBase.prototype.step = function() {
        this.scope.processing.isStarted = true;
      };

      SortAlgBase.prototype.sort = function() {
        // to be implemented by child
      };

      SortAlgBase.prototype.setLegends = function(legends) {
        var i = 0;
        for (var legend in this.style) {
          legends[i++] = {
            style: this.style[legend].replace('stroke:white', ''),
            text: WordSplitter.split(legend)
          };
        }
      };

      SortAlgBase.prototype.setStyle = function(index, style) {
        if (index < 0 || index >= this.sortData.length) {
          return;
        }
        this.sortData[index].style = style;
      };

      SortAlgBase.prototype.setDefaultStyle = function(index) {
        this.setStyle(index, this.style.default);
      };

      SortAlgBase.prototype.setCurrentlySeenStyle = function(index) {
        this.setStyle(index, this.style.currentlySeen);
      };

      SortAlgBase.prototype.setNextToCompareStyle = function(index) {
        this.setStyle(index, this.style.nextToCompare + this.style.currentlyCompare);
      };

      SortAlgBase.prototype.setSmallestInLoopStyle = function(index) {
        this.setStyle(index, this.style.smallestInLoop + this.style.currentlyCompare);
      };

      return SortAlgBase;
    }])
    .factory('SelectionSort', ['SortAlgBase', function(SortAlgBase) {
      var SelectionSort = new SortAlgBase('Selection');

      SelectionSort.init = function() {
        this.constructor.prototype.init.call(this);

        this.scope.processing.currentIdx = 0;
        this.scope.processing.nextIdx = 1;
        this.scope.processing.smallestIdx = 0;
      };

      SelectionSort.step = function() {
        this.constructor.prototype.step.call(this);

        var currentIdx = this.scope.processing.currentIdx;
        var nextIdx = this.scope.processing.nextIdx;
        var smallestIdx = this.scope.processing.smallestIdx;

        if (this.scope.processing.isLoopEnd === true) {
          this.scope.processing.isLoopEnd = false;

          // Clear style of current step
          this.setDefaultStyle(smallestIdx);
          this.setDefaultStyle(currentIdx);
          this.setDefaultStyle(nextIdx - 1);

          currentIdx++;

          this.scope.processing.currentIdx = currentIdx;
          this.scope.processing.smallestIdx = currentIdx;
          this.scope.processing.nextIdx = currentIdx + 1;

          // Init style for next step
          this.setSmallestInLoopStyle(currentIdx);
          this.setCurrentlySeenStyle(currentIdx);
          this.setNextToCompareStyle(this.scope.processing.nextIdx);
          this.apply();
          return;
        }

        if (currentIdx === this.sortData.length) {
          // all items processed
          this.setDefaultStyle(currentIdx - 1);
          this.setDefaultStyle(smallestIdx);
          this.autoStop();
          return;
        }

        if (this.scope.processing.nextIdx === this.sortData.length) {
          this.scope.processing.isLoopEnd = true;

          // inner loop complete
          if (currentIdx != smallestIdx) {
            this.swap(this.sortData, currentIdx, smallestIdx);
            this.setDefaultStyle(smallestIdx);
            this.setSmallestInLoopStyle(currentIdx);
            this.apply();
          }
          return;
        }

        if (nextIdx - 1 !== smallestIdx || nextIdx - 1 !== currentIdx) {
          this.setDefaultStyle(nextIdx - 1);
        }
        this.setCurrentlySeenStyle(currentIdx);
        this.setSmallestInLoopStyle(smallestIdx);
        this.setNextToCompareStyle(nextIdx);
        this.apply();

        if (this.isLarger(this.sortData, smallestIdx, nextIdx)) {
          this.setDefaultStyle(smallestIdx); // must be before later statement
          this.setCurrentlySeenStyle(currentIdx);

          this.scope.processing.smallestIdx = nextIdx;

          this.setSmallestInLoopStyle(nextIdx);
        }
        this.apply();
        this.scope.processing.nextIdx++;
      };

      SelectionSort.sort = function(items) {
        for (var i = 0; i < items.length; i++) {
          var min = i;
          for (var j = i + 1; j < items.length; j++) {
            if (this.isLarger(items, min, j)) {
              min = j;
            }
          }
          if (i != min) {
            this.swap(items, i, min);
          }
        }
      };

      return SelectionSort;
    }])
  .factory('InsertionSort', ['SortAlgBase', function(SortAlgBase) {
    var InsertionSort = new SortAlgBase('Insertion');

    InsertionSort.init = function() {
      this.constructor.prototype.init.call(this);

      this.scope.processing.currentIdx = 0;
      this.scope.processing.nextIdx = -1;
      this.scope.processing.smallestIdx = 0;
    };

    InsertionSort.step = function() {
      this.constructor.prototype.step.call(this);

      var currentIdx = this.scope.processing.currentIdx;
      var nextIdx = this.scope.processing.nextIdx;
      var smallestIdx = this.scope.processing.smallestIdx;

      if (currentIdx === this.sortData.length) {
        // all items processed
        this.setDefaultStyle(currentIdx - 1);
        this.setDefaultStyle(smallestIdx);
        this.setDefaultStyle(nextIdx);
        this.apply();
        this.autoStop();
        return;
      }

      if (nextIdx < 0) {
        // Inner loop scan complete.  Start on next unseen item.
        this.setDefaultStyle(0);
        this.setDefaultStyle(smallestIdx);
        this.setDefaultStyle(currentIdx);
        this.apply();

        currentIdx++;

        this.scope.processing.currentIdx = currentIdx;
        this.scope.processing.nextIdx = currentIdx - 1;
        this.scope.processing.smallestIdx = currentIdx;

        this.setCurrentlySeenStyle(this.scope.processing.currentIdx);
        this.setSmallestInLoopStyle(this.scope.processing.currentIdx);
        this.setNextToCompareStyle(this.scope.processing.nextIdx);
        this.apply();
        return;
      }

      this.setCurrentlySeenStyle(currentIdx);
      this.setSmallestInLoopStyle(smallestIdx);
      this.setNextToCompareStyle(nextIdx);
      this.apply();

      if (this.isLarger(this.sortData, nextIdx, smallestIdx)) {
        this.setDefaultStyle(smallestIdx);
        this.setDefaultStyle(nextIdx);

        this.swap(this.sortData, nextIdx, smallestIdx);
        this.scope.processing.smallestIdx = nextIdx;

        this.setCurrentlySeenStyle(currentIdx);
        this.setSmallestInLoopStyle(nextIdx);
        this.setNextToCompareStyle(nextIdx - 1);
        this.apply();
      } else {
        this.scope.processing.smallestIdx = nextIdx;
        this.setDefaultStyle(smallestIdx);
        this.setSmallestInLoopStyle(nextIdx);
        this.setNextToCompareStyle(nextIdx - 1);
        this.apply();
      }
      this.scope.processing.nextIdx--;
      return;
    };

    InsertionSort.sort = function(items) {
      for (var i = 0; i < items.length; i++) {
        var min = i;
        for (var j = i - 1; j >= 0; j--) {
          if (this.isLarger(items, j, min)) {
            this.swap(items, min, j);
            min = j;
          }
        }
      }
    };

    return InsertionSort;
  }])
  .factory('SortAlgFactory', ['InsertionSort', 'SelectionSort',
    function(InsertionSort, SelectionSort) {
      var algs = {};
      var methodNames = [];

      function SortAlgFactory() {
      }

      SortAlgFactory.get = function(algName) {
        return algs[algName];
      };

      SortAlgFactory.getAllSortMethods = function() {
        return methodNames;
      };

      SortAlgFactory.reg = function(algFn) {
        var algName = algFn.getName();

        if (algName in algs) {
          throw new Error('Alg ' + algName + ' already registered');
        }
        methodNames.push(algName);
        algs[algName] = algFn;
      };

      SortAlgFactory.reg(InsertionSort);
      SortAlgFactory.reg(SelectionSort);

      return SortAlgFactory;
    }]);
