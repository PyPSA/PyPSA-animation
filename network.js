
// Copyright 2018 Tom Brown

// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation; either version 3 of the
// License, or (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// License and more information at:
// https://github.com/PyPSA/PyPSA-animation



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

var lineFunction = d3.line()
    .x(function(d) { return d[0] })
    .y(function(d) { return d[1] })
    .curve(d3.curveLinear);


//Width and height
var w = 600;
var h = 600;


//Scale flow and power
var flow_scale = 1;
var power_scale = 0.3;

//interval for animation update in milliseconds
var animation_interval = 150;

var scenarios = [0,1,2,4,8];

//State variables - values define starting values
var snapshot_index = 0;

var scenario = 2;

var season = "summer";

var country_index = 0;


//Define map projection

var projection = d3.geoMercator() //utiliser une projection standard pour aplatir les pôles, voir D3 projection plugin
    .center([ 9.3, 52 ]) //comment centrer la carte, longitude, latitude
    .translate([ w/2, h/2 ]) // centrer l'image obtenue dans le svg
    .scale([ w/0.68]); // zoom, plus la valeur est petit plus le zoom est gros

//Define path generator
var path = d3.geoPath()
    .projection(projection);



//Create SVG
var svg = d3.select("#right")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

var signs = ["positive","negative"];


var files_to_load = ["snapshots","carriers","power","flow","buses","links"];

var network = {};

var animate_flows = true;


var parseDate = d3.timeParse("%Y-%m-%d %H:%M:00");

var formatDate = d3.timeFormat("%b %d %H:%M");


//recursively load files into network object
//function after is executed at the end

function load_data(after){

    var k = 0;

    function load_next(){

	if(k >= files_to_load.length){

	    for(var j=0; j < network.snapshots.length; j++) {
		network.snapshots[j] = parseDate(network.snapshots[j]);
	    }

	    after();
	    return;
	}

	var file_name = scenario + "-" + season + "/" + files_to_load[k] + ".json";

	d3.json(file_name, function(data){
	    network[files_to_load[k]] = data;
	    k++;
	    load_next();
	});
    }

    load_next();
}


//execute this function once all the data is loaded

