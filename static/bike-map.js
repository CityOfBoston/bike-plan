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
var minyear = 2007;
var currentyear = 2013;
var maxyear = currentyear + 2; // represents +5year and +30year plans

var stylesByType = {"PS":{"color":"#44f","label":"Paved Shoulder"},
"SUP":{"label":"Shared-Use Path","color":"rgb(107,207,50)"},
"CT1-1":{"label":"Cycle Track","color":"rgb(172,35,141)"},
"CT1-2":{"label":"Cycle Track","color":"rgb(172,35,141)"},
"CT2-1":{"label":"Cycle Track","color":"rgb(172,35,141)"},
"BFBL":{"label":"Buffered Bike Lane","color":"rgb(32,120,180)"},
"BL":{"label":"Bike Lane","color":"rgb(32,120,180)"},
"CL":{"label":"Bike Lane","color":"rgb(32,120,180)"},
  "SRd":{"label":"Shared Road","color":"rgb(78,166,47)"},
"BSBL":{"label":"Bus-Bike Lane","color":"rgb(166,206,227)"},
  "NW":{"label":"Neighborway","color":"rgb(78,166,47)"},
"CFBL":{"label":"Contraflow Bike Lane","color":"rgb(32,120,180)"},
"PSL":{"label":"Priority Shared Lane Markings","color":"rgb(166,206,227"},
"ADV":{"label":"Advisory Lane","color":"rgb(166,206,227)"},
"CTReplace":{"label":"Cycle Track","color":"rgb(0,0,0)"},
"SLM":{"label":"Shared-Lane Marking","color":"rgb(166,206,227)"}};

var jurisdictions = {
  "0": "Jurisdiction: Unaccepted by city or town",
  "1": "Jurisdiction of Massachusetts Highway Department",
  "2": "Jurisdiction of the City of Boston",
  "3": "Jurisdiction of Department of Conservation and Recreation",
  "4": "Jurisdiction of Massachusetts Turnpike Authority",
  "5": "Jurisdiction of Massachusetts Port Authority",
  "B": "Jurisdiction of State College or University",
  "H": "Jurisdiction: Private",
  "M": "Jurisdiction of MBTA"
};

var currentBikes = L.esri.featureLayer("http://maps.cityofboston.gov/ArcGIS/rest/services/BaseServices/Bike_network/FeatureServer/0", {
  style: function(geojson){
    return styleLayer(geojson, "current");
  },
  onEachFeature: function(geojson, layer){
    var identity = geojson.properties.ExisFacil || geojson.properties.Rec1 || geojson.properties.Rec2;
    if(identity == "CTReplace"){
      return;
    }
    layer.bindPopup(describeLayer(geojson, layer, true));
    // add to timeline
    var adddate = geojson.properties.InstallDate || 0;
    var path = {
      layer: layer,
      five: (geojson.properties.FiveYearPlan || ""),
      existing: (geojson.properties.ExisFacil || ""),
      rec1: (geojson.properties.Rec1 || "")
    };
    if(typeof pathsByYears[adddate] == "undefined"){
      pathsByYears[adddate] = [ path ];
    }
    else{
      pathsByYears[adddate].push( path );
    }
  }
}).addTo(map);

function styleLayer(geojson, buildDate){

  var opacity = 0.8;
  
  /*
  if(isBuilt){
    if(geojson.properties.Spine){
      layer.setStyle({ color: "orange", opacity: opacity });
    }
    else{
      layer.setStyle({ color: "#44f", opacity: opacity });
    }
  }
  */
  
  /*
  if(buildDate == "five" && geojson.properties.FiveYearPlan === null){
    opacity = 0.35;
  }
  else if(buildDate == "thirty" && (geojson.properties.FiveYearPlan || (geojson.properties.InstallDate || !geojson.properties.ExisFacil) && geojson.properties.Rec1)){
    opacity = 0.35;
  }
  */
  var identity = geojson.properties.ExisFacil || geojson.properties.Rec1 || geojson.properties.Rec2;
  if(identity == "CTReplace"){
    opacity = 0;
  }
  return { color: stylesByType[ identity ].color, opacity: opacity };
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
  if(typeof geojson.properties.Spine != "undefined"){
    if(geojson.properties.Spine){
      content += "<p>Primary Road</p>";
    }
    else{
      content += "<p>Secondary Road</p>";
    }
  }
  /*
  if(!isBuilt && typeof geojson.properties.Rec2 != "undefined" && geojson.properties.Rec2 && geojson.properties.Rec2.length && typeof stylesByType[ geojson.properties.Rec2 ] != "undefined"){
    content += "<p>Secondary recommendation: " + stylesByType[ geojson.properties.Rec2 ].label + "</p>";
  }
  */
  if(typeof geojson.properties.JURISDICTI != "undefined" && geojson.properties.JURISDICTI !== null && geojson.properties.JURISDICTI.length){
    content += "<p>" + jurisdictions[ geojson.properties.JURISDICTI ] + "</p>";
  }
  if(typeof geojson.properties.KeyBus != "undefined" && geojson.properties.KeyBus){
    content += "<p>Along key MBTA bus route</p>";
  }
  if(typeof geojson.properties.Parking != "undefined" && geojson.properties.Parking && geojson.properties.Parking.length){
    content += "<p>Parking: " + geojson.properties.Parking + "</p>";
  }
  if(typeof geojson.properties.TravelLanes != "undefined" && geojson.properties.TravelLanes){
    content += "<p>Travel Lanes: " + geojson.properties.TravelLanes + "</p>";
  }
  return content;
}

