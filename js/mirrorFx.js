/**
 * mirrorFx.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2017, Codrops
 * http://www.codrops.com
 */
;(function(window) {

	'use strict';

	// Helper vars and functions.
	function extend( a, b ) {
		for( var key in b ) { 
			if( b.hasOwnProperty( key ) ) {
				a[key] = b[key];
			}
		}
		return a;
	}

	// from http://www.quirksmode.org/js/events_properties.html#position
	function getMousePos(e) {
		var posx = 0, posy = 0;
		if (!e) var e = window.event;
		if (e.pageX || e.pageY) 	{
			posx = e.pageX;
			posy = e.pageY;
		}
		else if (e.clientX || e.clientY) 	{
			posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		return { x : posx, y : posy }
	}

	// equation of a line
	function lineEq(y2, y1, x2, x1, currentVal) {
		// y = mx + b
		var m = (y2 - y1) / (x2 - x1),
			b = y1 - m * x1;

		return m * currentVal + b;
	}

	function MirrorFx(el, options) {
		this.el = el;
		this.options = extend({}, this.options);
		extend(this.options, options);
		this.imgs = {
			side1: this.el.querySelector('.mirror__side--one > img.mirror__img'),
			side2: this.el.querySelector('.mirror__side--two > img.mirror__img')
		};
		// check possible data-attrs in the DOM element.
		if( this.el.getAttribute('data-visible-area') != undefined ) {
			this.options.visibleArea = this.el.getAttribute('data-visible-area');
		}
		if( this.el.getAttribute('data-layout') != undefined ) {
			this.options.layout = this.el.getAttribute('data-layout');
		}
		if( this.el.getAttribute('data-tilt') != undefined ) {
			this.options.tilt = true;
		}
	}

	MirrorFx.prototype.options = {
		// Animation duration for when showing and hiding the image(s).
		duration: {show: 1500, hide: 1000},
		// Animation easing for when showing and hiding the image(s).
		easing: {show: 'easeOutExpo', hide: 'easeOutQuint'},
		// horizontal||vertical layout.
		layout: 'horizontal',
		// This is the amount of the image that is shown. Value goes from 0 to 1. The higher the value the more the image gets revealed.
		visibleArea: 1,
		// Mousemove functionality.
		tilt: false,
		// Each image will move from visibleArea and visibleArea*tiltFactor
		tiltFactor: 0.6,
		// Rotation on the z-axis
		tiltRotation: 10
	};

	MirrorFx.prototype._initTilt = function() {
		var self = this;
		this.imgs.side1.style.WebkitTransition = this.imgs.side2.style.transition = 'transform 0.2s ease-out';

		this.mousemoveFn = function(ev) {
			requestAnimationFrame(function() {
				// Mouse position relative to the document.
				var mousepos = getMousePos(ev),
					// Document scrolls.
					docScrolls = {left : document.body.scrollLeft + document.documentElement.scrollLeft, top : document.body.scrollTop + document.documentElement.scrollTop},
					win = {width: window.innerWidth, height: window.innerHeight},
					// Mouse position relative to the main element (this.el).
					relmousepos = { x : mousepos.x - docScrolls.left, y : mousepos.y - docScrolls.top },

					d = self.options.layout === 'horizontal' ? win.width : win.height,
					m = self.options.layout === 'horizontal' ? relmousepos.x : relmousepos.y,
					tVal = m < d/2 ? 
						lineEq(self.options.visibleArea, self.options.visibleArea*self.options.tiltFactor, d/2, 0, m) : 
						lineEq(self.options.visibleArea*self.options.tiltFactor, self.options.visibleArea, d, d/2, m),

					rz = self.options.tiltRotation/win.height*relmousepos.y;

				self.imgs.side1.style.WebkitTransform = self.imgs.side1.style.transform = self.imgs.side2.style.WebkitTransform = self.imgs.side2.style.transform = 'translate' + (self.options.layout === 'horizontal' ? 'X' : 'Y') + '(' + (1-tVal)*100 + '%) rotateZ(' + rz + 'deg)';
			});
		};
		window.addEventListener('mousemove', this.mousemoveFn);
	};

	MirrorFx.prototype._removeTilt = function() {
		this.imgs.side1.style.WebkitTransition = this.imgs.side2.style.transition = 'none';
		window.removeEventListener('mousemove', this.mousemoveFn);
	};

	MirrorFx.prototype._animate = function(action, callback) {
		this._removeTilt();

		var opts = {
			targets: [this.imgs.side1, this.imgs.side2],
			duration: this.options.duration[action],
			easing: this.options.easing[action],
			opacity: {
				value: action === 'show' ? [0,1] : [1,0], 
				duration: action === 'show' ? this.options.duration[action] : this.options.duration[action]*.5,
				easing: this.options.easing[action]
			},
			rotateZ: 0
		};

		if( this.options.layout === 'horizontal' ) {
			opts.translateX = action === 'show' ? ['100%', Math.ceil((1-this.options.visibleArea)*100) + '%'] : '100%';
		}
		else {
			opts.translateY = action === 'show' ? ['100%', Math.ceil((1-this.options.visibleArea)*100) + '%'] : '100%';
		}

		var self = this;
		
		opts.complete = typeof callback === 'function' ? 
			function() {
				callback();
				if( self.options.tilt && action === 'show' ) {
					self._initTilt();
				}
			} : 
			function() {
				if( self.options.tilt && action === 'show' ) {
					self._initTilt();
				}
			};

		anime.remove(this.imgs.side1);
		anime.remove(this.imgs.side2);
		anime(opts);
	};

	MirrorFx.prototype.show = function(callback) {
		this._animate('show', callback);
	};

	MirrorFx.prototype.hide = function(callback) {
		this._animate('hide', callback);
	};

	window.MirrorFx = MirrorFx;

})(window);