function display_data(){

    document.getElementById("timeslide").max=network.snapshots.length-1;

    document.getElementById("timeslide").value = snapshot_index;

    document.getElementById("range").innerHTML=formatDate(network.snapshots[snapshot_index]);

    //Legend
    for(var k=0; k < signs.length; k++) {
	var sign=signs[k];

	// remove existing
	d3.select("#legend-" + sign).selectAll("svg").remove();

	var legendSVG = d3.select("#legend-" + sign)
	    .append("svg")
	    .attr("width",180)
	    .attr("height",network.carriers[sign].index.length*20);

	var legend = legendSVG.selectAll("g")
	    .data(network.carriers[sign].index)
	    .enter()
	    .append("g")
	    .attr("transform", function (d, i) {  return "translate(0," + (5 + i * 20) + ")" });

	legend.append("rect")
	    .attr("x",0)
	    .attr("y",0)
	    .attr("width", 10)
	    .attr("height", 10)
	    .style("fill", function (d, i) { return network.carriers[sign].color[i] });

	legend.append("text")
	    .attr("x",20)
	    .attr("y",10)
	    .text(function (d) { return d});
    }

    // remove existing
    d3.select("#legend-scale").selectAll("svg").remove();

    var legendSVG = d3.select("#legend-scale")
	.append("svg")
        .attr("width",180)
        .attr("height",150);

    //divide by 2 because only half of pie corresponds to total power
    legendSVG.append("circle").attr("cx",20).attr("cy",15).attr("r",(5/2)**0.5/power_scale).attr("fill","#FFFFFF").attr("stroke","black").attr("stroke-width",1);

    legendSVG.append("text").attr("x",40).attr("y",20).text("5 GW");

    legendSVG.append("circle").attr("cx",20).attr("cy",45).attr("r",(25/2)**0.5/power_scale).attr("fill","#FFFFFF").attr("stroke","black").attr("stroke-width",1);

    legendSVG.append("text").attr("x",40).attr("y",50).text("25 GW");


    legendSVG.append("path").attr("d",lineFunction([[0,75],[30,75]])).attr("class","capacityline").attr("stroke-width",1/flow_scale);

    legendSVG.append("text").attr("x",40).attr("y",80).text("1 GW capacity");

    legendSVG.append("path").attr("d",lineFunction([[0,95],[30,95]])).attr("class","capacityline").attr("stroke-width",10/flow_scale);

    legendSVG.append("text").attr("x",40).attr("y",100).text("10 GW capacity");


    legendSVG.append("path").attr("d",lineFunction([[0,125],[30,125]])).attr("class","flowline").attr("stroke-width",1/flow_scale);

    legendSVG.append("text").attr("x",40).attr("y",130).text("1 GW flow");

    legendSVG.append("path").attr("d",lineFunction([[0,145],[30,145]])).attr("class","flowline").attr("stroke-width",10/flow_scale);

    legendSVG.append("text").attr("x",40).attr("y",150).text("10 GW flow");

    // remove existing
    d3.select("g#lines").remove();

    line_layer = svg.append("g")
        .attr("id","lines");

    if(animate_flows){
	var cls = "flowline-animated";
    }
    else{
	var cls = "flowline";
    }

    line_layer.selectAll("path")
	.data(network.links.index)
	.enter()
	.append("path")
	.attr("d", function(d, i) {var from = 0; if(network.flow[snapshot_index][i] < 0){from = 1}; return lineFunction([projection([network.links["x" + from][i],network.links["y" + from][i]]),projection([network.links["x" + (1-from)][i],network.links["y" + (1-from)][i]])])})
        .attr("class", cls)
        .attr("stroke-width", function(d, i) { return Math.abs(network.flow[snapshot_index][i])/flow_scale});

    // remove existing
    d3.select("g#line_capacities").remove();

    line_capacity_layer = svg.append("g")
        .attr("id","line_capacities");

    line_capacity_layer.selectAll("path")
	.data(network.links.index)
	.enter()
	.append("path")
	.attr("d", function(d, i) { return lineFunction([projection([network.links.x0[i],network.links.y0[i]]),projection([network.links.x1[i],network.links.y1[i]])])})
        .attr("class", "capacityline")
        .attr("stroke-width", function(d, i) { return network.links.p_nom_opt[i]/flow_scale/1000});

    // This is a function which transforms arc data into a path
    arc_path = d3.arc()
        .innerRadius(0);

    startAngle = {"positive" : -Math.PI/2, "negative" : Math.PI/2};

    sign_layer = {};

    sign_locations = {};

    for(var k=0; k < signs.length; k++) {

	sign = signs[k];

	// remove existing
	d3.select("g#"+sign).remove();

	sign_layer[sign] = svg.append("g").attr("id",sign);


	sign_locations[sign] = sign_layer[sign].selectAll("g")
            .data(network.power[sign])
            .enter()
            .append("g")
            .attr("transform", function(d,i) { return "translate(" + projection([network.buses.x[i],network.buses.y[i]])[0] +","+ projection([network.buses.x[i],network.buses.y[i]])[1] + ")" } );



    sign_locations[sign].selectAll("path")
            .data(function(d) {return half_pie(d[snapshot_index], startAngle[sign])})
        .enter()
        .append("path")
        .attr("d", function(d) { return arc_path.outerRadius(d["total"]**0.5/power_scale)(d)})
	    .attr("class",sign)
        .style("fill", function(d, i) { return network.carriers[sign].color[i] });

    };

    // Create country selector
    var selectCountry = d3.select("#select-country").on('change', update_country);

    selectCountry.selectAll("option").remove();

    var options = selectCountry.selectAll('option')
	.data(network.buses.name).enter()
	.append('option')
	.text(function (d) { return d; });

    selectCountry.property("value", network.buses.name[country_index]);

    draw_graph_time();
}

function update_country(){
    var selectValue = d3.select('select').property('value');
    country_index = network.buses.name.indexOf(selectValue);
    console.log("country changed to", selectValue,"with index",country_index);
    draw_graph_time();


    var names = ["energy", "power"];

    for(var i=0; i < names.length; i++){
	draw_graph(names[i]);
    }
}



//graph parameters
var x = {};
var y = {};
var ymin = {};
var ymax = {};

