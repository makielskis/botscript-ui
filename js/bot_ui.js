$(function() {

  "use strict";

  $.Class('Util', {
    splitString: function(input) {
      var output;
      if (_.isString(input)) {
        // strip last comma if there
        if (input.slice(-1) === ",") {
          output = input.slice(0, -1);
        } else {
          output = input;
        }
        // empty string means empty arrary
        if (output === "") {
          output = [];
        } else {
          output = output.split(",");
        }
      }
      return output;
    },
  }, {}),

  $.Class('CreateBotForm', {
    selector: "#staticpanels div[data-panelid='createbot']",

    init: function(connection, packagedata) {
      this.form = $(this.selector);
      this.connection = connection;

      this.logWidget = new Log("Log", []);
      $("#createbot_log").append(this.logWidget.element);

      if (_.isArray(packagedata)) {
        this.setupForm(packagedata);
      }
    },

    setupForm: function(packagedata) {
      // get inputs
      var botPackageInput = this.form.find("select[name=package]");
      var serverInputContainer = this.form.find("#serverinput-container");

      // fill package select
      _(packagedata).each(function(botpackage) {
        var packageOption = $("<option>").text(botpackage['name']);
        packageOption.appendTo(botPackageInput);

        // create and fill server select
        var serverInput = $("<select>");
        serverInput.attr("name", botpackage['name']);
        serverInput.addClass("span4");
        serverInput.addClass("hide");
        _(botpackage.servers).each(function(server) {
          var serverOption = $("<option>").text(server);
          serverOption.appendTo(serverInput);
        });
        serverInput.appendTo(serverInputContainer);
      });

      var onPackageChange = function(item) {
        var selected = botPackageInput.find("option:selected").first().html();
        serverInputContainer.find("select").hide().removeClass("active");
        serverInputContainer.find("select[name=" + selected + "]").show().addClass("active");
      }
      botPackageInput.change(onPackageChange);
      onPackageChange();

      this.form.find("button[name=submit]").click(_.bind(this.submit, this));
    },

    submit: function() {
      // get inputs
      var playernameInput = this.form.find("input[name=playername]").removeClass("error");
      var passwordInput = this.form.find("input[name=password]").removeClass("error");
      var botPackageInput = this.form.find("select[name=package]").removeClass("error");
      var serverInput = this.form.find("#serverinput-container select.active").removeClass("error");
      var proxiesInput = this.form.find("textarea[name=proxies]").removeClass("error");

      // get input values
      var playername = playernameInput.val();
      var password = passwordInput.val();
      var botPackage = botPackageInput.val();
      var server = serverInput.val();
      var proxies = proxiesInput.val();

      // validate
      var valid = true;
      if (_(playername).isEmpty()) {
        playernameInput.addClass("error");
        valid = false;
      }
      if (_(password).isEmpty()) {
        passwordInput.addClass("error");
        valid = false;
      }
      if (_(botPackage).isEmpty()) {
        botPackageInput.addClass("error");
        valid = false;
      }
      if (_(server).isEmpty()) {
        serverInput.addClass("error");
        valid = false;
      }
      if (!valid) return;

      // send request
      this.connection.createNewBot(playername, password, botPackage, server, proxies);
    },
  }),

  $.Class('LoginForm', {
    selector: "#staticpanels div[data-panelid='login']",

    init: function(connection) {
      this.form = $(this.selector);
      this.connection = connection;

      this.form.find("button[name=submit]").click(_.bind(this.submit, this));
      this.form.find("input").keyup(_.bind(function(evt) {
        if (evt.keyCode === 13) {
          this.submit();
        }
      }, this));
    },

    submit: function() {
      // get inputs
      var usernameInput = this.form.find("input[name=username]").removeClass("error");
      var passwordInput = this.form.find("input[name=password]").removeClass("error");

      // get inputs values
      var username = usernameInput.val();
      var password = passwordInput.val();

      // validate
      var valid = true;
      if (_(username).isEmpty()) {
        usernameInput.addClass("error");
        valid = false;
      }
      if (_(password).isEmpty()) {
        passwordInput.addClass("error");
        valid = false;
      }

      // send request
      this.connection.login(username, password);
    }
  });

  $.Class('CreateAccountForm', {
    selector: "#staticpanels div[data-panelid='createaccount']",

    init: function(connection) {
      this.form = $(this.selector);
      this.connection = connection;

      this.form.find("button[name=createaccount]").click(_.bind(this.submit, this));
      this.form.find("input").keyup(_.bind(function(evt) {
        if (evt.keyCode === 13) {
          this.submit();
        }
      }, this));
    },

    submit: function() {
      // get inputs
      var usernameInput = this.form.find("input[name=username]").removeClass("error");
      var emailInput = this.form.find("input[name=email]").removeClass("error");
      var passwordInput = this.form.find("input[name=password]").removeClass("error");
      var passwordconfirmInput = this.form.find("input[name=passwordconfirm]").removeClass("error");

      // get inputs values
      var username = usernameInput.val();
      var email = emailInput.val();
      var password = passwordInput.val();
      var password_confirm = passwordconfirmInput.val();

      // validate
      var invalid_fields = [];
      if (_(username).isEmpty()) {
        usernameInput.addClass("error");
        invalid_fields.push("username");
      }
      if (!email.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i)) {
        emailInput.addClass("error");
        invalid_fields.push("email");
      }
      if (_(password).isEmpty() || password != password_confirm) {
        passwordInput.addClass("error");
        passwordconfirmInput.addClass("error");
        invalid_fields.push("password");
      }

      if (invalid_fields.length > 0) {
        _(invalid_fields).each(function(item) {
          switch (item) {
            case "username":
              new InfoMessage("Ein Nutzername muss angegeben werden.", InfoMessage.TYPES.ERROR);
              break;
            case "email":
              new InfoMessage("Die angegebene E-Mail Adresse ist ungültig.", InfoMessage.TYPES.ERROR);
              break;
            case "password":
              new InfoMessage("Die angebenen Passwörter müssen übereinstimmen", InfoMessage.TYPES.ERROR);
              break;
          }
        });
      } else {
        // send request
        this.connection.createAccount(username, email, password);
      }
    }
  });

  $.Class('AccountSettingsForm', {
    selector: "#staticpanels div[data-panelid='account']",

    init: function(connection) {
      this.parent = $(this.selector);
      this.connection = connection;

      this.forms = {};
      this.forms["email"] = this.parent.find("div[data-formid='email']");
      this.forms["password"] = this.parent.find("div[data-formid='password']");
      this.forms["delete"] = this.parent.find("div[data-formid='delete_acc']");

      this.forms['email'].find("button[name='update-email']").click(this.callback(this.submitEmail));
      this.forms['password'].find("button[name='update-password']").click(this.callback(this.submitPassword));
      this.forms['delete'].find("button[name='delete-account']").click(this.callback(this.submitDelete));
    },

    submitEmail: function() {
      // TODO email input validation
      var email = this.forms['email'].find("input[name='new-email']").val();
      var password = this.forms['email'].find("input[name='confirm-pw-email']").val();

      if (_(email).isEmpty() || _(password).isEmpty()) {
        new InfoMessage("Alle Felder müssen ausgefüllt werden.", InfoMessage.TYPES.ERROR);
        return;
      }

      this.connection.updateEmail(password, email);
    },

    submitPassword: function() {
      var new_pw = this.forms['password'].find("input[name='new-pw']").val();
      var cur_pw = this.forms['password'].find("input[name='confirm-pw-pw']").val();

      if (_(new_pw).isEmpty() || _(cur_pw).isEmpty()) {
        new InfoMessage("Alle Felder müssen ausgefüllt werden.", InfoMessage.TYPES.ERROR);
        return;
      }

      this.connection.updatePassword(cur_pw, new_pw);
    },

    submitDelete: function() {
      var pw = this.forms['delete'].find("input[name='confirm-pw-delete']").val();

      if (_(pw).isEmpty()) {
        new InfoMessage("Alle Felder müssen ausgefüllt werden.", InfoMessage.TYPES.ERROR);
        return;
      }

      this.connection.deleteAccount(pw);
    },

    displayNewEmail: function(email) {
      this.forms.email.find("#current-email").html(email);
    }
  });

  $.Class("AccountButton", {
    init: function(connection) {
      this.connection = connection;
      this.element = $("#accountbtn");

      this.invisible = false;

      this.element.click(this.callback(this.onclick));
    },

    setHidden: function() {
      this.invisible = true;
      this.element.hide();
    },

    onclick: function(event) {
      $("#selected-bot").html($(event.currentTarget).html());

      $("#staticpanels .widgetcontainer").hide();
      $("#app .bot-panel").hide();
      $("#staticpanels div[data-panelid='account']").show();
    },

    hide: function() {
      this.element.hide();
    },

    show: function() {
      !this.invisible && this.element.show();
    }
  });

  $.Class("ComboButton", {
    init: function(connection) {
      this.connection = connection;
      this.element = $("#combobtn");
      this.role = "";

      this.element.click(this.callback(this.onclick));
    },

    setHidden: function() {
      this.element.hide();
    },

    setLogout: function() {
      this.element.html(this.makeHtml("Logout", "signout"));
      this.role = "logout";
    },

    setRegister: function() {
      this.element.html(this.makeHtml("Registrieren", "user"));
      this.role = "register";
    },

    setLogin: function() {
      this.element.html(this.makeHtml("Login", "signin"));
      this.role = "login";
    },

    makeHtml: function(text, icon) {
      return '<i class="icon-' + icon + '"></i><span> ' + text + '</span>';
    },

    onclick: function() {
      switch (this.role) {
        case "logout":
          // TODO use logout function for connection when available
          //connection.logout();
          //this.setRegister();
          $.cookie("bs_session", "");
          location.reload();
          break;
        case "register":
          $("#staticpanels .widgetcontainer").hide();
          $("#staticpanels div[data-panelid='createaccount']").show();
          this.setLogin();
          break;
        case "login":
          $("#staticpanels .widgetcontainer").hide();
          $("#staticpanels div[data-panelid='login']").show();
          this.setRegister();
      }
    }
  });

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

          if (window.innerWidth <= 768) {
            $('html, body').animate({
	            scrollTop: ui.newPanel.offset().top
            }, 1000);
          }

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
      var logKey = false;
      _.each(this.widgets, function(widget, index) {
        // omit log
        if (index === "modulelog") {
          logKey = index;
          return;
        }
        this.element.append(widget.element);
          widget.rendered();
      }, this);

      // append log
      if (logKey !== false) {
        this.element.append(this.widgets[logKey].element);
      }
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

  Widget("InfoMessage", {
    TYPES: {
      ERROR: 0,
      SUCCESS: 1,
      INFO: 2
    }
  }, {
    init: function(text, type) {
      this._super("", function() {});

      var message;
      switch (type) {
        case InfoMessage.TYPES.SUCCESS:
          message = $($("#tmpl_successmessage").jqote({'text': text}));
          break;
        case InfoMessage.TYPES.ERROR:
          message = $($("#tmpl_failuremessage").jqote({'text': text}));
          break;
        case InfoMessage.TYPES.INFO:
          message = $($("#tmpl_infomessage").jqote({'text': text}));
          break;
        default:
          message = $($("#tmpl_infomessage").jqote({'text': text}));
      }

      message.hide();
      message.find(".icon-remove").click(function(e) {
        $(this).parents(".message").parent().slideUp(250, function() {
          $(this).parents(".message").parent().remove();
          Widget.redrawAll();
        });
      });

      message.appendTo($("#message-area"));
      message.slideDown(500, 'linear', function() {
        Widget.redrawAll();
      });
    }
  });

  Widget("DeleteBotButton", {
    init: function(label, callback) {
      this._super(label, callback);

      this.element = $($("#tmpl_genericbtn").jqote({label: this.label, text: "Löschen"}));
      this.element.attr("id", this.id);
      this.button = this.element.find("button");

      this.button.click(this.callback(this.onclick));
    },

    onclick: function() {
      var confirmed = confirm("Soll der Bot wirklich gelöscht werden?");
      if (confirmed) {
        this.onChange("delete");
      }
    }
  });

  Widget("ReactivateButton", {
    init: function(label, callback) {
      this._super(label, callback);

      this.element = $($("#tmpl_genericbtn").jqote({label: this.label, text: "Aktivieren"}));
      this.element.attr("id", this.id);
      this.button = this.element.find("button");

      this.button.click(this.callback(this.onclick));
    },

    onclick: function() {
      var proxies = prompt("Proxies für die Reaktivierung:");
      this.onChange(proxies);
    }
  });

  Widget("ToggleButton", {
    states: {
      OFF: "0",
      ON: "1",
      WAIT: "2"
    }
  }, {
    init: function(label, callback, state) {
      this._super(label, callback);

      var newState = _.isString(state) ? state : ToggleButton.states.WAIT;
      this.element = $($("#tmpl_togglebtn").jqote({label: this.label}));
      this.element.attr("id", this.id);
      this.button = this.element.find("button");

      this.changeState(newState);
      this.button.click(this.callback(this.onClick));
    },

    onClick: function() {
      var origState = this.toggleState;
      this.changeState(ToggleButton.states.WAIT);

      if (origState === ToggleButton.states.OFF) {
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
      this._super();
    }
  });

  TextInput("TextArea", {
    init: function(label, callback, initValue) {
      this._super(label, callback, initValue);

      var value = initValue || "";
      this.element = $($("#tmpl_textarea").jqote({label: this.label,
                                                  value: value,
                                                  btn_text: "speichern"}));
      this.element.attr("id", this.id);
      this.input = this.element.find("textarea");
      this.button = this.element.find("button");
      this.placeholder = this.element.find("div.placeholder").hide();

      this.button.click(this.callback(this.onEdit));
    },

    onEdit: function() {
      this.input.attr("disabled", true);
      this.button.attr("disabled", true).hide();
      this.placeholder.show();
      this.onChange(this.input.val());
    },

    update: function(newValue) {
      this.button.removeAttr("disabled").show();
      this._super(newValue);
    }
  });

  Widget("Checkbox", {
    states: {
      OFF: "0",
      ON: "1",
    }
  }, {
    init: function(label, callback, initState) {
      this._super(label, callback);

      var state = _.isString(initState) ? initState : Checkbox.states.OFF;
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
      this.onChange(this.input.is(":checked") ? Checkbox.states.ON : Checkbox.states.OFF);
    },

    update: function(newState) {
      switch (newState) {
        case Checkbox.states.OFF:
          this.input.attr('checked', false);
          break;
        case Checkbox.states.ON:
          this.input.attr('checked', true);
          break;
      }
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
      if (isListUpdate) {
        update = Util.splitString(update);
        update = _.filter(update, function(item) {
          return item.charAt(0) != "$" && item.charAt(0) != "^";
        });
        var lastValue = this.select.find("option:selected").text();
        this.select.empty().append($($("#tmpl_dropdown_items").jqote({list: update})));
        this.select.find('option').filter(function() { return $(this).html() == lastValue; }).attr("selected", true);
      } else {
        if (this.select.find('option[text="' + update + '"]').length === 0 && update.charAt(0) != "$" && update.charAt(0) != "^") {
          this.select.append($($("#tmpl_dropdown_items").jqote({list: [update]})));
        }
        this.select.find("option").attr("selected", false);
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
      this.element = $($("#tmpl_textinputlist").jqote({label: this.label}));
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
      newlist = Util.splitString(newlist);

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
      this.element = $($("#tmpl_listinputlist").jqote({label: this.label}));
      this.element.attr("id", this.id);

      // save references
      this.srcList = this.element.find("div.column2 ol");
      this.dstList = this.element.find("div.column3 ol");
      this.placeholder = this.element.find("div.column3 div.placeholder");

      // add initial list itmes
      this.update(initSrcList, true);
      this.update(initDstList, false);

      // destination sortable initialisation
      this.dstList.sortable({
        axis: "y",
        cursor: "move",
        cancel: "li.drop-indicator",
        placeholder: "drop-indicator",
        forcePlaceholderSize: true,
      });
      this.dstList.disableSelection();

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
      newlist = Util.splitString(newlist);

      if (isSrcList) {
        // source list -> just update the html
        this.srcList.html($("#tmpl_listitems").jqote({list: newlist, handles: false}));

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
      } else {
        // destination list:
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
      }

      // re-enable inputs
      this.disableInput(false);

      // call parent (log scroll update)
      this._super();
    }
  });

  Widget("SliderInput", {
    init: function(label, callback, minValue, maxValue, step, value) {
      this._super(label, callback);

      this.element = $($("#tmpl_sliderinput").jqote({'label': this.label,
                                                     'min': minValue || 0,
                                                     'max': maxValue || 1,
                                                     'step': step || 0.1,
                                                     'value': value || 1}));
      this.slider = this.element.find(".slider-input");
      this.placeholders = this.element.find("div.placeholder");
      this.sliderDisplay = this.element.find(".slider-display");

      this.update(this.slider.val());

      this.slider.mouseup(this.callback(this.onSlideChange));
      this.slider.change(this.callback(this.onSlide));

      this.element.attr("id", this.id);
    },

    disableInput: function(disable) {
      // show/hide list
      disable ? this.placeholders.show() : this.placeholders.hide();
      disable ? this.slider.hide() : this.slider.show();
      disable ? this.sliderDisplay.hide() : this.sliderDisplay.show();
    },

    onSlide: function() {
      this.sliderDisplay.text(this.slider.val());
    },

    onSlideChange: function() {
      this.disableInput(true);
      this.onChange(this.slider.val().toString());
    },

    update: function(newValue) {
      newValue = parseFloat(newValue);
      if (_.isNumber(newValue)) {
        this.slider.val(newValue);
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

      this.element.attr("id", this.id);

      this.visible = true;

      this.header.click(_.bind(this.toggleVisible, this));

      this.logArea.niceScroll({
        cursorborder: "1px solid #555",
        cursorborderradius: "0",
        cursorcolor: 'white',
        autohidemode: false
      });

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
    },

    hideScrollbar: function() {
      this.logArea.getNiceScroll().hide();
    },

    showScrollbar: function() {
      this.logArea.getNiceScroll().show();
    },

    clear: function() {
      this.logArea.html("");
      this.redraw();
    }
  });

  $.Class("BotSwitcher", {
    initialized: false,
    recreate: function(panels) {
      var listItems = $("#tmpl_botswitcher_list").jqote({list: panels});
      $("#bot-switcher-dd").html(listItems);

      var selector = BotSwitcher.initialized ? "#bot-switcher-dd a" : "#bot-switcher, #bot-switcher-dd a";
      $(selector).click(function(event) {
       if ($(event.currentTarget).is("a")) {
        // get possible panel ids
        var botid = decodeURIComponent($(event.currentTarget).attr("data-botid"));
        var panelid = decodeURIComponent($(event.currentTarget).attr("data-panelid"));

        // hide all panels
        _.each(panels, function(panel) {
          panel.hide();
        });
        $("#staticpanels .widgetcontainer").hide();

        // show botpanel
        if (botid !== "undefined") {
          panels[botid].show();
          $("#selected-bot").html($(event.currentTarget).html());
        }

        // show static panel
        if (panelid !== "undefined") {
          $("#staticpanels .widgetcontainer[data-panelid="+ panelid +"]").show();
          $("#selected-bot").html($(event.currentTarget).html());
        }
       }

        // hide/show
        $("#bot-switcher-dd").toggle('fade', 50);
        $("#app").click(function() {
          if ($("#bot-switcher-dd").is(":visible")) {
            $("#bot-switcher-dd").hide('fade', 50);
          }
        });
      });

      // show last bot panel or create bot form
      if ($("#bot-switcher-dd a").length < 2) {
        $("#bot-switcher-dd a").first().click();
      } else {
        $("#bot-switcher-dd a").get(-2).click();
      }
      $("#bot-switcher").first().click();

      BotSwitcher.initialized = true;
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
      "slider": SliderInput,
      "textarea": TextArea,
    },
  } ,{
    init: function(parent, connection) {
      this.parent = parent;
      this.connection = connection;

      // setup forms
      new LoginForm(this.connection);
      new CreateAccountForm(this.connection);
      this.accountSettingsForm = new AccountSettingsForm(this.connection);

      this.combobtn = new ComboButton();
      this.combobtn.setRegister();

      this.accountbtn = new AccountButton();
      this.accountbtn.hide();

      // when packages come in setup create bot form
      var onPackages = _.bind(function(packages) {
        this.createbotForm = new CreateBotForm(this.connection, packages);
        this.combobtn.setLogout();
        this.accountbtn.show();

        if (this.connection.local) {
          this.combobtn.setHidden();
          this.accountbtn.setHidden();
        }
      }, this);

      // when bots come in create interface
      var onBotList = _.bind(function(bots, packages) {
        this.botdata = bots;
        this.packagedata = packages;
        this.recreateInterface();
        this.createbotForm.logWidget.clear();
      }, this);

      var onUpdate = _.bind(function(botid, module, property, value) {
        console.log("got update", arguments);
        if (module === "log") {
          if (value === "") {
            return;
          }

          _.each(value.split("\n"), function(message) {
            if (message === "") {
              return;
            }

            // get module name from log message
            var moduleName = message.match(/(\[[^\]]*\]){3}\[([a-z]*)/)[2];

            // split log string
            var splitRegex = /(\[[^\]]*\])(\[[^\]]*\])(\[[^\]]*\])(\[[^\]]*\])(.*)/;
            var parts = message.match(splitRegex);

            // get log widget for module
            if (_.isObject(this.widgets[botid])) {
              if (_.isObject(this.widgets[botid][moduleName])) {
                // regular log message -> log to module log
                this.widgets[botid][moduleName]['modulelog'].update(parts[1] + parts[2] + parts[5]);
              } else {
                // no interface for that module -> log to base log
              }
              // log everything to base log, but don't log base messages twice
              if (moduleName !== "base") {
                this.widgets[botid]['base']['modulelog'].update(parts[1] + parts[2] + parts[4] + parts[5]);
              }
            } else {
              // there is no interface for this log message -> it is being created right now
              this.createbotForm.logWidget.update(message);
            }
          }, this);
          return;
        }

        // update coresponding widget if existing (might not exist if bot is newly created)
        if (_.isObject(this.widgets[botid])) {
          var isFromProperty = false;
          if (property.slice(-5) === "_from") {
            property = property.slice(0, -5);
            isFromProperty = true;
          }
          this.widgets[botid][module][property].update(value, isFromProperty);
        }
      }, this);

      var onEvent = _.bind(function(botid, key, value) {
        if (key === "newbot") {
          this.createbotForm.logWidget.update(value);
        }
      }, this);

      var onAccount = _.bind(function(args) {
        // display a coresponding message
        if (_.isString(args.email)) {
          this.accountSettingsForm.displayNewEmail(args.email);
        }
      }, this);

      var onLog = _.bind(function(botid, messages) {
        _.each(messages.split("\n"), function(msg) {
          this.connection.onUpdate(botid, 'log', undefined, msg);
        }, this);
      }, this);

      var onSuccess = _.bind(function(type, id) {
        switch(type[2]) {
          case "delete":
            new InfoMessage("Account gelöscht.", InfoMessage.TYPES.SUCCESS);
            $(".bot-panel").remove();
            $("#staticpanels .widgetcontainer").hide();
            $("#staticpanels div[data-panelid='login']").show();
            break;
          case "email":
            new InfoMessage("Email Adresse aktualisiert.", InfoMessage.TYPES.SUCCESS);
            break;
          case "password":
            new InfoMessage("Passwort aktualisiert.", InfoMessage.TYPES.SUCCESS);
            break;
        }
      });

      var onFailure = _.bind(function(type, id, error, reason) {
        // TODO implement (handle all possible types/errors)
        switch(error) {
          case 11: // Username already taken
            new InfoMessage("Der Nutzername ist bereits belegt.", InfoMessage.TYPES.ERROR);
            break;
          case 12: // Password to short
            new InfoMessage("Das angegebene Passwort ist zu kurz.", InfoMessage.TYPES.ERROR);
            break;
          case 13: // invalid email address
            new InfoMessage("Die angegebene Email Adresse ist ungültig.", InfoMessage.TYPES.ERROR);
            break;
          case 21: // user not found
            new InfoMessage("Kein Nutzer mit diesem Namen gefunden.", InfoMessage.TYPES.ERROR);
            break;
          case 31: // session id not available
            break;
          case 32: // session timed out
            break;
          case 41: // password wrong
            new InfoMessage("Das angegebene Passwort ist falsch.", InfoMessage.TYPES.ERROR);
            break;
          case 51: // bot already exists
            new InfoMessage("Dieser Bot existiert bereits.", InfoMessage.TYPES.ERROR);
            break;
          case 52: // bot not found
            new InfoMessage("Dieser Bot existiert nicht.", InfoMessage.TYPES.ERROR);
            break;
          case 53: // invalid configuration
            new InfoMessage("Die abgesendete Konfiguation ist ungültig: " + reason, InfoMessage.TYPES.ERROR);
            break;
          case 54: // bot creation failed
            new InfoMessage("Der Bot konnte nicht erstellt werden: " + reason, InfoMessage.TYPES.ERROR);
            break;
          case 55: // bot in blocklist
            new InfoMessage("Dieser Bot wird gerade schon erstellt.", InfoMessage.TYPES.ERROR);
            break;
          case 56: // bot not inactive
            new InfoMessage("Nur inaktive Bots können reaktiviert werden.", InfoMessage.TYPES.ERROR);
            break;
          case 57: // bot not inactive
            new InfoMessage("Es muss ein Proxy angegeben werden.", InfoMessage.TYPES.ERROR);
            break;
          default:
            new InfoMessage(reason, InfoMessage.TYPES.ERROR);
        }
      });

      this.connection.setCallbacks(onPackages, onBotList, onSuccess, onFailure, onUpdate, onEvent, onAccount, onLog);
      this.connection.connect();
    },

    recreateInterface: function() {
      // remove old panels
      $('.bot-panel').remove();

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

      this.panels = panels;
      BotSwitcher.recreate(panels);
    },

    makeControlPanel: function(botid) {
      var encBotId = encodeURIComponent(botid);
      var botPackage = this.botdata[botid]['package'];

      var interfaceMap = {};
      var wrapper = $("<div>").attr("id", encBotId);

      var containermap = {};
      // each module
      _.each(this.botdata[botid]['modules'], function(moduleconfig, moduleName) {
          // Skip modules (except base) when inactive
          if (this.botdata[botid].inactive === "1" && moduleName != "base") {
            return;
          }

          var widgets = {};

          // each property
          _.each(moduleconfig, function(propertyvalue, propertyname) {
            // Skip settings when infactive
            if (this.botdata[botid].inactive == "0") {
              var inputSpecs = this.getInputSpecs(botPackage, moduleName, propertyname);
              if (inputSpecs !== undefined) {
                var inputType = inputSpecs["input_type"];

                var displayName = inputSpecs["display_name"];

                var initValue1, initValue2, initValue3, initValue4;
                switch(inputType) {
                  case "dropdown":
                    initValue1 = moduleconfig[propertyname + "_from"];
                    initValue2 = propertyvalue;
                    break;
                  case "list_list":
                    initValue1 = moduleconfig[propertyname + "_from"];;
                    initValue2 = propertyvalue;
                    break;
                  case "slider":
                    var limits = inputSpecs.value_range.split(",");
                    initValue1 = parseFloat(limits[0]);
                    initValue2 = parseFloat(limits[1]);
                    initValue3 = 0.1;
                    initValue4 = parseFloat(moduleconfig[propertyname]);
                    break;
                  default:
                    initValue1 = propertyvalue;
                }

                var newInput = new InterfaceCreator.inputMap[inputType](displayName, _.bind(this.changeListener, this, botid, moduleName, propertyname), initValue1, initValue2, initValue3, initValue4);
                widgets[moduleName + "_" + propertyname] = newInput;
              }
            }
            // Add extra Log Widget
            var logName = moduleName === "base" ? "Gesamt Log" : "Modul Log: " + moduleName;
            widgets["modulelog"] = new Log(logName);

            // Add extra buttons (not in packages)
            if (moduleName === "base") {
              widgets["delete"] = new DeleteBotButton("Bot löschen", _.bind(this.deleteBotListener, this, botid));
              if (this.botdata[botid].inactive == "1") {
                widgets["reactivate"] = new ReactivateButton("Bot aktivieren", _.bind(this.reactivateListener, this, botid));
              }
            }

          }, this);

          var widgetcontainer = new WidgetContainer(widgets);
          containermap[this.getModuleDisplayName(botPackage, moduleName)] = widgetcontainer;
          interfaceMap[moduleName] = widgets;
      }, this);

      new VTabs(containermap, wrapper);

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
      this.connection.onInputChange(botid, modulename, propertyname, value);
    },

    deleteBotListener: function(botid) {
      this.connection.deleteBot(botid);
    },

    reactivateListener: function(botid, proxies) {
      this.connection.reactivateBot(botid, proxies);
    }
  });

  $.Class("ServerConnection", {

    // will be set by InterfaceCreator
    // called when server sends an 'packages' message
    onPackages: function(packages) {},

    // will be set by InterfaceCreator
    // called when server sends an 'bots' message
    onBotList: function(bots, packages) {},

    // will be set by InterfaceCreator
    // called when server sends an 'success' message
    onSuccess: function(type, id) {},

    // will be set by InterfaceCreator
    // called when server sends an 'failure' message
    onFailure: function(type, id, error, reason) {},

    // will be set by InterfaceCreator
    // called when server sends an 'update' message
    onUpdate: function(botid, module, property, value) {},

    // will be set by InterfaceCreator
    // called when server sends an 'event' message
    onEvent: function(botid, key, value) {},

    // will be set by InterfaceCreator
    // called when server sends an 'account' message
    onAccount: function(action, success) {},

    // empty constructor
    init: function() {},

    local: false,

    // connect the socket
    connect: function() {
      function parseURL() {
        var map = {};
        _.each(location.search.slice(1).split("&"), function(pair) {
         var split = _.map(pair.split("="), decodeURIComponent);
         map[split[0]] = split[1];
        });
        return map;
      };

      var parameters = parseURL();
      var host = _.isString(parameters.host) ? parameters.host : "127.0.0.1";
      var port = _.isString(parameters.port) ? parameters.port : "9003";
      this.local = host === "127.0.0.1" || host === "localhost";

      this.ws = new WebSocket("ws://" + host + ":" + port);
      this.ws.onopen = _.bind(this.onopen, this);
      this.ws.onmessage = _.bind(this.onmessage, this);
      this.ws.onerror = _.bind(this.onerror, this);
    },

    // called when the socket is connected
    onopen: function(event) {
      $("#connection-status i").hide();
      $("#connection-status .info").show();
      this.autoLogin();
    },

    // called when a message arrives
    onmessage: function(event) {
      var messageHandler = function messageHandler(msg) {
        switch (msg.type) {
          case "packages":
            this.packages = msg.arguments;
            this.onPackages(this.packages);
            if (_.isObject(this.bots)) {
              this.onBotList(bots, this.packages);
              delete this.bots;
            }
            break;
          case "session":
            $.cookie("bs_session", msg.arguments.sid);
            break;
          case "bots":
            var bots = msg.arguments;
            if (_.isObject(this.packages)) {
              this.onBotList(bots, this.packages);
            } else {
              this.bots = bots;
            }
            break;
          case "success":
            this.onSuccess(msg.arguments.request, msg.arguments.request_id);
            break;
          case "failure":
            this.onFailure(msg.arguments.request, msg.arguments.request_id, msg.arguments.error_code, msg.arguments.reason);
            break;
          case "update":
            var splitKey = msg.arguments.key.split("_", 1);
            this.onUpdate(msg.arguments.identifier, splitKey[0], msg.arguments.key, msg.arguments.value);
            break;
          case "account":
            this.onAccount(msg.arguments);
            break;
        }
      }

      try {
        var msg = JSON.parse(event.data);
        if (_.has(msg, 'type') && _.has(msg, 'arguments')) {
          console.log(" IN:", msg);
          _.bind(messageHandler, this, msg)();
        } else {
          console.log("incomplete update", msg);
        }
      } catch (exception) {
        throw exception;
      }
    },

    onerror: function() {
      $("#connection-status i").hide();
      $("#connection-status .error").show();
      console.log(arguments);
    },

    createInterface: function() {
      if (_.isObject(this.packages) && _.isObject(this.bots)) {
        if (_.isUndefined(this.interfaceCreator)) {
          this.interfaceCreator = new InterfaceCreator(botdata, packages, $("#app"))
        }
      }
    },

    setCallbacks: function(onPackages, onBotList, onSuccess, onFailure, onUpdate, onEvent, onAccount) {
      this.onPackages = onPackages;
      this.onBotList = onBotList;
      this.onSuccess = onSuccess;
      this.onFailure = onFailure;
      this.onUpdate = onUpdate;
      this.onEvent = onEvent;
      this.onAccount = onAccount;
    },

    onInputChange: function(botid, modulename, propertyname, value) {
      var command = modulename + "_set_" + propertyname;
      var value = _.isArray(value) ? value.join() : value;
      var msg = JSON.stringify({
        'type': ['user', 'bot', 'execute'],
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

    createNewBot: function(playername, password, botpackage, server, proxies) {
      var request = {
        'type': ['user', 'bot', 'create', 'new'],
        'arguments': {
          'sid': $.cookie('bs_session'),
          'config': JSON.stringify({
            'username': playername,
            'password': password,
            'package': botpackage,
            'server': server,
            'modules': {
              'base': {
                'proxy': proxies,
                'wait_time_factor': "1.00"
              }
            }
          })
        }
      };

      this.ws.send(JSON.stringify(request));
    },

    login: function(username, password) {
      var request = {
        'type': ['login'],
        'arguments': {
          'username': username,
          'password': password,
        }
      };

      this.ws.send(JSON.stringify(request));
    },

    autoLogin: function() {
      var sid = $.cookie('bs_session');
      var request = {
        'type': ['user'],
        'arguments': {
          'sid': _.isString(sid) && !_.isEmpty(sid) ? sid : "m4k13l5k15b07f4k3535510n"
        }
      };

      this.ws.send(JSON.stringify(request));
    },

    deleteBot: function(botid) {
      var request = {
        'type': ['user', 'bot', 'delete'],
        'arguments': {
          'sid': $.cookie('bs_session'),
          'identifier': botid
        }
      };

      this.ws.send(JSON.stringify(request));
    },

    reactivateBot: function(botid, proxies) {
      var request = {
        'type': ['user', 'bot', 'create', 'reactivate'],
        'arguments': {
          'sid': $.cookie('bs_session'),
          'identifier': botid,
          'proxy': proxies
        }
      };

      this.ws.send(JSON.stringify(request));
    },

    createAccount: function(username, email, password) {
      var request = {
        'type': ['register'],
        'arguments': {
          'username': username,
          'password': password,
          'email': email
        }
      };

      this.ws.send(JSON.stringify(request));
    },

    deleteAccount: function(password) {
      var request = {
        'type': ['user', 'update', 'delete'],
        'arguments': {
          'sid': $.cookie('bs_session'),
          'current_pw': password
        }
      };

      this.ws.send(JSON.stringify(request));
    },

    updateEmail: function(password, email) {
      var request = {
        'type': ['user', 'update', 'email'],
        'arguments': {
          'sid': $.cookie('bs_session'),
          'current_pw': password,
          'new_email': email
        }
      };

      this.ws.send(JSON.stringify(request));
    },

    updatePassword: function(current_pw, new_pw) {
      var request = {
        'type': ['user', 'update', 'password'],
        'arguments': {
          'sid': $.cookie('bs_session'),
          'current_pw': current_pw,
          'new_pw': new_pw
        }
      };

      this.ws.send(JSON.stringify(request));
    },
  });
});

