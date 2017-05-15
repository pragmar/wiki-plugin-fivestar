(function() {

  var fs = require('fs')
  var path = require('path')
  var glob = require('glob')
  var async = require('async')
  var jsonfile = require('jsonfile')
  var csvWriter = require('csv-write-stream')

  function startServer(params) {
    var app = params.app
    var argv = params.argv
    app.get('/plugin/fivestar/ratings.json', ratingsJson)
    app.get('/plugin/fivestar/ratings.csv', ratingsCsv)

    function ratingsCsv(req, res) {
      collectRatings(collectDone)
      function collectDone(err, report) {
        var heading = {}
        for (var page in report) {
          for (var rating in report[page]) {
            heading[rating] = true
          }
        }
        var headers = Object.keys(heading)
        var writer = csvWriter({headers: ['Title'].concat(headers)})
        writer.pipe(res)
        for (var page in report) {
          var row = report[page]
          writer.write([page].concat(headers.map(val)))
          function val(key) {return row[key]}
        }
        writer.end()
      }
    }

    function ratingsJson(req, res) {
      collectRatings(collectDone)
      function collectDone(err, report) {
        if (err) return res.send(err.message)
        res.set({'Content-type': 'application/json'})
        res.send(report)
      }
    }

    function collectRatings(ratingsDone) {
      var report = {}
      glob('*', { cwd: argv.db }, allfiles)
      function allfiles(err, files) {
        if (err) return done(err)
        async.map(files||[], eachfile, allfilesDone)
      }
      function allfilesDone(err) {
        if (err) return ratingsDone(err)
        ratingsDone(null, report)
      }
      function eachfile(file, eachFileDone) {
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
                stars[item.key||item.text||'unlabled'] = parseInt(item.stars)
              }
            }
          }
          if(Object.keys(stars).length) {
            report[title] = stars
          }
          eachFileDone(null, title)
        }
      }
    }
  }

  module.exports = {
    startServer: startServer
  }

}).call(this)