// time slider on overlay
L.DomEvent.disableClickPropagation( $(".overlay-left")[0] );
var phases = ["static/tricycle.png", "static/trainingwheels.png", "static/regbike.png"];
preload(phases);
preload(["static/CargoBike.png"]);
preload(["static/Trail-a-Bike.png"]);

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
    $("#bikesymbol")[0].src = "static/Trail-a-Bike.png";
    $("#bikesymbol").addClass("future");
    if(showThirty){
      showThirty = false;
      map.removeLayer(thirtyBikes);
    }
    if(!showFive){
      showFive = true;
      map.addLayer(fiveBikes);
      map.removeLayer(currentBikes);
    }
  }
  else if(uptoyear == maxyear){
    $("#year").text("+30 years");
    $("#bikesymbol").addClass("future");
    $("#bikesymbol")[0].src = "static/CargoBike.png";
    if(showFive){
      showFive = false;
      map.removeLayer(fiveBikes);
    }
    if(!showThirty){
      showThirty = true;
      map.addLayer(thirtyBikes);
      map.removeLayer(currentBikes);
    }
  }
  else{
    if(showFive || showThirty){
      showFive = false;
      showThirty = false;
      map.removeLayer(fiveBikes);
      map.removeLayer(thirtyBikes);
      map.addLayer(currentBikes);
    }
    $("#year").text(uptoyear);
    var phase = Math.floor( (uptoyear-minyear) / (currentyear-minyear) * phases.length );
    phase = Math.min( phases.length-1, phase );
    $("#bikesymbol")[0].src = phases[phase];
    $("#bikesymbol").removeClass("future");
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

// future bike layers
var showFive = false;

var fiveBikes = L.esri.featureLayer("http://maps.cityofboston.gov/ArcGIS/rest/services/BaseServices/Bike_network/FeatureServer/1", {
  style: function(geojson){
    return styleLayer(geojson, "five");
  },
  onEachFeature: function(geojson, layer){
    var path = {
      layer: layer,
      five: (geojson.properties.FiveYearPlan || ""),
      existing: (geojson.properties.ExisFacil || ""),
      rec1: (geojson.properties.Rec1 || "")
    };
    if(typeof pathsByYears[ maxyear-1 ] == "undefined" ){
      pathsByYears[ maxyear-1 ] = [ path ];
    }
    else{
      pathsByYears[ maxyear-1 ].push( path );
    }
    var identity = geojson.properties.ExisFacil || geojson.properties.Rec1 || geojson.properties.Rec2;
    if(identity == "CTReplace"){
      return;
    }
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

var showThirty = false;

var thirtyBikes = L.esri.featureLayer("http://maps.cityofboston.gov/ArcGIS/rest/services/BaseServices/Bike_network/FeatureServer/2", {
  style: function(geojson){
    return styleLayer(geojson, "thirty");
  },
  onEachFeature: function(geojson, layer){
    var path = {
      layer: layer,
      five: (geojson.properties.FiveYearPlan || ""),
      existing: (geojson.properties.ExisFacil || ""),
      rec1: (geojson.properties.Rec1 || "")
    };
    if(typeof pathsByYears[ maxyear ] == "undefined" ){
      pathsByYears[ maxyear ] = [ path ];
    }
    else{
      pathsByYears[ maxyear ].push( path );
    }
    var identity = geojson.properties.ExisFacil || geojson.properties.Rec1 || geojson.properties.Rec2;
    if(identity == "CTReplace"){
      return;
    }
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
      style: function(geojson){
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