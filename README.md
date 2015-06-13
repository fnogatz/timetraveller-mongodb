# timetraveller-mongodb

Store and access GeoJSON LineStrings with time components in MongoDB. Have a look at [zeitpunkt](https://github.com/fnogatz/zeitpunkt#geojson-format) to get an example of the consumed GeoJSON data.

Although being primarily developed as database connector for [timetraveller](https://www.npmjs.org/package/timetraveller), this module can be used on its own to store and query GeoJSON LineStrings with time components, as they are used in [several other tools](https://github.com/fnogatz/zeitpunkt#compatible-tools).

## Usage

Create a database connection:

```javascript
var Model = require('timetraveller-mongodb')
var model = new Model({
  db: {
    host: 'localhost',
    port: 27017,
    name: 'some_db_name'
  }
})

model.connect(function onConnectionEstablished() {
  // model.connect() is called implicitly before
  //   any other method
})

// Do something

model.close()
```

### Import GeoJSON

Use `model.importGeoJSON()` to import a single GeoJSON LineString.

```javascript
var geojson = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [ /* array of [lng,lat] coordinates */ ]
  },
  properties: {
    time: [ /* array of timestamps */ ]
  }
}
model.importGeoJSON(geojson, function onFinish(err) {
  console.log('Done')
})
```

### Search database

You can query the stored trajectories by calling `model.findTrajectories()`. It takes a boundary box and time range.

```javascript
var query = {
  bounds: { // set bounding box
    west: 10.998195,
    east: 11.034775,
    south: 49.560791,
    north: 49.587847
  },
  time: {
    start: '2015-01-01 12:00',
    end: '2015-01-01 13:00'
  }
}
model.findTrajectories(query, function foundDocument(geojson) {
  console.log(geojson)
}, function queryFinished(err) {
  console.log('Done')
})
```

## Command Line

timetraveller-mongodb provides a command line tool to import newline delimited GeoJSON streams from `stdin` or search in all saved entries. You can easily use the `timetraveller-mongodb` executable after installing it as global module:

```shell
npm install -g timetraveller-mongodb
```

The import executable `timetraveller-mongodb import` consumes data from `stdin` as produced for example by [zeitpunkt](https://github.com/fnogatz/zeitpunkt) or [transportation](https://github.com/fnogatz/transportation#export-vehicles-positions-as-geojson).

Call `timetraveller-mongodb --help` to get a list of all commands and options.
