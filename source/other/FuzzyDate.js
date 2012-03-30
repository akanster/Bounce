/*
Original from http://snipplr.com/view/10290/javascript-parse-relative-date/
Converted to convert method in Javascript class
*/
function FuzzyDate()
{
	// Pre: inDate is Javascript Date object
	// Post: String with fuzzy date returned
	this.convert = function(inDate) { 

		var dateFunc = new Date();
		var timeSince = dateFunc.getTime() - inDate;
		var inSeconds = timeSince / 1000;
		var inMinutes = timeSince / 1000 / 60;
		var inHours = timeSince / 1000 / 60 / 60;
		var inDays = timeSince / 1000 / 60 / 60 / 24;
		var inYears = timeSince / 1000 / 60 / 60 / 24 / 365;
		
		var answer;

		// in seconds
		if(Math.round(inSeconds) == 1)
			answer = "1 second ago";
		else if(inMinutes < 1.01)
			answer = Math.round(inSeconds) + " seconds ago";

		// in minutes
		else if(Math.round(inMinutes) == 1)
			answer = "1 minute ago";
		else if(inHours < 1.01)
			answer = Math.round(inMinutes) + " minutes ago";

		// in hours
		else if(Math.round(inHours) == 1)
			answer = "1 hour ago";
		else if(inDays < 1.01)
			answer = Math.round(inHours) + " hours ago";

		// in days
		else if(Math.round(inDays) == 1)
			answer = "1 day ago";
		else if(inYears < 1.01)
			answer = Math.round(inDays) + " days ago";

		// in years
		else if(Math.round(inYears) == 1)
			answer = "1 year ago";
		else
			answer = Math.round(inYears) + " years ago";
		
		return answer;
	}
}
// Declare the only instance of the object that will be used
var fuzzyDate = new FuzzyDate();