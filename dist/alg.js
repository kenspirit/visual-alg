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
  .factory('BubbleSort', ['SortAlgBase', function(SortAlgBase) {
    var BubbleSort = new SortAlgBase('Bubble');

    BubbleSort.init = function() {
      this.constructor.prototype.init.call(this);

      this.scope.processing.currentIdx = this.sortData.length - 1;
      this.scope.processing.nextIdx = 0;
    };

    BubbleSort.step = function() {
      this.constructor.prototype.step.call(this);

      var currentIdx = this.scope.processing.currentIdx;
      var nextIdx = this.scope.processing.nextIdx;

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

        this.setCurrentlySeenStyle(this.scope.processing.currentIdx);
        this.setNextToCompareStyle(this.scope.processing.nextIdx);
        this.apply();
        return;
      }

      this.setCurrentlySeenStyle(currentIdx);
      this.setNextToCompareStyle(nextIdx);
      this.apply();

      if (this.isLarger(this.sortData, nextIdx, currentIdx)) {
        this.swap(this.sortData, nextIdx, currentIdx);

        this.setDefaultStyle(nextIdx);
        this.setNextToCompareStyle(nextIdx + 1);
        this.setCurrentlySeenStyle(currentIdx);
        this.apply();
      } else {
        this.setDefaultStyle(nextIdx);
        this.setNextToCompareStyle(nextIdx + 1);
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
  .factory('SortAlgFactory', ['InsertionSort', 'SelectionSort', 'BubbleSort',
    function(InsertionSort, SelectionSort, BubbleSort) {
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

      SortAlgFactory.reg(BubbleSort);
      SortAlgFactory.reg(InsertionSort);
      SortAlgFactory.reg(SelectionSort);

      return SortAlgFactory;
    }]);

var app = angular.module('SortAlg',
    ['ngSanitize', 'ui.bootstrap', 'alg.directives', 'alg.services.sort']);

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
