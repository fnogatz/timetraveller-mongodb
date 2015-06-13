module.exports = Model

var Db = require('mongodb').Db
var Server = require('mongodb').Server

function Model (options) {
  this._databases = [ 'MongoDB' ]
  this._db = null

  this._setConfig(options)
}

Model.prototype._setConfig = function _setConfig (options) {
  options.db = options.db || {}

  this._options = {}
  this._options.db = {
    host: options.db.host || 'localhost',
    port: options.db.port || 27017,
    database: options.db.database || options.db.name || 'timetraveller'
  }
}

Model.prototype.connect = function connect (callback) {
  var self = this
  callback = callback || function () {}

  var server = new Server(this._options.db.host, this._options.db.port)
  var db = new Db(this._options.db.database, server)
  db.open(function (err, db) {
    if (err) {
      return callback(err)
    }

    self._db = db

    return callback(null)
  })
}

Model.prototype.close = function close (callback) {
  this._db.close(callback)
}

Model.prototype.importGeoJSON = function importGeoJSON (geojson, options, callback) {
  if (!callback) {
    callback = options
    options = {}
  }

  var positions = this._db.collection('positions')
  var trajectories = this._db.collection('trajectories')
  var id = null

  var running = 0

  running++
  trajectories.insert(geojson, function (err, docs) {
    if (err) {
      throw err
    }

    id = geojson._id

    running--

    running += geojson.geometry.coordinates.length
    geojson.geometry.coordinates.forEach(function (pos, i) {
      var time = new Date(geojson.properties.time[i])

      var obj = {
        x: pos[0],
        y: pos[1],
        d: time,
        t: id
      }

      positions.insert(obj, function (err) {
        if (err) {
          throw err
        }

        running--
        checkForFinish()
      })
    })
  })

  function checkForFinish () {
    if (running === 0) {
      callback(null)
      return
    }
  }
}

Model.prototype.findTrajectories = function findTrajectories (query, documentCb, finishCb) {
  var self = this
  var args = arguments

  if (!this._db) {
    this.connect(function (err) {
      if (err) {
        return finishCb(err)
      }

      return self.findTrajectories.apply(self, args)
    })
    return
  }

  var positions = this._db.collection('positions')
  var trajectories = this._db.collection('trajectories')

  var bounds = query.bounds
  var time = query.time

  if (!(time.start instanceof Date)) {
    time.start = new Date(time.start)
  }
  if (!(time.end instanceof Date)) {
    time.end = new Date(time.end)
  }

  var qry = {
    'x': {
      '$gte': bounds.west,
      '$lte': bounds.east
    },
    'y': {
      '$gte': bounds.south,
      '$lte': bounds.north
    },
    'd': {
      '$gte': time.start,
      '$lte': time.end
    }
  }

  var running = 0

  running++
  positions.distinct('t', qry, function (err, ids) {
    if (err) {
      console.error(err)
    }

    if (!ids || ids.length === 0) {
      // Nothing found
      return
    }

    running--
    running += ids.length

    ids.forEach(function (id) {
      trajectories.findOne({
        '_id': id
      }, function (err, doc) {
        if (err) {
          return finishCb(err)
        }

        documentCb(doc)

        running--
        checkForFinish()
      })
    })
  })

  function checkForFinish () {
    if (running === 0) {
      finishCb(null)
      return
    }
  }
}
