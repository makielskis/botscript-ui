$(function() {

  "use strict";

  $.Class('Accordion', {
    idPrefix: "accordion",
    idCounter: 0,
  }, {
    containers: {},

    init: function(containers, element) {
      this.containers = containers;
      this.element = $(element).addClass("accordion");
      this.render();
    },

    render: function() {
      _.each(this.containers, function(container, name) {
        container.element.addClass("accordion-item");
        this.element.append($("<h4><i class=\"icon-chevron-down\"></i>" + name + "</h4>"));
        this.element.append(container.element);
      }, this);
      this.element.accordion({ collapsible: true });
      this.element.on("accordionbeforeactivate", _.bind(function(event, ui) {
        ui.oldPanel.removeClass("auto-height");
        ui.newPanel.removeClass("auto-height");

        _.each(this.containers, function(container) {
          _.each(container.widgets, function(widget) {
            if (widget instanceof Log) {
              widget.hideScrollbar();
            }
          });
        });
      }, this));

      this.element.on("accordionactivate", _.bind(function(event, ui) {
        ui.oldPanel.addClass("auto-height");
        ui.newPanel.addClass("auto-height");

        ui.oldHeader.find("i").removeClass("rotate").addClass("derotate");
        ui.newHeader.find("i").removeClass("derotate").addClass("rotate");

        _.each(this.containers, function(container) {
          _.each(container.widgets, function(widget) {
            if (widget instanceof Log) {
              widget.showScrollbar();
              widget.redraw();
            }
          });
        });

        this.element.accordion( "option", "heightStyle", "content" );
      }, this));
    }
  }),

  $.Class('VTabs', {
    idCounter: 0,
  }, {
    containerMap: {},

    paneCounter: 0,

    init: function(containerMap, parent) {
      this.id = VTabs.idCounter++;

      this.containerMap = containerMap;
      this.parent = $(parent).addClass('vtab-container');

      this.render();
    },

    makeId: function() {
      return "tabpane-" + VTabs.idCounter + "-" + this.paneCounter++;
    },

    render: function() {
      var tabs = $($("#tmpl_tabs").jqote({
        containerMap: this.containerMap,
        id: this.id,
        context: this,
      }));

      _.each(tabs.find(".replaceme"), function(replaceme) {
        replaceme = $(replaceme);
        replaceme.replaceWith(this.containerMap[replaceme.attr("data-name")].element);
      }, this);

      tabs.appendTo(this.parent);

      this.parent.tabs({
        beforeActivate: _.bind(function( event, ui ) {
          _.each(this.containerMap, function(container) {
            _.each(container.widgets, function(widget) {
              if (widget instanceof Log) {
                widget.hideScrollbar();
              }
            });
          });
        }, this),

        activate: _.bind(function( event, ui ) {
          _.each(this.containerMap, function(container) {
            _.each(container.widgets, function(widget) {
              if (widget instanceof Log) {
                widget.showScrollbar();
                widget.redraw();
              }
            });
          });
        }, this)
      });

      this.parent.addClass( "ui-tabs-vertical ui-helper-clearfix" );
      this.parent.children("li").removeClass( "ui-corner-top" ).addClass( "ui-corner-left" );
    },
  });

  $.Class('WidgetContainer', {
    widgets: {},

    init: function(widgets, parent) {
      this.widgets = widgets;

      if (_.isUndefined(parent)) {
        this.element = $("<div></div>");
      } else {
        this.element = $(parent);
      }
      this.element.addClass("widgetcontainer");

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
        widget.rendered();
      }, this);
    }
  });

  $.Class('Widget',  {
    idPrefix: "widget",
    idCounter: 0,

    registeredWidgets: [],
    registerWidget: function(widget) {
      Widget.registeredWidgets.push(widget);
    },
    redrawAll: function() {
      _.each(Widget.registeredWidgets, function(widget) {
        widget.redraw();
      });
    }
  },
  {
    init: function(label, cb) {
      this.label = label;
      this.onChange = _.bind(function(cb_arg, data) {
        _.bind(cb_arg, this, data)();
        Widget.redrawAll();
      }, this, cb);
      this.element;
      this.id = Widget.idPrefix + Widget.idCounter++;

      Widget.registerWidget(this);
    },

    update: function(newState) {
      Widget.redrawAll();
    },

    redraw: function() {
    },

    rendered: function() {
    },
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

      var newState = state !== undefined ? parseInt(state) : ToggleButton.states.WAIT;
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

      // call parent (log scroll update)
      this._super()
    }
  });

  Widget("TextInput", {
    init: function(label, callback, initValue) {
      this._super(label, callback);

      var value = initValue || "";
      this.element = $($("#tmpl_textinput").jqote({label: this.label, value: value}));
      this.element.attr("id", this.id);
      this.input = this.element.find("input");
      this.placeholder = this.element.find("div.placeholder").hide();

      this.changed = false;

      this.input.blur(this.callback(this.onEdit));
    },

    onEdit: function() {
      this.input.attr("disabled", true).hide();
      this.placeholder.show();
      this.onChange(this.input.val());
    },

    update: function(newValue) {
      this.input.removeAttr("disabled").show();
      this.placeholder.hide();

      this.input.attr("value", newValue);
      this.input.effect('highlight');

      // call parent (log scroll update)
      this._super()
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

      // call parent (log scroll update)
      this._super();
    }
  });

  Widget("Dropdown", {
    init: function(label, callback, initList, preselected) {
      this._super(label, callback);

      var listArray = _.isArray(initList) ? initList : [];

      // create html element
      this.element = $($("#tmpl_dropdown").jqote({label: this.label}));
      this.element.attr("id", this.id);

      this.select = this.element.find("select");

      // add initial list itmes
      this.update(initList, true);
      this.update(preselected, false);

      // register listener
      this.select.on("change", this.callback(this.onSelect));
    },

    update: function(update, isListUpdate) {
      if (isListUpdate || _.isArray(update)) {
        if (_.isString(update)) {
          if (update.slice(-1) === ",") {
            update = update.slice(0, -1);
          }
          update = update.split(",");
        }
        this.select.removeAttr("disabled");
        this.select.empty().append($($("#tmpl_dropdown_items").jqote({list: update})));
      } else {
        this.select.find("option:contains(" + update + ")").attr("selected", true);
      }
      this.select.removeAttr("disabled");
    },

    onSelect: function(evt) {
      this.select.attr("disabled", true);
      this.onChange(this.select.find("option:selected").text());
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
        cursor: "move",
        placeholder: "drop-indicator",
        forcePlaceholderSize: true,
      });
      this.list.disableSelection();

      // register listeners
      this.list.on("sortupdate", this.callback(this.onSort));
      this.input.keyup(this.callback(this.onAdd));
      this.addButton.click(this.callback(this.onAdd));
      this.addButton.find("i").click(this.callback(this.onAdd));
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
        var newlist = this.getListItems();
        newlist.push(this.input.val());

        // reset input
        this.input.val("")

        // notify
        this.onChange(newlist);
      }
    },

    onSort: function() {
      this.disableInputs(true);

      // notify
      this.onChange(this.getListItems());
    },

    update: function(newlist) {
      if (_.isString(newlist)) {
        if (newlist.slice(-1) === ",") {
          newlist = newlist.slice(0, -1);
        }
        newlist = newlist.split(",");
      }

      // create html list items
      var listItems = $($("#tmpl_listitems").jqote({list: newlist, handles: true}));

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

      // call parent (log scroll update)
      this._super();
    }
  });

  Widget("ListInputList", {
    init: function(label, callback, initSrcList, initDstList) {
      this._super(label, callback);

      // create html element
      var srcListArray = !_.isUndefined(initSrcList) && _.isArray(initSrcList) ? initSrcList : [];
      var dstListArray = !_.isUndefined(initDstList) && _.isArray(initDstList) ? initDstList : [];
      this.element = $($("#tmpl_listinputlist").jqote({label: this.label, srcList: srcListArray, dstList: dstListArray}));
      this.element.attr("id", this.id);

      // save references
      this.srcList = this.element.find("div.column2 ol");
      this.dstList = this.element.find("div.column3 ol");
      this.placeholder = this.element.find("div.column3 div.placeholder");

      // add initial list itmes
      this.update(srcListArray, true);
      this.update(dstListArray, false);

      // destination sortable initialisation
      this.dstList.sortable({
        axis: "y",
        cursor: "move",
        cancel: "li.drop-indicator",
        placeholder: "drop-indicator",
        forcePlaceholderSize: true,
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
      this.onChange(this.getListItems());
    },

    update: function(newlist, isSrcList) {
      // it is a new source list
      if (_.isString(newlist)) {
        if (newlist.slice(-1) === ",") {
          newlist = newlist.slice(0, -1);
        }
        newlist = newlist.split(",");
      }

      if(isSrcList) {
        this.srcList.html($("#tmpl_listitems").jqote({list: newlist, handles: false}));
      } else {
        // create html list items
        var listItems = $($("#tmpl_listitems").jqote({list: newlist, handles: true}));

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
        this.dstList.empty().append(listItems).append(dropIndicator);

        // re-enable inputs
        this.disableInput(false);
      }
      // call parent (log scroll update)
      this._super();
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

      this.element.attr("id", this.id);
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

      // call parent (log scroll update)
      this._super();
    }
  });

  Widget("Log", {
    matchError: /^\[ERROR]/,
    matchInfo: /^\[INFO ]/,
    matchDebug: /^\[DEBUG]/,
  }, {
    init: function(label, initMessages) {
      this._super(label, function() {});

      this.element = $($("#tmpl_log").jqote({label: this.label}));
      this.logArea = this.element.find(".log");
      this.header = this.element.find(".collapsible-header");
      this.slider = this.header.find(".slider-input");

      this.element.attr("id", this.id);

      this.visible = true;

      this.header.click(_.bind(this.toggleVisible, this));

      this.logArea.niceScroll({
        cursorborder: "1px solid #555",
        cursorborderradius: "0",
        cursorcolor: 'white',
        autohidemode: false
      });

      this.slider.slider({
        min: 0,
        max: 2,
      });
      this.slider.slider("value", 1);
      this.slider.on("slidestop", _.bind(this.filterMessages, this));

      if (_.isArray(initMessages)) {
        _.each(initMessages, this.addMessage, this);
      }
    },

    toggleVisible: function() {
      var logContainer = this.logArea.parent().parent();
      if (logContainer.is(':animated')) {
        return;
      }

      if (this.visible === true) {
        this.logArea.getNiceScroll().hide();
        logContainer.slideUp(500, _.bind(function() {
          this.header.find("i").addClass("rotate").removeClass("derotate");
          this.visible = false;
        }, this));
      } else if (this.visible === false) {
        logContainer.slideDown(500, _.bind(function() {
          this.header.find("i").addClass("derotate").removeClass("rotate");
          this.logArea.getNiceScroll().show();
          this.logArea.getNiceScroll().resize();
          this.visible = true;
        }, this));
      }
    },

    hide: function() {
      if (this.visible) {
        this.toggleVisible();
      }
    },

    filterMessages: function() {
      var redrawFunc = _.bind(function() {
        this.redraw();
      }, this);

      switch (this.slider.slider("value")) {
        case 0:
          this.slider.removeClass("info").removeClass("debug").addClass("error");
          this.logArea.children(".info, .debug").hide();
          this.logArea.children(".error").show();
          break;
        case 1:
          this.slider.removeClass("error").removeClass("debug").addClass("info");
          this.logArea.children(".debug").hide();
          this.logArea.children(".error, .info").show();
          break;
        case 2:
          this.slider.removeClass("info").removeClass("error").addClass("debug");
          this.logArea.children(".error, .info, .debug").show();
      }
    },

    addMessage: function(msg) {
      var msgContainer = $("<div></div>").html(msg);

      if (Log.matchInfo.exec(msg)) {
        msgContainer.addClass("info");
      } else if (Log.matchError.exec(msg)) {
        msgContainer.addClass("error");
      } else if (Log.matchDebug.exec(msg)) {
        msgContainer.addClass("debug");
      }

      this.logArea.append(msgContainer);
      this.filterMessages();
      this.logArea.scrollTop(this.logArea[0].scrollHeight);
    },

    update: function(incomeing) {
      this.addMessage(incomeing);
      this._super();
    },

    redraw: function() {
      this.logArea.getNiceScroll().resize();
      this.rendered();
    },

    rendered: function() {
      this.logArea.scrollTop(this.logArea[0].scrollHeight);
      this.filterMessages();
    },

    hideScrollbar: function() {
      this.logArea.getNiceScroll().hide();
    },

    showScrollbar: function() {
      this.logArea.getNiceScroll().show();
    },
  });

  $.Class("BotSwitcher", {
    recreate: function(panels) {
      var listItems = $("#tmpl_botswitcher_list").jqote({list: panels});
      $("#bot-switcher-dd").html(listItems);

      $("#bot-switcher, #bot-switcher-dd a").click(function(event) {
       if ($(event.currentTarget).is("a")) {
        var botid = decodeURIComponent($(event.currentTarget).attr("data-botid"));
        _.each(panels, function(panel) {
          panel.hide();
        });
        panels[botid].show();
        $("#selected-bot").html($(event.currentTarget).html());
       }

        // hide/show
        $("#bot-switcher-dd").toggle('fade', 50, function() {
          $("#app").click(function() {
            if ($("#bot-switcher-dd").is(":visible")) {
              $("#bot-switcher-dd").hide('fade', 50);
            }
          });
        });
      });
    }
  }, {});

  $.Class("InterfaceCreator", {
    inputMap: {
      "toggle": ToggleButton,
      "checkbox": Checkbox,
      "textfield": TextInput,
      "dropdown": Dropdown,
      "list_textfield": TextInputList,
      "list_list": ListInputList,
    },
  } ,{
    init: function(parent, connection) {
      this.parent = parent;
      this.connection = connection;

      var onBotList = _.bind(function(bots, packages) {
        this.botdata = bots;
        this.packagedata = packages;
        this.recreateInterface();
      }, this);

      var onUpdate = _.bind(function(botid, module, property, value) {
        console.log("got update", arguments);
        var isFromProperty = false;
        if (property.slice(-5) === "_from") {
          property = property.slice(0, -5);
          isFromProperty = true;
        }
        this.widgets[botid][module][property].update(value, isFromProperty);
        // update coresponding widget
      }, this);

      var onEvent = _.bind(function(botid, key, value) {
        // display a coresponding message
      }, this);

      var onAccount = _.bind(function(action, succes) {
        // display a coresponding message
      }, this);

      this.connection.setCallbacks(onBotList, onUpdate, onEvent, onAccount);
      this.connection.connect();
    },

    recreateInterface: function() {
      var panels = {};
      this.widgets = {}

      _.each(_.keys(this.botdata), function(botid) {
        var result = this.makeControlPanel(botid);

        var panel = result['panel'].hide().addClass("bot-panel");
        panels[botid] = panel;

        var botWidgets = result['widgets'];
        this.widgets[botid] = botWidgets;

        this.parent.append(panel);
      }, this);

      // show first panel
      _(panels).values()[1].show();

      this.panels = panels;
      BotSwitcher.recreate(panels);
    },

    makeControlPanel: function(botid) {
      var encBotId = encodeURIComponent(botid);
      var botPackage = _.last(this.botdata[botid]['package'].split("/"));

      var interfaceMap = {};
      var wrapper = $("<div>").attr("id", encBotId);

      var containermap = {};
      _.each(this.botdata[botid]['modules'], function(moduleconfig, moduleName) {
          var widgets = {};

          _.each(moduleconfig, function(propertyvalue, propertyname) {
            var inputSpecs = this.getInputSpecs(botPackage, moduleName, propertyname);
            if (inputSpecs !== undefined) {
              var inputType = inputSpecs["input_type"];

              var displayName = inputSpecs["display_name"];

              var initValue1;
              var initValue2;
              switch(inputType) {
                case "dropdown":
                  var val = moduleconfig[propertyname + "_from"];
                  var empty = val === "";

                  if (val.slice(-1) === ",") {
                    val = val.slice(0, -1);
                  }

                  initValue1 = empty ? [] : val.split(",");
                  initValue2 = propertyvalue;
                  break;
                case "list_textfield":
                  var val = propertyvalue;
                  var empty = val === "";

                  if (val.slice(-1) === ",") {
                    val1 = val.slice(0, -1);
                  }

                  initValue1 = empty ? [] : val.split(",");
                  break;
                case "list_list":
                  var val1 = moduleconfig[propertyname + "_from"];
                  var val2 = propertyvalue;

                  var empty1 = val1 === "";
                  var empty2 = val2 === "";

                  if (val1.slice(-1) === ",") {
                    val1 = val1.slice(0, -1);
                  }

                  if (val2.slice(-1) === ",") {
                    val2 = val2.slice(0, -1);
                  }

                  initValue1 = empty1 ? [] : val1.split(",");
                  initValue2 = empty2 ? [] : val2.split(",");
                  break;
                default:
                  initValue1 = propertyvalue;
              }

              var newInput = new InterfaceCreator.inputMap[inputType](displayName, _.bind(this.changeListener, this, botid, moduleName, propertyname), initValue1, initValue2);
              widgets[moduleName + "_" + propertyname] = newInput;
            }
          }, this);

          var widgetcontainer = new WidgetContainer(widgets);
          containermap[this.getModuleDisplayName(botPackage, moduleName)] = widgetcontainer;
          interfaceMap[moduleName] = widgets;
      }, this);

      new VTabs(containermap, wrapper)

      return {'panel': wrapper, 'widgets': interfaceMap};
    },

    getInputSpecs: function(botPackage, module, property) {
      var packagedata = _.where(this.packagedata, {name: botPackage})[0];
      return packagedata[module][property];
    },

    getModuleDisplayName: function(botPackage, module) {
      var packagedata = _.where(this.packagedata, {name: botPackage})[0];
      return packagedata[module]['module'];
    },

    changeListener: function(botid, modulename, propertyname, value) {
      // var update = _.bind(this.update, this);
      // _.delay(update, 250, arg);
      this.connection.onInputChange(botid, modulename, propertyname, value);
    },
  });

  $.Class("ServerConnection", {

    // will be set by InterfaceCreator
    // called when server sends an 'bots' message
    onBotList: function(bots, packages) {},

    // will be set by InterfaceCreator
    // called when server sends an 'update' message
    onUpdate: function(botid, module, property, value) {},

    // will be set by InterfaceCreator
    // called when server sends an 'event' message
    onEvent: function(botid, key, value) {},

    // will be set by InterfaceCreator
    // called when server sends an 'account' message
    onAccount: function(action, success) {},

    init: function() {},

    connect: function() {
      this.ws = new WebSocket('ws://localhost:8000');
      this.ws.onopen = _.bind(this.onopen, this);
      this.ws.onmessage = _.bind(this.onmessage, this);
    },

    onopen: function(event) {
      console.log(event);
    },

    onmessage: function(event) {
      var messageHandler = function messageHandler(msg) {
        switch (msg.type) {
          case "packages":
            this.packages = msg.arguments.packages;
            break;
          case "session":
            $.cookie("bs_session", msg.arguments.sid, parseInt(msg.arguments.expires) * 1000);
            break;
          case "bots":
            var bots = msg.arguments;
            if (_.isObject(this.packages)) {
              this.onBotList(bots, this.packages);
            }
            break;
          case "update":
            var splitKey = msg.arguments.key.split("_", 1);
            this.onUpdate(msg.arguments.identifier, splitKey[0], msg.arguments.key, msg.arguments.value);
            break;
          case "event":
            this.onEvent(msg.arguments.identifier, msg.arguments.key, msg.arguments.value);
            break;
          case "account":
            this.onAccount(msg.argument.key, msg.arguments.success);
            break;
        }
      }

      try {
        var msg = JSON.parse(event.data);
        if (_.has(msg, 'type') && _.has(msg, 'arguments')) {
          _.bind(messageHandler, this, msg)();
        } else {
          console.log("incomplete update");
        }
      } catch (exception) {
        throw exception;
      }
    },

    createInterface: function() {
      if (_.isObject(this.packages) && _.isObject(this.bots)) {
        if (_.isUndefined(this.interfaceCreator)) {
          this.interfaceCreator = new InterfaceCreator(botdata, packages, $("#app"))
        }
      }
    },

    setCallbacks: function(onBotList, onUpdate, onEvent, onAccount) {
      // TODO: check if args are all functions
      this.onBotList = onBotList;
      this.onUpdate = onUpdate;
      this.onEvent = onEvent;
      this.onAccount = onAccount;
    },

    onInputChange: function(botid, modulename, propertyname, value) {
      var command = modulename + "_set_" + propertyname;
      var value = _.isArray(value) ? value.join() : value;
      var msg = JSON.stringify({
        'type': 'bot',
        'arguments': {
          'sid': $.cookie("bs_session"),
          'identifier': botid,
          'execute': {
            'command': command,
            'argument': value,
          },
        },
      });
      this.ws.send(msg);
      console.log(msg);
    },
  });
});

