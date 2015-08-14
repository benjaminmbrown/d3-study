var fill = d3.scale.category20();
var width = 750;
var height= 500;

//Read in stats.tsv format, get top 100, feed to word cloud
//set sceale, dwon't forget to set domains as well
var leaderScale = d3.scale.linear().range([10,60]);

d3.tsv('stats.tsv', function(data){
	console.log(data);
	var leaders = data
		.filter(function(d){return d.G > 0;}) //exclude teams that don't score
		.map(function(d){ return {text: d.Name, size: +d.G};}) //map text and goal fields
		.sort(function(a,b){return d3.descending(a.size,b.size);}) //sort by biggest winners first
		.slice(0,100);//only top 100
	
	console.log(leaders);

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