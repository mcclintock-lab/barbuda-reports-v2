require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
    $el = $(e.target);
    view = $el.data('tocItem');
    if (view) {
      view.toggleVisibility(e);
      return $el.attr('data-visible', !!view.model.get('visible'));
    } else {
      return alert("Layer not found in the current Table of Contents. \nExpected nodeid " + ($el.data('toggle-node')));
    }
  });
};


},{}],"perKyw":[function(require,module,exports){
var RecordSet, ReportTab, enableLayerTogglers, round, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

enableLayerTogglers = require('./enableLayerTogglers.coffee');

round = require('./utils.coffee').round;

RecordSet = (function() {
  function RecordSet(data) {
    this.data = data;
  }

  RecordSet.prototype.toArray = function() {
    return _.map(this.data.value[0].features, function(feature) {
      return feature.attributes;
    });
  };

  RecordSet.prototype.raw = function(attr) {
    var attrs;
    attrs = _.map(this.toArray(), function(row) {
      return row[attr];
    });
    attrs = _.filter(attrs, function(attr) {
      return attr !== void 0;
    });
    if (attrs.length === 0) {
      throw "Could not get attribute " + attr;
    } else if (attrs.length === 1) {
      return attrs[0];
    } else {
      return attrs;
    }
  };

  RecordSet.prototype.int = function(attr) {
    var raw;
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, parseInt);
    } else {
      return parseInt(raw);
    }
  };

  RecordSet.prototype.float = function(attr, decimalPlaces) {
    var raw;
    if (decimalPlaces == null) {
      decimalPlaces = 2;
    }
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, function(val) {
        return round(val, decimalPlaces);
      });
    } else {
      return round(raw, decimalPlaces);
    }
  };

  RecordSet.prototype.bool = function(attr) {
    var raw;
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, function(val) {
        return val.toString().toLowerCase() === 'true';
      });
    } else {
      return raw.toString().toLowerCase() === 'true';
    }
  };

  return RecordSet;

})();

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

  ReportTab.prototype.getResult = function(id) {
    var result, results;
    results = this.getResults();
    result = _.find(results, function(r) {
      return r.paramName === id;
    });
    if (result == null) {
      throw new Error('No result with id ' + id);
    }
    return result.value;
  };

  ReportTab.prototype.getFirstResult = function(param, id) {
    var e, result;
    result = this.getResult(param);
    try {
      return result[0].features[0].attributes[id];
    } catch (_error) {
      e = _error;
      throw "Error finding " + param + ":" + id + " in gp results";
    }
  };

  ReportTab.prototype.getResults = function() {
    var results, _ref1, _ref2;
    if (!(results = (_ref1 = this.results) != null ? (_ref2 = _ref1.get('data')) != null ? _ref2.results : void 0 : void 0)) {
      throw new Error('No gp results');
    }
    return _.filter(results, function(result) {
      var _ref3;
      return (_ref3 = result.paramName) !== 'ResultCode' && _ref3 !== 'ResultMsg';
    });
  };

  ReportTab.prototype.recordSet = function(dependency, paramName, sketchClassId) {
    var dep, param, rs;
    if (__indexOf.call(this.dependencies, dependency) < 0) {
      throw new Error("Unknown dependency " + dependency);
    }
    if (sketchClassId) {
      dep = _.find(this.allResults, function(result) {
        return result.get('name') === dependency && result.get('sketchClass') === sketchClassId;
      });
    } else {
      dep = _.find(this.allResults, function(result) {
        return result.get('name') === dependency;
      });
    }
    if (!dep) {
      console.log(this.allResults);
      throw new Error("Could not find results for " + dependency + ".");
    }
    param = _.find(dep.get('data').results, function(param) {
      return param.paramName === paramName;
    });
    if (!param) {
      console.log(dep.get('data').results);
      throw new Error("Could not find param " + paramName + " in " + dependency);
    }
    rs = new RecordSet(param);
    rs.sketchClass = dep.get('sketchClass');
    return rs;
  };

  ReportTab.prototype.recordSets = function(dependency, paramName) {
    var dep, deps, param, params, rs, _i, _len;
    if (__indexOf.call(this.dependencies, dependency) < 0) {
      throw new Error("Unknown dependency " + dependency);
    }
    deps = _.filter(this.allResults, function(result) {
      return result.get('name') === dependency;
    });
    if (!deps.length) {
      console.log(this.allResults);
      throw new Error("Could not find results for " + dependency + ".");
    }
    params = [];
    for (_i = 0, _len = deps.length; _i < _len; _i++) {
      dep = deps[_i];
      param = _.find(dep.get('data').results, function(param) {
        return param.paramName === paramName;
      });
      if (!param) {
        console.log(dep.get('data').results);
        throw new Error("Could not find param " + paramName + " in " + dependency);
      }
      rs = new RecordSet(param);
      rs.sketchClass = dep.get('sketchClass');
      params.push(rs);
    }
    return params;
  };

  ReportTab.prototype.enableTablePaging = function() {
    return this.$('[data-paging]').each(function() {
      var $table, i, noRowsMessage, pageSize, pages, parent, rows, ul, _i, _len, _ref1;
      $table = $(this);
      pageSize = $table.data('paging');
      rows = $table.find('tbody tr').length;
      pages = Math.ceil(rows / pageSize);
      if (pages > 1) {
        $table.append("<tfoot>\n  <tr>\n    <td colspan=\"" + ($table.find('thead th').length) + "\">\n      <div class=\"pagination\">\n        <ul>\n          <li><a href=\"#\">Prev</a></li>\n        </ul>\n      </div>\n    </td>\n  </tr>\n</tfoot>");
        ul = $table.find('tfoot ul');
        _ref1 = _.range(1, pages + 1);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          i = _ref1[_i];
          ul.append("<li><a href=\"#\">" + i + "</a></li>");
        }
        ul.append("<li><a href=\"#\">Next</a></li>");
        $table.find('li a').click(function(e) {
          var $a, a, n, offset, text;
          e.preventDefault();
          $a = $(this);
          text = $a.text();
          if (text === 'Next') {
            a = $a.parent().parent().find('.active').next().find('a');
            if (a.text() !== 'Next') {
              return a.click();
            }
          } else if (text === 'Prev') {
            a = $a.parent().parent().find('.active').prev().find('a');
            if (a.text() !== 'Prev') {
              return a.click();
            }
          } else {
            $a.parent().parent().find('.active').removeClass('active');
            $a.parent().addClass('active');
            n = parseInt(text);
            $table.find('tbody tr').hide();
            offset = pageSize * (n - 1);
            return $table.find("tbody tr").slice(offset, n * pageSize).show();
          }
        });
        $($table.find('li a')[1]).click();
      }
      if (noRowsMessage = $table.data('no-rows')) {
        if (rows === 0) {
          parent = $table.parent();
          $table.remove();
          parent.removeClass('tableContainer');
          return parent.append("<p>" + noRowsMessage + "</p>");
        }
      }
    });
  };

  ReportTab.prototype.enableLayerTogglers = function() {
    return enableLayerTogglers(this.$el);
  };

  ReportTab.prototype.getChildren = function(sketchClassId) {
    return _.filter(this.children, function(child) {
      return child.getSketchClass().id === sketchClassId;
    });
  };

  return ReportTab;

})(Backbone.View);

