$(function() {

  "use strict";

  $.Class('WidgetContainer', {
    widgets: {},

    init: function(widgets, element) {
      this.widgets = widgets;
      this.element = $(element).addClass("widgetcontainer");
      this.render();
    },

    get: function(key) {
      return this.widgets[key];
    },

    add: function(key, widget) {
      if (widget instanceof Widget) {
        this.widgets[key] = widget;
        this.render();
        return true;
      }

      return false;
    },

    remove: function(key) {
      if (_.isObject(this.widgets[key])) {
        delete this.widgets[key];
        this.render();
        return true;
      }

      return false;
    },

    render: function() {
      _.each(this.widgets, function(widget, index) {
        this.element.append(widget.element);
      }, this);
    }
  });

  $.Class('Widget',  {
    idPrefix: "widget",
    idCounter: 0
  },
  {
    init: function(label, callback) {
      this.label = label;
      this.onChange = this.callback(callback);
      this.element;
      this.id = Widget.idPrefix + Widget.idCounter++;
    },

    update: function(newState) {
      console.log("default update function: " + this);
    }
  });

  Widget("ToggleButton", {
    states: {
      OFF: 0,
      ON: 1,
      WAIT: 2
    }
  }, {
    init: function(label, callback, state) {
      this._super(label, callback);

      var newState = state !== undefined ? state : ToggleButton.states.WAIT;
      this.element = $($("#tmpl_togglebtn").jqote({label: this.label}));
      this.element.attr("id", this.id);
      this.button = this.element.find("button");

      this.changeState(newState);
      this.button.click(this.callback(this.onClick));
    },

    onClick: function() {
      var origState = this.toggleState;
      this.changeState(ToggleButton.states.WAIT);

      if(origState === ToggleButton.states.OFF) {
        this.onChange(ToggleButton.states.ON);
      } else {
        this.onChange(ToggleButton.states.OFF);
      }
    },

    changeState: function(newState) {
      this.toggleState = newState;
      this.button.button('reset');
      switch (newState) {
        case ToggleButton.states.OFF:
          this.button.removeClass("active").html("START");
          break;
        case ToggleButton.states.ON:
          this.button.addClass("active").html("STOP");
          break;
        case ToggleButton.states.WAIT:
          this.button.button('loading');
          break;
      }
    },

    update: function(newState) {
      this.changeState(newState);
    }
  });

  Widget("TextInput", {
    init: function(label, callback, initValue) {
      this._super(label, callback);

      var value = initValue || "";
      this.element = $($("#tmpl_textinput").jqote({label: this.label, value: value}));
      this.element.attr("id", this.id);
      this.input = this.element.find("input");

      this.changed = false;

      this.input.blur(this.callback(this.onEdit));
    },

    onEdit: function() {
      this.onChange(this.input.val());
    },

    update: function(newValue) {
      this.input.attr("value", newValue);
      this.input.effect('highlight');
    }
  });

  Widget("Checkbox", {
    init: function(label, callback, initState) {
      this._super(label, callback);

      var state = initState ? 1 : 0;
      this.element = $($("#tmpl_checkbox").jqote({label: this.label, state: state}));
      this.element.attr("id", this.id);
      this.input = this.element.find("input");
      this.placeholder = this.element.find("div.placeholder");

      this.input.change(this.callback(this.onEdit));

      this.update(state);
    },

    onEdit: function() {
      this.input.attr("disabled", true).hide();
      this.placeholder.show();
      this.onChange(this.input.is(":checked"));
    },

    update: function(newState) {
      this.input.attr('checked', newState ? true : false);
      this.input.removeAttr("disabled").show();
      this.placeholder.hide();
    }
  });

  Widget("TextInputList", {
    init: function(label, callback, initList, initText) {
      this._super(label, callback);

      // create html element
      var listArray = _.isArray(initList) ? initList : [];
      var inputValue = _.isString(initText) ? initText : "";
      this.element = $($("#tmpl_textinputlist").jqote({label: this.label, list: listArray, text: inputValue}));
      this.element.attr("id", this.id);

      // save references
      this.input = this.element.find("input");
      this.list = this.element.find("ol");
      this.addButton = this.element.find("button");
      this.placeholder = this.element.find("div.placeholder");

      // add initial list itmes
      this.update(initList);

      // sortable initialisation
      this.list.sortable({
        axis: "y",
        cursor: "move"
      });
      this.list.disableSelection();

      // register listeners
      this.list.on("sortupdate", this.callback(this.onSort));
      this.input.keyup(this.callback(this.onAdd));
      this.addButton.click(this.callback(this.onAdd));
    },

    getListItems: function() {
      // put all list items into one array
      var listArray = [];
      this.list.children("li").each(function(index, listItem) {
        listArray.push($(listItem).children("span.text").html());
      });
      return listArray;
    },

    disableInputs: function(disable) {
      // en/disable input
      disable ? this.input.attr("disabled", true) : this.input.removeAttr("disabled");

      // en/disable button
      disable ? this.addButton.attr("disabled", true) : this.addButton.removeAttr("disabled");

      // show/hide list
      disable ? this.list.hide() : this.list.show();

      // show/hide placeholder
      disable ? this.placeholder.show() : this.placeholder.hide();
    },

    onAdd: function(evt) {
      // enter or button click
      if (evt.keyCode === 13 || evt.target === this.addButton[0]) {
        // no empty strings
        if (!this.input.val()) {
          return;
        }

        this.disableInputs(true);

        // add the new list item
        var newList = this.getListItems();
        newList.push(this.input.val());

        // reset input
        this.input.val("")

        // notify
        this.onChange(newList);
      }
    },

    onSort: function() {
      this.disableInputs(true);

      // notify
      this.onChange(this.getListItems());
    },

    update: function(newList) {
      // create html list items
      var listItems = $($("#tmpl_listitems").jqote({list: newList, handles: true}));

      var removeHandler = this.callback(function(evt) {
        $(evt.target).parents("li").remove();
        this.onSort();
      });

      // add remove listeners
      listItems.each(function(index, listItem) {
        _.each(listItems.children(".remove-handle"), function(icon, index) {
          $(icon).click(removeHandler);
        }, this);
      });

      // update list
      this.list.html("").append(listItems);

      // re-enable inputs
      this.disableInputs(false);
    }
  });

  Widget("ListInputList", {
    init: function(label, callback, initSrcList, initDstList) {
      this._super(label, callback);

      // create html element
      var srcListArray = !_.isUndefined(initSrcList) && _.isArray(initSrcList) ? initSrcList : [];
      var dstListArray = !_.isUndefined(initDstList) && _.isArray(initDstText) ? initDstText : [];
      this.element = $($("#tmpl_listinputlist").jqote({label: this.label, srcList: srcListArray, dstList: dstListArray}));
      this.element.attr("id", this.id);

      // save references
      this.srcList = this.element.find("div.column2 ol");
      this.dstList = this.element.find("div.column3 ol");
      this.placeholder = this.element.find("div.column3 div.placeholder");

      // add initial list itmes
      this.update({srcList: srcListArray, dstList: dstListArray});

      // destination sortable initialisation
      this.dstList.sortable({
        axis: "y",
        cursor: "move",
        cancel: "li.drop-indicator",
      });
      this.dstList.disableSelection();

      // source dragable initialisation
      this.srcList.children("li").each(_.bind(function(index, item) {
        $(item).draggable({
          helper: function(e) {
            var original = $(this);
            var width = original.width();

            var clone = original.clone().width(width);
            return clone[0];
          },
          connectToSortable: "#" + this.id + " div.column3 ol",
        });
        $(item).disableSelection();
      }, this));

      // register listeners
      this.dstList.on("sortupdate", this.callback(this.onDstListChange));
    },

    disableInput: function(disable) {
      // show/hide list
      disable ? this.placeholder.show() : this.placeholder.hide();
      disable ? this.dstList.hide() : this.dstList.show();
    },

    getListItems: function() {
      // put all list items into one array
      var listArray = [];
      this.dstList.children("li").each(function(index, listItem) {
        listItem = $(listItem);
        if (!listItem.hasClass("drop-indicator")) {
          listArray.push(listItem.children("span.text").html());
        }
      });
      return listArray;
    },

    onDstListChange: function() {
      this.disableInput(true);
      this.onChange({dstList: this.getListItems()});
    },

    update: function(news) {
      // it is a new source list
      if(_.isArray(news.srcList)) {
        this.srcList.html($("#tmpl_listitems").jqote({list: news.srcList, handles: false}));
      }

      // it is a new destination list
      if(_.isArray(news.dstList)) {
        // create html list items
        var listItems = $($("#tmpl_listitems").jqote({list: news.dstList, handles: true}));

        var removeHandler = this.callback(function(evt) {
          $(evt.target).parents("li").remove();
          this.onDstListChange();
        });

        // add remove listeners
        listItems.each(function(index, listItem) {
          _.each(listItems.children(".remove-handle"), function(icon, index) {
            $(icon).click(removeHandler);
          }, this);
        });

        // prepare drop indicator
        var dropIndicator = $('<li class="drop-indicator"><i class="icon-download-alt"></i></li>');

        // update list
        this.dstList.html("").append(listItems).append(dropIndicator);

        // re-enable inputs
        this.disableInput(false);
      }
    }
  });

  Widget("SliderInput", {
    init: function(label, callback, minValue, maxValue, step, value) {
      this._super(label, callback);

      this.element = $($("#tmpl_sliderinput").jqote({label: this.label}));
      this.slider = this.element.find(".slider-input");
      this.placeholders = this.element.find("div.placeholder");
      this.sliderDisplay = this.element.find(".slider-display");

      var options = {};
      if (_.isNumber(maxValue)) {
        options.max = maxValue;
      }
      if (_.isNumber(minValue)) {
        options.min = minValue;
      }
      if (_.isNumber(step)) {
        options.step = step;
      }
      if (_.isNumber(value)) {
        options.value = value;
      }

      this.slider.slider(options);
      this.update(this.slider.slider("value"));

      this.slider.on("slidestop", this.callback(this.onSlideChange));
      this.slider.on("slide", this.callback(this.onSlide));
    },

    disableInput: function(disable) {
      // show/hide list
      disable ? this.placeholders.show() : this.placeholders.hide();
      disable ? this.slider.hide() : this.slider.show();
      disable ? this.sliderDisplay.hide() : this.sliderDisplay.show();
    },

    onSlide: function() {
      this.sliderDisplay.text(this.slider.slider("value"));
    },

    onSlideChange: function() {
      this.disableInput(true);
      this.onChange(this.slider.slider("value"));
    },

    update: function(newValue) {
      if (_.isNumber(newValue)) {
        this.slider.slider("value", newValue);
        this.sliderDisplay.html(newValue);
      }
      this.disableInput(false);
    }
  });

  Widget("Log", {
    init: function(label) {
      this._super(label, function() {});

      this.element = $($("#tmpl_log").jqote({label: this.label}));
    }
  });
});
