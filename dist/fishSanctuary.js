;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
module.exports = function(el) {
  var $el, $toggler, app, e, node, nodeid, toc, toggler, togglers, view, _i, _len, _ref;
  $el = $(el);
  app = window.app;
  toc = app.getToc();
  if (!toc) {
    console.log('No table of contents found');
    return;
  }
  togglers = $el.find('a[data-toggle-node]');
  _ref = togglers.toArray();
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    toggler = _ref[_i];
    $toggler = $(toggler);
    nodeid = $toggler.data('toggle-node');
    try {
      view = toc.getChildViewById(nodeid);
      node = view.model;
      $toggler.attr('data-visible', !!node.get('visible'));
      $toggler.data('tocItem', view);
    } catch (_error) {
      e = _error;
      $toggler.attr('data-not-found', 'true');
    }
  }
  return togglers.on('click', function(e) {
    e.preventDefault();
    $el = $(this);
    view = $el.data('tocItem');
    if (view) {
      view.toggleVisibility(e);
      return $toggler.attr('data-visible', !!view.model.get('visible'));
    } else {
      return alert("Layer not found in the current Table of Contents. \nExpected nodeid " + ($el.data('toggle-node')));
    }
  });
};


},{}],2:[function(require,module,exports){
var ReportTab, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = (function(_super) {
  __extends(ReportTab, _super);

  function ReportTab() {
    this.remove = __bind(this.remove, this);
    _ref = ReportTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ReportTab.prototype.name = 'Information';

  ReportTab.prototype.dependencies = [];

  ReportTab.prototype.initialize = function(model, options) {
    this.model = model;
    this.options = options;
    this.app = window.app;
    return _.extend(this, this.options);
  };

  ReportTab.prototype.render = function() {
    throw 'render method must be overidden';
  };

  ReportTab.prototype.show = function() {
    this.$el.show();
    return this.visible = true;
  };

  ReportTab.prototype.hide = function() {
    this.$el.hide();
    return this.visible = false;
  };

  ReportTab.prototype.remove = function() {
    return ReportTab.__super__.remove.call(this);
  };

  ReportTab.prototype.onLoading = function() {};

  return ReportTab;

})(Backbone.View);

module.exports = ReportTab;


},{}],3:[function(require,module,exports){
var FishingValueTab, HabitatTab, OverviewTab;

OverviewTab = require('./overviewTab.coffee');

HabitatTab = require('./habitatTab.coffee');

FishingValueTab = require('./fishingValue.coffee');

window.app.registerReport(function(report) {
  report.tabs([OverviewTab, HabitatTab, FishingValueTab]);
  return report.stylesheets(['./fishSanctuary.css']);
});

console.log('working?');


},{"./fishingValue.coffee":4,"./habitatTab.coffee":5,"./overviewTab.coffee":6}],4:[function(require,module,exports){
var FishingValueTab, ReportTab, enableLayerTogglers, templates, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('../../lib/scripts/reportTab.coffee');

templates = require('../templates/templates.js');

enableLayerTogglers = require('../../lib/scripts/enableLayerTogglers.coffee');

FishingValueTab = (function(_super) {
  __extends(FishingValueTab, _super);

  function FishingValueTab() {
    _ref = FishingValueTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  FishingValueTab.prototype.name = 'Fishing Value';

  FishingValueTab.prototype.className = 'fishingValue';

  FishingValueTab.prototype.template = templates.fishingValue;

  FishingValueTab.prototype.dependencies = ['FishingValue'];

  FishingValueTab.prototype.render = function() {
    var context, data, percent, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
    data = this.results.get('data');
    percent = data != null ? (_ref1 = data.results) != null ? (_ref2 = _ref1[0]) != null ? (_ref3 = _ref2.value) != null ? (_ref4 = _ref3[0]) != null ? (_ref5 = _ref4.features) != null ? (_ref6 = _ref5[0]) != null ? (_ref7 = _ref6.attributes) != null ? _ref7.PERCENT : void 0 : void 0 : void 0 : void 0 : void 0 : void 0 : void 0 : void 0;
    if (!percent) {
      percent = 'error';
    } else {
      percent = parseFloat(percent);
      percent = Math.round(percent * 10) / 10;
    }
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      percent: percent
    };
    this.$el.html(this.template.render(context, templates));
    return enableLayerTogglers(this.$el);
  };

  return FishingValueTab;

})(ReportTab);

module.exports = FishingValueTab;


},{"../../lib/scripts/enableLayerTogglers.coffee":1,"../../lib/scripts/reportTab.coffee":2,"../templates/templates.js":7}],5:[function(require,module,exports){
var HabitatTab, ReportTab, templates, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('../../lib/scripts/reportTab.coffee');

templates = require('../templates/templates.js');

HabitatTab = (function(_super) {
  __extends(HabitatTab, _super);

  function HabitatTab() {
    _ref = HabitatTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  HabitatTab.prototype.name = 'Habitat';

  HabitatTab.prototype.className = 'habitat';

  HabitatTab.prototype.template = templates.habitat;

  HabitatTab.prototype.render = function() {
    var context;
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user)
    };
    return this.$el.html(this.template.render(context, templates));
  };

  return HabitatTab;

})(ReportTab);

module.exports = HabitatTab;


},{"../../lib/scripts/reportTab.coffee":2,"../templates/templates.js":7}],6:[function(require,module,exports){
var OverviewTab, ReportTab, enableLayerTogglers, templates, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('../../lib/scripts/reportTab.coffee');

templates = require('../templates/templates.js');

enableLayerTogglers = require('../../lib/scripts/enableLayerTogglers.coffee');

OverviewTab = (function(_super) {
  __extends(OverviewTab, _super);

  function OverviewTab() {
    _ref = OverviewTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  OverviewTab.prototype.name = 'Overview';

  OverviewTab.prototype.className = 'overview';

  OverviewTab.prototype.template = templates.overview;

  OverviewTab.prototype.render = function() {
    var context, _ref1;
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      description: this.model.getAttribute('DESCRIPTION'),
      hasDescription: ((_ref1 = this.model.getAttribute('DESCRIPTION')) != null ? _ref1.length : void 0) > 0
    };
    this.$el.html(this.template.render(context, templates));
    return enableLayerTogglers(this.$el);
  };

  return OverviewTab;

})(ReportTab);

module.exports = OverviewTab;


},{"../../lib/scripts/enableLayerTogglers.coffee":1,"../../lib/scripts/reportTab.coffee":2,"../templates/templates.js":7}],7:[function(require,module,exports){
this["Templates"] = this["Templates"] || {};

this["Templates"]["fishingValue"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Fishing Value</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This protected area displaces <strong>");_.b(_.v(_.f("percent",c,p,0)));_.b("%</strong> ");_.b("\n" + i);_.b("    of the fishing value within Barbuda’s waters, based on user reported");_.b("\n" + i);_.b("    values of fishing grounds.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"51f46fe908dc4f5f2d1394b7\">show fishing values layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["habitat"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Habitat Representation</h4>");_.b("\n" + i);_.b("  <p>stuff..</p>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}if(_.s(_.f("hasDescription",c,p,1),c,p,0,314,398,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Description</h4>");_.b("\n" + i);_.b("  <p>");_.b(_.v(_.f("description",c,p,0)));_.b("</p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p>...</p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\">toggle habitats layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

module.exports = this["Templates"];
},{}]},{},[3])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvY2J1cnQvV29ya2luZy9iYXJidWRhLXJlcG9ydHMvbGliL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvY2J1cnQvV29ya2luZy9iYXJidWRhLXJlcG9ydHMvbGliL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9jYnVydC9Xb3JraW5nL2JhcmJ1ZGEtcmVwb3J0cy9zcmMvc2NyaXB0cy9maXNoU2FuY3R1YXJ5LmNvZmZlZSIsIi9Vc2Vycy9jYnVydC9Xb3JraW5nL2JhcmJ1ZGEtcmVwb3J0cy9zcmMvc2NyaXB0cy9maXNoaW5nVmFsdWUuY29mZmVlIiwiL1VzZXJzL2NidXJ0L1dvcmtpbmcvYmFyYnVkYS1yZXBvcnRzL3NyYy9zY3JpcHRzL2hhYml0YXRUYWIuY29mZmVlIiwiL1VzZXJzL2NidXJ0L1dvcmtpbmcvYmFyYnVkYS1yZXBvcnRzL3NyYy9zY3JpcHRzL292ZXJ2aWV3VGFiLmNvZmZlZSIsIi9Vc2Vycy9jYnVydC9Xb3JraW5nL2JhcmJ1ZGEtcmVwb3J0cy9zcmMvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsQ0FBTyxDQUFVLENBQUEsR0FBWCxDQUFOLEVBQWtCO0NBQ2hCLEtBQUEsMkVBQUE7Q0FBQSxDQUFBLENBQUE7Q0FBQSxDQUNBLENBQUEsR0FBWTtDQURaLENBRUEsQ0FBQSxHQUFNO0FBQ0MsQ0FBUCxDQUFBLENBQUEsQ0FBQTtDQUNFLEVBQUEsQ0FBQSxHQUFPLHFCQUFQO0NBQ0EsU0FBQTtJQUxGO0NBQUEsQ0FNQSxDQUFXLENBQUEsSUFBWCxhQUFXO0NBRVg7Q0FBQSxNQUFBLG9DQUFBO3dCQUFBO0NBQ0UsRUFBVyxDQUFYLEdBQVcsQ0FBWDtDQUFBLEVBQ1MsQ0FBVCxFQUFBLEVBQWlCLEtBQVI7Q0FDVDtDQUNFLEVBQU8sQ0FBUCxFQUFBLFVBQU87Q0FBUCxFQUNPLENBQVAsQ0FE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QUssQ0FBZCxLQUFRO0NBQVIsQ0FDYSxFQUFDLEVBQWQsS0FBQTtDQURBLENBRVksRUFBQyxDQUFLLENBQWxCLElBQUEsR0FBWTtDQUZaLENBR08sRUFBQyxDQUFSLENBQUEsQ0FBZTtDQUhmLENBSWEsRUFBQyxDQUFLLENBQW5CLEtBQUEsQ0FBYSxDQUFBO0NBSmIsRUFLNkQsRUFBWCxDQUFsRCxRQUFBO0NBTkYsS0FBQTtDQUFBLENBUW9DLENBQWhDLENBQUosRUFBVSxDQUFBLENBQVMsQ0FBVDtDQUNVLEVBQXBCLENBQXFCLE9BQXJCLFFBQUE7Q0FkRixFQUlROztDQUpSOztDQUR3Qjs7QUFrQjFCLENBdEJBLEVBc0JpQixHQUFYLENBQU4sSUF0QkE7Ozs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9IChlbCkgLT5cbiAgJGVsID0gJCBlbFxuICBhcHAgPSB3aW5kb3cuYXBwXG4gIHRvYyA9IGFwcC5nZXRUb2MoKVxuICB1bmxlc3MgdG9jXG4gICAgY29uc29sZS5sb2cgJ05vIHRhYmxlIG9mIGNvbnRlbnRzIGZvdW5kJ1xuICAgIHJldHVyblxuICB0b2dnbGVycyA9ICRlbC5maW5kKCdhW2RhdGEtdG9nZ2xlLW5vZGVdJylcbiAgIyBTZXQgaW5pdGlhbCBzdGF0ZVxuICBmb3IgdG9nZ2xlciBpbiB0b2dnbGVycy50b0FycmF5KClcbiAgICAkdG9nZ2xlciA9ICQodG9nZ2xlcilcbiAgICBub2RlaWQgPSAkdG9nZ2xlci5kYXRhKCd0b2dnbGUtbm9kZScpXG4gICAgdHJ5XG4gICAgICB2aWV3ID0gdG9jLmdldENoaWxkVmlld0J5SWQgbm9kZWlkXG4gICAgICBub2RlID0gdmlldy5tb2RlbFxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS12aXNpYmxlJywgISFub2RlLmdldCgndmlzaWJsZScpXG4gICAgICAkdG9nZ2xlci5kYXRhICd0b2NJdGVtJywgdmlld1xuICAgIGNhdGNoIGVcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtbm90LWZvdW5kJywgJ3RydWUnXG5cbiAgdG9nZ2xlcnMub24gJ2NsaWNrJywgKGUpIC0+XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgJGVsID0gJChAKVxuICAgIHZpZXcgPSAkZWwuZGF0YSgndG9jSXRlbScpXG4gICAgaWYgdmlld1xuICAgICAgdmlldy50b2dnbGVWaXNpYmlsaXR5KGUpXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLXZpc2libGUnLCAhIXZpZXcubW9kZWwuZ2V0KCd2aXNpYmxlJylcbiAgICBlbHNlXG4gICAgICBhbGVydCBcIkxheWVyIG5vdCBmb3VuZCBpbiB0aGUgY3VycmVudCBUYWJsZSBvZiBDb250ZW50cy4gXFxuRXhwZWN0ZWQgbm9kZWlkICN7JGVsLmRhdGEoJ3RvZ2dsZS1ub2RlJyl9XCJcbiIsImNsYXNzIFJlcG9ydFRhYiBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgbmFtZTogJ0luZm9ybWF0aW9uJ1xuICBkZXBlbmRlbmNpZXM6IFtdXG5cbiAgaW5pdGlhbGl6ZTogKEBtb2RlbCwgQG9wdGlvbnMpIC0+XG4gICAgIyBXaWxsIGJlIGluaXRpYWxpemVkIGJ5IFNlYVNrZXRjaCB3aXRoIHRoZSBmb2xsb3dpbmcgYXJndW1lbnRzOlxuICAgICMgICAqIG1vZGVsIC0gVGhlIHNrZXRjaCBiZWluZyByZXBvcnRlZCBvblxuICAgICMgICAqIG9wdGlvbnNcbiAgICAjICAgICAtIC5wYXJlbnQgLSB0aGUgcGFyZW50IHJlcG9ydCB2aWV3IFxuICAgICMgICAgICAgIGNhbGwgQG9wdGlvbnMucGFyZW50LmRlc3Ryb3koKSB0byBjbG9zZSB0aGUgd2hvbGUgcmVwb3J0IHdpbmRvd1xuICAgIEBhcHAgPSB3aW5kb3cuYXBwXG4gICAgXy5leHRlbmQgQCwgQG9wdGlvbnNcblxuICByZW5kZXI6ICgpIC0+XG4gICAgdGhyb3cgJ3JlbmRlciBtZXRob2QgbXVzdCBiZSBvdmVyaWRkZW4nXG5cbiAgc2hvdzogKCkgLT5cbiAgICBAJGVsLnNob3coKVxuICAgIEB2aXNpYmxlID0gdHJ1ZVxuXG4gIGhpZGU6ICgpIC0+XG4gICAgQCRlbC5oaWRlKClcbiAgICBAdmlzaWJsZSA9IGZhbHNlXG5cbiAgcmVtb3ZlOiAoKSA9PlxuICAgIHN1cGVyKClcbiAgXG4gIG9uTG9hZGluZzogKCkgLT4gIyBleHRlbnNpb24gcG9pbnQgZm9yIHN1YmNsYXNzZXNcblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRUYWIiLCJPdmVydmlld1RhYiA9IHJlcXVpcmUgJy4vb3ZlcnZpZXdUYWIuY29mZmVlJ1xuSGFiaXRhdFRhYiA9IHJlcXVpcmUgJy4vaGFiaXRhdFRhYi5jb2ZmZWUnXG5GaXNoaW5nVmFsdWVUYWIgPSByZXF1aXJlICcuL2Zpc2hpbmdWYWx1ZS5jb2ZmZWUnXG5cbndpbmRvdy5hcHAucmVnaXN0ZXJSZXBvcnQgKHJlcG9ydCkgLT5cbiAgcmVwb3J0LnRhYnMgW092ZXJ2aWV3VGFiLCBIYWJpdGF0VGFiLCBGaXNoaW5nVmFsdWVUYWJdXG4gICMgcGF0aCBtdXN0IGJlIHJlbGF0aXZlIHRvIGRpc3QvXG4gIHJlcG9ydC5zdHlsZXNoZWV0cyBbJy4vZmlzaFNhbmN0dWFyeS5jc3MnXVxuXG5jb25zb2xlLmxvZyAnd29ya2luZz8nIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAnLi4vLi4vbGliL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSdcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5lbmFibGVMYXllclRvZ2dsZXJzID0gcmVxdWlyZSAnLi4vLi4vbGliL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUnXG5cbmNsYXNzIEZpc2hpbmdWYWx1ZVRhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnRmlzaGluZyBWYWx1ZSdcbiAgY2xhc3NOYW1lOiAnZmlzaGluZ1ZhbHVlJ1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmZpc2hpbmdWYWx1ZVxuICBkZXBlbmRlbmNpZXM6IFsnRmlzaGluZ1ZhbHVlJ11cblxuICByZW5kZXI6ICgpIC0+XG4gICAgZGF0YSA9IEByZXN1bHRzLmdldCgnZGF0YScpXG4gICAgcGVyY2VudCA9IGRhdGE/LnJlc3VsdHM/WzBdPy52YWx1ZT9bMF0/LmZlYXR1cmVzP1swXT8uYXR0cmlidXRlcz8uUEVSQ0VOVFxuICAgIHVubGVzcyBwZXJjZW50XG4gICAgICBwZXJjZW50ID0gJ2Vycm9yJ1xuICAgIGVsc2VcbiAgICAgIHBlcmNlbnQgPSBwYXJzZUZsb2F0KHBlcmNlbnQpXG4gICAgICBwZXJjZW50ID0gTWF0aC5yb3VuZChwZXJjZW50ICogMTApIC8gMTBcblxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgcGVyY2VudDogcGVyY2VudFxuICAgIFxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBGaXNoaW5nVmFsdWVUYWIiLCJSZXBvcnRUYWIgPSByZXF1aXJlICcuLi8uLi9saWIvc2NyaXB0cy9yZXBvcnRUYWIuY29mZmVlJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcblxuY2xhc3MgSGFiaXRhdFRhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnSGFiaXRhdCdcbiAgY2xhc3NOYW1lOiAnaGFiaXRhdCdcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5oYWJpdGF0XG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgIFxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEhhYml0YXRUYWIiLCJSZXBvcnRUYWIgPSByZXF1aXJlICcuLi8uLi9saWIvc2NyaXB0cy9yZXBvcnRUYWIuY29mZmVlJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbmVuYWJsZUxheWVyVG9nZ2xlcnMgPSByZXF1aXJlICcuLi8uLi9saWIvc2NyaXB0cy9lbmFibGVMYXllclRvZ2dsZXJzLmNvZmZlZSdcblxuY2xhc3MgT3ZlcnZpZXdUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ092ZXJ2aWV3J1xuICBjbGFzc05hbWU6ICdvdmVydmlldydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5vdmVydmlld1xuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYWRtaW46IEBwcm9qZWN0LmlzQWRtaW4gd2luZG93LnVzZXJcbiAgICAgIGRlc2NyaXB0aW9uOiBAbW9kZWwuZ2V0QXR0cmlidXRlKCdERVNDUklQVElPTicpXG4gICAgICBoYXNEZXNjcmlwdGlvbjogQG1vZGVsLmdldEF0dHJpYnV0ZSgnREVTQ1JJUFRJT04nKT8ubGVuZ3RoID4gMFxuICAgIFxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBPdmVydmlld1RhYiIsInRoaXNbXCJUZW1wbGF0ZXNcIl0gPSB0aGlzW1wiVGVtcGxhdGVzXCJdIHx8IHt9O1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiZmlzaGluZ1ZhbHVlXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkZpc2hpbmcgVmFsdWU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyBwcm90ZWN0ZWQgYXJlYSBkaXNwbGFjZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJwZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgb2YgdGhlIGZpc2hpbmcgdmFsdWUgd2l0aGluIEJhcmJ1ZGHigJlzIHdhdGVycywgYmFzZWQgb24gdXNlciByZXBvcnRlZFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICB2YWx1ZXMgb2YgZmlzaGluZyBncm91bmRzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmNDZmZTkwOGRjNGY1ZjJkMTM5NGI3XFxcIj5zaG93IGZpc2hpbmcgdmFsdWVzIGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJoYWJpdGF0XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXQgUmVwcmVzZW50YXRpb248L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+c3R1ZmYuLjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wib3ZlcnZpZXdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZChcInNrZXRjaENsYXNzLmRlbGV0ZWRcIixjLHAsMSksYyxwLDAsMjQsMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuXFxcIiBzdHlsZT1cXFwibWFyZ2luLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGlzIHNrZXRjaCB3YXMgY3JlYXRlZCB1c2luZyB0aGUgXFxcIlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCJcXFwiIHRlbXBsYXRlLCB3aGljaCBpc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgbm8gbG9uZ2VyIGF2YWlsYWJsZS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gY29weSB0aGlzIHNrZXRjaCBvciBtYWtlIG5ld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgc2tldGNoZXMgb2YgdGhpcyB0eXBlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc0Rlc2NyaXB0aW9uXCIsYyxwLDEpLGMscCwwLDMxNCwzOTgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRlc2NyaXB0aW9uPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXy52KF8uZihcImRlc2NyaXB0aW9uXCIsYyxwLDApKSk7Xy5iKFwiPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHNpemVcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlNpemU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+Li4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmNTU0NWMwOGRjNGY1ZjJkMjE2MTQ2XFxcIj50b2dnbGUgaGFiaXRhdHMgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxubW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdOyJdfQ==
;