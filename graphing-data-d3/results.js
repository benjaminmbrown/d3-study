//constants

var width = 750,
	height = 300,
	margin = {top:20,right:20, bottom:20,left:70};


//drawing area/canvas	

var svg = d3.select('#results')
	.append('svg')
	.attr('width', width)
	.attr('height', height);


//standard reload function

var reload = function(){
	console.log('reload');
	var data = [];
	d3.csv('afcw-results.csv', function(rows){//parses it into array of ordered maps for each record
	 redraw(rows); // bind data to dom/ redraw every time new data is grabbed.
 });


}


//standard redraw
var redraw = function(data){
//create virtual selection
console.log('redraw');
var bars = svg.selectAll('rect.bar').data(data);
bars.enter()
	.append('rect')
	.classed('bar', true)

bars
	.attr("x", function(d,i){return i *6 ;})
	.attr('width', 5)
	.attr("y", function(d){
		
		//return d.GoalsScored;
		return height - margin.bottom - (d.GoalsScored * 50);
	})
	.attr("height", function(d){ 
		console.log(d);
		console.log(d.GoalsScored);
		var scaledHeight = d.GoalsScored *50;
		return 255;
	});


}

reload();