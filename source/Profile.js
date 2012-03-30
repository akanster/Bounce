enyo.kind({
	name: "Akanster.playerProfile",
	kind: enyo.VFlexBox,
	events: { 
		onReturnToPrevious: ""
	},
	components: [
		{kind: "VFlexBox", flex: 1, className: "player", components: [
			{name: "profileBlock", className: "profile-block", layoutKind: "HFlexLayout", components: [
				{kind: "Image", name: "profileImage", className: "profile-image"},
				{kind: "VFlexBox", className: "profile-details-block", flex: 1, components: [
					{name: "profileName", className: "profile-name"},
					{kind: "HFlexBox", name: "profileLocationBlock", className: "profile-location-block", flex: 1, components: [
						{name: "locationImage", kind: "Image", className: "profile-location-image", src: "images/glyphish/07-map-marker.png"},
						{name: "profileLocation", className: "profile-location"}
					]},
					{kind: "HFlexBox", name: "profileTwitterBlock", className: "profile-twitter-block", flex: 1, components: [
						{name: "twitterImage", kind: "Image", className: "profile-twitter-image", src: "images/twitter22.png"},
						{name: "profileTwitter", className: "profile-twitter"},
						{style: "width: 5px;"},
						{name: "webImage", kind: "Image", className: "profile-web-image", src: "images/glyphish/27-planet.png"},
						{name: "profileWebsite", className: "profile-website"}
					]}
				]}
			]},
			{kind: "Divider", name: "shotsDivider", className: "comments-count", caption: "Shots"},
			{kind: "HVirtualList", flex: 5, name: "playersShotsList", onSetupRow: "setupUpPlayersShots", components: [
				{kind: "Item", tapHighlight: true, className: "players-shots", components: [
					{kind: "Image"}
				]}
			]},
			{kind: "Divider", name: "followingDivider", className: "comments-count", caption: "Following"},
			{kind: "HVirtualList", flex: 3, name: "followingList", onSetupRow: "setupUpFollowing", components: [
				{kind: "Item", className: "follower-avatar", components: [ 
					{kind: "Image", name: "followingImage"}
				]}
			]},
			{kind: "Divider", name: "followersDivider", className: "comments-count", caption: "Followers"},
			{kind: "HVirtualList", flex: 3, name: "followerList", onSetupRow: "setupUpFollowers", components: [
				{kind: "Item", className: "follower-avatar", components: [ // TODO: Fix? using same classes as above for avatar
					{kind: "Image", name: "followerImage"}
				]}
			]},
		]},
		{name: "getPlayersShots", kind: "WebService", onSuccess: "getPlayersShotsSuccess", onFailure: "getPlayersShotsFailure"},
		{name: "getFollowers", kind: "WebService", onSuccess: "getFollowersSuccess", onFailure: "getFollowersFailure"},
		{name: "getFollowing", kind: "WebService", onSuccess: "getFollowingSuccess", onFailure: "getFollowingFailure"},
		{kind: "Toolbar", components: [
			{name: "backButton", caption: "Back", className: "back-button", onclick: "backButtonClick"},
			{flex: 1},
			{name: "shareButton", caption: "Web", onclick: "shareClick"}
		]}
	],
	create: function() { // override the inherited create method from VFlexBox
		this.inherited(arguments); //calls the create method of our kind's superkind
		
		this.player; // the player we are looking at.  Set by parent before view is loaded
		this.$.profileTwitterBlock.setShowing(false); // incase we jump to profile from browse and user has no twitter
		
		this.playersShots = []; // hold all the shots by this player
		this.playersFollowers = []; // hold all the followers by this player
		this.playersFollowing = []; // hold all the players being followed
	},
	destroyPlayer: function() { //
		this.log("in destroyPlayer" );
		
		this.$.profileImage.setSrc("");
		this.$.profileName.setContent("");
		this.$.profileLocation.setContent("");
		this.$.profileTwitterBlock.setShowing(false);
		this.$.profileWebsite.setShowing(false);
		
		// release items from all lists
		this.$.playersShotsList.punt();
		this.$.playersShotsList.reset();
		
		this.$.followingList.punt();
		this.$.followingList.reset();
		
		this.$.followerList.punt();
		this.$.followerList.reset();
		
	},
	setUpPlayer: function() { //
		this.log("in setUpPlayer for: " + this.player.name);
		
		this.$.profileImage.setSrc(this.player.avatar_url);
		this.$.profileName.setContent(this.player.name);
		this.$.profileLocation.setContent(this.player.location);
		
		// TODO: FIX! If user has no twitter, the whole website block is hidden.
		if (this.player.twitter_screen_name != null) // if user has no twitter name
		{
			this.$.profileTwitterBlock.setShowing(true);
			this.$.profileTwitter.setContent(this.player.twitter_screen_name);
		}
		
		if (this.player.website_url != null) // if user has no website
		{
			this.$.profileWebsite.setShowing(true);
			this.$.profileWebsite.setContent(this.player.website_url);
		}
		
		// Properly set up shots divider label
		if (this.player.shots_count == 1)
			this.$.shotsDivider.setCaption("1 Shot");
		else if (this.player.shots_count == 0)
			this.$.shotsDivider.setCaption("No Shots yet");
		else if (this.player.shots_count > 1)
			this.$.shotsDivider.setCaption(this.player.shots_count + " Shots");
			
		// Properly set up followers divider label
		if (this.player.followers_count == 1)
			this.$.followersDivider.setCaption(this.player.name + " has 1 Follower");
		else if (this.player.followers_count == 0)
			this.$.followersDivider.setCaption(this.player.name + "No Followers");
		else if (this.player.followers_count > 1)
			this.$.followersDivider.setCaption(this.player.name + " has " + this.player.followers_count + " Followers");
			
		// populate shots
		this.url = "http://api.dribbble.com/players/" + this.player.username + "/shots?per_page=30";
		this.log("Player's Shots URL: " + this.url);
		this.$.getPlayersShots.setUrl(this.url);
		this.$.getPlayersShots.call();
		
		// populate followers
		this.followersURL = "http://api.dribbble.com/players/" + this.player.username + "/followers?per_page=30";
		this.log("Player's followers URL: " + this.followersURL);
		this.$.getFollowers.setUrl(this.followersURL);
		this.$.getFollowers.call();
		
		// populate following
		this.followingURL = "http://api.dribbble.com/players/" + this.player.username + "/following?per_page=30";
		this.log("Player's following URL: " + this.followingURL);
		this.$.getFollowing.setUrl(this.followingURL);
		this.$.getFollowing.call();
	},
	getPlayersShotsSuccess: function(inSender, inResponse, inRequest) {
		this.playersShots = inResponse.shots;
		this.pageNumber = inResponse.page; // current page number
		
		this.$.playersShotsList.punt();
		
		// if more than one page of shots, fix label
		if (inResponse.pages > 1)
			this.$.shotsDivider.setCaption(inResponse.total + " Shots (Page " + inResponse.page + " of " + inResponse.pages + ")");
		
	},
	getPlayersShotsFailure: function(inSender, inResponse) {
		console.log("got failure from getPlayersShots");
	},
	getFollowersSuccess: function(inSender, inResponse, inRequest) {
		this.playersFollowers = inResponse.players;
		this.pageNumber = inResponse.page; // current page number
		
		this.$.followerList.punt();
		
		// if more than one page of shots, fix label
		if (inResponse.pages > 1)
			this.$.followersDivider.setCaption(this.player.name + " has " + inResponse.total + " followers (Page " + inResponse.page + " of " + inResponse.pages + ")");
		
	},
	getFollowersFailure: function(inSender, inResponse) {
		console.log("got failure from getFollowers");
	},
	getFollowingSuccess: function(inSender, inResponse, inRequest) {
		this.playersFollowing = inResponse.players;
		this.pageNumber = inResponse.page; // current page number 3 FUNCTIONS USING THE SAME PAGE NUMBER.  FIX!!!
		
		this.$.followingList.punt();
		
		// if more than one page of shots, fix label
		if (inResponse.pages > 1)
			this.$.followingDivider.setCaption(this.player.name + " is following " + inResponse.total + " players (Page " + inResponse.page + " of " + inResponse.pages + ")");
		
	},
	getFollowingFailure: function(inSender, inResponse) {
		console.log("got failure from getFollowing");
	},
	setupUpPlayersShots: function(inSender, inIndex) {
		var c = this.playersShots[inIndex];
		if (c) {
			this.$.image.setSrc(c.image_teaser_url);
			//this.log("Image added to list: " + c.image_teaser_url);
			return true;
		}
	},
	setupUpFollowers: function(inSender, inIndex) {
		var d = this.playersFollowers[inIndex];
		if (d) {			
				
			if (d.avatar_url == "/images/avatar-default.gif") 
				this.$.followerImage.setSrc("http://dribbble.com/images/avatar-default.gif");
			else
				this.$.followerImage.setSrc(d.avatar_url);
				
			//this.log("Follower added to list: " + d.avatar_url);
			return true;
		}
	},
	setupUpFollowing: function(inSender, inIndex) {
		var d = this.playersFollowing[inIndex];
		if (d) {			
				
			if (d.avatar_url == "/images/avatar-default.gif") 
				this.$.followingImage.setSrc("http://dribbble.com/images/avatar-default.gif");
			else
				this.$.followingImage.setSrc(d.avatar_url);
				
			//this.log("Follower added to list: " + d.avatar_url);
			return true;
		}
	},
	shareClick: function(inSender, inEvent) {
		this.log("Share icon clicked!");
		window.open(this.player.url);
	},
	backButtonClick: function(inSender) {
		//this.$.playersShotsList.punt(); // flush list buffers 
		this.doReturnToPrevious();
	}
});