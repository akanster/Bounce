enyo.kind({
	name: "Akanster.about",
	kind: enyo.VFlexBox,
	events: { 
		onReturnToPrevious: ""
	},
	components: [
		{flex: 1, layoutKind: "VFlexLayout", className: "about", content: enyo.string.runTextIndexer("<br /><br /> Bounce is an beautiful and intuitive app that allows you to browse Dribbble comfortably with the TouchPad. <br /><br /> Browse shots by category, view details and comments on each shot and check out your favorite user's info and submissions.  <br /><br /> This app is not affiliated with Dribbble in any official capacity. <br /><br /> 2011 &copy; Akanster <br /><br /> Send questions, feedback & comments to support@akanster.com.  Thanks!")},
		{kind: "Toolbar", components: [
			{name: "backButton", caption: "Back", className: "back-button", onclick: "backButtonClick"},
			{flex: 1}
		]}
	],
	create: function() { // override the inherited create method from VFlexBox
		this.inherited(arguments); //calls the create method of our kind's superkind
	},

	backButtonClick: function(inSender) {
		//this.$.playersShotsList.punt(); // flush list buffers 
		this.doReturnToPrevious();
	}
});