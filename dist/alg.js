angular.module('alg.directives', [])
  .directive('barChart', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {dataset: '='},
      template: '<svg ng-attr-width="{{graph.width}}" ng-attr-height="{{graph.height}}">' +
        '    <rect ng-attr-style="{{data.style}}" ng-repeat="data in dataset"' +
        '        ng-attr-width="{{width()}}"' +
        '        ng-attr-height="{{height(data.val)}}"' +
        '        ng-attr-x="{{x($index)}}"' +
        '        ng-attr-y="{{y(data.val)}}">' +
        '    </rect>' +
        '</svg>',
      link: function(scope) {
        scope.graph = {
          height: 200,
          width: 400
        };

        scope.width = function() {
          return scope.graph.width / scope.dataset.length;
        };

        scope.height = function(data) {
          var max = 0;
          for (var i = 0; i < scope.dataset.length; i++) {
            if (parseInt(scope.dataset[i].val) > max) {
              max = parseInt(scope.dataset[i].val);
            }
          }

          return data / max * scope.graph.height;
        };

        scope.x = function(index) {
          return index * scope.width();
        };

        scope.y = function(data) {
          return scope.graph.height - scope.height(data);
        };
      }
    };
  })
  .directive('barLegends', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {legends: '='},
      template: '<svg ng-attr-width="{{graph.width}}" ng-attr-height="{{graph.height}}">' +
        '  <text ng-repeat="legend in legends" ng-attr-x="0" ng-attr-y="{{y($index)}}" ng-attr-style="{{legend.style}}" font-family="Verdana" font-size="10">{{legend.text}}</text>' +
        '</svg>',
      link: function(scope) {
        scope.graph = {
          height: 200,
          width: 200
        };

        scope.y = function(index) {
          return index * 15 + 20;
        };
      }
    };
  });

