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
    .service('WordSplitter', function() {
      var Splitter = {
        split: function(word) {
          var sentence = '';
          for (var i = 0; i < word.length; i++) {
            var code = word.charCodeAt(i);
            if (code >= 'A'.charCodeAt(0) && code <= 'Z'.charCodeAt(0)) {
              sentence += ' ';
            }
            if (i == 0) {
              sentence += word.charAt(i).toUpperCase();
            } else {
              sentence += word.charAt(i);
            }
          }
          return sentence;
        }
      }
      return Splitter;
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
    .directive('barLegends', function() {
      return {
        restrict: 'E',
        replace: true,
        scope: {legends: '='},
        template: '<svg ng-attr-width="{{graph.width}}" ng-attr-height="{{graph.height}}">'
          + '  <text ng-repeat="legend in legends" ng-attr-x="0" ng-attr-y="{{y($index)}}" ng-attr-style="{{legend.style}}" font-family="Verdana" font-size="10">{{legend.text}}</text>'
          + '</svg>',
        link: function(scope, element, attrs) {
          scope.graph = {
            height: 200,
            width: 200
          };

          scope.y = function(index) {
            return index * 15 + 20;
          };
        }
      }
    })
    .factory('SortAlgBase', ['$rootScope', 'WordSplitter',
      function($rootScope, WordSplitter) {
        function SortAlgBase(name) {
            this.name = name;
            this.sortData = [];
            this.scope;
            this.interval = -1;

            this.style = {
              default: 'fill:rgb(123, 123, 123);stroke:white;stroke-width:1',
              currentlySeen: 'fill:green;',
              smallestInLoop: 'fill:red;',
              nextToCompare: 'fill:blue;'
            };

            this.getName = function() {
              return this.name;
            }

            this.apply = function() {
              // if (this.interval > 0) {
              //   $rootScope.$apply();
              // } else {
                // var phase = $rootScope.$$phase;
                setTimeout(function() {$rootScope.$apply();}, 1);
                // if(phase != '$apply' && phase != '$digest') {
                //   $rootScope.$apply();
                // }
              // }
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

            this.start = function(scope, items, interval) {
              this.interval = interval;
              if (!this.scope) {
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
            }

            this.autoStop = function() {
              this.scope.processing.status = 'Start';
              this.apply();
              this.stop();
            }

            this.getAlgText = function() {
              return this.sort.toString();
            }
          }

          SortAlgBase.prototype.init = function() {
          }

          SortAlgBase.prototype.step = function() {
            // to be implemented by child
          };

          SortAlgBase.prototype.sort = function(items) {
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
          }

          SortAlgBase.prototype.setStyle = function(index, style) {
            if (index < 0 || index >= this.sortData.length) {
              return;
            }
            this.sortData[index].style = style;
          }

          SortAlgBase.prototype.setDefaultStyle = function(index) {
            this.setStyle(index, this.style.default);
          }

          SortAlgBase.prototype.setCurrentlySeenStyle = function(index) {
            this.setStyle(index, this.style.currentlySeen);
          }

          SortAlgBase.prototype.setNextToCompareStyle = function(index) {
            this.setStyle(index, this.style.nextToCompare + this.style.currentlyCompare);
          }

          SortAlgBase.prototype.setSmallestInLoopStyle = function(index) {
            this.setStyle(index, this.style.smallestInLoop + this.style.currentlyCompare);
          }

          return SortAlgBase;
    }])
    .factory('SelectionSort', ['SortAlgBase', function(SortAlgBase) {
        var SelectionSort = new SortAlgBase('Selection');

        SelectionSort.init = function() {
          this.__proto__.init.call(this);

          this.scope.processing.currentIdx = 0;
          this.scope.processing.nextIdx = 1;
          this.scope.processing.smallestIdx = 0;
        }

        SelectionSort.step = function() {
          var currentIdx = this.scope.processing.currentIdx;
          var nextIdx = this.scope.processing.nextIdx;
          var smallestIdx = this.scope.processing.smallestIdx;
          var isLoopEnd = this.scope.processing.isLoopEnd;

          if (this.scope.processing.isLoopEnd == true) {
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

          if (currentIdx == this.sortData.length) {
            // all items processed
            this.setDefaultStyle(currentIdx - 1);
            this.setDefaultStyle(smallestIdx);
            this.autoStop();
            return;
          }

          if (this.scope.processing.nextIdx == this.sortData.length) {
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

          if (nextIdx - 1 != smallestIdx || nextIdx - 1 != currentIdx) {
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
    .factory('InsertionSort', ['SortAlgBase', function(SortAlgBase) {
      var InsertionSort = new SortAlgBase('Insertion');
      var style = {
        default: 'fill:rgb(123, 123, 123);stroke:white;stroke-width:1',
        currentlySeen: 'fill:green;',
        smallestInLoop: 'fill:red;',
        nextToCompare: 'fill:blue;'
      };

      InsertionSort.paint = function() {
        var currentIdx = this.scope.processing.currentIdx;
        var nextIdx = this.scope.processing.nextIdx;
        var smallestIdx = this.scope.processing.smallestIdx;
        var isSwap = this.scope.processing.isSwap;

        if (isSwap) {
          this.sortData[smallestIdx].style = style.default;
          this.sortData[nextIdx].style = style.smallestInLoop;
          this.sortData[currentIdx].style = style.currentlySeen;
          this.apply();
          return;
        }

        // Draw currently seen bar
        if (currentIdx == this.sortData.length) {
          // all items processed
          this.sortData[currentIdx - 1].style = style.default;
          this.apply();
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

        this.apply();
      };

      InsertionSort.init = function() {
        this.__proto__.init.call(this);

        this.scope.processing.currentIdx = 0;
        this.scope.processing.nextIdx = -1;
        this.scope.processing.smallestIdx = 0;
      }

      InsertionSort.step = function() {
        var currentIdx = this.scope.processing.currentIdx;
        var nextIdx = this.scope.processing.nextIdx;
        var smallestIdx = this.scope.processing.smallestIdx;

        this.paint();

        if (currentIdx == this.sortData.length) {
          // all items processed
          this.autoStop();
          return;
        }

        if (nextIdx < 0) {
          // Inner loop scan complete.  Start on next unseen item.
          currentIdx++;
          this.scope.processing.currentIdx = currentIdx;
          this.scope.processing.nextIdx = currentIdx - 1;
          this.scope.processing.smallestIdx = currentIdx;
          return;
        }

        if (this.scope.processing.isSwap === true) {
          this.swap(this.sortData, nextIdx, smallestIdx);
          this.paint();

          this.scope.processing.isSwap = false;
          this.scope.processing.smallestIdx = nextIdx;
          this.scope.processing.nextIdx--;
          return;
        }

        if (this.isLarger(this.sortData, nextIdx, smallestIdx)) {
          this.scope.processing.isSwap = true;
        } else {
          this.scope.processing.nextIdx--;
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

          $scope.changeAlg = function(method) {
            var alg = SortAlgFactory.get(method);
            $scope.algText = alg.getAlgText();
            $scope.updateSortData($scope.sortSource);
            alg.setLegends($scope.legends);
          };

          $scope.updateSortData = function(sortSource) {
            $scope.sortData = sortSource.split(',')
              .map(function(val, idx, array) {
                return {
                  val: val,
                  style: 'fill:rgb(123, 123, 123);stroke:white;stroke-width:1'
                };
            });
          }

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
            return $sce.trustAsHtml("      " + code);
          };

          $scope.start = function(status) {
            var alg = SortAlgFactory.get($scope.sortingMethods.selected);
            if (status == 'Start') {
              alg.start($scope, $scope.sortData, $scope.interval);
            } else {
              alg.stop();
            }
          };

          $scope.step = function() {
            var alg = SortAlgFactory.get($scope.sortingMethods.selected);
            alg.start($scope, $scope.sortData, -1);
          }

          $scope.processing = {
            status: 'Start'
          };
          $scope.interval = 100;

          $scope.sortingMethods = {
            options: ['Selection', 'Insertion'],
            selected: 'Selection'
          };

          var itemsInSeq =[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
          $scope.dataSource = {
            asc: itemsInSeq,
            dsc: itemsInSeq.concat([]).reverse(),
            random: Shuffler.shuffle(itemsInSeq.concat([])),
            options: ['asc', 'dsc', 'random', 'input'],
            selected: 'random'
          };

          $scope.legends = [];

          $scope.changeSource($scope.dataSource.selected);
          $scope.changeAlg($scope.sortingMethods.selected);
        }]);
