(function() {

  var fs = require('fs')
  var path = require('path')
  var glob = require('glob')
  var async = require('async')
  var jsonfile = require('jsonfile')

  function startServer(params) {
    var app = params.app
    var argv = params.argv
    app.get('/plugin/fivestar/ratings.json', ratings)

    function ratings(req, res) {
      var report = {}

      glob('*', { cwd: argv.db }, allfiles)

      function allfiles(err, files) {
        if (err) return done(err)
        async.map(files||[], eachfile, done) 
      }

      function eachfile(file, done) {
        jsonfile.readFile(argv.db + '/' + file, {throws:false}, eachpage)

        function eachpage(err, page) {
          if (err) return done(err)
          var title = page.title || 'untitled'
          var story = page.story || []
          var synop = (page.story[0]||{}).text || 'empty'
          var stars = {}
          for (var i=0; i<story.length; i++) {
            var item = story[i]
            if(item && item.type && item.type == 'fivestar') {
              if(item.stars) {
                stars[item.text||'unlabled'] = parseInt(item.stars)
              }
            }
          }
          if(Object.keys(stars).length) {
            report[title] = stars
          }
          done (null, title)
        }
      }

      function done(err) {
        if (err) return res.send(err.message)
        res.set({'Content-type': 'application/json'})
        res.send(report)
      }
    }

  }


  module.exports = {
    startServer: startServer
  }

}).call(this)