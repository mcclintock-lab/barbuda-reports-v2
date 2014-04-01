require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
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


},{}],3:[function(require,module,exports){
var JobItem,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

JobItem = (function(_super) {
  __extends(JobItem, _super);

  JobItem.prototype.className = 'reportResult';

  JobItem.prototype.events = {};

  JobItem.prototype.bindings = {
    "h6 a": {
      observe: "serviceName",
      updateView: true,
      attributes: [
        {
          name: 'href',
          observe: 'serviceUrl'
        }
      ]
    },
    ".startedAt": {
      observe: ["startedAt", "status"],
      visible: function() {
        var _ref;
        return (_ref = this.model.get('status')) !== 'complete' && _ref !== 'error';
      },
      updateView: true,
      onGet: function() {
        if (this.model.get('startedAt')) {
          return "Started " + moment(this.model.get('startedAt')).fromNow() + ". ";
        } else {
          return "";
        }
      }
    },
    ".status": {
      observe: "status",
      onGet: function(s) {
        switch (s) {
          case 'pending':
            return "waiting in line";
          case 'running':
            return "running analytical service";
          case 'complete':
            return "completed";
          case 'error':
            return "an error occurred";
          default:
            return s;
        }
      }
    },
    ".queueLength": {
      observe: "queueLength",
      onGet: function(v) {
        var s;
        s = "Waiting behind " + v + " job";
        if (v.length > 1) {
          s += 's';
        }
        return s + ". ";
      },
      visible: function(v) {
        return (v != null) && parseInt(v) > 0;
      }
    },
    ".errors": {
      observe: 'error',
      updateView: true,
      visible: function(v) {
        return (v != null ? v.length : void 0) > 2;
      },
      onGet: function(v) {
        if (v != null) {
          return JSON.stringify(v, null, '  ');
        } else {
          return null;
        }
      }
    }
  };

  function JobItem(model) {
    this.model = model;
    JobItem.__super__.constructor.call(this);
  }

  JobItem.prototype.render = function() {
    this.$el.html("<h6><a href=\"#\" target=\"_blank\"></a><span class=\"status\"></span></h6>\n<div>\n  <span class=\"startedAt\"></span>\n  <span class=\"queueLength\"></span>\n  <pre class=\"errors\"></pre>\n</div>");
    return this.stickit();
  };

  return JobItem;

})(Backbone.View);

module.exports = JobItem;


},{}],4:[function(require,module,exports){
var ReportResults,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportResults = (function(_super) {
  __extends(ReportResults, _super);

  ReportResults.prototype.defaultPollingInterval = 3000;

  function ReportResults(sketch, deps) {
    var url;
    this.sketch = sketch;
    this.deps = deps;
    this.poll = __bind(this.poll, this);
    this.url = url = "/reports/" + this.sketch.id + "/" + (this.deps.join(','));
    ReportResults.__super__.constructor.call(this);
  }

  ReportResults.prototype.poll = function() {
    var _this = this;
    return this.fetch({
      success: function() {
        var problem, result, _i, _len, _ref, _ref1;
        _this.trigger('jobs');
        _ref = _this.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          result = _ref[_i];
          if ((_ref1 = result.get('status')) !== 'complete' && _ref1 !== 'error') {
            if (!_this.interval) {
              _this.interval = setInterval(_this.poll, _this.defaultPollingInterval);
            }
            return;
          }
        }
        if (_this.interval) {
          window.clearInterval(_this.interval);
        }
        if (problem = _.find(_this.models, function(r) {
          return r.get('error') != null;
        })) {
          return _this.trigger('error', "Problem with " + (problem.get('serviceName')) + " job");
        } else {
          return _this.trigger('finished');
        }
      },
      error: function(e, res, a, b) {
        var json, _ref, _ref1;
        if (res.status !== 0) {
          if ((_ref = res.responseText) != null ? _ref.length : void 0) {
            try {
              json = JSON.parse(res.responseText);
            } catch (_error) {

            }
          }
          if (_this.interval) {
            window.clearInterval(_this.interval);
          }
          return _this.trigger('error', (json != null ? (_ref1 = json.error) != null ? _ref1.message : void 0 : void 0) || 'Problem contacting the SeaSketch server');
        }
      }
    });
  };

  return ReportResults;

})(Backbone.Collection);

module.exports = ReportResults;


},{}],"perKyw":[function(require,module,exports){
var CollectionView, JobItem, RecordSet, ReportResults, ReportTab, enableLayerTogglers, round, t, templates, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

enableLayerTogglers = require('./enableLayerTogglers.coffee');

round = require('./utils.coffee').round;

ReportResults = require('./reportResults.coffee');

t = require('../templates/templates.js');

templates = {
  reportLoading: t['node_modules/seasketch-reporting-api/reportLoading']
};

JobItem = require('./jobItem.coffee');

CollectionView = require('views/collectionView');

RecordSet = (function() {
  function RecordSet(data, tab, sketchClassId) {
    this.data = data;
    this.tab = tab;
    this.sketchClassId = sketchClassId;
  }

  RecordSet.prototype.toArray = function() {
    var data,
      _this = this;
    if (this.sketchClassId) {
      data = _.find(this.data.value, function(v) {
        var _ref, _ref1, _ref2;
        return ((_ref = v.features) != null ? (_ref1 = _ref[0]) != null ? (_ref2 = _ref1.attributes) != null ? _ref2['SC_ID'] : void 0 : void 0 : void 0) === _this.sketchClassId;
      });
      if (!data) {
        throw "Could not find data for sketchClass " + this.sketchClassId;
      }
    } else {
      data = this.data.value[0];
    }
    return _.map(data.features, function(feature) {
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
      console.log(this.data);
      this.tab.reportError("Could not get attribute " + attr + " from results");
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
    this.renderJobDetails = __bind(this.renderJobDetails, this);
    this.startEtaCountdown = __bind(this.startEtaCountdown, this);
    this.reportJobs = __bind(this.reportJobs, this);
    this.showError = __bind(this.showError, this);
    this.reportError = __bind(this.reportError, this);
    this.reportRequested = __bind(this.reportRequested, this);
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
    _.extend(this, this.options);
    this.reportResults = new ReportResults(this.model, this.dependencies);
    this.listenToOnce(this.reportResults, 'error', this.reportError);
    this.listenToOnce(this.reportResults, 'jobs', this.renderJobDetails);
    this.listenToOnce(this.reportResults, 'jobs', this.reportJobs);
    this.listenTo(this.reportResults, 'finished', _.bind(this.render, this));
    return this.listenToOnce(this.reportResults, 'request', this.reportRequested);
  };

  ReportTab.prototype.render = function() {
    throw 'render method must be overidden';
  };

  ReportTab.prototype.show = function() {
    var _ref1, _ref2;
    this.$el.show();
    this.visible = true;
    if (((_ref1 = this.dependencies) != null ? _ref1.length : void 0) && !this.reportResults.models.length) {
      return this.reportResults.poll();
    } else if (!((_ref2 = this.dependencies) != null ? _ref2.length : void 0)) {
      return this.render();
    }
  };

  ReportTab.prototype.hide = function() {
    this.$el.hide();
    return this.visible = false;
  };

  ReportTab.prototype.remove = function() {
    window.clearInterval(this.etaInterval);
    this.stopListening();
    return ReportTab.__super__.remove.call(this);
  };

  ReportTab.prototype.reportRequested = function() {
    return this.$el.html(templates.reportLoading.render({}));
  };

  ReportTab.prototype.reportError = function(msg, cancelledRequest) {
    if (!cancelledRequest) {
      if (msg === 'JOB_ERROR') {
        return this.showError('Error with specific job');
      } else {
        return this.showError(msg);
      }
    }
  };

  ReportTab.prototype.showError = function(msg) {
    this.$('.progress').remove();
    this.$('p.error').remove();
    return this.$('h4').text("An Error Occurred").after("<p class=\"error\" style=\"text-align:center;\">" + msg + "</p>");
  };

  ReportTab.prototype.reportJobs = function() {
    if (!this.maxEta) {
      this.$('.progress .bar').width('100%');
    }
    return this.$('h4').text("Analyzing Designs");
  };

  ReportTab.prototype.startEtaCountdown = function() {
    var left, total,
      _this = this;
    if (this.maxEta) {
      total = (new Date(this.maxEta).getTime() - new Date(this.etaStart).getTime()) / 1000;
      left = (new Date(this.maxEta).getTime() - new Date().getTime()) / 1000;
      _.delay(function() {
        return _this.reportResults.poll();
      }, (left + 1) * 1000);
      return _.delay(function() {
        _this.$('.progress .bar').css('transition-timing-function', 'linear');
        _this.$('.progress .bar').css('transition-duration', "" + (left + 1) + "s");
        return _this.$('.progress .bar').width('100%');
      }, 500);
    }
  };

  ReportTab.prototype.renderJobDetails = function() {
    var item, job, maxEta, _i, _j, _len, _len1, _ref1, _ref2, _results,
      _this = this;
    maxEta = null;
    _ref1 = this.reportResults.models;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      job = _ref1[_i];
      if (job.get('eta')) {
        if (!maxEta || job.get('eta') > maxEta) {
          maxEta = job.get('eta');
        }
      }
    }
    if (maxEta) {
      this.maxEta = maxEta;
      this.$('.progress .bar').width('5%');
      this.etaStart = new Date();
      this.startEtaCountdown();
    }
    this.$('[rel=details]').css('display', 'block');
    this.$('[rel=details]').click(function(e) {
      e.preventDefault();
      _this.$('[rel=details]').hide();
      return _this.$('.details').show();
    });
    _ref2 = this.reportResults.models;
    _results = [];
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      job = _ref2[_j];
      item = new JobItem(job);
      item.render();
      _results.push(this.$('.details').append(item.el));
    }
    return _results;
  };

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
    var results;
    results = this.reportResults.map(function(result) {
      return result.get('result').results;
    });
    if (!(results != null ? results.length : void 0)) {
      throw new Error('No gp results');
    }
    return _.filter(results, function(result) {
      var _ref1;
      return (_ref1 = result.paramName) !== 'ResultCode' && _ref1 !== 'ResultMsg';
    });
  };

  ReportTab.prototype.recordSet = function(dependency, paramName, sketchClassId) {
    var dep, param;
    if (sketchClassId == null) {
      sketchClassId = false;
    }
    if (__indexOf.call(this.dependencies, dependency) < 0) {
      throw new Error("Unknown dependency " + dependency);
    }
    dep = this.reportResults.find(function(r) {
      return r.get('serviceName') === dependency;
    });
    if (!dep) {
      console.log(this.reportResults.models);
      throw new Error("Could not find results for " + dependency + ".");
    }
    param = _.find(dep.get('result').results, function(param) {
      return param.paramName === paramName;
    });
    if (!param) {
      console.log(dep.get('data').results);
      throw new Error("Could not find param " + paramName + " in " + dependency);
    }
    return new RecordSet(param, this, sketchClassId);
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


},{"../templates/templates.js":"fIqoFw","./enableLayerTogglers.coffee":2,"./jobItem.coffee":3,"./reportResults.coffee":4,"./utils.coffee":"d+CDld","views/collectionView":1}],"d+CDld":[function(require,module,exports){
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

this["Templates"]["node_modules/seasketch-reporting-api/reportLoading"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportLoading\">");_.b("\n" + i);_.b("  <!-- <div class=\"spinner\">3</div> -->");_.b("\n" + i);_.b("  <h4>Requesting Report from Server</h4>");_.b("\n" + i);_.b("  <div class=\"progress progress-striped active\">");_.b("\n" + i);_.b("    <div class=\"bar\" style=\"width: 100%;\"></div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <a href=\"#\" rel=\"details\">details</a>");_.b("\n" + i);_.b("    <div class=\"details\">");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

module.exports = this["Templates"];
},{}],8:[function(require,module,exports){
var FishingValueTab, HabitatTab, OverviewTab;

OverviewTab = require('./overviewTab.coffee');

HabitatTab = require('./habitatTab.coffee');

FishingValueTab = require('./fishingValue.coffee');

window.app.registerReport(function(report) {
  report.tabs([OverviewTab, HabitatTab, FishingValueTab]);
  return report.stylesheets(['./fishSanctuary.css']);
});


},{"./fishingValue.coffee":9,"./habitatTab.coffee":10,"./overviewTab.coffee":15}],9:[function(require,module,exports){
var FishingValueTab, ReportTab, templates, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

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

  FishingValueTab.prototype.timeout = 120000;

  FishingValueTab.prototype.areaLabel = 'protected area';

  FishingValueTab.prototype.render = function() {
    var context;
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      percent: this.recordSet('FishingValue', 'FishingValue').float('PERCENT', 2),
      areaLabel: this.areaLabel
    };
    this.$el.html(this.template.render(context, templates));
    return this.enableLayerTogglers(this.$el);
  };

  return FishingValueTab;

})(ReportTab);

module.exports = FishingValueTab;


},{"../templates/templates.js":16,"reportTab":"perKyw"}],10:[function(require,module,exports){
var HabitatTab, ReportTab, templates, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

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

  HabitatTab.prototype.dependencies = ['BarbudaHabitat'];

  HabitatTab.prototype.paramName = 'Habitats';

  HabitatTab.prototype.timeout = 120000;

  HabitatTab.prototype.heading = "Habitat Representation";

  HabitatTab.prototype.render = function() {
    var context, data, depName;
    depName = this.dependencies[0];
    data = this.recordSet(depName, this.paramName).toArray();
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      habitats: data,
      heading: this.heading
    };
    this.$el.html(this.template.render(context, templates));
    return this.enableLayerTogglers(this.$el);
  };

  return HabitatTab;

})(ReportTab);

