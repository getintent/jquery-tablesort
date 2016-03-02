/*
	A simple, lightweight jQuery plugin for creating sortable tables.
	https://github.com/kylefox/jquery-tablesort
	Version 0.0.7
*/

(function($) {
	$.tablesort = function ($table, settings) {
		var self = this;
		this.$table = $table;
		this.$thead = this.$table.find('thead');
		this.settings = $.extend({}, $.tablesort.defaults, settings);
		this.$sortCells = this.$thead.length > 0 ? this.$thead.find('th:not(.no-sort)') : this.$table.find('th:not(.no-sort)');
		this.initCells();
		this.$sortCells.bind('click.tablesort', function() {
			self.sort($(this));
		});
		this.index = null;
		this.$th = null;
		this.direction = null;
	};

	$.tablesort.prototype = {

		initCells: function() {
			var self = this,
				curIndex = 0;
			this.$sortCells.each(function(indx, elem){
				$(elem).attr("data-sort-index", indx);
				self.$table.find('tr td:nth-child('+ (curIndex + 1) +')').attr("data-sort-index", indx);

				if($(elem).attr("colspan")) {
					curIndex += parseInt($(elem).attr("colspan"));
				} else {
					curIndex += parseInt(1);
				}
			});
		},

		sort: function(th, direction) {
			var start = new Date(),
				self = this,
				table = this.$table,
				//body = table.find('tbody').length > 0 ? table.find('tbody') : table,
				rows = this.$thead.length > 0 ? table.find('tbody tr') : table.find('tr').has('td'),
				// cells = table.find('tr td:nth-of-type(' + (th.index() + 1) + ')'),
				cells = table.find('tr td[data-sort-index=' + (th.attr("data-sort-index")) + ']'),
				sortBy = th.data().sortBy,
				sortedMap = [],
				sorted = th.hasClass("sorted");

			var unsortedValues = cells.map(function(idx, cell) {
				if (sortBy)
					return (typeof sortBy === 'function') ? sortBy($(th), $(cell), self) : sortBy;
				return ($(this).data().sortValue != null ? $(this).data().sortValue : $(this).text());
			});
			if (unsortedValues.length === 0) return;

			if (direction !== 'asc' && direction !== 'desc')
				if(sorted) {
					this.direction = this.direction === 'asc' ? 'desc' : 'asc';
				} else {
					this.direction = this.direction ? this.direction : this.settings.defaultDirection;
				}
			else
				this.direction = direction;

			direction = this.direction == 'asc' ? 1 : -1;

			self.$table.trigger('tablesort:start', [self]);
			self.log("Sorting by " + this.index + ' ' + this.direction);

			// Try to force a browser redraw
			self.$table.css("display");
			// Run sorting asynchronously on a timeout to force browser redraw after
			// `tablesort:start` callback. Also avoids locking up the browser too much.
			setTimeout(function() {
				self.$sortCells.removeClass(self.settings.asc + ' ' + self.settings.desc);
				for (var i = 0, length = unsortedValues.length; i < length; i++)
				{
					sortedMap.push({
						index: i,
						cell: cells[i],
						row: rows[i],
						value: unsortedValues[i]
					});
				}

				sortedMap.sort(function(a, b) {
					if (a.value > b.value) {
						return 1 * direction;
					} else if (a.value < b.value) {
						return -1 * direction;
					} else {
						return 0;
					}
				});

				$.each(sortedMap, function(i, entry) {
					table.append(entry.row);
				});

				th.addClass(self.settings[self.direction]);

				self.log('Sort finished in ' + ((new Date()).getTime() - start.getTime()) + 'ms');
				self.$table.trigger('tablesort:complete', [self]);
				//Try to force a browser redraw
				self.$table.css("display");
			}, unsortedValues.length > 2000 ? 200 : 10);
		},

		log: function(msg) {
			if(($.tablesort.DEBUG || this.settings.debug) && console && console.log) {
				console.log('[tablesort] ' + msg);
			}
		},

		destroy: function() {
			this.$sortCells.unbind('click.tablesort');
			this.$table.data('tablesort', null);
			return null;
		}

	};

	$.tablesort.DEBUG = false;

	$.tablesort.defaults = {
		debug: $.tablesort.DEBUG,
		asc: 'sorted ascending',
		desc: 'sorted descending',
		defaultDirection: 'asc'
	};

	$.fn.tablesort = function(settings) {
		var table, sortable, previous;
		return this.each(function() {
			table = $(this);
			previous = table.data('tablesort');
			if(previous) {
				previous.destroy();
			}
			table.data('tablesort', new $.tablesort(table, settings));
		});
	};

})(window.Zepto || window.jQuery);
