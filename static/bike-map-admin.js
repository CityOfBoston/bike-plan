L_PREFER_CANVAS = true;

if(typeof console == "undefined" || typeof console.log == "undefined"){
  console = { log: function(e){ } };
}

var map = L.map('map', {
  center: [ 42.32, -71.107292 ],
  zoom: 12,
  minZoom: 10,
  maxZoom: 17,
  zoomControl: false
});
map.attributionControl.setPrefix('<a href="#" onclick="credits();">About</a>');
map.addControl(L.control.zoom({ position: 'topright' }));

var basemap = L.tileLayer("http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}").addTo(map);

var zoomedOut = false;
var semitransparent = false;
map.on('zoomend', function(){
  var zoom = map.getZoom();
  if(zoom >= 15 && !semitransparent){
    semitransparent = true;
    for(var year in pathsByYears){
      for(var i=0;i<pathsByYears[year].length;i++){
        var opacity = 0;
        try{
          opacity = pathsByYears[year][i].layer.options.opacity;
        }
        catch(e){
          opacity = pathsByYears[year][i].layer.getLayers()[0].options.opacity;
        }
        if(opacity){
          pathsByYears[year][i].layer.setStyle({ opacity: 0.6 });
        }
      }
    }
  }
  else if(zoom < 15 && semitransparent){
    semitransparent = false;
    for(var year in pathsByYears){
      for(var i=0;i<pathsByYears[year].length;i++){
        var opacity = 0;
        try{
          opacity = pathsByYears[year][i].layer.options.opacity;
        }
        catch(e){
          opacity = pathsByYears[year][i].layer.getLayers()[0].options.opacity;
        }
        if(opacity){
          pathsByYears[year][i].layer.setStyle({ opacity: 0.8 });
        }
      }
    }
  }
  if(zoom >= 13 && zoomedOut){
    // zoom in style
    zoomedOut = false;
    for(var year in pathsByYears){
      for(var i=0;i<pathsByYears[year].length;i++){
        pathsByYears[year][i].layer.setStyle({ weight: 4 });
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

// prevent primary routes color scheme from messing up map
map.on('movestart', function(){
  if(showPrimary){
    $("#primary").removeClass("layer-select");
    togglePrimary();
  }
});

// use MapServer identify on IE8 mode
if(isIE() && isIE() <= 8){
  var formatServiceData = function(result, year){
    for(var attribute in result.attributes){
      if(result.attributes[attribute] == "Null"){
        result.attributes[attribute] = null;
      }
    }
    return describeLayer( { properties: {
      ExisFacil: result.attributes["Existing Facility"],
      Rec1: result.attributes["First Rec"],
      Rec2: result.attributes["Second Rec"],
      FiveYearPlan: result.attributes["FiveYearPlan"],
      InstallDate: result.attributes["Install Date"],
      JURISDICTI: result.attributes["Jurisdiction"],
      KeyBus: result.attributes["Key Bus Route"],
      Parking: result.attributes["Parking"],
      Spine: result.attributes["Spine"],
      STREET_NAM: result.attributes["Street Name"],
      TravelLanes: result.attributes["TravelLanes"]
    } }, null, year);
  }
  map.on("click", function(e){
    if(showFive){
      fiveBikes.identify(e.latlng, function(data){
        if(data.results.length){
          var popup = L.popup()
            .setLatLng(e.latlng)
            .setContent( formatServiceData(data.results[0], "five") )
            .openOn(map);
        }
      });
    }
    else if(showThirty){
      thirtyBikes.identify(e.latlng, function(data){
        if(data.results.length){
          var popup = L.popup()
            .setLatLng(e.latlng)
            .setContent( formatServiceData(data.results[0], "thirty") )
            .openOn(map);
        }
      });
    }
    else{
      // current
      currentBikes.identify(e.latlng, function(data){
        if(data.results.length){
          var popup = L.popup()
            .setLatLng(e.latlng)
            .setContent( formatServiceData(data.results[0], "current") )
            .openOn(map);
        }
      });
    }
  });
}

// map color band key
$(".thinkey").tooltip();
$(".thinkey").tooltip("enable");
$("#shareduse").tooltip({ content: "<h4 class='shareduse'>Shared Use Path</h4>Off-road pathway physically separated from traffic and designated for shared use or with an adjacent separated paths for bicyclists and pedestrians." });
$("#protected").tooltip({ content: "<h4 class='protected'>Protected Lane</h4><h4>Cycle Track</h4>Exclusive bicycle facility separated from motor vehicle lanes and sidewalks by fixed objects such as parked cars, curbing, bollards or flexposts." });
$("#exclusive").tooltip({ content: "<h4 class='exclusive'>Exclusive Lane</h4><h4>Bicycle Lane</h4>On-road bicycle facility designated for exclusive use by bicyclists through pavement markings and signs.<h4>Buffered Bicycle Lane</h4>Bicycle lane with an additional painted buffer to provide more separation from motor vehicles.<h4>Contraflow Bicycle Lane</h4>Bicycle lanes installed on a one-way street that allow bicyclists to travel in both directions while vehicular traffic remains one-way only.<h4>Climbing Bike Lane</h4>Bicycle lane in the uphill direction and shared lane markings in the downhill direction. Used on hills where there is insufficient space for a bike lane in both directions." });
$("#sharedlane").tooltip({ content: "<h4 class='sharedlane'>Shared Lane</h4><h4>Bus-Bicycle Lane</h4>Shared on-road facility designated only for bus and bicycle use.<h4>Shared Lane</h4>Shared bicycle and motor vehicle travel lanes denoted using pavement markings (commonly referred to as “sharrows”) and signs. Used in constrained corridors where the speed limit is no more than 35 MPH.<h4>Advisory Lanes</h4>Roadway with dashed bike lanes on both sides and no center line. Motor vehicles share the middle of the street and are permitted to enter the bike lane to give way to oncoming motor vehicles.<h4>Priority Shared Lane</h4>Shared lane with additional visual cues to denote bicycle priority and encourages motor vehicles to pass bicycles by switching lanes." });
$("#sharedroad").tooltip({ content: "<h4 class='sharedroad'>Shared Road</h4><h4>Shared Street</h4>Street with very slow speeds that allow all modes of travel to share one space (sidewalks are often blended with the roadway).<h4>Neighborway</h4>Also known as a bicycle boulevard, a neighborway is a quiet, low-volume residential street with added traffic calming. This type of slow street gives priority to bicyclists and pedestrians."});
$("#recommended").tooltip({ content: "<h4 class='recommended'>Recommended Local Route</h4>Unimproved quiet residential street that provides connectivity to neighborhood destinations and primary routes." });

$("#primaryrt").tooltip({ content: "<h4 class='primaryrt'>Primary Routes</h4>Primary routes connect neighborhood centers, regional multi-use paths, transit hubs, major employment centers, and institutional destinations." });
$("#secondaryrt").tooltip({ content: "<h4 class='secondaryrt'>Secondary Routes</h4>Secondary Routes stretch into neighborhoods and provide access to local businesses and neighborhood destinations." });


// add existing paths
var pathsByYears = { };
var minyear = 2007;
if(isIE() && isIE() <= 8){
  minyear = 2013;
}
var currentyear = 2013;
var fiveyear = currentyear + 3;
var maxyear = currentyear + 6; // represents +5year and +30year plans

var stylesByType = {"PS":{"color":"#44f","label":"Paved Shoulder"},
"SUP":{"label":"Shared-Use Path","color":"#4b9222"},
"CT1-1":{"label":"Cycle Track","color":"rgb(172,35,141)"},
"CT1-2":{"label":"Cycle Track","color":"rgb(172,35,141)"},
"CT2-1":{"label":"Cycle Track","color":"rgb(172,35,141)"},
"BFBL":{"label":"Buffered Bike Lane","color":"rgb(32,120,180)"},
"BL":{"label":"Bike Lane","color":"rgb(32,120,180)"},
"CL":{"label":"Bike Lane","color":"rgb(32,120,180)"},
  "SRd":{"label":"Shared Road","color":"rgb(107,207,50)"},
"BSBL":{"label":"Bus-Bike Lane","color":"rgb(166,206,227)"},
  "NW":{"label":"Neighborway","color":"rgb(107,207,50)"},
"CFBL":{"label":"Contraflow Bike Lane","color":"rgb(32,120,180)"},
"PSL":{"label":"Priority Shared Lane Markings","color":"rgb(166,206,227"},
"ADV":{"label":"Advisory Lane","color":"rgb(166,206,227)"},
"CTReplace":{"label":"Cycle Track","color":"rgb(0,0,0)"},
"LocalRoute":{"label":"Unimproved","color":"#FDE68C"},
"SLM":{"label":"Shared-Lane Marking","color":"rgb(166,206,227)"}};

var jurisdictions = {
  "0": "Jurisdiction: Unaccepted by city or town",
  "1": "Jurisdiction: Massachusetts Highway Department",
  "2": "Jurisdiction: City of Boston",
  "3": "Jurisdiction: Department of Conservation and Recreation",
  "4": "Jurisdiction: Massachusetts Turnpike Authority",
  "5": "Jurisdiction: Massachusetts Port Authority",
  "B": "Jurisdiction: State College or University",
  "H": "Jurisdiction: Private",
  "M": "Jurisdiction: MBTA"
};

var currentBikes;
if(isIE() && isIE() <= 8){
  currentBikes = L.esri.dynamicMapLayer("http://zdgis01/ArcGIS/rest/services/dev_services/Bike_network_dev/MapServer", {
    opacity: 1,
    layers: [0]
  });
}
else{
  currentBikes = L.esri.featureLayer("http://zdgis01/ArcGIS/rest/services/dev_services/Bike_network_dev/FeatureServer/0", {
    style: function(geojson){
      return styleLayer(geojson, "current");
    },
    onEachFeature: function(geojson, layer){
      var identity = geojson.properties.Rec1 || geojson.properties.ExisFacil;
      if(identity == "CTReplace"){
        return;
      }
      layer.bindPopup(describeLayer(geojson, layer, "current"));
      // add to timeline
      var adddate = geojson.properties.InstallDate || 0;
      var path = {
        layer: layer,
        five: (geojson.properties.FiveYearPlan || ""),
        existing: (geojson.properties.ExisFacil || ""),
        rec1: (geojson.properties.Rec1 || ""),
        spine: (geojson.properties.Spine || 0)
      };
      if(typeof pathsByYears[adddate] == "undefined"){
        pathsByYears[adddate] = [ path ];
      }
      else{
        pathsByYears[adddate].push( path );
      }
    }
  });
}
currentBikes.addTo(map);

function styleLayer(geojson, buildDate){

  var opacity = 0.8;
  if(semitransparent){
    opacity = 0.6;
  }
  
  if(geojson.properties.Network && !isNaN(geojson.properties.Network * 1) && geojson.properties.Network * 1 == 2){
    // local routes
    return { color: stylesByType[ "LocalRoute" ].color, opacity: opacity };
  }
  
  var identity;
  if(buildDate == "current"){
    identity = geojson.properties.ExisFacil;
  }
  else if(buildDate == "five" && geojson.properties.FiveYearPlan * 1 == 1.2){
    identity = geojson.properties.Rec2 || geojson.properties.Rec1;
  }
  else if(buildDate == "five" && geojson.properties.FiveYearPlan * 1 == 1.1){
    identity = geojson.properties.Rec1 || geojson.properties.Rec2;
  }
  else if(buildDate == "thirty"){
    identity = geojson.properties.Rec1 || geojon.properties.Rec2;
  }
  if(identity == "CTReplace"){
    opacity = 0;
  }
  return { color: stylesByType[ identity ].color, opacity: opacity };
}
function describeLayer(geojson, layer, buildDate){
  var content = "";
  var identity;
  // showCurrent / showFive / showThirty is not equivalent to buildDate. Some roads differ in current and thirty year plan but five year plan === current
  var showCurrent = false;
  var showFive = false;
  var showThirty = false;
  if(buildDate == "current"){
    identity = geojson.properties.ExisFacil;
    showCurrent = true;
  }
  else if(buildDate == "five"){
    if(!isNaN(geojson.properties.FiveYearPlan * 1)){
      showFive = true;
      if(geojson.properties.FiveYearPlan * 1 == 1.1){
        identity = geojson.properties.Rec1;
      }
      else if(geojson.properties.FiveYearPlan * 1 == 1.2){
        identity = geojson.properties.Rec2 || geojson.properties.Rec1;
      }
    }
  }
  else if(buildDate == "thirty"){
    if(!isNaN(geojson.properties.FiveYearPlan * 1)){
      identity = geojson.properties.Rec1;
      if(geojson.properties.FiveYearPlan * 1 == 1.1){
        showFive = true;
      }
      else{
        showThirty = true;
      }
    }
    else{
      showThirty = true;
      identity = geojson.properties.Rec1 || geojson.properties.Rec2;
    }
  }
  // LocalRoute overwrites existing facilities
  if(geojson.properties.Network && !isNaN(geojson.properties.Network * 1) && geojson.properties.Network * 1 == 2){
    identity = "LocalRoute";
  }
  
  if(typeof geojson.properties.STREET_NAM != "undefined" && geojson.properties.STREET_NAM && geojson.properties.STREET_NAM.length){
    content += "<h4>" + geojson.properties.STREET_NAM + "</h4><p>";
    content += "Facility: " + stylesByType[ identity ].label + "<br/>";
  }
  else{
    content += "<h4>Facility: " + stylesByType[ identity ].label + "</h4><p>";
  }
  
  if(identity == "LocalRoute"){
    content += "Status: NA<br/>";
  }
  else if(showCurrent && !isNaN(geojson.properties.InstallDate * 1) && geojson.properties.InstallDate * 1 != 0){
    content += "Status: Installed " + geojson.properties.InstallDate + "<br/>";
  }
  else if(showFive){
    content += "Status: To be installed, 5 Year Plan<br/>";
  }
  else if(showThirty){
    content += "Status: To be installed, 30 Year Plan<br/>";
  }
  
  if(identity == "LocalRoute"){
    content += "Route: Suggested<br/>";
  }
  else if(typeof geojson.properties.Spine != "undefined"){
    if(geojson.properties.Spine){
      content += "Route: Primary<br/>";
    }
    else{
      content += "Route: Secondary<br/>";
    }
  }

  if(typeof geojson.properties.JURISDICTI != "undefined" && geojson.properties.JURISDICTI !== null && geojson.properties.JURISDICTI.length){
    content += jurisdictions[ geojson.properties.JURISDICTI ] + "<br/>";
  }
  if(typeof geojson.properties["Current Owner"] != "undefined" && geojson.properties["Current Owner"] !== null && geojson.properties["Current Owner"].length){
    content += "Current owner: " + geojson.properties["Current Owner"] + "<br/>";  
  }
  if(typeof geojson.properties.KeyBus != "undefined" && geojson.properties.KeyBus){
    content += "Key Bus Route<br/>";
  }
  else{
    content += "Key Bus Route: NA<br/>";  
  }
  if(typeof geojson.properties.Parking != "undefined" && geojson.properties.Parking){
    content += "Parking Sides: " + geojson.properties.Parking + "<br/>";
  }
  else{
    content += "Parking Sides: NA<br/>";  
  }
  if(typeof geojson.properties.TravelLanes != "undefined" && geojson.properties.TravelLanes){
    content += "Travel Lanes: " + geojson.properties.TravelLanes + "<br/>";
  }
  
  // staff interface
  if(geojson.properties.DesignDate){
    content += "Design Date: " + geojson.properties.DesignDate + "<br/>";
  }
  if(geojson.properties.FUNCTIONAL){
    content += "Functional Classification: " + geojson.properties.FUNCTIONAL + "<br/>";
  }
  if(geojson.properties.Comments){
    content += "Comments: " + geojson.properties.Comments + "<br/>";
  }
  if(geojson.properties.Agent){
    content += "Agent: " + geojson.properties.Agent + "<br/>";
  }
  if(geojson.properties.Designer){
    content += "Designer: " + geojson.properties.Designer + "<br/>";
  }
  if(geojson.properties.EngStatus){
    content += "Engineering Status: " + geojson.properties.EngStatus + "<br/>";
  }
  if(geojson.properties.ProjectedInstallDate){
    content += "Projected Installation: " + geojson.properties.ProjectedInstallDate + "<br/>";
  }
  if(geojson.properties["ProjectID"]){
    content += "Project ID: " + geojson.properties["ProjectID"] + "<br/>";
  }
  if(geojson.properties["SubprojectID"]){
    content += "SubProject ID: " + geojson.properties["SubprojectID"] + "<br/>";
  }
  /*
  if(geojson.properties["Project Length"]){
    content += "Project Length: " + geojson.properties["Project Length"] + "<br/>";
  }
  if(geojson.properties["Subproject Length"]){
    content += "SubProject Length: " + geojson.properties["Subproject Length"] + "<br/>";
  }
  */
  if(geojson.properties["Implementer_Project_Type"]){
    content += "Implementer Project Type: " + geojson.properties["Implementer_Project_Type"] + "<br/>";
  }
  
  content += "</p>";
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
  if(uptoyear == fiveyear){
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
    if(isIE() && isIE() <= 8){
      $("#bikesymbol")[0].src = phases[2];
    }
    else{
      var phase = Math.floor( (uptoyear-minyear) / (currentyear-minyear) * phases.length );
      phase = Math.min( phases.length-1, phase );
      $("#bikesymbol")[0].src = phases[phase];
    }
    $("#bikesymbol").removeClass("future");
  }
  for(var year in pathsByYears){
    if(year <= uptoyear){
      for(var i=0;i<pathsByYears[year].length;i++){
        if(uptoyear == maxyear && pathsByYears[year][i].rec1){
          continue;
        }
        if(uptoyear == fiveyear && pathsByYears[year][i].rec1 && pathsByYears[year][i].five){
          continue;
        }
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
  else if(e.target.id == "primary"){
    togglePrimary();
  }
});

// future bike layers
var showFive = false;

var fiveBikes;

if(isIE() && isIE() <= 8){
  fiveBikes = L.esri.dynamicMapLayer("http://zdgis01/ArcGIS/rest/services/dev_services/Bike_network_dev/MapServer", {
    opacity: 1,
    layers: [1]
  });
}
else{
  fiveBikes = L.esri.featureLayer("http://zdgis01/ArcGIS/rest/services/dev_services/Bike_network_dev/FeatureServer/1", {
    style: function(geojson){
      return styleLayer(geojson, "five");
    },
    onEachFeature: function(geojson, layer){
      var path = {
        layer: layer,
        five: (geojson.properties.FiveYearPlan || ""),
        existing: (geojson.properties.ExisFacil || ""),
        rec1: (geojson.properties.Rec1 || ""),
        spine: (geojson.properties.Spine || 0)
      };
      if(typeof pathsByYears[ fiveyear ] == "undefined" ){
        pathsByYears[ fiveyear ] = [ path ];
      }
      else{
        pathsByYears[ fiveyear ].push( path );
      }
      var identity = geojson.properties.ExisFacil || geojson.properties.Rec1 || geojson.properties.Rec2;
      if(identity == "CTReplace"){
        return;
      }
      layer.bindPopup( describeLayer(geojson, layer, "five") );
    }
  });
}

var showThirty = false;

var thirtyBikes;
if(isIE() && isIE() <= 8){
  thirtyBikes = L.esri.dynamicMapLayer("http://zdgis01/ArcGIS/rest/services/dev_services/Bike_network_dev/MapServer", {
    opacity: 1,
    layers: [2]
  });
}
else{
  thirtyBikes = L.esri.featureLayer("http://zdgis01/ArcGIS/rest/services/dev_services/Bike_network_dev/FeatureServer/2", {
    style: function(geojson){
      return styleLayer(geojson, "thirty");
    },
    onEachFeature: function(geojson, layer){
      var path = {
        layer: layer,
        five: (geojson.properties.FiveYearPlan || ""),
        existing: (geojson.properties.ExisFacil || ""),
        rec1: (geojson.properties.Rec1 || ""),
        spine: (geojson.properties.Spine || 0)
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
      layer.bindPopup(describeLayer(geojson, layer, "thirty"));
    }
  });
}

// imagery layer
var imagery = L.tileLayer("http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}");
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
        return { color: mbtaColors[ geojson.properties.LINE ] };
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

// primary routes
var showPrimary = false;
function togglePrimary(){
  showPrimary = !showPrimary;
  if(showPrimary){
    $(".mainkey").css({ display: "none" });
    $(".primarykey").css({ display: "inline" });
    $("#primaryrt").css({ color: "orange", "background-color": "orange" });
    $("#secondaryrt").css({ color: "#aaa", "background-color": "#aaa" });
    $(".primaryrt").css({ color: "orange", "background-color": "orange" });
    $(".secondaryrt").css({ color: "#aaa", "background-color": "#aaa" });
  }
  else{
    $(".mainkey").css({ display: "inline" });
    $(".primarykey").css({ display: "none" });
  }
  for(var year in pathsByYears){
    var yearType = "current";
    if(year == fiveyear){
      yearType = "five";
    }
    if(year == maxyear){
      yearType = "thirty";
    }
    for(var i=0;i<pathsByYears[year].length;i++){
      if(showPrimary){
        if(typeof pathsByYears[year][i].color == "undefined"){
          try{
            pathsByYears[year][i].color = pathsByYears[year][i].layer.options.color;
            pathsByYears[year][i].opacity = pathsByYears[year][i].layer.options.opacity;
          }
          catch(e){
            pathsByYears[year][i].color = [ ];
            for(var c=0;c<pathsByYears[year][i].layer.getLayers().length;c++){
              pathsByYears[year][i].color.push( pathsByYears[year][i].layer.getLayers()[c].options.color );
            }
            pathsByYears[year][i].opacity = pathsByYears[year][i].layer.getLayers()[0].options.opacity;
          }
        }
        if(pathsByYears[year][i].spine){
          pathsByYears[year][i].layer.setStyle({ color: "orange" });
        }
        else{
          pathsByYears[year][i].layer.setStyle({ color: "#aaa" });
        }
      }
      else{
        var opacity = 0.8;
        if(semitransparent){
          opacity = 0.6;
        }
        if(!pathsByYears[year][i].opacity){
          opacity = 0;
        }
        if(typeof pathsByYears[year][i].color == "string"){
          pathsByYears[year][i].layer.setStyle({ color: pathsByYears[year][i].color, opacity: opacity });
        }
        else{
          for(var c=0;c<pathsByYears[year][i].layer.getLayers().length;c++){
            pathsByYears[year][i].layer.getLayers()[c].setStyle({ color: pathsByYears[year][i].color[c], opacity: opacity });
          }
        }
      }
    }
  }
}

function checkForEnter(e){
  if(e.keyCode == 13){
    streetSearch();
  }
}
function streetSearch(){
  var street = $("#searchbox").val();
  var s = document.createElement("script");
  s.type = "text/javascript";
  //s.src = "http://zdgis01/ArcGIS/rest/services/dev_services/Bike_network_dev/FeatureServer/2/query?where=STREET_NAM+LIKE+'%" + street + "%'&returnGeometry=true&outSR=4326&f=pjson&callback=streetCallback";
  s.src = "http://nominatim.openstreetmap.org/search?q=" + encodeURIComponent( street ) + ",+boston,+ma&format=json&json_callback=streetCallback";
  $(document.body).append(s);
}
function streetCallback(data){
  var north = -90;
  var south = 90;
  var east = -180;
  var west = 180;
  /*
  for(var f=0;f<data.features.length;f++){
    for(var c=0;c<data.features[f].geometry.paths[0].length;c++){
      north = Math.max(north, data.features[f].geometry.paths[0][c][1] );
      south = Math.min(south, data.features[f].geometry.paths[0][c][1] );
      east = Math.max(east, data.features[f].geometry.paths[0][c][0] );
      west = Math.min(west, data.features[f].geometry.paths[0][c][0] );
    }
  }
  */
  for(var p=0;p<data.length;p++){
    north = Math.max(north, data[p].boundingbox[1] );
    south = Math.min(south, data[p].boundingbox[0] );
    east = Math.max(east, data[p].boundingbox[3] );
    west = Math.min(west, data[p].boundingbox[2] );
  }
  if(north > south){
    map.fitBounds([[south, west], [north, east]]);
  }
}

function credits(){
  alert("Map by City of Boston; Training Wheels by Ribbla Team, from The Noun Project; Trail-a-Bike and Cargo Bike from Boston Bikes");
}

function isIE(){
  var myNav = navigator.userAgent.toLowerCase();
  return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
}
if(isIE() && isIE() <= 8){
  // currently blocking map layers on IE8
  alert("This map is in IE8 mode. Please upgrade Internet Explorer or use another browser.");

  // reduced functionality
  $(".thinkey").css({ visibility: "hidden" });
  $("#primary").css({ visibility: "hidden" });
}

function preload(srcs){
  var images = [ ];
  for(var i=0; i<srcs.length; i++){
    images[i] = new Image();
    images[i].src = srcs[i];
    images[i].style.display = "none";
    $(document.body).append(images[i]);
  }
}