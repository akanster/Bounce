// from https://developer.palm.com/distribution/viewtopic.php?f=102&t=14555&p=74003
enyo.kind({
	name: "HDomBuffer",
	kind: enyo.Buffer,
	rowsPerPage: 3,
	lastPage: 0,
	//* @protected
	constructor: function() {
		this.inherited(arguments);
		this.pool = [];
	},
	generateRows: function(inPage) {
		var h = [];
		for (var i=0, ri=this.rowsPerPage*inPage, r; i<this.rowsPerPage; i++, ri++) {
			r = this.generateRow(ri);
			if (r) {
				h.push(r);
			}
		}
		if (!h.length) {
			return false;
		}
		return h.join('');
	},
	preparePage: function(inPage) {
		//this.log(inPage);
		var div = this.pages[inPage] = this.pages[inPage] || (this.pool.length ? this.pool.pop() : document.createElement('div'));
		div.style.display = "none";
		div.className = "page enyo-hflexbox";
		div.id = "page-" + inPage;
		return div;
	},
	installPage: function(inNode, inPage) {
		if (!inNode.parentNode) {
			var parentNode = this.pagesNode;
			if (inPage < this.bottom) {
				parentNode.insertBefore(inNode, parentNode.firstChild);
			} else {
				parentNode.appendChild(inNode);
			}
		}
	},
	//* @public
	acquirePage: function(inPage) {
		//this.log(inPage);
		var h = this.generateRows(inPage);
		if (h === false) {
			return false;
		}
		var node = this.preparePage(inPage);
		node.innerHTML = h;
		this.installPage(node, inPage);
	},
	discardPage: function(inPage) {
		//this.log(inPage);
		var n = this.pages[inPage];
		if (!n) {
			this.warn("bad page:", inPage);
		} else {
			n.parentNode.removeChild(n);
			this.pool.push(n);
			this.pages[inPage] = null;
		}
	}
});
enyo.kind({
	name: "HDisplayBuffer",
	kind: enyo.Buffer,
	height: 0,
	acquirePage: function(inPage) {
		var node = this.pages[inPage];
		if (node) {
			node.style.display = "";
			if (!this.heights[inPage]) {
				this.height += this.heights[inPage] = node.offsetWidth;
			}
		}
	},
	discardPage: function(inPage) {
		var node = this.pages[inPage];
		if (node) {
			node.style.display = "none";
		}
		this.height -= this.heights[inPage] || 0;
	}
});
/* Copyright 2009-2011 Hewlett-Packard Development Company, L.P. All rights reserved. */
/**
enyo.ScrollStrategy implements scrolling dynamics simulation. It is a helper kind used
by other scroller kinds.

enyo.ScrollStrategy is not typically created in application code.
*/
enyo.kind({
	name: "HScrollStrategy",
	kind: enyo.Component,
	published:{
		horizontal: true,
		vertical:false,
	},
	events: {
		onScrollStart: "scrollStart",
		onScroll: "scroll",
		onScrollStop: "scrollStop"
	},
	//* 'spring' damping returns the scroll position to a value inside the boundaries (lower provides FASTER snapback)
	kSpringDamping: 0.93,
	//* 'drag' damping resists dragging the scroll position beyond the boundaries (lower provides MORE resistance)
	kDragDamping: 0.5,
	//* 'friction' damping reduces momentum over time (lower provides MORE friction)
	kFrictionDamping: 0.97,
	//* Additional 'friction' damping applied when momentum carries the viewport into overscroll (lower provides MORE friction)
	kSnapFriction: 0.9,
	//* Scalar applied to 'flick' event velocity
	kFlickScalar: 0.01,
	//* the value used in friction() to determine if the deta (e.g. y - y0) is close enough to zero to consider as zero.
	kFrictionEpsilon: 1e-2,
	//* right snap boundary, generally (viewport width - content width)
	rightBoundary: 0,
	//* left snap boundary, generally 0
	leftBoundary: 0,
	//* animation time step
	interval: 20,
	//* flag to enable frame-based animation, otherwise use time-based animation
	fixedTime: true,
	//* @protected
	// simulation state
	x0: 0,
	x: 0,
	destroy: function() {
		this.stop();
		this.inherited(arguments);
	},
	/**
		Simple Verlet integrator for simulating Newtonian motion.
	*/
	verlet: function(p) {
		var x = this.x;
		this.x += x - this.x0;
		this.x0 = x;
	},
	/**
		Boundary damping function.
		Return damped 'value' based on 'coeff' on one side of 'origin'.
	*/
	damping: function(value, origin, coeff, sign) {
		var kEpsilon = 0.5;
		//
		// this is basically just value *= coeff (generally, coeff < 1)
		//
		// 'sign' and the conditional is to force the damping to only occur
		// on one side of the origin.
		//
		// Force close to zero to be zero
		if (Math.abs(value-origin) < kEpsilon) {
			return origin;
		}
		return value*sign > origin*sign ? coeff * (value-origin) + origin : value;
	},
	/**
		Dual-boundary damping function.
		Return damped 'value' based on 'coeff' when exceeding either boundary.
	*/
	boundaryDamping: function(value, aBoundary, bBoundary, coeff) {
		return this.damping(this.damping(value, aBoundary, coeff, 1), bBoundary, coeff, -1);
	},
	/**
		Simulation constraints (spring damping occurs here)
	*/
	constrain: function() {
		var x = this.boundaryDamping(this.x, this.leftBoundary, this.rightBoundary, this.kSpringDamping);
		if (x != this.x) {
			this.x0 = x - (this.x - this.x0) * this.kSnapFriction;
			this.x = x;
		}
	},
	/**
		The friction function
	*/
	friction: function(inEx, inEx0, inCoeff) {
		// implicit velocity
		var dp = this[inEx] - this[inEx0];
		// let close-to-zero collapse to zero (smaller than epsilon is considered zero)
		var c = Math.abs(dp) > this.kFrictionEpsilon ? inCoeff : 0;
		// reposition using damped velocity
		this[inEx] = this[inEx0] + c * dp;
	},
	// one unit of time for simulation
	frame: 10,
	// piece-wise constraint simulation
	simulate: function(t) {
		while (t >= this.frame) {
			t -= this.frame;
			if (!this.dragging) {
				this.constrain();
			}
			this.verlet();
			this.friction('x', 'x0', this.kFrictionDamping);
		}
		return t;
	},
	animate: function() {
		this.stop();
		// time tracking
		var t0 = new Date().getTime(), t = 0;
		// delta tracking
		var x0;
		// animation handler
		var fn = enyo.bind(this, function() {
			// wall-clock time
			var t1 = new Date().getTime();
			// schedule next frame
			this.job = enyo.requestAnimationFrame(fn);
			// delta from last wall clock time
			var dt = t1 - t0;
			// record the time for next delta
			t0 = t1;
			// user drags override animation
			if (this.dragging) {
				this.x0 = this.x = this.ux;
			}
			// frame-time accumulator
			t += dt;
			// alternate fixed-time step strategy:
			if (this.fixedTime && !this.isInOverScroll()) {
				t = this.interval;
			}
			// consume some t in simulation
			t = this.simulate(t);
			// scroll if we have moved, otherwise the animation is stalled and we can stop
			if (x0 != this.x) {
				this.scroll();
			} else if (!this.dragging) {
				this.stop(true);
				this.scroll();
			}
			x0 = this.x;
		});
		this.job = enyo.requestAnimationFrame(fn);
	},
	//* @public
	start: function() {
		//this.log(this.job);
		if (!this.job) {
			this.animate();
			this.doScrollStart();
		}
	},
	//* @protected
	stop: function(inFireEvent) {
		this.job = enyo.cancelRequestAnimationFrame(this.job);
		inFireEvent && this.doScrollStop();
	},
	startDrag: function(e) {
		this.dragging = true;
		//
		this.mx = e.pageX;
		this.px = this.ux = this.x;
	},
	drag: function(e) {
		if (this.dragging) {
			var dx = this.horizontal ? e.pageX - this.mx : 0;
			this.ux = dx + this.px;
			// provides resistance against dragging into overscroll
			this.ux = this.boundaryDamping(this.ux, this.leftBoundary, this.rightBoundary, this.kDragDamping);
			//
			this.start();
			return true;
		}
	},
	dragDrop: function(e) {
		if (this.dragging && !window.PalmSystem) {
			var kSimulatedFlickScalar = 0.5;
			this.x = this.ux;
			this.x0 = this.x - (this.x - this.x0) * kSimulatedFlickScalar;
		}
		this.dragging = false;
	},
	dragFinish: function() {
		this.dragging = false;
	},
	flick: function(e) {
		if (this.horizontal) {
			this.x = this.x0 + e.xVel * this.kFlickScalar;
		}
		this.start();
	},
	scroll: function() {
		this.doScroll();
	},
	setScrollPosition: function(inPosition) {
		this.x = this.x0 = inPosition;
	},
	isScrolling: function() {
		return this.job;
	},
	isInOverScroll: function() {
		return this.job && (this.x > this.leftBoundary || this.x < this.rightBoundary);
	}
});
enyo.kind({
	name: "HVirtualScroller",
	kind: enyo.DragScroller,
	events: {
		onScroll: ""
	},
	vertical:false,
	published: {
		/**
		Use accelerated scrolling.
		*/
		accelerated: true
	},
	className: "enyo-virtual-scroller",
	//* @protected
	tools: [
		{name: "scroll", kind: "HScrollStrategy", leftBoundary: 1e9, rightBoundary: -1e9}
	],
	chrome: [
		// fitting div to prevent layout leakage
		{className: "enyo-fit", components: [
			// important for compositing that this height be fixed, as to avoid reallocating textures
			{className:"enyo-hflexbox",name: "content", width: "2048px"}
		]}
	],
	//
	// custom sliding-buffer
	//
	top: 0,
	bottom: -1,
	pageTop: 0,
	pageOffset: 0,
	contentHeight: 0,
	constructor: function() {
		this.heights = [];
		this.inherited(arguments);
	},
	create: function() {
		this.inherited(arguments);
		this.acceleratedChanged();
	},
	rendered: function() {
		this.inherited(arguments);
		this.measure();
		this.$.scroll.animate();
		// animate will not do anything if the object is in steady-state
		// so we ensure we have filled our display buffer here
		this.updatePages();
	},
	acceleratedChanged: function() {
		var p = this.pageTop;
		this.pageTop = 0;
		if (this.effectScroll) {
			this.effectScroll();
		}
		this.pageTop = p;
		this.effectScroll = this.accelerated ? this.effectScrollAccelerated : this.effectScrollNonAccelerated;
		this.$.content.applyStyle("margin", this.accelerated ? null : "0 900px");
		this.$.content.addRemoveClass("enyo-accel-children", this.accelerated);
		this.effectScroll();
	},
	measure: function() {
		//this.unlockClipRegion();
		this.viewNode = this.hasNode();
		if (this.viewNode) {
			this.viewHeight = this.viewNode.clientWidth;
		}
	},
	//
	// prompt the scroller to start.
	start: function() {
		this.$.scroll.start();
	},
	//
	// FIXME: Scroller's shiftPage/unshiftPage/pushPage/popPage are implemented via adjustTop/adjustBottom
	// Conversely, Buffer's adjustTop/adjustBottom are implemented via shift/unshift/push/pop
	// Presumably there is a less confusing way of factoring or naming the methods.
	//
	// abstract: subclass must supply
	adjustTop: function(inTop) {
	},
	// abstract: subclass must supply
	adjustBottom: function(inBottom) {
	},
	// add a page to the top of the window
	unshiftPage: function() {
		var t = this.top - 1;
		if (this.adjustTop(t) === false) {
			return false;
		}
		this.top = t;
	},
	// remove a page from the top of the window
	shiftPage: function() {
		this.adjustTop(++this.top);
	},
	// add a page to the top of the window
	pushPage: function() {
		//this.log(this.top, this.bottom);
		var b = this.bottom + 1;
		if (this.adjustBottom(b) === false) {
			return false;
		}
		this.bottom = b;
	},
	// remove a page from the top of the window
	popPage: function() {
		this.adjustBottom(--this.bottom);
	},
	//
	// NOTES:
	//
	// pageOffset represents the scroll-distance in the logical display (from ScrollManager's perspective)
	// that is hidden from the real display (via: display: none). It's measured as pixels above the origin, so
	// the value is <= 0.
	//
	// pageTop is the scroll position on the real display, also <= 0.
	//
	// show pages that have scrolled in from the bottom
	pushPages: function() {
		// contentHeight is the height of displayed DOM pages
		// pageTop is the actual scrollTop for displayed DOM pages (negative)
		while (this.contentHeight + this.pageTop < this.viewHeight) {
			if (this.pushPage() === false) {
				this.$.scroll.rightBoundary = Math.min(-this.contentHeight + this.pageOffset + this.viewHeight, -1);
				break;
			}
			// NOTE: this.heights[this.bottom] can be undefined if there is no data to render, and therefore no nodes at this.bottom
			this.contentHeight += this.heights[this.bottom] || 0;
		}
	},
	// hide pages that have scrolled off of the bottom
	popPages: function() {
		// NOTE: this.heights[this.bottom] can be undefined if there is no data to render, and therefore no nodes at this.bottom
		var h = this.heights[this.bottom];
		while (h !== undefined && this.bottom && this.contentHeight + this.pageTop - h > this.viewHeight) {
			this.popPage();
			this.contentHeight -= h;
			h = this.heights[this.bottom];
		}
	},
	// hide pages that have scrolled off the top
	shiftPages: function() {
		// the height of the first (displayed) page
		var h = this.heights[this.top];
		while (h !== undefined && h < -this.pageTop) {
			// increase the distance from the logical display that is hidden from the real display
			this.pageOffset -= h;
			// decrease the distance representing the scroll position on the real display
			this.pageTop += h;
			// decrease the height of the real display
			this.contentHeight -= h;
			// process the buffer movement
			this.shiftPage();
			// the height of the new first page
			h = this.heights[this.top];
		}
	},
	// show pages that have scrolled in from the top
	unshiftPages: function() {
		while (this.pageTop > 0) {
			if (this.unshiftPage() === false) {
				this.$.scroll.leftBoundary = this.pageOffset;
				this.$.scroll.rightBoundary = -9e9;
				break;
			}
			// note: if h is zero we will loop again
			var h = this.heights[this.top];
			if (h === undefined) {
				this.top++;
				return;
			}
			this.contentHeight += h;
			this.pageOffset += h;
			this.pageTop -= h;
		}
	},
	updatePages: function() {
		if (!this.viewNode) {
			return;
		}
		// re-query viewHeight every iteration
		// querying DOM can cause a synchronous layout
		// but commonly there is no dirty layout at this time.
		this.viewHeight = this.viewNode.clientWidth;
		if (this.viewHeight <= 0) {
			return;
		}
		//
		// recalculate boundaries every iteration
		var ss = this.$.scroll;
		ss.leftBoundary = 9e9;
		ss.rightBoundary = -9e9;
		//
		// show pages that have scrolled in from the bottom
		this.pushPages();
		// hide pages that have scrolled off the bottom
		this.popPages();
		// show pages that have scrolled in from the top
		this.unshiftPages();
		// hide pages that have scrolled off the top
		this.shiftPages();
		//
		// pageTop can change as a result of updatePages, so we need to perform content translation
		// via effectScroll
		// scroll() method doesn't call effectScroll because we call it here
		this.effectScroll();
	},
	scroll: function() {
		// calculate relative pageTop
		var pt = Math.round(this.$.scroll.x) - this.pageOffset;
		if (pt == this.pageTop) {
			return;
		}
		// page top drives all page rendering / discarding
		this.pageTop = pt;
		// add or remove pages from either end to satisfy display requirements
		this.updatePages();
		// perform content translation
		this.doScroll();
	},
	// NOTE: there are a several ways to effect content motion.
	// The 'transform' method in combination with hardware acceleration promises
	// the smoothest animation, but hardware acceleration in combination with the
	// trick-scrolling gambit implemented here produces visual artifacts.
	// In the absence of hardware acceleration, scrollTop appears to be the fastest method.
	effectScrollNonAccelerated: function() {
		//webosEvent.event('', 'enyo:effectScrollNonAccelerated', '');
		if (this.hasNode()) {
			this.node.scrollTop = 900 - this.pageTop;
		}
	},
	effectScrollAccelerated: function() {
		//webosEvent.event('', 'enyo:effectScrollAccelerated', '');
		var n = this.$.content.hasNode();
		if (n) {
			n.style.webkitTransform = 'translate3d(' + this.pageTop + 'px,0,0)';
		}
	}
});
/* Copyright 2009-2011 Hewlett-Packard Development Company, L.P. All rights reserved. */
//* @protected
enyo.kind({
	name: "HBufferedScroller",
	kind: HVirtualScroller,
	rowsPerPage: 1,
	events: {
		onGenerateRow: "generateRow",
		onAdjustTop: "",
		onAdjustBottom: ""
	},
	//* @protected
	constructor: function() {
		this.pages = [];
		this.inherited(arguments);
	},
	create: function() {
		this.inherited(arguments);
		this.createDomBuffer();
		this.createDisplayBuffer();
	},
	createDomBuffer: function() {
		this.domBuffer = this.createComponent({
			kind: HDomBuffer,
			rowsPerPage: this.rowsPerPage,
			pages: this.pages,
			margin: 20,
			generateRow: enyo.hitch(this, "doGenerateRow")
		});
	},
	createDisplayBuffer: function() {
		this.displayBuffer = new HDisplayBuffer({
			heights: this.heights,
			pages: this.pages
		});
	},
	rendered: function() {
		this.domBuffer.pagesNode = this.$.content.hasNode();
		this.inherited(arguments);
	},
	pageToTopRow: function(inPage) {
		return inPage * this.rowsPerPage;
	},
	pageToBottomRow: function(inPage) {
		return inPage * this.rowsPerPage + (this.rowsPerPage - 1);
	},
	//* @public
	adjustTop: function(inTop) {
		this.doAdjustTop(this.pageToTopRow(inTop));
		if (this.domBuffer.adjustTop(inTop) === false) {
			return false;
		}
		this.displayBuffer.adjustTop(inTop);
	},
	adjustBottom: function(inBottom) {
		this.doAdjustBottom(this.pageToBottomRow(inBottom));
		if (this.domBuffer.adjustBottom(inBottom) === false) {
			return false;
		}
		this.displayBuffer.adjustBottom(inBottom);
	},
	findBottom: function() {
		while (this.pushPage() !== false) {};
		this.contentHeight = this.displayBuffer.height;
		var bb = Math.min(-this.contentHeight + this.pageOffset + this.viewHeight, -1);
		this.$.scroll.rightBoundary = this.$.scroll.x = this.$.scroll.x0 = bb;
		this.scroll();
	},
	refreshPages: function() {
		// flush all DOM nodes
		this.domBuffer.flush();
		// domBuffer top/bottom are linked to scroller top/bottom because
		// scroller shiftPages/popPages rely on top/bottom referring to known
		// regions
		this.bottom = this.top - 1;
		this.displayBuffer.bottom = this.domBuffer.bottom = this.bottom;
		this.displayBuffer.top = this.domBuffer.top = this.top;
		// clear metrics
		this.contentHeight = 0;
		this.displayBuffer.height = 0;
		this.heights = this.displayBuffer.heights = [];
		// rebuild pages
		this.updatePages();
	},
	punt: function() {
		this.$.scroll.stop();
		this.bottom = -1;
		this.top = 0;
		this.domBuffer.flush();
		this.displayBuffer.bottom = this.domBuffer.bottom = this.bottom;
		this.displayBuffer.top = this.domBuffer.top = this.top;
		this.contentHeight = 0;
		this.displayBuffer.height = 0;
		this.heights = this.displayBuffer.heights = [];
		this.pageOffset = 0;
		this.pageTop = 0;
		this.$.scroll.x = this.$.scroll.x0 = 0;
		// rebuild pages
		this.updatePages();
	}
});
enyo.kind({
	name: "HScrollingList",
	kind: enyo.HFlexBox,
	events: {
		onSetupRow: ""
	},
	rowsPerScrollerPage: 1,
	//* @protected
	controlParentName: "list",
	initComponents: function() {
		this.createComponents([
			{flex: 1, name: "scroller", kind: HBufferedScroller, rowsPerPage: this.rowsPerScrollerPage, onGenerateRow: "generateRow", onAdjustTop: "adjustTop", onAdjustBottom: "adjustBottom", components: [
				{name: "list", kind: enyo.RowServer, onSetupRow: "setupRow"}
			]}
		]);
		this.inherited(arguments);
	},
	generateRow: function(inSender, inRow) {
		return this.$.list.generateRow(inRow);
	},
	setupRow: function(inSender, inRow) {
		return this.doSetupRow(inRow);
	},
	//* @public
	prepareRow: function(inIndex) {
		return this.$.list.prepareRow(inIndex);
	},
	updateRow: function(inIndex) {
		this.prepareRow(inIndex);
		this.setupRow(this, inIndex);
	},
	fetchRowIndex: function() {
		return this.$.list.fetchRowIndex();
	},
	update: function() {
		// adjust rendering buffers to fit display
		this.$.scroller.updatePages();
	},
	refresh: function() {
		this.$.list.saveCurrentState();
		this.$.scroller.refreshPages();
	},
	reset: function() {
		// dump state buffer
		this.$.list.clearState();
		// stop scroller animation
		this.$.scroller.$.scroll.stop();
		// dump and rebuild rendering buffers
		this.refresh();
	},
	punt: function() {
		// dump state buffer
		this.$.list.clearState();
		// dump rendering buffers and locus data, rebuild from start state
		this.$.scroller.punt();
	}
});
enyo.kind({
	name: "HVirtualList",
	kind: HScrollingList,
	published: {
		lookAhead: 2,
		pageSize: 10
	},
	events: {
		onAcquirePage: "",
		onDiscardPage: ""
	},
	//* @protected
	initComponents: function() {
		this.inherited(arguments);
		this.createComponents([
			{kind: "Selection", onClear: "selectionCleared", onDeselect: "updateRowSelection", onSelect: "updateRowSelection"},
			{kind: "Buffer", overbuffer: this.lookAhead, margin: 3, onAcquirePage: "doAcquirePage", onDiscardPage: "doDiscardPage"}
		]);
	},
	//* @public
	/**
	 Set the selection state for the given row index.
	*/
	select: function(inRowIndex, inData) {
		return this.$.selection.select(inRowIndex, inData);
	},
	/**
	 Get the selection state for the given row index.
	*/
	isSelected: function(inRowIndex) {
		return this.$.selection.isSelected(inRowIndex);
	},
	/**
	 Enable/disable multi-select mode
	*/
	setMultiSelect: function(inMulti) {
		this.$.selection.setMulti(inMulti);
		this.refresh();
	},
	/**
	Returns the selection component (<a href="#enyo.Selection">enyo.Selection</a>) that manages the selection
	state for this list.
	*/
	getSelection: function() {
		return this.$.selection;
	},
	//* @protected
	updateRowSelection: function(inSender, inRowIndex) {
		this.updateRow(inRowIndex);
	},
	resizeHandler: function() {
		if (this.hasNode()) {
			this.log();
			this.$.scroller.measure();
			this.refresh();
			this.$.scroller.start();
		} else {
			this.log("no node");
		}
	},
	//* @protected
	rowToPage: function(inRowIndex) {
		return Math.floor(inRowIndex / this.pageSize);
	},
	adjustTop: function(inSender, inTop) {
		var page = this.rowToPage(inTop);
		this.$.buffer.adjustTop(page);
	},
	adjustBottom: function(inSender, inBottom) {
		var page = this.rowToPage(inBottom);
		this.$.buffer.adjustBottom(page);
	},
	reset: function() {
		this.$.buffer.bottom = this.$.buffer.top - 1;
		this.inherited(arguments);
	}
});