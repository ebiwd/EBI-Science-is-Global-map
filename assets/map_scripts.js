// handy things:
// https://www.mapbox.com/mapbox.js/example/v1.0.0/markercluster-multiple-groups/
// https://github.com/Leaflet/Leaflet.markercluster#usage

L.mapbox.accessToken = 'pk.eyJ1Ijoia2hhd2tpbnNlYmkiLCJhIjoiY2ludTZ2M3ltMDBtNXczbTJueW85ZmJjNyJ9.u6SIfnrYvGe6WFP3fOtaVQ';

var geocoder = L.mapbox.geocoder('mapbox.places'),
    map = L.mapbox.map('map');

// show sunrise and sunset
// http://joergdietrich.github.io/Leaflet.Terminator/
// map.setView([30, daynightoverlay.getLatLngs()[0][700]['lng']], 2);
map.setView([30, 10], 3);
// daynightoverlay.addTo(map);

// setInterval(function(){updateTerminator(daynightoverlay)}, 2000);

L.tileLayer(
  'https://api.mapbox.com/styles/v1/khawkinsebi/cio2mav7q0018c2nk2vvg8xgt/tiles/{z}/{x}/{y}?access_token=' + L.mapbox.accessToken, {
      // maxZoom: 6,
      // minZoom: 3,
      tileSize: 512,
      zoomOffset: -1,
      attribution: '© <a href="//www.ebi.ac.uk/about">EMBL-EBI</a> © <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

map.options.maxZoom = 6;
map.options.minZoom = 1;

var clusterSizeFactor = function(passedClusterSize) { // how we size the clusters
  pixelIncrease = 20; // constant to ensure a minimum size
  return (Math.sqrt(passedClusterSize) * 5) + pixelIncrease;
}

function newMarkerClusterGroup(clusterColors,targetClusterCSSClass,clusterPopUpHTML) {
  var clusterName = new L.MarkerClusterGroup({
    spiderfyOnMaxZoom: false,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: false,
    maxClusterRadius: 20,
    // chunkedLoading: true,
    // chunkDelay: 5,
    // chunkInterval: 10,
    // animate: true,
    // animateAddingMarkers: true,
    iconCreateFunction: function(cluster) {
      var numberToShow = '',
          sizeClass = '';
      // show the number of results for more than 15
      if (cluster.getChildCount() > 15) {
        numberToShow = cluster.getChildCount();
      }
      // make it "big" if more than 35
      if (cluster.getChildCount() > 40) {
        sizeClass = 'big-cluster';
      }
      var factoredSize = clusterSizeFactor(cluster.getChildCount());
      return markerIcon = new L.DivIcon({
        iconSize: [factoredSize, factoredSize],
        html: '<div class="' + targetClusterCSSClass + ' ' + sizeClass + '" style="border-radius:'+ factoredSize + 'px; line-height:'+ factoredSize + 'px; border: 1px solid rgb(202,210,211); ">' + numberToShow + '</div>'
      });

    }
  });


  clusterName.on('clustermouseover', function(ev) {
    // Child markers for this cluster are a.layer.getAllChildMarkers()
    L.popup().setLatLng(ev.latlng).setContent(clusterPopUpHTML).openOn(map);
  });
  clusterName.on('clustermouseout', function(ev) {
    map.closePopup();
  });

  return clusterName;
}

// Progressivley load and unload nodes based on the number of nodes to move, and how quickly we pull data.
// We do this so the maps is less chunky adding and removing data.
function addNodes(targetClusterGroup,queueToAdd) {

  targetClusterGroup = window[targetClusterGroup]; // reattach passed string to mapbox layer

  var nodeToProcess = queueToAdd.pop();

  if ((nodeToProcess._latlng.lat == '0') && (nodeToProcess._latlng.lng == '0')) {
    return false; // exit if the location didn't geocode
  }

  // add dot to map
  targetClusterGroup.addLayer(nodeToProcess);
}



// setup colours and markercluster objects
var counter = 0;
var markerClustersCurrentColor = 'rgba(168,200,19,.8)',
    markerClustersPreviousColor = 'rgba(235,98,9,.8)',
    markerClustersAlumniColor = 'rgba(29,92,116,.8)';
// var markerClustersTemporary = newMarkerClusterGroup(markerClustersCurrentColor); // we use for data processing only
var markerClustersCurrent = newMarkerClusterGroup(markerClustersCurrentColor,'markerClustersCurrent','<span style="color:' + markerClustersCurrentColor + '">EMBL-EBI request</span>'),
    markerClustersPrevious = newMarkerClusterGroup(markerClustersPreviousColor,'markerClustersPrevious','<span style="color:' + markerClustersPreviousColor + '">Portal request</span>'),
    markerClustersAlumni = newMarkerClusterGroup(markerClustersAlumniColor,'markerClustersAlumni','<span style="color:' + markerClustersAlumniColor + '">UniProt request</span>');

map.addLayer(markerClustersCurrent);
map.addLayer(markerClustersPrevious);
map.addLayer(markerClustersAlumni);

// http://leafletjs.com/reference.html#path-options
function markerOptions(layer) {
  return {opacity: 0, fillOpacity: 1, radius: 3, color: '#000'};
}

window.googleDocCallback = function () {console.log('test'); return true; };

// var xhr = new XMLHttpRequest();
// xhr.open('GET', 'https://docs.google.com/spreadsheets/d/1AZ1X5ymkZOYfSY_l7litP5vt1aKDgKBat5neUufq9Rk/pub?gid=651837424&single=true&output=csv&callback=googleDocCallback', true);
// xhr.onload = function (e) {
//   if (xhr.readyState === 4) {
//     if (xhr.status === 200) {
//       console.log(xhr.responseText);
//     } else {
//       console.error(xhr.statusText);
//     }
//   }
// };
// xhr.onerror = function (e) {
//   console.error(xhr.statusText);
// };
// xhr.send(null);
//
// console.log(xhr);

// pull the data
$.ajax({
  type: "GET",
  // url: 'assets/data.csv',
  // use YQL as a proxy to avoid CORS issues
  // and we convert CSV to JSON!
  url: 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20csv%20where%20url%3D%27https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1AZ1X5ymkZOYfSY_l7litP5vt1aKDgKBat5neUufq9Rk%2Fpub%3Fgid%3D651837424%26output%3Dcsv%27&format=json',
  // url: 'https://docs.google.com/spreadsheets/d/1AZ1X5ymkZOYfSY_l7litP5vt1aKDgKBat5neUufq9Rk/pub?gid=651837424&output=txt',
  // url: 'https://docs.google.com/spreadsheets/d/1AZ1X5ymkZOYfSY_l7litP5vt1aKDgKBat5neUufq9Rk/pub?gid=651837424&single=true&output=csv',
  // dataType: "text",
  success: function(data, textStatus, request) {
    // data = data.replace(/(?:\r\n|\r|\n)/g, '; ');
    // console.log(data);
    // data = csvJSON(data);

    data = data['query']['results']['row'][1];

    // console.log(data);

    // cleanup
    // data = data.replace(/"\\"/g, '"'); // double quote at start
    // data = data.replace(/\\""/g, '"'); // double quote at end
    // data = data.replace(/nope;/g, '');
    // data = data.replace(/No idea;/g, '');

    // console.log(data);
    // data = JSON.parse(data)[0];
    // console.log(data);

    var parsedData = ['born','unniversity','first_job','work_previous','work_now','work_future'];

    $.each(data, function(index, value) {
      // console.log(index,value);
      var dataRow = value.split(';');
      for (var i = 0; i < dataRow.length; i++) {
        // console.log(dataRow[i]);
        geocoder.query(dataRow[i], addPoint);
      }
    });

    // geocoder.query('Chester, NJ', addPoint);

    function addPoint(err, geoResponse) {
      // The geocoder can return an area, like a city, or a
      // point, like an address. Here we handle both cases,
      // by fitting the map bounds to an area or zooming to a point.
      // console.log(err,geoResponse);

      if (geoResponse.latlng) {
        L.circleMarker([geoResponse.latlng[0], geoResponse.latlng[1]],markerOptions('tocome')).addTo(map);
      }
      if (geoResponse.lbounds) {
        // L.marker([-45, -45]).addTo(map);
        // map.fitBounds(geoResponse.lbounds);
      } else if (geoResponse.latlng) {
        // map.setView([geoResponse.latlng[0], geoResponse.latlng[1]], 13);
      }
    }

    // var markerClustersTemporary = [];
    //
    // // add to marker group
    // var a = marker.feature.geometry.coordinates;
    // // var title = 'tesdt';
    // var markerNode = L.circleMarker(new L.LatLng(a[1], a[0]), {
    //   stroke: true,
    //   color: 'rgb(202,210,211)',
    //   weight: '1',
    //   // fillColor: targetClusterGroupColor,
    //   fillOpacity: '.4'
    // });
    // markerNode.setRadius(5);
    // // markerNode.bindPopup(title);
    // // group the layers by data source
    // var targetLayer = marker.feature.properties['target-layer'];
    // if (markerClustersTemporary[targetLayer] == undefined) { markerClustersTemporary[targetLayer] = []; }
    // markerClustersTemporary[targetLayer].push(markerNode);

    // process new nodes
    // for(var index in markerClustersTemporary) {
    //   addNodes(index,markerClustersTemporary[index]);
    // }

  }
});