angular.module('alg.services', [])
  .service('Shuffler', function() {
    var Shuffler = {};
    function shuffle(o) {
      for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x) {}
      return o;
    }
    Shuffler.shuffle = shuffle;
    return Shuffler;
  })
  .service('WordSplitter', function() {
    var Splitter = {
      split: function(word) {
        var sentence = '';
        for (var i = 0; i < word.length; i++) {
          var code = word.charCodeAt(i);
          if (code >= 'A'.charCodeAt(0) && code <= 'Z'.charCodeAt(0)) {
            sentence += ' ';
          }
          if (i === 0) {
            sentence += word.charAt(i).toUpperCase();
          } else {
            sentence += word.charAt(i);
          }
        }
        return sentence;
      }
    };
    return Splitter;
  });

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

        this.isSmaller = function(items, srcIdx, targetIdx) {
          if (parseInt(items[srcIdx].val) < parseInt(items[targetIdx].val)) {
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
        legends.length = 0; // clear all first
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
        this.setSmallestInLoopStyle(this.scope.processing.smallestIdx);
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
        this.scope.processing.nextIdx--;
      } else {
        this.setDefaultStyle(nextIdx);
        this.scope.processing.nextIdx = -1;
      }
      return;
    };

    InsertionSort.sort = function(items) {
      for (var i = 0; i < items.length; i++) {
        var min = i;
        for (var j = i - 1; j >= 0; j--) {
          if (this.isLarger(items, j, min)) {
            this.swap(items, min, j);
            min = j;
          } else {
            break;
          }
        }
      }
    };

    return InsertionSort;
  }])
  .factory('BubbleSort', ['SortAlgBase', function(SortAlgBase) {
    var BubbleSort = new SortAlgBase('Bubble');

    BubbleSort.init = function() {
      this.constructor.prototype.init.call(this);

      this.scope.processing.currentIdx = this.sortData.length - 1;
      this.scope.processing.nextIdx = 0;
    };

    BubbleSort.setLegends = function(legends) {
      delete this.style.smallestInLoop;
      this.constructor.prototype.setLegends.call(this, legends);
    };

    BubbleSort.step = function() {
      this.constructor.prototype.step.call(this);

      var currentIdx = this.scope.processing.currentIdx;
      var nextIdx = this.scope.processing.nextIdx;

      this.setCurrentlySeenStyle(currentIdx);
      this.setDefaultStyle(nextIdx - 1);
      this.setNextToCompareStyle(nextIdx);
      this.apply();

      if (currentIdx === 0) {
        // all items processed
        this.setDefaultStyle(currentIdx);
        this.setDefaultStyle(nextIdx);
        this.apply();
        this.autoStop();
        return;
      }

      if (nextIdx === currentIdx) {
        // Inner loop scan complete.  Start on next unseen item.
        this.setDefaultStyle(currentIdx);
        this.apply();

        currentIdx--;

        this.scope.processing.currentIdx = currentIdx;
        this.scope.processing.nextIdx = 0;
        this.setCurrentlySeenStyle(currentIdx);
        this.setNextToCompareStyle(0);
        this.apply();
        return;
      }

      if (this.isLarger(this.sortData, nextIdx, currentIdx)) {
        this.swap(this.sortData, nextIdx, currentIdx);

        this.setNextToCompareStyle(nextIdx);
        this.setCurrentlySeenStyle(currentIdx);
        this.apply();
      }

      this.scope.processing.nextIdx++;
      return;
    };

    BubbleSort.sort = function(items) {
      for (var i = items.length - 1; i > 0; i--) {
        for (var j = 0; j < i; j++) {
          if (this.isLarger(items, j, j + 1)) {
            this.swap(items, j, j + 1);
          }
        }
      }
    };

    return BubbleSort;
  }])
  .factory('HeapSort', ['SortAlgBase', function(SortAlgBase) {
    var HeapSort = new SortAlgBase('Heap');

    HeapSort.init = function() {
      this.constructor.prototype.init.call(this);

      this.scope.processing.isHeapBuilt = false;
      this.scope.processing.isSwap = true;

      this.setIndex(this.sortData.length);
    };

    HeapSort.setLegends = function(legends) {
      delete this.style.smallestInLoop;
      this.constructor.prototype.setLegends.call(this, legends);
    };

    HeapSort.setIndex = function(heapCount) {
      this.scope.processing.N = heapCount;
      this.scope.processing.nextIdx = parseInt(heapCount / 2);
      this.scope.processing.nextSinkIdx = this.scope.processing.nextIdx;
    };

    HeapSort.step = function() {
      this.constructor.prototype.step.call(this);
      var N = this.scope.processing.N;
      var nextIdx = this.scope.processing.nextIdx;

      if (N === 1) {
        this.autoStop();
      }

      if (this.scope.processing.isHeapBuilt === false) {
        // heap building stage
        if (!this.sink(this.sortData, nextIdx, N)) {
          return;
        }

        var i = this.scope.processing.nextSinkIdx;
        this.setDefaultStyle(i - 1); // clear highlight of last two compared items  
        this.setDefaultStyle(i * 2 - 1);
        this.setDefaultStyle(i * 2);
        this.apply();

        nextIdx--;
        this.scope.processing.nextIdx = nextIdx;
        this.scope.processing.nextSinkIdx = this.scope.processing.nextIdx;

        if (nextIdx === 0) {
          this.scope.processing.isHeapBuilt = true;
          this.scope.processing.isSwap = true;

          this.setIndex(N);
        }
        return;
      } else {
        // sorting stage
        if (N > 1) {
          // Swap and sink are broken down to two stages
          if (this.scope.processing.isSwap === true) {
            this.setCurrentlySeenStyle(0);
            this.setNextToCompareStyle(N - 1);
            this.apply();

            this.swap(this.sortData, 0, N - 1);
            this.scope.processing.isSwap = false;
          } else {
            this.setDefaultStyle(0);
            this.setDefaultStyle(N - 1);
            this.apply();

            this.setIndex(--N);
            this.scope.processing.isHeapBuilt = false;
          }
        }
      }
    };

    HeapSort.sink = function(items, index, heapCount) {
      // index and heapCount are 1-based
      var i = this.scope.processing.nextSinkIdx;

      this.setCurrentlySeenStyle(i - 1); // clear highlight of last two compared items
      this.setDefaultStyle(parseInt(i / 2) - 1);

      if (i * 2 <= heapCount) {
        var child = i * 2;
        if (child < heapCount &&
            this.isSmaller(items, child - 1, child)) { // convert to 0-based
          child++; // take the larger child to compare
        }

        this.setNextToCompareStyle(child - 1);
        this.apply();

        if (this.isLarger(items, i - 1, child - 1)) { // convert to 0-based
          return true;
        }

        this.swap(items, i - 1, child - 1); // convert to 0-based

        this.scope.processing.nextSinkIdx = child;
        return false;
      } else {
        this.setDefaultStyle(i - 1);
        return true;
      }
    };

    HeapSort.sort = function(items) {
      function sink(items, index, heapCount) {
        // index and heapCount are 1-based
        var i = index;
        while (i * 2 <= heapCount) {
          var child = i * 2;
          if (child < heapCount &&
              this.isSmaller(items, child - 1, child)) { // convert to 0-based
            child++; // take the larger child to compare
          }
          if (this.isLarger(items, i - 1, child - 1)) { // convert to 0-based
            break;
          }

          this.swap(items, i - 1, child - 1); // convert to 0-based
          i = child;
        }
      }

      // Build a max heap
      var N = items.length;
      for (var i = parseInt(N / 2); i >= 1; i--) {
        sink(items, i, N);
      }

      // Do the sort
      while (N > 1) {
        this.swap(items, 0, N - 1); // Put the largest item to the end of items
        sink(items, 1, --N);
      }
      return items;
    };

    return HeapSort;
  }])
  .factory('QuickSort', ['SortAlgBase', 'Shuffler', function(SortAlgBase, Shuffler) {
    var QuickSort = new SortAlgBase('Quick');

    QuickSort.init = function() {
      this.constructor.prototype.init.call(this);

      this.scope.processing.isShuffled = false;
      this.scope.processing.lowIdx = 0;
      this.scope.processing.highIdx = this.sortData.length - 1;
      this.scope.processing.leftIdx = 1;
      this.scope.processing.rightIdx = this.sortData.length - 1;
      this.scope.processing.stack = [];
    };

    QuickSort.setLegends = function(legends) {
      var val = this.style.smallestInLoop;
      delete this.style.smallestInLoop;
      this.style.outOfOrder = val;
      this.constructor.prototype.setLegends.call(this, legends);
    };

    QuickSort.setOutOfOrderStyle = function(index) {
      this.setStyle(index, this.style.outOfOrder);
    };

    QuickSort.step = function() {
      this.constructor.prototype.step.call(this);

      if (this.scope.processing.isShuffled === false) {
        Shuffler.shuffle(this.sortData);
        this.apply();
        this.scope.processing.isShuffled = true;
        return;
      }

      var leftIdx = this.scope.processing.leftIdx;
      var rightIdx = this.scope.processing.rightIdx;
      var lowIdx = this.scope.processing.lowIdx;
      var highIdx = this.scope.processing.highIdx;

      if (lowIdx >= highIdx) {
        // end of current partition section
        this.setDefaultStyle(leftIdx);
        this.setDefaultStyle(lowIdx);
        this.setDefaultStyle(rightIdx);
        this.apply();

        var stackSize = this.scope.processing.stack.length;
        if (stackSize === 0) {
          this.autoStop();
        } else {
          var nextStep = this.scope.processing.stack[stackSize - 1];

          this.scope.processing.lowIdx = nextStep.lowIdx;
          this.scope.processing.highIdx = nextStep.highIdx;
          this.scope.processing.leftIdx = nextStep.lowIdx + 1;
          this.scope.processing.rightIdx = nextStep.highIdx;

          this.scope.processing.stack.length = stackSize - 1; // remove from stack
        }
        return;
      }

      if (leftIdx >= rightIdx) {
        // partition is done
        var partition = rightIdx;
        if (!this.isSmaller(this.sortData, rightIdx, lowIdx)) {
          partition = rightIdx - 1;
        }
        this.swap(this.sortData, lowIdx, partition);
        this.setDefaultStyle(leftIdx - 1);
        this.setDefaultStyle(lowIdx);
        this.setDefaultStyle(rightIdx + 1);
        this.setDefaultStyle(rightIdx);
        this.apply();

        // next to process the left part
        this.scope.processing.lowIdx = lowIdx;
        this.scope.processing.highIdx = partition - 1;
        this.scope.processing.leftIdx = lowIdx + 1;
        this.scope.processing.rightIdx = this.scope.processing.highIdx;

        // put the right part in the stack
        this.scope.processing.stack[this.scope.processing.stack.length] = {
          lowIdx: partition + 1,
          highIdx: highIdx
        };
        return;
      }

      var l = leftIdx;
      var r = rightIdx;

      this.setDefaultStyle(leftIdx - 1);
      this.setDefaultStyle(rightIdx + 1);
      this.setNextToCompareStyle(leftIdx);
      this.setNextToCompareStyle(rightIdx);
      this.setCurrentlySeenStyle(lowIdx);
      this.apply();

      if (this.isSmaller(this.sortData, leftIdx, lowIdx)) {
        // Left idx stop when larger than or equal to compared item
        leftIdx++;
      } else {
        this.setOutOfOrderStyle(leftIdx);
      }

      if (this.isSmaller(this.sortData, lowIdx, rightIdx)) {
        // Right idx stop when smaller than or equal to compared item
        rightIdx--;
      } else {
        this.setOutOfOrderStyle(rightIdx);
      }

      if (l === leftIdx && r === rightIdx) {
        // both index haven't moved.  Need to swap
        this.swap(this.sortData, leftIdx, rightIdx);
        leftIdx++;
        rightIdx--;
      }

      this.scope.processing.leftIdx = leftIdx;
      this.scope.processing.rightIdx = rightIdx;
    };

    QuickSort.sort = function(items) {
      function partition(items, low, high) {
        var i = low;
        var j = high + 1;

        while (true) {
          while (this.isSmaller(items, ++i, low)) {
            if (i === high) {
              break;
            }
          }

          while (this.isSmaller(items, low, --j)) {
            if (j === low) {
              break;
            }
          }

          if (i >= j) {
            break;
          }

          this.swap(items, i, j);
        }

        this.swap(items, low, j);
        return j;
      }

      function sort(items, low, high) {
        if (low >= high) {
          return;
        }

        var i = partition(items, low, high);
        sort(items, low, i - 1);
        sort(items, i + 1, high);
      }

      Shuffler.shuffle(items); // Performance guarantee
      sort(items, 0, items.length - 1);
    };

    return QuickSort;
  }])
  .factory('SortAlgFactory', ['InsertionSort', 'SelectionSort', 'BubbleSort',
    'HeapSort', 'QuickSort',
    function(InsertionSort, SelectionSort, BubbleSort, HeapSort, QuickSort) {
      // Shellsort, mergesort remained
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

      SortAlgFactory.reg(QuickSort);
      SortAlgFactory.reg(HeapSort);
      SortAlgFactory.reg(BubbleSort);
      SortAlgFactory.reg(InsertionSort);
      SortAlgFactory.reg(SelectionSort);

      return SortAlgFactory;
    }]);