function draw_graph_time(){

    var name = "time";

    // Inspired by https://bl.ocks.org/mbostock/3885211

    var svgGraph = d3.select("#graph"),
	margin = {top: 20, right: 20, bottom: 30, left: 50},
	width = svgGraph.attr("width") - margin.left - margin.right,
	height = svgGraph.attr("height") - margin.top - margin.bottom;

    // remove existing
    svgGraph.selectAll("g").remove();


    x[name] = d3.scaleTime().range([0, width]),
	y[name] = d3.scaleLinear().range([height, 0]);

    data = [];

    // Custom version of d3.stack

    var previous = new Array(network.snapshots.length).fill(0);

    for (var j = 0; j < network.carriers["positive"].index.length; j++){
	var item = [];
	for (var k = 0; k < network.snapshots.length; k++){
	    item.push([previous[k], previous[k] + network.power["positive"][country_index][k][j]]);
	    previous[k] = previous[k] + network.power["positive"][country_index][k][j];
	    }
	data.push(item);
    }

    var previous = new Array(network.snapshots.length).fill(0);

    for (var j = 0; j < network.carriers["negative"].index.length; j++){
	var item = [];
	for (var k = 0; k < network.snapshots.length; k++){
	    item.push([-previous[k] -network.power["negative"][country_index][k][j],-previous[k]]);
	    previous[k] = previous[k] + network.power["negative"][country_index][k][j];
	    }
	data.push(item);
    }


    ymin[name] = 0, ymax[name] = 0;
    for (var k = 0; k < network.snapshots.length; k++){
	if(data[network.carriers["positive"].index.length-1][k][1] > ymax[name]){ ymax[name] = data[network.carriers["positive"].index.length-1][k][1];};
	if(data[network.carriers["positive"].index.length+network.carriers["negative"].index.length-1][k][0] < ymin[name]){ ymin[name] = data[network.carriers["positive"].index.length+network.carriers["negative"].index.length-1][k][0];};
    };

    var area = d3.area()
        .x(function(d, i) { return x[name](network.snapshots[i]); })
        .y0(function(d) { return y[name](d[0]); })
        .y1(function(d) { return y[name](d[1]); });


    var g = svgGraph.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    x[name].domain(d3.extent(network.snapshots));
    y[name].domain([ymin[name],ymax[name]]);

    var layer = g.selectAll(".layer")
        .data(data)
        .enter().append("g")
        .attr("class", "layer");

    layer.append("path")
        .attr("class", "area")
        .style("fill", function(d, i) {if(i < network.carriers["positive"].color.length){ return network.carriers["positive"].color[i];} else{return network.carriers["negative"].color[i-network.carriers["positive"].color.length];} })
        .attr("d", area);

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x[name]));

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y[name]));

    var label = svgGraph.append("g").attr("class", "y-label");

    // text label for the y axis
    label.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Power [GW]");

    var indicator = g.append("g");

    indicator.append("path")
        .attr("d", lineFunction([[x[name](network.snapshots[snapshot_index]),y[name](ymin[name])],[x[name](network.snapshots[snapshot_index]),y[name](ymax[name])]]))
        .attr("id", "indicator")
        .attr("stroke", "#000000")
        .attr("stroke-width", 2);


}


var yLabel = {"energy" : "Yearly Energy [TWh/a]",
	      "power" : "Installed Capacity [GW]",
	      "cost" : "Yearly System Cost [EUR billion/a]"};

var yScale = {"energy" : 1e3,
	      "power" : 1,
	      "cost" :1e9};

function draw_graph(name){


    // Inspired by https://bl.ocks.org/mbostock/3885211

    var svgGraph = d3.select("#" + name),
	margin = {top: 20, right: 20, bottom: 35, left: 58},
	width = svgGraph.attr("width") - margin.left - margin.right,
	height = svgGraph.attr("height") - margin.top - margin.bottom;

    // remove existing
    svgGraph.selectAll("g").remove();


    x[name] = d3.scaleLinear().range([0, width]),
	y[name] = d3.scaleLinear().range([height, 0]);

    data = [];

    // Custom version of d3.stack

    var previousPos = new Array(scenarios.length).fill(0);
    var previousNeg = new Array(scenarios.length).fill(0);

    ymin[name] = 0, ymax[name] = 0;

    for (var j = 0; j < metrics[name][country_index][0].length; j++){
	var item = [];
	for (var k = 0; k < metrics[name][country_index].length; k++){
	    var contrib = metrics[name][country_index][k][j]/yScale[name];
	    if(contrib >= 0){
		item.push([previousPos[k], previousPos[k] + contrib]);
		previousPos[k] += contrib;
		if(previousPos[k] > ymax[name]){ ymax[name] = previousPos[k];};
	    }
	    else{
		item.push([previousNeg[k], previousNeg[k] + contrib]);
		previousNeg[k] += contrib;
		if(previousNeg[k] < ymin[name]){ ymin[name] = previousNeg[k];};
	    }
	}
	data.push(item);
    }

    var area = d3.area()
        .x(function(d, i) { return x[name](scenarios[i]); })
        .y0(function(d) { return y[name](d[0]); })
        .y1(function(d) { return y[name](d[1]); });


    var g = svgGraph.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    x[name].domain([scenarios[0],scenarios[scenarios.length-1]]);
    y[name].domain([ymin[name],ymax[name]]);

    var layer = g.selectAll(".layer")
        .data(data)
        .enter().append("g")
        .attr("class", "layer");

    layer.append("path")
        .attr("class", "area")
        .style("fill", function(d, i) { return metrics[name+"_colors"][i] })
        .attr("d", area);

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x[name]));

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y[name]));

    var label = svgGraph.append("g").attr("class", "y-label");

    // text label for the y axis
    label.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(yLabel[name]);

    var label = svgGraph.append("g").attr("class", "x-label");

    // text label for the y axis
    label.append("text")
        .attr("y", height+35)
        .attr("x", 30+width/2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("European cross-border transmission [x today's]");


    var indicator = g.append("g");

    indicator.append("path")
        .attr("d", lineFunction([[x[name](scenario),y[name](ymin[name])],[x[name](scenario),y[name](ymax[name])]]))
        .attr("id", name + "Indicator")
        .attr("stroke", "#000000")
        .attr("stroke-width", 2);


}



