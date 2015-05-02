(function ($, _, preview) {

/*
 |---------------------------------------------------------------------------------
 |	preview CORE OBJECT 
 |---------------------------------------------------------------------------------
 |
 |	We will use our own core object to extend from to future proof in case
 |	we need to add properties at a later time.
 |
*/
	preview.Object = _.extend({});


/*
 |---------------------------------------------------------------------------------
 |	VALUE CHECK HELPER METHODS
 |---------------------------------------------------------------------------------
 |
 |	Provide a few helper methods to check values
 |
*/
	preview.isNull = function (v) {
		return (v === null || v === undefined);
	};

	preview.isString = function (v) {
		return (typeof v === 'string');
	};

	preview.isNumber = function (v) {
		return ((typeof v === 'number') && !isNaN(v));
	};

/*
 |---------------------------------------------------------------------------------
 |	REQUEST ANIMATION FRAME REFERENCE
 |---------------------------------------------------------------------------------
 |
 |	Get a reference to the requestAnimationFrame method (w/ vendor prefixes)
 |
*/
	preview.requestAnimationFrame = (function () {
		return window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	})();

/*
 |---------------------------------------------------------------------------------
 |	STRING PARSER
 |---------------------------------------------------------------------------------
 |
 |	Parse a string for keywords and replace them with provided values
 |
*/
	preview.parse = function (str, values) {

		if(preview.isString(str) && str.length && typeof values === 'object') {


			//TODO: Implement parser.
			/*		We are looking to accomplish the following:

					preview.parse('Hello #{what}', {
						what: 'World!'
					});
			*/

		}

	};

/*
 |---------------------------------------------------------------------------------
 |	UNIT VALUES OBJECT
 |---------------------------------------------------------------------------------
 |
 |	This is a simple object holding a value of numerical arrays
 |	and the representing unit of these value.
 |
*/
	preview.UnitValuesObject = function () {
		this.unit   = '';
		this.values = [];
	}

	preview.UnitValuesObject.prototype = _.extend({

		push : function (v) {
			var _s = $.trim(v);
			var _v = parseFloat(v);

			/*
			if (v.indexOf('.') > -1) {
				_v = parseFloat(v);
			} else {
				_v = parseInt(v);
			}
			*/
			if (!isNaN(_v)) {
				var _u = _s.substring(_v.toString().length);
				if (_u.length) {
					this.unit = _u;
				}
				this.values.push(_v);
			}
			else
				this.values.push(v);
		}

	}, preview.Object);

/*
 |---------------------------------------------------------------------------------
 |	SIMPLE OBJECT PARSER
 |---------------------------------------------------------------------------------
 |
 |	Parses out a very simple object from a string. It is meant to support lists
 |	(hashmaps) of objects and either single values or arrays of values.
 |
 |	All values are parsed as strings, so whatever your use is you must validate
 |	and convert the values into the type you want.
 |
 |	TODO: We should rellay look into merging the CSS Hash with the normal Object
 |		  and eliminate the {}
 |
 |	Usage:
 |
 |		() -> Object (can be nested)
 |		[] -> Array
 |		{} -> CSS Key/Value Hash, supports css value units
 |		:  -> Key/Value delimiter
 |
 |	Examples:
 |
 |		(keyframes:[0 16 32] trigger:myEventName)
 |				produces -> {
 |					keyframes: [0, 16, 32],
 |					trigger: "myEventName"
 |				}
 |
 |		(steps:[1000 2000] set:(top:{0% 100}))
 |				produces -> {
 |					steps: [1000, 2000],
 |					set: {
 |						top: {
 |							values: [0, 100],
 |							unit: "%"
 |						}
 |					}
 |				}
 |
 |		(this_is_an_object:(in_an_object:[with an array]))
 |				produces -> {
 |					this_is_an_object: {
 |						in_an_object: ["with", "an", "array"]
 |					}
 |				}
 |
*/
		preview.SimpleObject = _.extend({

//---------------------------------------------------------------------------------
//		Define tags and custom tag parsers
//---------------------------------------------------------------------------------

		tags : {
			'(': {
				name:      'List',
				close:     ')',
				container: true,

				create: function () {
					return {};
				},

				append : function (obj, prop, value) {
					if (prop !== null && value.length) {
						var _v = parseFloat(value);
						/*
						if (value.indexOf('.') > -1) {
							_v = parseFloat(value);
						} else {
							_v = parseInt(value);
						}
						*/
						if (!isNaN(_v)) {
							obj[prop] = _v;
						} else {
							obj[prop] = value;
						}
						return true;
					}
					return false;
				}
			}, '[': {
				name:      'Array',
				close:     ']',
				container: true,

				create: function () {
					return [];
				},

				parse: function (d, a) {


					d.replace(',', ' ').split(' ').forEach(function (v) {
						if (v.length) {
							a.push(v);
						}
					});
				},

				append : function (obj, prop, value) {
					if (typeof value === 'string' && !value.length) {
						return false;
					}
					if (obj instanceof Array) {
						var _v = parseFloat(value);
						/*
						if (value.indexOf('.') > -1) {
							_v = parseFloat(value);
						} else {
							_v = parseInt(value);
						}
						*/
						if (!isNaN(_v)) {
							obj.push(_v);
						} else {
							obj.push(value);
						}
						return true;
					}
					return false;
				}
			}, '{': {
				name:      'UnitValuesObject',
				close:     '}',
				container: true,

				create: function () {
					return new preview.UnitValuesObject;
				},

				parse: function (d, a) {

					d.replace(',', ' ').split(' ').forEach(function (v) {
						if (v.length) {
							a.push(v);
						}
					});
				},

				append : function (obj, prop, value) {

					if (typeof value === 'string' && !value.length) {
						return false;
					}
					if (obj instanceof preview.UnitValuesObject) {
						obj.push(value);
						return true;
					}

					return false;
				}
			}
		},


//---------------------------------------------------------------------------------
//		Parse a string and convert to a simple object
//---------------------------------------------------------------------------------

		parse : function (sd) {
			// replace all line breaks, tabs and replace all
			// double spaces into single ones.
			sd = sd.replace(/\n/g, '');
			sd = sd.replace(/\r/g, '');
			sd = sd.replace(/\t/g, '');
			sd = sd.replace(/\s{2,}/g, ' ');

			//console.log('# Parsing:', sd);

			var i, j, l, c;

			var retval    = [];
			var tag_stack = [];
			var obj_stack = [];
			var wobj      = null;
			var wtag      = null;
			var pname     = null;
			var pval      = '';
			var indent    = '';

			for (i=0, l=sd.length; i<l, c=sd.charAt(i); i++) {
			//
			//	Does this character represent a tag open?
			//
				var ntag = this.tags[c];

				if (ntag) {
				//	set working tag to newly created tag
					wtag = ntag;

				//	if we have a property name and a previous object,
				//	set the current object as that property of the previous one
				//	or just create a new object
					if (pname && wobj) {
						wobj = wobj[pname] = wtag.create();
					} else {
						wobj = wtag.create();
					}

				//	push tag and object onto respective stack
					tag_stack.push(wtag);
					obj_stack.push(wobj);

				//	if this new object is the only one on the stack
				//	push it onto the return array.
					if (obj_stack.length === 1) {
						retval.push(wobj);
					}

				//	reset property name
					pname = null;
					pval  = '';

				//	debug stuff
					//console.log(indent, '-> Open', c);
					// indent += '   ';

				} else if (wtag !== null && c === wtag.close) {
				//	pop a tag and an object off of respective stacks
					tag_stack.pop();
					obj_stack.pop();

				//	if we have a property name and value, set it on the
				//	current working object

					wtag.append(wobj, pname, $.trim(pval));

				//	reset property name and value
					pname = null;
					pval  = '';

				//	save current object into temp variable
					var nobj = wobj;

				//	grab a old working tag & object from the
				//	top of the stack
					wtag = tag_stack[tag_stack.length - 1] || null;
					wobj = obj_stack[obj_stack.length - 1] || null;

				//	if the object is an array, push our previous one
				//	onto the array
					if (wtag) {
						wtag.append(wobj, null, nobj);
					}

				//	debug stuff
					// indent = indent.substring(0, indent.length - 3);
					// console.log(indent, '-> Close', c);

				} else {

					switch (c) {
						case ':':

							pname = $.trim(pval);
							pval  = '';
							//console.log(indent, '@> Found Property', pname);
							break;

						case ' ':
							var _pval = $.trim(pval);

							if (_pval.length && wobj && wtag.append(wobj, pname, _pval)) {
								pname = null;
								pval  = '';
							}
							break;

						default:
							pval += c;
							break;
					}

				}

			}

			return retval;
		}

	}, preview.Object);


}(window.jQuery, window._, window.preview));
