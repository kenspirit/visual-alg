var app = angular.module('SortAlg',
    ['ngSanitize', 'ui.bootstrap', 'alg.directives', 'alg.services.sort']);
// app.config(function($interpolateProvider) {
//   $interpolateProvider.startSymbol('$$');
//   $interpolateProvider.endSymbol('$$');
// });
app.controller('SortCtrl', ['$scope', 'Shuffler', 'SortAlgFactory', 'SortAlgBase', '$sce',
    function($scope, Shuffler, SortAlgFactory, SortAlgBase, $sce) {

      $scope.changeAlg = function(method) {
        if ($scope.alg) {
          $scope.alg.cleanUp();
        }
        $scope.alg = SortAlgFactory.get(method);
        $scope.isMerge = method.indexOf('Merge') > -1;

        $scope.algText = $scope.alg.getAlgText();
        $scope.updateSortData($scope.sortSource);
        $scope.alg.setLegends($scope.legends);
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
              style: alg.style.default,
              bgVal: 0,
              bgStyle: 'display:none'
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

      $scope.interval = 300;

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

      $scope.init();
      $scope.changeSource($scope.dataSource.selected);
      $scope.changeAlg($scope.sortingMethods.selected);

      function getPosition(element) {
        var xPosition = 0;
        var yPosition = 0;

        while (element) {
          xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
          yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
          element = element.offsetParent;
        }
        return { x: xPosition, y: yPosition };
      }

      function setInterval(marginLeft, sliderBarWidth) {
        $scope.interval = parseInt(1000 * marginLeft / sliderBarWidth);
      }

      function setMarginLeft(marginLeft) {
        if (marginLeft < 0) {
          marginLeft = 1;
        } else if (marginLeft + $scope.sliderWidth >= $scope.sliderBarWidth - 1) {
          marginLeft = $scope.sliderBarWidth - $scope.sliderWidth - 1;
        }

        $scope.marginLeft = marginLeft;
      }

      $scope.isHold = false;
      $scope.lastClientX = 0;
      $scope.marginLeft = 60;
      $scope.sliderBarWidth = 0;
      $scope.sliderWidth = 0;

      $scope.holdSlider = function($event) {
        $scope.isHold = true;
        $scope.sliderBarWidth = $event.target.parentNode.offsetWidth;
        $scope.sliderWidth = $event.target.offsetWidth;
        $scope.lastClientX = $event.clientX; // Resetting position when holding
      };

      $scope.releaseSlider = function() {
        $scope.isHold = false;
      };

      $scope.setSlider = function($event) {
        if ($event.target.id === 'slider') {
          return; // Do nothing if clicking on slider
        }

        $scope.sliderBarWidth = $event.target.offsetWidth;
        $scope.sliderWidth = $event.target.childNodes[1].offsetWidth;

        var sliderBarPosition = getPosition($event.target),
            marginLeft = $event.clientX - sliderBarPosition.x - $scope.sliderWidth / 2;

        setMarginLeft(marginLeft);
        setInterval($scope.marginLeft, $scope.sliderBarWidth);
      };

      $scope.moveSlider = function($event) {
        if ($scope.isHold) {
          var diff = $event.clientX - $scope.lastClientX;
          $scope.lastClientX = $event.clientX;

          setMarginLeft($scope.marginLeft + diff);
          setInterval($scope.marginLeft, $scope.sliderBarWidth);
        }
      };
    }]);
