enyo.kind({
	name: "Akanster.Header",
	kind: enyo.VFlexBox,
	components: [
		{kind: "PageHeader", className: "enyo-header-dark", components: [
			{flex: 1},
			{content: "Bounce!", name: "header", className: "header-text"},
			{flex: 1}
		]}
	]
});