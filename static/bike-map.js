if(typeof console == "undefined" || typeof console.log == "undefined"){
  console = { log: function(e){ } };
}

var map = L.map('map', {
  center: [ 42.32, -71.107292 ],
  zoom: 12,
  maxZoom: 17,
  zoomControl: false
});
map.attributionControl.setPrefix('<a href="#" onclick="credits();">About</a>');
map.addControl(L.control.zoom({ position: 'topright' }));

var basemap = L.esri.basemapLayer("Topographic").addTo(map);

var zoomedOut = false;
map.on('zoomend', function(){
  var zoom = map.getZoom();
  if(zoom >= 13 && zoomedOut){
    // zoom in style
    zoomedOut = false;
    for(var year in pathsByYears){
      for(var i=0;i<pathsByYears[year].length;i++){
        pathsByYears[year][i].layer.setStyle({ weight: 5 });
      }
    }
  }
  else if(zoom < 13 && !zoomedOut){
    // zoom out style
    zoomedOut = true;
    for(var year in pathsByYears){
      for(var i=0;i<pathsByYears[year].length;i++){
        pathsByYears[year][i].layer.setStyle({ weight: 2 });
      }
    }
  }
});

// add existing paths
var pathsByYears = { };
var minyear = 2008;
var currentyear = 2013;
var maxyear = currentyear + 2; // represents +5year and +30year plans

var stylesByType = {"PS":{"color":"#44f","label":"Paved Shoulder"},
"SUP":{"label":"Shared-Use Path","color":"rgb(107,207,50)"},
"CT1-1":{"label":"Cycle Track","color":"rgb(173,32,142)"},
"CT1-2":{"label":"Cycle Track","color":"rgb(173,32,142)"},
"CT2-1":{"label":"Cycle Track","color":"rgb(173,32,142)"},
"BFBL":{"label":"Buffered Bike Lane","color":"rgb(31,120,180)"},
"BL":{"label":"Bike Lane","color":"rgb(31,120,180)"},
"CL":{"label":"Bike Lane","color":"rgb(31,120,180)"},
"SRd":{"label":"Shared Road","color":"rgb(91,176,70)"},
"BSBL":{"label":"Bus-Bike Lane","color":"rgb(166,206,227)"},
"NW":{"label":"Neighborway","color":"rgb(166,206,227)"},
"CFBL":{"label":"Contraflow Bike Lane","color":"rgb(166,206,227)"},
"PSL":{"label":"Priority Shared Lane Markings","color":"rgb(166,206,227)"},
"ADV":{"label":"Advisory Lane","color":"rgb(166,206,227)"},
"CTReplace":{"label":"Cycle Track","color":"rgb(166,206,227)"},
"SLM":{"label":"Shared-Lane Marking","color":"rgb(166,206,227)"}};
var jurisdictions = {
  "0": "Unaccepted by city or town",
  "1": "Massachusetts Highway Department",
  "2": "City or Town accepted road",
  "3": "Department of Conservation and Recreation",
  "4": "Massachusetts Turnpike Authority",
  "5": "Massachusetts Port Authority",
  "B": "State College or University",
  "H": "Private",
  "M": "MBTA"
};

L.esri.featureLayer("http://zdgis01/ArcGIS/rest/services/dev_services/Bike_network_dev/FeatureServer/0", {
  onEachFeature: function(geojson, layer){
    styleLayer(geojson, layer, true);
    layer.bindPopup(describeLayer(geojson, layer, true));
    // add to timeline
    var adddate = geojson.properties.InstallDate || 0;
    if(typeof pathsByYears[adddate] == "undefined"){
      pathsByYears[adddate] = [ { layer: layer, id: geojson.properties.OBJECTID } ];
    }
    else{
      pathsByYears[adddate].push( { layer: layer, id: geojson.properties.OBJECTID } );
    }
  }
}).addTo(map);

