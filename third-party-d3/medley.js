var fill = d3.scale.category20();
var width = 750,
	height= 500,
	radius = Math.min(width, height) / 2,
	color = d3.scale.category20c();

var sunburst = d3.select("#top-scorers").append("svg")
    .attr("width", width)
    .attr("height", height*1.04)
  .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height * .52 + ")");

var partition = d3.layout.partition()
    .sort(null)
    .size([2 * Math.PI, radius * radius])
    .value(function(d) { return 1; })
    .children(function(d){
    	console.log(d);
    	return d.children ? d.children: 
    	d.entries ? d.entries(): 
    	d.text ? null :
    	d.value.length ? d.value :
    	d.value.entries();
    });

var arc = d3.svg.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx; })
    .innerRadius(function(d) { return Math.sqrt(d.y); })
    .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

//Read in stats.tsv format, get top 100, feed to word cloud
//set sceale, dwon't forget to set domains as well
var leaderScale = d3.scale.linear().range([10,60]);

d3.tsv('stats.tsv', function(data){
	console.log(data);
	var leaders = data
		.filter(function(d){return d.G > 0;}) //exclude teams that don't score
		.map(function(d){ return {
			text: d.Name, 
			size: +d.G, 
			pos: d.Pos,
			goals: +d.G,
			team: d.Team};
		}) //map text and goal fields
		.sort(function(a,b){return d3.descending(a.size,b.size);}) //sort by biggest winners first
		.slice(0,100);//only top 100
	
var leadersByTeamPos = d3.nest()
	.key(function(d){return d.team;})
	.key(function(d){return d.pos;})
	.map(leaders, d3.map);

leaderScale.domain([
	d3.min(leaders, function(d){return d.size;}),
	d3.max(leaders, function(d){return d.size;})
	])

	d3.layout.cloud()
    .size([width, height])
    .words(leaders)
    .padding(1)
    //.rotate(function() { return ~~(Math.random() * 2) * 90; })
    .font("Impact")
    .fontSize(function(d) { return leaderScale(d.size); })
    .on("end", drawCloud)
    .start();

    drawSunburst(leadersByTeamPos);
});
 
//layout.start();

function drawCloud(words) {
  d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
    .selectAll("text")
      .data(words)
    .enter().append("text")
      .style("font-size", function(d) { return d.size + "px"; })
      .style("font-family", "Impact")
      .style("fill", function(d, i) { return fill(i); })
      .attr("text-anchor", "middle")
      .attr("transform", function(d) {
        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
      })
      .text(function(d) { return d.text; });
}

function drawSunburst(data){

	var path = sunburst.datum(data).selectAll("path")
      .data(partition.nodes)//data put into partition data structure
   	  .enter().append("path")
      .attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
      .attr("d", arc)
      .style("stroke", "#fff")
      .style("fill", function(d) { return fill(d.children ? d.key : d.text); })//if it has children, use the key, if it is a leaf, use txt
      .style("fill-rule", "evenodd")
      .each(stash);

   d3.selectAll("input").on("change", function change() {
    var value = this.value === "count"
        ? function() { return 1; }
        : function(d) { return d.goals; };

    path
        .data(partition.value(value).nodes)
      	.transition()
        .duration(1500)
        .attrTween("d", arcTween);
	})
}

// Stash the old values for transition.
function stash(d) {
  d.x0 = d.x;
  d.dx0 = d.dx;
}

// Interpolate the arcs in data space.
function arcTween(a) {
  var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
  return function(t) {
    var b = i(t);
    a.x0 = b.x;
    a.dx0 = b.dx;
    return arc(b);
  };
}