enyo.kind({
	name: "Akanster.shotDetail",
	kind: enyo.VFlexBox,
	events: { 
		onReturnToBrowse: "",
		onPlayerSelected: "" /* different from Browse's onPlayerSelected.  Stay frosty! */
	},
	components: [
		{name: "getComments", kind: "WebService", onSuccess: "getCommentsSuccess", onFailure: "getCommentsFailure"},
		{name: "getRebound", kind: "WebService", onSuccess: "getReboundSuccess", onFailure: "getReboundFailure"},
		{kind: "HFlexBox", flex: 1, className: "details", components: [
			{flex: 3, className: "shot-info-block", components: [
				{name: "shotName", className: "shot-name"},
				{name: "shotImageLarge", className: "shot-image-large", kind: "Image"},
				{kind: "HFlexBox", flex: 1, onclick: "playerClicked", components: [
					{name: "playerImage", className: "player-image", kind: "Image"},
					{kind: "VFlexBox", className: "shot-info-box", flex: 1, components: [
						{name: "playerName", className: "player-name"},
						{name: "shotDate", className: "shot-date"}
					]}
				]},
				{kind: "RowGroup", caption: "Shot Statistics", className: "shot-stats", defaultKind: "HFlexBox", components: [
					{components: [
						{name: "viewCount", className: "enyo-label", flex: 1},
						{name: "likeCount", className: "enyo-label", flex: 1},
						{name: "reboundCount", className: "enyo-label", flex: 1}
					]}
				]},
				{kind: "Spacer"},
				{name: "rebound", className: "rebound-block", layoutKind: "HFlexLayout", components: [
					{name: "reboundImage", className: "rebound-image", kind: "Image"},
					{kind: "VFlexBox", className: "rebound-info-box", flex: 1, components: [
						{content: "This shot is a rebound of...", className: "enyo-label rebound-heading"},
						{name: "reboundName", className: "rebound-name"},
						{name: "reboundPlayer", className: "rebound-player"}
					]}
				]}
			]},
			{kind: "Scroller", layoutkind: "VFlexLayout", flex: 4, className: "comments-block", components: [
				{kind: "Divider", name: "responses", className: "comments-count"},
				{kind: "VirtualRepeater", flex: 1, name: "commentsList", className: "comments-list", onSetupRow: "setupUpComments", components: [
					{kind: "Item", tapHighlight: true, layoutKind: "HFlexLayout", className: "comment-item", components: [
						{name: "commentAvatar", className: "comment-avatar", onclick: "commenterClicked", kind: "Image"},
						{kind: "VFlexBox", flex: 1, className: "comment-info-box", components: [
							{name: "commentPoster", className: "comment-poster", onclick: "commenterClicked"},
							{name: "commentDate", className: "comment-date"},
							{name: "commentText", className: "comment-text", allowHtml: true}
						]}
					]}
				]},
				{kind: "ToolButton", name: "moreCommentsButton", caption: "Load More Responses", show: false, className: "more-responses-button", onclick: "moreCommentsButtonClick"}
			]}
		]},
		{kind: "Toolbar", components: [
			{name: "backButton", caption: "Back", onclick: "backButtonClick"},
			{flex: 1},
			{name: "shareButton", caption: "Web", onclick: "shareClick"}
		]}
	],
	create: function() { 
		this.inherited(arguments); //calls the create method of our kind's superkind
		
		this.commentPageNumber;
		this.maxPages;
		
		this.comments = [];
		this.singleShot; // the shot we are looking at
		
		// hide rebound block and comments button.  might not need them.
		this.$.rebound.setShowing(false);
		this.$.moreCommentsButton.setShowing(false);
	},
	commenterClicked: function(inSender, inRowIndex) { // launch player profile, comment author clicked
		// Either save the commenter player object or we'll have to make an API call to get it (still need to save the id tho)
		// saved in comments[]
		console.debug(inRowIndex);
		//this.comments[inRowIndex.rowIndex].player.title 
		this.log("Details View: " + this.comments[inRowIndex.rowIndex].player.name + " Clicked!");
		this.doPlayerSelected(this.comments[inRowIndex.rowIndex].player);
	},
	playerClicked: function(inSender) { // launch player profile, shot player clicked
		this.log("Details View: " + this.singleShot.player.name + " Clicked!");
		this.doPlayerSelected(this.singleShot.player);
	},
	moreCommentsButtonClick: function(inSender) { // incremement page count and retrieve new page of comments
		this.commentPageNumber++;
		this.log("http://api.dribbble.com/shots/" + this.singleShot.id + "/comments?per_page=30&page=" + this.commentPageNumber);
		this.$.getComments.setUrl("http://api.dribbble.com/shots/" + this.singleShot.id + "/comments?per_page=30&page=" + this.commentPageNumber);
		this.$.getComments.call();
	},
	backButtonClick: function(inSender) {
		this.doReturnToBrowse();
	},
	shareClick: function(inSender, inEvent) {
		this.log("Share icon clicked!");
		window.open(this.singleShot.short_url);
	},
	setUpDetails: function() { // manually called when view is selected. Populate fields before calling API for comments and/or rebound
		this.log("in shotDetail.setUpDetails()");
		
		// is user is using the default avatar, use the correct path
		if (this.singleShot.player.avatar_url == "/images/avatar-default.gif") 
			this.$.playerImage.setSrc("http://dribbble.com/images/avatar-default.gif");
		else
			this.$.playerImage.setSrc(this.singleShot.player.avatar_url);
			
		this.$.playerName.setContent(/*"by " + */this.singleShot.player.name);
		
		this.$.shotImageLarge.setSrc(this.singleShot.image_url);
		this.$.shotName.setContent(this.singleShot.title);
		
		// convert date to user's locale "2011/06/24 12:21:16 -0400" becomes "Saturday, June 24, 2011"
		this.$.shotDate.setContent((new Date(this.singleShot.created_at)).toLocaleDateString());
		
		// print out responses, handle singular/plural
		if (this.singleShot.comments_count == 1)
			this.$.responses.setCaption("1 Response");
		else if (this.singleShot.comments_count == 0)
			this.$.responses.setCaption("No Responses yet");
		else if (this.singleShot.comments_count > 1)
			this.$.responses.setCaption(this.singleShot.comments_count + " Responses");
		
		// print shot stats
		this.$.viewCount.setContent("Views: " + this.singleShot.views_count);
		this.$.likeCount.setContent("Likes: " + this.singleShot.likes_count);
		this.$.reboundCount.setContent("Rebounds: " + this.singleShot.rebounds_count);
		
		// if this shot is a rebound, get the rebound info
		if (this.singleShot.rebound_source_id != null) { 
			this.log("This shot is a rebound!");
			this.$.rebound.setShowing(true);
			this.$.getRebound.setUrl("http://api.dribbble.com/shots/" + this.singleShot.rebound_source_id);
			this.$.getRebound.call();
		}
		
		// get the comments for this shot
		this.$.getComments.setUrl("http://api.dribbble.com/shots/" + this.singleShot.id + "/comments?per_page=30");
		this.$.getComments.call();
	},
	destroyDetails: function() {
		this.log("in shotDetail.destroyDetails()");
		this.$.rebound.setShowing(false);
		this.$.moreCommentsButton.setShowing(false);
		
		this.$.shotImageLarge.setSrc("");
		this.$.reboundImage.setSrc("");
		this.$.playerImage.setSrc("");
		
		this.comments = [];
		//this.$.commentsList.punt();
		//this.$.commentsList.reset();
		
		this.$.scroller.scrollTo(0, 0);
		//this.$.commentsList.punt() flush list buffers - only way to reset scroll position
	},
	getReboundSuccess: function(inSender, inResponse) {
		this.log("Got Rebound details!");
		this.$.reboundImage.setSrc(inResponse.image_teaser_url);
		this.$.reboundName.setContent(inResponse.title);
		this.$.reboundPlayer.setContent(inResponse.player.name);
		this.log("Rebound Player Name: " + inResponse.player.name);
	},
	getReboundFailure: function(inSender, inResponse) {
		this.log("Failed to get rebound shot");
	},
	getCommentsSuccess: function(inSender, inResponse) {
		// hide button. well only show it if there's another page.
		this.$.moreCommentsButton.setShowing(false);
		this.comments = inResponse.comments;
		
		this.commentPageNumber = inResponse.page;
		this.maxPages = inResponse.pages;
		
		// if more than one page or comments, adjust header
		if (inResponse.pages > 1)
			this.$.responses.setCaption(inResponse.total + " Responses (Page " + inResponse.page + " of " + inResponse.pages + ")");
		
		
		if (this.maxPages > this.commentPageNumber) // if number of pages exceed current page, there's more comments. Display button
		{
			this.$.moreCommentsButton.setShowing(true);
			this.log(inResponse.pages + " pages of comments!");
		}
		this.$.scroller.scrollTo(0, 0); // animated scroll to top
		
		this.$.commentsList.render();
	},
	getCommentsFailure: function(inSender, inResponse) {
		this.log("Failed to get comments");
	},
	setupUpComments: function(inSender, inIndex) {
		var c = this.comments[inIndex];
		if (c) {
		
			// if default avatar, user proper url
			if (c.player.avatar_url == "/images/avatar-default.gif") 
				this.$.commentAvatar.setSrc("http://dribbble.com/images/avatar-default.gif");
			else
				this.$.commentAvatar.setSrc(c.player.avatar_url);
		
			this.$.commentPoster.setContent(c.player.name);
			//this.$.commentDate.setContent((new Date(c.created_at)).toLocaleDateString());
			this.$.commentDate.setContent(fuzzyDate.convert(new Date(c.created_at)));
			this.$.commentText.setContent(c.body);
			return true;
		}
	}
});