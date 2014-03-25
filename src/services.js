angular.module('alg.services', [])
  .service('Shuffler', function() {
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
    };
    return Splitter;
  })
