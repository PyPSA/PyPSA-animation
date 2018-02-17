

function sum(array){
    var total = 0;
    for(var i=0; i < array.length; i++) { total += array[i]}
    return total
}


function half_pie(array, startAngle){
    var total = sum(array);
    var result = [];
    var angle = startAngle;
    for(var i=0; i < array.length; i++) {
	item = {};
	item["total"] = total;
	item["startAngle"] = angle;
	item["endAngle"] = angle + Math.PI*array[i]/total;
	angle = item["endAngle"];
	result.push(item);
    }
    return result;
}


//Width and height
var w = 500;
var h = 500;


//Scale links
var flow_scale = 1000;
var power_scale = 10;



//Current snapshot index; value sets start point
var snapshot_index = 0;

//Define map projection

var projection = d3.geo.mercator() //utiliser une projection standard pour aplatir les pôles, voir D3 projection plugin
    .center([ 9.3, 52 ]) //comment centrer la carte, longitude, latitude
    .translate([ w/2, h/2 ]) // centrer l'image obtenue dans le svg
    .scale([ w/0.68]); // zoom, plus la valeur est petit plus le zoom est gros

//Define path generator
var path = d3.geo.path()
    .projection(projection);


document.getElementById("timeslide").max=snapshots.length-1;

document.getElementById("timeslide").value = snapshot_index;

document.getElementById("range").innerHTML=snapshots[snapshot_index];


//Create SVG
var svg = d3.select("#right")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

var signs = ["positive","negative"];




//Load in GeoJSON data
d3.json("ne_50m_admin_0_countries_simplified.json", function(json) {


    //Legend
    for(var k=0; k < signs.length; k++) {
	var sign=signs[k];
	var legendSVG = d3.select("#legend-" + sign)
	    .append("svg")
	    .attr("width",180)
	    .attr("height",carriers[sign].index.length*20);

	var legend = legendSVG.selectAll("g")
	    .data(carriers[sign].index)
	    .enter()
	    .append("g")
	    .attr("transform", function (d, i) {  return "translate(0," + (5 + i * 20) + ")" });

	legend.append("rect")
	    .attr("x",0)
	    .attr("y",0)
	    .attr("width", 10)
	    .attr("height", 10)
	    .style("fill", function (d, i) { return carriers[sign].color[i] });

	legend.append("text")
	    .attr("x",20)
	    .attr("y",10)
	    .text(function (d) { return d});
    }

    var legendSVG = d3.select("#legend-scale")
	.append("svg")
        .attr("width",180)
        .attr("height",120);

    legendSVG.append("circle").attr("cx",20).attr("cy",15).attr("r",5000**0.5/power_scale).attr("fill","#FFFFFF").attr("stroke","black").attr("stroke-width",1);

    legendSVG.append("text").attr("x",40).attr("y",20).text("5 GW");

    legendSVG.append("circle").attr("cx",20).attr("cy",45).attr("r",25000**0.5/power_scale).attr("fill","#FFFFFF").attr("stroke","black").attr("stroke-width",1);

    legendSVG.append("text").attr("x",40).attr("y",50).text("25 GW");

    legendSVG.append("rect").attr("x",0).attr("y",70).attr("width",30).attr("height",1000/flow_scale).attr("fill","#999999");

    legendSVG.append("text").attr("x",40).attr("y",80).text("1 GW flow");

    legendSVG.append("rect").attr("x",0).attr("y",90).attr("width",30).attr("height",10000/flow_scale).attr("fill","#999999");

    legendSVG.append("text").attr("x",40).attr("y",100).text("10 GW flow");

    countries = svg.append("g")
        .attr("id","countries");

    //Bind data and create one path per GeoJSON feature
    countries.selectAll("path")
	.data(json.features)
	.enter()
	.append("path")
	.attr("d", path)
	.attr("stroke", "rgba(8, 81, 156, 0.2)")
	.attr("fill", "rgba(8, 81, 156, 0.01)");


    line_layer = svg.append("g")
        .attr("id","lines");


    lineFunction = d3.svg.line()
        .x(function(d) { return d[0] })
        .y(function(d) { return d[1] })
        .interpolate("linear");

    lines = line_layer.selectAll("path")
	.data(links.index)
	.enter()
	.append("path")
	.attr("d", function(d, i) {var from = 0; if(flows[snapshot_index][i] < 0){from = 1}; return lineFunction([projection([links["x" + from][i],links["y" + from][i]]),projection([links["x" + (1-from)][i],links["y" + (1-from)][i]])])})
        .attr("class", "flowline-animated")
        .attr("stroke-width", function(d, i) { return Math.abs(flows[snapshot_index][i])/flow_scale});


    // This is a function which transforms arc data into a path
    arc_path = d3.svg.arc()
        .innerRadius(0);

    // This is a function which turns a list of numbers into arc data (start angle, end angle,  etc.)
    pie = d3.layout.pie()
	.sort(null);

    startAngle = {"positive" : -Math.PI/2, "negative" : Math.PI/2};

    sign_layer = {};

    sign_locations = {};

    for(var k=0; k < signs.length; k++) {

	sign = signs[k];

	sign_layer[sign] = svg.append("g").attr("id",sign);


	sign_locations[sign] = sign_layer[sign].selectAll("g")
            .data(power[sign])
            .enter()
            .append("g")
            .attr("transform", function(d,i) { return "translate(" + projection([buses.x[i],buses.y[i]])[0] +","+ projection([buses.x[i],buses.y[i]])[1] + ")" } );



    sign_locations[sign].selectAll("path")
            .data(function(d) {return half_pie(d[snapshot_index], startAngle[sign])})
        .enter()
        .append("path")
        .attr("d", function(d) { return arc_path.outerRadius(d["total"]**0.5/power_scale)(d)})
	    .attr("class",sign)
        .style("fill", function(d, i) { return carriers[sign].color[i] });

    };

});


