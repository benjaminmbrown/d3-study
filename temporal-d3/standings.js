
/* Constants for our drawing area */
var width = 750,
    height = 500,
    margin = { top: 20, right: 20, bottom: 20, left:70 };

var colors24 = [
  "#393b79","#5254a3","#6b6ecf","#9c9ede",
  "#3182bd","#6baed6","#9ecae1","#c6dbef",
  "#e6550d","#fd8d3c","#fdae6b","#fdd0a2",
  "#31a354","#74c476","#a1d99b","#c7e9c0",
  "#756bb1","#9e9ac8","#bcbddc","#dadaeb",
  "#843c39","#ad494a","#d6616b","#e7969c"
];

//store game info for tooltips

var gameDiv = d3.select('body')
	.append('div')
	.attr('class', 'tooltip')//tooltip is bootstrap
	.style('opacity', 0);//invisible

//create unified date format 	ALWAYS Use this
var parseDate = d3.time.format("%Y-%m-%d").parse;
var formatDate = d3.time.format("%b %d");

//ordinal to scale across entire width of screen - map to horizontal pixels
var x = d3.time.scale().range([margin.left, width - margin.right]);

//linear - we want values in range of height - margin up to margin top.
var y = d3.scale
			.linear()
			.range([height - margin.bottom, margin.top]);


//Axis orientation
var xAxis = d3.svg.axis().scale(x).orient('bottom');
var yAxis = d3.svg.axis().scale(y).orient('left');

var pointLine = d3.svg.line()
					.x(function(d){return x(d.date)})
					.y(function(d){return y(d.leaguePoints)});


