(function ($, _, preview) {
  
/* 
 |---------------------------------------------------------------------------------
 |	SCROLL SEQUENCE
 |---------------------------------------------------------------------------------
 |
 |	Contains a single sequence of keyframes, properties and triggers
 |	for an element.
 |
*/
	preview.ScrollSequence = function (e) {
		this.element   = $(e);
		this.data      = [];
		this.state	   = '';

		if (this.element) {
			this.parseSequenceData(this.element.data('seq'));
		}
	};

	preview.ScrollSequence.prototype = _.extend({

//---------------------------------------------------------------------------------
//		Parse data and validate
//---------------------------------------------------------------------------------
		
		parseSequenceData : function (sd) {
			var _data = preview.SimpleObject.parse(sd);

			if (!_data || !_data.length) {
				console.warn('No sequence data found.');
				return;
			}

			for (var i=0, l=_data.length; i<l; i++) {
				var _nd = _data[i];

				if (!_nd.steps || !_nd.set) {
					console.error('Invalid sequence definition for', this.element[0], 'Missing steps & setter.');
					return;
				}
			}

			this.data = _data;
		},

//---------------------------------------------------------------------------------
//		Find indexes for frame.
//---------------------------------------------------------------------------------

		findFrameIndex : function (seq, frame) {
			var frames = seq.steps;
 			var fBegin = NaN;
 			var fEnd   = NaN;

 			if (frame <= frames[0]) {
				return [NaN, 0];
 			}

 			if (frame >= frames[frames.length - 1]) {
 				return [frames.length - 1, NaN];
 			}

			for (var i=0, l=frames.length; i<l; i++) {
				var f = frames[i];

				if ((isNaN(fBegin) && f < frame) || (f < frame && f >= fBegin)) {
					fBegin = i;
				}

				if (!isNaN(fBegin) && (isNaN(fEnd) && f >= frame)) {
					fEnd = i;
				}
			}

			return [fBegin, fEnd];
		},

//---------------------------------------------------------------------------------
//		Set a CSS value and handle special cases
//---------------------------------------------------------------------------------
		
		setCSSValue : function (obj, key, values, unit) {
			if (unit === null || unit === undefined) {
				unit = '';
			}

			switch (key) {
				// intercept transform values
				case 'translate':
				case 'translate3d':
				case 'translateX':
				case 'translateY':
				case 'translateZ':
				case 'rotateX':
				case 'rotateY':
				case 'rotateZ':
				case 'perspective':
					var transform = obj['transform'] || (obj['transform'] = '');

					if (values instanceof Array) {
						transform += ' '+ key +'('+ values.join(unit +' ') + unit +')';
					} else {
						transform += ' '+ key +'('+ values + unit +')';
					}

					obj['-webkit-transform'] = transform;
					obj['-moz-transform']    = transform;
					obj['-o-transform']      = transform;
					obj['-ms-transform']     = transform;
					obj['transform']         = transform;
					break;
				case 'background-image':
					obj['background-image'] = 'url(/../images/test/'+values+')';
					break;
				// default case will simply set the value plus unit
				default:

					if(values instanceof Array) {
						obj[key] = values.join(unit +' ') + unit;
					} else {
						obj[key] = values + unit;
					}
					break;
			}
		},

//---------------------------------------------------------------------------------
//		This method will simply set all the values based
//		on an index in the values array
//---------------------------------------------------------------------------------
		
		setValuesByIndex : function (cssobject, seq, index) {
			// grab the number of keyframes for comparison
			var nk = seq.steps.length;

			// loop through each defined css property and attempt
			// to interpolate the values
			for (var key in seq.set) {
				var css = seq.set[key];

				// if css is a unitvaluesobject, then proceed to set the
				// value directly
				if (css instanceof preview.UnitValuesObject) {
					if (index < 0) {
						this.setCSSValue(cssobject, key, css.values[0], css.unit);
					} else if (index >= css.values.length) {
						this.setCSSValue(cssobject, key, css.values[css.values.length - 1], css.unit);
					} else {
						this.setCSSValue(cssobject, key, css.values[index], css.unit);
					}
				}
			}
		},


//---------------------------------------------------------------------------------
//		Interpolate values in a sequence between two frames   
//---------------------------------------------------------------------------------
		
		interpolateFrameValues : function (cssobject, seq, startIndex, endIndex, currentFrame) {

			var frames     = seq.steps;
			var startFrame = 0;
			var endFrame   = 0;
			var percent    = 0;
			var startValue = 0;
			var endValue   = 0;

			if (percent < 0) { percent = 0; }
			if (percent > 1) { percent = 1; }

			for (var key in seq.set) {
				var css = seq.set[key];

				// if the number of value equals the number of
				// keyframes, simply interpolate between two given values
				if (css instanceof preview.UnitValuesObject) {

					if (css.values.length === frames.length) {

						startValue = css.values[startIndex];
						endValue   = css.values[endIndex];
						startFrame = frames[startIndex];
						endFrame   = frames[endIndex];

					// if we have only two values and it does not match
					// number of keyframes, recalculate the percentage
					// and interpolate between those two values
					} else if (css.values.length === 2) {

						startValue = css.values[0];
						endValue   = css.values[1];
						startFrame = frames[0];
						endFrame   = frames[frames.length - 1];

					} else {
						continue;
					}

					if(!isNaN(parseFloat(startValue))){

						percent = (currentFrame - startFrame) / (endFrame - startFrame);

						if (percent < 0) { percent = 0; }
						if (percent > 1) { percent = 1; }

						var _val = (startValue + (endValue - startValue) * percent);

						if (css.unit == 'px') {
							_val = Math.round(_val);
						}

						this.setCSSValue(cssobject, key, _val, css.unit);
					}
					else if(key.indexOf('background-image') != -1) {
						// percent = (currentFrame - startFrame) / (endFrame - startFrame);
						// if (percent < 0) { percent = 0; }
						// if (percent > 1) { percent = 1; }
						// this.setCSSValue(cssobject, 'opacity', percent, css.unit);
						this.setCSSValue(cssobject, key, startValue, css.unit);
					}
						

				}
			}
		},

//---------------------------------------------------------------------------------
//		Update sequence on frame
//---------------------------------------------------------------------------------
		
		update : function (f) {
			var i, l, s;

			var co = {};

			// loop through all of the sequences on this object
			// and update if needed.
			for (i=0, l=this.data.length; i<l, s=this.data[i]; i++) {
				// get the start and end frame index in the keyframes
				// array to see if this sequence needs updating
				var fi = this.findFrameIndex(s, f);
				var si = fi[0];
				var ei = fi[1];

				//TODO: Remember where we were last frame and check if
				//		we actually need any updating or not.

				// if we have both a start and an end index
				// that means we are inbetween keyframes and we need to
				// interpolate inbetween
				if (!isNaN(si) && !isNaN(ei)) {

					this.interpolateFrameValues(co, s, si, ei, f);

				// if we have an end index but no start index, that
				// means that the playhead is after the last keyframe
				} else if(!isNaN(si) && isNaN(ei)) {

					this.setValuesByIndex(co, s, si);

				// if we have a start index but no end index, that means
				// that the playhead is before the first keyframe
				} else if(isNaN(si) && !isNaN(ei)) {

					this.setValuesByIndex(co, s, ei);

				// or if we have neither a start frame nor an end frame
				// there might be something wrong with our keyframe definition
				} else {

					console.error('Possible error with keyframe definition.', s);

				}
			}
			
			this.element.css(co);
		}

	}, preview.Object);

/*
 |---------------------------------------------------------------------------------
 |	preview RULESET
 |---------------------------------------------------------------------------------
 |
 |	Setup and monitor different trigger to apply to objects.
 |
*/
	preview.Ruleset = function (e) {
		this.element   = $(e);
		this.data      = null;
		this.rules     = [];
		this.start     = -1;
		this.end       = -1;

		if (this.element) {
			this.parseRulesetData(this.element.data('rset'));
		}
	};

	preview.Ruleset.prototype = _.extend({

//---------------------------------------------------------------------------------
//		Parse data and validate
//---------------------------------------------------------------------------------
		
		parseRulesetData: function (sd) {
			var _data = preview.SimpleObject.parse(sd);

			for (var i=0; i<_data.length; i++) {
				var rule = _data[i];

				if (!isNaN(rule.between) && !isNaN(rule.and)) {
					this.rules.push(rule);
				}
			}

			this.rules.sort(function (a, b) {
				if (a.between < b.between) {
					return -1;
				}
				return 1;
			});

			if (this.rules.length) {
				this.start = this.rules[0].between;
				this.end   = this.rules[this.rules.length - 1].and;
			}
		},

//---------------------------------------------------------------------------------
//		Ensure the rules are applied
//---------------------------------------------------------------------------------
		
		ensure: function (current) {
			var self = this;

			this.rules.forEach(function (rule, index) {
				switch(rule.rule) {
					case 'has_class':
						if (current >= rule.between && current < rule.and) {
							if (!self.element.hasClass(rule.class_name)) {
								self.element.addClass(rule.class_name);
							}
						} else {
							self.element.removeClass(rule.class_name);
						}
						break;

					case 'is_displayed':
						if (current >= rule.between && current < rule.and) {
							self.element.css('display', rule.display || 'block');
						} else {
							self.element.css('display', 'none');
						}
						break;
				}
			});
		}

	}, preview.Object);


/*
 |---------------------------------------------------------------------------------
 |	preview SEQUENCER CONTROLLER
 |---------------------------------------------------------------------------------
 |
 |	The sequencer is responsible for aniamating the objects on scroll
 |	and triggering of events
 |
*/
	preview.Sequencer = _.extend({

//---------------------------------------------------------------------------------
//		Members
//---------------------------------------------------------------------------------

		sequences : [],
		rulesets  : [],
		$window   : $(window),
		raf       : null,
		prevUpdate: -1,

//---------------------------------------------------------------------------------
//		Rebuild
//---------------------------------------------------------------------------------

		rebuild : function () {
			console.log('Sequences: Rebuilding sequence indexes.');
			this.sequences = [];
			this.initialize();
		},

//---------------------------------------------------------------------------------
//		Clear all sequences
//---------------------------------------------------------------------------------

		clear : function () {
			// set all values to initial frame
			this.update(0);
			
			// loop through each sequence
			$('[data-seq]').each(function (i, e) {
			//	var $e = $(e);
			//	$e.removeAttr('style');
			});

			// remove all sequences from array
			this.sequences = [];
			this.rulesets  = [];

			console.log('preview.Sequencer: Cleared.');
		},

//---------------------------------------------------------------------------------
//		Setup method
//		Grab all the objects that have a sequence defined, parse
//		the sequence and then hook into the on-scroll even of the window
//		object to update the sequencer.
//---------------------------------------------------------------------------------

		initialize : function () {
			var self = this;
			var $win = $(window);

			// collect all sequences
			$('[data-seq]').each(function (i, e) {
				var seq = new preview.ScrollSequence(e)
				if (seq.data.length) {
					self.sequences.push(seq);
				}
			});

			// collect all rule sets
			$('[data-rset]').each(function (i, e) {
				var rset = new preview.Ruleset(e);
				if (rset.rules.length) {
					self.rulesets.push(rset);
				}
			});

			// sort the rulesets by start position
			self.rulesets.sort(function (a, b) {
				if (a.start < b.start) {
					return -1;
				}
				return 1;
			});


			// initiate the animations
			console.log('preview.Sequencer: Initialized with', this.sequences.length, 'sequence(s) and', this.rulesets.length, 'ruleset(s)');


			// get a reference to the requestAnimationFrame method
			// if the browser supports it.
			this.raf = (function () {
				return window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
			})();

			// if we do have a request animation frame method reference we will
			// use it to animate our sequences
			if (typeof this.raf === 'function') {

				console.log('preview.Sequencer: Using requestAnimationFrame');

				this.raf.call(window, this.updateForNextFrame);

			// otherwise we will use the window on scroll event
			} else {
				console.log('preview.Sequencer: Using on window scroll');

				$win.bind('scroll', this.updateForNextFrame);
			}

			// call the update method once to initiate.
			this.updateForNextFrame();
		},
     
//---------------------------------------------------------------------------------
//		This method will be called either through the requestAnimationFrame
//		mechanism on browsers that do support it, or else it will use the
//		window on scroll event to trigger an update for legacy browsers.
//		
//		The request animation frame method provides a much smoother feel since
//		we are updating at the correct time instead of fighting the browser.
//		This allows us to stay much closer to 60fps even on "animation heavy"
//		pages such as the work page.
//---------------------------------------------------------------------------------

		updateForNextFrame: function () {
			// get current scroll value
			var stop = preview.Sequencer.$window.scrollTop();

			// do not allow scroll below zero as it will mess up the
			// calculations. safari does "bounce" scroll which will give
			// negative values which we must check for.
			if (stop < 0) {
				stop = 0;
			}

			// check if we actually need updating
			if (preview.Sequencer.prevUpdate !== stop) {
				// call update method
				preview.Sequencer.update(stop);

				// save current position
				preview.Sequencer.prevUpdate = stop;
			}

			// do we reschedule animation frame?
			if (typeof preview.Sequencer.raf === 'function') {
				preview.Sequencer.raf.call(window, preview.Sequencer.updateForNextFrame);
			}
		},

//---------------------------------------------------------------------------------
//		Update sequencer
//---------------------------------------------------------------------------------

		update : function (current) {
			// perform broadphase on sequences,
			// find out which ones we need to update
			// perform narrow phase on those and update values
			var i, l, seq, rset;

			// Update sequences
			for (i=0; l=this.sequences.length, seq=this.sequences[i]; i++) {
				seq.update(current);
			}
			
			// Update rulesets
			for (i=0; l=this.rulesets.length, rset=this.rulesets[i]; i++) {
				rset.ensure(current);
			}
		}

	}, preview.Object);

}(window.jQuery, window._, window.preview));