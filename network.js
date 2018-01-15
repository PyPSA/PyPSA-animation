


function index(array) {
    var result = [];
    for(var i=0; i < array.length; i++) { result.push(i)}
    return result
}

//Width and height
var w = 800;
var h = 600;


//Scale links
var link_scale = 1000;


//Define map projection

var projection = d3.geo.mercator() //utiliser une projection standard pour aplatir les pôles, voir D3 projection plugin
    .center([ 13, 52 ]) //comment centrer la carte, longitude, latitude
    .translate([ w/2, h/2 ]) // centrer l'image obtenue dans le svg
    .scale([ w/1.5 ]); // zoom, plus la valeur est petit plus le zoom est gros

//Define path generator
var path = d3.geo.path()
    .projection(projection);


//Create SVG
var svg = d3.select("#container")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

//Load in GeoJSON data
d3.json("ne_50m_admin_0_countries_simplified.json", function(json) {


    countries = svg.append("g");

    //Bind data and create one path per GeoJSON feature
    countries.selectAll("path")
	.data(json.features)
	.enter()
	.append("path")
	.attr("d", path)
	.attr("stroke", "rgba(8, 81, 156, 0.2)")
	.attr("fill", "rgba(8, 81, 156, 0.6)");


    bus_layer = svg.append("g");

    // add circles to svg
    bus_layer.selectAll("circle")
	.data(index(buses.index)).enter()
	.append("circle")
	.attr("cx", function (d) { return projection([buses.x[d],buses.y[d]])[0] })
	.attr("cy", function (d) { return projection([buses.x[d],buses.y[d]])[1] })
	.attr("r", "8px")
	.attr("fill", "red");

    line_layer = svg.append("g");

    var lineFunction = d3.svg.line()
        .x(function(d) { return d[0] })
        .y(function(d) { return d[1] })
        .interpolate("linear");

    line_layer.selectAll("path")
	.data(index(links.index))
	.enter()
	.append("path")
	.attr("d", function(i) { return lineFunction([projection([links.x0[i],links.y0[i]]),projection([links.x1[i],links.y1[i]])])})
    	.attr("stroke", "rgba(0, 0, 255, 0.8)")
	.attr("fill", "rgba(255, 0, 255, 0.8)")
        .attr("stroke-width", function(i) { return links.p_nom_opt[i]/link_scale});




});