function styleLayer(geojson, layer, isBuilt){
  isBuilt = false;
  if(isBuilt){
    if(geojson.properties.Spine){
      layer.setStyle({ color: "orange", opacity: 0.8 });
    }
    else{
      layer.setStyle({ color: "#44f", opacity: 0.8 });
    }
  }
  else{
    var identity = geojson.properties.ExisFacil || geojson.properties.Rec1 || geojson.properties.Rec2;
    layer.setStyle({ color: stylesByType[ identity ].color, opacity: 0.8 });
  }
}
function describeLayer(geojson, layer, isBuilt){
  var content = "";
  var identity = geojson.properties.ExisFacil || geojson.properties.Rec1;
  if(typeof geojson.properties.STREET_NAM != "undefined" && geojson.properties.STREET_NAM && geojson.properties.STREET_NAM.length){
    content += "<h4>" + geojson.properties.STREET_NAM + "</h4>";
    content += "<p>" + stylesByType[ identity ].label + "</p>";
  }
  else{
    content += "<h4>" + stylesByType[ identity ].label + "</h4>";
  }
  if(isBuilt && geojson.properties.InstallDate * 1){
    content += "<p>Installed " + geojson.properties.InstallDate + "</p>";
  }
  if(!isBuilt && typeof geojson.properties.Rec2 != "undefined" && geojson.properties.Rec2 && geojson.properties.Rec2.length && typeof stylesByType[ geojson.properties.Rec2 ] != "undefined"){
    content += "<p>Secondary recommendation: " + stylesByType[ geojson.properties.Rec2 ].label + "</p>";
  }
  if(typeof geojson.properties.JURISDICTI != "undefined" && geojson.properties.JURISDICTI !== null && geojson.properties.JURISDICTI.length){
    content += "<p>In jurisdiction of " + jurisdictions[ geojson.properties.JURISDICTI ] + "</p>";
  }
  if(typeof geojson.properties.KeyBus != "undefined" && geojson.properties.KeyBus && geojson.properties.KeyBus.length){
    content += "<p>Along bus route " + geojson.properties.KeyBus + "</p>";
  }
  if(typeof geojson.properties.Parking != "undefined" && geojson.properties.Parking && geojson.properties.Parking.length){
    content += "<p>Parking: " + geojson.properties.Parking + "</p>";
  }
  if(typeof geojson.properties.TravelLanes != "undefined" && geojson.properties.TravelLanes && geojson.properties.TravelLanes.length){
    content += "<p>Travel Lanes: " + geojson.properties.TravelLanes + "</p>";
  }
  return content;
}

// time slider on overlay
L.DomEvent.disableClickPropagation( $(".overlay-left")[0] );
var phases = ["static/tricycle.png", "static/trainingwheels.png", "static/regbike.png"];
preload(phases);
preload(["static/futurebike.png"]);

