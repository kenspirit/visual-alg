var app = angular.module('SortAlg', ['ui.bootstrap']);
  app
    // .config(['$routeProvider', function($routeProvider)  {
    //   $routeProvider
    //     .when('/sort', {templateUrl: 'alg/sort.html', controller: 'SortCtrl'})
    //     .otherwise({redirectTo: '/sort'});
    // }])
    .service('Shuffler', function() {
      var Shuffler = {};
      function shuffle(o){ //v1.0
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
        // template: '<div class="sortFrame" style="height: {{graph.height}}px;">'
        //   + '<span ng-repeat="data in dataset" class="sortItem" style="margin-top: {{graph.height - height(data.val)}}px;height: {{height(data.val)}}px; width: {{width()}}px;">'
        //   + '</span>'
        //   + '</div>',
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

          this.sort = function(items) {
            // to be implemented by child
          };
        }

        return SortAlgBase;
    }])
    .factory('SelectionSort', ['SortAlgBase', function(SortAlgBase) {
      var SelectionSort = new SortAlgBase('Selection');

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
      var sortData;
      var processing;
      var style = {
        default: 'fill:rgb(123, 123, 123);stroke:white;stroke-width:1',
        currentlySeen: 'fill:green;',
        smallestInLoop: 'fill:red;',
        nextToCompare: 'fill:blue;'
      };

      InsertionSort.intervalCompare = function() {
        var currentIdx = processing.currentIdx;
        var nextIdx = processing.nextIdx;
        var smallestIdx = processing.smallestIdx;

        if (currentIdx == sortData.length) {
          // all items processed
          sortData[currentIdx - 1].style = style.default;
          $rootScope.$apply();
          clearInterval(processing.id);
          return;
        }

        // Currently seen item.
        sortData[currentIdx].style = style.currentlySeen;
        sortData[smallestIdx].style = style.smallestInLoop + style.currentlyCompare;
        $rootScope.$apply();

        if (nextIdx < 0) {
          // Inner loop scan complete.  Start on next unseen item.
          // No need highlight the smallest item in this loop
          sortData[smallestIdx].style = style.default;

          currentIdx++;
          processing.currentIdx = currentIdx;
          processing.nextIdx = currentIdx - 1;
          processing.smallestIdx = currentIdx;
          return;
        }
        // The next item to compare
        sortData[processing.nextIdx].style = style.nextToCompare + style.currentlyCompare;
        $rootScope.$apply();

        if (processing.isSwap === true) {
          this.swap(sortData, nextIdx, smallestIdx);

          // After swap, highlight changed from original smallest item
          // to current compared one
          sortData[smallestIdx].style = style.default;
          sortData[nextIdx].style = style.smallestInLoop;
          sortData[currentIdx].style = style.currentlySeen;

          processing.isSwap = false;
          processing.smallestIdx = nextIdx;
          processing.nextIdx--;
          $rootScope.$apply();
          return;
        }

        if (this.isLarger(sortData, nextIdx, smallestIdx)) {
          processing.isSwap = true;
        } else {
          sortData[nextIdx].style = style.default;
          processing.nextIdx--;
        }

        $rootScope.$apply();
      };

      InsertionSort.sort = function(items, interval) {
        sortData = items;
        processing = {};
        processing.currentIdx = 0;
        processing.nextIdx = -1;
        processing.smallestIdx = 0;

        processing.id =
          setInterval(this.intervalCompare.bind(this), interval);

        // Loop version
        // for (var i = 0; i < $scope.sortData.length; i++) {
        //   var min = i;
        //   for (var j = i - 1; j >= 0; j--) {
        //     if (this.isLarger(items, j, min)) {
        //       this.swap(items, min, j);
        //       min = j;
        //     }
        //   }
        // }
      };

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
    .controller('SortCtrl', ['$scope', 'Shuffler', 'SortAlgFactory',
        function($scope, Shuffler, SortAlgFactory) {
          $scope.sortingMethods = {
            options: ['Selection', 'Insertion'],
            selected: 'Insertion'
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

          $scope.start = function() {
            SortAlgFactory.get($scope.sortingMethods.selected)
              .sort($scope.sortData, $scope.interval);
          }
        }]);
