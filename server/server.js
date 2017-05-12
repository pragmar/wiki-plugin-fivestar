(function() {

  var fs = require('fs')
  var path = require('path')
  var glob = require('glob')
  var async = require('async')
  var jsonfile = require('jsonfile')

  function startServer(params) {
    var app = params.app
    var argv = params.argv
    app.get('/plugin/fivestar/details/:stars/:stripes', details)
    app.get('/plugin/fivestar/slugs', slugs)

    function details(req, res) {
      var report = {}
      report.req = Object.keys(req)
      report.params = req.params
      report.query = req.query
      return res.send("<pre>" + (JSON.stringify(report, null, '  ')))
    }

    function slugs(req, res) {
      var report = {}

      glob(argv.db+'/*', { cwd: argv.packageDir }, allfiles)

      function allfiles(err, files) {
        if (err) return done(err)
        async.map(files||[], eachfile, done) 
      }

      function eachfile(file, done) {
        jsonfile.readFile(file, {throws:false}, eachpage)

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
                stars[item.text||'unlabled'] = item.stars
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
        res.send("<pre>" + (JSON.stringify(report, null, '  ')))
      }
    }

  }


  module.exports = {
    startServer: startServer
  }

}).call(this)