/* The drawing area */
var svg = d3.select("#standings-chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);


/* Our standard data reloading function */
var reload = function() {
  var data = [];
  d3.json('eng2-2013-14.json', function(results){
  	//Convert strings to dates
results.forEach(function(d){ d.Date = parseDate(d.Date);})

  	x.domain([results[0].Date, results[results.length-1].Date]);//Date domain x-axis example..Grab date from first and last resultsd
	y.domain([0,100]);


  	//flatten data
  	//put the date into each games map then create merged array of eaech games map
  	data = d3.merge(
	  		results.map(function(d){//extended map function
	  			d.Games.forEach(function(g){g.Date=d.Date;});
	  			return d.Games;
	  		})
  		);


//Nest teams (away and home) with array of games
  	var dataMap = d3.map();

  	d3.merge([
  		d3.nest().key(function(d){return makeId(d.Away); }).entries(data),
  		d3.nest().key(function(d){return makeId(d.Home); }).entries(data)
  		]).forEach(function(d){
  			if(dataMap.has(d.key)){
  				dataMap.set(d.key, d3.merge([dataMap.get(d.key), d.values])
  					.sort(function(a,b) { return d3.ascending(a.Date, b.Date); })
  					);
  			}else{
  				dataMap.set(d.key, d.values);
  			}
  		});

//replace games with results of gameOutcome()

	dataMap.forEach(function(key,values){
		var games = [];
		values.forEach(function(g,i){
			games.push(gameOutcome(key, g, games));
		});
		dataMap.set(key,games); // replace old games with game outcome
	})


  	console.log(dataMap);
  	redraw(dataMap);
  })


};

/* Our standard graph drawing function */
var redraw = function(data) {
  
  // select all virtual elements with line graph class
  var lines = svg.selectAll('.line-graph')
  				.data(data.entries());

	lines.enter()
	  	.append('g');

	lines.sort(function(a,b){
		var aPoints = a.value[a.value.length -1].leaguePoints;
		var bPoints = b.value[b.value.length -1].leaguePoints;
		return d3.descending(aPoints, bPoints);
	})


	lines.each(function(d,i){
	  	d3.select(this)
		  	.style('stroke', colors24[i])//add line coloring based on color array
		  	.attr('class','line-graph')
		  	.attr('transform', "translate("+xAxis.tickPadding()+",0)")
	  		.attr('id', d.key)
	  		.attr('data-legend-'+((i<16)?1:2), d.value[0].team);
	  	})

	var path = lines.append('path')
	  				.datum(function(d){return d.value})//binding w/ datum is similar to 'data' except no virtual selection is prepped for entry()/exit()
	  				.attr('d',function(d){return pointLine(d); });

	
//add circles for tooltips/detailed info
	var circles = lines.selectAll('circle')
					.data(function(d){return d.value;});

		circles.enter()
				.append('circle')
				.attr('r', 2);

		circles.each(function(d){
			var color = d3.select(this.parentElement).style('stroke');
			d3.select(this)
				.attr('cx', x(d.date))
				.attr('cy', y(d.leaguePoints))
				.style('fill', color)
				.on('mouseover', function(e){ return showGame(d, color);})
				.on('click', function(e){ return showGame(d, color);})
				.on('mouseout', function(e){ return hideGame();})
		})
   	// svg.append('g')
   	// 	.attr('class', 'legend')
   	// 	.attr('transform', 'translate('+(margin.left+20)+','+y(95)+')')
   	// 	.call(d3.legend);

   	var legends = svg.selectAll('.legend')
   					.data([{dx:margin.left + 20, dy: y(95)},
   						   {dx:margin.left + 220, dy: y(95)}]);

   			legends.enter()
   			.append('g')
	   		.attr('class', 'legend');

	   		legends.each(function(d,i){
	   			d3.select(this)
	   				.attr('transform', 'translate('+d.dx+','+d.dy+')')
	   				.call(d3.legend, 'data-legend-' + (i +1));
	   		});
   						

   var axis = svg.selectAll('.axis')
   					.data([
   							{axis: xAxis, x:0, y: y(0), clazz: 'x'},
   							{axis: yAxis, x:x.range()[0], y:0, clazz:'y'}
   						])

	   	axis.enter().append('g')
	   				.attr('class', function(d){return 'axis '+d.clazz})
	   				.attr('transform', function(d){
	   					return "translate("+d.x+","+d.y+")";
	   				});

	   	axis.each(function(d){
	   		d3.select(this).call(d.axis);
	   	})

   	//append additional legend to the svg

};

var gameOutcome = function(team, game, games){
	var isAway = (makeId(game.Away) ===team);
	var goals = isAway? +game.AwayScore : +game.HomeScore;
	var allowed = isAway? + game.HomeScore : +game.AwayScore;
	var decision = (goals > allowed)? 'win' : (goals < allowed)? 'loss': 'draw';
	var points = (goals > allowed)? 3: (goals < allowed)?0 : 1;

	return {
		date: game.Date,
		team: isAway? game.Away: game.Home,
		align: isAway? 'away' : 'home',
		opponent: isAway? game.Home : game.Away,
		goals : goals,
		allowed : allowed,
		venue: game.Venue,
		decision : decision,
		points: points,
		leaguePoints : d3.sum(games, function(d){return d.points}) + points
	};
}
//converts a string to an Id
function makeId(string){
	return string.replace(/[^A-Za-z0-9]/g,'');
}

function showGame(d, color){
	gameDiv.transition()
		.duration(50)
		.style('opacity', 0)
		.style('background-color', 'white');
	
	gameDiv.html(d.team+"("+ formatDate(d.date)+" - "+ d.align+")<br/>"
		+"Versus: "+d.opponent + " <br/>"
		+"Venue: "+d.venue + " <br/>"
		+"Result: "+d.goals + "-" + d.allowed+ " " +d.decision +" <br/>"
		+"Points: "+d.leaguePoints
		)
	.style({left:(d3.event.pageX+10) + "px",
			top:(d3.event.pageY-40) + "px"})
	.transition()
	.duration(200)
	.style('opacity',0.9)
	.style('background-color', color);
}

function hideGame(){
	gameDiv.transition()
		.duration(500)
		.style('opacity', 0)
		.style('background-color', 'white');
}
reload();

