/**
 * HUD
 */
Garnish.HUD = Garnish.Base.extend({

	/**
	 * Constructor
	 */
	init: function(trigger, bodyContents, settings) {

		this.$trigger = $(trigger);
		this.setSettings(settings, Garnish.HUD.defaults);

		if (typeof Garnish.HUD.activeHUDs == "undefined")
		{
			Garnish.HUD.activeHUDs = {};
		}

		this.showing = false;

		this.$hud = $('<div class="'+this.settings.hudClass+'" />').appendTo(Garnish.$bod);
		this.$tip = $('<div class="'+this.settings.tipClass+'" />').appendTo(this.$hud);
		this.$body = $('<div class="'+this.settings.bodyClass+'" />').appendTo(this.$hud).append(bodyContents);

		this.$shade = $('<div class="hud-shade"/>').insertBefore(this.$hud);

		this.show();
	},

	/**
	 * Show
	 */
	show: function(ev) {

		if (this.showing)
		{
			return;
		}

		if (this.settings.closeOtherHUDs)
		{
			for (var hudID in Garnish.HUD.activeHUDs) {
				Garnish.HUD.activeHUDs[hudID].hide();
			}
		}

		this.$hud.css('top', Garnish.$win.scrollTop());
		this.$hud.show();

		// -------------------------------------------
		//  Get all relevant dimensions, lengths, etc
		// -------------------------------------------

		this.windowWidth = Garnish.$win.width();
		this.windowHeight = Garnish.$win.height();

		this.windowScrollLeft = Garnish.$win.scrollLeft();
		this.windowScrollTop = Garnish.$win.scrollTop();

		// get the trigger element's dimensions
		this.triggerWidth = this.$trigger.outerWidth();
		this.triggerHeight = this.$trigger.outerHeight();

		// get the offsets for each side of the trigger element
		this.triggerOffset = this.$trigger.offset();
		this.triggerOffsetRight = this.triggerOffset.left + this.triggerWidth;
		this.triggerOffsetBottom = this.triggerOffset.top + this.triggerHeight;
		this.triggerOffsetLeft = this.triggerOffset.left;
		this.triggerOffsetTop = this.triggerOffset.top;

		// get the HUD dimensions
		this.width = this.$hud.outerWidth();
		this.height = this.$hud.outerHeight();

		// get the minimum horizontal/vertical clearance needed to fit the HUD
		this.minHorizontalClearance = this.width + this.settings.triggerSpacing + this.settings.windowSpacing;
		this.minVerticalClearance = this.height + this.settings.triggerSpacing + this.settings.windowSpacing;

		// find the actual available right/bottom/left/top clearances
		this.rightClearance = this.windowWidth + this.windowScrollLeft - this.triggerOffsetRight;
		this.bottomClearance = this.windowHeight + this.windowScrollTop - this.triggerOffsetBottom;
		this.leftClearance = this.triggerOffsetLeft - this.windowScrollLeft;
		this.topClearance = this.triggerOffsetTop - this.windowScrollTop;

		// -------------------------------------------
		//  Where are we putting it?
		//   - Ideally, we'll be able to find a place to put this where it's not overlapping the trigger at all.
		//     If we can't find that, either put it to the right or below the trigger, depending on which has the most room.
		// -------------------------------------------

		// below?
		if (this.bottomClearance >= this.minVerticalClearance)
		{
			var top = this.triggerOffsetBottom + this.settings.triggerSpacing;
			this.$hud.css('top', top);
			this._setLeftPos();
			this._setTipClass('top');
		}
		// above?
		else if (this.topClearance >= this.minVerticalClearance)
		{
			var top = this.triggerOffsetTop - (this.height + this.settings.triggerSpacing);
			this.$hud.css('top', top);
			this._setLeftPos();
			this._setTipClass('bottom');
		}
		// to the right?
		else if (this.rightClearance >= this.minHorizontalClearance)
		{
			var left = this.triggerOffsetRight + this.settings.triggerSpacing;
			this.$hud.css('left', left);
			this._setTopPos();
			this._setTipClass('left');
		}
		// to the left?
		else if (this.leftClearance >= this.minHorizontalClearance)
		{
			var left = this.triggerOffsetLeft - (this.width + this.settings.triggerSpacing);
			this.$hud.css('left', left);
			this._setTopPos();
			this._setTipClass('right');
		}
		// ok, which one comes the closest -- right or bottom?
		else
		{
			var rightClearanceDiff = this.minHorizontalClearance - this.rightClearance,
				bottomClearanceDiff = this.minVerticalClearance - this.bottomClearance;

			if (rightClearanceDiff >= bottomClearanceDiff)
			{
				var left = this.windowWidth - (this.width + this.settings.windowSpacing),
					minLeft = this.triggerOffsetLeft + this.settings.triggerSpacing;
				if (left < minLeft) left = minLeft;
				this.$hud.css('left', left);
				this._setTopPos();
				this._setTipClass('left');
			}
			else
			{
				var top = this.windowHeight - (this.height + this.settings.windowSpacing),
					minTop = this.triggerOffsetTop + this.settings.triggerSpacing;
				if (top < minTop) top = minTop;
				this.$hud.css('top', top);
				this._setLeftPos();
				this._setTipClass('top');
			}
		}

		if (ev && ev.stopPropagation)
		{
			ev.stopPropagation();
		}

		this.$shade.show();
		this.addListener(this.$shade, 'click', 'hide');

		if (this.settings.closeBtn)
		{
			this.addListener(this.settings.closeBtn, 'activate', 'hide');
		}

		this.showing = true;
		Garnish.HUD.activeHUDs[this._namespace] = this;

		Garnish.escManager.register(this, 'hide');

		// onShow callback
		this.settings.onShow();
	},

	/**
	 * Set Top
	 */
	_setTopPos: function()
	{
		var maxTop = (this.windowHeight + this.windowScrollTop) - (this.height + this.settings.windowSpacing),
			minTop = (this.windowScrollTop + this.settings.windowSpacing),

			triggerCenter = this.triggerOffsetTop + Math.round(this.triggerHeight / 2),
			top = triggerCenter - Math.round(this.height / 2);

		// adjust top position as needed
		if (top > maxTop) top = maxTop;
		if (top < minTop) top = minTop;

		this.$hud.css('top', top);

		// set the tip's top position
		var tipTop = (triggerCenter - top) - (this.settings.tipWidth / 2);
		this.$tip.css({ top: tipTop, left: '' });
	},

	/**
	 * Set Left
	 */
	_setLeftPos: function()
	{
		var maxLeft = (this.windowWidth + this.windowScrollLeft) - (this.width + this.settings.windowSpacing),
			minLeft = (this.windowScrollLeft + this.settings.windowSpacing),

			triggerCenter = this.triggerOffsetLeft + Math.round(this.triggerWidth / 2),
			left = triggerCenter - Math.round(this.width / 2);

		// adjust left position as needed
		if (left > maxLeft) left = maxLeft;
		if (left < minLeft) left = minLeft;

		this.$hud.css('left', left);

		// set the tip's left position
		var tipLeft = (triggerCenter - left) - (this.settings.tipWidth / 2);
		this.$tip.css({ left: tipLeft, top: '' });
	},

	/**
	 * Set Tip Class
	 */
	_setTipClass: function(c)
	{
		if (this.tipClass)
		{
			this.$tip.removeClass(this.tipClass);
		}

		this.tipClass = this.settings.tipClass+'-'+c;
		this.$tip.addClass(this.tipClass);
	},

	/**
	 * Hide
	 */
	hide: function()
	{
		this.$hud.hide();
		this.$shade.remove();
		this.showing = false;

		delete Garnish.HUD.activeHUDs[this._namespace];

		Garnish.escManager.unregister(this);

		// onHide callback
		this.settings.onHide();
	}
},
{
	defaults: {
		hudClass: 'hud',
		tipClass: 'tip',
		bodyClass: 'body',
		triggerSpacing: 7,
		windowSpacing: 20,
		tipWidth: 8,
		onShow: $.noop,
		onHide: $.noop,
		closeBtn: null,
		closeOtherHUDs: true
	}
});