// when the input range changes update the value
d3.select("#timeslide").on("input", function() {
    update(+this.value);
});


function update(value) {
    snapshot_index = value;
    document.getElementById("range").innerHTML=snapshots[snapshot_index];

    line_layer.selectAll("path")
	.attr("d", function(d, i) {var from = 0; if(flows[snapshot_index][i] < 0){from = 1}; return lineFunction([projection([links["x" + from][i],links["y" + from][i]]),projection([links["x" + (1-from)][i],links["y" + (1-from)][i]])])})
        .attr("stroke-width", function(d, i) { return Math.abs(flows[snapshot_index][i])/flow_scale});

    for(var k=0; k < signs.length; k++) {

	sign = signs[k];

	// don't need enter() and append() here...
	sign_locations[sign].selectAll("path")
            .data(function(d) {return half_pie(d[snapshot_index], startAngle[sign])})
        .attr("d", function(d) { return arc_path.outerRadius(d["total"]**0.5/power_scale)(d)})
        .style("fill", function(d, i) { return carriers[sign].color[i] });
    }
}



// Inspired by https://bl.ocks.org/officeofjane/47d2b0bfeecfcb41d2212d06d095c763
var playButton = d3.select("#play-button");

var moving = false;

playButton
    .on("click", function() {
	var button = d3.select(this);
	if (button.text() == "Pause") {
	    moving = false;
	    clearInterval(timer);
	    // timer = 0;
	    button.text("Play");
	} else {
	    if(snapshot_index == snapshots.length-1){
		snapshot_index = -1;
	    }
	    moving = true;
	    // execute step every 100ms
	    timer = setInterval(step, 100);
	    button.text("Pause");
	}
	console.log("Slider moving: " + moving);
    });

function step() {

    if(snapshot_index == snapshots.length-1){
	moving = false;
	clearInterval(timer);
	// timer = 0;
	playButton.text("Play");
	console.log("Slider moving: " + moving);
    }
    else{
	snapshot_index += 1;
	document.getElementById("timeslide").value = snapshot_index;
	update(snapshot_index);
    }
}




var flowButton = d3.select("#flow-button");

flowButton
    .on("click", function() {
	var button = d3.select(this);
	if (button.text() == "Toggle flow animation: On") {
	    line_layer.selectAll("path")
		.attr("class", "flowline");
	    button.text("Toggle flow animation: Off");
	} else {
	    line_layer.selectAll("path")
	        .attr("class", "flowline-animated");
	    button.text("Toggle flow animation: On");
	}

    });