$("#yearslider").slider({
  min: minyear,
  value: currentyear,
  max: maxyear,
  range: "min",
  step: 1,
  slide: function(event, ui){
    updateMapTime( ui.value );
  }
});
function updateMapTime(uptoyear){
  if(uptoyear == maxyear-1){
    $("#year").text("+5 years");
    $("#bikesymbol")[0].src = "static/futurebike.png";
    if(showThirty){
      showThirty = false;
      map.removeLayer(thirtyBikes);
    }
    if(!showFive){
      showFive = true;
      map.addLayer(fiveBikes);
      var builtIDs = [ ];
      for(var year in pathsByYears){
        if(year == maxyear - 1){
          break;
        }
        for(var i=0;i<pathsByYears[year].length;i++){
          map.removeLayer( pathsByYears[year][i].layer );
          builtIDs.push( pathsByYears[year][i].id );
        }
      }
      if(!hidLTfive){
        hidLTfive = true;
        for(var i=0;i<pathsByYears[maxyear-1].length;i++){
          if( builtIDs.indexOf( pathsByYears[maxyear-1][i].id ) > -1 ){
            pathsByYears[maxyear-1][i].layer.setStyle({ opacity: 0.2 });
          }
        }
      }
    }
  }
  else if(uptoyear == maxyear){
    $("#year").text("+30 years");
    $("#bikesymbol")[0].src = "static/tandem.png";
    if(showFive){
      showFive = false;
      map.removeLayer(fiveBikes);
    }
    if(!showThirty){
      showThirty = true;
      map.addLayer(thirtyBikes);
      var builtIDs = [ ];
      for(var year in pathsByYears){
        if(year == maxyear){
          break;
        }
        for(var i=0;i<pathsByYears[year].length;i++){
          map.removeLayer( pathsByYears[year][i].layer );
          builtIDs.push( pathsByYears[year][i].id );
        }
      }
      if(!hidLTthirty){
        hidLTthirty = true;
        for(var i=0;i<pathsByYears[maxyear].length;i++){
          if( builtIDs.indexOf( pathsByYears[maxyear][i].id ) > -1 ){
            pathsByYears[maxyear][i].layer.setStyle({ opacity: 0.2 });
          }
        }
      }
    }
  }
  else{
    if(showFive || showThirty){
      showFive = false;
      showThirty = false;
      map.removeLayer(fiveBikes);
      map.removeLayer(thirtyBikes);
      for(var year in pathsByYears){
        for(var i=0;i<pathsByYears[year].length;i++){
          map.addLayer( pathsByYears[year][i].layer );
        }
      }
    }
    $("#year").text(uptoyear);
    var phase = Math.floor( (uptoyear-minyear) / (currentyear-minyear) * phases.length );
    phase = Math.min( phases.length-1, phase );
    $("#bikesymbol")[0].src = phases[phase];
  }
  for(var year in pathsByYears){
    if(year <= uptoyear){
      for(var i=0;i<pathsByYears[year].length;i++){
        map.hasLayer(pathsByYears[year][i].layer) || map.addLayer(pathsByYears[year][i].layer);
      }
    }
    else{
      for(var i=0;i<pathsByYears[year].length;i++){
        !map.hasLayer(pathsByYears[year][i].layer) || map.removeLayer(pathsByYears[year][i].layer);
      }
    }
  }
}

L.DomEvent.disableClickPropagation( $(".overlay-left")[1] );
$(".layer").click(function(e){
  //console.log(e.target);
  // get div level
  if(!$(e.target).hasClass("layer")){
    e.target = $(e.target).parent()[0];
  }

  // change layer UI
  if($(e.target).hasClass("layer-select")){
    $(e.target).removeClass("layer-select");
  }
  else{
    $(e.target).addClass("layer-select");
  }
  
  // edit map
  if(e.target.id == "hubway"){
    toggleHubway();
  }
  else if(e.target.id == "mbta"){
    toggleMBTA();
  }
  else if(e.target.id == "imagery"){
    toggleImagery();
  }
});

// future bike layer
var showFive = false;
var hidLTfive = false;
var showThirty = false;
var hidLTthirty = false;

var fiveBikes = L.esri.featureLayer("http://zdgis01/ArcGIS/rest/services/dev_services/Bike_network_dev/FeatureServer/1", {
  onEachFeature: function(geojson, layer){
    //console.log(geojson.properties);
    if(typeof pathsByYears[ maxyear-1 ] == "undefined" ){
      pathsByYears[ maxyear-1 ] = [ { layer: layer, id: geojson.properties.OBJECTID } ];
    }
    else{
      pathsByYears[ maxyear-1 ].push( { layer: layer, id: geojson.properties.OBJECTID } );
    }
    styleLayer(geojson, layer);
    layer.bindPopup( describeLayer(geojson, layer) );
  }
}).addTo(map);
if(!showFive){
  map.removeLayer(fiveBikes);
}

$("#seeplanned5").click(function(e){
  $("#yearslider").slider({ value: maxyear-1 });
  updateMapTime( maxyear-1 );
});

var thirtyBikes = L.esri.featureLayer("http://zdgis01/ArcGIS/rest/services/dev_services/Bike_network_dev/FeatureServer/2", {
  onEachFeature: function(geojson, layer){
    if(typeof pathsByYears[ maxyear ] == "undefined" ){
      pathsByYears[ maxyear ] = [ { layer: layer, id: geojson.properties.OBJECTID } ];
    }
    else{
      pathsByYears[ maxyear ].push( { layer: layer, id: geojson.properties.OBJECTID } );
    }
    styleLayer(geojson, layer);
    layer.bindPopup(describeLayer(geojson, layer));
  }
}).addTo(map);
if(!showThirty){
  map.removeLayer(thirtyBikes);
}

