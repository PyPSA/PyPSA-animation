

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
	.data(buses.index).enter()
	.append("circle")
	.attr("cx", function (d, i) { return projection([buses.x[i],buses.y[i]])[0] })
	.attr("cy", function (d, i) { return projection([buses.x[i],buses.y[i]])[1] })
	.attr("r", function (d, i) { return load[buses.index[i]][start_index]/load_scale  })
	.attr("fill", "red");

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
        .attr("stroke-width", function(d, i) { return flows[start_index][i]/link_scale});


    generator_layer = svg.append("g");

    generators = generator_layer.selectAll("g")
        .data(generation)
        .enter()
        .append("g")
        .attr("transform", function(d,i) { return "translate(" + projection([buses.x[i],buses.y[i]])[0] +","+ projection([buses.x[i],buses.y[i]])[1] + ")" } );


    // This is a function which transforms arc data into a path
    var arc_path = d3.svg.arc()
        .innerRadius(0)
        .outerRadius(40);

    // This is a function which turns a list of numbers into arc data (start angle, end angle,  etc.)
    var pie = d3.layout.pie()
	.sort(null);

    //var carriers = ["gas", "onwind", "offwind", "solar"]
    var colors = ["#835C3B","#3B6182","#ADD8E6","FFFF00"]

    generators.selectAll("path")
        .data(function(d) {var array = pie(d[start_index]); for(var i=0; i < array.length; i++) { array[i]["radius"] = sum(d[start_index])}; return array})
        .enter()
        .append("path")
        .attr("d", function(d) { return arc_path.outerRadius(d["radius"]/load_scale)(d)})
        .style("fill", function(d, i) { return colors[i] });



});


// when the input range changes update the value
d3.select("#timeslide").on("input", function() {
    update(+this.value);
});


function update(value) {
    document.getElementById("range").innerHTML=load.index[value];
    d3.selectAll("circle")
	.attr("r", function (d, i) {return load[buses.index[i]][value]/load_scale  });

    line_layer.selectAll("path")
        .attr("stroke-width", function(d, i) { return flows[value][i]/link_scale});
}
