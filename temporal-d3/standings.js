
/* Constants for our drawing area */
var width = 750,
    height = 500,
    margin = { top: 20, right: 20, bottom: 20, left:70 };

//create unified date format 	ALWAYS Use this
var parseDate = d3.time.format("%Y-%m-%d").parse;

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
  		d3.nest().key(function(d){return d.Away; }).entries(data),
  		d3.nest().key(function(d){return d.Home; }).entries(data)
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
  					.append('g')
  					.attr('class','line-graph')
  					.attr('transform', "translate("+xAxis.tickPadding()+",0)");

  				var path = lines.append('path')
  								.datum(function(d){return d.value})//binding w/ datum is similar to 'data' except no virtual selection is prepped for entry()/exit()
  								.attr('d',function(d){return pointLine(d); });

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

};

var gameOutcome = function(team, game, games){
	var isAway = (game.Away ===team);
	var goals = isAway? +game.AwayScore : +game.HomeScore;
	var allowed = isAway? + game.HomeScore : +game.AwayScore;
	var decision = (goals > allowed)? 'win' : (goals < allowed)? 'loss': 'draw';
	var points = (goals > allowed)? 3: (goals < allowed)?0 : 1;

	return {
		date: game.Date,
		team: team,
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

reload();

