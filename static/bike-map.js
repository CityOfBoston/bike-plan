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

// add existing paths
var pathsByYears = { };
var minyear = 2008;
var currentyear = 2013;
var maxyear = currentyear + 1; // represents future

/*var stylesByType = {
  PS: {
    color: "#44f",
    label: "Paved Shoulder"
  }
};
var s = document.createElement('script');
s.type = "text/javascript";
s.src = "http://zdgis01/ArcGIS/rest/services/dev_services/Bike_network_dev/FeatureServer/1?f=pjson&callback=setStyles";
document.body.appendChild(s);
function processColor(esriColor){
  if(esriColor.length > 3){
    esriColor = esriColor.slice(0,3).join(",");
  }
  // replace unfit colors
  if(esriColor == "93,107,50"){
    esriColor = "107,207,50";
  }
  return "rgb(" + esriColor + ")";
}
function setStyles(styleinfo){
  styleinfo = styleinfo.drawingInfo.renderer.uniqueValueInfos;
  for(var d=0;d<styleinfo.length;d++){
    stylesByType[ styleinfo[d].value ] = {
      label: styleinfo[d].label,
      color: processColor( styleinfo[d].symbol.color )
    };
  }*/

var stylesByType = {"PS":{"color":"#44f","label":"Paved Shoulder"},"SUP":{"label":"Shared-Use Path","color":"rgb(107,207,50)"},"CT1-1":{"label":"Cycle Track","color":"rgb(173,32,142)"},"CT1-2":{"label":"Cycle Track","color":"rgb(173,32,142)"},"CT2-1":{"label":"Cycle Track","color":"rgb(173,32,142)"},"BFBL":{"label":"Buffered Bike Lane","color":"rgb(31,120,180)"},"BL":{"label":"Bike Lane","color":"rgb(31,120,180)"},"CL":{"label":"Bike Lane","color":"rgb(31,120,180)"},"SRd":{"label":"Shared Road","color":"rgb(91,176,70)"},"BSBL":{"label":"Bus-Bike Lane","color":"rgb(166,206,227)"},"SLM":{"label":"Shared-Lane Marking","color":"rgb(166,206,227)"}};


/*
var existingBikes = L.esri.featureLayer("http://zdgis01/ArcGIS/rest/services/dev_services/Bike_network_dev/FeatureServer/1", {
  onEachFeature: function(geojson, layer){*/
$.getJSON("static/currentRoutes.geojson", function(data){
  for(var i=0;i<data.features.length;i++){
    var geojson = data.features[i];
    var layer = L.geoJson( geojson ).addTo(map);
      // set color
      if(typeof stylesByType[ geojson.properties.ExisFacil ] == "undefined"){
        stylesByType[ geojson.properties.ExisFacil ] = { color: null, label: "" };
      }
      layer.setStyle({ color: stylesByType[ geojson.properties.ExisFacil ].color, opacity: 0.8, clickable: true });
      // add popup
      var content;
      if(typeof geojson.properties.STREET_NAM != "undefined" && geojson.properties.STREET_NAM && geojson.properties.STREET_NAM.length){
        content = "<h4>" + geojson.properties.STREET_NAM + "</h4>";
        content += "<p>" + stylesByType[ geojson.properties.ExisFacil ].label + "</p>";
      }
      else{
        content = "<h4>" + stylesByType[ geojson.properties.ExisFacil ].label + "</h4>";
      }
      if(geojson.properties.InstallDate * 1){
        content += "<p>Installed " + geojson.properties.InstallDate + "</p>";
      }
      layer.bindPopup(content);
      // add to timeline
      var adddate = geojson.properties.InstallDate || 0;
      if(typeof pathsByYears[adddate] == "undefined"){
        pathsByYears[adddate] = [ layer ];
      }
      else{
        pathsByYears[adddate].push( layer );
      }
    }
});
//}).addTo(map);
//}

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
  if(uptoyear >= maxyear){
    $("#year").text("Future");
    $("#bikesymbol")[0].src = "static/futurebike.png";
    if(!showFuture){
      showFuture = true;
      nextBikes.setStyle({ opacity: 0.8, clickable: true });
    }
  }
  else{
    if(showFuture){
      showFuture = false;
      nextBikes.setStyle({ opacity: 0, clickable: false });
    }
    $("#year").text(uptoyear);
    var phase = Math.floor( (uptoyear-minyear) / (currentyear-minyear) * phases.length );
    phase = Math.min( phases.length-1, phase );
    $("#bikesymbol")[0].src = phases[phase];
  }
  for(var year in pathsByYears){
    if(year <= uptoyear){
      for(var i=0;i<pathsByYears[year].length;i++){
        map.hasLayer(pathsByYears[year][i]) || map.addLayer(pathsByYears[year][i]);
      }
    }
    else{
      for(var i=0;i<pathsByYears[year].length;i++){
        !map.hasLayer(pathsByYears[year][i]) || map.removeLayer(pathsByYears[year][i]);
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
var showFuture = false;
var nextBikes = L.esri.featureLayer("http://zdgis01/ArcGIS/rest/services/dev_services/Bike_network_dev/FeatureServer/0", {
  onEachFeature: function(geojson, layer){
    //console.log(geojson.properties);
    if(typeof stylesByType[ geojson.properties.Rec1 ] == "undefined"){
      stylesByType[ geojson.properties.Rec1 ] = { color: null, label: "" };
    }
    layer.setStyle({ color: stylesByType[ geojson.properties.Rec1 ].color, opacity: 0.8, clickable: true });
    var content;
    if(typeof geojson.properties.STREET_NAM != "undefined" && geojson.properties.STREET_NAM && geojson.properties.STREET_NAM.length){
      content = "<h4>" + geojson.properties.STREET_NAM + "</h4>";
      content += "<p>" + stylesByType[ geojson.properties.Rec1 ].label + "</p>";
    }
    else{
      content = "<h4>" + stylesByType[ geojson.properties.Rec1 ].label + "</h4>";
    }
    layer.bindPopup(content);
    showFuture || layer.setStyle({ opacity: 0, clickable: false });
  }
}).addTo(map);
if(showFuture){
  nextBikes.setStyle({ opacity: 0.8, clickable: true });
}
else{
  nextBikes.setStyle({ opacity: 0, clickable: false });
}
$("#seeplanned").click(function(e){
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
  alert("Map by City of Boston; Training Wheels by Ribbla Team, from The Noun Project; Future Bike by Simon Child, from The Noun Project");
}

function preload(srcs){
  var images = [ ];
  for(var i=0; i<srcs.length; i++){
    images[i] = new Image();
    images[i].src = srcs[i];
  }
}