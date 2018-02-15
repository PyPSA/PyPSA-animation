

// return range(len(array))
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
var load_scale = 1000;



//Index at start
var start_index = 4;

//Define map projection

var projection = d3.geo.mercator() //utiliser une projection standard pour aplatir les pôles, voir D3 projection plugin
    .center([ 13, 52 ]) //comment centrer la carte, longitude, latitude
    .translate([ w/2, h/2 ]) // centrer l'image obtenue dans le svg
    .scale([ w/1.5 ]); // zoom, plus la valeur est petit plus le zoom est gros

//Define path generator
var path = d3.geo.path()
    .projection(projection);


document.getElementById("timeslide").max=load.index.length-1;

document.getElementById("timeslide").value = start_index;

document.getElementById("range").innerHTML=load.index[start_index];


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
	.attr("cx", function (i) { return projection([buses.x[i],buses.y[i]])[0] })
	.attr("cy", function (i) { return projection([buses.x[i],buses.y[i]])[1] })
	.attr("r", function (i) { return load[buses.index[i]][start_index]/load_scale  })
	.attr("fill", "red");

    line_layer = svg.append("g");

    var lineFunction = d3.svg.line()
        .x(function(d) { return d[0] })
        .y(function(d) { return d[1] })
        .interpolate("linear");

    lines = line_layer.selectAll("path")
	.data(index(links.index))
	.enter()
	.append("path")
	.attr("d", function(i) { return lineFunction([projection([links.x0[i],links.y0[i]]),projection([links.x1[i],links.y1[i]])])})
        .attr("class", "flowline")
        .attr("stroke-width", function(i) { return links.p_nom_opt[i]/link_scale});




});


// when the input range changes update the value
d3.select("#timeslide").on("input", function() {
    update(+this.value);
});


function update(value) {
    document.getElementById("range").innerHTML=load.index[value];
    d3.selectAll("circle")
	.attr("r", function (i) {return load[buses.index[i]][value]/load_scale  });

    line_layer.selectAll("path")
        .attr("stroke-width", function(i) { return flows[value][i]/link_scale});
}
