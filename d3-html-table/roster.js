
/* Creating a table
 *
 * This script shall create a table from a tab-separated value text document.
 */

/* Store the data in an array. Starts off empty.
 * This is usually NOT global, but making global here for demonstration purposes.
 */
 var data = [];
 var teams = [];


/* Select the DIV in the document with the ID of "roster".
 * Append a <table class="table"></table> to the selected DIV.
 * The "table" class is a beautification measure via Bootstrap's CSS.
 * The resulting table element is stored in the variable "table."
 */
 var table = d3.select('#roster')
 .append('table')
 .classed('table',true);



/* Append <thead><tr></tr></thead> to the above table.
 * The inner tr element is stored in the "thead" variable.
 */
 var thead = table.append('thead').append('tr');

 /* Append <tbody></tbody> to the table and store it in the "tbody" variable. */
 var tbody = table.append('tbody');

 var positions = {G: "Goalkeeper", D: "Defender", M: "Midfielder", F: "Forward"};

 var columns = ['No', 'Name',  "Pos"];

 var teamSelector = d3.select('#page-title')
 .append('select')
					.on('change', function(){selectTeam(this.value);}) // when value changes, hit selectTeam function
					.attr('id', 'team-selector')


/* Function to reload the data from the data file.
 * Call the redraw() function after the data is loaded to drive the drawing of the data.
 * We'll be filling this in during the lesson.
 */
 var reload = function() {
 	console.log("reload() called.");
	//parse roster data from the tab-separated value file
	d3.tsv('eng2-rosters.tsv', function(rows){//parses it into array of ordered maps for each record
		data = rows;
	 	data.forEach(function(d){// here we remap position abbreviations to hashmap values
	 		d.Pos = positions[d.Pos];
		 	//add team to teams array if it doesn't yet exist

		 	if(teams.indexOf(d.TeamID) < 0){

		 		teams.push(d.TeamID);
		 		teams[d.TeamID] = d.Team;
		 	};

		 });

	 	teamSelector.selectAll('option')
 				.data(teams)//assign team array as all options values
 				.enter()
 					.append('option')//append an option tag with value of current data value
 						.attr('value', function(d){return d;}) //set option tag with value of current data value(team name)
 						.text(function(d){ return teams[d];}) //set text to team name
 						.sort(function(a,b){return d3.ascending(a,b); });//sort alphabetically

	 	selectTeam("afc-wimbledon"); // bind data to dom/ redraw every time new data is grabbed.
	 });
};


/* Function to redraw the table.
 * It's good practice to keep the data input and drawing funcitons separate.
 * We'll be filling this in during the lesson.
 */
 var redraw = function(roster) {


 	console.log('redrawing');

	// we want to grab table headers here first:
	thead.selectAll('th')
		//.data(d3.map(data[0]).keys().slice(2))// we take the first row (data[0]) and tell d3 that table headers should map to these values
		.data(columns) // user remapped columns since slice won't work in intermittent col vals
		.enter()// add DOM elements based on # in virtual elements
		.append('th')
		.on('click', function(d){//onclick handler for column sorting based on click
			tbody.selectAll('tr')
			.sort(function(a,b){
				return(d === "No") ?  d3.ascending(+a[d],+b[d]): d3.ascending(a[d],b[d]);//comparator
			})
			.style('background-color', function(d,i){// Adds odd/even striping
				return (i%2)? 'white': 'lightgray';
			});
		})
		.text(function(d){return d;});

		var rows = tbody.selectAll('tr')
					.data(roster);//set data to tsv data from before
	rows.enter() //add DOM elements based on # of virtual entries in data
		.append('tr')
		.style('background-color', function(d,i){// Adds odd/even striping
			return (i%2)? 'white': 'lightgray';
		});//add a tr to virtual element per # of data elements	

	rows.exit()//handle removal of rows in tables body
	.remove();

	var cells = rows.selectAll('td')
	.data(function(row){
		var values = [];
		columns.forEach(function(d){
			values.push(row[d]); 
		});
		return values;
						//return d3.map(row).values().slice(2);
					});
	cells.enter()
	.append('td');

	cells.text(function(d){return d;});



};

var selectTeam = function(teamId){
	console.log('change');

//filter the data for rows with specified teamID
var roster = data.filter(function(d){
	return d['TeamID'] == teamId;

})

d3.select("#team-name").text(teams[teamId] + ' Roster');//set team name header to be [team name] + roster
document.getElementById('team-selector').value = teamId; //set team selector to specified team id selction
//redraw with updated filtered data
redraw(roster);
}

/* Call reload() once the page and script have loaded to get the controller script started. */
reload();

/*
Read in a spreadsheet data file
Bind the data to an HTML table structure in the DOM
Limit the bound data to control the output columns
Transform data before binding in order to improve presentation 
*/