module.exports = HabitatTab;


},{"../templates/templates.js":16,"reportTab":"perKyw"}],11:[function(require,module,exports){
module.exports = {
  SANCTUARY_ID: '51faebef8faa309b7c05de02',
  AQUACULTURE_ID: '520bb1c00bd22c9b2147b99b',
  MOORING_ID: '520d3dc4674659cb7b3480f5',
  FISHING_PRIORITY_AREA_ID: '520bb1d00bd22c9b2147b9d0',
  NO_NET_ZONES_ID: '524c5bc22fbd726117000034'
};


},{}],"api/utils":[function(require,module,exports){
module.exports=require('d+CDld');
},{}],"reportTab":[function(require,module,exports){
module.exports=require('perKyw');
},{}],"api/templates":[function(require,module,exports){
module.exports=require('fIqoFw');
},{}],15:[function(require,module,exports){
var OverviewTab, RECOMMENDED_DIAMETER, ReportTab, TOTAL_AREA, ids, key, partials, round, templates, val, value, _partials, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

_partials = require('../node_modules/seasketch-reporting-api/templates/templates.js');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

round = require('api/utils').round;

ids = require('./ids.coffee');

for (key in ids) {
  value = ids[key];
  window[key] = value;
}

TOTAL_AREA = 175.95;

RECOMMENDED_DIAMETER = {
  min: 2,
  max: 3
};

OverviewTab = (function(_super) {
  __extends(OverviewTab, _super);

  function OverviewTab() {
    _ref = OverviewTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  OverviewTab.prototype.name = 'Size';

  OverviewTab.prototype.className = 'overview';

  OverviewTab.prototype.template = templates.overview;

  OverviewTab.prototype.dependencies = ['Diameter'];

  OverviewTab.prototype.timeout = 60000;

  OverviewTab.prototype.render = function() {
    var DIAM_OK, MIN_DIAM, PERCENT, SQ_MILES, context, isNoNetZone, renderMinimumWidth, skid, _ref1;
    MIN_DIAM = this.recordSet('Diameter', 'Diameter').float('MIN_DIAM');
    SQ_MILES = this.recordSet('Diameter', 'Diameter').float('SQ_MILES');
    PERCENT = (SQ_MILES / TOTAL_AREA) * 100.0;
    if (MIN_DIAM > RECOMMENDED_DIAMETER.min) {
      DIAM_OK = true;
    }
    skid = this.model.getAttribute('SC_ID');
    isNoNetZone = this.sketchClass.id === NO_NET_ZONES_ID;
    renderMinimumWidth = !isNoNetZone;
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      anyAttributes: this.model.getAttributes().length > 0,
      admin: this.project.isAdmin(window.user),
      description: this.model.getAttribute('DESCRIPTION'),
      hasDescription: ((_ref1 = this.model.getAttribute('DESCRIPTION')) != null ? _ref1.length : void 0) > 0,
      DIAM_OK: DIAM_OK,
      SQ_MILES: SQ_MILES,
      DIAM: MIN_DIAM,
      MIN_DIAM: RECOMMENDED_DIAMETER.min,
      renderMinimumWidth: renderMinimumWidth,
      PERCENT: round(PERCENT, 0),
      isNoNetZone: isNoNetZone
    };
    this.$el.html(this.template.render(context, partials));
    if (renderMinimumWidth) {
      this.enableLayerTogglers(this.$el);
      return this.drawViz(MIN_DIAM);
    }
  };

  OverviewTab.prototype.drawViz = function(diam) {
    var chart, el, maxScale, ranges, x;
    if (window.d3) {
      el = this.$('.viz')[0];
      maxScale = d3.max([RECOMMENDED_DIAMETER.max * 1.2, diam * 1.2]);
      ranges = [
        {
          name: 'Below recommended',
          start: 0,
          end: RECOMMENDED_DIAMETER.min,
          bg: "#8e5e50",
          "class": 'below'
        }, {
          name: 'Recommended',
          start: RECOMMENDED_DIAMETER.min,
          end: RECOMMENDED_DIAMETER.max,
          bg: '#588e3f',
          "class": 'recommended'
        }, {
          name: 'Above recommended',
          start: RECOMMENDED_DIAMETER.max,
          end: maxScale,
          "class": 'above'
        }
      ];
      x = d3.scale.linear().domain([0, maxScale]).range([0, 400]);
      chart = d3.select(el);
      chart.selectAll("div.range").data(ranges).enter().append("div").style("width", function(d) {
        return x(d.end - d.start) + 'px';
      }).attr("class", function(d) {
        return "range " + d["class"];
      }).append("span").text(function(d) {
        if (x(d.end - d.start) > 110) {
          return d.name;
        } else {
          return '';
        }
      }).append("span").text(function(d) {
        if (d["class"] === 'above') {
          return "> " + d.start + " miles";
        } else {
          return "" + d.start + "-" + d.end + " miles";
        }
      });
      return chart.selectAll("div.diam").data([diam]).enter().append("div").attr("class", "diam").style("left", function(d) {
        return x(d) + 'px';
      }).text(function(d) {
        return "";
      });
    }
  };

  return OverviewTab;

})(ReportTab);

module.exports = OverviewTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"fIqoFw","../templates/templates.js":16,"./ids.coffee":11,"api/utils":"d+CDld","reportTab":"perKyw"}],16:[function(require,module,exports){
this["Templates"] = this["Templates"] || {};

this["Templates"]["aquacultureFishingValue"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Fishing Value</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This aquaculture area displaces <strong>");_.b(_.v(_.f("percent",c,p,0)));_.b("%</strong> ");_.b("\n" + i);_.b("    of the fishing value within Barbuda’s waters, based on user reported");_.b("\n" + i);_.b("    values of fishing grounds.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"5241ea7de0fba11f3d010011\">show fishing values layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["arrayFishingValue"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Displaced Fishing Value</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);if(_.s(_.f("sanctuaries",c,p,1),c,p,0,103,389,"{{ }}")){_.rs(c,p,function(c,p,_){if(_.s(_.f("aquacultureAreas",c,p,1),c,p,0,129,363,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    This proposal includes both Sanctuary and Aquaculture areas, displacing");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("sanctuaryPercent",c,p,0)));_.b("%</strong> and <strong>");_.b(_.v(_.f("aquacultureAreaPercent",c,p,0)));_.b("%</strong> ");_.b("\n" + i);_.b("    of fishing value within Barbuda's waters, respectively.");_.b("\n");});c.pop();}});c.pop();}if(_.s(_.f("sanctuaries",c,p,1),c,p,0,426,765,"{{ }}")){_.rs(c,p,function(c,p,_){if(!_.s(_.f("aquacultureAreas",c,p,1),c,p,1,0,0,"")){_.b("    This proposal includes ");_.b(_.v(_.f("numSanctuaries",c,p,0)));_.b("\n" + i);_.b("    ");if(_.s(_.f("sancPlural",c,p,1),c,p,0,518,529,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("Sanctuaries");});c.pop();}if(!_.s(_.f("sancPlural",c,p,1),c,p,1,0,0,"")){_.b("Sanctuary");};_.b(",");_.b("\n" + i);_.b("    displacing <strong>");_.b(_.v(_.f("sanctuaryPercent",c,p,0)));_.b("%</strong> of fishing value within ");_.b("\n" + i);_.b("    Barbuda's waters based on user reported values of fishing grounds.");_.b("\n");};});c.pop();}if(!_.s(_.f("sanctuaries",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("aquacultureAreas",c,p,1),c,p,0,828,1135,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <br>");_.b("\n" + i);_.b("    <br>");_.b("\n" + i);_.b("    This proposal includes ");_.b(_.v(_.f("numAquacultureAreas",c,p,0)));_.b("\n" + i);_.b("    Aquaculture Area");if(_.s(_.f("aquacultureAreasPlural",c,p,1),c,p,0,945,946,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(",");_.b("\n" + i);_.b("    displacing <strong>");_.b(_.v(_.f("aquacultureAreaPercent",c,p,0)));_.b("%</strong> of fishing value within ");_.b("\n" + i);_.b("    Barbuda's waters based on user reported values of fishing grounds.");_.b("\n");});c.pop();}};if(_.s(_.f("moorings",c,p,1),c,p,0,1195,1525,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <br>");_.b("\n" + i);_.b("    <br>");_.b("\n" + i);_.b("    ");_.b(_.v(_.f("numMoorings",c,p,0)));_.b(" Mooring Area");if(_.s(_.f("mooringsPlural",c,p,1),c,p,0,1265,1270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s are");});c.pop();}_.b(" ");if(!_.s(_.f("mooringsPlural",c,p,1),c,p,1,0,0,"")){_.b("is");};_.b("\n" + i);_.b("    also included, which cover");if(!_.s(_.f("mooringsPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" <strong>");_.b(_.v(_.f("mooringAreaPercent",c,p,0)));_.b("%</strong> of ");_.b("\n" + i);_.b("    regional fishing value. Mooring areas may displace fishing activities.");_.b("\n");});c.pop();}if(_.s(_.f("hasNoNetZones",c,p,1),c,p,0,1561,1903,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <br>");_.b("\n" + i);_.b("    <br>");_.b("\n" + i);_.b("    ");_.b(_.v(_.f("numNoNetZones",c,p,0)));_.b(" Not Net Zone");if(_.s(_.f("noNetZonesPlural",c,p,1),c,p,0,1635,1640,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s are");});c.pop();}_.b(" ");if(!_.s(_.f("noNetZonesPlural",c,p,1),c,p,1,0,0,"")){_.b("is");};_.b("\n" + i);_.b("    also included, which cover");if(!_.s(_.f("noNetZonesPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" <strong>");_.b(_.v(_.f("noNetZonesPercent",c,p,0)));_.b("%</strong> of ");_.b("\n" + i);_.b("    regional fishing value. No Net Zones may displace fishing activities.");_.b("\n");});c.pop();}_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"5241ea7de0fba11f3d010011\">show fishing values layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("fishingAreas",c,p,1),c,p,0,2042,2414,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Priority Fishing Areas</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This proposal includes ");_.b(_.v(_.f("numFishingAreas",c,p,0)));_.b(" Fishing Priority ");_.b("\n" + i);_.b("    Area");if(_.s(_.f("fishingAreaPural",c,p,1),c,p,0,2219,2220,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(", representing");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("fishingAreaPercent",c,p,0)));_.b("%</strong> of the fishing value within Barbuda's ");_.b("\n" + i);_.b("    waters based on user reported values of fishing grounds");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

this["Templates"]["arrayHabitats"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("sanctuaries",c,p,1),c,p,0,16,919,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats within ");_.b(_.v(_.f("numSanctuaries",c,p,0)));_.b(" ");if(!_.s(_.f("sanctuaryPlural",c,p,1),c,p,1,0,0,"")){_.b("Sanctuary");};if(_.s(_.f("sanctuaryPlural",c,p,1),c,p,0,170,181,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("Sanctuaries");});c.pop();}_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Percent of Total Habitat</th>");_.b("\n" + i);_.b("        <th>Meets 33% goal</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("sanctuaryHabitat",c,p,1),c,p,0,403,616,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr class=\"");if(_.s(_.f("meetsGoal",c,p,1),c,p,0,435,442,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("metGoal");});c.pop();}_.b("\">");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b(" %</td>");_.b("\n" + i);_.b("        <td>");if(_.s(_.f("meetsGoal",c,p,1),c,p,0,545,548,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("yes");});c.pop();}if(!_.s(_.f("meetsGoal",c,p,1),c,p,1,0,0,"")){_.b("no");};_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within sanctuaries. <br>");_.b("\n" + i);_.b("    <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\">show habitats layer</a>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("aquacultureAreas",c,p,1),c,p,0,958,1588,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats within ");_.b(_.v(_.f("numAquaculture",c,p,0)));_.b(" Aquaculture Area");if(_.s(_.f("aquaPlural",c,p,1),c,p,0,1074,1075,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Percent of Total Habitat</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("aquacultureHabitat",c,p,1),c,p,0,1262,1352,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b(" %</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("<!--   <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within aquaculture ");_.b("\n" + i);_.b("    areas.");_.b("\n" + i);_.b("  </p> -->");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("moorings",c,p,1),c,p,0,1624,2235,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats within ");_.b(_.v(_.f("numMoorings",c,p,0)));_.b(" Mooring Area");if(_.s(_.f("mooringPlural",c,p,1),c,p,0,1736,1737,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Percent of Total Habitat</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("mooringData",c,p,1),c,p,0,1920,2010,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b(" %</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("<!--   <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within mooring ");_.b("\n" + i);_.b("    areas.");_.b("\n" + i);_.b("  </p> -->");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("fishingAreas",c,p,1),c,p,0,2267,2916,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats within ");_.b(_.v(_.f("numFishingAreas",c,p,0)));_.b(" Fishing Priority Area");if(_.s(_.f("fishingAreaPlural",c,p,1),c,p,0,2396,2397,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Percent of Total Habitat</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("fishingAreaData",c,p,1),c,p,0,2588,2678,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b(" %</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within fishing ");_.b("\n" + i);_.b("    priority areas.");_.b("\n" + i);_.b("  </p> -->");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("hasNoNetZones",c,p,1),c,p,0,2953,3571,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats within ");_.b(_.v(_.f("numNoNetZones",c,p,0)));_.b(" No Net Zone");if(_.s(_.f("noNetZonesPlural",c,p,1),c,p,0,3069,3070,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Percent of Total Habitat</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("noNetZonesData",c,p,1),c,p,0,3259,3349,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b(" %</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within no net zones.");_.b("\n" + i);_.b("  </p> -->");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

this["Templates"]["arrayOverview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);if(_.s(_.f("hasSketches",c,p,1),c,p,0,363,874,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    This collection is composed of <strong>");_.b(_.v(_.f("numSketches",c,p,0)));_.b(" zone");if(_.s(_.f("sketchesPlural",c,p,1),c,p,0,468,469,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The collection includes a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("sumOceanArea",c,p,0)));_.b(" square miles</strong>, which represents <strong>");_.b(_.v(_.f("sumOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also incorporates ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("sumLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("sumLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasSanctuaries",c,p,1),c,p,0,914,1653,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    The collection includes <strong>");_.b(_.v(_.f("numSanctuaries",c,p,0)));_.b(" ");if(!_.s(_.f("sanctuariesPlural",c,p,1),c,p,1,0,0,"")){_.b("sanctuary");};if(_.s(_.f("sanctuariesPlural",c,p,1),c,p,0,1067,1078,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("sanctuaries");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The ");if(!_.s(_.f("sanctuariesPlural",c,p,1),c,p,1,0,0,"")){_.b("sanctuary");};if(_.s(_.f("sanctuariesPlural",c,p,1),c,p,0,1222,1233,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("sanctuaries");});c.pop();}_.b(" contain");if(!_.s(_.f("sanctuariesPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("sanctuaryOceanArea",c,p,0)));_.b(" square miles</strong>, ");_.b("\n" + i);_.b("    which represents <strong>");_.b(_.v(_.f("sanctuaryOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also includes ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("sanctuaryLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("sanctuaryLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasNoNetZones",c,p,1),c,p,0,1693,2329,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    The collection includes <strong>");_.b(_.v(_.f("numNoNetZones",c,p,0)));_.b(" No Net Zone");if(_.s(_.f("noNetZonesPlural",c,p,1),c,p,0,1802,1803,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The No Net Zone");if(_.s(_.f("noNetZonesPlural",c,p,1),c,p,0,1903,1904,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> contain");if(!_.s(_.f("noNetZonesPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("noNetZonesOceanArea",c,p,0)));_.b(" square miles</strong>, which represents <strong>");_.b(_.v(_.f("noNetZonesOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also includes ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("noNetZonesLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("noNetZonesLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasMoorings",c,p,1),c,p,0,2366,2978,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    The collection includes <strong>");_.b(_.v(_.f("numMoorings",c,p,0)));_.b(" Mooring Area");if(_.s(_.f("mooringsPlural",c,p,1),c,p,0,2472,2473,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The Mooring Area");if(_.s(_.f("mooringsPlural",c,p,1),c,p,0,2570,2571,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(" contain");if(!_.s(_.f("mooringsPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("mooringsOceanArea",c,p,0)));_.b(" square miles</strong>, ");_.b("\n" + i);_.b("    which represents <strong>");_.b(_.v(_.f("mooringsOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also includes ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("mooringsLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("mooringsLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasAquaculture",c,p,1),c,p,0,3016,3664,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    The collection includes <strong>");_.b(_.v(_.f("numAquaculture",c,p,0)));_.b(" Aquaculture Area");if(_.s(_.f("aquaculturePlural",c,p,1),c,p,0,3132,3133,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The Aquaculture Area");if(_.s(_.f("aquaculturePlural",c,p,1),c,p,0,3240,3241,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(" contain");if(!_.s(_.f("aquaculturePlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("aquacultureOceanArea",c,p,0)));_.b(" square miles</strong>, which represents <strong>");_.b(_.v(_.f("aquacultureOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also includes ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("aquacultureLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("aquacultureLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasFishingAreas",c,p,1),c,p,0,3706,4375,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    The collection includes <strong>");_.b(_.v(_.f("numFishingAreas",c,p,0)));_.b(" Fishing Priority Area");if(_.s(_.f("fishingAreasPlural",c,p,1),c,p,0,3829,3830,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The Fishing Priority Area");if(_.s(_.f("fishingAreasPlural",c,p,1),c,p,0,3944,3945,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(" contain");if(!_.s(_.f("fishingAreasPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("fishingAreasOceanArea",c,p,0)));_.b(" square miles</strong>, which represents <strong>");_.b(_.v(_.f("fishingAreasOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also includes ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("fishingAreasLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("fishingAreasLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("<!--");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Zones in this Proposal</h4>");_.b("\n" + i);_.b("  <div class=\"tocContainer\"></div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("-->");_.b("\n" + i);if(_.s(_.f("anyAttributes",c,p,1),c,p,0,4534,4658,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"  "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

this["Templates"]["arrayTradeoffs"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Tradeoffs</h4>");_.b("\n" + i);_.b("	<p class=\"small ttip-tip\">");_.b("\n" + i);_.b("	   Tip: hover over a proposal to see details");_.b("\n" + i);_.b("	</p>");_.b("\n" + i);_.b("  	<div  id=\"tradeoff-chart\" class=\"tradeoff-chart\"></div>");_.b("\n" + i);_.b("</div>");return _.fl();;});

this["Templates"]["demo"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Report Sections</h4>");_.b("\n" + i);_.b("  <p>Use report sections to group information into meaningful categories</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>D3 Visualizations</h4>");_.b("\n" + i);_.b("  <ul class=\"nav nav-pills\" id=\"tabs2\">");_.b("\n" + i);_.b("    <li class=\"active\"><a href=\"#chart\">Chart</a></li>");_.b("\n" + i);_.b("    <li><a href=\"#dataTable\">Table</a></li>");_.b("\n" + i);_.b("  </ul>");_.b("\n" + i);_.b("  <div class=\"tab-content\">");_.b("\n" + i);_.b("    <div class=\"tab-pane active\" id=\"chart\">");_.b("\n" + i);_.b("      <!--[if IE 8]>");_.b("\n" + i);_.b("      <p class=\"unsupported\">");_.b("\n" + i);_.b("      This visualization is not compatible with Internet Explorer 8. ");_.b("\n" + i);_.b("      Please upgrade your browser, or view results in the table tab.");_.b("\n" + i);_.b("      </p>      ");_.b("\n" + i);_.b("      <![endif]-->");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        See <code>src/scripts/demo.coffee</code> for an example of how to ");_.b("\n" + i);_.b("        use d3.js to render visualizations. Provide a table-based view");_.b("\n" + i);_.b("        and use conditional comments to provide a fallback for IE8 users.");_.b("\n" + i);_.b("        <br>");_.b("\n" + i);_.b("        <a href=\"http://twitter.github.io/bootstrap/2.3.2/\">Bootstrap 2.x</a>");_.b("\n" + i);_.b("        is loaded within SeaSketch so you can use it to create tabs and other ");_.b("\n" + i);_.b("        interface components. jQuery and underscore are also available.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("    <div class=\"tab-pane\" id=\"dataTable\">");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>index</th>");_.b("\n" + i);_.b("            <th>value</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("chartData",c,p,1),c,p,0,1351,1418,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr><td>");_.b(_.v(_.f("index",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("value",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection emphasis\">");_.b("\n" + i);_.b("  <h4>Emphasis</h4>");_.b("\n" + i);_.b("  <p>Give report sections an <code>emphasis</code> class to highlight important information.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection warning\">");_.b("\n" + i);_.b("  <h4>Warning</h4>");_.b("\n" + i);_.b("  <p>Or <code>warn</code> of potential problems.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection danger\">");_.b("\n" + i);_.b("  <h4>Danger</h4>");_.b("\n" + i);_.b("  <p><code>danger</code> can also be used... sparingly.</p>");_.b("\n" + i);_.b("</div>");return _.fl();;});

this["Templates"]["fishingPriorityArea"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Fishing Value</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This fishing priority area includes <strong>");_.b(_.v(_.f("percent",c,p,0)));_.b("%</strong> of the ");_.b("\n" + i);_.b("    fishing value within Barbuda's waters, based on user reported values of ");_.b("\n" + i);_.b("    fishing grounds");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"5241ea7de0fba11f3d010011\">show fishing values layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["fishingValue"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Fishing Value</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This ");_.b(_.v(_.f("areaLabel",c,p,0)));_.b(" displaces <strong>");_.b(_.v(_.f("percent",c,p,0)));_.b("%</strong> ");_.b("\n" + i);_.b("    of the fishing value within Barbuda’s waters, based on user reported");_.b("\n" + i);_.b("    values of fishing grounds.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"5241ea7de0fba11f3d010011\">show fishing values layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["habitat"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.f("heading",c,p,0)));_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>% of Total Habitat</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("habitats",c,p,1),c,p,0,216,279,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr><td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("Percent",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within this zone. <br>");_.b("\n" + i);_.b("    <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\">show habitats layer</a>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This area is <strong>");_.b(_.v(_.f("SQ_MILES",c,p,0)));_.b(" square miles</strong>,");_.b("\n" + i);_.b("    which represents <strong>");_.b(_.v(_.f("PERCENT",c,p,0)));_.b("%</strong> of Barbuda's waters.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("renderMinimumWidth",c,p,1),c,p,0,536,1178,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection diameter ");if(!_.s(_.f("DIAM_OK",c,p,1),c,p,1,0,0,"")){_.b("warning");};_.b("\">");_.b("\n" + i);_.b("  <h4>Minimum Width</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    The minimum width of a zone significantly impacts  its conservation value. ");_.b("\n" + i);_.b("    The recommended smallest diameter is between 2 and 3 miles.");_.b("\n" + i);_.b("    <strong>");_.b("\n" + i);if(!_.s(_.f("DIAM_OK",c,p,1),c,p,1,0,0,"")){_.b("    This design falls outside the recommendation at ");_.b(_.v(_.f("DIAM",c,p,0)));_.b(" miles.");_.b("\n");};if(_.s(_.f("DIAM_OK",c,p,1),c,p,0,926,997,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    This design fits within the recommendation at ");_.b(_.v(_.f("DIAM",c,p,0)));_.b(" miles.");_.b("\n");});c.pop();}_.b("    </strong>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <div class=\"viz\" style=\"position:relative;\"></div>");_.b("\n" + i);_.b("  <img src=\"http://s3.amazonaws.com/SeaSketch/projects/barbuda/min_width_example.png\">");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("anyAttributes",c,p,1),c,p,0,1221,1345,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"  "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

module.exports = this["Templates"];
},{}]},{},[8])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvY2J1cnQvV29ya2luZy9iYXJidWRhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvX2VtcHR5LmpzIiwiL1VzZXJzL2NidXJ0L1dvcmtpbmcvYmFyYnVkYS1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2VuYWJsZUxheWVyVG9nZ2xlcnMuY29mZmVlIiwiL1VzZXJzL2NidXJ0L1dvcmtpbmcvYmFyYnVkYS1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2pvYkl0ZW0uY29mZmVlIiwiL1VzZXJzL2NidXJ0L1dvcmtpbmcvYmFyYnVkYS1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFJlc3VsdHMuY29mZmVlIiwiL1VzZXJzL2NidXJ0L1dvcmtpbmcvYmFyYnVkYS1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFRhYi5jb2ZmZWUiLCIvVXNlcnMvY2J1cnQvV29ya2luZy9iYXJidWRhLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvdXRpbHMuY29mZmVlIiwiL1VzZXJzL2NidXJ0L1dvcmtpbmcvYmFyYnVkYS1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIiwiL1VzZXJzL2NidXJ0L1dvcmtpbmcvYmFyYnVkYS1yZXBvcnRzL3NjcmlwdHMvZmlzaFNhbmN0dWFyeS5jb2ZmZWUiLCIvVXNlcnMvY2J1cnQvV29ya2luZy9iYXJidWRhLXJlcG9ydHMvc2NyaXB0cy9maXNoaW5nVmFsdWUuY29mZmVlIiwiL1VzZXJzL2NidXJ0L1dvcmtpbmcvYmFyYnVkYS1yZXBvcnRzL3NjcmlwdHMvaGFiaXRhdFRhYi5jb2ZmZWUiLCIvVXNlcnMvY2J1cnQvV29ya2luZy9iYXJidWRhLXJlcG9ydHMvc2NyaXB0cy9pZHMuY29mZmVlIiwiL1VzZXJzL2NidXJ0L1dvcmtpbmcvYmFyYnVkYS1yZXBvcnRzL3NjcmlwdHMvb3ZlcnZpZXdUYWIuY29mZmVlIiwiL1VzZXJzL2NidXJ0L1dvcmtpbmcvYmFyYnVkYS1yZXBvcnRzL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztBQ0FBLENBQU8sQ0FBVSxDQUFBLEdBQVgsQ0FBTixFQUFrQjtDQUNoQixLQUFBLDJFQUFBO0NBQUEsQ0FBQSxDQUFBO0NBQUEsQ0FDQSxDQUFBLEdBQVk7Q0FEWixDQUVBLENBQUEsR0FBTTtBQUNDLENBQVAsQ0FBQSxDQUFBLENBQUE7Q0FDRSxFQUFBLENBQUEsR0FBTyxxQkFBUDtDQUNBLFNBQUE7SUFMRjtDQUFBLENBTUEsQ0FBVyxDQUFBLElBQVgsYUFBVztDQUVYO0NBQUEsTUFBQSxvQ0FBQTt3QkFBQTtDQUNFLEVBQVcsQ0FBWCxHQUFXLENBQVg7Q0FBQSxFQUNTLENBQVQsRUFBQSxFQUFpQixLQUFSO0NBQ1Q7Q0FDRSxFQUFPLENBQVAsRUFBQSxVQUFPO0NBQVAsRUFDTyxDQUFQLENBREEsQ0FDQTtBQUMrQixDQUYvQixDQUU4QixDQUFFLENBQWhDLEVBQUEsRUFBUSxDQUF3QixLQUFoQztDQUZBLENBR3lCLEVBQXpCLEVBQUEsRUFBUSxDQUFSO01BSkY7Q0FNRSxLQURJO0NBQ0osQ0FBZ0MsRUFBaEMsRUFBQSxFQUFRLFFBQVI7TUFUSjtDQUFBLEVBUkE7Q0FtQlMsQ0FBVCxDQUFxQixJQUFyQixDQUFRLENBQVI7Q0FDRSxHQUFBLFVBQUE7Q0FBQSxFQUNBLENBQUEsRUFBTTtDQUROLEVBRU8sQ0FBUCxLQUFPO0NBQ1AsR0FBQTtDQUNFLEdBQUksRUFBSixVQUFBO0FBQzBCLENBQXRCLENBQXFC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Q0FNTixDQUdXLENBQ0EsQ0FKakIsQ0FBSyxDQUFMLENBQUEsRUFBQSxDQUFBLEdBQUE7Q0FJd0IsRUFBTyxZQUFQO0NBSnhCLEVBS1EsQ0FMUixHQUlpQixFQUNSO0NBQUQsY0FBTztDQUxmLE1BS1E7TUFuREg7Q0F0Q1QsRUFzQ1M7O0NBdENUOztDQUR3Qjs7QUE2RjFCLENBL0dBLEVBK0dpQixHQUFYLENBQU4sSUEvR0E7Ozs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOltudWxsLCJtb2R1bGUuZXhwb3J0cyA9IChlbCkgLT5cbiAgJGVsID0gJCBlbFxuICBhcHAgPSB3aW5kb3cuYXBwXG4gIHRvYyA9IGFwcC5nZXRUb2MoKVxuICB1bmxlc3MgdG9jXG4gICAgY29uc29sZS5sb2cgJ05vIHRhYmxlIG9mIGNvbnRlbnRzIGZvdW5kJ1xuICAgIHJldHVyblxuICB0b2dnbGVycyA9ICRlbC5maW5kKCdhW2RhdGEtdG9nZ2xlLW5vZGVdJylcbiAgIyBTZXQgaW5pdGlhbCBzdGF0ZVxuICBmb3IgdG9nZ2xlciBpbiB0b2dnbGVycy50b0FycmF5KClcbiAgICAkdG9nZ2xlciA9ICQodG9nZ2xlcilcbiAgICBub2RlaWQgPSAkdG9nZ2xlci5kYXRhKCd0b2dnbGUtbm9kZScpXG4gICAgdHJ5XG4gICAgICB2aWV3ID0gdG9jLmdldENoaWxkVmlld0J5SWQgbm9kZWlkXG4gICAgICBub2RlID0gdmlldy5tb2RlbFxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS12aXNpYmxlJywgISFub2RlLmdldCgndmlzaWJsZScpXG4gICAgICAkdG9nZ2xlci5kYXRhICd0b2NJdGVtJywgdmlld1xuICAgIGNhdGNoIGVcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtbm90LWZvdW5kJywgJ3RydWUnXG5cbiAgdG9nZ2xlcnMub24gJ2NsaWNrJywgKGUpIC0+XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgJGVsID0gJChlLnRhcmdldClcbiAgICB2aWV3ID0gJGVsLmRhdGEoJ3RvY0l0ZW0nKVxuICAgIGlmIHZpZXdcbiAgICAgIHZpZXcudG9nZ2xlVmlzaWJpbGl0eShlKVxuICAgICAgJGVsLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhdmlldy5tb2RlbC5nZXQoJ3Zpc2libGUnKVxuICAgIGVsc2VcbiAgICAgIGFsZXJ0IFwiTGF5ZXIgbm90IGZvdW5kIGluIHRoZSBjdXJyZW50IFRhYmxlIG9mIENvbnRlbnRzLiBcXG5FeHBlY3RlZCBub2RlaWQgI3skZWwuZGF0YSgndG9nZ2xlLW5vZGUnKX1cIlxuIiwiY2xhc3MgSm9iSXRlbSBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgY2xhc3NOYW1lOiAncmVwb3J0UmVzdWx0J1xuICBldmVudHM6IHt9XG4gIGJpbmRpbmdzOlxuICAgIFwiaDYgYVwiOlxuICAgICAgb2JzZXJ2ZTogXCJzZXJ2aWNlTmFtZVwiXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICBuYW1lOiAnaHJlZidcbiAgICAgICAgb2JzZXJ2ZTogJ3NlcnZpY2VVcmwnXG4gICAgICB9XVxuICAgIFwiLnN0YXJ0ZWRBdFwiOlxuICAgICAgb2JzZXJ2ZTogW1wic3RhcnRlZEF0XCIsIFwic3RhdHVzXCJdXG4gICAgICB2aXNpYmxlOiAoKSAtPlxuICAgICAgICBAbW9kZWwuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBvbkdldDogKCkgLT5cbiAgICAgICAgaWYgQG1vZGVsLmdldCgnc3RhcnRlZEF0JylcbiAgICAgICAgICByZXR1cm4gXCJTdGFydGVkIFwiICsgbW9tZW50KEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpKS5mcm9tTm93KCkgKyBcIi4gXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIFwiXCJcbiAgICBcIi5zdGF0dXNcIjogICAgICBcbiAgICAgIG9ic2VydmU6IFwic3RhdHVzXCJcbiAgICAgIG9uR2V0OiAocykgLT5cbiAgICAgICAgc3dpdGNoIHNcbiAgICAgICAgICB3aGVuICdwZW5kaW5nJ1xuICAgICAgICAgICAgXCJ3YWl0aW5nIGluIGxpbmVcIlxuICAgICAgICAgIHdoZW4gJ3J1bm5pbmcnXG4gICAgICAgICAgICBcInJ1bm5pbmcgYW5hbHl0aWNhbCBzZXJ2aWNlXCJcbiAgICAgICAgICB3aGVuICdjb21wbGV0ZSdcbiAgICAgICAgICAgIFwiY29tcGxldGVkXCJcbiAgICAgICAgICB3aGVuICdlcnJvcidcbiAgICAgICAgICAgIFwiYW4gZXJyb3Igb2NjdXJyZWRcIlxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNcbiAgICBcIi5xdWV1ZUxlbmd0aFwiOiBcbiAgICAgIG9ic2VydmU6IFwicXVldWVMZW5ndGhcIlxuICAgICAgb25HZXQ6ICh2KSAtPlxuICAgICAgICBzID0gXCJXYWl0aW5nIGJlaGluZCAje3Z9IGpvYlwiXG4gICAgICAgIGlmIHYubGVuZ3RoID4gMVxuICAgICAgICAgIHMgKz0gJ3MnXG4gICAgICAgIHJldHVybiBzICsgXCIuIFwiXG4gICAgICB2aXNpYmxlOiAodikgLT5cbiAgICAgICAgdj8gYW5kIHBhcnNlSW50KHYpID4gMFxuICAgIFwiLmVycm9yc1wiOlxuICAgICAgb2JzZXJ2ZTogJ2Vycm9yJ1xuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/Lmxlbmd0aCA+IDJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgaWYgdj9cbiAgICAgICAgICBKU09OLnN0cmluZ2lmeSh2LCBudWxsLCAnICAnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoQG1vZGVsKSAtPlxuICAgIHN1cGVyKClcblxuICByZW5kZXI6ICgpIC0+XG4gICAgQCRlbC5odG1sIFwiXCJcIlxuICAgICAgPGg2PjxhIGhyZWY9XCIjXCIgdGFyZ2V0PVwiX2JsYW5rXCI+PC9hPjxzcGFuIGNsYXNzPVwic3RhdHVzXCI+PC9zcGFuPjwvaDY+XG4gICAgICA8ZGl2PlxuICAgICAgICA8c3BhbiBjbGFzcz1cInN0YXJ0ZWRBdFwiPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJxdWV1ZUxlbmd0aFwiPjwvc3Bhbj5cbiAgICAgICAgPHByZSBjbGFzcz1cImVycm9yc1wiPjwvcHJlPlxuICAgICAgPC9kaXY+XG4gICAgXCJcIlwiXG4gICAgQHN0aWNraXQoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEpvYkl0ZW0iLCJjbGFzcyBSZXBvcnRSZXN1bHRzIGV4dGVuZHMgQmFja2JvbmUuQ29sbGVjdGlvblxuXG4gIGRlZmF1bHRQb2xsaW5nSW50ZXJ2YWw6IDMwMDBcblxuICBjb25zdHJ1Y3RvcjogKEBza2V0Y2gsIEBkZXBzKSAtPlxuICAgIEB1cmwgPSB1cmwgPSBcIi9yZXBvcnRzLyN7QHNrZXRjaC5pZH0vI3tAZGVwcy5qb2luKCcsJyl9XCJcbiAgICBzdXBlcigpXG5cbiAgcG9sbDogKCkgPT5cbiAgICBAZmV0Y2gge1xuICAgICAgc3VjY2VzczogKCkgPT5cbiAgICAgICAgQHRyaWdnZXIgJ2pvYnMnXG4gICAgICAgIGZvciByZXN1bHQgaW4gQG1vZGVsc1xuICAgICAgICAgIGlmIHJlc3VsdC5nZXQoJ3N0YXR1cycpIG5vdCBpbiBbJ2NvbXBsZXRlJywgJ2Vycm9yJ11cbiAgICAgICAgICAgIHVubGVzcyBAaW50ZXJ2YWxcbiAgICAgICAgICAgICAgQGludGVydmFsID0gc2V0SW50ZXJ2YWwgQHBvbGwsIEBkZWZhdWx0UG9sbGluZ0ludGVydmFsXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgIyBhbGwgY29tcGxldGUgdGhlblxuICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChAaW50ZXJ2YWwpIGlmIEBpbnRlcnZhbFxuICAgICAgICBpZiBwcm9ibGVtID0gXy5maW5kKEBtb2RlbHMsIChyKSAtPiByLmdldCgnZXJyb3InKT8pXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywgXCJQcm9ibGVtIHdpdGggI3twcm9ibGVtLmdldCgnc2VydmljZU5hbWUnKX0gam9iXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEB0cmlnZ2VyICdmaW5pc2hlZCdcbiAgICAgIGVycm9yOiAoZSwgcmVzLCBhLCBiKSA9PlxuICAgICAgICB1bmxlc3MgcmVzLnN0YXR1cyBpcyAwXG4gICAgICAgICAgaWYgcmVzLnJlc3BvbnNlVGV4dD8ubGVuZ3RoXG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAganNvbiA9IEpTT04ucGFyc2UocmVzLnJlc3BvbnNlVGV4dClcbiAgICAgICAgICAgIGNhdGNoXG4gICAgICAgICAgICAgICMgZG8gbm90aGluZ1xuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywganNvbj8uZXJyb3I/Lm1lc3NhZ2Ugb3IgXG4gICAgICAgICAgICAnUHJvYmxlbSBjb250YWN0aW5nIHRoZSBTZWFTa2V0Y2ggc2VydmVyJ1xuICAgIH1cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRSZXN1bHRzXG4iLCJlbmFibGVMYXllclRvZ2dsZXJzID0gcmVxdWlyZSAnLi9lbmFibGVMYXllclRvZ2dsZXJzLmNvZmZlZSdcbnJvdW5kID0gcmVxdWlyZSgnLi91dGlscy5jb2ZmZWUnKS5yb3VuZFxuUmVwb3J0UmVzdWx0cyA9IHJlcXVpcmUgJy4vcmVwb3J0UmVzdWx0cy5jb2ZmZWUnXG50ID0gcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcycpXG50ZW1wbGF0ZXMgPVxuICByZXBvcnRMb2FkaW5nOiB0Wydub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvcmVwb3J0TG9hZGluZyddXG5Kb2JJdGVtID0gcmVxdWlyZSAnLi9qb2JJdGVtLmNvZmZlZSdcbkNvbGxlY3Rpb25WaWV3ID0gcmVxdWlyZSgndmlld3MvY29sbGVjdGlvblZpZXcnKVxuXG5jbGFzcyBSZWNvcmRTZXRcblxuICBjb25zdHJ1Y3RvcjogKEBkYXRhLCBAdGFiLCBAc2tldGNoQ2xhc3NJZCkgLT5cblxuICB0b0FycmF5OiAoKSAtPlxuICAgIGlmIEBza2V0Y2hDbGFzc0lkXG4gICAgICBkYXRhID0gXy5maW5kIEBkYXRhLnZhbHVlLCAodikgPT4gXG4gICAgICAgIHYuZmVhdHVyZXM/WzBdPy5hdHRyaWJ1dGVzP1snU0NfSUQnXSBpcyBAc2tldGNoQ2xhc3NJZCAgICAgICAgXG4gICAgICB1bmxlc3MgZGF0YVxuICAgICAgICB0aHJvdyBcIkNvdWxkIG5vdCBmaW5kIGRhdGEgZm9yIHNrZXRjaENsYXNzICN7QHNrZXRjaENsYXNzSWR9XCJcbiAgICBlbHNlXG4gICAgICBkYXRhID0gQGRhdGEudmFsdWVbMF1cbiAgICBfLm1hcCBkYXRhLmZlYXR1cmVzLCAoZmVhdHVyZSkgLT5cbiAgICAgIGZlYXR1cmUuYXR0cmlidXRlc1xuXG4gIHJhdzogKGF0dHIpIC0+XG4gICAgYXR0cnMgPSBfLm1hcCBAdG9BcnJheSgpLCAocm93KSAtPlxuICAgICAgcm93W2F0dHJdXG4gICAgYXR0cnMgPSBfLmZpbHRlciBhdHRycywgKGF0dHIpIC0+IGF0dHIgIT0gdW5kZWZpbmVkXG4gICAgaWYgYXR0cnMubGVuZ3RoIGlzIDBcbiAgICAgIGNvbnNvbGUubG9nIEBkYXRhXG4gICAgICBAdGFiLnJlcG9ydEVycm9yIFwiQ291bGQgbm90IGdldCBhdHRyaWJ1dGUgI3thdHRyfSBmcm9tIHJlc3VsdHNcIlxuICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9XCJcbiAgICBlbHNlIGlmIGF0dHJzLmxlbmd0aCBpcyAxXG4gICAgICByZXR1cm4gYXR0cnNbMF1cbiAgICBlbHNlXG4gICAgICByZXR1cm4gYXR0cnNcblxuICBpbnQ6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCBwYXJzZUludFxuICAgIGVsc2VcbiAgICAgIHBhcnNlSW50KHJhdylcblxuICBmbG9hdDogKGF0dHIsIGRlY2ltYWxQbGFjZXM9MikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gcm91bmQodmFsLCBkZWNpbWFsUGxhY2VzKVxuICAgIGVsc2VcbiAgICAgIHJvdW5kKHJhdywgZGVjaW1hbFBsYWNlcylcblxuICBib29sOiAoYXR0cikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gdmFsLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSBpcyAndHJ1ZSdcbiAgICBlbHNlXG4gICAgICByYXcudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuXG5jbGFzcyBSZXBvcnRUYWIgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIG5hbWU6ICdJbmZvcm1hdGlvbidcbiAgZGVwZW5kZW5jaWVzOiBbXVxuXG4gIGluaXRpYWxpemU6IChAbW9kZWwsIEBvcHRpb25zKSAtPlxuICAgICMgV2lsbCBiZSBpbml0aWFsaXplZCBieSBTZWFTa2V0Y2ggd2l0aCB0aGUgZm9sbG93aW5nIGFyZ3VtZW50czpcbiAgICAjICAgKiBtb2RlbCAtIFRoZSBza2V0Y2ggYmVpbmcgcmVwb3J0ZWQgb25cbiAgICAjICAgKiBvcHRpb25zXG4gICAgIyAgICAgLSAucGFyZW50IC0gdGhlIHBhcmVudCByZXBvcnQgdmlldyBcbiAgICAjICAgICAgICBjYWxsIEBvcHRpb25zLnBhcmVudC5kZXN0cm95KCkgdG8gY2xvc2UgdGhlIHdob2xlIHJlcG9ydCB3aW5kb3dcbiAgICBAYXBwID0gd2luZG93LmFwcFxuICAgIF8uZXh0ZW5kIEAsIEBvcHRpb25zXG4gICAgQHJlcG9ydFJlc3VsdHMgPSBuZXcgUmVwb3J0UmVzdWx0cyhAbW9kZWwsIEBkZXBlbmRlbmNpZXMpXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2Vycm9yJywgQHJlcG9ydEVycm9yXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2pvYnMnLCBAcmVuZGVySm9iRGV0YWlsc1xuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdqb2JzJywgQHJlcG9ydEpvYnNcbiAgICBAbGlzdGVuVG8gQHJlcG9ydFJlc3VsdHMsICdmaW5pc2hlZCcsIF8uYmluZCBAcmVuZGVyLCBAXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ3JlcXVlc3QnLCBAcmVwb3J0UmVxdWVzdGVkXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIHRocm93ICdyZW5kZXIgbWV0aG9kIG11c3QgYmUgb3ZlcmlkZGVuJ1xuXG4gIHNob3c6ICgpIC0+XG4gICAgQCRlbC5zaG93KClcbiAgICBAdmlzaWJsZSA9IHRydWVcbiAgICBpZiBAZGVwZW5kZW5jaWVzPy5sZW5ndGggYW5kICFAcmVwb3J0UmVzdWx0cy5tb2RlbHMubGVuZ3RoXG4gICAgICBAcmVwb3J0UmVzdWx0cy5wb2xsKClcbiAgICBlbHNlIGlmICFAZGVwZW5kZW5jaWVzPy5sZW5ndGhcbiAgICAgIEByZW5kZXIoKVxuXG4gIGhpZGU6ICgpIC0+XG4gICAgQCRlbC5oaWRlKClcbiAgICBAdmlzaWJsZSA9IGZhbHNlXG5cbiAgcmVtb3ZlOiAoKSA9PlxuICAgIHdpbmRvdy5jbGVhckludGVydmFsIEBldGFJbnRlcnZhbFxuICAgIEBzdG9wTGlzdGVuaW5nKClcbiAgICBzdXBlcigpXG4gIFxuICByZXBvcnRSZXF1ZXN0ZWQ6ICgpID0+XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlcy5yZXBvcnRMb2FkaW5nLnJlbmRlcih7fSlcblxuICByZXBvcnRFcnJvcjogKG1zZywgY2FuY2VsbGVkUmVxdWVzdCkgPT5cbiAgICB1bmxlc3MgY2FuY2VsbGVkUmVxdWVzdFxuICAgICAgaWYgbXNnIGlzICdKT0JfRVJST1InXG4gICAgICAgIEBzaG93RXJyb3IgJ0Vycm9yIHdpdGggc3BlY2lmaWMgam9iJ1xuICAgICAgZWxzZVxuICAgICAgICBAc2hvd0Vycm9yIG1zZ1xuXG4gIHNob3dFcnJvcjogKG1zZykgPT5cbiAgICBAJCgnLnByb2dyZXNzJykucmVtb3ZlKClcbiAgICBAJCgncC5lcnJvcicpLnJlbW92ZSgpXG4gICAgQCQoJ2g0JykudGV4dChcIkFuIEVycm9yIE9jY3VycmVkXCIpLmFmdGVyIFwiXCJcIlxuICAgICAgPHAgY2xhc3M9XCJlcnJvclwiIHN0eWxlPVwidGV4dC1hbGlnbjpjZW50ZXI7XCI+I3ttc2d9PC9wPlxuICAgIFwiXCJcIlxuXG4gIHJlcG9ydEpvYnM6ICgpID0+XG4gICAgdW5sZXNzIEBtYXhFdGFcbiAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCcxMDAlJylcbiAgICBAJCgnaDQnKS50ZXh0IFwiQW5hbHl6aW5nIERlc2lnbnNcIlxuXG4gIHN0YXJ0RXRhQ291bnRkb3duOiAoKSA9PlxuICAgIGlmIEBtYXhFdGFcbiAgICAgIHRvdGFsID0gKG5ldyBEYXRlKEBtYXhFdGEpLmdldFRpbWUoKSAtIG5ldyBEYXRlKEBldGFTdGFydCkuZ2V0VGltZSgpKSAvIDEwMDBcbiAgICAgIGxlZnQgPSAobmV3IERhdGUoQG1heEV0YSkuZ2V0VGltZSgpIC0gbmV3IERhdGUoKS5nZXRUaW1lKCkpIC8gMTAwMFxuICAgICAgXy5kZWxheSAoKSA9PlxuICAgICAgICBAcmVwb3J0UmVzdWx0cy5wb2xsKClcbiAgICAgICwgKGxlZnQgKyAxKSAqIDEwMDBcbiAgICAgIF8uZGVsYXkgKCkgPT5cbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykuY3NzICd0cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbicsICdsaW5lYXInXG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLmNzcyAndHJhbnNpdGlvbi1kdXJhdGlvbicsIFwiI3tsZWZ0ICsgMX1zXCJcbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzEwMCUnKVxuICAgICAgLCA1MDBcblxuICByZW5kZXJKb2JEZXRhaWxzOiAoKSA9PlxuICAgIG1heEV0YSA9IG51bGxcbiAgICBmb3Igam9iIGluIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgaWYgam9iLmdldCgnZXRhJylcbiAgICAgICAgaWYgIW1heEV0YSBvciBqb2IuZ2V0KCdldGEnKSA+IG1heEV0YVxuICAgICAgICAgIG1heEV0YSA9IGpvYi5nZXQoJ2V0YScpXG4gICAgaWYgbWF4RXRhXG4gICAgICBAbWF4RXRhID0gbWF4RXRhXG4gICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnNSUnKVxuICAgICAgQGV0YVN0YXJ0ID0gbmV3IERhdGUoKVxuICAgICAgQHN0YXJ0RXRhQ291bnRkb3duKClcblxuICAgIEAkKCdbcmVsPWRldGFpbHNdJykuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJylcbiAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmNsaWNrIChlKSA9PlxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmhpZGUoKVxuICAgICAgQCQoJy5kZXRhaWxzJykuc2hvdygpXG4gICAgZm9yIGpvYiBpbiBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIGl0ZW0gPSBuZXcgSm9iSXRlbShqb2IpXG4gICAgICBpdGVtLnJlbmRlcigpXG4gICAgICBAJCgnLmRldGFpbHMnKS5hcHBlbmQgaXRlbS5lbFxuXG4gIGdldFJlc3VsdDogKGlkKSAtPlxuICAgIHJlc3VsdHMgPSBAZ2V0UmVzdWx0cygpXG4gICAgcmVzdWx0ID0gXy5maW5kIHJlc3VsdHMsIChyKSAtPiByLnBhcmFtTmFtZSBpcyBpZFxuICAgIHVubGVzcyByZXN1bHQ/XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHJlc3VsdCB3aXRoIGlkICcgKyBpZClcbiAgICByZXN1bHQudmFsdWVcblxuICBnZXRGaXJzdFJlc3VsdDogKHBhcmFtLCBpZCkgLT5cbiAgICByZXN1bHQgPSBAZ2V0UmVzdWx0KHBhcmFtKVxuICAgIHRyeVxuICAgICAgcmV0dXJuIHJlc3VsdFswXS5mZWF0dXJlc1swXS5hdHRyaWJ1dGVzW2lkXVxuICAgIGNhdGNoIGVcbiAgICAgIHRocm93IFwiRXJyb3IgZmluZGluZyAje3BhcmFtfToje2lkfSBpbiBncCByZXN1bHRzXCJcblxuICBnZXRSZXN1bHRzOiAoKSAtPlxuICAgIHJlc3VsdHMgPSBAcmVwb3J0UmVzdWx0cy5tYXAoKHJlc3VsdCkgLT4gcmVzdWx0LmdldCgncmVzdWx0JykucmVzdWx0cylcbiAgICB1bmxlc3MgcmVzdWx0cz8ubGVuZ3RoXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGdwIHJlc3VsdHMnKVxuICAgIF8uZmlsdGVyIHJlc3VsdHMsIChyZXN1bHQpIC0+XG4gICAgICByZXN1bHQucGFyYW1OYW1lIG5vdCBpbiBbJ1Jlc3VsdENvZGUnLCAnUmVzdWx0TXNnJ11cblxuICByZWNvcmRTZXQ6IChkZXBlbmRlbmN5LCBwYXJhbU5hbWUsIHNrZXRjaENsYXNzSWQ9ZmFsc2UpIC0+XG4gICAgdW5sZXNzIGRlcGVuZGVuY3kgaW4gQGRlcGVuZGVuY2llc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVW5rbm93biBkZXBlbmRlbmN5ICN7ZGVwZW5kZW5jeX1cIlxuICAgIGRlcCA9IEByZXBvcnRSZXN1bHRzLmZpbmQgKHIpIC0+IHIuZ2V0KCdzZXJ2aWNlTmFtZScpIGlzIGRlcGVuZGVuY3lcbiAgICB1bmxlc3MgZGVwXG4gICAgICBjb25zb2xlLmxvZyBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvdWxkIG5vdCBmaW5kIHJlc3VsdHMgZm9yICN7ZGVwZW5kZW5jeX0uXCJcbiAgICBwYXJhbSA9IF8uZmluZCBkZXAuZ2V0KCdyZXN1bHQnKS5yZXN1bHRzLCAocGFyYW0pIC0+IFxuICAgICAgcGFyYW0ucGFyYW1OYW1lIGlzIHBhcmFtTmFtZVxuICAgIHVubGVzcyBwYXJhbVxuICAgICAgY29uc29sZS5sb2cgZGVwLmdldCgnZGF0YScpLnJlc3VsdHNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvdWxkIG5vdCBmaW5kIHBhcmFtICN7cGFyYW1OYW1lfSBpbiAje2RlcGVuZGVuY3l9XCJcbiAgICBuZXcgUmVjb3JkU2V0KHBhcmFtLCBALCBza2V0Y2hDbGFzc0lkKVxuXG4gIGVuYWJsZVRhYmxlUGFnaW5nOiAoKSAtPlxuICAgIEAkKCdbZGF0YS1wYWdpbmddJykuZWFjaCAoKSAtPlxuICAgICAgJHRhYmxlID0gJChAKVxuICAgICAgcGFnZVNpemUgPSAkdGFibGUuZGF0YSgncGFnaW5nJylcbiAgICAgIHJvd3MgPSAkdGFibGUuZmluZCgndGJvZHkgdHInKS5sZW5ndGhcbiAgICAgIHBhZ2VzID0gTWF0aC5jZWlsKHJvd3MgLyBwYWdlU2l6ZSlcbiAgICAgIGlmIHBhZ2VzID4gMVxuICAgICAgICAkdGFibGUuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDx0Zm9vdD5cbiAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgPHRkIGNvbHNwYW49XCIjeyR0YWJsZS5maW5kKCd0aGVhZCB0aCcpLmxlbmd0aH1cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGFnaW5hdGlvblwiPlxuICAgICAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5QcmV2PC9hPjwvbGk+XG4gICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICA8L3Rmb290PlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgdWwgPSAkdGFibGUuZmluZCgndGZvb3QgdWwnKVxuICAgICAgICBmb3IgaSBpbiBfLnJhbmdlKDEsIHBhZ2VzICsgMSlcbiAgICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj4je2l9PC9hPjwvbGk+XG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5OZXh0PC9hPjwvbGk+XG4gICAgICAgIFwiXCJcIlxuICAgICAgICAkdGFibGUuZmluZCgnbGkgYScpLmNsaWNrIChlKSAtPlxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICRhID0gJCh0aGlzKVxuICAgICAgICAgIHRleHQgPSAkYS50ZXh0KClcbiAgICAgICAgICBpZiB0ZXh0IGlzICdOZXh0J1xuICAgICAgICAgICAgYSA9ICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5uZXh0KCkuZmluZCgnYScpXG4gICAgICAgICAgICB1bmxlc3MgYS50ZXh0KCkgaXMgJ05leHQnXG4gICAgICAgICAgICAgIGEuY2xpY2soKVxuICAgICAgICAgIGVsc2UgaWYgdGV4dCBpcyAnUHJldidcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykucHJldigpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdQcmV2J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykucmVtb3ZlQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgICAgICAgICRhLnBhcmVudCgpLmFkZENsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICBuID0gcGFyc2VJbnQodGV4dClcbiAgICAgICAgICAgICR0YWJsZS5maW5kKCd0Ym9keSB0cicpLmhpZGUoKVxuICAgICAgICAgICAgb2Zmc2V0ID0gcGFnZVNpemUgKiAobiAtIDEpXG4gICAgICAgICAgICAkdGFibGUuZmluZChcInRib2R5IHRyXCIpLnNsaWNlKG9mZnNldCwgbipwYWdlU2l6ZSkuc2hvdygpXG4gICAgICAgICQoJHRhYmxlLmZpbmQoJ2xpIGEnKVsxXSkuY2xpY2soKVxuICAgICAgXG4gICAgICBpZiBub1Jvd3NNZXNzYWdlID0gJHRhYmxlLmRhdGEoJ25vLXJvd3MnKVxuICAgICAgICBpZiByb3dzIGlzIDBcbiAgICAgICAgICBwYXJlbnQgPSAkdGFibGUucGFyZW50KCkgICAgXG4gICAgICAgICAgJHRhYmxlLnJlbW92ZSgpXG4gICAgICAgICAgcGFyZW50LnJlbW92ZUNsYXNzICd0YWJsZUNvbnRhaW5lcidcbiAgICAgICAgICBwYXJlbnQuYXBwZW5kIFwiPHA+I3tub1Jvd3NNZXNzYWdlfTwvcD5cIlxuXG4gIGVuYWJsZUxheWVyVG9nZ2xlcnM6ICgpIC0+XG4gICAgZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG4gIGdldENoaWxkcmVuOiAoc2tldGNoQ2xhc3NJZCkgLT5cbiAgICBfLmZpbHRlciBAY2hpbGRyZW4sIChjaGlsZCkgLT4gY2hpbGQuZ2V0U2tldGNoQ2xhc3MoKS5pZCBpcyBza2V0Y2hDbGFzc0lkXG5cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRUYWIiLCJtb2R1bGUuZXhwb3J0cyA9XG4gIFxuICByb3VuZDogKG51bWJlciwgZGVjaW1hbFBsYWNlcykgLT5cbiAgICB1bmxlc3MgXy5pc051bWJlciBudW1iZXJcbiAgICAgIG51bWJlciA9IHBhcnNlRmxvYXQobnVtYmVyKVxuICAgIG11bHRpcGxpZXIgPSBNYXRoLnBvdyAxMCwgZGVjaW1hbFBsYWNlc1xuICAgIE1hdGgucm91bmQobnVtYmVyICogbXVsdGlwbGllcikgLyBtdWx0aXBsaWVyIiwidGhpc1tcIlRlbXBsYXRlc1wiXSA9IHRoaXNbXCJUZW1wbGF0ZXNcIl0gfHwge307XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjx0ciBkYXRhLWF0dHJpYnV0ZS1pZD1cXFwiXCIpO18uYihfLnYoXy5mKFwiaWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiIGRhdGEtYXR0cmlidXRlLWV4cG9ydGlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJleHBvcnRpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtdHlwZT1cXFwiXCIpO18uYihfLnYoXy5mKFwidHlwZVwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcIm5hbWVcXFwiPlwiKTtfLmIoXy52KF8uZihcIm5hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRkIGNsYXNzPVxcXCJ2YWx1ZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiZm9ybWF0dGVkVmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvdHI+XCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2F0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjx0YWJsZSBjbGFzcz1cXFwiYXR0cmlidXRlc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsNDQsODEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCIsYyxwLFwiICAgIFwiKSk7fSk7Yy5wb3AoKTt9Xy5iKFwiPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2dlbmVyaWNBdHRyaWJ1dGVzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgQXR0cmlidXRlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiLGMscCxcIiAgICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3JlcG9ydExvYWRpbmdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0TG9hZGluZ1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxkaXYgY2xhc3M9XFxcInNwaW5uZXJcXFwiPjM8L2Rpdj4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UmVxdWVzdGluZyBSZXBvcnQgZnJvbSBTZXJ2ZXI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwicHJvZ3Jlc3MgcHJvZ3Jlc3Mtc3RyaXBlZCBhY3RpdmVcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJiYXJcXFwiIHN0eWxlPVxcXCJ3aWR0aDogMTAwJTtcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiByZWw9XFxcImRldGFpbHNcXFwiPmRldGFpbHM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImRldGFpbHNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJUZW1wbGF0ZXNcIl07IiwiT3ZlcnZpZXdUYWIgPSByZXF1aXJlICcuL292ZXJ2aWV3VGFiLmNvZmZlZSdcbkhhYml0YXRUYWIgPSByZXF1aXJlICcuL2hhYml0YXRUYWIuY29mZmVlJ1xuRmlzaGluZ1ZhbHVlVGFiID0gcmVxdWlyZSAnLi9maXNoaW5nVmFsdWUuY29mZmVlJ1xuXG53aW5kb3cuYXBwLnJlZ2lzdGVyUmVwb3J0IChyZXBvcnQpIC0+XG4gIHJlcG9ydC50YWJzIFtPdmVydmlld1RhYiwgSGFiaXRhdFRhYiwgRmlzaGluZ1ZhbHVlVGFiXVxuICAjIHBhdGggbXVzdCBiZSByZWxhdGl2ZSB0byBkaXN0L1xuICByZXBvcnQuc3R5bGVzaGVldHMgWycuL2Zpc2hTYW5jdHVhcnkuY3NzJ10iLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuXG5jbGFzcyBGaXNoaW5nVmFsdWVUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ0Zpc2hpbmcgVmFsdWUnXG4gIGNsYXNzTmFtZTogJ2Zpc2hpbmdWYWx1ZSdcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5maXNoaW5nVmFsdWVcbiAgZGVwZW5kZW5jaWVzOiBbJ0Zpc2hpbmdWYWx1ZSddXG4gIHRpbWVvdXQ6IDEyMDAwMFxuICBhcmVhTGFiZWw6ICdwcm90ZWN0ZWQgYXJlYSdcblxuICByZW5kZXI6ICgpIC0+XG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICBwZXJjZW50OiBAcmVjb3JkU2V0KCdGaXNoaW5nVmFsdWUnLCAnRmlzaGluZ1ZhbHVlJykuZmxvYXQoJ1BFUkNFTlQnLCAyKVxuICAgICAgYXJlYUxhYmVsOiBAYXJlYUxhYmVsXG4gICAgXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgdGVtcGxhdGVzKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBGaXNoaW5nVmFsdWVUYWIiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuXG5jbGFzcyBIYWJpdGF0VGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdIYWJpdGF0J1xuICBjbGFzc05hbWU6ICdoYWJpdGF0J1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmhhYml0YXRcbiAgZGVwZW5kZW5jaWVzOiBbJ0JhcmJ1ZGFIYWJpdGF0J11cbiAgcGFyYW1OYW1lOiAnSGFiaXRhdHMnXG4gIHRpbWVvdXQ6IDEyMDAwMFxuICBoZWFkaW5nOiBcIkhhYml0YXQgUmVwcmVzZW50YXRpb25cIlxuICBcbiAgcmVuZGVyOiAoKSAtPlxuICAgIGRlcE5hbWUgPSBAZGVwZW5kZW5jaWVzWzBdXG4gICAgZGF0YSA9IEByZWNvcmRTZXQoZGVwTmFtZSwgQHBhcmFtTmFtZSkudG9BcnJheSgpXG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICBoYWJpdGF0czogZGF0YVxuICAgICAgaGVhZGluZzogQGhlYWRpbmdcbiAgICBcbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCB0ZW1wbGF0ZXMpXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcblxubW9kdWxlLmV4cG9ydHMgPSBIYWJpdGF0VGFiIiwibW9kdWxlLmV4cG9ydHMgPSBcbiAgU0FOQ1RVQVJZX0lEOiAnNTFmYWViZWY4ZmFhMzA5YjdjMDVkZTAyJ1xuICBBUVVBQ1VMVFVSRV9JRDogJzUyMGJiMWMwMGJkMjJjOWIyMTQ3Yjk5YidcbiAgTU9PUklOR19JRDogJzUyMGQzZGM0Njc0NjU5Y2I3YjM0ODBmNSdcbiAgRklTSElOR19QUklPUklUWV9BUkVBX0lEOiAnNTIwYmIxZDAwYmQyMmM5YjIxNDdiOWQwJ1xuICBOT19ORVRfWk9ORVNfSUQ6ICc1MjRjNWJjMjJmYmQ3MjYxMTcwMDAwMzQnXG4iLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxucm91bmQgPSByZXF1aXJlKCdhcGkvdXRpbHMnKS5yb3VuZFxuaWRzID0gcmVxdWlyZSAnLi9pZHMuY29mZmVlJ1xuZm9yIGtleSwgdmFsdWUgb2YgaWRzXG4gIHdpbmRvd1trZXldID0gdmFsdWVcblxuXG5UT1RBTF9BUkVBID0gMTc1Ljk1ICMgc3EgbWlsZXNcbiMgRGlhbWV0ZXIgZXZhbHVhdGlvbiBhbmQgdmlzdWFsaXphdGlvbiBwYXJhbWV0ZXJzXG5SRUNPTU1FTkRFRF9ESUFNRVRFUiA9IFxuICBtaW46IDJcbiAgbWF4OiAzXG5cbmNsYXNzIE92ZXJ2aWV3VGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdTaXplJ1xuICBjbGFzc05hbWU6ICdvdmVydmlldydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5vdmVydmlld1xuXG4gIGRlcGVuZGVuY2llczogWydEaWFtZXRlciddXG4gIHRpbWVvdXQ6IDYwMDAwXG4gICMgIHJlbmRlck1pbmltdW1XaWR0aDogdHJ1ZVxuICByZW5kZXI6ICgpIC0+XG4gICAgTUlOX0RJQU0gPSBAcmVjb3JkU2V0KCdEaWFtZXRlcicsICdEaWFtZXRlcicpLmZsb2F0KCdNSU5fRElBTScpXG4gICAgU1FfTUlMRVMgPSBAcmVjb3JkU2V0KCdEaWFtZXRlcicsICdEaWFtZXRlcicpLmZsb2F0KCdTUV9NSUxFUycpXG4gICAgUEVSQ0VOVCA9IChTUV9NSUxFUyAvIFRPVEFMX0FSRUEpICogMTAwLjBcbiAgICBpZiBNSU5fRElBTSA+IFJFQ09NTUVOREVEX0RJQU1FVEVSLm1pblxuICAgICAgRElBTV9PSyA9IHRydWVcbiAgICBcbiAgICBza2lkID0gQG1vZGVsLmdldEF0dHJpYnV0ZSgnU0NfSUQnKVxuICAgIGlzTm9OZXRab25lID0gKEBza2V0Y2hDbGFzcy5pZCBpcyBOT19ORVRfWk9ORVNfSUQpXG4gICAgcmVuZGVyTWluaW11bVdpZHRoID0gKCFpc05vTmV0Wm9uZSlcbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYW55QXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKS5sZW5ndGggPiAwXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgZGVzY3JpcHRpb246IEBtb2RlbC5nZXRBdHRyaWJ1dGUoJ0RFU0NSSVBUSU9OJylcbiAgICAgIGhhc0Rlc2NyaXB0aW9uOiBAbW9kZWwuZ2V0QXR0cmlidXRlKCdERVNDUklQVElPTicpPy5sZW5ndGggPiAwXG4gICAgICBESUFNX09LOiBESUFNX09LXG4gICAgICBTUV9NSUxFUzogU1FfTUlMRVNcbiAgICAgIERJQU06IE1JTl9ESUFNXG4gICAgICBNSU5fRElBTTogUkVDT01NRU5ERURfRElBTUVURVIubWluXG4gICAgICByZW5kZXJNaW5pbXVtV2lkdGg6IHJlbmRlck1pbmltdW1XaWR0aFxuICAgICAgUEVSQ0VOVDogcm91bmQoUEVSQ0VOVCwgMClcbiAgICAgIGlzTm9OZXRab25lOiBpc05vTmV0Wm9uZVxuICAgIFxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuICAgIGlmIHJlbmRlck1pbmltdW1XaWR0aFxuICAgICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcbiAgICAgIEBkcmF3Vml6KE1JTl9ESUFNKVxuXG4gIGRyYXdWaXo6IChkaWFtKSAtPlxuICAgIGlmIHdpbmRvdy5kM1xuICAgICAgZWwgPSBAJCgnLnZpeicpWzBdXG4gICAgICBtYXhTY2FsZSA9IGQzLm1heChbUkVDT01NRU5ERURfRElBTUVURVIubWF4ICogMS4yLCBkaWFtICogMS4yXSlcbiAgICAgIHJhbmdlcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdCZWxvdyByZWNvbW1lbmRlZCdcbiAgICAgICAgICBzdGFydDogMFxuICAgICAgICAgIGVuZDogUkVDT01NRU5ERURfRElBTUVURVIubWluXG4gICAgICAgICAgYmc6IFwiIzhlNWU1MFwiXG4gICAgICAgICAgY2xhc3M6ICdiZWxvdydcbiAgICAgICAgfVxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ1JlY29tbWVuZGVkJ1xuICAgICAgICAgIHN0YXJ0OiBSRUNPTU1FTkRFRF9ESUFNRVRFUi5taW5cbiAgICAgICAgICBlbmQ6IFJFQ09NTUVOREVEX0RJQU1FVEVSLm1heFxuICAgICAgICAgIGJnOiAnIzU4OGUzZidcbiAgICAgICAgICBjbGFzczogJ3JlY29tbWVuZGVkJ1xuICAgICAgICB9XG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnQWJvdmUgcmVjb21tZW5kZWQnXG4gICAgICAgICAgc3RhcnQ6IFJFQ09NTUVOREVEX0RJQU1FVEVSLm1heFxuICAgICAgICAgIGVuZDogbWF4U2NhbGVcbiAgICAgICAgICBjbGFzczogJ2Fib3ZlJ1xuICAgICAgICB9XG4gICAgICBdXG5cbiAgICAgIHggPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAuZG9tYWluKFswLCBtYXhTY2FsZV0pXG4gICAgICAgIC5yYW5nZShbMCwgNDAwXSlcbiAgICAgIFxuICAgICAgY2hhcnQgPSBkMy5zZWxlY3QoZWwpXG4gICAgICBjaGFydC5zZWxlY3RBbGwoXCJkaXYucmFuZ2VcIilcbiAgICAgICAgLmRhdGEocmFuZ2VzKVxuICAgICAgLmVudGVyKCkuYXBwZW5kKFwiZGl2XCIpXG4gICAgICAgIC5zdHlsZShcIndpZHRoXCIsIChkKSAtPiB4KGQuZW5kIC0gZC5zdGFydCkgKyAncHgnKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIChkKSAtPiBcInJhbmdlIFwiICsgZC5jbGFzcylcbiAgICAgICAgLmFwcGVuZChcInNwYW5cIilcbiAgICAgICAgICAudGV4dCgoZCkgLT4gaWYgeChkLmVuZCAtIGQuc3RhcnQpID4gMTEwIHRoZW4gZC5uYW1lIGVsc2UgJycpXG4gICAgICAgICAgLmFwcGVuZChcInNwYW5cIilcbiAgICAgICAgICAgIC50ZXh0IChkKSAtPlxuICAgICAgICAgICAgICBpZiBkLmNsYXNzIGlzICdhYm92ZSdcbiAgICAgICAgICAgICAgICBcIj4gI3tkLnN0YXJ0fSBtaWxlc1wiXG4gICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBcIiN7ZC5zdGFydH0tI3tkLmVuZH0gbWlsZXNcIlxuXG4gICAgICBjaGFydC5zZWxlY3RBbGwoXCJkaXYuZGlhbVwiKVxuICAgICAgICAuZGF0YShbZGlhbV0pXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImRpYW1cIilcbiAgICAgICAgLnN0eWxlKFwibGVmdFwiLCAoZCkgLT4geChkKSArICdweCcpXG4gICAgICAgIC50ZXh0KChkKSAtPiBcIlwiKVxuXG5cbm1vZHVsZS5leHBvcnRzID0gT3ZlcnZpZXdUYWIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFxdWFjdWx0dXJlRmlzaGluZ1ZhbHVlXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkZpc2hpbmcgVmFsdWU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyBhcXVhY3VsdHVyZSBhcmVhIGRpc3BsYWNlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBvZiB0aGUgZmlzaGluZyB2YWx1ZSB3aXRoaW4gQmFyYnVkYeKAmXMgd2F0ZXJzLCBiYXNlZCBvbiB1c2VyIHJlcG9ydGVkXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIHZhbHVlcyBvZiBmaXNoaW5nIGdyb3VuZHMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MjQxZWE3ZGUwZmJhMTFmM2QwMTAwMTFcXFwiPnNob3cgZmlzaGluZyB2YWx1ZXMgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFycmF5RmlzaGluZ1ZhbHVlXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRpc3BsYWNlZCBGaXNoaW5nIFZhbHVlPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInNhbmN0dWFyaWVzXCIsYyxwLDEpLGMscCwwLDEwMywzODksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe2lmKF8ucyhfLmYoXCJhcXVhY3VsdHVyZUFyZWFzXCIsYyxwLDEpLGMscCwwLDEyOSwzNjMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICBUaGlzIHByb3Bvc2FsIGluY2x1ZGVzIGJvdGggU2FuY3R1YXJ5IGFuZCBBcXVhY3VsdHVyZSBhcmVhcywgZGlzcGxhY2luZ1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNhbmN0dWFyeVBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IGFuZCA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImFxdWFjdWx0dXJlQXJlYVBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBvZiBmaXNoaW5nIHZhbHVlIHdpdGhpbiBCYXJidWRhJ3Mgd2F0ZXJzLCByZXNwZWN0aXZlbHkuXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO319KTtjLnBvcCgpO31pZihfLnMoXy5mKFwic2FuY3R1YXJpZXNcIixjLHAsMSksYyxwLDAsNDI2LDc2NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7aWYoIV8ucyhfLmYoXCJhcXVhY3VsdHVyZUFyZWFzXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgIFRoaXMgcHJvcG9zYWwgaW5jbHVkZXMgXCIpO18uYihfLnYoXy5mKFwibnVtU2FuY3R1YXJpZXNcIixjLHAsMCkpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcIik7aWYoXy5zKF8uZihcInNhbmNQbHVyYWxcIixjLHAsMSksYyxwLDAsNTE4LDUyOSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiU2FuY3R1YXJpZXNcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJzYW5jUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiU2FuY3R1YXJ5XCIpO307Xy5iKFwiLFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBkaXNwbGFjaW5nIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2FuY3R1YXJ5UGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgZmlzaGluZyB2YWx1ZSB3aXRoaW4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEJhcmJ1ZGEncyB3YXRlcnMgYmFzZWQgb24gdXNlciByZXBvcnRlZCB2YWx1ZXMgb2YgZmlzaGluZyBncm91bmRzLlwiKTtfLmIoXCJcXG5cIik7fTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcInNhbmN0dWFyaWVzXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7aWYoXy5zKF8uZihcImFxdWFjdWx0dXJlQXJlYXNcIixjLHAsMSksYyxwLDAsODI4LDExMzUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8YnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxicj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyBwcm9wb3NhbCBpbmNsdWRlcyBcIik7Xy5iKF8udihfLmYoXCJudW1BcXVhY3VsdHVyZUFyZWFzXCIsYyxwLDApKSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQXF1YWN1bHR1cmUgQXJlYVwiKTtpZihfLnMoXy5mKFwiYXF1YWN1bHR1cmVBcmVhc1BsdXJhbFwiLGMscCwxKSxjLHAsMCw5NDUsOTQ2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIixcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgZGlzcGxhY2luZyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImFxdWFjdWx0dXJlQXJlYVBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIGZpc2hpbmcgdmFsdWUgd2l0aGluIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBCYXJidWRhJ3Mgd2F0ZXJzIGJhc2VkIG9uIHVzZXIgcmVwb3J0ZWQgdmFsdWVzIG9mIGZpc2hpbmcgZ3JvdW5kcy5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fX07aWYoXy5zKF8uZihcIm1vb3JpbmdzXCIsYyxwLDEpLGMscCwwLDExOTUsMTUyNSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxicj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGJyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcIik7Xy5iKF8udihfLmYoXCJudW1Nb29yaW5nc1wiLGMscCwwKSkpO18uYihcIiBNb29yaW5nIEFyZWFcIik7aWYoXy5zKF8uZihcIm1vb3JpbmdzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDEyNjUsMTI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwicyBhcmVcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiIFwiKTtpZighXy5zKF8uZihcIm1vb3JpbmdzUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiaXNcIik7fTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBhbHNvIGluY2x1ZGVkLCB3aGljaCBjb3ZlclwiKTtpZighXy5zKF8uZihcIm1vb3JpbmdzUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic1wiKTt9O18uYihcIiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm1vb3JpbmdBcmVhUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIHJlZ2lvbmFsIGZpc2hpbmcgdmFsdWUuIE1vb3JpbmcgYXJlYXMgbWF5IGRpc3BsYWNlIGZpc2hpbmcgYWN0aXZpdGllcy5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNOb05ldFpvbmVzXCIsYyxwLDEpLGMscCwwLDE1NjEsMTkwMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxicj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGJyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcIik7Xy5iKF8udihfLmYoXCJudW1Ob05ldFpvbmVzXCIsYyxwLDApKSk7Xy5iKFwiIE5vdCBOZXQgWm9uZVwiKTtpZihfLnMoXy5mKFwibm9OZXRab25lc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwxNjM1LDE2NDAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInMgYXJlXCIpO30pO2MucG9wKCk7fV8uYihcIiBcIik7aWYoIV8ucyhfLmYoXCJub05ldFpvbmVzUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiaXNcIik7fTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBhbHNvIGluY2x1ZGVkLCB3aGljaCBjb3ZlclwiKTtpZighXy5zKF8uZihcIm5vTmV0Wm9uZXNQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzXCIpO307Xy5iKFwiIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibm9OZXRab25lc1BlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICByZWdpb25hbCBmaXNoaW5nIHZhbHVlLiBObyBOZXQgWm9uZXMgbWF5IGRpc3BsYWNlIGZpc2hpbmcgYWN0aXZpdGllcy5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTI0MWVhN2RlMGZiYTExZjNkMDEwMDExXFxcIj5zaG93IGZpc2hpbmcgdmFsdWVzIGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImZpc2hpbmdBcmVhc1wiLGMscCwxKSxjLHAsMCwyMDQyLDI0MTQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlByaW9yaXR5IEZpc2hpbmcgQXJlYXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyBwcm9wb3NhbCBpbmNsdWRlcyBcIik7Xy5iKF8udihfLmYoXCJudW1GaXNoaW5nQXJlYXNcIixjLHAsMCkpKTtfLmIoXCIgRmlzaGluZyBQcmlvcml0eSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQXJlYVwiKTtpZihfLnMoXy5mKFwiZmlzaGluZ0FyZWFQdXJhbFwiLGMscCwxKSxjLHAsMCwyMjE5LDIyMjAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiLCByZXByZXNlbnRpbmdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJmaXNoaW5nQXJlYVBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIHRoZSBmaXNoaW5nIHZhbHVlIHdpdGhpbiBCYXJidWRhJ3MgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIHdhdGVycyBiYXNlZCBvbiB1c2VyIHJlcG9ydGVkIHZhbHVlcyBvZiBmaXNoaW5nIGdyb3VuZHNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fXJldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiYXJyYXlIYWJpdGF0c1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5mKFwic2FuY3R1YXJpZXNcIixjLHAsMSksYyxwLDAsMTYsOTE5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5IYWJpdGF0cyB3aXRoaW4gXCIpO18uYihfLnYoXy5mKFwibnVtU2FuY3R1YXJpZXNcIixjLHAsMCkpKTtfLmIoXCIgXCIpO2lmKCFfLnMoXy5mKFwic2FuY3R1YXJ5UGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiU2FuY3R1YXJ5XCIpO307aWYoXy5zKF8uZihcInNhbmN0dWFyeVBsdXJhbFwiLGMscCwxKSxjLHAsMCwxNzAsMTgxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJTYW5jdHVhcmllc1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlBlcmNlbnQgb2YgVG90YWwgSGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+TWVldHMgMzMlIGdvYWw8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwic2FuY3R1YXJ5SGFiaXRhdFwiLGMscCwxKSxjLHAsMCw0MDMsNjE2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHIgY2xhc3M9XFxcIlwiKTtpZihfLnMoXy5mKFwibWVldHNHb2FsXCIsYyxwLDEpLGMscCwwLDQzNSw0NDIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIm1ldEdvYWxcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIYWJUeXBlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiICU8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtpZihfLnMoXy5mKFwibWVldHNHb2FsXCIsYyxwLDEpLGMscCwwLDU0NSw1NDgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInllc1wiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIm1lZXRzR29hbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIm5vXCIpO307Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFBlcmNlbnRhZ2VzIHNob3duIHJlcHJlc2VudCB0aGUgcHJvcG9ydGlvbiBvZiBoYWJpdGF0cyBhdmFpbGFibGUgaW4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEJhcmJ1ZGEncyBlbnRpcmUgMyBuYXV0aWNhbCBtaWxlIGJvdW5kYXJ5IGNhcHR1cmVkIHdpdGhpbiBzYW5jdHVhcmllcy4gPGJyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWY1NTQ1YzA4ZGM0ZjVmMmQyMTYxNDZcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhcXVhY3VsdHVyZUFyZWFzXCIsYyxwLDEpLGMscCwwLDk1OCwxNTg4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5IYWJpdGF0cyB3aXRoaW4gXCIpO18uYihfLnYoXy5mKFwibnVtQXF1YWN1bHR1cmVcIixjLHAsMCkpKTtfLmIoXCIgQXF1YWN1bHR1cmUgQXJlYVwiKTtpZihfLnMoXy5mKFwiYXF1YVBsdXJhbFwiLGMscCwxKSxjLHAsMCwxMDc0LDEwNzUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5QZXJjZW50IG9mIFRvdGFsIEhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXF1YWN1bHR1cmVIYWJpdGF0XCIsYyxwLDEpLGMscCwwLDEyNjIsMTM1MixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhhYlR5cGVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIgJTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8IS0tICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFBlcmNlbnRhZ2VzIHNob3duIHJlcHJlc2VudCB0aGUgcHJvcG9ydGlvbiBvZiBoYWJpdGF0cyBhdmFpbGFibGUgaW4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEJhcmJ1ZGEncyBlbnRpcmUgMyBuYXV0aWNhbCBtaWxlIGJvdW5kYXJ5IGNhcHR1cmVkIHdpdGhpbiBhcXVhY3VsdHVyZSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgYXJlYXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibW9vcmluZ3NcIixjLHAsMSksYyxwLDAsMTYyNCwyMjM1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5IYWJpdGF0cyB3aXRoaW4gXCIpO18uYihfLnYoXy5mKFwibnVtTW9vcmluZ3NcIixjLHAsMCkpKTtfLmIoXCIgTW9vcmluZyBBcmVhXCIpO2lmKF8ucyhfLmYoXCJtb29yaW5nUGx1cmFsXCIsYyxwLDEpLGMscCwwLDE3MzYsMTczNyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlBlcmNlbnQgb2YgVG90YWwgSGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtb29yaW5nRGF0YVwiLGMscCwxKSxjLHAsMCwxOTIwLDIwMTAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIYWJUeXBlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiICU8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPCEtLSAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBQZXJjZW50YWdlcyBzaG93biByZXByZXNlbnQgdGhlIHByb3BvcnRpb24gb2YgaGFiaXRhdHMgYXZhaWxhYmxlIGluIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBCYXJidWRhJ3MgZW50aXJlIDMgbmF1dGljYWwgbWlsZSBib3VuZGFyeSBjYXB0dXJlZCB3aXRoaW4gbW9vcmluZyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgYXJlYXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiZmlzaGluZ0FyZWFzXCIsYyxwLDEpLGMscCwwLDIyNjcsMjkxNixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+SGFiaXRhdHMgd2l0aGluIFwiKTtfLmIoXy52KF8uZihcIm51bUZpc2hpbmdBcmVhc1wiLGMscCwwKSkpO18uYihcIiBGaXNoaW5nIFByaW9yaXR5IEFyZWFcIik7aWYoXy5zKF8uZihcImZpc2hpbmdBcmVhUGx1cmFsXCIsYyxwLDEpLGMscCwwLDIzOTYsMjM5NyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlBlcmNlbnQgb2YgVG90YWwgSGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJmaXNoaW5nQXJlYURhdGFcIixjLHAsMSksYyxwLDAsMjU4OCwyNjc4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSGFiVHlwZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiAlPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgUGVyY2VudGFnZXMgc2hvd24gcmVwcmVzZW50IHRoZSBwcm9wb3J0aW9uIG9mIGhhYml0YXRzIGF2YWlsYWJsZSBpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQmFyYnVkYSdzIGVudGlyZSAzIG5hdXRpY2FsIG1pbGUgYm91bmRhcnkgY2FwdHVyZWQgd2l0aGluIGZpc2hpbmcgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIHByaW9yaXR5IGFyZWFzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc05vTmV0Wm9uZXNcIixjLHAsMSksYyxwLDAsMjk1MywzNTcxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5IYWJpdGF0cyB3aXRoaW4gXCIpO18uYihfLnYoXy5mKFwibnVtTm9OZXRab25lc1wiLGMscCwwKSkpO18uYihcIiBObyBOZXQgWm9uZVwiKTtpZihfLnMoXy5mKFwibm9OZXRab25lc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwzMDY5LDMwNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5QZXJjZW50IG9mIFRvdGFsIEhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibm9OZXRab25lc0RhdGFcIixjLHAsMSksYyxwLDAsMzI1OSwzMzQ5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSGFiVHlwZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiAlPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgUGVyY2VudGFnZXMgc2hvd24gcmVwcmVzZW50IHRoZSBwcm9wb3J0aW9uIG9mIGhhYml0YXRzIGF2YWlsYWJsZSBpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQmFyYnVkYSdzIGVudGlyZSAzIG5hdXRpY2FsIG1pbGUgYm91bmRhcnkgY2FwdHVyZWQgd2l0aGluIG5vIG5ldCB6b25lcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31yZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFycmF5T3ZlcnZpZXdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZChcInNrZXRjaENsYXNzLmRlbGV0ZWRcIixjLHAsMSksYyxwLDAsMjQsMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuXFxcIiBzdHlsZT1cXFwibWFyZ2luLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGlzIHNrZXRjaCB3YXMgY3JlYXRlZCB1c2luZyB0aGUgXFxcIlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCJcXFwiIHRlbXBsYXRlLCB3aGljaCBpc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgbm8gbG9uZ2VyIGF2YWlsYWJsZS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gY29weSB0aGlzIHNrZXRjaCBvciBtYWtlIG5ld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgc2tldGNoZXMgb2YgdGhpcyB0eXBlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHNpemVcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlNpemU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNTa2V0Y2hlc1wiLGMscCwxKSxjLHAsMCwzNjMsODc0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyBjb2xsZWN0aW9uIGlzIGNvbXBvc2VkIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibnVtU2tldGNoZXNcIixjLHAsMCkpKTtfLmIoXCIgem9uZVwiKTtpZihfLnMoXy5mKFwic2tldGNoZXNQbHVyYWxcIixjLHAsMSksYyxwLDAsNDY4LDQ2OSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L3N0cm9uZz4gaW4gYm90aCBvY2VhbiBhbmQgbGFnb29uIHdhdGVycy4gVGhlIGNvbGxlY3Rpb24gaW5jbHVkZXMgYSB0b3RhbCA8ZW0+b2NlYW5pYzwvZW0+IGFyZWEgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzdW1PY2VhbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCB3aGljaCByZXByZXNlbnRzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic3VtT2NlYW5QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBCYXJidWRhJ3Mgd2F0ZXJzLiBJdCBhbHNvIGluY29ycG9yYXRlcyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzdW1MYWdvb25BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgb3IgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzdW1MYWdvb25QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiwgb2YgdGhlIHRvdGFsIDxlbT5sYWdvb24gYXJlYTwvZW0+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc1NhbmN0dWFyaWVzXCIsYyxwLDEpLGMscCwwLDkxNCwxNjUzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIGNvbGxlY3Rpb24gaW5jbHVkZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJudW1TYW5jdHVhcmllc1wiLGMscCwwKSkpO18uYihcIiBcIik7aWYoIV8ucyhfLmYoXCJzYW5jdHVhcmllc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNhbmN0dWFyeVwiKTt9O2lmKF8ucyhfLmYoXCJzYW5jdHVhcmllc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwxMDY3LDEwNzgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNhbmN0dWFyaWVzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvc3Ryb25nPiBpbiBib3RoIG9jZWFuIGFuZCBsYWdvb24gd2F0ZXJzLiBUaGUgXCIpO2lmKCFfLnMoXy5mKFwic2FuY3R1YXJpZXNQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzYW5jdHVhcnlcIik7fTtpZihfLnMoXy5mKFwic2FuY3R1YXJpZXNQbHVyYWxcIixjLHAsMSksYyxwLDAsMTIyMiwxMjMzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzYW5jdHVhcmllc1wiKTt9KTtjLnBvcCgpO31fLmIoXCIgY29udGFpblwiKTtpZighXy5zKF8uZihcInNhbmN0dWFyaWVzUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic1wiKTt9O18uYihcIiBhIHRvdGFsIDxlbT5vY2VhbmljPC9lbT4gYXJlYSBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNhbmN0dWFyeU9jZWFuQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICB3aGljaCByZXByZXNlbnRzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2FuY3R1YXJ5T2NlYW5QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBCYXJidWRhJ3Mgd2F0ZXJzLiBJdCBhbHNvIGluY2x1ZGVzIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNhbmN0dWFyeUxhZ29vbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCBvciA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNhbmN0dWFyeUxhZ29vblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+LCBvZiB0aGUgdG90YWwgPGVtPmxhZ29vbiBhcmVhPC9lbT4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzTm9OZXRab25lc1wiLGMscCwxKSxjLHAsMCwxNjkzLDIzMjksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgY29sbGVjdGlvbiBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bU5vTmV0Wm9uZXNcIixjLHAsMCkpKTtfLmIoXCIgTm8gTmV0IFpvbmVcIik7aWYoXy5zKF8uZihcIm5vTmV0Wm9uZXNQbHVyYWxcIixjLHAsMSksYyxwLDAsMTgwMiwxODAzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvc3Ryb25nPiBpbiBib3RoIG9jZWFuIGFuZCBsYWdvb24gd2F0ZXJzLiBUaGUgTm8gTmV0IFpvbmVcIik7aWYoXy5zKF8uZihcIm5vTmV0Wm9uZXNQbHVyYWxcIixjLHAsMSksYyxwLDAsMTkwMywxOTA0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvc3Ryb25nPiBjb250YWluXCIpO2lmKCFfLnMoXy5mKFwibm9OZXRab25lc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNcIik7fTtfLmIoXCIgYSB0b3RhbCA8ZW0+b2NlYW5pYzwvZW0+IGFyZWEgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJub05ldFpvbmVzT2NlYW5BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm5vTmV0Wm9uZXNPY2VhblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIEJhcmJ1ZGEncyB3YXRlcnMuIEl0IGFsc28gaW5jbHVkZXMgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibm9OZXRab25lc0xhZ29vbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCBvciA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm5vTmV0Wm9uZXNMYWdvb25QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiwgb2YgdGhlIHRvdGFsIDxlbT5sYWdvb24gYXJlYTwvZW0+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc01vb3JpbmdzXCIsYyxwLDEpLGMscCwwLDIzNjYsMjk3OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBjb2xsZWN0aW9uIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibnVtTW9vcmluZ3NcIixjLHAsMCkpKTtfLmIoXCIgTW9vcmluZyBBcmVhXCIpO2lmKF8ucyhfLmYoXCJtb29yaW5nc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwyNDcyLDI0NzMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9zdHJvbmc+IGluIGJvdGggb2NlYW4gYW5kIGxhZ29vbiB3YXRlcnMuIFRoZSBNb29yaW5nIEFyZWFcIik7aWYoXy5zKF8uZihcIm1vb3JpbmdzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDI1NzAsMjU3MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCIgY29udGFpblwiKTtpZighXy5zKF8uZihcIm1vb3JpbmdzUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic1wiKTt9O18uYihcIiBhIHRvdGFsIDxlbT5vY2VhbmljPC9lbT4gYXJlYSBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm1vb3JpbmdzT2NlYW5BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIHdoaWNoIHJlcHJlc2VudHMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJtb29yaW5nc09jZWFuUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgQmFyYnVkYSdzIHdhdGVycy4gSXQgYWxzbyBpbmNsdWRlcyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJtb29yaW5nc0xhZ29vbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCBvciA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm1vb3JpbmdzTGFnb29uUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4sIG9mIHRoZSB0b3RhbCA8ZW0+bGFnb29uIGFyZWE8L2VtPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNBcXVhY3VsdHVyZVwiLGMscCwxKSxjLHAsMCwzMDE2LDM2NjQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgY29sbGVjdGlvbiBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bUFxdWFjdWx0dXJlXCIsYyxwLDApKSk7Xy5iKFwiIEFxdWFjdWx0dXJlIEFyZWFcIik7aWYoXy5zKF8uZihcImFxdWFjdWx0dXJlUGx1cmFsXCIsYyxwLDEpLGMscCwwLDMxMzIsMzEzMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L3N0cm9uZz4gaW4gYm90aCBvY2VhbiBhbmQgbGFnb29uIHdhdGVycy4gVGhlIEFxdWFjdWx0dXJlIEFyZWFcIik7aWYoXy5zKF8uZihcImFxdWFjdWx0dXJlUGx1cmFsXCIsYyxwLDEpLGMscCwwLDMyNDAsMzI0MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCIgY29udGFpblwiKTtpZighXy5zKF8uZihcImFxdWFjdWx0dXJlUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic1wiKTt9O18uYihcIiBhIHRvdGFsIDxlbT5vY2VhbmljPC9lbT4gYXJlYSBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImFxdWFjdWx0dXJlT2NlYW5BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImFxdWFjdWx0dXJlT2NlYW5QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBCYXJidWRhJ3Mgd2F0ZXJzLiBJdCBhbHNvIGluY2x1ZGVzIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImFxdWFjdWx0dXJlTGFnb29uQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIG9yIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiYXF1YWN1bHR1cmVMYWdvb25QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiwgb2YgdGhlIHRvdGFsIDxlbT5sYWdvb24gYXJlYTwvZW0+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc0Zpc2hpbmdBcmVhc1wiLGMscCwxKSxjLHAsMCwzNzA2LDQzNzUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgY29sbGVjdGlvbiBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bUZpc2hpbmdBcmVhc1wiLGMscCwwKSkpO18uYihcIiBGaXNoaW5nIFByaW9yaXR5IEFyZWFcIik7aWYoXy5zKF8uZihcImZpc2hpbmdBcmVhc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwzODI5LDM4MzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9zdHJvbmc+IGluIGJvdGggb2NlYW4gYW5kIGxhZ29vbiB3YXRlcnMuIFRoZSBGaXNoaW5nIFByaW9yaXR5IEFyZWFcIik7aWYoXy5zKF8uZihcImZpc2hpbmdBcmVhc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwzOTQ0LDM5NDUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiIGNvbnRhaW5cIik7aWYoIV8ucyhfLmYoXCJmaXNoaW5nQXJlYXNQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzXCIpO307Xy5iKFwiIGEgdG90YWwgPGVtPm9jZWFuaWM8L2VtPiBhcmVhIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiZmlzaGluZ0FyZWFzT2NlYW5BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImZpc2hpbmdBcmVhc09jZWFuUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgQmFyYnVkYSdzIHdhdGVycy4gSXQgYWxzbyBpbmNsdWRlcyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJmaXNoaW5nQXJlYXNMYWdvb25BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgb3IgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJmaXNoaW5nQXJlYXNMYWdvb25QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiwgb2YgdGhlIHRvdGFsIDxlbT5sYWdvb24gYXJlYTwvZW0+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPCEtLVwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlpvbmVzIGluIHRoaXMgUHJvcG9zYWw8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwidG9jQ29udGFpbmVyXFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCItLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYW55QXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCw0NTM0LDQ2NTgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgQXR0cmlidXRlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiLGMscCxcIiAgXCIpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31yZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFycmF5VHJhZGVvZmZzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlRyYWRlb2ZmczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQ8cCBjbGFzcz1cXFwic21hbGwgdHRpcC10aXBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgVGlwOiBob3ZlciBvdmVyIGEgcHJvcG9zYWwgdG8gc2VlIGRldGFpbHNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PGRpdiAgaWQ9XFxcInRyYWRlb2ZmLWNoYXJ0XFxcIiBjbGFzcz1cXFwidHJhZGVvZmYtY2hhcnRcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImRlbW9cIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UmVwb3J0IFNlY3Rpb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlVzZSByZXBvcnQgc2VjdGlvbnMgdG8gZ3JvdXAgaW5mb3JtYXRpb24gaW50byBtZWFuaW5nZnVsIGNhdGVnb3JpZXM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5EMyBWaXN1YWxpemF0aW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dWwgY2xhc3M9XFxcIm5hdiBuYXYtcGlsbHNcXFwiIGlkPVxcXCJ0YWJzMlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxsaSBjbGFzcz1cXFwiYWN0aXZlXFxcIj48YSBocmVmPVxcXCIjY2hhcnRcXFwiPkNoYXJ0PC9hPjwvbGk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxsaT48YSBocmVmPVxcXCIjZGF0YVRhYmxlXFxcIj5UYWJsZTwvYT48L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC91bD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInRhYi1jb250ZW50XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwidGFiLXBhbmUgYWN0aXZlXFxcIiBpZD1cXFwiY2hhcnRcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwhLS1baWYgSUUgOF0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHAgY2xhc3M9XFxcInVuc3VwcG9ydGVkXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICBUaGlzIHZpc3VhbGl6YXRpb24gaXMgbm90IGNvbXBhdGlibGUgd2l0aCBJbnRlcm5ldCBFeHBsb3JlciA4LiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICBQbGVhc2UgdXBncmFkZSB5b3VyIGJyb3dzZXIsIG9yIHZpZXcgcmVzdWx0cyBpbiB0aGUgdGFibGUgdGFiLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD4gICAgICBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8IVtlbmRpZl0tLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIFNlZSA8Y29kZT5zcmMvc2NyaXB0cy9kZW1vLmNvZmZlZTwvY29kZT4gZm9yIGFuIGV4YW1wbGUgb2YgaG93IHRvIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgdXNlIGQzLmpzIHRvIHJlbmRlciB2aXN1YWxpemF0aW9ucy4gUHJvdmlkZSBhIHRhYmxlLWJhc2VkIHZpZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIGFuZCB1c2UgY29uZGl0aW9uYWwgY29tbWVudHMgdG8gcHJvdmlkZSBhIGZhbGxiYWNrIGZvciBJRTggdXNlcnMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8YnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8YSBocmVmPVxcXCJodHRwOi8vdHdpdHRlci5naXRodWIuaW8vYm9vdHN0cmFwLzIuMy4yL1xcXCI+Qm9vdHN0cmFwIDIueDwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIGlzIGxvYWRlZCB3aXRoaW4gU2VhU2tldGNoIHNvIHlvdSBjYW4gdXNlIGl0IHRvIGNyZWF0ZSB0YWJzIGFuZCBvdGhlciBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIGludGVyZmFjZSBjb21wb25lbnRzLiBqUXVlcnkgYW5kIHVuZGVyc2NvcmUgYXJlIGFsc28gYXZhaWxhYmxlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcInRhYi1wYW5lXFxcIiBpZD1cXFwiZGF0YVRhYmxlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+aW5kZXg8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD52YWx1ZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJjaGFydERhdGFcIixjLHAsMSksYyxwLDAsMTM1MSwxNDE4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPjx0ZD5cIik7Xy5iKF8udihfLmYoXCJpbmRleFwiLGMscCwwKSkpO18uYihcIjwvdGQ+PHRkPlwiKTtfLmIoXy52KF8uZihcInZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIGVtcGhhc2lzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5FbXBoYXNpczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5HaXZlIHJlcG9ydCBzZWN0aW9ucyBhbiA8Y29kZT5lbXBoYXNpczwvY29kZT4gY2xhc3MgdG8gaGlnaGxpZ2h0IGltcG9ydGFudCBpbmZvcm1hdGlvbi48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHdhcm5pbmdcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pldhcm5pbmc8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+T3IgPGNvZGU+d2FybjwvY29kZT4gb2YgcG90ZW50aWFsIHByb2JsZW1zLjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gZGFuZ2VyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5EYW5nZXI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+PGNvZGU+ZGFuZ2VyPC9jb2RlPiBjYW4gYWxzbyBiZSB1c2VkLi4uIHNwYXJpbmdseS48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiZmlzaGluZ1ByaW9yaXR5QXJlYVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5GaXNoaW5nIFZhbHVlPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgZmlzaGluZyBwcmlvcml0eSBhcmVhIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwicGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgdGhlIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBmaXNoaW5nIHZhbHVlIHdpdGhpbiBCYXJidWRhJ3Mgd2F0ZXJzLCBiYXNlZCBvbiB1c2VyIHJlcG9ydGVkIHZhbHVlcyBvZiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgZmlzaGluZyBncm91bmRzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MjQxZWE3ZGUwZmJhMTFmM2QwMTAwMTFcXFwiPnNob3cgZmlzaGluZyB2YWx1ZXMgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImZpc2hpbmdWYWx1ZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5GaXNoaW5nIFZhbHVlPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgXCIpO18uYihfLnYoXy5mKFwiYXJlYUxhYmVsXCIsYyxwLDApKSk7Xy5iKFwiIGRpc3BsYWNlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBvZiB0aGUgZmlzaGluZyB2YWx1ZSB3aXRoaW4gQmFyYnVkYeKAmXMgd2F0ZXJzLCBiYXNlZCBvbiB1c2VyIHJlcG9ydGVkXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIHZhbHVlcyBvZiBmaXNoaW5nIGdyb3VuZHMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MjQxZWE3ZGUwZmJhMTFmM2QwMTAwMTFcXFwiPnNob3cgZmlzaGluZyB2YWx1ZXMgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImhhYml0YXRcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5mKFwiaGVhZGluZ1wiLGMscCwwKSkpO18uYihcIjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+JSBvZiBUb3RhbCBIYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhYml0YXRzXCIsYyxwLDEpLGMscCwwLDIxNiwyNzksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj48dGQ+XCIpO18uYihfLnYoXy5mKFwiSGFiVHlwZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+PHRkPlwiKTtfLmIoXy52KF8uZihcIlBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCI8L3RkPjwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgUGVyY2VudGFnZXMgc2hvd24gcmVwcmVzZW50IHRoZSBwcm9wb3J0aW9uIG9mIGhhYml0YXRzIGF2YWlsYWJsZSBpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQmFyYnVkYSdzIGVudGlyZSAzIG5hdXRpY2FsIG1pbGUgYm91bmRhcnkgY2FwdHVyZWQgd2l0aGluIHRoaXMgem9uZS4gPGJyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWY1NTQ1YzA4ZGM0ZjVmMmQyMTYxNDZcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBzaXplXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TaXplPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgYXJlYSBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIlNRX01JTEVTXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPixcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIlBFUkNFTlRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIEJhcmJ1ZGEncyB3YXRlcnMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwicmVuZGVyTWluaW11bVdpZHRoXCIsYyxwLDEpLGMscCwwLDUzNiwxMTc4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIGRpYW1ldGVyIFwiKTtpZighXy5zKF8uZihcIkRJQU1fT0tcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJ3YXJuaW5nXCIpO307Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5NaW5pbXVtIFdpZHRoPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBtaW5pbXVtIHdpZHRoIG9mIGEgem9uZSBzaWduaWZpY2FudGx5IGltcGFjdHMgIGl0cyBjb25zZXJ2YXRpb24gdmFsdWUuIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgcmVjb21tZW5kZWQgc21hbGxlc3QgZGlhbWV0ZXIgaXMgYmV0d2VlbiAyIGFuZCAzIG1pbGVzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKCFfLnMoXy5mKFwiRElBTV9PS1wiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICBUaGlzIGRlc2lnbiBmYWxscyBvdXRzaWRlIHRoZSByZWNvbW1lbmRhdGlvbiBhdCBcIik7Xy5iKF8udihfLmYoXCJESUFNXCIsYyxwLDApKSk7Xy5iKFwiIG1pbGVzLlwiKTtfLmIoXCJcXG5cIik7fTtpZihfLnMoXy5mKFwiRElBTV9PS1wiLGMscCwxKSxjLHAsMCw5MjYsOTk3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgVGhpcyBkZXNpZ24gZml0cyB3aXRoaW4gdGhlIHJlY29tbWVuZGF0aW9uIGF0IFwiKTtfLmIoXy52KF8uZihcIkRJQU1cIixjLHAsMCkpKTtfLmIoXCIgbWlsZXMuXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC9zdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJ2aXpcXFwiIHN0eWxlPVxcXCJwb3NpdGlvbjpyZWxhdGl2ZTtcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGltZyBzcmM9XFxcImh0dHA6Ly9zMy5hbWF6b25hd3MuY29tL1NlYVNrZXRjaC9wcm9qZWN0cy9iYXJidWRhL21pbl93aWR0aF9leGFtcGxlLnBuZ1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhbnlBdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDEyMjEsMTM0NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fXJldHVybiBfLmZsKCk7O30pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJUZW1wbGF0ZXNcIl07Il19
;