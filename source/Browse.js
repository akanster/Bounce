enyo.kind({
	name: "Akanster.shotBrowser",
	kind: enyo.VFlexBox,
	events: {  // events this view will raise. thrown up to the parent pane.
		onShotSelected: "",
		onPlayerSelected: ""
	},
	components: [
		{flex: 1, kind: "Scroller", className: "browse", components: [
			{name: "list", tapHighlight: true, kind: "VirtualRepeater", onSetupRow: "getListItem", components: [
				{name: "cells", kind: "HFlexBox"}
			]}
		]},
		{name: "getShots", kind: "WebService", onSuccess: "getShotsSuccess", onFailure: "getShotsFailure"},
		{kind: "Toolbar", className: "bottom-toolbar", components: [
			{name: "previousButton", icon: "images/icons/menu-icon-back.png", disabled: true, className: "prev-button enyo-radiobutton-dark", onclick: "previousButtonClick"},
			{flex: 1},
			{kind: "RadioToolButtonGroup", style: "width:380px", name: "menuRadioGroup", value: "Popular", onChange: "radioButtonSelected", components: [
				{caption: "Popular", className: "enyo-radiobutton-dark enyo-grouped-toolbutton-dark", value: "Popular"},
				{caption: "Everyone", className: "enyo-radiobutton-dark enyo-grouped-toolbutton-dark", value: "Everyone"},
				{caption: "Debuts", className: "enyo-radiobutton-dark enyo-grouped-toolbutton-dark", value: "Debuts"}
			]},
			{flex: 1},
			{name: "nextButton", icon: "images/icons/menu-icon-forward.png", className: "more-button enyo-radiobutton-dark enyo-grouped-toolbutton-dark", onclick: "nextButtonClick"}
		]},
		{kind: "ModalDialog", name: "shotPopup", components: [
			{kind: "RowGroup", components: [
				{layoutKind: "HFlexLayout", components: [
					{flex: 6},
					{kind: "Image", src: "images/glyphish/12-eye.png"},
					{flex: 3},
					{name: "shotPopupViews", flex: 20},
					{flex: 3},
					{kind: "Image", src: "images/glyphish/08-chat.png"},
					{flex: 3},
					{name: "shotPopupComments", flex: 16},
					{flex: 3},
					{kind: "Image", src: "images/glyphish/29-heart.png"},
					{flex: 3},
					{name: "shotPopupLikes", flex: 16},
					{flex: 1}
				]}
			]},
			{kind: "Button", className: "enyo-button-affirmative", name: "shotPopupPlayer", onclick: "shotPopupPlayerClick"},
			{kind: "Button", className: "enyo-button-affirmative", caption: "Shot Details", onclick: "shotPopupLaunchClick"},
			{kind: "Button", className: "enyo-button-dark", caption: "Close", onclick: "shotPopupClose"}
		]}
	],
	create: function() { // override the inherited create method from VFlexBox
		this.inherited(arguments); //calls the create method of our kind's superkind
		this.results = [];
		
		this.popupShot;
		
		this.pageNumber;
		this.LAST_PAGE = 50; // last  dozen pages returned by API is borked. Stopping @ 50 seems to work.
		
		this.url = "http://api.dribbble.com/shots/?per_page=12";
		this.$.getShots.setUrl(this.url);
		this.$.getShots.call();
	},
	getShotsSuccess: function(inSender, inResponse, inRequest) {
		this.results = inResponse.shots;
		this.pageNumber = inResponse.page; // current page number
		
		this.count = this.results.length;
		this.buildCells();
		this.$.list.render();
	},
	buildCells: function() {
		var bounds = this.$.list.getBounds();
		//this.cellCount = Math.floor(bounds.width / 200);
		this.cellCount = 4;
		this.$.cells.destroyControls();
		this.cells = [];
		for (var i=0; i<this.cellCount; i++) {
			var c = this.$.cells.createComponent({flex: 1, kind: "VFlexBox", className: "shot-row", pack: "top", align: "center", owner: this, idx: i, onmousehold: "onCellHold", onclick: "onCellClick"});
			c.createComponent({name: "shotImage", className: "shot-image", kind: "Image"});
			c.createComponent({name: "shotTitle", className: "shot-title"});
			this.cells.push(c);
		}
	},
	shotPopupPlayerClick: function(inSender) { // launch details view with shot.
		this.log("View " + this.popupShot.player.name + "'s Profile Clicked!");
		this.doPlayerSelected(this.popupShot.player);
	},
	shotPopupLaunchClick: function(inSender) { // launch details view with shot.
		this.doShotSelected(this.popupShot);
	},
	shotPopupClose: function(inSender) { // close popup when button is tapped.
		this.$.shotPopup.close();
	},
	onCellHold: function(inSender, inEvent, inRowIndex) { // show popup with details
		var idx = inEvent.rowIndex * this.cellCount + inSender.idx;
		this.$.list.render();
		this.log(this.results[idx].title + " clicked");
		
		this.popupShot = this.results[idx];
		
		this.$.shotPopup.openAtCenter();
		this.$.shotPopup.setCaption(this.popupShot.title);
		this.$.shotPopupPlayer.setContent(this.popupShot.player.name + "'s Profile");
		this.$.shotPopupViews.setContent(this.popupShot.views_count);
		this.$.shotPopupComments.setContent(this.popupShot.comments_count);
		this.$.shotPopupLikes.setContent(this.popupShot.likes_count);
	},
	onCellClick: function(inSender, inEvent, inRowIndex) { // this should launch details view
		var idx = inEvent.rowIndex * this.cellCount + inSender.idx;
		this.$.list.render();
		this.log(this.results[idx].title + " clicked");
		
		var shot = this.results[idx];
		this.doShotSelected(shot);
	},
	getShotsFailure: function(inSender, inResponse) {
		// TODO: handle failure gracefully. save application state. Do not trust saved data
		console.log("got failure from getFeed");
	},
	getListItem: function(inSender, inIndex) {
		var idx = inIndex * this.cellCount;
		if (idx >= 0 && idx < this.count) {
			for (var i=0, c; c=this.cells[i]; i++, idx++) {
				if (idx < this.count) {
					var path = this.results[idx].image_teaser_url;
					var title = this.results[idx].title;
					var bg = "white";
					//c.applyStyle("background-color", this.$.selection.isSelected(idx) ? "lightgreen" : null);
				}
				else {
					path = "images/blank.png";
					bg = null;
				}
				
				if (title.length > 29)
					title = title.substring(0, 26) + "...";
				
				c.$.shotImage.setSrc(path);	
				c.$.shotTitle.setContent(title); // remove title, add stats
				c.$.shotImage.applyStyle("background-color", bg);
			}
			return true;
		}
		return false;
	},
	radioButtonSelected: function(inSender) {	
		// scroll to top (animated)
		this.$.scroller.scrollTo(0, 0);
		
		switch (inSender.getValue())
		{
			case "Popular": this.url = "http://api.dribbble.com/shots/popular?per_page=12";
				break;
			case "Everyone": this.url = "http://api.dribbble.com/shots/everyone?per_page=12";
				break;
			case "Debuts": this.url = "http://api.dribbble.com/shots/debuts?per_page=12";
				break;
		}
		this.$.previousButton.disabled = true;
		this.$.previousButton.setState("disabled", true);
		
		this.log("NEW URL: " + this.url);
		this.$.getShots.setUrl(this.url);
		this.$.getShots.call();
	},
	previousButtonClick: function(inSender) {
		this.log("Previous Button clicked!");
		this.results = [];
		this.pageNumber--;
		
		if (this.pageNumber == 1) {
			this.$.previousButton.disabled = true;
			this.$.previousButton.setState("disabled", true);
		}

		// this works but I should perform a check first (are we coming from a page that disabled it?)
		this.$.nextButton.disabled = false;
		this.$.nextButton.setState("disabled", false);
			
		this.log("pageNumber: " + this.pageNumber);
		this.log("new url: " + this.url + "&page=" + this.pageNumber);
		this.$.getShots.setUrl(this.url + "&page=" + this.pageNumber);
		this.$.getShots.call();
	},
	nextButtonClick: function(inSender) {
		this.log("Next Button clicked!");
		this.results = [];
		this.pageNumber++;
		
		// this is the last page, disable "more" button & alert user.
		if (this.pageNumber == this.LAST_PAGE) {
			this.log("We are on the last page!");
			this.$.nextButton.disabled = true;
			this.$.nextButton.setState("disabled", true);
		}
		
		// this works but I should perform a check first 
		this.$.previousButton.disabled = false;
		this.$.previousButton.setState("disabled", false);
		
		this.log("pageNumber: " + this.pageNumber);
		this.log("new url: " + this.url + "&page=" + this.pageNumber);
		this.$.getShots.setUrl(this.url + "&page=" + this.pageNumber);
		this.$.getShots.call();
	}
});
