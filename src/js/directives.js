angular.module('alg.directives', [])
  .directive('barChart', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {dataset: '=', merge: '='},
      template: '<svg ng-attr-width="{{graph.width}}" ng-attr-height="{{graph.height}}">' +
        '    <rect ng-show="merge" ng-attr-style="{{data.bgStyle}}" ng-repeat="data in dataset"' +
        '        ng-attr-width="{{width()}}"' +
        '        ng-attr-height="{{height(data.bgVal)}}"' +
        '        ng-attr-x="{{x($index)}}"' +
        '        ng-attr-y="{{y(data.bgVal)}}">' +
        '    </rect>' +
        '    <rect ng-attr-style="{{data.style}}" ng-repeat="data in dataset"' +
        '        ng-attr-width="{{width()}}"' +
        '        ng-attr-height="{{height(data.val)}}"' +
        '        ng-attr-x="{{x($index)}}"' +
        '        ng-attr-y="{{auxY(data.val)}}">' +
        '    </rect>' +
        '</svg>',
      link: function(scope) {
        scope.graph = {
          width: 400,
          height: 200
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

          if (scope.merge) {
            return data / max * scope.graph.height / 2;
          } else {
            return data / max * scope.graph.height;
          }
        };

        scope.x = function(index) {
          return index * scope.width();
        };

        scope.y = function(data) {
          return scope.graph.height - scope.height(data);
        };

        scope.auxY = function(data) {
          if (scope.merge) {
            return scope.y(data) - scope.graph.height / 2;
          } else {
            return scope.y(data);
          }
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
