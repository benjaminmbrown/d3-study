//constants

var width = 750,
	height = 300,
	margin = {top:20,right:20, bottom:20,left:70};


//drawing area/canvas	

var svg = d3.select('#results')
	.append('svg')
	.attr('width', width)
	.attr('height', height);

//ordinal & linear scale objects

//ordinal to scale across entire width of screen - map to horizontal pixels
var x = d3.scale
			.ordinal()
			.rangeRoundBands([margin.left, width - margin.right], 0.1);

//linear - we want values in range of height - margin up to margin top.
var y = d3.scale
			.linear()
			.range([height - margin.bottom, margin.top]);


//axes draw objects
var xAxis = d3.svg.axis().scale(x).orient('bottom');
var yAxis = d3.svg.axis().scale(y).orient('left');


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
	//set domain - actual values we want to scale
	x.domain(data.map(function(d,i){return i;}));
	y.domain([0, d3.max(data,function(d){return d.GoalsScored}) ]);
	//create virtual selection
	console.log('redraw');
	var bars = svg.selectAll('rect.bar').data(data);
	bars.enter()
		.append('rect')
		.classed('bar', true)

	bars
		.attr("x", function(d,i){return x(i)})
		.attr('width', x.rangeBand)
		.attr("y", function(d){

			//return height - margin.bottom - (d.GoalsScored * 50);
			return y(d.GoalsScored);
		})
		.attr("height", function(d){ 
			
			return y(0)-y(d.GoalsScored);
		});

	//create axis-driving data and apply to draw axes
	var axisData = [
	{axis: xAxis, dx: 0, dy: (height - margin.bottom), clazz: 'x'},
	{axis: yAxis, dx: margin.left , dy: 0, clazz: 'y'}
	];

	var axis = svg.selectAll('g.axis')
					.data(axisData);
	axis.enter()
		.append('g')
		.classed('axis', true);

	axis.each(function(d){
		d3.select(this) //select self as technique go avoid multiple function(d) declaration
			.attr('transform', 'translate('+d.dx+','+d.dy+')')
			.classed(d.clazz, true)
			.call(d.axis);
	});

	}

reload();