

function sum(array){
    var total = 0;
    for(var i=0; i < array.length; i++) { total += array[i]}
    return total
}


//Width and height
var w = 800;
var h = 600;


//Scale links
var link_scale = 1000;
var load_scale = 2000;



//Index at start
var start_snapshot_index = 4;

//Define map projection

var projection = d3.geo.mercator() //utiliser une projection standard pour aplatir les pôles, voir D3 projection plugin
    .center([ 13, 52 ]) //comment centrer la carte, longitude, latitude
    .translate([ w/2, h/2 ]) // centrer l'image obtenue dans le svg
    .scale([ w/1.5 ]); // zoom, plus la valeur est petit plus le zoom est gros

//Define path generator
var path = d3.geo.path()
    .projection(projection);


document.getElementById("timeslide").max=snapshots.length-1;

document.getElementById("timeslide").value = start_snapshot_index;

document.getElementById("range").innerHTML=snapshots[start_snapshot_index];


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


    line_layer = svg.append("g");

    var lineFunction = d3.svg.line()
        .x(function(d) { return d[0] })
        .y(function(d) { return d[1] })
        .interpolate("linear");

    lines = line_layer.selectAll("path")
	.data(links.index)
	.enter()
	.append("path")
	.attr("d", function(d, i) { return lineFunction([projection([links.x0[i],links.y0[i]]),projection([links.x1[i],links.y1[i]])])})
        .attr("class", "flowline")
        .attr("stroke-width", function(d, i) { return flows[start_snapshot_index][i]/link_scale});


    // This is a function which transforms arc data into a path
    arc_path = d3.svg.arc()
        .innerRadius(0)
        .outerRadius(40);

    // This is a function which turns a list of numbers into arc data (start angle, end angle,  etc.)
    pie = d3.layout.pie()
	.sort(null);

    signs = ["positive","negative"];

    sign_layer = {};

    sign_locations = {};

    for(var k=0; k < signs.length; k++) {

	sign = signs[k];

	sign_layer[sign] = svg.append("g");

	sign_locations[sign] = sign_layer[sign].selectAll("g")
            .data(power[sign])
            .enter()
            .append("g")
            .attr("transform", function(d,i) { return "translate(" + projection([buses.x[i],buses.y[i]])[0] +","+ projection([buses.x[i],buses.y[i]])[1] + ")" } );



    sign_locations[sign].selectAll("path")
        .data(function(d) {var array = pie(d[start_snapshot_index]); for(var i=0; i < array.length; i++) { array[i]["radius"] = sum(d[start_snapshot_index])}; return array})
        .enter()
        .append("path")
        .attr("d", function(d) { return arc_path.outerRadius(d["radius"]/load_scale)(d)})
        .style("fill", function(d, i) { return carriers[sign].color[i] });

    };

});


// when the input range changes update the value
d3.select("#timeslide").on("input", function() {
    update(+this.value);
});


function update(value) {
    document.getElementById("range").innerHTML=snapshots[value];

    line_layer.selectAll("path")
        .attr("stroke-width", function(d, i) { return flows[value][i]/link_scale});

    for(var k=0; k < signs.length; k++) {

	sign = signs[k];

	console.log(sign,carriers[sign].color);

	// don't need enter() and append() here...
	sign_locations[sign].selectAll("path")
        .data(function(d, i) {var array = pie(d[value]); for(var j=0; j < array.length; j++) { array[j]["radius"] = sum(d[value])}; return array})
        .attr("d", function(d) { return arc_path.outerRadius(d["radius"]/load_scale)(d)})
        .style("fill", function(d, i) { return carriers[sign].color[i] });

    }

}