$("#seeplanned30").click(function(e){
  $("#yearslider").slider({ value: maxyear });
  updateMapTime( maxyear );
});

// imagery layer
var imagery = L.esri.basemapLayer("Imagery");
function toggleImagery(){
  if(map.hasLayer(imagery)){
    map.addLayer(basemap);
    map.removeLayer(imagery);
    $(".leaflet-tile-pane").removeClass("grayout");
  }
  else{
    map.addLayer(imagery);
    map.removeLayer(basemap);
    $(".leaflet-tile-pane").addClass("grayout");
  }
}

// hubway layer
var hubway = null;
function toggleHubway(){
  if(!hubway){
    hubway = L.esri.dynamicMapLayer("http://maps.cityofboston.gov/ArcGIS/rest/services/Assets/StreetAssets/MapServer", {
      opacity: 1,
      layers: [2]
    }).addTo(map);
    if( ! $("#hubway").hasClass("layer-select") ){
      // already disabled
      map.removeLayer( hubway );
    }
  }
  else if( $("#hubway").hasClass("layer-select") ){
    map.addLayer(hubway);
  }
  else{
    map.removeLayer(hubway);
  }
}

// mbta layer
var mbta = L.layerGroup();
var mbtaStations = L.layerGroup();
var mbtaColors = {
  GREEN: "#0f0",
  RED: "#f00",
  SILVER: "#bbb",
  BLUE: "#00f",
  ORANGE: "orange"
};
var stationStyle = {
  radius: 4,
  fillOpacity: 1,
  color: "#000",
  fillColor: "#fff"
}
function loadMBTAStations(data){
  for(var f=0;f<data.features.length;f++){
    L.circleMarker( [ data.features[f].geometry.y, data.features[f].geometry.x ], stationStyle )
      .bindPopup( data.features[f].attributes.STATION )
      .addTo(mbtaStations);
  }
}
function loadMBTALines(data){
  for(var f=0;f<data.features.length;f++){
    var gj = {
      type: "Feature",
      properties: data.features[f].attributes,
      geometry: {
        type: "LineString",
        coordinates: data.features[f].geometry.paths[0]
      }
    };
    mbta.addLayer(L.geoJson(gj, {
      style: function(feature){
        return { color: mbtaColors[ feature.properties.LINE ] };
      }
    }));
  }
}
function toggleMBTA(){
  if(map.hasLayer(mbta)){
    map.removeLayer(mbta);
    map.removeLayer(mbtaStations);
  }
  else{
    if(!mbta.getLayers().length){
      
      var s = document.createElement("script");
      s.type = "text/javascript";
      s.src = "http://maps.cityofboston.gov/ArcGIS/rest/services/Basemaps/basemap_SPF/MapServer/10/query?where=1%3D1&returnGeometry=true&outSR=4326&outFields=LINE,ROUTE&f=pjson&callback=loadMBTALines";
      document.body.appendChild(s);
      
      var s = document.createElement("script");
      s.type = "text/javascript";
      s.src = "http://maps.cityofboston.gov/ArcGIS/rest/services/Basemaps/basemap_SPF/MapServer/9/query?where=1%3D1&returnGeometry=true&outSR=4326&f=pjson&callback=loadMBTAStations";
      document.body.appendChild(s);
    }
    map.addLayer(mbta);
    map.addLayer(mbtaStations);
  }
}

function credits(){
  alert("Map by City of Boston; Training Wheels by Ribbla Team, from The Noun Project; Future Bike by Simon Child, from The Noun Project; Tandem Bike by James Evans, from the Noun Project");
}

function preload(srcs){
  var images = [ ];
  for(var i=0; i<srcs.length; i++){
    images[i] = new Image();
    images[i].src = srcs[i];
  }
}