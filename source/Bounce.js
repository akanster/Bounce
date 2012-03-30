enyo.kind({
	name: "Akanster.Bounce",
	kind: enyo.VFlexBox,
	components: [
		{name: "header", kind: "Akanster.Header"}, 
		{name: "pane", kind: "Pane", flex: 1, onSelectView: "viewSelected", transitionKind: "enyo.transitions.Simple",
			components: [  // first view will be selected by default
				{name: "shotBrowser", className: "enyo-bg", kind: "Akanster.shotBrowser", onShotSelected: "shotSelected", onPlayerSelected: "playerSelected"},
				{name: "shotDetail", className: "enyo-bg", kind: "Akanster.shotDetail", onReturnToBrowse: "returnToBrowse", onPlayerSelected: "playerSelected"},
				{name: "playerProfile", className: "enyo-bg", kind: "Akanster.playerProfile", onReturnToPrevious: "returnToPrevious"},
				{name: "about", className: "enyo-bg", kind: "Akanster.about", onReturnToPrevious: "returnToPrevious"}
			]
		},
		{kind: "AppMenu", components: [
			// {caption: "Preferences", onclick: "showPreferences"}, /* Prefs. option to clean out saved shots. etc */
			// {caption: "Help", /* kind: "HelpMenu", */ onclick: "showHelp"}, /* Tips on how to use the app.  Display hint on first run? */
			{caption: "About Bounce!", onclick: "showAbout"} /* About the app. About dribble.  Proper attributions */
		]}
	],
	create: function() {
		this.inherited(arguments);
		
		// render header with custom text
		Cufon.replace("#bounce_header_header");
		
		// lock orientation to Landscape
		curOrientation = enyo.getWindowOrientation();
		if (curOrientation === 'left')
			enyo.setAllowedOrientation('right');
		else if (curOrientation === 'right')
			enyo.setAllowedOrientation('right');
		else
			enyo.setAllowedOrientation('right');
			
		this.currentshot = null;
		this.currentplayer = null;
	},
	showAbout: function() { // About pane!
		this.$.pane.selectViewByName("about");
	},
	shotSelected: function(inSender, inShot) {
		this.currentshot = inShot;
		this.$.pane.selectViewByName("shotDetail");
	},
	playerSelected: function(inSender, inPlayer) {
		this.log("Go to Player Profile: " + inPlayer.name);
		this.currentplayer = inPlayer;
		this.$.pane.selectViewByName("playerProfile");
	},
	returnToBrowse: function(inSender, inFeed) {  // should this return to browse or just go back?
		this.log("Go back to browse view");
		this.$.pane.selectViewByName("shotBrowser");
	},
	returnToPrevious: function(inSender, inView, inPreviousView) { // raised from player profile
		this.log("Go back to previous view");
		this.$.pane.back();
	},
	viewSelected: function(inSender, inView, inPreviousView) { // event fired whenever the selected view changes
		if (inView == this.$.shotDetail) {
			this.$.shotDetail.singleShot = this.currentshot;
			this.$.shotDetail.setUpDetails();
		} else if  (inView == this.$.playerProfile) {
			this.$.playerProfile.player = this.currentplayer;
			this.$.playerProfile.setUpPlayer();
		}
		
		// when we leave a view, clear everything
		if (inPreviousView == this.$.shotDetail)
			this.$.shotDetail.destroyDetails();
		else if (inPreviousView == this.$.playerProfile)
			this.$.playerProfile.destroyPlayer();

	}
});