function after_load(){

    display_data();

    d3.json("metrics.json", function(json){
	metrics = json;

	var names = ["energy", "power", "cost"];

	for(var i=0; i < names.length; i++){
	    draw_graph(names[i]);
	}
    });
}



//Load in GeoJSON data
d3.json("ne_50m_admin_0_countries_simplified_europe.json", function(json) {

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

    load_data(after_load);
});


// when the scenario changes, reload the data

d3.selectAll("input[name='scenario']").on("change", function(){
    scenario = this.value;
    console.log("scenario changed to", scenario);
    load_data(display_data);

    var names = ["energy", "power", "cost"];

    for(var i=0; i < names.length; i++){
	name = names[i];
	d3.select("#" + name + "Indicator")
            .attr("d", lineFunction([[x[name](scenario),y[name](ymin[name])],[x[name](scenario),y[name](ymax[name])]]));
    }

});


// when the season changes, reload the data

d3.selectAll("input[name='season']").on("change", function(){
    season = this.value;
    console.log("season changed to", season);
    load_data(display_data);
});



// when the input range changes update the value
d3.select("#timeslide").on("input", function() {
    update_snapshot(+this.value);
});


function update_snapshot(value) {
    snapshot_index = value;
    document.getElementById("range").innerHTML=formatDate(network.snapshots[snapshot_index]);

    line_layer.selectAll("path")
	.attr("d", function(d, i) {var from = 0; if(network.flow[snapshot_index][i] < 0){from = 1}; return lineFunction([projection([network.links["x" + from][i],network.links["y" + from][i]]),projection([network.links["x" + (1-from)][i],network.links["y" + (1-from)][i]])])})
        .attr("stroke-width", function(d, i) { return Math.abs(network.flow[snapshot_index][i])/flow_scale});

    for(var k=0; k < signs.length; k++) {

	sign = signs[k];

	// don't need enter() and append() here...
	sign_locations[sign].selectAll("path")
            .data(function(d) {return half_pie(d[snapshot_index], startAngle[sign])})
        .attr("d", function(d) { return arc_path.outerRadius(d["total"]**0.5/power_scale)(d)})
        .style("fill", function(d, i) { return network.carriers[sign].color[i] });
    }


    var name = "time";

    var indicator = d3.select("#indicator")
        .attr("d", lineFunction([[x[name](network.snapshots[snapshot_index]),y[name](ymin[name])],[x[name](network.snapshots[snapshot_index]),y[name](ymax[name])]]));

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
	    if(snapshot_index == network.snapshots.length-1){
		snapshot_index = -1;
	    }
	    moving = true;
	    timer = setInterval(snapshot_step, animation_interval);
	    button.text("Pause");
	}
	console.log("Slider moving: " + moving);
    });

function snapshot_step() {

    if(snapshot_index == network.snapshots.length-1){
	moving = false;
	clearInterval(timer);
	// timer = 0;
	playButton.text("Play");
	console.log("Slider moving: " + moving);
    }
    else{
	snapshot_index += 1;
	document.getElementById("timeslide").value = snapshot_index;
	update_snapshot(snapshot_index);
    }
}




var flowButton = d3.select("#flow-button");

flowButton
    .on("click", function() {
	var button = d3.select(this);
	if (button.text() == "Toggle flow animation: On") {
	    animate_flows = false;
	    line_layer.selectAll("path")
		.attr("class", "flowline");
	    button.text("Toggle flow animation: Off");
	} else {
	    animate_flows = true;
	    line_layer.selectAll("path")
	        .attr("class", "flowline-animated");
	    button.text("Toggle flow animation: On");
	}

    });