var app = angular.module('SortAlg',
    ['ngSanitize', 'ui.bootstrap', 'alg.directives', 'alg.services.sort']);
// app.config(function($interpolateProvider) {
//   $interpolateProvider.startSymbol('$$');
//   $interpolateProvider.endSymbol('$$');
// });
app.controller('SortCtrl', ['$scope', 'Shuffler', 'SortAlgFactory', 'SortAlgBase', '$sce',
    function($scope, Shuffler, SortAlgFactory, SortAlgBase, $sce) {

      $scope.changeAlg = function(method) {
        var alg = SortAlgFactory.get(method);
        $scope.algText = alg.getAlgText();
        $scope.updateSortData($scope.sortSource);
        alg.setLegends($scope.legends);
      };

      $scope.updateSortData = function(sortSource) {
        if (!sortSource) {
          return; // when the data input is invalid
        }

        var alg = SortAlgFactory.get($scope.sortingMethods.selected);
        $scope.sortData = sortSource.split(',')
          .map(function(val) {
            return {
              val: val,
              style: alg.style.default
            };
          });
        $scope.init();
      };

      $scope.changeSource = function(source) {
        var data = $scope.dataSource[source];
        if (!data) {
          return;
        }
        $scope.sortSource = data.join(',');
        $scope.updateSortData($scope.sortSource);
      };

      $scope.trustedCode = function(code) {
        if (!code) {
          return '';
        }
        return $sce.trustAsHtml('    ' + code);
      };

      $scope.start = function(button) {
        var alg = SortAlgFactory.get($scope.sortingMethods.selected);
        if (button == 'Start') {
          alg.start($scope, $scope.sortData, $scope.interval);
        } else {
          alg.stop();
        }
      };

      $scope.step = function() {
        var alg = SortAlgFactory.get($scope.sortingMethods.selected);
        alg.start($scope, $scope.sortData, -1);
      };

      $scope.init = function() {
        $scope.processing = {
          button: 'Start',
          isStarted: false
        };
      };

      $scope.interval = 100;

      var regMethods = SortAlgFactory.getAllSortMethods();
      $scope.sortingMethods = {
        options: regMethods,
        selected: regMethods[0]
      };

      var itemsInSeq =[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
      $scope.dataSource = {
        Asc: itemsInSeq,
        Desc: itemsInSeq.concat([]).reverse(),
        Random: Shuffler.shuffle(itemsInSeq.concat([])),
        options: ['Asc', 'Desc', 'Random'],
        selected: 'Random'
      };

      $scope.legends = [];

      $scope.changeSource($scope.dataSource.selected);
      $scope.changeAlg($scope.sortingMethods.selected);
    }]);
