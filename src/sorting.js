var app = angular.module('SortAlg', ['ngSanitize', 'ui.bootstrap']);
  app.service('Shuffler', function() {
      var Shuffler = {};
      function shuffle(o){
        for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
      };
      Shuffler.shuffle = shuffle;
      return Shuffler;
    })
    .directive('barChart', function() {
      return {
        restrict: 'E',
        replace: true,
        scope: {dataset: '='},
        template: '<svg ng-attr-width="{{graph.width}}" ng-attr-height="{{graph.height}}">'
          + '    <rect ng-attr-style="{{data.style}}" ng-repeat="data in dataset"'
          + '        ng-attr-width="{{width()}}"'
          + '        ng-attr-height="{{height(data.val)}}"'
          + '        ng-attr-x="{{x($index)}}"'
          + '        ng-attr-y="{{y(data.val)}}">'
          + '    </rect>'
          + '</svg>',
        link: function(scope, element, attrs) {
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
      }
    })
    .factory('SortAlgBase', ['$rootScope', function($rootScope) {
      function SortAlgBase(name) {
          this.name = name;
          this.sortData = [];
          this.processing;
          this.style = {
            default: 'fill:rgb(123, 123, 123);stroke:white;stroke-width:1',
            currentlySeen: 'fill:green;',
            smallestInLoop: 'fill:red;',
            nextToCompare: 'fill:blue;'
          };

          this.getName = function() {
            return this.name;
          }

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

          this.init = function() {
            this.processing = {};
          }

          this.start = function(items, interval) {
            this.init();
            this.sortData = items;
            this.processing.id = setInterval(this.step.bind(this), interval);
          };

          this.step = function(items) {
            // to be implemented by child
          };

          this.sort = function(items) {
            // to be implemented by child
          };

          this.getAlgText = function() {
            return this.sort;
          }
        }

        return SortAlgBase;
    }])
    .factory('SelectionSort', ['SortAlgBase', '$rootScope',
      function(SortAlgBase, $rootScope) {
        var SelectionSort = new SortAlgBase('Selection');

        SelectionSort.init = function() {
          this.processing = {
            currentIdx: 0,
            nextIdx: 1,
            smallestIdx: 0
          };
        }

        SelectionSort.step = function() {
          var currentIdx = this.processing.currentIdx;
          var nextIdx = this.processing.nextIdx;
          var smallestIdx = this.processing.smallestIdx;

          if (this.processing.isLoopEnd == true) {
            if (currentIdx != smallestIdx) {
              this.swap(this.sortData, currentIdx, smallestIdx);
            }
            this.sortData[smallestIdx].style = this.style.default;
            this.sortData[currentIdx].style = this.style.default;
            this.sortData[nextIdx - 1].style = this.style.default;
            $rootScope.$apply();

            this.processing.isLoopEnd = false;
            currentIdx++;

            this.processing.currentIdx = currentIdx;
            this.processing.smallestIdx = currentIdx;
            this.processing.nextIdx = currentIdx + 1;
            return;
          }

          if (currentIdx == this.sortData.length) {
            // all items processed
            this.sortData[currentIdx - 1].style = this.style.default;
            return;
          }

          if (this.processing.nextIdx == this.sortData.length) {
            // inner loop complete
            this.processing.isLoopEnd = true;
            return;
          }

          this.sortData[currentIdx].style = this.style.currentlySeen;
          this.sortData[smallestIdx].style = this.style.smallestInLoop + this.style.currentlyCompare;
          this.sortData[nextIdx].style = this.style.nextToCompare + this.style.currentlyCompare;
          if (nextIdx - 1 != smallestIdx && nextIdx - 1 != currentIdx) {
              this.sortData[nextIdx - 1].style = this.style.default;
          }
          $rootScope.$apply();

          if (this.isLarger(this.sortData, smallestIdx, nextIdx)) {
            this.sortData[smallestIdx].style = this.style.default;
            this.processing.smallestIdx = nextIdx;
          }
          this.processing.nextIdx++;
        }

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
        }

        return SelectionSort;
    }])
    .factory('InsertionSort', ['SortAlgBase', '$rootScope',
        function(SortAlgBase, $rootScope) {
      var InsertionSort = new SortAlgBase('Insertion');
      var style = {
        default: 'fill:rgb(123, 123, 123);stroke:white;stroke-width:1',
        currentlySeen: 'fill:green;',
        smallestInLoop: 'fill:red;',
        nextToCompare: 'fill:blue;'
      };

      InsertionSort.paint = function() {
        var currentIdx = this.processing.currentIdx;
        var nextIdx = this.processing.nextIdx;
        var smallestIdx = this.processing.smallestIdx;
        var isSwap = this.processing.isSwap;

        if (isSwap) {
          this.sortData[smallestIdx].style = style.default;
          this.sortData[nextIdx].style = style.smallestInLoop;
          this.sortData[currentIdx].style = style.currentlySeen;
          $rootScope.$apply();
          return;
        }

        // Draw currently seen bar
        if (currentIdx == this.sortData.length) {
          // all items processed
          this.sortData[currentIdx - 1].style = style.default;
          $rootScope.$apply();
          return;
        }

        this.sortData[currentIdx].style = style.currentlySeen;
        // Draw the bar with smallest value compared so far
        this.sortData[smallestIdx].style = style.smallestInLoop + style.currentlyCompare;

        // Draw the next item to compare
        this.sortData[nextIdx + 1].style = style.default;
        if (nextIdx != -1) {
          this.sortData[nextIdx].style = style.nextToCompare + style.currentlyCompare;
        } else {
          // reach to the end of the loop, clear the smallest highlight
          this.sortData[smallestIdx].style = style.default;
        }

        $rootScope.$apply();
      };

      InsertionSort.init = function() {
        this.processing = {
          currentIdx: 0,
          nextIdx: -1,
          smallestIdx: 0
        };
      }

      InsertionSort.step = function() {
        var currentIdx = this.processing.currentIdx;
        var nextIdx = this.processing.nextIdx;
        var smallestIdx = this.processing.smallestIdx;

        this.paint();

        if (currentIdx == this.sortData.length) {
          // all items processed
          clearInterval(this.processing.id);
          return;
        }

        if (nextIdx < 0) {
          // Inner loop scan complete.  Start on next unseen item.
          currentIdx++;
          this.processing.currentIdx = currentIdx;
          this.processing.nextIdx = currentIdx - 1;
          this.processing.smallestIdx = currentIdx;
          return;
        }

        if (this.processing.isSwap === true) {
          this.swap(this.sortData, nextIdx, smallestIdx);
          this.paint();

          this.processing.isSwap = false;
          this.processing.smallestIdx = nextIdx;
          this.processing.nextIdx--;
          return;
        }

        if (this.isLarger(this.sortData, nextIdx, smallestIdx)) {
          this.processing.isSwap = true;
        } else {
          this.processing.nextIdx--;
        }
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
      }

      return InsertionSort;
    }])
    .factory('SortAlgFactory', ['InsertionSort', 'SelectionSort',
      function(InsertionSort, SelectionSort) {
        var algs = {};

        function SortAlgFactory() {
        }

        SortAlgFactory.get = function(algName) {
          return algs[algName];
        };

        SortAlgFactory.reg = function(algFn) {
          var algName = algFn.getName();

          if (algName in algs) {
            throw new Error('Alg ' + algName + ' already registered');
          }
          algs[algName] = algFn;
        };

        SortAlgFactory.reg(InsertionSort);
        SortAlgFactory.reg(SelectionSort);

        return SortAlgFactory;
    }])
    .controller('SortCtrl', ['$scope', 'Shuffler', 'SortAlgFactory', '$sce',
        function($scope, Shuffler, SortAlgFactory, $sce) {
          $scope.sortingMethods = {
            options: ['Selection', 'Insertion'],
            selected: 'Selection'
          };

          $scope.interval = 100;

          var itemsInSeq =[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
          // var itemsInSeq =[1, 2, 3, 4];
          $scope.dataSource = {
            asc: itemsInSeq,
            dsc: itemsInSeq.reverse(),
            random: Shuffler.shuffle(itemsInSeq),
            options: ['asc', 'dsc', 'random', 'input'],
            selectedType: 'random'
          }

          $scope.sortSource = $scope.dataSource[$scope.dataSource.selectedType].join(',');
          $scope.sortData = $scope.sortSource.split(',')
            .map(function(val, idx, array) {
              return {
                val: val,
                style: 'fill:rgb(123, 123, 123);stroke:white;stroke-width:1'
              };
          });

          $scope.trustedCode = function(code) {
            return $sce.trustAsHtml(code);
          }

          $scope.start = function() {
            var alg = SortAlgFactory.get($scope.sortingMethods.selected);
            $scope.algText = alg.getAlgText().toString();
            alg.start($scope.sortData, $scope.interval);
          }
        }]);