module.exports = ReportTab;


},{"./enableLayerTogglers.coffee":1,"./utils.coffee":"d+CDld"}],"d+CDld":[function(require,module,exports){
module.exports = {
  round: function(number, decimalPlaces) {
    var multiplier;
    if (!_.isNumber(number)) {
      number = parseFloat(number);
    }
    multiplier = Math.pow(10, decimalPlaces);
    return Math.round(number * multiplier) / multiplier;
  }
};


},{}],"fIqoFw":[function(require,module,exports){
this["Templates"] = this["Templates"] || {};

this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributeItem"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<tr data-attribute-id=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\" data-attribute-exportid=\"");_.b(_.v(_.f("exportid",c,p,0)));_.b("\" data-attribute-type=\"");_.b(_.v(_.f("type",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <td class=\"name\">");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("  <td class=\"value\">");_.b(_.v(_.f("formattedValue",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("</tr>");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributesTable"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<table class=\"attributes\">");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,44,81,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(_.rp("attributes/attributeItem",c,p,"    "));});c.pop();}_.b("</table>");_.b("\n");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/genericAttributes"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

module.exports = this["Templates"];
},{}],5:[function(require,module,exports){
var ArrayFishingValueTab, ReportTab, ids, key, templates, value, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

ids = require('./ids.coffee');

for (key in ids) {
  value = ids[key];
  window[key] = value;
}

ArrayFishingValueTab = (function(_super) {
  __extends(ArrayFishingValueTab, _super);

  function ArrayFishingValueTab() {
    _ref = ArrayFishingValueTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ArrayFishingValueTab.prototype.name = 'Fishing Value';

  ArrayFishingValueTab.prototype.className = 'fishingValue';

  ArrayFishingValueTab.prototype.template = templates.arrayFishingValue;

  ArrayFishingValueTab.prototype.dependencies = ['FishingValue', 'FishingPriorityArea'];

  ArrayFishingValueTab.prototype.timeout = 240000;

  ArrayFishingValueTab.prototype.render = function() {
    var aquacultureAreas, aquaculturePercent, context, fishingAreaPercent, fishingAreas, mooringPercent, moorings, sanctuaries, sanctuaryPercent;
    sanctuaries = this.getChildren(SANCTUARY_ID);
    if (sanctuaries.length) {
      sanctuaryPercent = this.recordSet('FishingValue', 'FishingValue', SANCTUARY_ID).float('PERCENT', 0);
    }
    aquacultureAreas = this.getChildren(AQUACULTURE_ID);
    if (aquacultureAreas.length) {
      aquaculturePercent = this.recordSet('FishingValue', 'FishingValue', AQUACULTURE_ID).float('PERCENT', 0);
    }
    moorings = this.getChildren(MOORING_ID);
    if (moorings.length) {
      mooringPercent = this.recordSet('FishingValue', 'FishingValue', MOORING_ID).float('PERCENT', 2);
    }
    fishingAreas = this.getChildren(FISHING_PRIORITY_AREA_ID);
    if (fishingAreas.length) {
      fishingAreaPercent = this.recordSet('FishingPriorityArea', 'FishingPriorityArea', FISHING_PRIORITY_AREA_ID).float('PERCENT', 0);
    }
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      sanctuaryPercent: sanctuaryPercent,
      numSanctuaries: sanctuaries.length,
      sanctuaries: sanctuaries.length > 0,
      sancPlural: sanctuaries.length > 1,
      mooringAreaPercent: mooringPercent,
      numMoorings: moorings.length,
      moorings: moorings.length > 0,
      mooringsPlural: moorings.length > 1,
      fishingAreaPercent: fishingAreaPercent,
      numFishingAreas: fishingAreas.length,
      fishingAreas: fishingAreas.length > 0,
      fishingAreasPlural: fishingAreas.length > 1,
      aquacultureAreaPercent: aquaculturePercent,
      numAquacultureAreas: aquacultureAreas.length,
      aquacultureAreas: aquacultureAreas.length > 0,
      aquacultureAreasPlural: aquacultureAreas.length > 1
    };
    this.$el.html(this.template.render(context, templates));
    return this.enableLayerTogglers(this.$el);
  };

  return ArrayFishingValueTab;

})(ReportTab);

module.exports = ArrayFishingValueTab;


},{"../templates/templates.js":13,"./ids.coffee":8,"reportTab":"perKyw"}],6:[function(require,module,exports){
var ArrayHabitatTab, ReportTab, ids, key, templates, value, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

ids = require('./ids.coffee');

for (key in ids) {
  value = ids[key];
  window[key] = value;
}

ArrayHabitatTab = (function(_super) {
  __extends(ArrayHabitatTab, _super);

  function ArrayHabitatTab() {
    _ref = ArrayHabitatTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ArrayHabitatTab.prototype.name = 'Habitat';

  ArrayHabitatTab.prototype.className = 'habitat';

  ArrayHabitatTab.prototype.template = templates.arrayHabitats;

  ArrayHabitatTab.prototype.dependencies = ['BarbudaHabitat', 'HabitatsInMooring'];

  ArrayHabitatTab.prototype.timeout = 240000;

  ArrayHabitatTab.prototype.render = function() {
    var aquaculture, aquacultureAreas, context, fishingAreaData, fishingAreas, mooringData, moorings, row, sanctuaries, sanctuary, _i, _len;
    sanctuaries = this.getChildren(SANCTUARY_ID);
    if (sanctuaries.length) {
      sanctuary = this.recordSet('BarbudaHabitat', 'Habitats', SANCTUARY_ID).toArray();
      for (_i = 0, _len = sanctuary.length; _i < _len; _i++) {
        row = sanctuary[_i];
        if (parseFloat(row.Percent) >= 33) {
          row.meetsGoal = true;
        }
      }
    }
    aquacultureAreas = this.getChildren(AQUACULTURE_ID);
    if (aquacultureAreas.length) {
      aquaculture = this.recordSet('BarbudaHabitat', 'Habitats', AQUACULTURE_ID).toArray();
    }
    moorings = this.getChildren(MOORING_ID);
    if (moorings.length) {
      mooringData = this.recordSet('HabitatsInMooring', 'HabitatsInMooring', MOORING_ID).toArray();
    }
    fishingAreas = this.getChildren(FISHING_PRIORITY_AREA_ID);
    if (fishingAreas.length) {
      fishingAreaData = this.recordSet('BarbudaHabitat', 'Habitats', FISHING_PRIORITY_AREA_ID).toArray();
    }
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      numSanctuaries: sanctuaries.length,
      sanctuaries: sanctuaries.length > 0,
      sanctuaryHabitat: sanctuary,
      sanctuaryPlural: sanctuaries.length > 1,
      numAquaculture: aquacultureAreas.length,
      aquacultureAreas: aquacultureAreas.length > 0,
      aquaPlural: aquacultureAreas.length > 1,
      aquacultureHabitat: aquaculture,
      moorings: moorings.length > 0,
      numMoorings: moorings.length,
      mooringData: mooringData,
      mooringPlural: moorings.length > 1,
      fishingAreas: fishingAreas.length > 0,
      numFishingAreas: fishingAreas.length,
      fishingAreaData: fishingAreaData,
      fishingAreaPlural: fishingAreas.length > 1
    };
    this.$el.html(this.template.render(context, templates));
    return this.enableLayerTogglers(this.$el);
  };

  return ArrayHabitatTab;

})(ReportTab);

module.exports = ArrayHabitatTab;


},{"../templates/templates.js":13,"./ids.coffee":8,"reportTab":"perKyw"}],7:[function(require,module,exports){
var ArrayOverviewTab, ReportTab, TOTAL_AREA, key, partials, round, templates, val, _partials, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

round = require('api/utils').round;

TOTAL_AREA = 175.95;

_partials = require('api/templates');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

ArrayOverviewTab = (function(_super) {
  __extends(ArrayOverviewTab, _super);

  function ArrayOverviewTab() {
    _ref = ArrayOverviewTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ArrayOverviewTab.prototype.name = 'Overview';

  ArrayOverviewTab.prototype.className = 'overview';

  ArrayOverviewTab.prototype.template = templates.arrayOverview;

  ArrayOverviewTab.prototype.dependencies = ['Diameter'];

  ArrayOverviewTab.prototype.timeout = 120000;

  ArrayOverviewTab.prototype.render = function() {
    var PERCENT, SQ_MILES, TableOfContents, context, node, nodes, rs, _i, _j, _len, _len1, _ref1;
    SQ_MILES = 0;
    _ref1 = this.recordSets('Diameter', 'Diameter');
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      rs = _ref1[_i];
      SQ_MILES += rs.float('SQ_MILES');
    }
    PERCENT = SQ_MILES / TOTAL_AREA;
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      anyAttributes: this.model.getAttributes().length > 0,
      admin: this.project.isAdmin(window.user),
      numSketches: this.children.length,
      SQ_MILES: round(SQ_MILES, 2),
      PERCENT: round(SQ_MILES, 0)
    };
    this.$el.html(this.template.render(context, partials));
    nodes = [this.model];
    this.model.set('open', true);
    nodes = nodes.concat(this.children);
    for (_j = 0, _len1 = nodes.length; _j < _len1; _j++) {
      node = nodes[_j];
      node.set('selected', false);
    }
    TableOfContents = window.require('views/tableOfContents');
    this.toc = new TableOfContents(nodes);
    this.$('.tocContainer').append(this.toc.el);
    return this.toc.render();
  };

  ArrayOverviewTab.prototype.remove = function() {
    var _ref1;
    if ((_ref1 = this.toc) != null) {
      _ref1.remove();
    }
    return ArrayOverviewTab.__super__.remove.call(this);
  };

  return ArrayOverviewTab;

})(ReportTab);

module.exports = ArrayOverviewTab;


},{"../templates/templates.js":13,"api/templates":"fIqoFw","api/utils":"d+CDld","reportTab":"perKyw"}],8:[function(require,module,exports){
module.exports = {
  SANCTUARY_ID: '51faebef8faa309b7c05de02',
  AQUACULTURE_ID: '520bb1c00bd22c9b2147b99b',
  MOORING_ID: '520d3dc4674659cb7b3480f5',
  FISHING_PRIORITY_AREA_ID: '520bb1d00bd22c9b2147b9d0'
};


},{}],"api/utils":[function(require,module,exports){
module.exports=require('d+CDld');
},{}],"api/templates":[function(require,module,exports){
module.exports=require('fIqoFw');
},{}],11:[function(require,module,exports){
var ArrayFishingValueTab, ArrayHabitatTab, ArrayOverviewTab, templates;

templates = require('../templates/templates.js');

ArrayOverviewTab = require('./arrayOverviewTab.coffee');

ArrayHabitatTab = require('./arrayHabitatTab.coffee');

ArrayFishingValueTab = require('./arrayFishingValueTab.coffee');

window.app.registerReport(function(report) {
  report.tabs([ArrayOverviewTab, ArrayHabitatTab, ArrayFishingValueTab]);
  return report.stylesheets(['./proposal.css']);
});


},{"../templates/templates.js":13,"./arrayFishingValueTab.coffee":5,"./arrayHabitatTab.coffee":6,"./arrayOverviewTab.coffee":7}],"reportTab":[function(require,module,exports){
module.exports=require('perKyw');
},{}],13:[function(require,module,exports){
this["Templates"] = this["Templates"] || {};

this["Templates"]["aquacultureFishingValue"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Fishing Value</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This aquaculture area displaces <strong>");_.b(_.v(_.f("percent",c,p,0)));_.b("%</strong> ");_.b("\n" + i);_.b("    of the fishing value within Barbuda’s waters, based on user reported");_.b("\n" + i);_.b("    values of fishing grounds.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"5241ea7de0fba11f3d010011\">show fishing values layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["arrayFishingValue"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Displaced Fishing Value</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);if(_.s(_.f("sanctuaries",c,p,1),c,p,0,103,389,"{{ }}")){_.rs(c,p,function(c,p,_){if(_.s(_.f("aquacultureAreas",c,p,1),c,p,0,129,363,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    This proposal includes both Sanctuary and Aquaculture areas, displacing");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("sanctuaryPercent",c,p,0)));_.b("%</strong> and <strong>");_.b(_.v(_.f("aquacultureAreaPercent",c,p,0)));_.b("%</strong> ");_.b("\n" + i);_.b("    of fishing value within Barbuda's waters, respectively.");_.b("\n");});c.pop();}});c.pop();}if(_.s(_.f("sanctuaries",c,p,1),c,p,0,426,764,"{{ }}")){_.rs(c,p,function(c,p,_){if(!_.s(_.f("aquacultureAreas",c,p,1),c,p,1,0,0,"")){_.b("    This proposal includes ");_.b(_.v(_.f("numSanctuaries",c,p,0)));_.b("\n" + i);_.b("    ");if(_.s(_.f("sancPlural",c,p,1),c,p,0,518,529,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("Sanctuaries");});c.pop();}if(!_.s(_.f("sancPlural",c,p,1),c,p,1,0,0,"")){_.b("Sanctuary");};_.b(",");_.b("\n" + i);_.b("    displacing <strong>");_.b(_.v(_.f("sanctuaryPercent",c,p,0)));_.b("%</strong> of fishing value within ");_.b("\n" + i);_.b("    Barbuda's waters based on user reported values of fishing grounds");_.b("\n");};});c.pop();}if(!_.s(_.f("sanctuaries",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("aquacultureAreas",c,p,1),c,p,0,827,1115,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    This proposal includes ");_.b(_.v(_.f("numAquacultureAreas",c,p,0)));_.b("\n" + i);_.b("    Aquaculture Area");if(_.s(_.f("aquacultureAreasPlural",c,p,1),c,p,0,926,927,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(",");_.b("\n" + i);_.b("    displacing <strong>");_.b(_.v(_.f("aquacultureAreaPercent",c,p,0)));_.b("%</strong> of fishing value within ");_.b("\n" + i);_.b("    Barbuda's waters based on user reported values of fishing grounds");_.b("\n");});c.pop();}};if(_.s(_.f("moorings",c,p,1),c,p,0,1175,1487,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    ");_.b(_.v(_.f("numMoorings",c,p,0)));_.b(" Mooring Area");if(_.s(_.f("mooringsPlural",c,p,1),c,p,0,1227,1232,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s are");});c.pop();}_.b(" ");if(!_.s(_.f("mooringsPlural",c,p,1),c,p,1,0,0,"")){_.b("is");};_.b("\n" + i);_.b("    also included, which cover");if(!_.s(_.f("mooringsPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" <strong>");_.b(_.v(_.f("mooringAreaPercent",c,p,0)));_.b("%</strong> of ");_.b("\n" + i);_.b("    regional fishing value. Mooring areas may displace fishing activities.");_.b("\n");});c.pop();}_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"5241ea7de0fba11f3d010011\">show fishing values layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("fishingAreas",c,p,1),c,p,0,1621,1993,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Priority Fishing Areas</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This proposal includes ");_.b(_.v(_.f("numFishingAreas",c,p,0)));_.b(" Fishing Priority ");_.b("\n" + i);_.b("    Area");if(_.s(_.f("fishingAreaPural",c,p,1),c,p,0,1798,1799,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(", representing");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("fishingAreaPercent",c,p,0)));_.b("%</strong> of the fishing value within Barbuda's ");_.b("\n" + i);_.b("    waters based on user reported values of fishing grounds");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

this["Templates"]["arrayHabitats"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("sanctuaries",c,p,1),c,p,0,16,919,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats within ");_.b(_.v(_.f("numSanctuaries",c,p,0)));_.b(" ");if(!_.s(_.f("sanctuaryPlural",c,p,1),c,p,1,0,0,"")){_.b("Sanctuary");};if(_.s(_.f("sanctuaryPlural",c,p,1),c,p,0,170,181,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("Sanctuaries");});c.pop();}_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Percent of Total Habitat</th>");_.b("\n" + i);_.b("        <th>Meets 33% goal</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("sanctuaryHabitat",c,p,1),c,p,0,403,616,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr class=\"");if(_.s(_.f("meetsGoal",c,p,1),c,p,0,435,442,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("metGoal");});c.pop();}_.b("\">");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b(" %</td>");_.b("\n" + i);_.b("        <td>");if(_.s(_.f("meetsGoal",c,p,1),c,p,0,545,548,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("yes");});c.pop();}if(!_.s(_.f("meetsGoal",c,p,1),c,p,1,0,0,"")){_.b("no");};_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within sanctuaries. <br>");_.b("\n" + i);_.b("    <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\">show habitats layer</a>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("aquacultureAreas",c,p,1),c,p,0,958,1588,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats within ");_.b(_.v(_.f("numAquaculture",c,p,0)));_.b(" Aquaculture Area");if(_.s(_.f("aquaPlural",c,p,1),c,p,0,1074,1075,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Percent of Total Habitat</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("aquacultureHabitat",c,p,1),c,p,0,1262,1352,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b(" %</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("<!--   <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within aquaculture ");_.b("\n" + i);_.b("    areas.");_.b("\n" + i);_.b("  </p> -->");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("moorings",c,p,1),c,p,0,1624,2235,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats within ");_.b(_.v(_.f("numMoorings",c,p,0)));_.b(" Mooring Area");if(_.s(_.f("mooringPlural",c,p,1),c,p,0,1736,1737,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Percent of Total Habitat</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("mooringData",c,p,1),c,p,0,1920,2010,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b(" %</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("<!--   <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within mooring ");_.b("\n" + i);_.b("    areas.");_.b("\n" + i);_.b("  </p> -->");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("fishingAreas",c,p,1),c,p,0,2267,2916,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats within ");_.b(_.v(_.f("numFishingAreas",c,p,0)));_.b(" Fishing Priority Area");if(_.s(_.f("fishingAreaPlural",c,p,1),c,p,0,2396,2397,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Percent of Total Habitat</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("fishingAreaData",c,p,1),c,p,0,2588,2678,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b(" %</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within fishing ");_.b("\n" + i);_.b("    priority areas.");_.b("\n" + i);_.b("  </p> -->");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

this["Templates"]["arrayOverview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This collection of ");_.b(_.v(_.f("numSketches",c,p,0)));_.b(" zones has a total area of <strong>");_.b(_.v(_.f("SQ_MILES",c,p,0)));_.b(" square miles</strong>, ");_.b("\n" + i);_.b("    which represents <strong>");_.b(_.v(_.f("PERCENT",c,p,0)));_.b("%</strong> of Barbuda's waters.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Zones in this Proposal</h4>");_.b("\n" + i);_.b("  <div class=\"tocContainer\"></div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("anyAttributes",c,p,1),c,p,0,685,809,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"  "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

this["Templates"]["demo"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Report Sections</h4>");_.b("\n" + i);_.b("  <p>Use report sections to group information into meaningful categories</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>D3 Visualizations</h4>");_.b("\n" + i);_.b("  <ul class=\"nav nav-pills\" id=\"tabs2\">");_.b("\n" + i);_.b("    <li class=\"active\"><a href=\"#chart\">Chart</a></li>");_.b("\n" + i);_.b("    <li><a href=\"#dataTable\">Table</a></li>");_.b("\n" + i);_.b("  </ul>");_.b("\n" + i);_.b("  <div class=\"tab-content\">");_.b("\n" + i);_.b("    <div class=\"tab-pane active\" id=\"chart\">");_.b("\n" + i);_.b("      <!--[if IE 8]>");_.b("\n" + i);_.b("      <p class=\"unsupported\">");_.b("\n" + i);_.b("      This visualization is not compatible with Internet Explorer 8. ");_.b("\n" + i);_.b("      Please upgrade your browser, or view results in the table tab.");_.b("\n" + i);_.b("      </p>      ");_.b("\n" + i);_.b("      <![endif]-->");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        See <code>src/scripts/demo.coffee</code> for an example of how to ");_.b("\n" + i);_.b("        use d3.js to render visualizations. Provide a table-based view");_.b("\n" + i);_.b("        and use conditional comments to provide a fallback for IE8 users.");_.b("\n" + i);_.b("        <br>");_.b("\n" + i);_.b("        <a href=\"http://twitter.github.io/bootstrap/2.3.2/\">Bootstrap 2.x</a>");_.b("\n" + i);_.b("        is loaded within SeaSketch so you can use it to create tabs and other ");_.b("\n" + i);_.b("        interface components. jQuery and underscore are also available.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("    <div class=\"tab-pane\" id=\"dataTable\">");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>index</th>");_.b("\n" + i);_.b("            <th>value</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("chartData",c,p,1),c,p,0,1351,1418,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr><td>");_.b(_.v(_.f("index",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("value",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection emphasis\">");_.b("\n" + i);_.b("  <h4>Emphasis</h4>");_.b("\n" + i);_.b("  <p>Give report sections an <code>emphasis</code> class to highlight important information.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection warning\">");_.b("\n" + i);_.b("  <h4>Warning</h4>");_.b("\n" + i);_.b("  <p>Or <code>warn</code> of potential problems.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection danger\">");_.b("\n" + i);_.b("  <h4>Danger</h4>");_.b("\n" + i);_.b("  <p><code>danger</code> can also be used... sparingly.</p>");_.b("\n" + i);_.b("</div>");return _.fl();;});

this["Templates"]["fishingPriorityArea"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Fishing Value</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This fishing priority area includes <strong>");_.b(_.v(_.f("percent",c,p,0)));_.b("%</strong> of the ");_.b("\n" + i);_.b("    fishing value within Barbuda's waters, based on user reported values of ");_.b("\n" + i);_.b("    fishing grounds");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"5241ea7de0fba11f3d010011\">show fishing values layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["fishingValue"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Fishing Value</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This ");_.b(_.v(_.f("areaLabel",c,p,0)));_.b(" displaces <strong>");_.b(_.v(_.f("percent",c,p,0)));_.b("%</strong> ");_.b("\n" + i);_.b("    of the fishing value within Barbuda’s waters, based on user reported");_.b("\n" + i);_.b("    values of fishing grounds.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"5241ea7de0fba11f3d010011\">show fishing values layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["habitat"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.f("heading",c,p,0)));_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>% of Total Habitat</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("habitats",c,p,1),c,p,0,216,279,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr><td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("Percent",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within this zone. <br>");_.b("\n" + i);_.b("    <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\">show habitats layer</a>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This area is <strong>");_.b(_.v(_.f("SQ_MILES",c,p,0)));_.b(" square miles</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("renderMinimumWidth",c,p,1),c,p,0,464,1106,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection diameter ");if(!_.s(_.f("DIAM_OK",c,p,1),c,p,1,0,0,"")){_.b("warning");};_.b("\">");_.b("\n" + i);_.b("  <h4>Minimum Width</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    The minimum width of a zone significantly impacts  its conservation value. ");_.b("\n" + i);_.b("    The recommended smallest diameter is between 2 and 3 miles.");_.b("\n" + i);_.b("    <strong>");_.b("\n" + i);if(!_.s(_.f("DIAM_OK",c,p,1),c,p,1,0,0,"")){_.b("    This design falls outside the recommendation at ");_.b(_.v(_.f("DIAM",c,p,0)));_.b(" miles.");_.b("\n");};if(_.s(_.f("DIAM_OK",c,p,1),c,p,0,854,925,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    This design fits within the recommendation at ");_.b(_.v(_.f("DIAM",c,p,0)));_.b(" miles.");_.b("\n");});c.pop();}_.b("    </strong>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <div class=\"viz\" style=\"position:relative;\"></div>");_.b("\n" + i);_.b("  <img src=\"http://s3.amazonaws.com/SeaSketch/projects/barbuda/min_width_example.png\">");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("anyAttributes",c,p,1),c,p,0,1149,1273,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"  "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

module.exports = this["Templates"];
},{}]},{},[11])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvY2J1cnQvV29ya2luZy9iYXJidWRhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvY2J1cnQvV29ya2luZy9iYXJidWRhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9jYnVydC9Xb3JraW5nL2JhcmJ1ZGEtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy91dGlscy5jb2ZmZWUiLCIvVXNlcnMvY2J1cnQvV29ya2luZy9iYXJidWRhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiLCIvVXNlcnMvY2J1cnQvV29ya2luZy9iYXJidWRhLXJlcG9ydHMvc2NyaXB0cy9hcnJheUZpc2hpbmdWYWx1ZVRhYi5jb2ZmZWUiLCIvVXNlcnMvY2J1cnQvV29ya2luZy9iYXJidWRhLXJlcG9ydHMvc2NyaXB0cy9hcnJheUhhYml0YXRUYWIuY29mZmVlIiwiL1VzZXJzL2NidXJ0L1dvcmtpbmcvYmFyYnVkYS1yZXBvcnRzL3NjcmlwdHMvYXJyYXlPdmVydmlld1RhYi5jb2ZmZWUiLCIvVXNlcnMvY2J1cnQvV29ya2luZy9iYXJidWRhLXJlcG9ydHMvc2NyaXB0cy9pZHMuY29mZmVlIiwiL1VzZXJzL2NidXJ0L1dvcmtpbmcvYmFyYnVkYS1yZXBvcnRzL3NjcmlwdHMvcHJvcG9zYWwuY29mZmVlIiwiL1VzZXJzL2NidXJ0L1dvcmtpbmcvYmFyYnVkYS1yZXBvcnRzL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLENBQU8sQ0FBVSxDQUFBLEdBQVgsQ0FBTixFQUFrQjtDQUNoQixLQUFBLDJFQUFBO0NBQUEsQ0FBQSxDQUFBO0NBQUEsQ0FDQSxDQUFBLEdBQVk7Q0FEWixDQUVBLENBQUEsR0FBTTtBQUNDLENBQVAsQ0FBQSxDQUFBLENBQUE7Q0FDRSxFQUFBLENBQUEsR0FBTyxxQkFBUDtDQUNBLFNBQUE7SUFMRjtDQUFBLENBTUEsQ0FBVyxDQUFBLElBQVgsYUFBVztDQUVYO0NBQUEsTUFBQSxvQ0FBQTt3QkFBQTtDQUNFLEVBQVcsQ0FBWCxHQUFXLENBQVg7Q0FBQSxFQUNTLENBQVQsRUFBQSxFQUFpQixLQUFSO0NBQ1Q7Q0FDRSxFQUFPLENBQVAsRUFBQSxVQUFPO0NBQVAsRUFDTyxDQUFQLENBREEsQ0FDQTtBQUMrQixDQUYvQixDQUU4QixDQUFFLENBQWhDLEVBQUEsRUFBUSxDQUF3QixLQUFoQztDQUZBLENBR3lCLEVBQXpCLEVBQUEsRUFBUSxDQUFSO01BSkY7Q0FNRSxLQURJO0NBQ0osQ0FBZ0MsRUFBaEMsRUFBQSxFQUFRLFFBQVI7TUFUSjtDQUFBLEVBUkE7Q0FtQlMsQ0FBVCxDQUFxQixJQUFyQixDQUFRLENBQVI7Q0FDRSxHQUFBLFVBQUE7Q0FBQSxFQUNBLENBQUEsRUFBTTtDQUROLEVBRU8sQ0FBUCxLQUFPO0NBQ1AsR0FBQTtDQUNFLEdBQUksRUFBSixVQUFBO0FBQzBCLENBQXRCLENBQXFCLENBQXRCLENBQUgsQ0FBcUMsSUFBVixJQUEzQixDQUFBO01BRkY7Q0FJUyxFQUFxRSxDQUFBLENBQTVFLFFBQUEseURBQU87TUFSVTtDQUFyQixFQUFxQjtDQXBCTjs7OztBQ0FqQixJQUFBLGtEQUFBO0dBQUE7Ozt3SkFBQTs7QUFBQSxDQUFBLEVBQXNCLElBQUEsWUFBdEIsV0FBc0I7O0FBQ3RCLENBREEsRUFDUSxFQUFSLEVBQVEsU0FBQTs7QUFFRixDQUhOO0NBS2UsQ0FBQSxDQUFBLENBQUEsZUFBRTtDQUFPLEVBQVAsQ0FBRDtDQUFkLEVBQWE7O0NBQWIsRUFFUyxJQUFULEVBQVM7Q0FDTixDQUE4QixDQUEvQixDQUFPLENBQVcsRUFBYSxDQUEvQixDQUFnQyxFQUFoQztDQUNVLE1BQUQsTUFBUDtDQURGLElBQStCO0NBSGpDLEVBRVM7O0NBRlQsRUFNQSxDQUFLLEtBQUM7Q0FDSixJQUFBLEdBQUE7Q0FBQSxDQUEwQixDQUFsQixDQUFSLENBQUEsRUFBYyxFQUFhO0NBQ3JCLEVBQUEsQ0FBQSxTQUFKO0NBRE0sSUFBa0I7Q0FBMUIsQ0FFd0IsQ0FBaEIsQ0FBUixDQUFBLENBQVEsR0FBaUI7Q0FBRCxHQUFVLENBQVEsUUFBUjtDQUExQixJQUFnQjtDQUN4QixHQUFBLENBQVEsQ0FBTDtDQUNELEVBQWdDLENBQWhDLFFBQU8sY0FBQTtDQUNLLEdBQU4sQ0FBSyxDQUZiO0NBR0UsSUFBYSxRQUFOO01BSFQ7Q0FLRSxJQUFBLFFBQU87TUFUTjtDQU5MLEVBTUs7O0NBTkwsRUFpQkEsQ0FBSyxLQUFDO0NBQ0osRUFBQSxLQUFBO0NBQUEsRUFBQSxDQUFBO0NBQ0EsRUFBRyxDQUFILEdBQUc7Q0FDQSxDQUFVLENBQVgsS0FBQSxLQUFBO01BREY7Q0FHVyxFQUFULEtBQUEsS0FBQTtNQUxDO0NBakJMLEVBaUJLOztDQWpCTCxDQXdCYyxDQUFQLENBQUEsQ0FBUCxJQUFRLElBQUQ7Q0FDTCxFQUFBLEtBQUE7O0dBRDBCLEdBQWQ7TUFDWjtDQUFBLEVBQUEsQ0FBQTtDQUNBLEVBQUcsQ0FBSCxHQUFHO0NBQ0EsQ0FBVSxDQUFYLE1BQVksSUFBWjtDQUEwQixDQUFLLENBQVgsRUFBQSxRQUFBLEVBQUE7Q0FBcEIsTUFBVztNQURiO0NBR1EsQ0FBSyxDQUFYLEVBQUEsUUFBQTtNQUxHO0NBeEJQLEVBd0JPOztDQXhCUCxFQStCTSxDQUFOLEtBQU87Q0FDTCxFQUFBLEtBQUE7Q0FBQSxFQUFBLENBQUE7Q0FDQSxFQUFHLENBQUgsR0FBRztDQUNBLENBQVUsQ0FBWCxNQUFZLElBQVo7Q0FBd0IsRUFBRCxFQUE2QixHQUFoQyxHQUFBLElBQUE7Q0FBcEIsTUFBVztNQURiO0NBR00sRUFBRCxFQUE2QixHQUFoQyxHQUFBLEVBQUE7TUFMRTtDQS9CTixFQStCTTs7Q0EvQk47O0NBTEY7O0FBMkNNLENBM0NOO0NBNENFOzs7Ozs7Q0FBQTs7Q0FBQSxFQUFNLENBQU4sU0FBQTs7Q0FBQSxDQUFBLENBQ2MsU0FBZDs7Q0FEQSxDQUdzQixDQUFWLEVBQUEsRUFBQSxFQUFFLENBQWQ7Q0FNRSxFQU5ZLENBQUQsQ0FNWDtDQUFBLEVBTm9CLENBQUQsR0FNbkI7Q0FBQSxFQUFBLENBQUEsRUFBYTtDQUNaLENBQVcsRUFBWixFQUFBLENBQUEsSUFBQTtDQVZGLEVBR1k7O0NBSFosRUFZUSxHQUFSLEdBQVE7Q0FDTixTQUFNLHVCQUFOO0NBYkYsRUFZUTs7Q0FaUixFQWVNLENBQU4sS0FBTTtDQUNKLEVBQUksQ0FBSjtDQUNDLEVBQVUsQ0FBVixHQUFELElBQUE7Q0FqQkYsRUFlTTs7Q0FmTixFQW1CTSxDQUFOLEtBQU07Q0FDSixFQUFJLENBQUo7Q0FDQyxFQUFVLENBQVYsR0FBRCxJQUFBO0NBckJGLEVBbUJNOztDQW5CTixFQXVCUSxHQUFSLEdBQVE7Q0FBQSxVQUNOLHlCQUFBO0NBeEJGLEVBdUJROztDQXZCUixFQTBCVyxNQUFYOztDQTFCQSxDQTRCVyxDQUFBLE1BQVg7Q0FDRSxPQUFBLE9BQUE7Q0FBQSxFQUFVLENBQVYsR0FBQSxHQUFVO0NBQVYsQ0FDeUIsQ0FBaEIsQ0FBVCxFQUFBLENBQVMsRUFBaUI7Q0FBTyxJQUFjLElBQWYsSUFBQTtDQUF2QixJQUFnQjtDQUN6QixHQUFBLFVBQUE7Q0FDRSxDQUFVLENBQTZCLENBQTdCLENBQUEsT0FBQSxRQUFNO01BSGxCO0NBSU8sS0FBRCxLQUFOO0NBakNGLEVBNEJXOztDQTVCWCxDQW1Dd0IsQ0FBUixFQUFBLElBQUMsS0FBakI7Q0FDRSxPQUFBLENBQUE7Q0FBQSxFQUFTLENBQVQsQ0FBUyxDQUFULEdBQVM7Q0FDVDtDQUNFLENBQXdDLElBQTFCLEVBQVksRUFBYyxHQUFqQztNQURUO0NBR0UsS0FESTtDQUNKLENBQU8sQ0FBZSxFQUFmLE9BQUEsSUFBQTtNQUxLO0NBbkNoQixFQW1DZ0I7O0NBbkNoQixFQTBDWSxNQUFBLENBQVo7Q0FDRSxPQUFBLGFBQUE7QUFBTyxDQUFQLEdBQUEsQ0FBc0MsQ0FBL0IsQ0FBQTtDQUNMLEdBQVUsQ0FBQSxPQUFBLEdBQUE7TUFEWjtDQUVDLENBQWlCLENBQUEsR0FBbEIsQ0FBQSxFQUFtQixFQUFuQjtDQUNFLElBQUEsS0FBQTtDQUFPLEVBQVAsQ0FBQSxDQUF5QixDQUFuQixNQUFOO0NBREYsSUFBa0I7Q0E3Q3BCLEVBMENZOztDQTFDWixDQWdEd0IsQ0FBYixNQUFYLENBQVcsR0FBQTtDQUNULE9BQUEsTUFBQTtDQUFBLENBQU8sRUFBUCxDQUFBLEtBQU8sRUFBQSxHQUFjO0NBQ25CLEVBQXFDLENBQTNCLENBQUEsS0FBQSxFQUFBLFNBQU87TUFEbkI7Q0FFQSxHQUFBLFNBQUE7Q0FDRSxDQUEwQixDQUExQixDQUFNLEVBQU4sR0FBMkIsQ0FBckI7Q0FDRyxFQUFQLENBQ0UsQ0FEb0IsQ0FBaEIsSUFBTixHQUNFLEVBREY7Q0FESSxNQUFvQjtNQUQ1QjtDQUtFLENBQTBCLENBQTFCLENBQU0sRUFBTixHQUEyQixDQUFyQjtDQUF1QyxFQUFQLEVBQXNCLENBQWhCLFNBQU47Q0FBaEMsTUFBb0I7TUFQNUI7QUFRTyxDQUFQLEVBQUEsQ0FBQTtDQUNFLEVBQUEsQ0FBYSxFQUFiLENBQU8sR0FBUDtDQUNBLEVBQTZDLENBQW5DLENBQUEsS0FBTyxFQUFQLGlCQUFPO01BVm5CO0NBQUEsQ0FXd0MsQ0FBaEMsQ0FBUixDQUFBLENBQWUsQ0FBUCxFQUFpQztDQUNqQyxJQUFELElBQUwsSUFBQTtDQURNLElBQWdDO0FBRWpDLENBQVAsR0FBQSxDQUFBO0NBQ0UsRUFBQSxHQUFBLENBQU87Q0FDUCxFQUF1QyxDQUE3QixDQUFBLENBQU8sR0FBQSxDQUFQLEVBQUEsV0FBTztNQWZuQjtDQUFBLENBZ0JBLENBQVMsQ0FBVCxDQUFTLElBQUE7Q0FoQlQsQ0FpQkUsQ0FBZSxDQUFqQixPQUFBLEVBQWlCO0NBbEJSLFVBbUJUO0NBbkVGLEVBZ0RXOztDQWhEWCxDQXFFeUIsQ0FBYixNQUFDLENBQWI7Q0FDRSxPQUFBLDhCQUFBO0NBQUEsQ0FBTyxFQUFQLENBQUEsS0FBTyxFQUFBLEdBQWM7Q0FDbkIsRUFBcUMsQ0FBM0IsQ0FBQSxLQUFBLEVBQUEsU0FBTztNQURuQjtDQUFBLENBRTZCLENBQXRCLENBQVAsRUFBTyxHQUF1QixDQUF2QjtDQUF5QyxFQUFQLEVBQXNCLENBQWhCLE9BQU47Q0FBbEMsSUFBc0I7QUFDdEIsQ0FBUCxHQUFBLEVBQUE7Q0FDRSxFQUFBLENBQWEsRUFBYixDQUFPLEdBQVA7Q0FDQSxFQUE2QyxDQUFuQyxDQUFBLEtBQU8sRUFBUCxpQkFBTztNQUxuQjtDQUFBLENBQUEsQ0FNUyxDQUFULEVBQUE7QUFDQSxDQUFBLFFBQUEsa0NBQUE7c0JBQUE7Q0FDRSxDQUF3QyxDQUFoQyxDQUFBLENBQVIsQ0FBQSxDQUFRLEVBQWlDO0NBQ2pDLElBQUQsSUFBTCxNQUFBO0NBRE0sTUFBZ0M7QUFFakMsQ0FBUCxHQUFBLENBQUEsQ0FBQTtDQUNFLEVBQUEsR0FBWSxDQUFMLENBQVA7Q0FDQSxFQUF1QyxDQUE3QixDQUFBLENBQU8sR0FBQSxDQUFQLElBQUEsU0FBTztRQUpuQjtDQUFBLENBS0EsQ0FBUyxDQUFBLENBQUEsQ0FBVCxHQUFTO0NBTFQsQ0FNRSxDQUFlLEdBQWpCLEtBQUEsRUFBaUI7Q0FOakIsQ0FPQSxFQUFBLEVBQUE7Q0FSRixJQVBBO0NBZ0JBLEtBQUEsS0FBTztDQXRGVCxFQXFFWTs7Q0FyRVosRUF5Rm1CLE1BQUEsUUFBbkI7Q0FDRyxFQUF3QixDQUF4QixLQUF3QixFQUF6QixJQUFBO0NBQ0UsU0FBQSxrRUFBQTtDQUFBLEVBQVMsQ0FBQSxFQUFUO0NBQUEsRUFDVyxDQUFBLEVBQVgsRUFBQTtDQURBLEVBRU8sQ0FBUCxFQUFBLElBQU87Q0FGUCxFQUdRLENBQUksQ0FBWixDQUFBLEVBQVE7Q0FDUixFQUFXLENBQVIsQ0FBQSxDQUFIO0NBQ0UsRUFFTSxDQUFBLEVBRkEsRUFBTixFQUVNLDJCQUZXLHNIQUFqQjtDQUFBLENBYUEsQ0FBSyxDQUFBLEVBQU0sRUFBWCxFQUFLO0NBQ0w7Q0FBQSxZQUFBLCtCQUFBO3lCQUFBO0NBQ0UsQ0FBRSxDQUNJLEdBRE4sSUFBQSxDQUFBLFNBQWE7Q0FEZixRQWRBO0NBQUEsQ0FrQkUsSUFBRixFQUFBLHlCQUFBO0NBbEJBLEVBcUIwQixDQUExQixDQUFBLENBQU0sRUFBTixDQUEyQjtDQUN6QixhQUFBLFFBQUE7Q0FBQSxTQUFBLElBQUE7Q0FBQSxDQUNBLENBQUssQ0FBQSxNQUFMO0NBREEsQ0FFUyxDQUFGLENBQVAsTUFBQTtDQUNBLEdBQUcsQ0FBUSxDQUFYLElBQUE7Q0FDRSxDQUFNLENBQUYsQ0FBQSxFQUFBLEdBQUEsR0FBSjtDQUNBLEdBQU8sQ0FBWSxDQUFuQixNQUFBO0NBQ0csSUFBRCxnQkFBQTtjQUhKO0lBSVEsQ0FBUSxDQUpoQixNQUFBO0NBS0UsQ0FBTSxDQUFGLENBQUEsRUFBQSxHQUFBLEdBQUo7Q0FDQSxHQUFPLENBQVksQ0FBbkIsTUFBQTtDQUNHLElBQUQsZ0JBQUE7Y0FQSjtNQUFBLE1BQUE7Q0FTRSxDQUFFLEVBQUYsRUFBQSxFQUFBLENBQUEsRUFBQSxDQUFBO0NBQUEsQ0FDRSxJQUFGLEVBQUEsSUFBQTtDQURBLEVBRUksQ0FBQSxJQUFBLElBQUo7Q0FGQSxHQUdBLEVBQU0sSUFBTixFQUFBO0NBSEEsRUFJUyxHQUFULEVBQVMsSUFBVDtDQUNPLENBQStCLENBQUUsQ0FBeEMsQ0FBQSxDQUFNLEVBQU4sRUFBQSxTQUFBO1lBbEJzQjtDQUExQixRQUEwQjtDQXJCMUIsR0F3Q0UsQ0FBRixDQUFRLEVBQVI7UUE3Q0Y7Q0ErQ0EsRUFBbUIsQ0FBaEIsRUFBSCxHQUFtQixJQUFoQjtDQUNELEdBQUcsQ0FBUSxHQUFYO0NBQ0UsRUFBUyxHQUFULElBQUE7Q0FBQSxLQUNNLElBQU47Q0FEQSxLQUVNLElBQU4sQ0FBQSxLQUFBO0NBQ08sRUFBWSxFQUFKLENBQVQsT0FBUyxJQUFmO1VBTEo7UUFoRHVCO0NBQXpCLElBQXlCO0NBMUYzQixFQXlGbUI7O0NBekZuQixFQWlKcUIsTUFBQSxVQUFyQjtDQUNzQixFQUFwQixDQUFxQixPQUFyQixRQUFBO0NBbEpGLEVBaUpxQjs7Q0FqSnJCLEVBb0phLE1BQUMsRUFBZCxFQUFhO0NBQ1YsQ0FBbUIsQ0FBQSxDQUFWLENBQVUsQ0FBcEIsRUFBQSxDQUFxQixFQUFyQjtDQUFxQyxDQUFOLEdBQUssUUFBTCxDQUFBO0NBQS9CLElBQW9CO0NBckp0QixFQW9KYTs7Q0FwSmI7O0NBRHNCLE9BQVE7O0FBeUpoQyxDQXBNQSxFQW9NaUIsR0FBWCxDQUFOLEVBcE1BOzs7O0FDQUEsQ0FBTyxFQUVMLEdBRkksQ0FBTjtDQUVFLENBQUEsQ0FBTyxFQUFQLENBQU8sR0FBQyxJQUFEO0NBQ0wsT0FBQSxFQUFBO0FBQU8sQ0FBUCxHQUFBLEVBQU8sRUFBQTtDQUNMLEVBQVMsR0FBVCxJQUFTO01BRFg7Q0FBQSxDQUVhLENBQUEsQ0FBYixNQUFBLEdBQWE7Q0FDUixFQUFlLENBQWhCLENBQUosQ0FBVyxJQUFYLENBQUE7Q0FKRixFQUFPO0NBRlQsQ0FBQTs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQSxJQUFBLDZEQUFBO0dBQUE7a1NBQUE7O0FBQUEsQ0FBQSxFQUFZLElBQUEsRUFBWixFQUFZOztBQUNaLENBREEsRUFDWSxJQUFBLEVBQVosa0JBQVk7O0FBQ1osQ0FGQSxFQUVBLElBQU0sT0FBQTs7QUFDTixDQUFBLElBQUEsS0FBQTtvQkFBQTtDQUNFLENBQUEsQ0FBTyxFQUFQLENBQU87Q0FEVDs7QUFHTSxDQU5OO0NBT0U7Ozs7O0NBQUE7O0NBQUEsRUFBTSxDQUFOLFdBQUE7O0NBQUEsRUFDVyxNQUFYLEtBREE7O0NBQUEsRUFFVSxLQUFWLENBQW1CLFFBRm5COztDQUFBLENBRytCLENBQWpCLFNBQWQsRUFBYyxPQUFBOztDQUhkLEVBSVMsR0FKVCxDQUlBOztDQUpBLEVBTVEsR0FBUixHQUFRO0NBQ04sT0FBQSxnSUFBQTtDQUFBLEVBQWMsQ0FBZCxPQUFBLENBQWM7Q0FDZCxHQUFBLEVBQUEsS0FBYztDQUNaLENBRUUsQ0FGaUIsQ0FBQyxDQUFELENBQW5CLEdBQW1CLEdBQUEsRUFBQSxFQUFuQjtNQUZGO0NBQUEsRUFRbUIsQ0FBbkIsT0FBbUIsR0FBQSxFQUFuQjtDQUNBLEdBQUEsRUFBQSxVQUFtQjtDQUNqQixDQUVFLENBRm1CLENBQUMsQ0FBRCxDQUFyQixHQUFxQixLQUFBLElBQXJCO01BVkY7Q0FBQSxFQWdCVyxDQUFYLElBQUEsRUFBVyxDQUFBO0NBQ1gsR0FBQSxFQUFBLEVBQVc7Q0FDVCxDQUVFLENBRmUsQ0FBQyxDQUFELENBQWpCLEdBQWlCLENBQUEsSUFBakI7TUFsQkY7Q0FBQSxFQXdCZSxDQUFmLE9BQWUsQ0FBZixZQUFlO0NBQ2YsR0FBQSxFQUFBLE1BQWU7Q0FDYixDQUVFLENBRm1CLENBQUMsQ0FBRCxDQUFyQixHQUFxQixTQUFyQixHQUFxQixHQUFBO01BMUJ2QjtDQUFBLEVBaUNFLENBREYsR0FBQTtDQUNFLENBQVEsRUFBQyxDQUFLLENBQWQsS0FBUTtDQUFSLENBQ2EsRUFBQyxFQUFkLEtBQUE7Q0FEQSxDQUVZLEVBQUMsQ0FBSyxDQUFsQixJQUFBLEdBQVk7Q0FGWixDQUdPLEVBQUMsQ0FBUixDQUFBLENBQWU7Q0FIZixDQUlrQixJQUFsQixVQUFBO0NBSkEsQ0FLZ0IsSUFBaEIsS0FBMkIsR0FBM0I7Q0FMQSxDQU1hLENBQXFCLEdBQWxDLEtBQUE7Q0FOQSxDQU9ZLENBQXFCLEdBQWpDLElBQUEsQ0FBdUI7Q0FQdkIsQ0FRb0IsSUFBcEIsUUFSQSxJQVFBO0NBUkEsQ0FTYSxJQUFiLEVBQXFCLEdBQXJCO0NBVEEsQ0FVVSxDQUFrQixHQUE1QixFQUFBO0NBVkEsQ0FXZ0IsQ0FBa0IsR0FBbEMsRUFBd0IsTUFBeEI7Q0FYQSxDQVlvQixJQUFwQixZQUFBO0NBWkEsQ0FhaUIsSUFBakIsTUFBNkIsR0FBN0I7Q0FiQSxDQWNjLENBQXNCLEdBQXBDLE1BQUE7Q0FkQSxDQWVvQixDQUFzQixHQUExQyxNQUFnQyxNQUFoQztDQWZBLENBZ0J3QixJQUF4QixZQWhCQSxJQWdCQTtDQWhCQSxDQWlCcUIsSUFBckIsVUFBcUMsR0FBckM7Q0FqQkEsQ0FrQmtCLENBQTBCLEdBQTVDLFVBQUE7Q0FsQkEsQ0FtQndCLENBQTBCLEdBQWxELFVBQXdDLE1BQXhDO0NBcERGLEtBQUE7Q0FBQSxDQXNEb0MsQ0FBaEMsQ0FBSixFQUFVLENBQUEsQ0FBUyxDQUFUO0NBQ1QsRUFBRCxDQUFDLE9BQUQsUUFBQTtDQTlERixFQU1ROztDQU5SOztDQURpQzs7QUFrRW5DLENBeEVBLEVBd0VpQixHQUFYLENBQU4sYUF4RUE7Ozs7QUNBQSxJQUFBLHdEQUFBO0dBQUE7a1NBQUE7O0FBQUEsQ0FBQSxFQUFZLElBQUEsRUFBWixFQUFZOztBQUNaLENBREEsRUFDWSxJQUFBLEVBQVosa0JBQVk7O0FBQ1osQ0FGQSxFQUVBLElBQU0sT0FBQTs7QUFDTixDQUFBLElBQUEsS0FBQTtvQkFBQTtDQUNFLENBQUEsQ0FBTyxFQUFQLENBQU87Q0FEVDs7QUFJTSxDQVBOO0NBUUU7Ozs7O0NBQUE7O0NBQUEsRUFBTSxDQUFOLEtBQUE7O0NBQUEsRUFDVyxNQUFYOztDQURBLEVBRVUsS0FBVixDQUFtQixJQUZuQjs7Q0FBQSxDQUdpQyxDQUFuQixTQUFkLElBQWMsR0FBQTs7Q0FIZCxFQUlTLEdBSlQsQ0FJQTs7Q0FKQSxFQU1RLEdBQVIsR0FBUTtDQUNOLE9BQUEsMkhBQUE7Q0FBQSxFQUFjLENBQWQsT0FBQSxDQUFjO0NBQ2QsR0FBQSxFQUFBLEtBQWM7Q0FDWixDQUVFLENBRlUsQ0FBQyxFQUFiLENBQVksRUFBWixDQUFZLEVBQUEsSUFBQTtBQUtaLENBQUEsVUFBQSxxQ0FBQTs2QkFBQTtDQUNFLENBQUEsQ0FBaUIsQ0FBZCxHQUFBLENBQUgsRUFBRztDQUNELEVBQUcsQ0FBSCxLQUFBLENBQUE7VUFGSjtDQUFBLE1BTkY7TUFEQTtDQUFBLEVBV21CLENBQW5CLE9BQW1CLEdBQUEsRUFBbkI7Q0FDQSxHQUFBLEVBQUEsVUFBbUI7Q0FDakIsQ0FFRSxDQUZZLENBQUMsRUFBZixDQUFjLEVBQUEsQ0FBQSxDQUFkLEdBQWMsRUFBQTtNQWJoQjtDQUFBLEVBbUJXLENBQVgsSUFBQSxFQUFXLENBQUE7Q0FDWCxHQUFBLEVBQUEsRUFBVztDQUNULENBRUUsQ0FGWSxDQUFDLEVBQWYsQ0FBYyxFQUFBLENBQUEsQ0FBZCxRQUFjO01BckJoQjtDQUFBLEVBMkJlLENBQWYsT0FBZSxDQUFmLFlBQWU7Q0FDZixHQUFBLEVBQUEsTUFBZTtDQUNiLENBRUUsQ0FGZ0IsQ0FBQyxFQUFuQixDQUFrQixFQUFBLENBQUEsS0FBbEIsQ0FBa0IsUUFBQTtNQTdCcEI7Q0FBQSxFQW9DRSxDQURGLEdBQUE7Q0FDRSxDQUFRLEVBQUMsQ0FBSyxDQUFkLEtBQVE7Q0FBUixDQUNhLEVBQUMsRUFBZCxLQUFBO0NBREEsQ0FFWSxFQUFDLENBQUssQ0FBbEIsSUFBQSxHQUFZO0NBRlosQ0FHTyxFQUFDLENBQVIsQ0FBQSxDQUFlO0NBSGYsQ0FJZ0IsSUFBaEIsS0FBMkIsR0FBM0I7Q0FKQSxDQUthLENBQXFCLEdBQWxDLEtBQUE7Q0FMQSxDQU1rQixJQUFsQixHQU5BLE9BTUE7Q0FOQSxDQU9pQixDQUFxQixHQUF0QyxLQUE0QixJQUE1QjtDQVBBLENBUWdCLElBQWhCLFFBQUEsRUFBZ0M7Q0FSaEMsQ0FTa0IsQ0FBMEIsR0FBNUMsVUFBQTtDQVRBLENBVVksQ0FBMEIsR0FBdEMsSUFBQSxNQUE0QjtDQVY1QixDQVdvQixJQUFwQixLQVhBLE9BV0E7Q0FYQSxDQVlVLENBQWtCLEdBQTVCLEVBQUE7Q0FaQSxDQWFhLElBQWIsRUFBcUIsR0FBckI7Q0FiQSxDQWNhLElBQWIsS0FBQTtDQWRBLENBZWUsQ0FBa0IsR0FBakMsRUFBdUIsS0FBdkI7Q0FmQSxDQWdCYyxDQUFzQixHQUFwQyxNQUFBO0NBaEJBLENBaUJpQixJQUFqQixNQUE2QixHQUE3QjtDQWpCQSxDQWtCaUIsSUFBakIsU0FBQTtDQWxCQSxDQW1CbUIsQ0FBc0IsR0FBekMsTUFBK0IsS0FBL0I7Q0F2REYsS0FBQTtDQUFBLENBeURvQyxDQUFoQyxDQUFKLEVBQVUsQ0FBQSxDQUFTLENBQVQ7Q0FDVCxFQUFELENBQUMsT0FBRCxRQUFBO0NBakVGLEVBTVE7O0NBTlI7O0NBRDRCOztBQW9FOUIsQ0EzRUEsRUEyRWlCLEdBQVgsQ0FBTixRQTNFQTs7OztBQ0FBLElBQUEsMEZBQUE7R0FBQTtrU0FBQTs7QUFBQSxDQUFBLEVBQVksSUFBQSxFQUFaLEVBQVk7O0FBQ1osQ0FEQSxFQUNZLElBQUEsRUFBWixrQkFBWTs7QUFDWixDQUZBLEVBRVEsRUFBUixFQUFRLElBQUE7O0FBQ1IsQ0FIQSxFQUdhLEdBSGIsSUFHQTs7QUFDQSxDQUpBLEVBSVksSUFBQSxFQUFaLE1BQVk7O0FBQ1osQ0FMQSxDQUFBLENBS1csS0FBWDs7QUFDQSxDQUFBLElBQUEsV0FBQTt3QkFBQTtDQUNFLENBQUEsQ0FBWSxJQUFILENBQUEsK0JBQUE7Q0FEWDs7QUFHTSxDQVROO0NBVUU7Ozs7O0NBQUE7O0NBQUEsRUFBTSxDQUFOLE1BQUE7O0NBQUEsRUFDVyxNQUFYLENBREE7O0NBQUEsRUFFVSxLQUFWLENBQW1CLElBRm5COztDQUFBLEVBR2MsT0FBQSxFQUFkOztDQUhBLEVBSVMsR0FKVCxDQUlBOztDQUpBLEVBTVEsR0FBUixHQUFRO0NBQ04sT0FBQSxnRkFBQTtDQUFBLEVBQVcsQ0FBWCxJQUFBO0NBQ0E7Q0FBQSxRQUFBLG1DQUFBO3NCQUFBO0NBQ0UsQ0FBYyxFQUFGLENBQUEsQ0FBWixFQUFBLEVBQVk7Q0FEZCxJQURBO0NBQUEsRUFHVSxDQUFWLEdBQUEsQ0FBVSxFQUhWO0NBQUEsRUFLRSxDQURGLEdBQUE7Q0FDRSxDQUFRLEVBQUMsQ0FBSyxDQUFkLEtBQVE7Q0FBUixDQUNhLEVBQUMsRUFBZCxLQUFBO0NBREEsQ0FFWSxFQUFDLENBQUssQ0FBbEIsSUFBQSxHQUFZO0NBRlosQ0FHZSxDQUFnQyxDQUEvQixDQUFLLENBQXJCLE9BQUE7Q0FIQSxDQUlPLEVBQUMsQ0FBUixDQUFBLENBQWU7Q0FKZixDQUthLEVBQUMsRUFBZCxFQUFzQixHQUF0QjtDQUxBLENBTVUsR0FBQSxDQUFWLEVBQUE7Q0FOQSxDQU9TLEdBQUEsQ0FBVCxDQUFBLENBQVM7Q0FaWCxLQUFBO0NBQUEsQ0Fjb0MsQ0FBaEMsQ0FBSixFQUFVLENBQUEsQ0FBUztDQWRuQixFQWdCUSxDQUFSLENBQUE7Q0FoQkEsQ0FpQm1CLENBQW5CLENBQUEsQ0FBTSxDQUFOO0NBakJBLEVBa0JRLENBQVIsQ0FBQSxDQUFRLEVBQUE7QUFDUixDQUFBLFFBQUEscUNBQUE7d0JBQUE7Q0FDRSxDQUFxQixDQUFyQixDQUFJLENBQUosQ0FBQSxJQUFBO0NBREYsSUFuQkE7Q0FBQSxFQXFCa0IsQ0FBbEIsRUFBd0IsQ0FBTixRQUFsQixRQUFrQjtDQXJCbEIsRUFzQkEsQ0FBQSxDQUFXLFVBQUE7Q0F0QlgsQ0F1QkEsQ0FBK0IsQ0FBL0IsRUFBQSxTQUFBO0NBQ0MsRUFBRyxDQUFILEVBQUQsS0FBQTtDQS9CRixFQU1ROztDQU5SLEVBaUNRLEdBQVIsR0FBUTtDQUNOLElBQUEsR0FBQTs7Q0FBTSxJQUFGLENBQUo7TUFBQTtDQURNLFVBRU4sZ0NBQUE7Q0FuQ0YsRUFpQ1E7O0NBakNSOztDQUQ2Qjs7QUFzQy9CLENBL0NBLEVBK0NpQixHQUFYLENBQU4sU0EvQ0E7Ozs7QUNBQSxDQUFPLEVBQ0wsR0FESSxDQUFOO0NBQ0UsQ0FBQSxVQUFBLGNBQUE7Q0FBQSxDQUNBLFlBQUEsWUFEQTtDQUFBLENBRUEsUUFBQSxnQkFGQTtDQUFBLENBR0Esc0JBQUEsRUFIQTtDQURGLENBQUE7Ozs7Ozs7O0FDQUEsSUFBQSw4REFBQTs7QUFBQSxDQUFBLEVBQVksSUFBQSxFQUFaLGtCQUFZOztBQUNaLENBREEsRUFDbUIsSUFBQSxTQUFuQixXQUFtQjs7QUFDbkIsQ0FGQSxFQUVrQixJQUFBLFFBQWxCLFdBQWtCOztBQUNsQixDQUhBLEVBR3VCLElBQUEsYUFBdkIsV0FBdUI7O0FBRXZCLENBTEEsRUFLVSxHQUFKLEdBQXFCLEtBQTNCO0NBQ0UsQ0FBQSxFQUFBLEVBQU0sU0FBTSxDQUFBLElBQUE7Q0FFTCxLQUFELEdBQU4sRUFBQSxLQUFtQjtDQUhLOzs7Ozs7QUNMMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSAoZWwpIC0+XG4gICRlbCA9ICQgZWxcbiAgYXBwID0gd2luZG93LmFwcFxuICB0b2MgPSBhcHAuZ2V0VG9jKClcbiAgdW5sZXNzIHRvY1xuICAgIGNvbnNvbGUubG9nICdObyB0YWJsZSBvZiBjb250ZW50cyBmb3VuZCdcbiAgICByZXR1cm5cbiAgdG9nZ2xlcnMgPSAkZWwuZmluZCgnYVtkYXRhLXRvZ2dsZS1ub2RlXScpXG4gICMgU2V0IGluaXRpYWwgc3RhdGVcbiAgZm9yIHRvZ2dsZXIgaW4gdG9nZ2xlcnMudG9BcnJheSgpXG4gICAgJHRvZ2dsZXIgPSAkKHRvZ2dsZXIpXG4gICAgbm9kZWlkID0gJHRvZ2dsZXIuZGF0YSgndG9nZ2xlLW5vZGUnKVxuICAgIHRyeVxuICAgICAgdmlldyA9IHRvYy5nZXRDaGlsZFZpZXdCeUlkIG5vZGVpZFxuICAgICAgbm9kZSA9IHZpZXcubW9kZWxcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhbm9kZS5nZXQoJ3Zpc2libGUnKVxuICAgICAgJHRvZ2dsZXIuZGF0YSAndG9jSXRlbScsIHZpZXdcbiAgICBjYXRjaCBlXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLW5vdC1mb3VuZCcsICd0cnVlJ1xuXG4gIHRvZ2dsZXJzLm9uICdjbGljaycsIChlKSAtPlxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICRlbCA9ICQoZS50YXJnZXQpXG4gICAgdmlldyA9ICRlbC5kYXRhKCd0b2NJdGVtJylcbiAgICBpZiB2aWV3XG4gICAgICB2aWV3LnRvZ2dsZVZpc2liaWxpdHkoZSlcbiAgICAgICRlbC5hdHRyICdkYXRhLXZpc2libGUnLCAhIXZpZXcubW9kZWwuZ2V0KCd2aXNpYmxlJylcbiAgICBlbHNlXG4gICAgICBhbGVydCBcIkxheWVyIG5vdCBmb3VuZCBpbiB0aGUgY3VycmVudCBUYWJsZSBvZiBDb250ZW50cy4gXFxuRXhwZWN0ZWQgbm9kZWlkICN7JGVsLmRhdGEoJ3RvZ2dsZS1ub2RlJyl9XCJcbiIsImVuYWJsZUxheWVyVG9nZ2xlcnMgPSByZXF1aXJlICcuL2VuYWJsZUxheWVyVG9nZ2xlcnMuY29mZmVlJ1xucm91bmQgPSByZXF1aXJlKCcuL3V0aWxzLmNvZmZlZScpLnJvdW5kXG5cbmNsYXNzIFJlY29yZFNldFxuXG4gIGNvbnN0cnVjdG9yOiAoQGRhdGEpIC0+XG5cbiAgdG9BcnJheTogKCkgLT5cbiAgICBfLm1hcCBAZGF0YS52YWx1ZVswXS5mZWF0dXJlcywgKGZlYXR1cmUpIC0+XG4gICAgICBmZWF0dXJlLmF0dHJpYnV0ZXNcblxuICByYXc6IChhdHRyKSAtPlxuICAgIGF0dHJzID0gXy5tYXAgQHRvQXJyYXkoKSwgKHJvdykgLT5cbiAgICAgIHJvd1thdHRyXVxuICAgIGF0dHJzID0gXy5maWx0ZXIgYXR0cnMsIChhdHRyKSAtPiBhdHRyICE9IHVuZGVmaW5lZFxuICAgIGlmIGF0dHJzLmxlbmd0aCBpcyAwXG4gICAgICB0aHJvdyBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn1cIlxuICAgIGVsc2UgaWYgYXR0cnMubGVuZ3RoIGlzIDFcbiAgICAgIHJldHVybiBhdHRyc1swXVxuICAgIGVsc2VcbiAgICAgIHJldHVybiBhdHRyc1xuXG4gIGludDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsIHBhcnNlSW50XG4gICAgZWxzZVxuICAgICAgcGFyc2VJbnQocmF3KVxuXG4gIGZsb2F0OiAoYXR0ciwgZGVjaW1hbFBsYWNlcz0yKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiByb3VuZCh2YWwsIGRlY2ltYWxQbGFjZXMpXG4gICAgZWxzZVxuICAgICAgcm91bmQocmF3LCBkZWNpbWFsUGxhY2VzKVxuXG4gIGJvb2w6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiB2YWwudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuICAgIGVsc2VcbiAgICAgIHJhdy50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG5cbmNsYXNzIFJlcG9ydFRhYiBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgbmFtZTogJ0luZm9ybWF0aW9uJ1xuICBkZXBlbmRlbmNpZXM6IFtdXG5cbiAgaW5pdGlhbGl6ZTogKEBtb2RlbCwgQG9wdGlvbnMpIC0+XG4gICAgIyBXaWxsIGJlIGluaXRpYWxpemVkIGJ5IFNlYVNrZXRjaCB3aXRoIHRoZSBmb2xsb3dpbmcgYXJndW1lbnRzOlxuICAgICMgICAqIG1vZGVsIC0gVGhlIHNrZXRjaCBiZWluZyByZXBvcnRlZCBvblxuICAgICMgICAqIG9wdGlvbnNcbiAgICAjICAgICAtIC5wYXJlbnQgLSB0aGUgcGFyZW50IHJlcG9ydCB2aWV3IFxuICAgICMgICAgICAgIGNhbGwgQG9wdGlvbnMucGFyZW50LmRlc3Ryb3koKSB0byBjbG9zZSB0aGUgd2hvbGUgcmVwb3J0IHdpbmRvd1xuICAgIEBhcHAgPSB3aW5kb3cuYXBwXG4gICAgXy5leHRlbmQgQCwgQG9wdGlvbnNcblxuICByZW5kZXI6ICgpIC0+XG4gICAgdGhyb3cgJ3JlbmRlciBtZXRob2QgbXVzdCBiZSBvdmVyaWRkZW4nXG5cbiAgc2hvdzogKCkgLT5cbiAgICBAJGVsLnNob3coKVxuICAgIEB2aXNpYmxlID0gdHJ1ZVxuXG4gIGhpZGU6ICgpIC0+XG4gICAgQCRlbC5oaWRlKClcbiAgICBAdmlzaWJsZSA9IGZhbHNlXG5cbiAgcmVtb3ZlOiAoKSA9PlxuICAgIHN1cGVyKClcbiAgXG4gIG9uTG9hZGluZzogKCkgLT4gIyBleHRlbnNpb24gcG9pbnQgZm9yIHN1YmNsYXNzZXNcblxuICBnZXRSZXN1bHQ6IChpZCkgLT5cbiAgICByZXN1bHRzID0gQGdldFJlc3VsdHMoKVxuICAgIHJlc3VsdCA9IF8uZmluZCByZXN1bHRzLCAocikgLT4gci5wYXJhbU5hbWUgaXMgaWRcbiAgICB1bmxlc3MgcmVzdWx0P1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyByZXN1bHQgd2l0aCBpZCAnICsgaWQpXG4gICAgcmVzdWx0LnZhbHVlXG5cbiAgZ2V0Rmlyc3RSZXN1bHQ6IChwYXJhbSwgaWQpIC0+XG4gICAgcmVzdWx0ID0gQGdldFJlc3VsdChwYXJhbSlcbiAgICB0cnlcbiAgICAgIHJldHVybiByZXN1bHRbMF0uZmVhdHVyZXNbMF0uYXR0cmlidXRlc1tpZF1cbiAgICBjYXRjaCBlXG4gICAgICB0aHJvdyBcIkVycm9yIGZpbmRpbmcgI3twYXJhbX06I3tpZH0gaW4gZ3AgcmVzdWx0c1wiXG5cbiAgZ2V0UmVzdWx0czogKCkgLT5cbiAgICB1bmxlc3MgcmVzdWx0cyA9IEByZXN1bHRzPy5nZXQoJ2RhdGEnKT8ucmVzdWx0c1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBncCByZXN1bHRzJylcbiAgICBfLmZpbHRlciByZXN1bHRzLCAocmVzdWx0KSAtPlxuICAgICAgcmVzdWx0LnBhcmFtTmFtZSBub3QgaW4gWydSZXN1bHRDb2RlJywgJ1Jlc3VsdE1zZyddXG5cbiAgcmVjb3JkU2V0OiAoZGVwZW5kZW5jeSwgcGFyYW1OYW1lLCBza2V0Y2hDbGFzc0lkKSAtPlxuICAgIHVubGVzcyBkZXBlbmRlbmN5IGluIEBkZXBlbmRlbmNpZXNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIlVua25vd24gZGVwZW5kZW5jeSAje2RlcGVuZGVuY3l9XCJcbiAgICBpZiBza2V0Y2hDbGFzc0lkXG4gICAgICBkZXAgPSBfLmZpbmQgQGFsbFJlc3VsdHMsIChyZXN1bHQpIC0+IFxuICAgICAgICByZXN1bHQuZ2V0KCduYW1lJykgaXMgZGVwZW5kZW5jeSBhbmQgXG4gICAgICAgICAgcmVzdWx0LmdldCgnc2tldGNoQ2xhc3MnKSBpcyBza2V0Y2hDbGFzc0lkXG4gICAgZWxzZVxuICAgICAgZGVwID0gXy5maW5kIEBhbGxSZXN1bHRzLCAocmVzdWx0KSAtPiByZXN1bHQuZ2V0KCduYW1lJykgaXMgZGVwZW5kZW5jeVxuICAgIHVubGVzcyBkZXBcbiAgICAgIGNvbnNvbGUubG9nIEBhbGxSZXN1bHRzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCByZXN1bHRzIGZvciAje2RlcGVuZGVuY3l9LlwiXG4gICAgcGFyYW0gPSBfLmZpbmQgZGVwLmdldCgnZGF0YScpLnJlc3VsdHMsIChwYXJhbSkgLT4gXG4gICAgICBwYXJhbS5wYXJhbU5hbWUgaXMgcGFyYW1OYW1lXG4gICAgdW5sZXNzIHBhcmFtXG4gICAgICBjb25zb2xlLmxvZyBkZXAuZ2V0KCdkYXRhJykucmVzdWx0c1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcGFyYW0gI3twYXJhbU5hbWV9IGluICN7ZGVwZW5kZW5jeX1cIlxuICAgIHJzID0gbmV3IFJlY29yZFNldChwYXJhbSlcbiAgICBycy5za2V0Y2hDbGFzcyA9IGRlcC5nZXQoJ3NrZXRjaENsYXNzJylcbiAgICByc1xuXG4gIHJlY29yZFNldHM6IChkZXBlbmRlbmN5LCBwYXJhbU5hbWUpIC0+XG4gICAgdW5sZXNzIGRlcGVuZGVuY3kgaW4gQGRlcGVuZGVuY2llc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVW5rbm93biBkZXBlbmRlbmN5ICN7ZGVwZW5kZW5jeX1cIlxuICAgIGRlcHMgPSBfLmZpbHRlciBAYWxsUmVzdWx0cywgKHJlc3VsdCkgLT4gcmVzdWx0LmdldCgnbmFtZScpIGlzIGRlcGVuZGVuY3lcbiAgICB1bmxlc3MgZGVwcy5sZW5ndGhcbiAgICAgIGNvbnNvbGUubG9nIEBhbGxSZXN1bHRzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCByZXN1bHRzIGZvciAje2RlcGVuZGVuY3l9LlwiXG4gICAgcGFyYW1zID0gW11cbiAgICBmb3IgZGVwIGluIGRlcHNcbiAgICAgIHBhcmFtID0gXy5maW5kIGRlcC5nZXQoJ2RhdGEnKS5yZXN1bHRzLCAocGFyYW0pIC0+IFxuICAgICAgICBwYXJhbS5wYXJhbU5hbWUgaXMgcGFyYW1OYW1lXG4gICAgICB1bmxlc3MgcGFyYW1cbiAgICAgICAgY29uc29sZS5sb2cgZGVwLmdldCgnZGF0YScpLnJlc3VsdHNcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcGFyYW0gI3twYXJhbU5hbWV9IGluICN7ZGVwZW5kZW5jeX1cIlxuICAgICAgcnMgPSBuZXcgUmVjb3JkU2V0KHBhcmFtKVxuICAgICAgcnMuc2tldGNoQ2xhc3MgPSBkZXAuZ2V0KCdza2V0Y2hDbGFzcycpXG4gICAgICBwYXJhbXMucHVzaCByc1xuICAgIHJldHVybiBwYXJhbXNcblxuXG4gIGVuYWJsZVRhYmxlUGFnaW5nOiAoKSAtPlxuICAgIEAkKCdbZGF0YS1wYWdpbmddJykuZWFjaCAoKSAtPlxuICAgICAgJHRhYmxlID0gJChAKVxuICAgICAgcGFnZVNpemUgPSAkdGFibGUuZGF0YSgncGFnaW5nJylcbiAgICAgIHJvd3MgPSAkdGFibGUuZmluZCgndGJvZHkgdHInKS5sZW5ndGhcbiAgICAgIHBhZ2VzID0gTWF0aC5jZWlsKHJvd3MgLyBwYWdlU2l6ZSlcbiAgICAgIGlmIHBhZ2VzID4gMVxuICAgICAgICAkdGFibGUuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDx0Zm9vdD5cbiAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgPHRkIGNvbHNwYW49XCIjeyR0YWJsZS5maW5kKCd0aGVhZCB0aCcpLmxlbmd0aH1cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGFnaW5hdGlvblwiPlxuICAgICAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5QcmV2PC9hPjwvbGk+XG4gICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICA8L3Rmb290PlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgdWwgPSAkdGFibGUuZmluZCgndGZvb3QgdWwnKVxuICAgICAgICBmb3IgaSBpbiBfLnJhbmdlKDEsIHBhZ2VzICsgMSlcbiAgICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj4je2l9PC9hPjwvbGk+XG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5OZXh0PC9hPjwvbGk+XG4gICAgICAgIFwiXCJcIlxuICAgICAgICAkdGFibGUuZmluZCgnbGkgYScpLmNsaWNrIChlKSAtPlxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICRhID0gJCh0aGlzKVxuICAgICAgICAgIHRleHQgPSAkYS50ZXh0KClcbiAgICAgICAgICBpZiB0ZXh0IGlzICdOZXh0J1xuICAgICAgICAgICAgYSA9ICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5uZXh0KCkuZmluZCgnYScpXG4gICAgICAgICAgICB1bmxlc3MgYS50ZXh0KCkgaXMgJ05leHQnXG4gICAgICAgICAgICAgIGEuY2xpY2soKVxuICAgICAgICAgIGVsc2UgaWYgdGV4dCBpcyAnUHJldidcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykucHJldigpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdQcmV2J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykucmVtb3ZlQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgICAgICAgICRhLnBhcmVudCgpLmFkZENsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICBuID0gcGFyc2VJbnQodGV4dClcbiAgICAgICAgICAgICR0YWJsZS5maW5kKCd0Ym9keSB0cicpLmhpZGUoKVxuICAgICAgICAgICAgb2Zmc2V0ID0gcGFnZVNpemUgKiAobiAtIDEpXG4gICAgICAgICAgICAkdGFibGUuZmluZChcInRib2R5IHRyXCIpLnNsaWNlKG9mZnNldCwgbipwYWdlU2l6ZSkuc2hvdygpXG4gICAgICAgICQoJHRhYmxlLmZpbmQoJ2xpIGEnKVsxXSkuY2xpY2soKVxuICAgICAgXG4gICAgICBpZiBub1Jvd3NNZXNzYWdlID0gJHRhYmxlLmRhdGEoJ25vLXJvd3MnKVxuICAgICAgICBpZiByb3dzIGlzIDBcbiAgICAgICAgICBwYXJlbnQgPSAkdGFibGUucGFyZW50KCkgICAgXG4gICAgICAgICAgJHRhYmxlLnJlbW92ZSgpXG4gICAgICAgICAgcGFyZW50LnJlbW92ZUNsYXNzICd0YWJsZUNvbnRhaW5lcidcbiAgICAgICAgICBwYXJlbnQuYXBwZW5kIFwiPHA+I3tub1Jvd3NNZXNzYWdlfTwvcD5cIlxuXG4gIGVuYWJsZUxheWVyVG9nZ2xlcnM6ICgpIC0+XG4gICAgZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG4gIGdldENoaWxkcmVuOiAoc2tldGNoQ2xhc3NJZCkgLT5cbiAgICBfLmZpbHRlciBAY2hpbGRyZW4sIChjaGlsZCkgLT4gY2hpbGQuZ2V0U2tldGNoQ2xhc3MoKS5pZCBpcyBza2V0Y2hDbGFzc0lkXG5cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRUYWIiLCJtb2R1bGUuZXhwb3J0cyA9XG4gIFxuICByb3VuZDogKG51bWJlciwgZGVjaW1hbFBsYWNlcykgLT5cbiAgICB1bmxlc3MgXy5pc051bWJlciBudW1iZXJcbiAgICAgIG51bWJlciA9IHBhcnNlRmxvYXQobnVtYmVyKVxuICAgIG11bHRpcGxpZXIgPSBNYXRoLnBvdyAxMCwgZGVjaW1hbFBsYWNlc1xuICAgIE1hdGgucm91bmQobnVtYmVyICogbXVsdGlwbGllcikgLyBtdWx0aXBsaWVyIiwidGhpc1tcIlRlbXBsYXRlc1wiXSA9IHRoaXNbXCJUZW1wbGF0ZXNcIl0gfHwge307XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjx0ciBkYXRhLWF0dHJpYnV0ZS1pZD1cXFwiXCIpO18uYihfLnYoXy5mKFwiaWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiIGRhdGEtYXR0cmlidXRlLWV4cG9ydGlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJleHBvcnRpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtdHlwZT1cXFwiXCIpO18uYihfLnYoXy5mKFwidHlwZVwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcIm5hbWVcXFwiPlwiKTtfLmIoXy52KF8uZihcIm5hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRkIGNsYXNzPVxcXCJ2YWx1ZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiZm9ybWF0dGVkVmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvdHI+XCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2F0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjx0YWJsZSBjbGFzcz1cXFwiYXR0cmlidXRlc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsNDQsODEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCIsYyxwLFwiICAgIFwiKSk7fSk7Yy5wb3AoKTt9Xy5iKFwiPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2dlbmVyaWNBdHRyaWJ1dGVzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgQXR0cmlidXRlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiLGMscCxcIiAgICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJUZW1wbGF0ZXNcIl07IiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbmlkcyA9IHJlcXVpcmUgJy4vaWRzLmNvZmZlZSdcbmZvciBrZXksIHZhbHVlIG9mIGlkc1xuICB3aW5kb3dba2V5XSA9IHZhbHVlXG5cbmNsYXNzIEFycmF5RmlzaGluZ1ZhbHVlVGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdGaXNoaW5nIFZhbHVlJ1xuICBjbGFzc05hbWU6ICdmaXNoaW5nVmFsdWUnXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMuYXJyYXlGaXNoaW5nVmFsdWVcbiAgZGVwZW5kZW5jaWVzOiBbJ0Zpc2hpbmdWYWx1ZScsICdGaXNoaW5nUHJpb3JpdHlBcmVhJ11cbiAgdGltZW91dDogMjQwMDAwXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIHNhbmN0dWFyaWVzID0gQGdldENoaWxkcmVuIFNBTkNUVUFSWV9JRFxuICAgIGlmIHNhbmN0dWFyaWVzLmxlbmd0aFxuICAgICAgc2FuY3R1YXJ5UGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdGaXNoaW5nVmFsdWUnLCBcbiAgICAgICAgJ0Zpc2hpbmdWYWx1ZScsIFxuICAgICAgICBTQU5DVFVBUllfSURcbiAgICAgICkuZmxvYXQoJ1BFUkNFTlQnLCAwKVxuXG4gICAgYXF1YWN1bHR1cmVBcmVhcyA9IEBnZXRDaGlsZHJlbiBBUVVBQ1VMVFVSRV9JRFxuICAgIGlmIGFxdWFjdWx0dXJlQXJlYXMubGVuZ3RoXG4gICAgICBhcXVhY3VsdHVyZVBlcmNlbnQgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRmlzaGluZ1ZhbHVlJywgXG4gICAgICAgICdGaXNoaW5nVmFsdWUnLCBcbiAgICAgICAgQVFVQUNVTFRVUkVfSURcbiAgICAgICkuZmxvYXQoJ1BFUkNFTlQnLCAwKVxuXG4gICAgbW9vcmluZ3MgPSBAZ2V0Q2hpbGRyZW4gTU9PUklOR19JRFxuICAgIGlmIG1vb3JpbmdzLmxlbmd0aFxuICAgICAgbW9vcmluZ1BlcmNlbnQgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRmlzaGluZ1ZhbHVlJywgXG4gICAgICAgICdGaXNoaW5nVmFsdWUnLCBcbiAgICAgICAgTU9PUklOR19JRFxuICAgICAgKS5mbG9hdCgnUEVSQ0VOVCcsIDIpXG5cbiAgICBmaXNoaW5nQXJlYXMgPSBAZ2V0Q2hpbGRyZW4gRklTSElOR19QUklPUklUWV9BUkVBX0lEXG4gICAgaWYgZmlzaGluZ0FyZWFzLmxlbmd0aFxuICAgICAgZmlzaGluZ0FyZWFQZXJjZW50ID0gQHJlY29yZFNldChcbiAgICAgICAgJ0Zpc2hpbmdQcmlvcml0eUFyZWEnLCBcbiAgICAgICAgJ0Zpc2hpbmdQcmlvcml0eUFyZWEnLCBcbiAgICAgICAgRklTSElOR19QUklPUklUWV9BUkVBX0lEXG4gICAgICApLmZsb2F0KCdQRVJDRU5UJywgMClcblxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgc2FuY3R1YXJ5UGVyY2VudDogc2FuY3R1YXJ5UGVyY2VudFxuICAgICAgbnVtU2FuY3R1YXJpZXM6IHNhbmN0dWFyaWVzLmxlbmd0aFxuICAgICAgc2FuY3R1YXJpZXM6IHNhbmN0dWFyaWVzLmxlbmd0aCA+IDBcbiAgICAgIHNhbmNQbHVyYWw6IHNhbmN0dWFyaWVzLmxlbmd0aCA+IDFcbiAgICAgIG1vb3JpbmdBcmVhUGVyY2VudDogbW9vcmluZ1BlcmNlbnRcbiAgICAgIG51bU1vb3JpbmdzOiBtb29yaW5ncy5sZW5ndGhcbiAgICAgIG1vb3JpbmdzOiBtb29yaW5ncy5sZW5ndGggPiAwXG4gICAgICBtb29yaW5nc1BsdXJhbDogbW9vcmluZ3MubGVuZ3RoID4gMVxuICAgICAgZmlzaGluZ0FyZWFQZXJjZW50OiBmaXNoaW5nQXJlYVBlcmNlbnRcbiAgICAgIG51bUZpc2hpbmdBcmVhczogZmlzaGluZ0FyZWFzLmxlbmd0aFxuICAgICAgZmlzaGluZ0FyZWFzOiBmaXNoaW5nQXJlYXMubGVuZ3RoID4gMFxuICAgICAgZmlzaGluZ0FyZWFzUGx1cmFsOiBmaXNoaW5nQXJlYXMubGVuZ3RoID4gMVxuICAgICAgYXF1YWN1bHR1cmVBcmVhUGVyY2VudDogYXF1YWN1bHR1cmVQZXJjZW50XG4gICAgICBudW1BcXVhY3VsdHVyZUFyZWFzOiBhcXVhY3VsdHVyZUFyZWFzLmxlbmd0aFxuICAgICAgYXF1YWN1bHR1cmVBcmVhczogYXF1YWN1bHR1cmVBcmVhcy5sZW5ndGggPiAwXG4gICAgICBhcXVhY3VsdHVyZUFyZWFzUGx1cmFsOiBhcXVhY3VsdHVyZUFyZWFzLmxlbmd0aCA+IDFcblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG5cbm1vZHVsZS5leHBvcnRzID0gQXJyYXlGaXNoaW5nVmFsdWVUYWIiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuaWRzID0gcmVxdWlyZSAnLi9pZHMuY29mZmVlJ1xuZm9yIGtleSwgdmFsdWUgb2YgaWRzXG4gIHdpbmRvd1trZXldID0gdmFsdWVcblxuXG5jbGFzcyBBcnJheUhhYml0YXRUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ0hhYml0YXQnXG4gIGNsYXNzTmFtZTogJ2hhYml0YXQnXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMuYXJyYXlIYWJpdGF0c1xuICBkZXBlbmRlbmNpZXM6IFsnQmFyYnVkYUhhYml0YXQnLCAnSGFiaXRhdHNJbk1vb3JpbmcnXVxuICB0aW1lb3V0OiAyNDAwMDBcbiAgXG4gIHJlbmRlcjogKCkgLT5cbiAgICBzYW5jdHVhcmllcyA9IEBnZXRDaGlsZHJlbiBTQU5DVFVBUllfSURcbiAgICBpZiBzYW5jdHVhcmllcy5sZW5ndGhcbiAgICAgIHNhbmN0dWFyeSA9IEByZWNvcmRTZXQoXG4gICAgICAgICdCYXJidWRhSGFiaXRhdCcsIFxuICAgICAgICAnSGFiaXRhdHMnLCBcbiAgICAgICAgU0FOQ1RVQVJZX0lEXG4gICAgICApLnRvQXJyYXkoKVxuICAgICAgZm9yIHJvdyBpbiBzYW5jdHVhcnlcbiAgICAgICAgaWYgcGFyc2VGbG9hdChyb3cuUGVyY2VudCkgPj0gMzNcbiAgICAgICAgICByb3cubWVldHNHb2FsID0gdHJ1ZVxuXG4gICAgYXF1YWN1bHR1cmVBcmVhcyA9IEBnZXRDaGlsZHJlbiBBUVVBQ1VMVFVSRV9JRFxuICAgIGlmIGFxdWFjdWx0dXJlQXJlYXMubGVuZ3RoXG4gICAgICBhcXVhY3VsdHVyZSA9IEByZWNvcmRTZXQoXG4gICAgICAgICdCYXJidWRhSGFiaXRhdCcsIFxuICAgICAgICAnSGFiaXRhdHMnLCBcbiAgICAgICAgQVFVQUNVTFRVUkVfSURcbiAgICAgICkudG9BcnJheSgpXG5cbiAgICBtb29yaW5ncyA9IEBnZXRDaGlsZHJlbiBNT09SSU5HX0lEXG4gICAgaWYgbW9vcmluZ3MubGVuZ3RoXG4gICAgICBtb29yaW5nRGF0YSA9IEByZWNvcmRTZXQoXG4gICAgICAgICdIYWJpdGF0c0luTW9vcmluZycsIFxuICAgICAgICAnSGFiaXRhdHNJbk1vb3JpbmcnLCBcbiAgICAgICAgTU9PUklOR19JRFxuICAgICAgKS50b0FycmF5KClcblxuICAgIGZpc2hpbmdBcmVhcyA9IEBnZXRDaGlsZHJlbiBGSVNISU5HX1BSSU9SSVRZX0FSRUFfSURcbiAgICBpZiBmaXNoaW5nQXJlYXMubGVuZ3RoXG4gICAgICBmaXNoaW5nQXJlYURhdGEgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnQmFyYnVkYUhhYml0YXQnLCBcbiAgICAgICAgJ0hhYml0YXRzJywgXG4gICAgICAgIEZJU0hJTkdfUFJJT1JJVFlfQVJFQV9JRFxuICAgICAgKS50b0FycmF5KClcblxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgbnVtU2FuY3R1YXJpZXM6IHNhbmN0dWFyaWVzLmxlbmd0aFxuICAgICAgc2FuY3R1YXJpZXM6IHNhbmN0dWFyaWVzLmxlbmd0aCA+IDBcbiAgICAgIHNhbmN0dWFyeUhhYml0YXQ6IHNhbmN0dWFyeVxuICAgICAgc2FuY3R1YXJ5UGx1cmFsOiBzYW5jdHVhcmllcy5sZW5ndGggPiAxXG4gICAgICBudW1BcXVhY3VsdHVyZTogYXF1YWN1bHR1cmVBcmVhcy5sZW5ndGhcbiAgICAgIGFxdWFjdWx0dXJlQXJlYXM6IGFxdWFjdWx0dXJlQXJlYXMubGVuZ3RoID4gMFxuICAgICAgYXF1YVBsdXJhbDogYXF1YWN1bHR1cmVBcmVhcy5sZW5ndGggPiAxXG4gICAgICBhcXVhY3VsdHVyZUhhYml0YXQ6IGFxdWFjdWx0dXJlXG4gICAgICBtb29yaW5nczogbW9vcmluZ3MubGVuZ3RoID4gMFxuICAgICAgbnVtTW9vcmluZ3M6IG1vb3JpbmdzLmxlbmd0aFxuICAgICAgbW9vcmluZ0RhdGE6IG1vb3JpbmdEYXRhXG4gICAgICBtb29yaW5nUGx1cmFsOiBtb29yaW5ncy5sZW5ndGggPiAxXG4gICAgICBmaXNoaW5nQXJlYXM6IGZpc2hpbmdBcmVhcy5sZW5ndGggPiAwXG4gICAgICBudW1GaXNoaW5nQXJlYXM6IGZpc2hpbmdBcmVhcy5sZW5ndGhcbiAgICAgIGZpc2hpbmdBcmVhRGF0YTogZmlzaGluZ0FyZWFEYXRhXG4gICAgICBmaXNoaW5nQXJlYVBsdXJhbDogZmlzaGluZ0FyZWFzLmxlbmd0aCA+IDFcbiAgICBcbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCB0ZW1wbGF0ZXMpXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcblxubW9kdWxlLmV4cG9ydHMgPSBBcnJheUhhYml0YXRUYWIiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xucm91bmQgPSByZXF1aXJlKCdhcGkvdXRpbHMnKS5yb3VuZFxuVE9UQUxfQVJFQSA9IDE3NS45NSAjIHNxIG1pbGVzXG5fcGFydGlhbHMgPSByZXF1aXJlICdhcGkvdGVtcGxhdGVzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcblxuY2xhc3MgQXJyYXlPdmVydmlld1RhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnT3ZlcnZpZXcnXG4gIGNsYXNzTmFtZTogJ292ZXJ2aWV3J1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFycmF5T3ZlcnZpZXdcbiAgZGVwZW5kZW5jaWVzOiBbJ0RpYW1ldGVyJ11cbiAgdGltZW91dDogMTIwMDAwXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIFNRX01JTEVTID0gMFxuICAgIGZvciBycyBpbiBAcmVjb3JkU2V0cyAnRGlhbWV0ZXInLCAnRGlhbWV0ZXInXG4gICAgICBTUV9NSUxFUyArPSBycy5mbG9hdCgnU1FfTUlMRVMnKVxuICAgIFBFUkNFTlQgPSBTUV9NSUxFUyAvIFRPVEFMX0FSRUFcbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYW55QXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKS5sZW5ndGggPiAwXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgbnVtU2tldGNoZXM6IEBjaGlsZHJlbi5sZW5ndGhcbiAgICAgIFNRX01JTEVTOiByb3VuZChTUV9NSUxFUywgMilcbiAgICAgIFBFUkNFTlQ6IHJvdW5kKFNRX01JTEVTLCAwKVxuICAgIFxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuXG4gICAgbm9kZXMgPSBbQG1vZGVsXVxuICAgIEBtb2RlbC5zZXQgJ29wZW4nLCB0cnVlXG4gICAgbm9kZXMgPSBub2Rlcy5jb25jYXQgQGNoaWxkcmVuXG4gICAgZm9yIG5vZGUgaW4gbm9kZXNcbiAgICAgIG5vZGUuc2V0ICdzZWxlY3RlZCcsIGZhbHNlXG4gICAgVGFibGVPZkNvbnRlbnRzID0gd2luZG93LnJlcXVpcmUoJ3ZpZXdzL3RhYmxlT2ZDb250ZW50cycpXG4gICAgQHRvYyA9IG5ldyBUYWJsZU9mQ29udGVudHMobm9kZXMpXG4gICAgQCQoJy50b2NDb250YWluZXInKS5hcHBlbmQgQHRvYy5lbFxuICAgIEB0b2MucmVuZGVyKClcblxuICByZW1vdmU6ICgpIC0+XG4gICAgQHRvYz8ucmVtb3ZlKClcbiAgICBzdXBlcigpXG5cbm1vZHVsZS5leHBvcnRzID0gQXJyYXlPdmVydmlld1RhYiIsIm1vZHVsZS5leHBvcnRzID0gXG4gIFNBTkNUVUFSWV9JRDogJzUxZmFlYmVmOGZhYTMwOWI3YzA1ZGUwMidcbiAgQVFVQUNVTFRVUkVfSUQ6ICc1MjBiYjFjMDBiZDIyYzliMjE0N2I5OWInXG4gIE1PT1JJTkdfSUQ6ICc1MjBkM2RjNDY3NDY1OWNiN2IzNDgwZjUnXG4gIEZJU0hJTkdfUFJJT1JJVFlfQVJFQV9JRDogJzUyMGJiMWQwMGJkMjJjOWIyMTQ3YjlkMCdcbiIsInRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5BcnJheU92ZXJ2aWV3VGFiID0gcmVxdWlyZSAnLi9hcnJheU92ZXJ2aWV3VGFiLmNvZmZlZSdcbkFycmF5SGFiaXRhdFRhYiA9IHJlcXVpcmUgJy4vYXJyYXlIYWJpdGF0VGFiLmNvZmZlZSdcbkFycmF5RmlzaGluZ1ZhbHVlVGFiID0gcmVxdWlyZSAnLi9hcnJheUZpc2hpbmdWYWx1ZVRhYi5jb2ZmZWUnXG5cbndpbmRvdy5hcHAucmVnaXN0ZXJSZXBvcnQgKHJlcG9ydCkgLT5cbiAgcmVwb3J0LnRhYnMgW0FycmF5T3ZlcnZpZXdUYWIsIEFycmF5SGFiaXRhdFRhYiwgQXJyYXlGaXNoaW5nVmFsdWVUYWJdXG4gICMgcGF0aCBtdXN0IGJlIHJlbGF0aXZlIHRvIGRpc3QvXG4gIHJlcG9ydC5zdHlsZXNoZWV0cyBbJy4vcHJvcG9zYWwuY3NzJ10iLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFxdWFjdWx0dXJlRmlzaGluZ1ZhbHVlXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkZpc2hpbmcgVmFsdWU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyBhcXVhY3VsdHVyZSBhcmVhIGRpc3BsYWNlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBvZiB0aGUgZmlzaGluZyB2YWx1ZSB3aXRoaW4gQmFyYnVkYeKAmXMgd2F0ZXJzLCBiYXNlZCBvbiB1c2VyIHJlcG9ydGVkXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIHZhbHVlcyBvZiBmaXNoaW5nIGdyb3VuZHMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MjQxZWE3ZGUwZmJhMTFmM2QwMTAwMTFcXFwiPnNob3cgZmlzaGluZyB2YWx1ZXMgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFycmF5RmlzaGluZ1ZhbHVlXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRpc3BsYWNlZCBGaXNoaW5nIFZhbHVlPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInNhbmN0dWFyaWVzXCIsYyxwLDEpLGMscCwwLDEwMywzODksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe2lmKF8ucyhfLmYoXCJhcXVhY3VsdHVyZUFyZWFzXCIsYyxwLDEpLGMscCwwLDEyOSwzNjMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICBUaGlzIHByb3Bvc2FsIGluY2x1ZGVzIGJvdGggU2FuY3R1YXJ5IGFuZCBBcXVhY3VsdHVyZSBhcmVhcywgZGlzcGxhY2luZ1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNhbmN0dWFyeVBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IGFuZCA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImFxdWFjdWx0dXJlQXJlYVBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBvZiBmaXNoaW5nIHZhbHVlIHdpdGhpbiBCYXJidWRhJ3Mgd2F0ZXJzLCByZXNwZWN0aXZlbHkuXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO319KTtjLnBvcCgpO31pZihfLnMoXy5mKFwic2FuY3R1YXJpZXNcIixjLHAsMSksYyxwLDAsNDI2LDc2NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7aWYoIV8ucyhfLmYoXCJhcXVhY3VsdHVyZUFyZWFzXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgIFRoaXMgcHJvcG9zYWwgaW5jbHVkZXMgXCIpO18uYihfLnYoXy5mKFwibnVtU2FuY3R1YXJpZXNcIixjLHAsMCkpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcIik7aWYoXy5zKF8uZihcInNhbmNQbHVyYWxcIixjLHAsMSksYyxwLDAsNTE4LDUyOSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiU2FuY3R1YXJpZXNcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJzYW5jUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiU2FuY3R1YXJ5XCIpO307Xy5iKFwiLFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBkaXNwbGFjaW5nIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2FuY3R1YXJ5UGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgZmlzaGluZyB2YWx1ZSB3aXRoaW4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEJhcmJ1ZGEncyB3YXRlcnMgYmFzZWQgb24gdXNlciByZXBvcnRlZCB2YWx1ZXMgb2YgZmlzaGluZyBncm91bmRzXCIpO18uYihcIlxcblwiKTt9O30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwic2FuY3R1YXJpZXNcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtpZihfLnMoXy5mKFwiYXF1YWN1bHR1cmVBcmVhc1wiLGMscCwxKSxjLHAsMCw4MjcsMTExNSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIFRoaXMgcHJvcG9zYWwgaW5jbHVkZXMgXCIpO18uYihfLnYoXy5mKFwibnVtQXF1YWN1bHR1cmVBcmVhc1wiLGMscCwwKSkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEFxdWFjdWx0dXJlIEFyZWFcIik7aWYoXy5zKF8uZihcImFxdWFjdWx0dXJlQXJlYXNQbHVyYWxcIixjLHAsMSksYyxwLDAsOTI2LDkyNyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCIsXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGRpc3BsYWNpbmcgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJhcXVhY3VsdHVyZUFyZWFQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBmaXNoaW5nIHZhbHVlIHdpdGhpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQmFyYnVkYSdzIHdhdGVycyBiYXNlZCBvbiB1c2VyIHJlcG9ydGVkIHZhbHVlcyBvZiBmaXNoaW5nIGdyb3VuZHNcIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fX07aWYoXy5zKF8uZihcIm1vb3JpbmdzXCIsYyxwLDEpLGMscCwwLDExNzUsMTQ4NyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIFwiKTtfLmIoXy52KF8uZihcIm51bU1vb3JpbmdzXCIsYyxwLDApKSk7Xy5iKFwiIE1vb3JpbmcgQXJlYVwiKTtpZihfLnMoXy5mKFwibW9vcmluZ3NQbHVyYWxcIixjLHAsMSksYyxwLDAsMTIyNywxMjMyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzIGFyZVwiKTt9KTtjLnBvcCgpO31fLmIoXCIgXCIpO2lmKCFfLnMoXy5mKFwibW9vcmluZ3NQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJpc1wiKTt9O18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGFsc28gaW5jbHVkZWQsIHdoaWNoIGNvdmVyXCIpO2lmKCFfLnMoXy5mKFwibW9vcmluZ3NQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzXCIpO307Xy5iKFwiIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibW9vcmluZ0FyZWFQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgcmVnaW9uYWwgZmlzaGluZyB2YWx1ZS4gTW9vcmluZyBhcmVhcyBtYXkgZGlzcGxhY2UgZmlzaGluZyBhY3Rpdml0aWVzLlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MjQxZWE3ZGUwZmJhMTFmM2QwMTAwMTFcXFwiPnNob3cgZmlzaGluZyB2YWx1ZXMgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiZmlzaGluZ0FyZWFzXCIsYyxwLDEpLGMscCwwLDE2MjEsMTk5MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UHJpb3JpdHkgRmlzaGluZyBBcmVhczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIHByb3Bvc2FsIGluY2x1ZGVzIFwiKTtfLmIoXy52KF8uZihcIm51bUZpc2hpbmdBcmVhc1wiLGMscCwwKSkpO18uYihcIiBGaXNoaW5nIFByaW9yaXR5IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBBcmVhXCIpO2lmKF8ucyhfLmYoXCJmaXNoaW5nQXJlYVB1cmFsXCIsYyxwLDEpLGMscCwwLDE3OTgsMTc5OSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCIsIHJlcHJlc2VudGluZ1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImZpc2hpbmdBcmVhUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgdGhlIGZpc2hpbmcgdmFsdWUgd2l0aGluIEJhcmJ1ZGEncyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgd2F0ZXJzIGJhc2VkIG9uIHVzZXIgcmVwb3J0ZWQgdmFsdWVzIG9mIGZpc2hpbmcgZ3JvdW5kc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJhcnJheUhhYml0YXRzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmYoXCJzYW5jdHVhcmllc1wiLGMscCwxKSxjLHAsMCwxNiw5MTksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXRzIHdpdGhpbiBcIik7Xy5iKF8udihfLmYoXCJudW1TYW5jdHVhcmllc1wiLGMscCwwKSkpO18uYihcIiBcIik7aWYoIV8ucyhfLmYoXCJzYW5jdHVhcnlQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJTYW5jdHVhcnlcIik7fTtpZihfLnMoXy5mKFwic2FuY3R1YXJ5UGx1cmFsXCIsYyxwLDEpLGMscCwwLDE3MCwxODEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIlNhbmN0dWFyaWVzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UGVyY2VudCBvZiBUb3RhbCBIYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5NZWV0cyAzMyUgZ29hbDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJzYW5jdHVhcnlIYWJpdGF0XCIsYyxwLDEpLGMscCwwLDQwMyw2MTYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0ciBjbGFzcz1cXFwiXCIpO2lmKF8ucyhfLmYoXCJtZWV0c0dvYWxcIixjLHAsMSksYyxwLDAsNDM1LDQ0MixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwibWV0R29hbFwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhhYlR5cGVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIgJTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO2lmKF8ucyhfLmYoXCJtZWV0c0dvYWxcIixjLHAsMSksYyxwLDAsNTQ1LDU0OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwieWVzXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwibWVldHNHb2FsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwibm9cIik7fTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgUGVyY2VudGFnZXMgc2hvd24gcmVwcmVzZW50IHRoZSBwcm9wb3J0aW9uIG9mIGhhYml0YXRzIGF2YWlsYWJsZSBpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQmFyYnVkYSdzIGVudGlyZSAzIG5hdXRpY2FsIG1pbGUgYm91bmRhcnkgY2FwdHVyZWQgd2l0aGluIHNhbmN0dWFyaWVzLiA8YnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjU1NDVjMDhkYzRmNWYyZDIxNjE0NlxcXCI+c2hvdyBoYWJpdGF0cyBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImFxdWFjdWx0dXJlQXJlYXNcIixjLHAsMSksYyxwLDAsOTU4LDE1ODgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXRzIHdpdGhpbiBcIik7Xy5iKF8udihfLmYoXCJudW1BcXVhY3VsdHVyZVwiLGMscCwwKSkpO18uYihcIiBBcXVhY3VsdHVyZSBBcmVhXCIpO2lmKF8ucyhfLmYoXCJhcXVhUGx1cmFsXCIsYyxwLDEpLGMscCwwLDEwNzQsMTA3NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlBlcmNlbnQgb2YgVG90YWwgSGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhcXVhY3VsdHVyZUhhYml0YXRcIixjLHAsMSksYyxwLDAsMTI2MiwxMzUyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSGFiVHlwZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiAlPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwhLS0gICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgUGVyY2VudGFnZXMgc2hvd24gcmVwcmVzZW50IHRoZSBwcm9wb3J0aW9uIG9mIGhhYml0YXRzIGF2YWlsYWJsZSBpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQmFyYnVkYSdzIGVudGlyZSAzIG5hdXRpY2FsIG1pbGUgYm91bmRhcnkgY2FwdHVyZWQgd2l0aGluIGFxdWFjdWx0dXJlIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBhcmVhcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtb29yaW5nc1wiLGMscCwxKSxjLHAsMCwxNjI0LDIyMzUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXRzIHdpdGhpbiBcIik7Xy5iKF8udihfLmYoXCJudW1Nb29yaW5nc1wiLGMscCwwKSkpO18uYihcIiBNb29yaW5nIEFyZWFcIik7aWYoXy5zKF8uZihcIm1vb3JpbmdQbHVyYWxcIixjLHAsMSksYyxwLDAsMTczNiwxNzM3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UGVyY2VudCBvZiBUb3RhbCBIYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm1vb3JpbmdEYXRhXCIsYyxwLDEpLGMscCwwLDE5MjAsMjAxMCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhhYlR5cGVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIgJTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8IS0tICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFBlcmNlbnRhZ2VzIHNob3duIHJlcHJlc2VudCB0aGUgcHJvcG9ydGlvbiBvZiBoYWJpdGF0cyBhdmFpbGFibGUgaW4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEJhcmJ1ZGEncyBlbnRpcmUgMyBuYXV0aWNhbCBtaWxlIGJvdW5kYXJ5IGNhcHR1cmVkIHdpdGhpbiBtb29yaW5nIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBhcmVhcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJmaXNoaW5nQXJlYXNcIixjLHAsMSksYyxwLDAsMjI2NywyOTE2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5IYWJpdGF0cyB3aXRoaW4gXCIpO18uYihfLnYoXy5mKFwibnVtRmlzaGluZ0FyZWFzXCIsYyxwLDApKSk7Xy5iKFwiIEZpc2hpbmcgUHJpb3JpdHkgQXJlYVwiKTtpZihfLnMoXy5mKFwiZmlzaGluZ0FyZWFQbHVyYWxcIixjLHAsMSksYyxwLDAsMjM5NiwyMzk3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UGVyY2VudCBvZiBUb3RhbCBIYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImZpc2hpbmdBcmVhRGF0YVwiLGMscCwxKSxjLHAsMCwyNTg4LDI2NzgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIYWJUeXBlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiICU8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBQZXJjZW50YWdlcyBzaG93biByZXByZXNlbnQgdGhlIHByb3BvcnRpb24gb2YgaGFiaXRhdHMgYXZhaWxhYmxlIGluIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBCYXJidWRhJ3MgZW50aXJlIDMgbmF1dGljYWwgbWlsZSBib3VuZGFyeSBjYXB0dXJlZCB3aXRoaW4gZmlzaGluZyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgcHJpb3JpdHkgYXJlYXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJhcnJheU92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBzaXplXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TaXplPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgY29sbGVjdGlvbiBvZiBcIik7Xy5iKF8udihfLmYoXCJudW1Ta2V0Y2hlc1wiLGMscCwwKSkpO18uYihcIiB6b25lcyBoYXMgYSB0b3RhbCBhcmVhIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiU1FfTUlMRVNcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIlBFUkNFTlRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIEJhcmJ1ZGEncyB3YXRlcnMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5ab25lcyBpbiB0aGlzIFByb3Bvc2FsPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInRvY0NvbnRhaW5lclxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYW55QXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCw2ODUsODA5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5cIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIEF0dHJpYnV0ZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIixjLHAsXCIgIFwiKSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJkZW1vXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlJlcG9ydCBTZWN0aW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5Vc2UgcmVwb3J0IHNlY3Rpb25zIHRvIGdyb3VwIGluZm9ybWF0aW9uIGludG8gbWVhbmluZ2Z1bCBjYXRlZ29yaWVzPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RDMgVmlzdWFsaXphdGlvbnM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHVsIGNsYXNzPVxcXCJuYXYgbmF2LXBpbGxzXFxcIiBpZD1cXFwidGFiczJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8bGkgY2xhc3M9XFxcImFjdGl2ZVxcXCI+PGEgaHJlZj1cXFwiI2NoYXJ0XFxcIj5DaGFydDwvYT48L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8bGk+PGEgaHJlZj1cXFwiI2RhdGFUYWJsZVxcXCI+VGFibGU8L2E+PC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdWw+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJ0YWItY29udGVudFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcInRhYi1wYW5lIGFjdGl2ZVxcXCIgaWQ9XFxcImNoYXJ0XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8IS0tW2lmIElFIDhdPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwIGNsYXNzPVxcXCJ1bnN1cHBvcnRlZFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgVGhpcyB2aXN1YWxpemF0aW9uIGlzIG5vdCBjb21wYXRpYmxlIHdpdGggSW50ZXJuZXQgRXhwbG9yZXIgOC4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgUGxlYXNlIHVwZ3JhZGUgeW91ciBicm93c2VyLCBvciB2aWV3IHJlc3VsdHMgaW4gdGhlIHRhYmxlIHRhYi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+ICAgICAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPCFbZW5kaWZdLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBTZWUgPGNvZGU+c3JjL3NjcmlwdHMvZGVtby5jb2ZmZWU8L2NvZGU+IGZvciBhbiBleGFtcGxlIG9mIGhvdyB0byBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIHVzZSBkMy5qcyB0byByZW5kZXIgdmlzdWFsaXphdGlvbnMuIFByb3ZpZGUgYSB0YWJsZS1iYXNlZCB2aWV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBhbmQgdXNlIGNvbmRpdGlvbmFsIGNvbW1lbnRzIHRvIHByb3ZpZGUgYSBmYWxsYmFjayBmb3IgSUU4IHVzZXJzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGJyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGEgaHJlZj1cXFwiaHR0cDovL3R3aXR0ZXIuZ2l0aHViLmlvL2Jvb3RzdHJhcC8yLjMuMi9cXFwiPkJvb3RzdHJhcCAyLng8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBpcyBsb2FkZWQgd2l0aGluIFNlYVNrZXRjaCBzbyB5b3UgY2FuIHVzZSBpdCB0byBjcmVhdGUgdGFicyBhbmQgb3RoZXIgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBpbnRlcmZhY2UgY29tcG9uZW50cy4galF1ZXJ5IGFuZCB1bmRlcnNjb3JlIGFyZSBhbHNvIGF2YWlsYWJsZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJ0YWItcGFuZVxcXCIgaWQ9XFxcImRhdGFUYWJsZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPmluZGV4PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+dmFsdWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiY2hhcnREYXRhXCIsYyxwLDEpLGMscCwwLDEzNTEsMTQxOCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj48dGQ+XCIpO18uYihfLnYoXy5mKFwiaW5kZXhcIixjLHAsMCkpKTtfLmIoXCI8L3RkPjx0ZD5cIik7Xy5iKF8udihfLmYoXCJ2YWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+PC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBlbXBoYXNpc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RW1waGFzaXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+R2l2ZSByZXBvcnQgc2VjdGlvbnMgYW4gPGNvZGU+ZW1waGFzaXM8L2NvZGU+IGNsYXNzIHRvIGhpZ2hsaWdodCBpbXBvcnRhbnQgaW5mb3JtYXRpb24uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB3YXJuaW5nXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5XYXJuaW5nPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPk9yIDxjb2RlPndhcm48L2NvZGU+IG9mIHBvdGVudGlhbCBwcm9ibGVtcy48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIGRhbmdlclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RGFuZ2VyPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPjxjb2RlPmRhbmdlcjwvY29kZT4gY2FuIGFsc28gYmUgdXNlZC4uLiBzcGFyaW5nbHkuPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImZpc2hpbmdQcmlvcml0eUFyZWFcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RmlzaGluZyBWYWx1ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIGZpc2hpbmcgcHJpb3JpdHkgYXJlYSBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIHRoZSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgZmlzaGluZyB2YWx1ZSB3aXRoaW4gQmFyYnVkYSdzIHdhdGVycywgYmFzZWQgb24gdXNlciByZXBvcnRlZCB2YWx1ZXMgb2YgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGZpc2hpbmcgZ3JvdW5kc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTI0MWVhN2RlMGZiYTExZjNkMDEwMDExXFxcIj5zaG93IGZpc2hpbmcgdmFsdWVzIGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJmaXNoaW5nVmFsdWVcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RmlzaGluZyBWYWx1ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIFwiKTtfLmIoXy52KF8uZihcImFyZWFMYWJlbFwiLGMscCwwKSkpO18uYihcIiBkaXNwbGFjZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJwZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgb2YgdGhlIGZpc2hpbmcgdmFsdWUgd2l0aGluIEJhcmJ1ZGHigJlzIHdhdGVycywgYmFzZWQgb24gdXNlciByZXBvcnRlZFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICB2YWx1ZXMgb2YgZmlzaGluZyBncm91bmRzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTI0MWVhN2RlMGZiYTExZjNkMDEwMDExXFxcIj5zaG93IGZpc2hpbmcgdmFsdWVzIGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJoYWJpdGF0XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZihcImhlYWRpbmdcIixjLHAsMCkpKTtfLmIoXCI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPiUgb2YgVG90YWwgSGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYWJpdGF0c1wiLGMscCwxKSxjLHAsMCwyMTYsMjc5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+PHRkPlwiKTtfLmIoXy52KF8uZihcIkhhYlR5cGVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPjx0ZD5cIik7Xy5iKF8udihfLmYoXCJQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFBlcmNlbnRhZ2VzIHNob3duIHJlcHJlc2VudCB0aGUgcHJvcG9ydGlvbiBvZiBoYWJpdGF0cyBhdmFpbGFibGUgaW4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEJhcmJ1ZGEncyBlbnRpcmUgMyBuYXV0aWNhbCBtaWxlIGJvdW5kYXJ5IGNhcHR1cmVkIHdpdGhpbiB0aGlzIHpvbmUuIDxicj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmNTU0NWMwOGRjNGY1ZjJkMjE2MTQ2XFxcIj5zaG93IGhhYml0YXRzIGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJvdmVydmlld1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gc2l6ZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+U2l6ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIGFyZWEgaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJTUV9NSUxFU1wiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwicmVuZGVyTWluaW11bVdpZHRoXCIsYyxwLDEpLGMscCwwLDQ2NCwxMTA2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIGRpYW1ldGVyIFwiKTtpZighXy5zKF8uZihcIkRJQU1fT0tcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJ3YXJuaW5nXCIpO307Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5NaW5pbXVtIFdpZHRoPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBtaW5pbXVtIHdpZHRoIG9mIGEgem9uZSBzaWduaWZpY2FudGx5IGltcGFjdHMgIGl0cyBjb25zZXJ2YXRpb24gdmFsdWUuIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgcmVjb21tZW5kZWQgc21hbGxlc3QgZGlhbWV0ZXIgaXMgYmV0d2VlbiAyIGFuZCAzIG1pbGVzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKCFfLnMoXy5mKFwiRElBTV9PS1wiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICBUaGlzIGRlc2lnbiBmYWxscyBvdXRzaWRlIHRoZSByZWNvbW1lbmRhdGlvbiBhdCBcIik7Xy5iKF8udihfLmYoXCJESUFNXCIsYyxwLDApKSk7Xy5iKFwiIG1pbGVzLlwiKTtfLmIoXCJcXG5cIik7fTtpZihfLnMoXy5mKFwiRElBTV9PS1wiLGMscCwxKSxjLHAsMCw4NTQsOTI1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgVGhpcyBkZXNpZ24gZml0cyB3aXRoaW4gdGhlIHJlY29tbWVuZGF0aW9uIGF0IFwiKTtfLmIoXy52KF8uZihcIkRJQU1cIixjLHAsMCkpKTtfLmIoXCIgbWlsZXMuXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC9zdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJ2aXpcXFwiIHN0eWxlPVxcXCJwb3NpdGlvbjpyZWxhdGl2ZTtcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGltZyBzcmM9XFxcImh0dHA6Ly9zMy5hbWF6b25hd3MuY29tL1NlYVNrZXRjaC9wcm9qZWN0cy9iYXJidWRhL21pbl93aWR0aF9leGFtcGxlLnBuZ1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhbnlBdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDExNDksMTI3MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fXJldHVybiBfLmZsKCk7O30pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJUZW1wbGF0ZXNcIl07Il19
;