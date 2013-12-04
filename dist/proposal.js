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
        console.log("!!!!!!!!!!!hello: ", _this);
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
          console.log("!!!!!!!!!!!hello: ", _this);
          return _this.trigger('error', (json != null ? (_ref1 = json.error) != null ? _ref1.message : void 0 : void 0) || 'Problem contacting the SeaSketch server');
        }
      }
    });
  };

  return ReportResults;

})(Backbone.Collection);

module.exports = ReportResults;


},{}],"q/XHhM":[function(require,module,exports){
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
      if (_.isArray(this.data.value)) {
        data = this.data.value[0];
      } else {
        data = this.data.value;
      }
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


},{"../templates/templates.js":"am14En","./enableLayerTogglers.coffee":2,"./jobItem.coffee":3,"./reportResults.coffee":4,"./utils.coffee":"RWE//u","views/collectionView":1}],"reportTab":[function(require,module,exports){
module.exports=require('q/XHhM');
},{}],"RWE//u":[function(require,module,exports){
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


},{}],"api/utils":[function(require,module,exports){
module.exports=require('RWE//u');
},{}],"api/templates":[function(require,module,exports){
module.exports=require('am14En');
},{}],"am14En":[function(require,module,exports){
this["Templates"] = this["Templates"] || {};

this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributeItem"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<tr data-attribute-id=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\" data-attribute-exportid=\"");_.b(_.v(_.f("exportid",c,p,0)));_.b("\" data-attribute-type=\"");_.b(_.v(_.f("type",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <td class=\"name\">");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("  <td class=\"value\">");_.b(_.v(_.f("formattedValue",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("</tr>");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributesTable"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<table class=\"attributes\">");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,44,81,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(_.rp("attributes/attributeItem",c,p,"    "));});c.pop();}_.b("</table>");_.b("\n");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/genericAttributes"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/reportLoading"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportLoading\">");_.b("\n" + i);_.b("  <!-- <div class=\"spinner\">3</div> -->");_.b("\n" + i);_.b("  <h4>Requesting Report from Server</h4>");_.b("\n" + i);_.b("  <div class=\"progress progress-striped active\">");_.b("\n" + i);_.b("    <div class=\"bar\" style=\"width: 100%;\"></div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <a href=\"#\" rel=\"details\">details</a>");_.b("\n" + i);_.b("    <div class=\"details\">");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

module.exports = this["Templates"];
},{}],11:[function(require,module,exports){
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

  ArrayFishingValueTab.prototype.dependencies = ['FishingValue'];

  ArrayFishingValueTab.prototype.timeout = 240000;

  ArrayFishingValueTab.prototype.render = function() {
    var aquacultureAreas, aquaculturePercent, context, fishingAreaPercent, fishingAreas, mooringPercent, moorings, noNetZones, noNetZonesPercent, sanctuaries, sanctuaryPercent;
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
    noNetZones = this.getChildren(NO_NET_ZONES_ID);
    if (noNetZones.length) {
      noNetZonesPercent = this.recordSet('FishingValue', 'FishingValue', NO_NET_ZONES_ID).float('PERCENT', 0);
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
      aquacultureAreasPlural: aquacultureAreas.length > 1,
      noNetZonesPercent: noNetZonesPercent,
      numNoNetZones: noNetZones.length,
      hasNoNetZones: noNetZones.length > 0,
      noNetZonesPlural: noNetZones.length > 1
    };
    this.$el.html(this.template.render(context, templates));
    return this.enableLayerTogglers(this.$el);
  };

  return ArrayFishingValueTab;

})(ReportTab);

module.exports = ArrayFishingValueTab;


},{"../templates/templates.js":17,"./ids.coffee":15,"reportTab":"q/XHhM"}],12:[function(require,module,exports){
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

  ArrayHabitatTab.prototype.dependencies = ['BarbudaHabitat'];

  ArrayHabitatTab.prototype.timeout = 240000;

  ArrayHabitatTab.prototype.render = function() {
    var aquaculture, aquacultureAreas, context, fishingAreaData, fishingAreas, mooringData, moorings, noNetZones, noNetZonesData, row, sanctuaries, sanctuary, _i, _len;
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
      mooringData = this.recordSet('BarbudaHabitat', 'Habitats', MOORING_ID).toArray();
    }
    fishingAreas = this.getChildren(FISHING_PRIORITY_AREA_ID);
    if (fishingAreas.length) {
      fishingAreaData = this.recordSet('BarbudaHabitat', 'Habitats', FISHING_PRIORITY_AREA_ID).toArray();
    }
    noNetZones = this.getChildren(NO_NET_ZONES_ID);
    console.log("no net zones!!!!!!!!!", noNetZones);
    if (noNetZones.length) {
      noNetZonesData = this.recordSet('BarbudaHabitat', 'Habitats', NO_NET_ZONES_ID).toArray();
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
      fishingAreaPlural: fishingAreas.length > 1,
      hasNoNetZones: noNetZones.length > 0,
      numNoNetZones: noNetZones.length,
      noNetZonesData: noNetZonesData,
      noNetZonesPlural: noNetZones.length > 1
    };
    this.$el.html(this.template.render(context, templates));
    return this.enableLayerTogglers(this.$el);
  };

  return ArrayHabitatTab;

})(ReportTab);

module.exports = ArrayHabitatTab;


},{"../templates/templates.js":17,"./ids.coffee":15,"reportTab":"q/XHhM"}],13:[function(require,module,exports){
var ArrayOverviewTab, ReportTab, TOTAL_AREA, TOTAL_LAGOON_AREA, ids, key, partials, round, templates, val, value, _partials, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

ids = require('./ids.coffee');

for (key in ids) {
  value = ids[key];
  window[key] = value;
}

round = require('api/utils').round;

TOTAL_AREA = 164.8;

TOTAL_LAGOON_AREA = 11.1;

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
    var aquacultureAreas, aquacultureLagoonArea, aquacultureLagoonPercent, aquacultureOceanArea, aquacultureOceanPercent, context, fishingAreas, fishingAreasLagoonArea, fishingAreasLagoonPercent, fishingAreasOceanArea, fishingAreasOceanPercent, hasSketches, moorings, mooringsLagoonArea, mooringsLagoonPercent, mooringsOceanArea, mooringsOceanPercent, noNetZones, noNetZonesLagoonArea, noNetZonesLagoonPercent, noNetZonesOceanArea, noNetZonesOceanPercent, numAquacultureAreas, numFishingAreas, numMoorings, numNoNetZones, numSanctuaries, numTotalZones, sanctuaries, sanctuaryLagoonArea, sanctuaryLagoonPercent, sanctuaryOceanArea, sanctuaryOceanPercent, sumLagoonArea, sumLagoonPercent, sumOceanArea, sumOceanPercent;
    sanctuaries = [];
    aquacultureAreas = [];
    moorings = [];
    noNetZones = [];
    fishingAreas = [];
    sanctuaries = _.filter(this.children, function(c) {
      return c.get('sketchclass') === SANCTUARY_ID;
    });
    numSanctuaries = sanctuaries.length;
    if (numSanctuaries > 0) {
      sanctuaryOceanArea = this.recordSet('Diameter', 'Diameter', SANCTUARY_ID).float('OCEAN_AREA', 1);
      sanctuaryLagoonArea = this.recordSet('Diameter', 'Diameter', SANCTUARY_ID).float('LAGOON_AREA', 1);
      sanctuaryOceanPercent = this.recordSet('Diameter', 'Diameter', SANCTUARY_ID).float('OCEAN_PERCENT', 1);
      sanctuaryLagoonPercent = this.recordSet('Diameter', 'Diameter', SANCTUARY_ID).float('LAGOON_PERCENT', 1);
    } else {
      sanctuaryOceanArea = 0;
      sanctuaryOceanPercent = 0.0;
      sanctuaryLagoonArea = 0;
      sanctuaryLagoonPercent = 0.0;
    }
    aquacultureAreas = _.filter(this.children, function(c) {
      return c.get('sketchclass') === AQUACULTURE_ID;
    });
    numAquacultureAreas = aquacultureAreas.length;
    if (numAquacultureAreas > 0) {
      aquacultureOceanArea = this.recordSet('Diameter', 'Diameter', AQUACULTURE_ID).float('OCEAN_AREA', 1);
      aquacultureLagoonArea = this.recordSet('Diameter', 'Diameter', AQUACULTURE_ID).float('LAGOON_AREA', 1);
      aquacultureOceanPercent = this.recordSet('Diameter', 'Diameter', AQUACULTURE_ID).float('OCEAN_PERCENT', 1);
      aquacultureLagoonPercent = this.recordSet('Diameter', 'Diameter', AQUACULTURE_ID).float('LAGOON_PERCENT', 1);
    } else {
      aquacultureOceanArea = 0;
      aquacultureOceanPercent = 0.0;
      aquacultureLagoonArea = 0;
      aquacultureLagoonPercent = 0.0;
    }
    moorings = _.filter(this.children, function(c) {
      return c.get('sketchclass') === MOORING_ID;
    });
    numMoorings = moorings.length;
    if (numMoorings > 0) {
      mooringsOceanArea = this.recordSet('Diameter', 'Diameter', MOORING_ID).float('OCEAN_AREA', 1);
      mooringsLagoonArea = this.recordSet('Diameter', 'Diameter', MOORING_ID).float('LAGOON_AREA', 1);
      mooringsOceanPercent = this.recordSet('Diameter', 'Diameter', MOORING_ID).float('OCEAN_PERCENT', 1);
      mooringsLagoonPercent = this.recordSet('Diameter', 'Diameter', MOORING_ID).float('LAGOON_PERCENT', 1);
    } else {
      mooringsOceanArea = 0;
      mooringsOceanPercent = 0.0;
      mooringsLagoonArea = 0;
      mooringsLagoonPercent = 0.0;
    }
    noNetZones = _.filter(this.children, function(c) {
      return c.get('sketchclass') === NO_NET_ZONES_ID;
    });
    numNoNetZones = noNetZones.length;
    if (numNoNetZones > 0) {
      noNetZonesOceanArea = this.recordSet('Diameter', 'Diameter', NO_NET_ZONES_ID).float('OCEAN_AREA', 1);
      noNetZonesLagoonArea = this.recordSet('Diameter', 'Diameter', NO_NET_ZONES_ID).float('LAGOON_AREA', 1);
      noNetZonesOceanPercent = this.recordSet('Diameter', 'Diameter', NO_NET_ZONES_ID).float('OCEAN_PERCENT', 1);
      noNetZonesLagoonPercent = this.recordSet('Diameter', 'Diameter', NO_NET_ZONES_ID).float('LAGOON_PERCENT', 1);
    } else {
      noNetZonesOceanArea = 0;
      noNetZonesOceanPercent = 0.0;
      noNetZonesLagoonArea = 0;
      noNetZonesLagoonPercent = 0.0;
    }
    fishingAreas = _.filter(this.children, function(c) {
      return c.get('sketchclass') === FISHING_PRIORITY_AREA_ID;
    });
    numFishingAreas = fishingAreas.length;
    if (numFishingAreas > 0) {
      fishingAreasOceanArea = this.recordSet('Diameter', 'Diameter', FISHING_PRIORITY_AREA_ID).float('OCEAN_AREA', 0);
      fishingAreasLagoonArea = this.recordSet('Diameter', 'Diameter', FISHING_PRIORITY_AREA_ID).float('LAGOON_AREA', 0);
      fishingAreasOceanPercent = this.recordSet('Diameter', 'Diameter', FISHING_PRIORITY_AREA_ID).float('OCEAN_PERCENT', 0);
      fishingAreasLagoonPercent = this.recordSet('Diameter', 'Diameter', FISHING_PRIORITY_AREA_ID).float('LAGOON_PERCENT', 0);
    } else {
      fishingAreasOceanArea = 0;
      fishingAreasOceanPercent = 0.0;
      fishingAreasLagoonArea = 0;
      fishingAreasLagoonPercent = 0.0;
    }
    numTotalZones = numSanctuaries + numNoNetZones + numAquacultureAreas + numMoorings + numFishingAreas;
    sumOceanArea = sanctuaryOceanArea + noNetZonesOceanArea + aquacultureOceanArea + mooringsOceanArea + fishingAreasOceanArea;
    sumOceanPercent = sanctuaryOceanPercent + noNetZonesOceanPercent + aquacultureOceanPercent + mooringsOceanPercent + fishingAreasOceanPercent;
    sumLagoonArea = sanctuaryLagoonArea + noNetZonesLagoonArea + aquacultureLagoonArea + mooringsLagoonArea + fishingAreasLagoonArea;
    sumLagoonPercent = sanctuaryLagoonPercent + noNetZonesLagoonPercent + aquacultureLagoonPercent + mooringsLagoonPercent + fishingAreasLagoonPercent;
    hasSketches = numTotalZones > 0;
    console.log("num sancts", numSanctuaries);
    console.log("num no net", numNoNetZones);
    console.log("num aq", numAquacultureAreas);
    console.log("num moorings", numMoorings);
    console.log("numFishing ", numFishingAreas);
    console.log("num total zones", numTotalZones);
    console.log("has sketches: ", hasSketches);
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      anyAttributes: this.model.getAttributes().length > 0,
      admin: this.project.isAdmin(window.user),
      numSanctuaries: sanctuaries.length,
      hasSanctuaries: sanctuaries.length > 0,
      sanctuariesPlural: sanctuaries.length > 1,
      sanctuaryOceanPercent: round(sanctuaryOceanPercent, 2),
      sanctuaryOceanArea: round(sanctuaryOceanArea, 1),
      sanctuaryLagoonArea: round(sanctuaryLagoonArea, 2),
      sanctuaryLagoonPercent: round(sanctuaryLagoonPercent, 1),
      numNoNetZones: noNetZones.length,
      hasNoNetZones: noNetZones.length > 0,
      noNetZonesPlural: noNetZones.length > 1,
      noNetZonesOceanPercent: round(noNetZonesOceanPercent, 2),
      noNetZonesOceanArea: round(noNetZonesOceanArea, 1),
      noNetZonesLagoonArea: round(noNetZonesLagoonArea, 2),
      noNetZonesLagoonPercent: round(noNetZonesLagoonPercent, 1),
      numAquaculture: aquacultureAreas.length,
      hasAquaculture: aquacultureAreas.length > 0,
      aquaculturePlural: aquacultureAreas.length > 1,
      aquacultureOceanPercent: round(aquacultureOceanPercent, 2),
      aquacultureOceanArea: round(aquacultureOceanArea, 1),
      aquacultureLagoonArea: round(aquacultureLagoonArea, 2),
      aquacultureLagoonPercent: round(aquacultureLagoonPercent, 1),
      numMoorings: moorings.length,
      hasMoorings: moorings.length > 0,
      mooringsPlural: moorings.length > 1,
      mooringsOceanPercent: round(mooringsOceanPercent, 2),
      mooringsOceanArea: round(mooringsOceanArea, 1),
      mooringsLagoonArea: round(mooringsLagoonArea, 2),
      mooringsLagoonPercent: round(mooringsLagoonPercent, 1),
      numFishingAreas: fishingAreas.length,
      hasFishingAreas: fishingAreas.length > 0,
      fishingAreasPlural: fishingAreas.length > 1,
      fishingAreasOceanPercent: round(fishingAreasOceanPercent, 2),
      fishingAreasOceanArea: round(fishingAreasOceanArea, 1),
      fishingAreasLagoonArea: round(fishingAreasLagoonArea, 2),
      fishingAreasLagoonPercent: round(fishingAreasLagoonPercent, 1),
      hasSketches: hasSketches,
      sketchesPlural: numTotalZones > 1,
      numSketches: numTotalZones,
      sumOceanArea: sumOceanArea,
      sumOceanPercent: sumOceanPercent,
      sumLagoonPercent: sumLagoonPercent,
      sumLagoonArea: sumLagoonArea
    };
    return this.$el.html(this.template.render(context, partials));
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


},{"../templates/templates.js":17,"./ids.coffee":15,"api/templates":"am14En","api/utils":"RWE//u","reportTab":"q/XHhM"}],14:[function(require,module,exports){
var ArrayTradeoffsTab, ReportTab, TOTAL_AREA, TOTAL_LAGOON_AREA, key, partials, round, templates, val, _partials, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

round = require('api/utils').round;

TOTAL_AREA = 164.8;

TOTAL_LAGOON_AREA = 11.1;

_partials = require('api/templates');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

ArrayTradeoffsTab = (function(_super) {
  var calc_ttip, formatAxis, getColors, getStrokeColor;

  __extends(ArrayTradeoffsTab, _super);

  function ArrayTradeoffsTab() {
    this.scatterplot = __bind(this.scatterplot, this);
    _ref = ArrayTradeoffsTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ArrayTradeoffsTab.prototype.name = 'Tradeoffs';

  ArrayTradeoffsTab.prototype.className = 'tradeoffs';

  ArrayTradeoffsTab.prototype.template = templates.arrayTradeoffs;

  ArrayTradeoffsTab.prototype.dependencies = ['TradeoffsPropId'];

  ArrayTradeoffsTab.prototype.timeout = 120000;

  ArrayTradeoffsTab.prototype.render = function() {
    var ch, context, h, halfh, halfw, margin, mychart, tooltip, totalh, totalw, tradeoff_data, w;
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user)
    };
    this.$el.html(this.template.render(context, partials));
    tradeoff_data = this.recordSet('TradeoffsPropId', 'TradeoffsPropId').toArray();
    h = 380;
    w = 380;
    margin = {
      left: 40,
      top: 5,
      right: 40,
      bottom: 40,
      inner: 5
    };
    halfh = h + margin.top + margin.bottom;
    totalh = halfh * 2;
    halfw = w + margin.left + margin.right;
    totalw = halfw * 2;
    mychart = this.scatterplot().xvar(0).yvar(1).xlab("Fishing Value").ylab("Ecological Value").height(h).width(w).margin(margin);
    ch = d3.select(this.$('.tradeoff-chart'));
    ch.datum(tradeoff_data).call(mychart);
    tooltip = d3.select("body").append("div").attr("class", "chart-tooltip").attr("id", "chart-tooltip").text("data");
    mychart.pointsSelect().on("mouseover", function(d) {
      return tooltip.style("visibility", "visible").html("<ul><strong>Proposal: " + d.PROPOSAL + "</strong><li> Fishing value: " + d.FISH_VAL + "</li><li> Conservation value: " + d.ECO_VAL + "</li></ul>");
    });
    mychart.pointsSelect().on("mousemove", function(d) {
      return tooltip.style("top", (event.pageY - 10) + "px").style("left", (calc_ttip(event.pageX, d, tooltip)) + "px");
    });
    mychart.pointsSelect().on("mouseout", function(d) {
      return tooltip.style("visibility", "hidden");
    });
    mychart.labelsSelect().on("mouseover", function(d) {
      return tooltip.style("visibility", "visible").html("<ul><strong>Proposal: " + d.PROPOSAL + "</strong><li> Fishing value: " + d.FISH_VAL + "</li><li> Conservation value: " + d.ECO_VAL + "</li></ul>");
    });
    mychart.labelsSelect().on("mousemove", function(d) {
      return tooltip.style("top", (event.pageY - 10) + "px").style("left", (calc_ttip(event.pageX, d, tooltip)) + "px");
    });
    return mychart.labelsSelect().on("mouseout", function(d) {
      return tooltip.style("visibility", "hidden");
    });
  };

  calc_ttip = function(xloc, data, tooltip) {
    var tdiv, tleft, tw;
    tdiv = tooltip[0][0].getBoundingClientRect();
    tleft = tdiv.left;
    tw = tdiv.width;
    if (xloc + tw > tleft + tw) {
      return xloc - (tw + 10);
    }
    return xloc + 10;
  };

  ArrayTradeoffsTab.prototype.scatterplot = function() {
    var axispos, chart, el, height, labelsSelect, legendSelect, legendheight, margin, nxticks, nyticks, pointsSelect, pointsize, rectcolor, view, width, xlab, xlim, xscale, xticks, ylab, ylim, yscale, yticks;
    view = this;
    width = 380;
    height = 600;
    margin = {
      left: 40,
      top: 5,
      right: 40,
      bottom: 40,
      inner: 5
    };
    axispos = {
      xtitle: 25,
      ytitle: 30,
      xlabel: 5,
      ylabel: 5
    };
    xlim = null;
    ylim = null;
    nxticks = 5;
    xticks = null;
    nyticks = 5;
    yticks = null;
    rectcolor = "#dbe4ee";
    pointsize = 5;
    xlab = "X";
    ylab = "Y score";
    yscale = d3.scale.linear();
    xscale = d3.scale.linear();
    legendheight = 300;
    pointsSelect = null;
    labelsSelect = null;
    legendSelect = null;
    if (window.d3) {
      view.$('.tradeoff-chart').html('');
      el = view.$('.tradeoff-chart')[0];
    }
    chart = function(selection) {
      return selection.each(function(data) {
        var currelem, g, labels, na_value, panelheight, paneloffset, panelwidth, points, svg, x, xaxis, xrange, xs, y, yaxis, yrange, ys;
        x = data.map(function(d) {
          return parseFloat(d.FISH_VAL);
        });
        y = data.map(function(d) {
          return parseFloat(d.ECO_VAL);
        });
        paneloffset = 0;
        panelwidth = width;
        panelheight = height;
        if (!(xlim != null)) {
          xlim = [d3.min(x) - 2, parseFloat(d3.max(x) + 2)];
        }
        if (!(ylim != null)) {
          ylim = [d3.min(y) - 2, parseFloat(d3.max(y) + 2)];
        }
        na_value = d3.min(x.concat(y)) - 100;
        currelem = d3.select(view.$('.tradeoff-chart')[0]);
        svg = d3.select(view.$('.tradeoff-chart')[0]).append("svg").data([data]);
        svg.append("g");
        svg.attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom + data.length * 35);
        g = svg.select("g");
        g.append("rect").attr("x", paneloffset + margin.left).attr("y", margin.top).attr("height", panelheight).attr("width", panelwidth).attr("fill", rectcolor).attr("stroke", "none");
        xrange = [margin.left + paneloffset + margin.inner, margin.left + paneloffset + panelwidth - margin.inner];
        yrange = [margin.top + panelheight - margin.inner, margin.top + margin.inner];
        xscale.domain(xlim).range(xrange);
        yscale.domain(ylim).range(yrange);
        xs = d3.scale.linear().domain(xlim).range(xrange);
        ys = d3.scale.linear().domain(ylim).range(yrange);
        if (!(yticks != null)) {
          yticks = ys.ticks(nyticks);
        }
        if (!(xticks != null)) {
          xticks = xs.ticks(nxticks);
        }
        xaxis = g.append("g").attr("class", "x axis");
        xaxis.selectAll("empty").data(xticks).enter().append("line").attr("x1", function(d) {
          return xscale(d);
        }).attr("x2", function(d) {
          return xscale(d);
        }).attr("y1", margin.top).attr("y2", margin.top + height).attr("fill", "none").attr("stroke", "white").attr("stroke-width", 1).style("pointer-events", "none");
        xaxis.selectAll("empty").data(xticks).enter().append("text").attr("x", function(d) {
          return xscale(d);
        }).attr("y", margin.top + height + axispos.xlabel).text(function(d) {
          return formatAxis(xticks)(d);
        });
        xaxis.append("text").attr("class", "xaxis-title").attr("x", margin.left + width / 2).attr("y", margin.top + height + axispos.xtitle).text(xlab);
        xaxis.selectAll("empty").data(data).enter().append("circle").attr("cx", function(d, i) {
          return margin.left;
        }).attr("cy", function(d, i) {
          return margin.top + height + axispos.xtitle + ((i + 1) * 30) + 6;
        }).attr("class", function(d, i) {
          return "pt" + i;
        }).attr("r", pointsize).attr("fill", function(d, i) {
          var col;
          val = i % 17;
          col = getColors(val);
          return col;
        }).attr("stroke", function(d, i) {
          var col;
          val = Math.floor(i / 17) % 5;
          col = getStrokeColor(val);
          return col;
        }).attr("stroke-width", "1");
        xaxis.selectAll("empty").data(data).enter().append("text").attr("class", "legend-text").attr("x", function(d, i) {
          return margin.left + 20;
        }).attr("y", function(d, i) {
          return margin.top + height + axispos.xtitle + ((i + 1) * 30);
        }).text(function(d) {
          return d.PROPOSAL;
        });
        yaxis = g.append("g").attr("class", "y axis");
        yaxis.selectAll("empty").data(yticks).enter().append("line").attr("y1", function(d) {
          return yscale(d);
        }).attr("y2", function(d) {
          return yscale(d);
        }).attr("x1", margin.left).attr("x2", margin.left + width).attr("fill", "none").attr("stroke", "white").attr("stroke-width", 1).style("pointer-events", "none");
        yaxis.selectAll("empty").data(yticks).enter().append("text").attr("y", function(d) {
          return yscale(d);
        }).attr("x", margin.left - axispos.ylabel).text(function(d) {
          return formatAxis(yticks)(d);
        });
        yaxis.append("text").attr("class", "title").attr("y", margin.top + height / 2).attr("x", margin.left - axispos.ytitle).text(ylab).attr("transform", "rotate(270," + (margin.left - axispos.ytitle) + "," + (margin.top + height / 2) + ")");
        labels = g.append("g").attr("id", "labels");
        labelsSelect = labels.selectAll("empty").data(data).enter().append("text").text(function(d) {
          return d.PROPOSAL;
        }).attr("x", function(d, i) {
          var overlap_xstart, string_end, xpos;
          xpos = xscale(x[i]);
          string_end = xpos + this.getComputedTextLength();
          overlap_xstart = xpos - (this.getComputedTextLength() + 5);
          if (string_end > width) {
            return overlap_xstart;
          }
          return xpos + 5;
        }).attr("y", function(d, i) {
          var ypos;
          ypos = yscale(y[i]);
          if (ypos < 50) {
            return ypos + 10;
          }
          return ypos - 5;
        });
        points = g.append("g").attr("id", "points");
        pointsSelect = points.selectAll("empty").data(data).enter().append("circle").attr("cx", function(d, i) {
          return xscale(x[i]);
        }).attr("cy", function(d, i) {
          return yscale(y[i]);
        }).attr("class", function(d, i) {
          return "pt" + i;
        }).attr("r", pointsize).attr("fill", function(d, i) {
          var col;
          val = i;
          col = getColors([val]);
          return col;
        }).attr("stroke", function(d, i) {
          var col;
          val = Math.floor(i / 17) % 5;
          col = getStrokeColor(val);
          return col;
        }).attr("stroke-width", "1").attr("opacity", function(d, i) {
          if (((x[i] != null) || xNA.handle) && ((y[i] != null) || yNA.handle)) {
            return 1;
          }
          return 0;
        });
        return g.append("rect").attr("x", margin.left + paneloffset).attr("y", margin.top).attr("height", panelheight).attr("width", panelwidth).attr("fill", "none").attr("stroke", "black").attr("stroke-width", "none");
      });
    };
    chart.width = function(value) {
      if (!arguments.length) {
        return width;
      }
      width = value;
      return chart;
    };
    chart.height = function(value) {
      if (!arguments.length) {
        return height;
      }
      height = value;
      return chart;
    };
    chart.margin = function(value) {
      if (!arguments.length) {
        return margin;
      }
      margin = value;
      return chart;
    };
    chart.axispos = function(value) {
      if (!arguments.length) {
        return axispos;
      }
      axispos = value;
      return chart;
    };
    chart.xlim = function(value) {
      if (!arguments.length) {
        return xlim;
      }
      xlim = value;
      return chart;
    };
    chart.nxticks = function(value) {
      if (!arguments.length) {
        return nxticks;
      }
      nxticks = value;
      return chart;
    };
    chart.xticks = function(value) {
      if (!arguments.length) {
        return xticks;
      }
      xticks = value;
      return chart;
    };
    chart.ylim = function(value) {
      if (!arguments.length) {
        return ylim;
      }
      ylim = value;
      return chart;
    };
    chart.nyticks = function(value) {
      if (!arguments.length) {
        return nyticks;
      }
      nyticks = value;
      return chart;
    };
    chart.yticks = function(value) {
      if (!arguments.length) {
        return yticks;
      }
      yticks = value;
      return chart;
    };
    chart.rectcolor = function(value) {
      if (!arguments.length) {
        return rectcolor;
      }
      rectcolor = value;
      return chart;
    };
    chart.pointcolor = function(value) {
      var pointcolor;
      if (!arguments.length) {
        return pointcolor;
      }
      pointcolor = value;
      return chart;
    };
    chart.pointsize = function(value) {
      if (!arguments.length) {
        return pointsize;
      }
      pointsize = value;
      return chart;
    };
    chart.pointstroke = function(value) {
      var pointstroke;
      if (!arguments.length) {
        return pointstroke;
      }
      pointstroke = value;
      return chart;
    };
    chart.xlab = function(value) {
      if (!arguments.length) {
        return xlab;
      }
      xlab = value;
      return chart;
    };
    chart.ylab = function(value) {
      if (!arguments.length) {
        return ylab;
      }
      ylab = value;
      return chart;
    };
    chart.xvar = function(value) {
      var xvar;
      if (!arguments.length) {
        return xvar;
      }
      xvar = value;
      return chart;
    };
    chart.yvar = function(value) {
      var yvar;
      if (!arguments.length) {
        return yvar;
      }
      yvar = value;
      return chart;
    };
    chart.yscale = function() {
      return yscale;
    };
    chart.xscale = function() {
      return xscale;
    };
    chart.pointsSelect = function() {
      return pointsSelect;
    };
    chart.labelsSelect = function() {
      return labelsSelect;
    };
    chart.legendSelect = function() {
      return legendSelect;
    };
    return chart;
  };

  getColors = function(i) {
    var colors;
    colors = ["LightGreen", "LightPink", "LightSkyBlue", "Moccasin", "BlueViolet", "Gainsboro", "DarkGreen", "DarkTurquoise", "maroon", "navy", "LemonChiffon", "orange", "red", "silver", "teal", "white", "black"];
    return colors[i];
  };

  getStrokeColor = function(i) {
    var scolors;
    scolors = ["black", "white", "gray", "brown", "Navy"];
    return scolors[i];
  };

  formatAxis = function(d) {
    var ndig;
    d = d[1] - d[0];
    ndig = Math.floor(Math.log(d % 10) / Math.log(10));
    if (ndig > 0) {
      ndig = 0;
    }
    ndig = Math.abs(ndig);
    return d3.format("." + ndig + "f");
  };

  return ArrayTradeoffsTab;

})(ReportTab);

module.exports = ArrayTradeoffsTab;


},{"../templates/templates.js":17,"api/templates":"am14En","api/utils":"RWE//u","reportTab":"q/XHhM"}],15:[function(require,module,exports){
module.exports = {
  SANCTUARY_ID: '51faebef8faa309b7c05de02',
  AQUACULTURE_ID: '520bb1c00bd22c9b2147b99b',
  MOORING_ID: '520d3dc4674659cb7b3480f5',
  FISHING_PRIORITY_AREA_ID: '520bb1d00bd22c9b2147b9d0',
  NO_NET_ZONES_ID: '524c5bc22fbd726117000034'
};


},{}],16:[function(require,module,exports){
var ArrayFishingValueTab, ArrayHabitatTab, ArrayOverviewTab, ArrayTradeoffsTab, templates;

templates = require('../templates/templates.js');

ArrayOverviewTab = require('./arrayOverviewTab.coffee');

ArrayHabitatTab = require('./arrayHabitatTab.coffee');

ArrayFishingValueTab = require('./arrayFishingValueTab.coffee');

ArrayTradeoffsTab = require('./arrayTradeoffs.coffee');

window.app.registerReport(function(report) {
  report.tabs([ArrayOverviewTab, ArrayHabitatTab, ArrayFishingValueTab, ArrayTradeoffsTab]);
  return report.stylesheets(['./proposal.css']);
});


},{"../templates/templates.js":17,"./arrayFishingValueTab.coffee":11,"./arrayHabitatTab.coffee":12,"./arrayOverviewTab.coffee":13,"./arrayTradeoffs.coffee":14}],17:[function(require,module,exports){
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
},{}]},{},[16])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL2JhcmJ1ZGEtcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9fZW1wdHkuanMiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL2JhcmJ1ZGEtcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9lbmFibGVMYXllclRvZ2dsZXJzLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvYmFyYnVkYS1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2pvYkl0ZW0uY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9iYXJidWRhLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0UmVzdWx0cy5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL2JhcmJ1ZGEtcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9yZXBvcnRUYWIuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9iYXJidWRhLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvdXRpbHMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9iYXJidWRhLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL2JhcmJ1ZGEtcmVwb3J0cy12Mi9zY3JpcHRzL2FycmF5RmlzaGluZ1ZhbHVlVGFiLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvYmFyYnVkYS1yZXBvcnRzLXYyL3NjcmlwdHMvYXJyYXlIYWJpdGF0VGFiLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvYmFyYnVkYS1yZXBvcnRzLXYyL3NjcmlwdHMvYXJyYXlPdmVydmlld1RhYi5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL2JhcmJ1ZGEtcmVwb3J0cy12Mi9zY3JpcHRzL2FycmF5VHJhZGVvZmZzLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvYmFyYnVkYS1yZXBvcnRzLXYyL3NjcmlwdHMvaWRzLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvYmFyYnVkYS1yZXBvcnRzLXYyL3NjcmlwdHMvcHJvcG9zYWwuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9iYXJidWRhLXJlcG9ydHMtdjIvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0FDQUEsQ0FBTyxDQUFVLENBQUEsR0FBWCxDQUFOLEVBQWtCO0NBQ2hCLEtBQUEsMkVBQUE7Q0FBQSxDQUFBLENBQUE7Q0FBQSxDQUNBLENBQUEsR0FBWTtDQURaLENBRUEsQ0FBQSxHQUFNO0FBQ0MsQ0FBUCxDQUFBLENBQUEsQ0FBQTtDQUNFLEVBQUEsQ0FBQSxHQUFPLHFCQUFQO0NBQ0EsU0FBQTtJQUxGO0NBQUEsQ0FNQSxDQUFXLENBQUEsSUFBWCxhQUFXO0NBRVg7Q0FBQSxNQUFBLG9DQUFBO3dCQUFBO0NBQ0UsRUFBVyxDQUFYLEdBQVcsQ0FBWDtDQUFBLEVBQ1MsQ0FBVCxFQUFBLEVBQWlCLEtBQVI7Q0FDVDtDQUNFLEVBQU8sQ0FBUCxFQUFBLFVBQU87Q0FBUCxFQUNPLENBQVAsQ0FEQSxDQUNBO0FBQytCLENBRi9CLENBRThCLENBQUUsQ0FBaEMsRUFBQSxFQUFRLENBQXdCLEtBQWhDO0NBRkEsQ0FHeUIsRUFBekIsRUFBQSxFQUFRLENBQVI7TUFKRjtDQU1FLEtBREk7Q0FDSixDQUFnQyxFQUFoQyxFQUFBLEVBQVEsUUFBUjtNQVRKO0NBQUEsRUFSQTtDQW1CUyxDQUFULENBQXFCLElBQXJCLENBQVEsQ0FBUjtDQUNFLEdBQUEsVUFBQTtDQUFBLEVBQ0EsQ0FBQSxFQUFNO0NBRE4sRUFFTyxDQUFQLEtBQU87Q0FDUCxHQUFBO0NBQ0UsR0FBSSxFQUFKLFVBQUE7QUFDMEIsQ0FBdEIsQ0FBcUIsQ0FBdEIsQ0FBSCxDQUFxQyxJQUFWLElBQTNCLENBQUE7TUFGRjtDQUlTLEVBQXFFLENBQUEsQ0FBNUUsUUFBQSx5REFBTztNQVJVO0NBQXJCLEVBQXFCO0NBcEJOOzs7O0FDQWpCLElBQUEsR0FBQTtHQUFBO2tTQUFBOztBQUFNLENBQU47Q0FDRTs7Q0FBQSxFQUFXLE1BQVgsS0FBQTs7Q0FBQSxDQUFBLENBQ1EsR0FBUjs7Q0FEQSxFQUdFLEtBREY7Q0FDRSxDQUNFLEVBREYsRUFBQTtDQUNFLENBQVMsSUFBVCxDQUFBLE1BQUE7Q0FBQSxDQUNZLEVBRFosRUFDQSxJQUFBO0NBREEsQ0FFWSxJQUFaLElBQUE7U0FBYTtDQUFBLENBQ0wsRUFBTixFQURXLElBQ1g7Q0FEVyxDQUVGLEtBQVQsR0FBQSxFQUZXO1VBQUQ7UUFGWjtNQURGO0NBQUEsQ0FRRSxFQURGLFFBQUE7Q0FDRSxDQUFTLElBQVQsQ0FBQSxDQUFTLEdBQUE7Q0FBVCxDQUNTLENBQUEsR0FBVCxDQUFBLEVBQVM7Q0FDUCxHQUFBLFFBQUE7Q0FBQyxFQUFELENBQUMsQ0FBSyxHQUFOLEVBQUE7Q0FGRixNQUNTO0NBRFQsQ0FHWSxFQUhaLEVBR0EsSUFBQTtDQUhBLENBSU8sQ0FBQSxFQUFQLENBQUEsR0FBTztDQUNMLEVBQUcsQ0FBQSxDQUFNLEdBQVQsR0FBRztDQUNELEVBQW9CLENBQVEsQ0FBSyxDQUFiLENBQUEsR0FBYixDQUFvQixNQUFwQjtNQURULElBQUE7Q0FBQSxnQkFHRTtVQUpHO0NBSlAsTUFJTztNQVpUO0NBQUEsQ0FrQkUsRUFERixLQUFBO0NBQ0UsQ0FBUyxJQUFULENBQUEsQ0FBQTtDQUFBLENBQ08sQ0FBQSxFQUFQLENBQUEsR0FBUTtDQUNOLGVBQU87Q0FBUCxRQUFBLE1BQ087Q0FEUCxrQkFFSTtDQUZKLFFBQUEsTUFHTztDQUhQLGtCQUlJO0NBSkosU0FBQSxLQUtPO0NBTFAsa0JBTUk7Q0FOSixNQUFBLFFBT087Q0FQUCxrQkFRSTtDQVJKO0NBQUEsa0JBVUk7Q0FWSixRQURLO0NBRFAsTUFDTztNQW5CVDtDQUFBLENBZ0NFLEVBREYsVUFBQTtDQUNFLENBQVMsSUFBVCxDQUFBLE1BQUE7Q0FBQSxDQUNPLENBQUEsRUFBUCxDQUFBLEdBQVE7Q0FDTixXQUFBO0NBQUEsRUFBSyxHQUFMLEVBQUEsU0FBSztDQUNMLEVBQWMsQ0FBWCxFQUFBLEVBQUg7Q0FDRSxFQUFBLENBQUssTUFBTDtVQUZGO0NBR0EsRUFBVyxDQUFYLFdBQU87Q0FMVCxNQUNPO0NBRFAsQ0FNUyxDQUFBLEdBQVQsQ0FBQSxFQUFVO0NBQ1EsRUFBSyxDQUFkLElBQUEsR0FBUCxJQUFBO0NBUEYsTUFNUztNQXRDWDtDQUFBLENBeUNFLEVBREYsS0FBQTtDQUNFLENBQVMsSUFBVCxDQUFBO0NBQUEsQ0FDWSxFQURaLEVBQ0EsSUFBQTtDQURBLENBRVMsQ0FBQSxHQUFULENBQUEsRUFBVTtDQUNQLEVBQUQ7Q0FIRixNQUVTO0NBRlQsQ0FJTyxDQUFBLEVBQVAsQ0FBQSxHQUFRO0NBQ04sR0FBRyxJQUFILENBQUE7Q0FDTyxDQUFhLEVBQWQsS0FBSixRQUFBO01BREYsSUFBQTtDQUFBLGdCQUdFO1VBSkc7Q0FKUCxNQUlPO01BN0NUO0NBSEYsR0FBQTs7Q0FzRGEsQ0FBQSxDQUFBLEVBQUEsWUFBRTtDQUNiLEVBRGEsQ0FBRCxDQUNaO0NBQUEsR0FBQSxtQ0FBQTtDQXZERixFQXNEYTs7Q0F0RGIsRUF5RFEsR0FBUixHQUFRO0NBQ04sRUFBSSxDQUFKLG9NQUFBO0NBUUMsR0FBQSxHQUFELElBQUE7Q0FsRUYsRUF5RFE7O0NBekRSOztDQURvQixPQUFROztBQXFFOUIsQ0FyRUEsRUFxRWlCLEdBQVgsQ0FBTjs7OztBQ3JFQSxJQUFBLFNBQUE7R0FBQTs7a1NBQUE7O0FBQU0sQ0FBTjtDQUVFOztDQUFBLEVBQXdCLENBQXhCLGtCQUFBOztDQUVhLENBQUEsQ0FBQSxDQUFBLEVBQUEsaUJBQUU7Q0FDYixFQUFBLEtBQUE7Q0FBQSxFQURhLENBQUQsRUFDWjtDQUFBLEVBRHNCLENBQUQ7Q0FDckIsa0NBQUE7Q0FBQSxDQUFjLENBQWQsQ0FBQSxFQUErQixLQUFqQjtDQUFkLEdBQ0EseUNBQUE7Q0FKRixFQUVhOztDQUZiLEVBTU0sQ0FBTixLQUFNO0NBQ0osT0FBQSxJQUFBO0NBQUMsR0FBQSxDQUFELE1BQUE7Q0FBTyxDQUNJLENBQUEsR0FBVCxDQUFBLEVBQVM7Q0FDUCxXQUFBLDBCQUFBO0NBQUEsSUFBQyxDQUFELENBQUEsQ0FBQTtDQUNBO0NBQUEsWUFBQSw4QkFBQTs2QkFBQTtDQUNFLEVBQUcsQ0FBQSxDQUE2QixDQUF2QixDQUFULENBQUcsRUFBSDtBQUNTLENBQVAsR0FBQSxDQUFRLEdBQVIsSUFBQTtDQUNFLENBQStCLENBQW5CLENBQUEsQ0FBWCxHQUFELEdBQVksR0FBWixRQUFZO2NBRGQ7Q0FFQSxpQkFBQTtZQUpKO0NBQUEsUUFEQTtDQU9BLEdBQW1DLENBQUMsR0FBcEM7Q0FBQSxJQUFzQixDQUFoQixFQUFOLEVBQUEsR0FBQTtVQVBBO0NBUUEsQ0FBNkIsQ0FBaEIsQ0FBVixDQUFrQixDQUFSLENBQVYsQ0FBSCxDQUE4QjtDQUFELGdCQUFPO0NBQXZCLFFBQWdCO0NBQzFCLENBQWtCLENBQWMsRUFBaEMsQ0FBRCxDQUFBLE1BQWlDLEVBQWQsRUFBbkI7TUFERixJQUFBO0NBR0csSUFBQSxFQUFELEdBQUEsT0FBQTtVQVpLO0NBREosTUFDSTtDQURKLENBY0UsQ0FBQSxFQUFQLENBQUEsR0FBUTtDQUNOLFdBQUEsS0FBQTtDQUFBLENBQWtDLENBQWxDLEVBQUEsRUFBTyxDQUFQLFlBQUE7Q0FDQSxFQUFVLENBQUgsQ0FBYyxDQUFkLEVBQVA7Q0FDRSxHQUFtQixFQUFuQixJQUFBO0NBQ0U7Q0FDRSxFQUFPLENBQVAsQ0FBTyxPQUFBLEVBQVA7TUFERixRQUFBO0NBQUE7Y0FERjtZQUFBO0NBS0EsR0FBbUMsQ0FBQyxHQUFwQyxFQUFBO0NBQUEsSUFBc0IsQ0FBaEIsRUFBTixJQUFBLENBQUE7WUFMQTtDQUFBLENBTWtDLENBQWxDLEVBQUEsRUFBTyxHQUFQLFVBQUE7Q0FDQyxHQUNDLENBREQsRUFBRCxVQUFBLHdCQUFBO1VBVkc7Q0FkRixNQWNFO0NBZkwsS0FDSjtDQVBGLEVBTU07O0NBTk47O0NBRjBCLE9BQVE7O0FBcUNwQyxDQXJDQSxFQXFDaUIsR0FBWCxDQUFOLE1BckNBOzs7O0FDQUEsSUFBQSx3R0FBQTtHQUFBOzs7d0pBQUE7O0FBQUEsQ0FBQSxFQUFzQixJQUFBLFlBQXRCLFdBQXNCOztBQUN0QixDQURBLEVBQ1EsRUFBUixFQUFRLFNBQUE7O0FBQ1IsQ0FGQSxFQUVnQixJQUFBLE1BQWhCLFdBQWdCOztBQUNoQixDQUhBLEVBR0ksSUFBQSxvQkFBQTs7QUFDSixDQUpBLEVBS0UsTUFERjtDQUNFLENBQUEsV0FBQSx1Q0FBaUI7Q0FMbkIsQ0FBQTs7QUFNQSxDQU5BLEVBTVUsSUFBVixXQUFVOztBQUNWLENBUEEsRUFPaUIsSUFBQSxPQUFqQixRQUFpQjs7QUFFWCxDQVROO0NBV2UsQ0FBQSxDQUFBLENBQUEsU0FBQSxNQUFFO0NBQTZCLEVBQTdCLENBQUQ7Q0FBOEIsRUFBdEIsQ0FBRDtDQUF1QixFQUFoQixDQUFELFNBQWlCO0NBQTVDLEVBQWE7O0NBQWIsRUFFUyxJQUFULEVBQVM7Q0FDUCxHQUFBLElBQUE7T0FBQSxLQUFBO0NBQUEsR0FBQSxTQUFBO0NBQ0UsQ0FBMkIsQ0FBcEIsQ0FBUCxDQUFPLENBQVAsR0FBNEI7Q0FDMUIsV0FBQSxNQUFBO0NBQTRCLElBQUEsRUFBQTtDQUR2QixNQUFvQjtBQUVwQixDQUFQLEdBQUEsRUFBQTtDQUNFLEVBQTRDLENBQUMsU0FBN0MsQ0FBTyx3QkFBQTtRQUpYO01BQUE7Q0FNRSxHQUFHLENBQUEsQ0FBSCxDQUFHO0NBQ0QsRUFBTyxDQUFQLENBQW1CLEdBQW5CO01BREYsRUFBQTtDQUdFLEVBQU8sQ0FBUCxDQUFBLEdBQUE7UUFUSjtNQUFBO0NBVUMsQ0FBb0IsQ0FBckIsQ0FBVSxHQUFXLENBQXJCLENBQXNCLEVBQXRCO0NBQ1UsTUFBRCxNQUFQO0NBREYsSUFBcUI7Q0FidkIsRUFFUzs7Q0FGVCxFQWdCQSxDQUFLLEtBQUM7Q0FDSixJQUFBLEdBQUE7Q0FBQSxDQUEwQixDQUFsQixDQUFSLENBQUEsRUFBYyxFQUFhO0NBQ3JCLEVBQUEsQ0FBQSxTQUFKO0NBRE0sSUFBa0I7Q0FBMUIsQ0FFd0IsQ0FBaEIsQ0FBUixDQUFBLENBQVEsR0FBaUI7Q0FBRCxHQUFVLENBQVEsUUFBUjtDQUExQixJQUFnQjtDQUN4QixHQUFBLENBQVEsQ0FBTDtDQUNELEVBQUEsQ0FBYSxFQUFiLENBQU87Q0FBUCxFQUNJLENBQUgsRUFBRCxLQUFBLElBQUEsV0FBa0I7Q0FDbEIsRUFBZ0MsQ0FBaEMsUUFBTyxjQUFBO0NBQ0ssR0FBTixDQUFLLENBSmI7Q0FLRSxJQUFhLFFBQU47TUFMVDtDQU9FLElBQUEsUUFBTztNQVhOO0NBaEJMLEVBZ0JLOztDQWhCTCxFQTZCQSxDQUFLLEtBQUM7Q0FDSixFQUFBLEtBQUE7Q0FBQSxFQUFBLENBQUE7Q0FDQSxFQUFHLENBQUgsR0FBRztDQUNBLENBQVUsQ0FBWCxLQUFBLEtBQUE7TUFERjtDQUdXLEVBQVQsS0FBQSxLQUFBO01BTEM7Q0E3QkwsRUE2Qks7O0NBN0JMLENBb0NjLENBQVAsQ0FBQSxDQUFQLElBQVEsSUFBRDtDQUNMLEVBQUEsS0FBQTs7R0FEMEIsR0FBZDtNQUNaO0NBQUEsRUFBQSxDQUFBO0NBQ0EsRUFBRyxDQUFILEdBQUc7Q0FDQSxDQUFVLENBQVgsTUFBWSxJQUFaO0NBQTBCLENBQUssQ0FBWCxFQUFBLFFBQUEsRUFBQTtDQUFwQixNQUFXO01BRGI7Q0FHUSxDQUFLLENBQVgsRUFBQSxRQUFBO01BTEc7Q0FwQ1AsRUFvQ087O0NBcENQLEVBMkNNLENBQU4sS0FBTztDQUNMLEVBQUEsS0FBQTtDQUFBLEVBQUEsQ0FBQTtDQUNBLEVBQUcsQ0FBSCxHQUFHO0NBQ0EsQ0FBVSxDQUFYLE1BQVksSUFBWjtDQUF3QixFQUFELEVBQTZCLEdBQWhDLEdBQUEsSUFBQTtDQUFwQixNQUFXO01BRGI7Q0FHTSxFQUFELEVBQTZCLEdBQWhDLEdBQUEsRUFBQTtNQUxFO0NBM0NOLEVBMkNNOztDQTNDTjs7Q0FYRjs7QUE2RE0sQ0E3RE47Q0E4REU7Ozs7Ozs7Ozs7OztDQUFBOztDQUFBLEVBQU0sQ0FBTixTQUFBOztDQUFBLENBQUEsQ0FDYyxTQUFkOztDQURBLENBR3NCLENBQVYsRUFBQSxFQUFBLEVBQUUsQ0FBZDtDQU1FLEVBTlksQ0FBRCxDQU1YO0NBQUEsRUFOb0IsQ0FBRCxHQU1uQjtDQUFBLEVBQUEsQ0FBQSxFQUFhO0NBQWIsQ0FDWSxFQUFaLEVBQUEsQ0FBQTtDQURBLENBRTJDLENBQXRCLENBQXJCLENBQXFCLE9BQUEsQ0FBckI7Q0FGQSxDQUc4QixFQUE5QixHQUFBLElBQUEsQ0FBQSxDQUFBO0NBSEEsQ0FJOEIsRUFBOUIsRUFBQSxNQUFBLENBQUEsR0FBQTtDQUpBLENBSzhCLEVBQTlCLEVBQUEsSUFBQSxFQUFBLENBQUE7Q0FMQSxDQU0wQixFQUExQixFQUFzQyxFQUF0QyxFQUFBLEdBQUE7Q0FDQyxDQUE2QixFQUE3QixLQUFELEVBQUEsQ0FBQSxDQUFBLEVBQUE7Q0FoQkYsRUFHWTs7Q0FIWixFQWtCUSxHQUFSLEdBQVE7Q0FDTixTQUFNLHVCQUFOO0NBbkJGLEVBa0JROztDQWxCUixFQXFCTSxDQUFOLEtBQU07Q0FDSixPQUFBLElBQUE7Q0FBQSxFQUFJLENBQUo7Q0FBQSxFQUNXLENBQVgsR0FBQTtBQUM4QixDQUE5QixHQUFBLENBQWdCLENBQW1DLE9BQVA7Q0FDekMsR0FBQSxTQUFEO0NBQ00sR0FBQSxDQUFjLENBRnRCO0NBR0csR0FBQSxFQUFELE9BQUE7TUFORTtDQXJCTixFQXFCTTs7Q0FyQk4sRUE2Qk0sQ0FBTixLQUFNO0NBQ0osRUFBSSxDQUFKO0NBQ0MsRUFBVSxDQUFWLEdBQUQsSUFBQTtDQS9CRixFQTZCTTs7Q0E3Qk4sRUFpQ1EsR0FBUixHQUFRO0NBQ04sR0FBQSxFQUFNLEtBQU4sRUFBQTtDQUFBLEdBQ0EsU0FBQTtDQUZNLFVBR04seUJBQUE7Q0FwQ0YsRUFpQ1E7O0NBakNSLEVBc0NpQixNQUFBLE1BQWpCO0NBQ0csQ0FBUyxDQUFOLENBQUgsRUFBUyxHQUFTLEVBQW5CLEVBQWlDO0NBdkNuQyxFQXNDaUI7O0NBdENqQixDQXlDbUIsQ0FBTixNQUFDLEVBQWQsS0FBYTtBQUNKLENBQVAsR0FBQSxZQUFBO0NBQ0UsRUFBRyxDQUFBLENBQU8sQ0FBVixLQUFBO0NBQ0csR0FBQSxLQUFELE1BQUEsVUFBQTtNQURGLEVBQUE7Q0FHRyxFQUFELENBQUMsS0FBRCxNQUFBO1FBSko7TUFEVztDQXpDYixFQXlDYTs7Q0F6Q2IsRUFnRFcsTUFBWDtDQUNFLEdBQUEsRUFBQSxLQUFBO0NBQUEsR0FDQSxFQUFBLEdBQUE7Q0FDQyxFQUN1QyxDQUR2QyxDQUFELENBQUEsS0FBQSxRQUFBLCtCQUE0QztDQW5EOUMsRUFnRFc7O0NBaERYLEVBdURZLE1BQUEsQ0FBWjtBQUNTLENBQVAsR0FBQSxFQUFBO0NBQ0UsR0FBQyxDQUFELENBQUEsVUFBQTtNQURGO0NBRUMsR0FBQSxPQUFELFFBQUE7Q0ExREYsRUF1RFk7O0NBdkRaLEVBNERtQixNQUFBLFFBQW5CO0NBQ0UsT0FBQSxHQUFBO09BQUEsS0FBQTtDQUFBLEdBQUEsRUFBQTtDQUNFLEVBQVEsQ0FBSyxDQUFiLENBQUEsQ0FBYSxDQUE4QjtDQUEzQyxFQUNPLENBQVAsRUFBQSxDQUFZO0NBRFosRUFFUSxFQUFSLENBQUEsR0FBUTtDQUNMLEdBQUQsQ0FBQyxRQUFhLEVBQWQ7Q0FERixDQUVFLENBQVEsQ0FBUCxHQUZLO0NBR1AsRUFBTyxFQUFSLElBQVEsSUFBUjtDQUNFLENBQXVELENBQXZELEVBQUMsR0FBRCxRQUFBLFlBQUE7Q0FBQSxDQUNnRCxDQUFoRCxDQUFrRCxDQUFqRCxHQUFELFFBQUEsS0FBQTtDQUNDLElBQUEsQ0FBRCxTQUFBLENBQUE7Q0FIRixDQUlFLENBSkYsSUFBUTtNQVBPO0NBNURuQixFQTREbUI7O0NBNURuQixFQXlFa0IsTUFBQSxPQUFsQjtDQUNFLE9BQUEsc0RBQUE7T0FBQSxLQUFBO0NBQUEsRUFBUyxDQUFULEVBQUE7Q0FDQTtDQUFBLFFBQUEsbUNBQUE7dUJBQUE7Q0FDRSxFQUFNLENBQUgsQ0FBQSxDQUFIO0FBQ00sQ0FBSixFQUFpQixDQUFkLENBQVcsQ0FBWCxFQUFIO0NBQ0UsRUFBUyxFQUFBLENBQVQsSUFBQTtVQUZKO1FBREY7Q0FBQSxJQURBO0NBS0EsR0FBQSxFQUFBO0NBQ0UsRUFBVSxDQUFULEVBQUQ7Q0FBQSxHQUNDLENBQUQsQ0FBQSxVQUFBO0NBREEsRUFFZ0IsQ0FBZixFQUFELEVBQUE7Q0FGQSxHQUdDLEVBQUQsV0FBQTtNQVRGO0NBQUEsQ0FXbUMsQ0FBbkMsQ0FBQSxHQUFBLEVBQUEsTUFBQTtDQVhBLEVBWTBCLENBQTFCLENBQUEsSUFBMkIsTUFBM0I7Q0FDRSxLQUFBLFFBQUE7Q0FBQSxHQUNBLENBQUMsQ0FBRCxTQUFBO0NBQ0MsR0FBRCxDQUFDLEtBQUQsR0FBQTtDQUhGLElBQTBCO0NBSTFCO0NBQUE7VUFBQSxvQ0FBQTt1QkFBQTtDQUNFLEVBQVcsQ0FBWCxFQUFBLENBQVc7Q0FBWCxHQUNJLEVBQUo7Q0FEQSxDQUVBLEVBQUMsRUFBRCxJQUFBO0NBSEY7cUJBakJnQjtDQXpFbEIsRUF5RWtCOztDQXpFbEIsQ0ErRlcsQ0FBQSxNQUFYO0NBQ0UsT0FBQSxPQUFBO0NBQUEsRUFBVSxDQUFWLEdBQUEsR0FBVTtDQUFWLENBQ3lCLENBQWhCLENBQVQsRUFBQSxDQUFTLEVBQWlCO0NBQU8sSUFBYyxJQUFmLElBQUE7Q0FBdkIsSUFBZ0I7Q0FDekIsR0FBQSxVQUFBO0NBQ0UsQ0FBVSxDQUE2QixDQUE3QixDQUFBLE9BQUEsUUFBTTtNQUhsQjtDQUlPLEtBQUQsS0FBTjtDQXBHRixFQStGVzs7Q0EvRlgsQ0FzR3dCLENBQVIsRUFBQSxJQUFDLEtBQWpCO0NBQ0UsT0FBQSxDQUFBO0NBQUEsRUFBUyxDQUFULENBQVMsQ0FBVCxHQUFTO0NBQ1Q7Q0FDRSxDQUF3QyxJQUExQixFQUFZLEVBQWMsR0FBakM7TUFEVDtDQUdFLEtBREk7Q0FDSixDQUFPLENBQWUsRUFBZixPQUFBLElBQUE7TUFMSztDQXRHaEIsRUFzR2dCOztDQXRHaEIsRUE2R1ksTUFBQSxDQUFaO0NBQ0UsTUFBQSxDQUFBO0NBQUEsRUFBVSxDQUFWLEVBQTZCLENBQTdCLEVBQThCLElBQU47Q0FBd0IsRUFBUCxHQUFNLEVBQU4sS0FBQTtDQUEvQixJQUFtQjtDQUM3QixFQUFPLENBQVAsR0FBYztDQUNaLEdBQVUsQ0FBQSxPQUFBLEdBQUE7TUFGWjtDQUdDLENBQWlCLENBQUEsR0FBbEIsQ0FBQSxFQUFtQixFQUFuQjtDQUNFLElBQUEsS0FBQTtDQUFPLEVBQVAsQ0FBQSxDQUF5QixDQUFuQixNQUFOO0NBREYsSUFBa0I7Q0FqSHBCLEVBNkdZOztDQTdHWixDQW9Id0IsQ0FBYixNQUFYLENBQVcsR0FBQTtDQUNULE9BQUEsRUFBQTs7R0FEK0MsR0FBZDtNQUNqQztDQUFBLENBQU8sRUFBUCxDQUFBLEtBQU8sRUFBQSxHQUFjO0NBQ25CLEVBQXFDLENBQTNCLENBQUEsS0FBQSxFQUFBLFNBQU87TUFEbkI7Q0FBQSxFQUVBLENBQUEsS0FBMkIsSUFBUDtDQUFjLEVBQUQsRUFBd0IsUUFBeEI7Q0FBM0IsSUFBb0I7QUFDbkIsQ0FBUCxFQUFBLENBQUE7Q0FDRSxFQUFBLENBQWEsRUFBYixDQUFPLE1BQW1CO0NBQzFCLEVBQTZDLENBQW5DLENBQUEsS0FBTyxFQUFQLGlCQUFPO01BTG5CO0NBQUEsQ0FNMEMsQ0FBbEMsQ0FBUixDQUFBLEVBQVEsQ0FBTyxDQUE0QjtDQUNuQyxJQUFELElBQUwsSUFBQTtDQURNLElBQWtDO0FBRW5DLENBQVAsR0FBQSxDQUFBO0NBQ0UsRUFBQSxHQUFBLENBQU87Q0FDUCxFQUF1QyxDQUE3QixDQUFBLENBQU8sR0FBQSxDQUFQLEVBQUEsV0FBTztNQVZuQjtDQVdjLENBQU8sRUFBakIsQ0FBQSxJQUFBLEVBQUEsRUFBQTtDQWhJTixFQW9IVzs7Q0FwSFgsRUFrSW1CLE1BQUEsUUFBbkI7Q0FDRyxFQUF3QixDQUF4QixLQUF3QixFQUF6QixJQUFBO0NBQ0UsU0FBQSxrRUFBQTtDQUFBLEVBQVMsQ0FBQSxFQUFUO0NBQUEsRUFDVyxDQUFBLEVBQVgsRUFBQTtDQURBLEVBRU8sQ0FBUCxFQUFBLElBQU87Q0FGUCxFQUdRLENBQUksQ0FBWixDQUFBLEVBQVE7Q0FDUixFQUFXLENBQVIsQ0FBQSxDQUFIO0NBQ0UsRUFFTSxDQUFBLEVBRkEsRUFBTixFQUVNLDJCQUZXLHNIQUFqQjtDQUFBLENBYUEsQ0FBSyxDQUFBLEVBQU0sRUFBWCxFQUFLO0NBQ0w7Q0FBQSxZQUFBLCtCQUFBO3lCQUFBO0NBQ0UsQ0FBRSxDQUNJLEdBRE4sSUFBQSxDQUFBLFNBQWE7Q0FEZixRQWRBO0NBQUEsQ0FrQkUsSUFBRixFQUFBLHlCQUFBO0NBbEJBLEVBcUIwQixDQUExQixDQUFBLENBQU0sRUFBTixDQUEyQjtDQUN6QixhQUFBLFFBQUE7Q0FBQSxTQUFBLElBQUE7Q0FBQSxDQUNBLENBQUssQ0FBQSxNQUFMO0NBREEsQ0FFUyxDQUFGLENBQVAsTUFBQTtDQUNBLEdBQUcsQ0FBUSxDQUFYLElBQUE7Q0FDRSxDQUFNLENBQUYsQ0FBQSxFQUFBLEdBQUEsR0FBSjtDQUNBLEdBQU8sQ0FBWSxDQUFuQixNQUFBO0NBQ0csSUFBRCxnQkFBQTtjQUhKO0lBSVEsQ0FBUSxDQUpoQixNQUFBO0NBS0UsQ0FBTSxDQUFGLENBQUEsRUFBQSxHQUFBLEdBQUo7Q0FDQSxHQUFPLENBQVksQ0FBbkIsTUFBQTtDQUNHLElBQUQsZ0JBQUE7Y0FQSjtNQUFBLE1BQUE7Q0FTRSxDQUFFLEVBQUYsRUFBQSxFQUFBLENBQUEsRUFBQSxDQUFBO0NBQUEsQ0FDRSxJQUFGLEVBQUEsSUFBQTtDQURBLEVBRUksQ0FBQSxJQUFBLElBQUo7Q0FGQSxHQUdBLEVBQU0sSUFBTixFQUFBO0NBSEEsRUFJUyxHQUFULEVBQVMsSUFBVDtDQUNPLENBQStCLENBQUUsQ0FBeEMsQ0FBQSxDQUFNLEVBQU4sRUFBQSxTQUFBO1lBbEJzQjtDQUExQixRQUEwQjtDQXJCMUIsR0F3Q0UsQ0FBRixDQUFRLEVBQVI7UUE3Q0Y7Q0ErQ0EsRUFBbUIsQ0FBaEIsRUFBSCxHQUFtQixJQUFoQjtDQUNELEdBQUcsQ0FBUSxHQUFYO0NBQ0UsRUFBUyxHQUFULElBQUE7Q0FBQSxLQUNNLElBQU47Q0FEQSxLQUVNLElBQU4sQ0FBQSxLQUFBO0NBQ08sRUFBWSxFQUFKLENBQVQsT0FBUyxJQUFmO1VBTEo7UUFoRHVCO0NBQXpCLElBQXlCO0NBbkkzQixFQWtJbUI7O0NBbEluQixFQTBMcUIsTUFBQSxVQUFyQjtDQUNzQixFQUFwQixDQUFxQixPQUFyQixRQUFBO0NBM0xGLEVBMExxQjs7Q0ExTHJCLEVBNkxhLE1BQUMsRUFBZCxFQUFhO0NBQ1YsQ0FBbUIsQ0FBQSxDQUFWLENBQVUsQ0FBcEIsRUFBQSxDQUFxQixFQUFyQjtDQUFxQyxDQUFOLEdBQUssUUFBTCxDQUFBO0NBQS9CLElBQW9CO0NBOUx0QixFQTZMYTs7Q0E3TGI7O0NBRHNCLE9BQVE7O0FBa01oQyxDQS9QQSxFQStQaUIsR0FBWCxDQUFOLEVBL1BBOzs7Ozs7QUNBQSxDQUFPLEVBRUwsR0FGSSxDQUFOO0NBRUUsQ0FBQSxDQUFPLEVBQVAsQ0FBTyxHQUFDLElBQUQ7Q0FDTCxPQUFBLEVBQUE7QUFBTyxDQUFQLEdBQUEsRUFBTyxFQUFBO0NBQ0wsRUFBUyxHQUFULElBQVM7TUFEWDtDQUFBLENBRWEsQ0FBQSxDQUFiLE1BQUEsR0FBYTtDQUNSLEVBQWUsQ0FBaEIsQ0FBSixDQUFXLElBQVgsQ0FBQTtDQUpGLEVBQU87Q0FGVCxDQUFBOzs7Ozs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkEsSUFBQSw2REFBQTtHQUFBO2tTQUFBOztBQUFBLENBQUEsRUFBWSxJQUFBLEVBQVosRUFBWTs7QUFDWixDQURBLEVBQ1ksSUFBQSxFQUFaLGtCQUFZOztBQUNaLENBRkEsRUFFQSxJQUFNLE9BQUE7O0FBQ04sQ0FBQSxJQUFBLEtBQUE7b0JBQUE7Q0FDRSxDQUFBLENBQU8sRUFBUCxDQUFPO0NBRFQ7O0FBR00sQ0FOTjtDQU9FOzs7OztDQUFBOztDQUFBLEVBQU0sQ0FBTixXQUFBOztDQUFBLEVBQ1csTUFBWCxLQURBOztDQUFBLEVBRVUsS0FBVixDQUFtQixRQUZuQjs7Q0FBQSxFQUdjLFNBQWQsRUFBYzs7Q0FIZCxFQUlTLEdBSlQsQ0FJQTs7Q0FKQSxFQU1RLEdBQVIsR0FBUTtDQUNOLE9BQUEsK0pBQUE7Q0FBQSxFQUFjLENBQWQsT0FBQSxDQUFjO0NBQ2QsR0FBQSxFQUFBLEtBQWM7Q0FDWixDQUVFLENBRmlCLENBQUMsQ0FBRCxDQUFuQixHQUFtQixHQUFBLEVBQUEsRUFBbkI7TUFGRjtDQUFBLEVBUW1CLENBQW5CLE9BQW1CLEdBQUEsRUFBbkI7Q0FDQSxHQUFBLEVBQUEsVUFBbUI7Q0FDakIsQ0FFRSxDQUZtQixDQUFDLENBQUQsQ0FBckIsR0FBcUIsS0FBQSxJQUFyQjtNQVZGO0NBQUEsRUFnQlcsQ0FBWCxJQUFBLEVBQVcsQ0FBQTtDQUNYLEdBQUEsRUFBQSxFQUFXO0NBQ1QsQ0FFRSxDQUZlLENBQUMsQ0FBRCxDQUFqQixHQUFpQixDQUFBLElBQWpCO01BbEJGO0NBQUEsRUF3QmUsQ0FBZixPQUFlLENBQWYsWUFBZTtDQUNmLEdBQUEsRUFBQSxNQUFlO0NBQ2IsQ0FFRSxDQUZtQixDQUFDLENBQUQsQ0FBckIsR0FBcUIsU0FBckIsR0FBcUIsR0FBQTtNQTFCdkI7Q0FBQSxFQWdDYSxDQUFiLE1BQUEsQ0FBYSxJQUFBO0NBQ2IsR0FBQSxFQUFBLElBQWE7Q0FDWCxDQUVFLENBRmtCLENBQUMsQ0FBRCxDQUFwQixHQUFvQixLQUFBLENBQUEsRUFBcEI7TUFsQ0Y7Q0FBQSxFQXlDRSxDQURGLEdBQUE7Q0FDRSxDQUFRLEVBQUMsQ0FBSyxDQUFkLEtBQVE7Q0FBUixDQUNhLEVBQUMsRUFBZCxLQUFBO0NBREEsQ0FFWSxFQUFDLENBQUssQ0FBbEIsSUFBQSxHQUFZO0NBRlosQ0FHTyxFQUFDLENBQVIsQ0FBQSxDQUFlO0NBSGYsQ0FJa0IsSUFBbEIsVUFBQTtDQUpBLENBS2dCLElBQWhCLEtBQTJCLEdBQTNCO0NBTEEsQ0FNYSxDQUFxQixHQUFsQyxLQUFBO0NBTkEsQ0FPWSxDQUFxQixHQUFqQyxJQUFBLENBQXVCO0NBUHZCLENBUW9CLElBQXBCLFFBUkEsSUFRQTtDQVJBLENBU2EsSUFBYixFQUFxQixHQUFyQjtDQVRBLENBVVUsQ0FBa0IsR0FBNUIsRUFBQTtDQVZBLENBV2dCLENBQWtCLEdBQWxDLEVBQXdCLE1BQXhCO0NBWEEsQ0FZb0IsSUFBcEIsWUFBQTtDQVpBLENBYWlCLElBQWpCLE1BQTZCLEdBQTdCO0NBYkEsQ0FjYyxDQUFzQixHQUFwQyxNQUFBO0NBZEEsQ0Flb0IsQ0FBc0IsR0FBMUMsTUFBZ0MsTUFBaEM7Q0FmQSxDQWlCd0IsSUFBeEIsWUFqQkEsSUFpQkE7Q0FqQkEsQ0FrQnFCLElBQXJCLFVBQXFDLEdBQXJDO0NBbEJBLENBbUJrQixDQUEwQixHQUE1QyxVQUFBO0NBbkJBLENBb0J3QixDQUEwQixHQUFsRCxVQUF3QyxNQUF4QztDQXBCQSxDQXNCbUIsSUFBbkIsV0FBQTtDQXRCQSxDQXVCZSxJQUFmLElBQXlCLEdBQXpCO0NBdkJBLENBd0JlLENBQW9CLEdBQW5DLElBQXlCLEdBQXpCO0NBeEJBLENBeUJrQixDQUFvQixHQUF0QyxJQUE0QixNQUE1QjtDQWxFRixLQUFBO0NBQUEsQ0FvRW9DLENBQWhDLENBQUosRUFBVSxDQUFBLENBQVMsQ0FBVDtDQUNULEVBQUQsQ0FBQyxPQUFELFFBQUE7Q0E1RUYsRUFNUTs7Q0FOUjs7Q0FEaUM7O0FBZ0ZuQyxDQXRGQSxFQXNGaUIsR0FBWCxDQUFOLGFBdEZBOzs7O0FDQUEsSUFBQSx3REFBQTtHQUFBO2tTQUFBOztBQUFBLENBQUEsRUFBWSxJQUFBLEVBQVosRUFBWTs7QUFDWixDQURBLEVBQ1ksSUFBQSxFQUFaLGtCQUFZOztBQUNaLENBRkEsRUFFQSxJQUFNLE9BQUE7O0FBQ04sQ0FBQSxJQUFBLEtBQUE7b0JBQUE7Q0FDRSxDQUFBLENBQU8sRUFBUCxDQUFPO0NBRFQ7O0FBSU0sQ0FQTjtDQVFFOzs7OztDQUFBOztDQUFBLEVBQU0sQ0FBTixLQUFBOztDQUFBLEVBQ1csTUFBWDs7Q0FEQSxFQUVVLEtBQVYsQ0FBbUIsSUFGbkI7O0NBQUEsRUFHYyxTQUFkLElBQWM7O0NBSGQsRUFJUyxHQUpULENBSUE7O0NBSkEsRUFNUSxHQUFSLEdBQVE7Q0FDTixPQUFBLHVKQUFBO0NBQUEsRUFBYyxDQUFkLE9BQUEsQ0FBYztDQUNkLEdBQUEsRUFBQSxLQUFjO0NBQ1osQ0FBeUMsQ0FBN0IsQ0FBQyxFQUFiLENBQVksRUFBWixDQUFZLEVBQUEsSUFBQTtBQUVaLENBQUEsVUFBQSxxQ0FBQTs2QkFBQTtDQUNFLENBQUEsQ0FBaUIsQ0FBZCxHQUFBLENBQUgsRUFBRztDQUNELEVBQUcsQ0FBSCxLQUFBLENBQUE7VUFGSjtDQUFBLE1BSEY7TUFEQTtDQUFBLEVBUW1CLENBQW5CLE9BQW1CLEdBQUEsRUFBbkI7Q0FDQSxHQUFBLEVBQUEsVUFBbUI7Q0FDakIsQ0FBMkMsQ0FBN0IsQ0FBQyxFQUFmLENBQWMsRUFBQSxDQUFBLENBQWQsR0FBYyxFQUFBO01BVmhCO0NBQUEsRUFhVyxDQUFYLElBQUEsRUFBVyxDQUFBO0NBQ1gsR0FBQSxFQUFBLEVBQVc7Q0FDVCxDQUEyQyxDQUE3QixDQUFDLEVBQWYsQ0FBYyxFQUFBLENBQUEsQ0FBZCxLQUFjO01BZmhCO0NBQUEsRUFrQmUsQ0FBZixPQUFlLENBQWYsWUFBZTtDQUNmLEdBQUEsRUFBQSxNQUFlO0NBQ2IsQ0FBK0MsQ0FBN0IsQ0FBQyxFQUFuQixDQUFrQixFQUFBLENBQUEsS0FBbEIsQ0FBa0IsUUFBQTtNQXBCcEI7Q0FBQSxFQXVCYSxDQUFiLE1BQUEsQ0FBYSxJQUFBO0NBdkJiLENBd0JxQyxDQUFyQyxDQUFBLEdBQU8sR0FBUCxhQUFBO0NBQ0EsR0FBQSxFQUFBLElBQWE7Q0FDWCxDQUE4QyxDQUE3QixDQUFDLEVBQWxCLENBQWlCLEVBQUEsQ0FBQSxJQUFqQixDQUFpQixDQUFBO01BMUJuQjtDQUFBLEVBOEJFLENBREYsR0FBQTtDQUNFLENBQVEsRUFBQyxDQUFLLENBQWQsS0FBUTtDQUFSLENBQ2EsRUFBQyxFQUFkLEtBQUE7Q0FEQSxDQUVZLEVBQUMsQ0FBSyxDQUFsQixJQUFBLEdBQVk7Q0FGWixDQUdPLEVBQUMsQ0FBUixDQUFBLENBQWU7Q0FIZixDQUlnQixJQUFoQixLQUEyQixHQUEzQjtDQUpBLENBS2EsQ0FBcUIsR0FBbEMsS0FBQTtDQUxBLENBTWtCLElBQWxCLEdBTkEsT0FNQTtDQU5BLENBT2lCLENBQXFCLEdBQXRDLEtBQTRCLElBQTVCO0NBUEEsQ0FRZ0IsSUFBaEIsUUFBQSxFQUFnQztDQVJoQyxDQVNrQixDQUEwQixHQUE1QyxVQUFBO0NBVEEsQ0FVWSxDQUEwQixHQUF0QyxJQUFBLE1BQTRCO0NBVjVCLENBV29CLElBQXBCLEtBWEEsT0FXQTtDQVhBLENBWVUsQ0FBa0IsR0FBNUIsRUFBQTtDQVpBLENBYWEsSUFBYixFQUFxQixHQUFyQjtDQWJBLENBY2EsSUFBYixLQUFBO0NBZEEsQ0FlZSxDQUFrQixHQUFqQyxFQUF1QixLQUF2QjtDQWZBLENBaUJjLENBQXNCLEdBQXBDLE1BQUE7Q0FqQkEsQ0FrQmlCLElBQWpCLE1BQTZCLEdBQTdCO0NBbEJBLENBbUJpQixJQUFqQixTQUFBO0NBbkJBLENBb0JtQixDQUFzQixHQUF6QyxNQUErQixLQUEvQjtDQXBCQSxDQXNCZSxDQUFvQixHQUFuQyxJQUF5QixHQUF6QjtDQXRCQSxDQXVCZSxJQUFmLElBQXlCLEdBQXpCO0NBdkJBLENBd0JnQixJQUFoQixRQUFBO0NBeEJBLENBeUJrQixDQUFvQixHQUF0QyxJQUE0QixNQUE1QjtDQXZERixLQUFBO0NBQUEsQ0F5RG9DLENBQWhDLENBQUosRUFBVSxDQUFBLENBQVMsQ0FBVDtDQUNULEVBQUQsQ0FBQyxPQUFELFFBQUE7Q0FqRUYsRUFNUTs7Q0FOUjs7Q0FENEI7O0FBb0U5QixDQTNFQSxFQTJFaUIsR0FBWCxDQUFOLFFBM0VBOzs7O0FDQUEsSUFBQSx5SEFBQTtHQUFBO2tTQUFBOztBQUFBLENBQUEsRUFBWSxJQUFBLEVBQVosRUFBWTs7QUFDWixDQURBLEVBQ1ksSUFBQSxFQUFaLGtCQUFZOztBQUNaLENBRkEsRUFFQSxJQUFNLE9BQUE7O0FBQ04sQ0FBQSxJQUFBLEtBQUE7b0JBQUE7Q0FDRSxDQUFBLENBQU8sRUFBUCxDQUFPO0NBRFQ7O0FBR0EsQ0FOQSxFQU1RLEVBQVIsRUFBUSxJQUFBOztBQUNSLENBUEEsRUFPYSxFQVBiLEtBT0E7O0FBQ0EsQ0FSQSxFQVFvQixDQVJwQixhQVFBOztBQUNBLENBVEEsRUFTWSxJQUFBLEVBQVosTUFBWTs7QUFDWixDQVZBLENBQUEsQ0FVVyxLQUFYOztBQUNBLENBQUEsSUFBQSxXQUFBO3dCQUFBO0NBQ0UsQ0FBQSxDQUFZLElBQUgsQ0FBQSwrQkFBQTtDQURYOztBQUdNLENBZE47Q0FlRTs7Ozs7Q0FBQTs7Q0FBQSxFQUFNLENBQU4sTUFBQTs7Q0FBQSxFQUNXLE1BQVgsQ0FEQTs7Q0FBQSxFQUVVLEtBQVYsQ0FBbUIsSUFGbkI7O0NBQUEsRUFHYyxPQUFBLEVBQWQ7O0NBSEEsRUFJUyxHQUpULENBSUE7O0NBSkEsRUFNUSxHQUFSLEdBQVE7Q0FLTixPQUFBLDRyQkFBQTtDQUFBLENBQUEsQ0FBYyxDQUFkLE9BQUE7Q0FBQSxDQUFBLENBQ21CLENBQW5CLFlBQUE7Q0FEQSxDQUFBLENBRVcsQ0FBWCxJQUFBO0NBRkEsQ0FBQSxDQUdhLENBQWIsTUFBQTtDQUhBLENBQUEsQ0FJZSxDQUFmLFFBQUE7Q0FKQSxDQU1rQyxDQUFwQixDQUFkLEVBQWMsRUFBQSxDQUFxQixFQUFuQztDQUNHLEVBQUQsRUFBd0IsUUFBeEI7Q0FEWSxJQUFvQjtDQU5sQyxFQVFpQixDQUFqQixFQVJBLEtBUTRCLEdBQTVCO0NBQ0EsRUFBb0IsQ0FBcEIsVUFBRztDQUNELENBRUUsQ0FGbUIsQ0FBQyxDQUFELENBQXJCLEdBQXFCLENBQUEsRUFBQSxNQUFyQjtDQUFBLENBT0UsQ0FGb0IsQ0FBQyxDQUFELENBQXRCLEdBQXNCLENBQUEsRUFBQSxDQUFBLE1BQXRCO0NBTEEsQ0FZRSxDQUZzQixDQUFDLENBQUQsQ0FBeEIsR0FBd0IsQ0FBQSxFQUFBLEdBQUEsTUFBeEI7Q0FWQSxDQWlCRSxDQUZ1QixDQUFDLENBQUQsQ0FBekIsR0FBeUIsQ0FBQSxFQUFBLElBQUEsTUFBekI7TUFoQkY7Q0FzQkUsRUFBcUIsR0FBckIsWUFBQTtDQUFBLEVBQ3dCLEdBQXhCLGVBQUE7Q0FEQSxFQUVzQixHQUF0QixhQUFBO0NBRkEsRUFHeUIsR0FBekIsZ0JBQUE7TUFsQ0Y7Q0FBQSxDQW9DdUMsQ0FBcEIsQ0FBbkIsRUFBbUIsRUFBQSxDQUFxQixPQUF4QztDQUNHLEVBQUQsRUFBd0IsUUFBeEI7Q0FEaUIsSUFBb0I7Q0FwQ3ZDLEVBc0NzQixDQUF0QixFQXRDQSxVQXNDc0MsR0FBdEM7Q0FDQSxFQUF5QixDQUF6QixlQUFHO0NBQ0QsQ0FFRSxDQUZxQixDQUFDLENBQUQsQ0FBdkIsR0FBdUIsQ0FBQSxFQUFBLEVBQUEsTUFBdkI7Q0FBQSxDQU9FLENBRnNCLENBQUMsQ0FBRCxDQUF4QixHQUF3QixDQUFBLEdBQUEsQ0FBQSxPQUF4QjtDQUxBLENBWUUsQ0FGd0IsQ0FBQyxDQUFELENBQTFCLEdBQTBCLENBQUEsSUFBQSxDQUFBLFFBQTFCO0NBVkEsQ0FpQkUsQ0FGeUIsQ0FBQyxDQUFELENBQTNCLEdBQTJCLENBQUEsSUFBQSxFQUFBLFFBQTNCO01BaEJGO0NBc0JFLEVBQXVCLEdBQXZCLGNBQUE7Q0FBQSxFQUMwQixHQUExQixpQkFBQTtDQURBLEVBRXdCLEdBQXhCLGVBQUE7Q0FGQSxFQUcyQixHQUEzQixrQkFBQTtNQWhFRjtDQUFBLENBa0VnQyxDQUFwQixDQUFaLEVBQVksRUFBWixDQUFpQztDQUM5QixFQUFELEVBQXdCLFFBQXhCO0NBRFUsSUFBb0I7Q0FsRWhDLEVBb0VjLENBQWQsRUFwRUEsRUFvRXNCLEdBQXRCO0NBQ0EsRUFBaUIsQ0FBakIsT0FBRztDQUNELENBRUUsQ0FGa0IsQ0FBQyxDQUFELENBQXBCLEdBQW9CLENBQUEsRUFBQSxLQUFwQjtDQUFBLENBT0UsQ0FGbUIsQ0FBQyxDQUFELENBQXJCLEdBQXFCLENBQUEsR0FBQSxLQUFyQjtDQUxBLENBWUUsQ0FGcUIsQ0FBQyxDQUFELENBQXZCLEdBQXVCLENBQUEsS0FBQSxLQUF2QjtDQVZBLENBaUJFLENBRnNCLENBQUMsQ0FBRCxDQUF4QixHQUF3QixDQUFBLE1BQUEsS0FBeEI7TUFoQkY7Q0FzQkUsRUFBb0IsR0FBcEIsV0FBQTtDQUFBLEVBQ3VCLEdBQXZCLGNBQUE7Q0FEQSxFQUVxQixHQUFyQixZQUFBO0NBRkEsRUFHd0IsR0FBeEIsZUFBQTtNQTlGRjtDQUFBLENBZ0dpQyxDQUFwQixDQUFiLEVBQWEsRUFBQSxDQUFxQixDQUFsQztDQUNHLEVBQUQsRUFBd0IsUUFBeEI7Q0FEVyxJQUFvQjtDQWhHakMsRUFrR2dCLENBQWhCLEVBbEdBLElBa0cwQixHQUExQjtDQUNBLEVBQW1CLENBQW5CLFNBQUc7Q0FDRCxDQUVFLENBRm9CLENBQUMsQ0FBRCxDQUF0QixHQUFzQixDQUFBLEVBQUEsR0FBQSxJQUF0QjtDQUFBLENBT0UsQ0FGcUIsQ0FBQyxDQUFELENBQXZCLEdBQXVCLENBQUEsR0FBQSxFQUFBLEtBQXZCO0NBTEEsQ0FZRSxDQUZ1QixDQUFDLENBQUQsQ0FBekIsR0FBeUIsQ0FBQSxLQUFBLE9BQXpCO0NBVkEsQ0FpQkUsQ0FGd0IsQ0FBQyxDQUFELENBQTFCLEdBQTBCLENBQUEsS0FBQSxDQUFBLE9BQTFCO01BaEJGO0NBc0JFLEVBQXNCLEdBQXRCLGFBQUE7Q0FBQSxFQUN5QixHQUF6QixnQkFBQTtDQURBLEVBRXVCLEdBQXZCLGNBQUE7Q0FGQSxFQUcwQixHQUExQixpQkFBQTtNQTVIRjtDQUFBLENBOEhtQyxDQUFwQixDQUFmLEVBQWUsRUFBQSxDQUFxQixHQUFwQztDQUNHLEVBQUQsRUFBd0IsUUFBeEI7Q0FEYSxJQUFvQjtDQTlIbkMsRUFpSWtCLENBQWxCLEVBaklBLE1BaUk4QixHQUE5QjtDQUNBLEVBQXFCLENBQXJCLFdBQUc7Q0FDRCxDQUVFLENBRnNCLENBQUMsQ0FBRCxDQUF4QixHQUF3QixDQUFBLEVBQUEsU0FBeEIsR0FBd0I7Q0FBeEIsQ0FPRSxDQUZ1QixDQUFDLENBQUQsQ0FBekIsR0FBeUIsQ0FBQSxHQUFBLFNBQXpCLEVBQXlCO0NBTHpCLENBWUUsQ0FGeUIsQ0FBQyxDQUFELENBQTNCLEdBQTJCLENBQUEsS0FBQSxTQUEzQjtDQVZBLENBaUJFLENBRjBCLENBQUMsQ0FBRCxDQUE1QixHQUE0QixDQUFBLE1BQUEsUUFBQSxDQUE1QjtNQWhCRjtDQXNCRSxFQUF3QixHQUF4QixlQUFBO0NBQUEsRUFDMkIsR0FBM0Isa0JBQUE7Q0FEQSxFQUV5QixHQUF6QixnQkFBQTtDQUZBLEVBRzRCLEdBQTVCLG1CQUFBO01BM0pGO0NBQUEsRUE2SmdCLENBQWhCLE9BQWdCLEVBQWhCLENBQWdCLENBN0poQixJQTZKZ0I7Q0E3SmhCLEVBOEplLENBQWYsUUFBQSxLQUFlLENBQUEsQ0FBQSxDQUFBLENBOUpmO0NBQUEsRUErSmtCLENBQWxCLFdBQUEsS0FBa0IsQ0FBQSxDQUFBLENBQUEsQ0EvSmxCO0NBQUEsRUFnS2dCLENBQWhCLFNBQUEsS0FBZ0IsQ0FBQSxDQUFBLENBQUEsQ0FoS2hCO0NBQUEsRUFpS21CLENBQW5CLFlBQUEsS0FBbUIsQ0FBQSxDQUFBLENBQUEsQ0FqS25CO0NBQUEsRUFrS2MsQ0FBZCxPQUFBLEVBQWM7Q0FsS2QsQ0FtSzBCLENBQTFCLENBQUEsR0FBTyxLQUFQLEVBQUE7Q0FuS0EsQ0FvSzBCLENBQTFCLENBQUEsR0FBTyxLQUFQLENBQUE7Q0FwS0EsQ0FxS3NCLENBQXRCLENBQUEsR0FBTyxDQUFQLFdBQUE7Q0FyS0EsQ0FzSzRCLENBQTVCLENBQUEsR0FBTyxJQUFQLEdBQUE7Q0F0S0EsQ0F1SzJCLENBQTNCLENBQUEsR0FBTyxNQUFQLEVBQUE7Q0F2S0EsQ0F3SytCLENBQS9CLENBQUEsR0FBTyxNQUFQLElBQUE7Q0F4S0EsQ0F5SzhCLENBQTlCLENBQUEsR0FBTyxJQUFQLEtBQUE7Q0F6S0EsRUEyS0UsQ0FERixHQUFBO0NBQ0UsQ0FBUSxFQUFDLENBQUssQ0FBZCxLQUFRO0NBQVIsQ0FDYSxFQUFDLEVBQWQsS0FBQTtDQURBLENBRVksRUFBQyxDQUFLLENBQWxCLElBQUEsR0FBWTtDQUZaLENBR2UsQ0FBZ0MsQ0FBL0IsQ0FBSyxDQUFyQixPQUFBO0NBSEEsQ0FJTyxFQUFDLENBQVIsQ0FBQSxDQUFlO0NBSmYsQ0FNZ0IsSUFBaEIsS0FBMkIsR0FBM0I7Q0FOQSxDQU9nQixDQUFxQixHQUFyQyxLQUEyQixHQUEzQjtDQVBBLENBUW1CLENBQXFCLEdBQXhDLEtBQThCLE1BQTlCO0NBUkEsQ0FTdUIsR0FBQSxDQUF2QixlQUFBO0NBVEEsQ0FVb0IsR0FBQSxDQUFwQixZQUFBO0NBVkEsQ0FXcUIsR0FBQSxDQUFyQixhQUFBO0NBWEEsQ0FZd0IsR0FBQSxDQUF4QixnQkFBQTtDQVpBLENBY2UsSUFBZixJQUF5QixHQUF6QjtDQWRBLENBZWUsQ0FBb0IsR0FBbkMsSUFBeUIsR0FBekI7Q0FmQSxDQWdCa0IsQ0FBb0IsR0FBdEMsSUFBNEIsTUFBNUI7Q0FoQkEsQ0FpQndCLEdBQUEsQ0FBeEIsZ0JBQUE7Q0FqQkEsQ0FrQnFCLEdBQUEsQ0FBckIsYUFBQTtDQWxCQSxDQW1Cc0IsR0FBQSxDQUF0QixjQUFBO0NBbkJBLENBb0J5QixHQUFBLENBQXpCLGlCQUFBO0NBcEJBLENBc0JnQixJQUFoQixRQUFBLEVBQWdDO0NBdEJoQyxDQXVCZ0IsQ0FBMEIsR0FBMUMsUUFBQSxFQUFnQztDQXZCaEMsQ0F3Qm1CLENBQTBCLEdBQTdDLFVBQW1DLENBQW5DO0NBeEJBLENBeUJ5QixHQUFBLENBQXpCLGlCQUFBO0NBekJBLENBMEJzQixHQUFBLENBQXRCLGNBQUE7Q0ExQkEsQ0EyQnVCLEdBQUEsQ0FBdkIsZUFBQTtDQTNCQSxDQTRCMEIsR0FBQSxDQUExQixrQkFBQTtDQTVCQSxDQThCYSxJQUFiLEVBQXFCLEdBQXJCO0NBOUJBLENBK0JhLENBQWtCLEdBQS9CLEVBQXFCLEdBQXJCO0NBL0JBLENBZ0NnQixDQUFrQixHQUFsQyxFQUF3QixNQUF4QjtDQWhDQSxDQWlDc0IsR0FBQSxDQUF0QixjQUFBO0NBakNBLENBa0NtQixHQUFBLENBQW5CLFdBQUE7Q0FsQ0EsQ0FtQ29CLEdBQUEsQ0FBcEIsWUFBQTtDQW5DQSxDQW9DdUIsR0FBQSxDQUF2QixlQUFBO0NBcENBLENBc0NpQixJQUFqQixNQUE2QixHQUE3QjtDQXRDQSxDQXVDaUIsQ0FBc0IsR0FBdkMsTUFBNkIsR0FBN0I7Q0F2Q0EsQ0F3Q29CLENBQXNCLEdBQTFDLE1BQWdDLE1BQWhDO0NBeENBLENBeUMwQixHQUFBLENBQTFCLGtCQUFBO0NBekNBLENBMEN1QixHQUFBLENBQXZCLGVBQUE7Q0ExQ0EsQ0EyQ3dCLEdBQUEsQ0FBeEIsZ0JBQUE7Q0EzQ0EsQ0E0QzJCLEdBQUEsQ0FBM0IsbUJBQUE7Q0E1Q0EsQ0E4Q2EsSUFBYixLQUFBO0NBOUNBLENBK0NnQixDQUFnQixHQUFoQyxPQUFnQixDQUFoQjtDQS9DQSxDQWdEYSxJQUFiLEtBQUEsRUFoREE7Q0FBQSxDQWlEYyxJQUFkLE1BQUE7Q0FqREEsQ0FrRGlCLElBQWpCLFNBQUE7Q0FsREEsQ0FtRGtCLElBQWxCLFVBQUE7Q0FuREEsQ0FvRGUsSUFBZixPQUFBO0NBL05GLEtBQUE7Q0FpT0MsQ0FBbUMsQ0FBaEMsQ0FBSCxFQUFTLENBQUEsQ0FBUyxHQUFuQjtDQTVPRixFQU1ROztDQU5SLEVBeVBRLEdBQVIsR0FBUTtDQUNOLElBQUEsR0FBQTs7Q0FBTSxJQUFGLENBQUo7TUFBQTtDQURNLFVBRU4sZ0NBQUE7Q0EzUEYsRUF5UFE7O0NBelBSOztDQUQ2Qjs7QUE4UC9CLENBNVFBLEVBNFFpQixHQUFYLENBQU4sU0E1UUE7Ozs7QUNBQSxJQUFBLDhHQUFBO0dBQUE7O2tTQUFBOztBQUFBLENBQUEsRUFBWSxJQUFBLEVBQVosRUFBWTs7QUFDWixDQURBLEVBQ1ksSUFBQSxFQUFaLGtCQUFZOztBQUNaLENBRkEsRUFFUSxFQUFSLEVBQVEsSUFBQTs7QUFDUixDQUhBLEVBR2EsRUFIYixLQUdBOztBQUNBLENBSkEsRUFJb0IsQ0FKcEIsYUFJQTs7QUFDQSxDQUxBLEVBS1ksSUFBQSxFQUFaLE1BQVk7O0FBQ1osQ0FOQSxDQUFBLENBTVcsS0FBWDs7QUFDQSxDQUFBLElBQUEsV0FBQTt3QkFBQTtDQUNFLENBQUEsQ0FBWSxJQUFILENBQUEsK0JBQUE7Q0FEWDs7QUFHTSxDQVZOO0NBV0UsS0FBQSwwQ0FBQTs7Q0FBQTs7Ozs7O0NBQUE7O0NBQUEsRUFBTSxDQUFOLE9BQUE7O0NBQUEsRUFDVyxNQUFYLEVBREE7O0NBQUEsRUFFVSxLQUFWLENBQW1CLEtBRm5COztDQUFBLEVBR2MsU0FBZCxLQUFjOztDQUhkLEVBSVMsR0FKVCxDQUlBOztDQUpBLEVBT1EsR0FBUixHQUFRO0NBQ04sT0FBQSxnRkFBQTtDQUFBLEVBQ0UsQ0FERixHQUFBO0NBQ0UsQ0FBUSxFQUFDLENBQUssQ0FBZCxLQUFRO0NBQVIsQ0FDYSxFQUFDLEVBQWQsS0FBQTtDQURBLENBRVksRUFBQyxDQUFLLENBQWxCLElBQUEsR0FBWTtDQUZaLENBR08sRUFBQyxDQUFSLENBQUEsQ0FBZTtDQUpqQixLQUFBO0NBQUEsQ0FLb0MsQ0FBaEMsQ0FBSixFQUFVLENBQUEsQ0FBUztDQUxuQixDQVE4QyxDQUE5QixDQUFoQixHQUFnQixFQUFBLElBQWhCLElBQWdCO0NBUmhCLEVBVUksQ0FBSjtDQVZBLEVBV0ksQ0FBSjtDQVhBLEVBWVMsQ0FBVCxFQUFBO0NBQVMsQ0FBTSxFQUFMLEVBQUE7Q0FBRCxDQUFjLENBQUosR0FBQTtDQUFWLENBQXVCLEdBQU4sQ0FBQTtDQUFqQixDQUFtQyxJQUFSO0NBQTNCLENBQTZDLEdBQU4sQ0FBQTtDQVpoRCxLQUFBO0NBQUEsRUFhUyxDQUFULENBQUEsQ0FBaUI7Q0FiakIsRUFjUyxDQUFULENBQVMsQ0FBVDtDQWRBLEVBZVMsQ0FBVCxDQUFBLENBQWlCO0NBZmpCLEVBZ0JTLENBQVQsQ0FBUyxDQUFUO0NBaEJBLEVBbUJVLENBQVYsQ0FBVSxDQUFBLENBQVYsSUFBVSxJQUFBLEdBQUE7Q0FuQlYsQ0E0QkEsQ0FBSyxDQUFMLEVBQUssV0FBVTtDQTVCZixDQTZCRSxFQUFGLENBQUEsRUFBQSxNQUFBO0NBN0JBLENBZ0NZLENBQUYsQ0FBVixDQUFVLENBQUEsQ0FBVixRQUFVO0NBaENWLENBc0NBLENBQ21CLENBRG5CLEdBQU8sRUFDYSxFQURwQixDQUFBO0NBQzBCLENBQW1DLENBQXlDLENBQXJFLENBQUEsRUFBTyxDQUFxQyxDQUE1QyxHQUFBLENBQUEsV0FBNEMsT0FBQSxDQUFBO0NBRDdFLElBQ21CO0NBdkNuQixDQXlDQSxDQUNtQixDQURuQixHQUFPLEVBQ2EsRUFEcEIsQ0FBQTtDQUMwQixDQUE0QixDQUFhLENBQWxDLENBQUEsQ0FBQSxDQUFPLEVBQW1ELElBQTFEO0NBRGpDLElBQ21CO0NBMUNuQixDQTRDQSxDQUNrQixDQURsQixHQUFPLEVBQ1ksQ0FEbkIsRUFBQTtDQUN5QixDQUFtQyxHQUE1QixFQUFPLENBQVAsSUFBQSxDQUFBO0NBRGhDLElBQ2tCO0NBN0NsQixDQStDQSxDQUNtQixDQURuQixHQUFPLEVBQ2EsRUFEcEIsQ0FBQTtDQUMwQixDQUFtQyxDQUF5QyxDQUFyRSxDQUFBLEVBQU8sQ0FBcUMsQ0FBNUMsR0FBQSxDQUFBLFdBQTRDLE9BQUEsQ0FBQTtDQUQ3RSxJQUNtQjtDQWhEbkIsQ0FrREEsQ0FDbUIsQ0FEbkIsR0FBTyxFQUNhLEVBRHBCLENBQUE7Q0FDMEIsQ0FBNEIsQ0FBYSxDQUFsQyxDQUFBLENBQUEsQ0FBTyxFQUFtRCxJQUExRDtDQURqQyxJQUNtQjtDQUVYLENBQVIsQ0FDa0IsSUFEWCxFQUNZLENBRG5CLENBQUEsQ0FBQTtDQUN5QixDQUFtQyxHQUE1QixFQUFPLENBQVAsSUFBQSxDQUFBO0NBRGhDLElBQ2tCO0NBOURwQixFQU9ROztDQVBSLENBZ0VBLENBQVksQ0FBQSxHQUFBLEVBQVo7Q0FDRSxPQUFBLE9BQUE7Q0FBQSxFQUFPLENBQVAsR0FBZSxjQUFSO0NBQVAsRUFDUSxDQUFSLENBQUE7Q0FEQSxDQUVBLENBQUssQ0FBTCxDQUZBO0NBR0EsQ0FBd0IsQ0FBSyxDQUE3QixDQUFrQztDQUFsQyxDQUFhLENBQUQsQ0FBTCxTQUFBO01BSFA7Q0FJQSxDQUFBLENBQVksQ0FBTCxPQUFBO0NBckVULEVBZ0VZOztDQWhFWixFQXdFYSxNQUFBLEVBQWI7Q0FDRSxPQUFBLCtMQUFBO0NBQUEsRUFBTyxDQUFQO0NBQUEsRUFDUSxDQUFSLENBQUE7Q0FEQSxFQUVTLENBQVQsRUFBQTtDQUZBLEVBR1MsQ0FBVCxFQUFBO0NBQVMsQ0FBTSxFQUFMLEVBQUE7Q0FBRCxDQUFjLENBQUosR0FBQTtDQUFWLENBQXVCLEdBQU4sQ0FBQTtDQUFqQixDQUFtQyxJQUFSO0NBQTNCLENBQTZDLEdBQU4sQ0FBQTtDQUhoRCxLQUFBO0NBQUEsRUFJVSxDQUFWLEdBQUE7Q0FBVSxDQUFRLElBQVA7Q0FBRCxDQUFtQixJQUFQO0NBQVosQ0FBOEIsSUFBUDtDQUF2QixDQUF3QyxJQUFQO0NBSjNDLEtBQUE7Q0FBQSxFQUtPLENBQVA7Q0FMQSxFQU1PLENBQVA7Q0FOQSxFQU9VLENBQVYsR0FBQTtDQVBBLEVBUVMsQ0FBVCxFQUFBO0NBUkEsRUFTVSxDQUFWLEdBQUE7Q0FUQSxFQVVTLENBQVQsRUFBQTtDQVZBLEVBWVksQ0FBWixLQUFBO0NBWkEsRUFhWSxDQUFaLEtBQUE7Q0FiQSxFQWNPLENBQVA7Q0FkQSxFQWVPLENBQVAsS0FmQTtDQUFBLENBZ0JXLENBQUYsQ0FBVCxDQUFpQixDQUFqQjtDQWhCQSxDQWlCVyxDQUFGLENBQVQsQ0FBaUIsQ0FBakI7Q0FqQkEsRUFrQmUsQ0FBZixRQUFBO0NBbEJBLEVBbUJlLENBQWYsUUFBQTtDQW5CQSxFQW9CZSxDQUFmLFFBQUE7Q0FwQkEsRUFxQmUsQ0FBZixRQUFBO0NBQ0EsQ0FBQSxFQUFBLEVBQVM7Q0FFUCxDQUFBLEVBQUksRUFBSixXQUFBO0NBQUEsQ0FDQSxDQUFLLENBQUksRUFBVCxXQUFLO01BekJQO0NBQUEsRUE0QlEsQ0FBUixDQUFBLElBQVM7Q0FDRyxFQUFLLENBQWYsS0FBUyxJQUFUO0NBQ0UsV0FBQSxnSEFBQTtDQUFBLEVBQUksQ0FBSSxJQUFSLENBQWM7Q0FBaUIsT0FBWCxFQUFBLE9BQUE7Q0FBaEIsUUFBUztDQUFiLEVBQ0ksQ0FBSSxJQUFSLENBQWM7Q0FBaUIsTUFBWCxHQUFBLE9BQUE7Q0FBaEIsUUFBUztDQURiLEVBSWMsS0FBZCxHQUFBO0NBSkEsRUFLYSxFQUxiLEdBS0EsRUFBQTtDQUxBLEVBT2MsR0FQZCxFQU9BLEdBQUE7QUFFa0QsQ0FBbEQsR0FBaUQsSUFBakQsSUFBa0Q7Q0FBbEQsQ0FBVSxDQUFILENBQVAsTUFBQTtVQVRBO0FBV2tELENBQWxELEdBQWlELElBQWpELElBQWtEO0NBQWxELENBQVUsQ0FBSCxDQUFQLE1BQUE7VUFYQTtDQUFBLENBY2EsQ0FBRixHQUFPLEVBQWxCO0NBZEEsQ0FlYSxDQUFGLENBQWMsRUFBZCxFQUFYLFNBQXFCO0NBZnJCLENBZ0JRLENBQVIsQ0FBb0IsQ0FBZCxDQUFBLEVBQU4sU0FBZ0I7Q0FoQmhCLEVBaUJHLEdBQUgsRUFBQTtDQWpCQSxDQW9Ca0IsQ0FBZixDQUFILENBQWtCLENBQVksQ0FBOUIsQ0FBQTtDQXBCQSxFQXVCSSxHQUFBLEVBQUo7Q0F2QkEsQ0EyQlksQ0FEWixDQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQSxDQUNZO0NBM0JaLENBb0NnRCxDQUF2QyxDQUFDLENBQUQsQ0FBVCxFQUFBLEVBQWdELENBQXRDO0NBcENWLENBcUMrQyxDQUF0QyxFQUFBLENBQVQsRUFBQSxHQUFVO0NBckNWLEdBc0NBLENBQUEsQ0FBTSxFQUFOO0NBdENBLEdBdUNBLENBQUEsQ0FBTSxFQUFOO0NBdkNBLENBd0NBLENBQUssQ0FBQSxDQUFRLENBQVIsRUFBTDtDQXhDQSxDQXlDQSxDQUFLLENBQUEsQ0FBUSxDQUFSLEVBQUw7QUFJK0IsQ0FBL0IsR0FBOEIsSUFBOUIsTUFBK0I7Q0FBL0IsQ0FBVyxDQUFGLEVBQUEsQ0FBVCxDQUFTLEdBQVQ7VUE3Q0E7QUE4QytCLENBQS9CLEdBQThCLElBQTlCLE1BQStCO0NBQS9CLENBQVcsQ0FBRixFQUFBLENBQVQsQ0FBUyxHQUFUO1VBOUNBO0NBQUEsQ0FpRG9DLENBQTVCLENBQUEsQ0FBUixDQUFRLENBQUEsQ0FBUjtDQWpEQSxDQXNEaUIsQ0FBQSxDQUpqQixDQUFLLENBQUwsQ0FBQSxDQUFBLENBQUE7Q0FJK0IsS0FBUCxXQUFBO0NBSnhCLENBS2lCLENBQUEsQ0FMakIsS0FJaUI7Q0FDYyxLQUFQLFdBQUE7Q0FMeEIsQ0FNaUIsQ0FOakIsQ0FBQSxDQUFBLENBTXVCLENBTnZCLENBQUEsQ0FLaUIsS0FMakIsRUFBQTtDQWxEQSxDQWtFZ0IsQ0FKaEIsQ0FBQSxDQUFLLENBQUwsQ0FBQSxDQUFBLENBQUE7Q0FJOEIsS0FBUCxXQUFBO0NBSnZCLENBS2dCLENBTGhCLENBQUEsRUFLc0IsQ0FBbUIsRUFEekI7Q0FFYSxLQUFYLElBQUEsT0FBQTtDQU5sQixRQU1XO0NBcEVYLENBcUVtQyxDQUFuQyxDQUFBLENBQUssQ0FBTCxDQUFBLENBQUEsS0FBQTtDQXJFQSxDQTZFaUIsQ0FBQSxDQUpqQixDQUFLLENBQUwsQ0FBQSxDQUFBLENBQUE7Q0FJaUMsS0FBRCxXQUFOO0NBSjFCLENBS2lCLENBQUEsQ0FMakIsS0FJaUI7Q0FDZ0IsQ0FBMEIsQ0FBakMsR0FBTSxDQUFtQixVQUF6QjtDQUwxQixDQU1vQixDQUFBLENBTnBCLEdBQUEsRUFLaUI7Q0FDRyxFQUFhLENBQUgsYUFBQTtDQU45QixDQU9nQixDQVBoQixDQUFBLEVBQUEsR0FNb0I7Q0FHRixFQUFBLFdBQUE7Q0FBQSxDQUFBLENBQUEsT0FBQTtDQUFBLEVBQ0EsTUFBTSxDQUFOO0NBQ0EsRUFBQSxjQUFPO0NBWHpCLENBYXFCLENBQUEsQ0FickIsSUFBQSxDQVFtQjtDQU1ELEVBQUEsV0FBQTtDQUFBLENBQU0sQ0FBTixDQUFVLENBQUosS0FBTjtDQUFBLEVBQ0EsT0FBQSxJQUFNO0NBQ04sRUFBQSxjQUFPO0NBaEJ6QixDQWtCMkIsQ0FsQjNCLENBQUEsS0FhcUIsS0FickI7Q0F6RUEsQ0FpR29CLENBSnBCLENBQUEsQ0FBSyxDQUFMLENBQUEsQ0FBQSxDQUFBLElBQUE7Q0FPUSxDQUFBLENBQW1CLENBQVosRUFBTSxXQUFOO0NBUGYsQ0FRZ0IsQ0FSaEIsQ0FBQSxLQU1nQjtDQUdELENBQTBCLENBQWpDLEdBQU0sQ0FBbUIsVUFBekI7Q0FUUixFQVVXLENBVlgsS0FRZ0I7Q0FFRSxPQUFBLFNBQU87Q0FWekIsUUFVVztDQXZHWCxDQTBHb0MsQ0FBNUIsQ0FBQSxDQUFSLENBQVEsQ0FBQSxDQUFSO0NBMUdBLENBK0dpQixDQUFBLENBSmpCLENBQUssQ0FBTCxDQUFBLENBQUEsQ0FBQTtDQUkrQixLQUFQLFdBQUE7Q0FKeEIsQ0FLaUIsQ0FBQSxDQUxqQixLQUlpQjtDQUNjLEtBQVAsV0FBQTtDQUx4QixDQU1pQixDQUNZLENBUDdCLENBQUEsQ0FNdUIsQ0FOdkIsQ0FBQSxDQUtpQixLQUxqQixFQUFBO0NBM0dBLENBMkhnQixDQUpoQixDQUFBLENBQUssQ0FBTCxDQUFBLENBQUEsQ0FBQTtDQUk4QixLQUFQLFdBQUE7Q0FKdkIsQ0FLZ0IsQ0FMaEIsQ0FBQSxFQUtzQixDQUFhLEVBRG5CO0NBRWEsS0FBWCxJQUFBLE9BQUE7Q0FObEIsUUFNVztDQTdIWCxDQThIbUMsQ0FBbkMsQ0FBQSxDQUFLLENBQUwsQ0FBQSxDQUFBLEdBQUEsRUFJeUI7Q0FsSXpCLENBcUlrQyxDQUF6QixDQUFBLEVBQVQsRUFBQTtDQXJJQSxFQXVJRSxDQUFBLENBQUEsQ0FBTSxDQUFOLENBREYsQ0FDRSxHQURGO0NBS29CLE9BQUEsU0FBTztDQUp6QixDQUtpQixDQUxqQixDQUFBLEtBSVk7Q0FFSixhQUFBLGtCQUFBO0NBQUEsRUFBTyxDQUFQLEVBQU8sSUFBUDtDQUFBLEVBQ2EsQ0FBQSxNQUFiLFdBQWtCO0NBRGxCLEVBRWlCLENBQUEsTUFBakIsSUFBQSxPQUF1QjtDQUN2QixFQUFzQyxDQUFiLENBQXpCLEtBQUE7Q0FBQSxhQUFBLEtBQU87WUFIUDtDQUlBLEVBQVksQ0FBTCxhQUFBO0NBVmYsQ0FZaUIsQ0FaakIsQ0FBQSxLQUtpQjtDQVFULEdBQUEsVUFBQTtDQUFBLEVBQU8sQ0FBUCxFQUFPLElBQVA7Q0FDQSxDQUFBLENBQTBCLENBQVAsTUFBbkI7Q0FBQSxDQUFBLENBQVksQ0FBTCxlQUFBO1lBRFA7Q0FFQSxFQUFZLENBQUwsYUFBQTtDQWZmLFFBWWlCO0NBbkpuQixDQTJKa0MsQ0FBekIsQ0FBQSxFQUFULEVBQUE7Q0EzSkEsQ0FpS29CLENBSmxCLENBQUEsQ0FBQSxDQUFNLENBQU4sQ0FERixDQUNFLEdBREY7Q0FLb0MsS0FBUCxXQUFBO0NBSjNCLENBS2tCLENBQUEsQ0FMbEIsS0FJa0I7Q0FDZ0IsS0FBUCxXQUFBO0NBTDNCLENBTXFCLENBQUEsQ0FOckIsR0FBQSxFQUtrQjtDQUNHLEVBQWEsQ0FBSCxhQUFBO0NBTi9CLENBT2lCLENBUGpCLENBQUEsRUFBQSxHQU1xQjtDQUdMLEVBQUEsV0FBQTtDQUFBLEVBQUEsT0FBQTtDQUFBLEVBQ0EsTUFBTSxDQUFOO0NBQ0EsRUFBQSxjQUFPO0NBWHZCLENBYXNCLENBQUEsQ0FidEIsSUFBQSxDQVFvQjtDQU1KLEVBQUEsV0FBQTtDQUFBLENBQU0sQ0FBTixDQUFVLENBQUosS0FBTjtDQUFBLEVBQ0EsT0FBQSxJQUFNO0NBQ04sRUFBQSxjQUFPO0NBaEJ2QixDQWtCNEIsQ0FsQjVCLENBQUEsS0Fhc0IsS0FidEI7Q0FvQlcsRUFBeUIsQ0FBYixFQUFBLElBQVosSUFBYTtDQUFiLGtCQUFPO1lBQVA7Q0FDQSxnQkFBTztDQXJCbEIsUUFtQnVCO0NBS3hCLENBQ2lCLENBRGxCLENBQUEsRUFBQSxDQUFBLENBQUEsRUFBQSxDQUFBLEdBQUEsQ0FBQTtDQXRMRixNQUFlO0NBN0JqQixJQTRCUTtDQTVCUixFQWlPYyxDQUFkLENBQUssSUFBVTtBQUNJLENBQWpCLEdBQWdCLEVBQWhCLEdBQTBCO0NBQTFCLElBQUEsVUFBTztRQUFQO0NBQUEsRUFDUSxFQUFSLENBQUE7Q0FGWSxZQUdaO0NBcE9GLElBaU9jO0NBak9kLEVBc09lLENBQWYsQ0FBSyxDQUFMLEdBQWdCO0FBQ0ksQ0FBbEIsR0FBaUIsRUFBakIsR0FBMkI7Q0FBM0IsS0FBQSxTQUFPO1FBQVA7Q0FBQSxFQUNTLEVBRFQsQ0FDQTtDQUZhLFlBR2I7Q0F6T0YsSUFzT2U7Q0F0T2YsRUEyT2UsQ0FBZixDQUFLLENBQUwsR0FBZ0I7QUFDSSxDQUFsQixHQUFpQixFQUFqQixHQUEyQjtDQUEzQixLQUFBLFNBQU87UUFBUDtDQUFBLEVBQ1MsRUFEVCxDQUNBO0NBRmEsWUFHYjtDQTlPRixJQTJPZTtDQTNPZixFQWdQZ0IsQ0FBaEIsQ0FBSyxFQUFMLEVBQWlCO0FBQ0ksQ0FBbkIsR0FBa0IsRUFBbEIsR0FBNEI7Q0FBNUIsTUFBQSxRQUFPO1FBQVA7Q0FBQSxFQUNVLEVBRFYsQ0FDQSxDQUFBO0NBRmMsWUFHZDtDQW5QRixJQWdQZ0I7Q0FoUGhCLEVBcVBhLENBQWIsQ0FBSyxJQUFTO0FBQ0ksQ0FBaEIsR0FBZSxFQUFmLEdBQXlCO0NBQXpCLEdBQUEsV0FBTztRQUFQO0NBQUEsRUFDTyxDQUFQLENBREEsQ0FDQTtDQUZXLFlBR1g7Q0F4UEYsSUFxUGE7Q0FyUGIsRUEwUGdCLENBQWhCLENBQUssRUFBTCxFQUFpQjtBQUNJLENBQW5CLEdBQWtCLEVBQWxCLEdBQTRCO0NBQTVCLE1BQUEsUUFBTztRQUFQO0NBQUEsRUFDVSxFQURWLENBQ0EsQ0FBQTtDQUZjLFlBR2Q7Q0E3UEYsSUEwUGdCO0NBMVBoQixFQStQZSxDQUFmLENBQUssQ0FBTCxHQUFnQjtBQUNJLENBQWxCLEdBQWlCLEVBQWpCLEdBQTJCO0NBQTNCLEtBQUEsU0FBTztRQUFQO0NBQUEsRUFDUyxFQURULENBQ0E7Q0FGYSxZQUdiO0NBbFFGLElBK1BlO0NBL1BmLEVBb1FhLENBQWIsQ0FBSyxJQUFTO0FBQ0ksQ0FBaEIsR0FBZSxFQUFmLEdBQXlCO0NBQXpCLEdBQUEsV0FBTztRQUFQO0NBQUEsRUFDTyxDQUFQLENBREEsQ0FDQTtDQUZXLFlBR1g7Q0F2UUYsSUFvUWE7Q0FwUWIsRUF5UWdCLENBQWhCLENBQUssRUFBTCxFQUFpQjtBQUNJLENBQW5CLEdBQWtCLEVBQWxCLEdBQTRCO0NBQTVCLE1BQUEsUUFBTztRQUFQO0NBQUEsRUFDVSxFQURWLENBQ0EsQ0FBQTtDQUZjLFlBR2Q7Q0E1UUYsSUF5UWdCO0NBelFoQixFQThRZSxDQUFmLENBQUssQ0FBTCxHQUFnQjtBQUNJLENBQWxCLEdBQWlCLEVBQWpCLEdBQTJCO0NBQTNCLEtBQUEsU0FBTztRQUFQO0NBQUEsRUFDUyxFQURULENBQ0E7Q0FGYSxZQUdiO0NBalJGLElBOFFlO0NBOVFmLEVBbVJrQixDQUFsQixDQUFLLElBQUw7QUFDdUIsQ0FBckIsR0FBb0IsRUFBcEIsR0FBOEI7Q0FBOUIsUUFBQSxNQUFPO1FBQVA7Q0FBQSxFQUNZLEVBRFosQ0FDQSxHQUFBO0NBRmdCLFlBR2hCO0NBdFJGLElBbVJrQjtDQW5SbEIsRUF3Um1CLENBQW5CLENBQUssSUFBZSxDQUFwQjtDQUNFLFNBQUE7QUFBc0IsQ0FBdEIsR0FBcUIsRUFBckIsR0FBK0I7Q0FBL0IsU0FBQSxLQUFPO1FBQVA7Q0FBQSxFQUNhLEVBRGIsQ0FDQSxJQUFBO0NBRmlCLFlBR2pCO0NBM1JGLElBd1JtQjtDQXhSbkIsRUE2UmtCLENBQWxCLENBQUssSUFBTDtBQUN1QixDQUFyQixHQUFvQixFQUFwQixHQUE4QjtDQUE5QixRQUFBLE1BQU87UUFBUDtDQUFBLEVBQ1ksRUFEWixDQUNBLEdBQUE7Q0FGZ0IsWUFHaEI7Q0FoU0YsSUE2UmtCO0NBN1JsQixFQWtTb0IsQ0FBcEIsQ0FBSyxJQUFnQixFQUFyQjtDQUNFLFNBQUEsQ0FBQTtBQUF1QixDQUF2QixHQUFzQixFQUF0QixHQUFnQztDQUFoQyxVQUFBLElBQU87UUFBUDtDQUFBLEVBQ2MsRUFEZCxDQUNBLEtBQUE7Q0FGa0IsWUFHbEI7Q0FyU0YsSUFrU29CO0NBbFNwQixFQXVTYSxDQUFiLENBQUssSUFBUztBQUNJLENBQWhCLEdBQWUsRUFBZixHQUF5QjtDQUF6QixHQUFBLFdBQU87UUFBUDtDQUFBLEVBQ08sQ0FBUCxDQURBLENBQ0E7Q0FGVyxZQUdYO0NBMVNGLElBdVNhO0NBdlNiLEVBNFNhLENBQWIsQ0FBSyxJQUFTO0FBQ0ksQ0FBaEIsR0FBZSxFQUFmLEdBQXlCO0NBQXpCLEdBQUEsV0FBTztRQUFQO0NBQUEsRUFDTyxDQUFQLENBREEsQ0FDQTtDQUZXLFlBR1g7Q0EvU0YsSUE0U2E7Q0E1U2IsRUFpVGEsQ0FBYixDQUFLLElBQVM7Q0FDWixHQUFBLE1BQUE7QUFBZ0IsQ0FBaEIsR0FBZSxFQUFmLEdBQXlCO0NBQXpCLEdBQUEsV0FBTztRQUFQO0NBQUEsRUFDTyxDQUFQLENBREEsQ0FDQTtDQUZXLFlBR1g7Q0FwVEYsSUFpVGE7Q0FqVGIsRUFzVGEsQ0FBYixDQUFLLElBQVM7Q0FDWixHQUFBLE1BQUE7QUFBZ0IsQ0FBaEIsR0FBZSxFQUFmLEdBQXlCO0NBQXpCLEdBQUEsV0FBTztRQUFQO0NBQUEsRUFDTyxDQUFQLENBREEsQ0FDQTtDQUZXLFlBR1g7Q0F6VEYsSUFzVGE7Q0F0VGIsRUEyVGUsQ0FBZixDQUFLLENBQUwsR0FBZTtDQUNiLEtBQUEsT0FBTztDQTVUVCxJQTJUZTtDQTNUZixFQThUZSxDQUFmLENBQUssQ0FBTCxHQUFlO0NBQ2IsS0FBQSxPQUFPO0NBL1RULElBOFRlO0NBOVRmLEVBaVVxQixDQUFyQixDQUFLLElBQWdCLEdBQXJCO0NBQ0UsV0FBQSxDQUFPO0NBbFVULElBaVVxQjtDQWpVckIsRUFvVXFCLENBQXJCLENBQUssSUFBZ0IsR0FBckI7Q0FDRSxXQUFBLENBQU87Q0FyVVQsSUFvVXFCO0NBcFVyQixFQXVVcUIsQ0FBckIsQ0FBSyxJQUFnQixHQUFyQjtDQUNFLFdBQUEsQ0FBTztDQXhVVCxJQXVVcUI7Q0F4VVYsVUE0VVg7Q0FwWkYsRUF3RWE7O0NBeEViLENBc1pBLENBQVksTUFBWjtDQUNFLEtBQUEsRUFBQTtDQUFBLENBQXdCLENBQWYsQ0FBVCxDQUFTLENBQVQsQ0FBUyxDQUFBLEVBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQTtDQUNULEtBQWMsS0FBUDtDQXhaVCxFQXNaWTs7Q0F0WlosQ0EwWkEsQ0FBaUIsTUFBQyxLQUFsQjtDQUNFLE1BQUEsQ0FBQTtDQUFBLENBQW9CLENBQVYsQ0FBVixFQUFVLENBQVY7Q0FDQSxNQUFlLElBQVI7Q0E1WlQsRUEwWmlCOztDQTFaakIsQ0ErWkEsQ0FBYSxNQUFDLENBQWQ7Q0FDRSxHQUFBLElBQUE7Q0FBQSxFQUFJLENBQUo7Q0FBQSxDQUNtQixDQUFaLENBQVAsQ0FBTztDQUNQLEVBQW1CLENBQW5CO0NBQUEsRUFBTyxDQUFQLEVBQUE7TUFGQTtDQUFBLEVBR08sQ0FBUDtDQUNHLENBQUQsQ0FBUyxDQUFBLEVBQVgsS0FBQTtDQXBhRixFQStaYTs7Q0EvWmI7O0NBRDhCOztBQXVhaEMsQ0FqYkEsRUFpYmlCLEdBQVgsQ0FBTixVQWpiQTs7OztBQ0FBLENBQU8sRUFDTCxHQURJLENBQU47Q0FDRSxDQUFBLFVBQUEsY0FBQTtDQUFBLENBQ0EsWUFBQSxZQURBO0NBQUEsQ0FFQSxRQUFBLGdCQUZBO0NBQUEsQ0FHQSxzQkFBQSxFQUhBO0NBQUEsQ0FJQSxhQUFBLFdBSkE7Q0FERixDQUFBOzs7O0FDQUEsSUFBQSxpRkFBQTs7QUFBQSxDQUFBLEVBQVksSUFBQSxFQUFaLGtCQUFZOztBQUNaLENBREEsRUFDbUIsSUFBQSxTQUFuQixXQUFtQjs7QUFDbkIsQ0FGQSxFQUVrQixJQUFBLFFBQWxCLFdBQWtCOztBQUNsQixDQUhBLEVBR3VCLElBQUEsYUFBdkIsV0FBdUI7O0FBQ3ZCLENBSkEsRUFJb0IsSUFBQSxVQUFwQixRQUFvQjs7QUFFcEIsQ0FOQSxFQU1VLEdBQUosR0FBcUIsS0FBM0I7Q0FDRSxDQUFBLEVBQUEsRUFBTSxTQUFNLENBQUEsQ0FBQSxHQUFBO0NBR0wsS0FBRCxHQUFOLEVBQUEsS0FBbUI7Q0FKSzs7OztBQ04xQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOltudWxsLCJtb2R1bGUuZXhwb3J0cyA9IChlbCkgLT5cbiAgJGVsID0gJCBlbFxuICBhcHAgPSB3aW5kb3cuYXBwXG4gIHRvYyA9IGFwcC5nZXRUb2MoKVxuICB1bmxlc3MgdG9jXG4gICAgY29uc29sZS5sb2cgJ05vIHRhYmxlIG9mIGNvbnRlbnRzIGZvdW5kJ1xuICAgIHJldHVyblxuICB0b2dnbGVycyA9ICRlbC5maW5kKCdhW2RhdGEtdG9nZ2xlLW5vZGVdJylcbiAgIyBTZXQgaW5pdGlhbCBzdGF0ZVxuICBmb3IgdG9nZ2xlciBpbiB0b2dnbGVycy50b0FycmF5KClcbiAgICAkdG9nZ2xlciA9ICQodG9nZ2xlcilcbiAgICBub2RlaWQgPSAkdG9nZ2xlci5kYXRhKCd0b2dnbGUtbm9kZScpXG4gICAgdHJ5XG4gICAgICB2aWV3ID0gdG9jLmdldENoaWxkVmlld0J5SWQgbm9kZWlkXG4gICAgICBub2RlID0gdmlldy5tb2RlbFxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS12aXNpYmxlJywgISFub2RlLmdldCgndmlzaWJsZScpXG4gICAgICAkdG9nZ2xlci5kYXRhICd0b2NJdGVtJywgdmlld1xuICAgIGNhdGNoIGVcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtbm90LWZvdW5kJywgJ3RydWUnXG5cbiAgdG9nZ2xlcnMub24gJ2NsaWNrJywgKGUpIC0+XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgJGVsID0gJChlLnRhcmdldClcbiAgICB2aWV3ID0gJGVsLmRhdGEoJ3RvY0l0ZW0nKVxuICAgIGlmIHZpZXdcbiAgICAgIHZpZXcudG9nZ2xlVmlzaWJpbGl0eShlKVxuICAgICAgJGVsLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhdmlldy5tb2RlbC5nZXQoJ3Zpc2libGUnKVxuICAgIGVsc2VcbiAgICAgIGFsZXJ0IFwiTGF5ZXIgbm90IGZvdW5kIGluIHRoZSBjdXJyZW50IFRhYmxlIG9mIENvbnRlbnRzLiBcXG5FeHBlY3RlZCBub2RlaWQgI3skZWwuZGF0YSgndG9nZ2xlLW5vZGUnKX1cIlxuIiwiY2xhc3MgSm9iSXRlbSBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgY2xhc3NOYW1lOiAncmVwb3J0UmVzdWx0J1xuICBldmVudHM6IHt9XG4gIGJpbmRpbmdzOlxuICAgIFwiaDYgYVwiOlxuICAgICAgb2JzZXJ2ZTogXCJzZXJ2aWNlTmFtZVwiXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICBuYW1lOiAnaHJlZidcbiAgICAgICAgb2JzZXJ2ZTogJ3NlcnZpY2VVcmwnXG4gICAgICB9XVxuICAgIFwiLnN0YXJ0ZWRBdFwiOlxuICAgICAgb2JzZXJ2ZTogW1wic3RhcnRlZEF0XCIsIFwic3RhdHVzXCJdXG4gICAgICB2aXNpYmxlOiAoKSAtPlxuICAgICAgICBAbW9kZWwuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBvbkdldDogKCkgLT5cbiAgICAgICAgaWYgQG1vZGVsLmdldCgnc3RhcnRlZEF0JylcbiAgICAgICAgICByZXR1cm4gXCJTdGFydGVkIFwiICsgbW9tZW50KEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpKS5mcm9tTm93KCkgKyBcIi4gXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIFwiXCJcbiAgICBcIi5zdGF0dXNcIjogICAgICBcbiAgICAgIG9ic2VydmU6IFwic3RhdHVzXCJcbiAgICAgIG9uR2V0OiAocykgLT5cbiAgICAgICAgc3dpdGNoIHNcbiAgICAgICAgICB3aGVuICdwZW5kaW5nJ1xuICAgICAgICAgICAgXCJ3YWl0aW5nIGluIGxpbmVcIlxuICAgICAgICAgIHdoZW4gJ3J1bm5pbmcnXG4gICAgICAgICAgICBcInJ1bm5pbmcgYW5hbHl0aWNhbCBzZXJ2aWNlXCJcbiAgICAgICAgICB3aGVuICdjb21wbGV0ZSdcbiAgICAgICAgICAgIFwiY29tcGxldGVkXCJcbiAgICAgICAgICB3aGVuICdlcnJvcidcbiAgICAgICAgICAgIFwiYW4gZXJyb3Igb2NjdXJyZWRcIlxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNcbiAgICBcIi5xdWV1ZUxlbmd0aFwiOiBcbiAgICAgIG9ic2VydmU6IFwicXVldWVMZW5ndGhcIlxuICAgICAgb25HZXQ6ICh2KSAtPlxuICAgICAgICBzID0gXCJXYWl0aW5nIGJlaGluZCAje3Z9IGpvYlwiXG4gICAgICAgIGlmIHYubGVuZ3RoID4gMVxuICAgICAgICAgIHMgKz0gJ3MnXG4gICAgICAgIHJldHVybiBzICsgXCIuIFwiXG4gICAgICB2aXNpYmxlOiAodikgLT5cbiAgICAgICAgdj8gYW5kIHBhcnNlSW50KHYpID4gMFxuICAgIFwiLmVycm9yc1wiOlxuICAgICAgb2JzZXJ2ZTogJ2Vycm9yJ1xuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/Lmxlbmd0aCA+IDJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgaWYgdj9cbiAgICAgICAgICBKU09OLnN0cmluZ2lmeSh2LCBudWxsLCAnICAnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoQG1vZGVsKSAtPlxuICAgIHN1cGVyKClcblxuICByZW5kZXI6ICgpIC0+XG4gICAgQCRlbC5odG1sIFwiXCJcIlxuICAgICAgPGg2PjxhIGhyZWY9XCIjXCIgdGFyZ2V0PVwiX2JsYW5rXCI+PC9hPjxzcGFuIGNsYXNzPVwic3RhdHVzXCI+PC9zcGFuPjwvaDY+XG4gICAgICA8ZGl2PlxuICAgICAgICA8c3BhbiBjbGFzcz1cInN0YXJ0ZWRBdFwiPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJxdWV1ZUxlbmd0aFwiPjwvc3Bhbj5cbiAgICAgICAgPHByZSBjbGFzcz1cImVycm9yc1wiPjwvcHJlPlxuICAgICAgPC9kaXY+XG4gICAgXCJcIlwiXG4gICAgQHN0aWNraXQoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEpvYkl0ZW0iLCJjbGFzcyBSZXBvcnRSZXN1bHRzIGV4dGVuZHMgQmFja2JvbmUuQ29sbGVjdGlvblxuXG4gIGRlZmF1bHRQb2xsaW5nSW50ZXJ2YWw6IDMwMDBcblxuICBjb25zdHJ1Y3RvcjogKEBza2V0Y2gsIEBkZXBzKSAtPlxuICAgIEB1cmwgPSB1cmwgPSBcIi9yZXBvcnRzLyN7QHNrZXRjaC5pZH0vI3tAZGVwcy5qb2luKCcsJyl9XCJcbiAgICBzdXBlcigpXG5cbiAgcG9sbDogKCkgPT5cbiAgICBAZmV0Y2gge1xuICAgICAgc3VjY2VzczogKCkgPT5cbiAgICAgICAgQHRyaWdnZXIgJ2pvYnMnXG4gICAgICAgIGZvciByZXN1bHQgaW4gQG1vZGVsc1xuICAgICAgICAgIGlmIHJlc3VsdC5nZXQoJ3N0YXR1cycpIG5vdCBpbiBbJ2NvbXBsZXRlJywgJ2Vycm9yJ11cbiAgICAgICAgICAgIHVubGVzcyBAaW50ZXJ2YWxcbiAgICAgICAgICAgICAgQGludGVydmFsID0gc2V0SW50ZXJ2YWwgQHBvbGwsIEBkZWZhdWx0UG9sbGluZ0ludGVydmFsXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgIyBhbGwgY29tcGxldGUgdGhlblxuICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChAaW50ZXJ2YWwpIGlmIEBpbnRlcnZhbFxuICAgICAgICBpZiBwcm9ibGVtID0gXy5maW5kKEBtb2RlbHMsIChyKSAtPiByLmdldCgnZXJyb3InKT8pXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywgXCJQcm9ibGVtIHdpdGggI3twcm9ibGVtLmdldCgnc2VydmljZU5hbWUnKX0gam9iXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEB0cmlnZ2VyICdmaW5pc2hlZCdcbiAgICAgIGVycm9yOiAoZSwgcmVzLCBhLCBiKSA9PlxuICAgICAgICBjb25zb2xlLmxvZyhcIiEhISEhISEhISEhaGVsbG86IFwiLCBAKVxuICAgICAgICB1bmxlc3MgcmVzLnN0YXR1cyBpcyAwXG4gICAgICAgICAgaWYgcmVzLnJlc3BvbnNlVGV4dD8ubGVuZ3RoXG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAganNvbiA9IEpTT04ucGFyc2UocmVzLnJlc3BvbnNlVGV4dClcbiAgICAgICAgICAgIGNhdGNoXG4gICAgICAgICAgICAgICMgZG8gbm90aGluZ1xuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgICAgY29uc29sZS5sb2coXCIhISEhISEhISEhIWhlbGxvOiBcIiwgQClcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBqc29uPy5lcnJvcj8ubWVzc2FnZSBvciBcbiAgICAgICAgICAgICdQcm9ibGVtIGNvbnRhY3RpbmcgdGhlIFNlYVNrZXRjaCBzZXJ2ZXInXG4gICAgfVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydFJlc3VsdHNcbiIsImVuYWJsZUxheWVyVG9nZ2xlcnMgPSByZXF1aXJlICcuL2VuYWJsZUxheWVyVG9nZ2xlcnMuY29mZmVlJ1xucm91bmQgPSByZXF1aXJlKCcuL3V0aWxzLmNvZmZlZScpLnJvdW5kXG5SZXBvcnRSZXN1bHRzID0gcmVxdWlyZSAnLi9yZXBvcnRSZXN1bHRzLmNvZmZlZSdcbnQgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJylcbnRlbXBsYXRlcyA9XG4gIHJlcG9ydExvYWRpbmc6IHRbJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9yZXBvcnRMb2FkaW5nJ11cbkpvYkl0ZW0gPSByZXF1aXJlICcuL2pvYkl0ZW0uY29mZmVlJ1xuQ29sbGVjdGlvblZpZXcgPSByZXF1aXJlKCd2aWV3cy9jb2xsZWN0aW9uVmlldycpXG5cbmNsYXNzIFJlY29yZFNldFxuXG4gIGNvbnN0cnVjdG9yOiAoQGRhdGEsIEB0YWIsIEBza2V0Y2hDbGFzc0lkKSAtPlxuXG4gIHRvQXJyYXk6ICgpIC0+XG4gICAgaWYgQHNrZXRjaENsYXNzSWRcbiAgICAgIGRhdGEgPSBfLmZpbmQgQGRhdGEudmFsdWUsICh2KSA9PiBcbiAgICAgICAgdi5mZWF0dXJlcz9bMF0/LmF0dHJpYnV0ZXM/WydTQ19JRCddIGlzIEBza2V0Y2hDbGFzc0lkICAgICAgICBcbiAgICAgIHVubGVzcyBkYXRhXG4gICAgICAgIHRocm93IFwiQ291bGQgbm90IGZpbmQgZGF0YSBmb3Igc2tldGNoQ2xhc3MgI3tAc2tldGNoQ2xhc3NJZH1cIlxuICAgIGVsc2VcbiAgICAgIGlmIF8uaXNBcnJheSBAZGF0YS52YWx1ZVxuICAgICAgICBkYXRhID0gQGRhdGEudmFsdWVbMF1cbiAgICAgIGVsc2VcbiAgICAgICAgZGF0YSA9IEBkYXRhLnZhbHVlXG4gICAgXy5tYXAgZGF0YS5mZWF0dXJlcywgKGZlYXR1cmUpIC0+XG4gICAgICBmZWF0dXJlLmF0dHJpYnV0ZXNcblxuICByYXc6IChhdHRyKSAtPlxuICAgIGF0dHJzID0gXy5tYXAgQHRvQXJyYXkoKSwgKHJvdykgLT5cbiAgICAgIHJvd1thdHRyXVxuICAgIGF0dHJzID0gXy5maWx0ZXIgYXR0cnMsIChhdHRyKSAtPiBhdHRyICE9IHVuZGVmaW5lZFxuICAgIGlmIGF0dHJzLmxlbmd0aCBpcyAwXG4gICAgICBjb25zb2xlLmxvZyBAZGF0YVxuICAgICAgQHRhYi5yZXBvcnRFcnJvciBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn0gZnJvbSByZXN1bHRzXCJcbiAgICAgIHRocm93IFwiQ291bGQgbm90IGdldCBhdHRyaWJ1dGUgI3thdHRyfVwiXG4gICAgZWxzZSBpZiBhdHRycy5sZW5ndGggaXMgMVxuICAgICAgcmV0dXJuIGF0dHJzWzBdXG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGF0dHJzXG5cbiAgaW50OiAoYXR0cikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgcGFyc2VJbnRcbiAgICBlbHNlXG4gICAgICBwYXJzZUludChyYXcpXG5cbiAgZmxvYXQ6IChhdHRyLCBkZWNpbWFsUGxhY2VzPTIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsICh2YWwpIC0+IHJvdW5kKHZhbCwgZGVjaW1hbFBsYWNlcylcbiAgICBlbHNlXG4gICAgICByb3VuZChyYXcsIGRlY2ltYWxQbGFjZXMpXG5cbiAgYm9vbDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsICh2YWwpIC0+IHZhbC50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG4gICAgZWxzZVxuICAgICAgcmF3LnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSBpcyAndHJ1ZSdcblxuY2xhc3MgUmVwb3J0VGFiIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBuYW1lOiAnSW5mb3JtYXRpb24nXG4gIGRlcGVuZGVuY2llczogW11cblxuICBpbml0aWFsaXplOiAoQG1vZGVsLCBAb3B0aW9ucykgLT5cbiAgICAjIFdpbGwgYmUgaW5pdGlhbGl6ZWQgYnkgU2VhU2tldGNoIHdpdGggdGhlIGZvbGxvd2luZyBhcmd1bWVudHM6XG4gICAgIyAgICogbW9kZWwgLSBUaGUgc2tldGNoIGJlaW5nIHJlcG9ydGVkIG9uXG4gICAgIyAgICogb3B0aW9uc1xuICAgICMgICAgIC0gLnBhcmVudCAtIHRoZSBwYXJlbnQgcmVwb3J0IHZpZXcgXG4gICAgIyAgICAgICAgY2FsbCBAb3B0aW9ucy5wYXJlbnQuZGVzdHJveSgpIHRvIGNsb3NlIHRoZSB3aG9sZSByZXBvcnQgd2luZG93XG4gICAgQGFwcCA9IHdpbmRvdy5hcHBcbiAgICBfLmV4dGVuZCBALCBAb3B0aW9uc1xuICAgIEByZXBvcnRSZXN1bHRzID0gbmV3IFJlcG9ydFJlc3VsdHMoQG1vZGVsLCBAZGVwZW5kZW5jaWVzKVxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdlcnJvcicsIEByZXBvcnRFcnJvclxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdqb2JzJywgQHJlbmRlckpvYkRldGFpbHNcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZXBvcnRKb2JzXG4gICAgQGxpc3RlblRvIEByZXBvcnRSZXN1bHRzLCAnZmluaXNoZWQnLCBfLmJpbmQgQHJlbmRlciwgQFxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdyZXF1ZXN0JywgQHJlcG9ydFJlcXVlc3RlZFxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICB0aHJvdyAncmVuZGVyIG1ldGhvZCBtdXN0IGJlIG92ZXJpZGRlbidcblxuICBzaG93OiAoKSAtPlxuICAgIEAkZWwuc2hvdygpXG4gICAgQHZpc2libGUgPSB0cnVlXG4gICAgaWYgQGRlcGVuZGVuY2llcz8ubGVuZ3RoIGFuZCAhQHJlcG9ydFJlc3VsdHMubW9kZWxzLmxlbmd0aFxuICAgICAgQHJlcG9ydFJlc3VsdHMucG9sbCgpXG4gICAgZWxzZSBpZiAhQGRlcGVuZGVuY2llcz8ubGVuZ3RoXG4gICAgICBAcmVuZGVyKClcblxuICBoaWRlOiAoKSAtPlxuICAgIEAkZWwuaGlkZSgpXG4gICAgQHZpc2libGUgPSBmYWxzZVxuXG4gIHJlbW92ZTogKCkgPT5cbiAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCBAZXRhSW50ZXJ2YWxcbiAgICBAc3RvcExpc3RlbmluZygpXG4gICAgc3VwZXIoKVxuICBcbiAgcmVwb3J0UmVxdWVzdGVkOiAoKSA9PlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXMucmVwb3J0TG9hZGluZy5yZW5kZXIoe30pXG5cbiAgcmVwb3J0RXJyb3I6IChtc2csIGNhbmNlbGxlZFJlcXVlc3QpID0+XG4gICAgdW5sZXNzIGNhbmNlbGxlZFJlcXVlc3RcbiAgICAgIGlmIG1zZyBpcyAnSk9CX0VSUk9SJ1xuICAgICAgICBAc2hvd0Vycm9yICdFcnJvciB3aXRoIHNwZWNpZmljIGpvYidcbiAgICAgIGVsc2VcbiAgICAgICAgQHNob3dFcnJvciBtc2dcblxuICBzaG93RXJyb3I6IChtc2cpID0+XG4gICAgQCQoJy5wcm9ncmVzcycpLnJlbW92ZSgpXG4gICAgQCQoJ3AuZXJyb3InKS5yZW1vdmUoKVxuICAgIEAkKCdoNCcpLnRleHQoXCJBbiBFcnJvciBPY2N1cnJlZFwiKS5hZnRlciBcIlwiXCJcbiAgICAgIDxwIGNsYXNzPVwiZXJyb3JcIiBzdHlsZT1cInRleHQtYWxpZ246Y2VudGVyO1wiPiN7bXNnfTwvcD5cbiAgICBcIlwiXCJcblxuICByZXBvcnRKb2JzOiAoKSA9PlxuICAgIHVubGVzcyBAbWF4RXRhXG4gICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgQCQoJ2g0JykudGV4dCBcIkFuYWx5emluZyBEZXNpZ25zXCJcblxuICBzdGFydEV0YUNvdW50ZG93bjogKCkgPT5cbiAgICBpZiBAbWF4RXRhXG4gICAgICB0b3RhbCA9IChuZXcgRGF0ZShAbWF4RXRhKS5nZXRUaW1lKCkgLSBuZXcgRGF0ZShAZXRhU3RhcnQpLmdldFRpbWUoKSkgLyAxMDAwXG4gICAgICBsZWZ0ID0gKG5ldyBEYXRlKEBtYXhFdGEpLmdldFRpbWUoKSAtIG5ldyBEYXRlKCkuZ2V0VGltZSgpKSAvIDEwMDBcbiAgICAgIF8uZGVsYXkgKCkgPT5cbiAgICAgICAgQHJlcG9ydFJlc3VsdHMucG9sbCgpXG4gICAgICAsIChsZWZ0ICsgMSkgKiAxMDAwXG4gICAgICBfLmRlbGF5ICgpID0+XG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLmNzcyAndHJhbnNpdGlvbi10aW1pbmctZnVuY3Rpb24nLCAnbGluZWFyJ1xuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS5jc3MgJ3RyYW5zaXRpb24tZHVyYXRpb24nLCBcIiN7bGVmdCArIDF9c1wiXG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCcxMDAlJylcbiAgICAgICwgNTAwXG5cbiAgcmVuZGVySm9iRGV0YWlsczogKCkgPT5cbiAgICBtYXhFdGEgPSBudWxsXG4gICAgZm9yIGpvYiBpbiBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIGlmIGpvYi5nZXQoJ2V0YScpXG4gICAgICAgIGlmICFtYXhFdGEgb3Igam9iLmdldCgnZXRhJykgPiBtYXhFdGFcbiAgICAgICAgICBtYXhFdGEgPSBqb2IuZ2V0KCdldGEnKVxuICAgIGlmIG1heEV0YVxuICAgICAgQG1heEV0YSA9IG1heEV0YVxuICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzUlJylcbiAgICAgIEBldGFTdGFydCA9IG5ldyBEYXRlKClcbiAgICAgIEBzdGFydEV0YUNvdW50ZG93bigpXG5cbiAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmNzcygnZGlzcGxheScsICdibG9jaycpXG4gICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5jbGljayAoZSkgPT5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5oaWRlKClcbiAgICAgIEAkKCcuZGV0YWlscycpLnNob3coKVxuICAgIGZvciBqb2IgaW4gQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICBpdGVtID0gbmV3IEpvYkl0ZW0oam9iKVxuICAgICAgaXRlbS5yZW5kZXIoKVxuICAgICAgQCQoJy5kZXRhaWxzJykuYXBwZW5kIGl0ZW0uZWxcblxuICBnZXRSZXN1bHQ6IChpZCkgLT5cbiAgICByZXN1bHRzID0gQGdldFJlc3VsdHMoKVxuICAgIHJlc3VsdCA9IF8uZmluZCByZXN1bHRzLCAocikgLT4gci5wYXJhbU5hbWUgaXMgaWRcbiAgICB1bmxlc3MgcmVzdWx0P1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyByZXN1bHQgd2l0aCBpZCAnICsgaWQpXG4gICAgcmVzdWx0LnZhbHVlXG5cbiAgZ2V0Rmlyc3RSZXN1bHQ6IChwYXJhbSwgaWQpIC0+XG4gICAgcmVzdWx0ID0gQGdldFJlc3VsdChwYXJhbSlcbiAgICB0cnlcbiAgICAgIHJldHVybiByZXN1bHRbMF0uZmVhdHVyZXNbMF0uYXR0cmlidXRlc1tpZF1cbiAgICBjYXRjaCBlXG4gICAgICB0aHJvdyBcIkVycm9yIGZpbmRpbmcgI3twYXJhbX06I3tpZH0gaW4gZ3AgcmVzdWx0c1wiXG5cbiAgZ2V0UmVzdWx0czogKCkgLT5cbiAgICByZXN1bHRzID0gQHJlcG9ydFJlc3VsdHMubWFwKChyZXN1bHQpIC0+IHJlc3VsdC5nZXQoJ3Jlc3VsdCcpLnJlc3VsdHMpXG4gICAgdW5sZXNzIHJlc3VsdHM/Lmxlbmd0aFxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBncCByZXN1bHRzJylcbiAgICBfLmZpbHRlciByZXN1bHRzLCAocmVzdWx0KSAtPlxuICAgICAgcmVzdWx0LnBhcmFtTmFtZSBub3QgaW4gWydSZXN1bHRDb2RlJywgJ1Jlc3VsdE1zZyddXG5cbiAgcmVjb3JkU2V0OiAoZGVwZW5kZW5jeSwgcGFyYW1OYW1lLCBza2V0Y2hDbGFzc0lkPWZhbHNlKSAtPlxuICAgIHVubGVzcyBkZXBlbmRlbmN5IGluIEBkZXBlbmRlbmNpZXNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIlVua25vd24gZGVwZW5kZW5jeSAje2RlcGVuZGVuY3l9XCJcbiAgICBkZXAgPSBAcmVwb3J0UmVzdWx0cy5maW5kIChyKSAtPiByLmdldCgnc2VydmljZU5hbWUnKSBpcyBkZXBlbmRlbmN5XG4gICAgdW5sZXNzIGRlcFxuICAgICAgY29uc29sZS5sb2cgQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCByZXN1bHRzIGZvciAje2RlcGVuZGVuY3l9LlwiXG4gICAgcGFyYW0gPSBfLmZpbmQgZGVwLmdldCgncmVzdWx0JykucmVzdWx0cywgKHBhcmFtKSAtPiBcbiAgICAgIHBhcmFtLnBhcmFtTmFtZSBpcyBwYXJhbU5hbWVcbiAgICB1bmxlc3MgcGFyYW1cbiAgICAgIGNvbnNvbGUubG9nIGRlcC5nZXQoJ2RhdGEnKS5yZXN1bHRzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCBwYXJhbSAje3BhcmFtTmFtZX0gaW4gI3tkZXBlbmRlbmN5fVwiXG4gICAgbmV3IFJlY29yZFNldChwYXJhbSwgQCwgc2tldGNoQ2xhc3NJZClcblxuICBlbmFibGVUYWJsZVBhZ2luZzogKCkgLT5cbiAgICBAJCgnW2RhdGEtcGFnaW5nXScpLmVhY2ggKCkgLT5cbiAgICAgICR0YWJsZSA9ICQoQClcbiAgICAgIHBhZ2VTaXplID0gJHRhYmxlLmRhdGEoJ3BhZ2luZycpXG4gICAgICByb3dzID0gJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykubGVuZ3RoXG4gICAgICBwYWdlcyA9IE1hdGguY2VpbChyb3dzIC8gcGFnZVNpemUpXG4gICAgICBpZiBwYWdlcyA+IDFcbiAgICAgICAgJHRhYmxlLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8dGZvb3Q+XG4gICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgIDx0ZCBjb2xzcGFuPVwiI3skdGFibGUuZmluZCgndGhlYWQgdGgnKS5sZW5ndGh9XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhZ2luYXRpb25cIj5cbiAgICAgICAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+UHJldjwvYT48L2xpPlxuICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgPC90Zm9vdD5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsID0gJHRhYmxlLmZpbmQoJ3Rmb290IHVsJylcbiAgICAgICAgZm9yIGkgaW4gXy5yYW5nZSgxLCBwYWdlcyArIDEpXG4gICAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+I3tpfTwvYT48L2xpPlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+TmV4dDwvYT48L2xpPlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgJHRhYmxlLmZpbmQoJ2xpIGEnKS5jbGljayAoZSkgLT5cbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAkYSA9ICQodGhpcylcbiAgICAgICAgICB0ZXh0ID0gJGEudGV4dCgpXG4gICAgICAgICAgaWYgdGV4dCBpcyAnTmV4dCdcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykubmV4dCgpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdOZXh0J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlIGlmIHRleHQgaXMgJ1ByZXYnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnByZXYoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnUHJldidcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnJlbW92ZUNsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5hZGRDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgbiA9IHBhcnNlSW50KHRleHQpXG4gICAgICAgICAgICAkdGFibGUuZmluZCgndGJvZHkgdHInKS5oaWRlKClcbiAgICAgICAgICAgIG9mZnNldCA9IHBhZ2VTaXplICogKG4gLSAxKVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoXCJ0Ym9keSB0clwiKS5zbGljZShvZmZzZXQsIG4qcGFnZVNpemUpLnNob3coKVxuICAgICAgICAkKCR0YWJsZS5maW5kKCdsaSBhJylbMV0pLmNsaWNrKClcbiAgICAgIFxuICAgICAgaWYgbm9Sb3dzTWVzc2FnZSA9ICR0YWJsZS5kYXRhKCduby1yb3dzJylcbiAgICAgICAgaWYgcm93cyBpcyAwXG4gICAgICAgICAgcGFyZW50ID0gJHRhYmxlLnBhcmVudCgpICAgIFxuICAgICAgICAgICR0YWJsZS5yZW1vdmUoKVxuICAgICAgICAgIHBhcmVudC5yZW1vdmVDbGFzcyAndGFibGVDb250YWluZXInXG4gICAgICAgICAgcGFyZW50LmFwcGVuZCBcIjxwPiN7bm9Sb3dzTWVzc2FnZX08L3A+XCJcblxuICBlbmFibGVMYXllclRvZ2dsZXJzOiAoKSAtPlxuICAgIGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcblxuICBnZXRDaGlsZHJlbjogKHNrZXRjaENsYXNzSWQpIC0+XG4gICAgXy5maWx0ZXIgQGNoaWxkcmVuLCAoY2hpbGQpIC0+IGNoaWxkLmdldFNrZXRjaENsYXNzKCkuaWQgaXMgc2tldGNoQ2xhc3NJZFxuXG5cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0VGFiIiwibW9kdWxlLmV4cG9ydHMgPVxuICBcbiAgcm91bmQ6IChudW1iZXIsIGRlY2ltYWxQbGFjZXMpIC0+XG4gICAgdW5sZXNzIF8uaXNOdW1iZXIgbnVtYmVyXG4gICAgICBudW1iZXIgPSBwYXJzZUZsb2F0KG51bWJlcilcbiAgICBtdWx0aXBsaWVyID0gTWF0aC5wb3cgMTAsIGRlY2ltYWxQbGFjZXNcbiAgICBNYXRoLnJvdW5kKG51bWJlciAqIG11bHRpcGxpZXIpIC8gbXVsdGlwbGllciIsInRoaXNbXCJUZW1wbGF0ZXNcIl0gPSB0aGlzW1wiVGVtcGxhdGVzXCJdIHx8IHt9O1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2F0dHJpYnV0ZXMvYXR0cmlidXRlSXRlbVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8dHIgZGF0YS1hdHRyaWJ1dGUtaWQ9XFxcIlwiKTtfLmIoXy52KF8uZihcImlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiBkYXRhLWF0dHJpYnV0ZS1leHBvcnRpZD1cXFwiXCIpO18uYihfLnYoXy5mKFwiZXhwb3J0aWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiIGRhdGEtYXR0cmlidXRlLXR5cGU9XFxcIlwiKTtfLmIoXy52KF8uZihcInR5cGVcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRkIGNsYXNzPVxcXCJuYW1lXFxcIj5cIik7Xy5iKF8udihfLmYoXCJuYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0ZCBjbGFzcz1cXFwidmFsdWVcXFwiPlwiKTtfLmIoXy52KF8uZihcImZvcm1hdHRlZFZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L3RyPlwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8dGFibGUgY2xhc3M9XFxcImF0dHJpYnV0ZXNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDQ0LDgxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlSXRlbVwiLGMscCxcIiAgICBcIikpO30pO2MucG9wKCk7fV8uYihcIjwvdGFibGU+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9nZW5lcmljQXR0cmlidXRlc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5cIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIEF0dHJpYnV0ZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIixjLHAsXCIgICAgXCIpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9yZXBvcnRMb2FkaW5nXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydExvYWRpbmdcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8ZGl2IGNsYXNzPVxcXCJzcGlubmVyXFxcIj4zPC9kaXY+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlJlcXVlc3RpbmcgUmVwb3J0IGZyb20gU2VydmVyPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiYmFyXFxcIiBzdHlsZT1cXFwid2lkdGg6IDEwMCU7XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgcmVsPVxcXCJkZXRhaWxzXFxcIj5kZXRhaWxzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJkZXRhaWxzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxubW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdOyIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5pZHMgPSByZXF1aXJlICcuL2lkcy5jb2ZmZWUnXG5mb3Iga2V5LCB2YWx1ZSBvZiBpZHNcbiAgd2luZG93W2tleV0gPSB2YWx1ZVxuXG5jbGFzcyBBcnJheUZpc2hpbmdWYWx1ZVRhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnRmlzaGluZyBWYWx1ZSdcbiAgY2xhc3NOYW1lOiAnZmlzaGluZ1ZhbHVlJ1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFycmF5RmlzaGluZ1ZhbHVlXG4gIGRlcGVuZGVuY2llczogWydGaXNoaW5nVmFsdWUnXVxuICB0aW1lb3V0OiAyNDAwMDBcblxuICByZW5kZXI6ICgpIC0+XG4gICAgc2FuY3R1YXJpZXMgPSBAZ2V0Q2hpbGRyZW4gU0FOQ1RVQVJZX0lEXG4gICAgaWYgc2FuY3R1YXJpZXMubGVuZ3RoXG4gICAgICBzYW5jdHVhcnlQZXJjZW50ID0gQHJlY29yZFNldChcbiAgICAgICAgJ0Zpc2hpbmdWYWx1ZScsIFxuICAgICAgICAnRmlzaGluZ1ZhbHVlJywgXG4gICAgICAgIFNBTkNUVUFSWV9JRFxuICAgICAgKS5mbG9hdCgnUEVSQ0VOVCcsIDApXG5cbiAgICBhcXVhY3VsdHVyZUFyZWFzID0gQGdldENoaWxkcmVuIEFRVUFDVUxUVVJFX0lEXG4gICAgaWYgYXF1YWN1bHR1cmVBcmVhcy5sZW5ndGhcbiAgICAgIGFxdWFjdWx0dXJlUGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdGaXNoaW5nVmFsdWUnLCBcbiAgICAgICAgJ0Zpc2hpbmdWYWx1ZScsIFxuICAgICAgICBBUVVBQ1VMVFVSRV9JRFxuICAgICAgKS5mbG9hdCgnUEVSQ0VOVCcsIDApXG5cbiAgICBtb29yaW5ncyA9IEBnZXRDaGlsZHJlbiBNT09SSU5HX0lEXG4gICAgaWYgbW9vcmluZ3MubGVuZ3RoXG4gICAgICBtb29yaW5nUGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdGaXNoaW5nVmFsdWUnLCBcbiAgICAgICAgJ0Zpc2hpbmdWYWx1ZScsIFxuICAgICAgICBNT09SSU5HX0lEXG4gICAgICApLmZsb2F0KCdQRVJDRU5UJywgMilcblxuICAgIGZpc2hpbmdBcmVhcyA9IEBnZXRDaGlsZHJlbiBGSVNISU5HX1BSSU9SSVRZX0FSRUFfSURcbiAgICBpZiBmaXNoaW5nQXJlYXMubGVuZ3RoXG4gICAgICBmaXNoaW5nQXJlYVBlcmNlbnQgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRmlzaGluZ1ByaW9yaXR5QXJlYScsIFxuICAgICAgICAnRmlzaGluZ1ByaW9yaXR5QXJlYScsIFxuICAgICAgICBGSVNISU5HX1BSSU9SSVRZX0FSRUFfSURcbiAgICAgICkuZmxvYXQoJ1BFUkNFTlQnLCAwKVxuXG4gICAgbm9OZXRab25lcyA9IEBnZXRDaGlsZHJlbiBOT19ORVRfWk9ORVNfSURcbiAgICBpZiBub05ldFpvbmVzLmxlbmd0aFxuICAgICAgbm9OZXRab25lc1BlcmNlbnQgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRmlzaGluZ1ZhbHVlJywgXG4gICAgICAgICdGaXNoaW5nVmFsdWUnLCBcbiAgICAgICAgTk9fTkVUX1pPTkVTX0lEXG4gICAgICApLmZsb2F0KCdQRVJDRU5UJywgMClcblxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgc2FuY3R1YXJ5UGVyY2VudDogc2FuY3R1YXJ5UGVyY2VudFxuICAgICAgbnVtU2FuY3R1YXJpZXM6IHNhbmN0dWFyaWVzLmxlbmd0aFxuICAgICAgc2FuY3R1YXJpZXM6IHNhbmN0dWFyaWVzLmxlbmd0aCA+IDBcbiAgICAgIHNhbmNQbHVyYWw6IHNhbmN0dWFyaWVzLmxlbmd0aCA+IDFcbiAgICAgIG1vb3JpbmdBcmVhUGVyY2VudDogbW9vcmluZ1BlcmNlbnRcbiAgICAgIG51bU1vb3JpbmdzOiBtb29yaW5ncy5sZW5ndGhcbiAgICAgIG1vb3JpbmdzOiBtb29yaW5ncy5sZW5ndGggPiAwXG4gICAgICBtb29yaW5nc1BsdXJhbDogbW9vcmluZ3MubGVuZ3RoID4gMVxuICAgICAgZmlzaGluZ0FyZWFQZXJjZW50OiBmaXNoaW5nQXJlYVBlcmNlbnRcbiAgICAgIG51bUZpc2hpbmdBcmVhczogZmlzaGluZ0FyZWFzLmxlbmd0aFxuICAgICAgZmlzaGluZ0FyZWFzOiBmaXNoaW5nQXJlYXMubGVuZ3RoID4gMFxuICAgICAgZmlzaGluZ0FyZWFzUGx1cmFsOiBmaXNoaW5nQXJlYXMubGVuZ3RoID4gMVxuXG4gICAgICBhcXVhY3VsdHVyZUFyZWFQZXJjZW50OiBhcXVhY3VsdHVyZVBlcmNlbnRcbiAgICAgIG51bUFxdWFjdWx0dXJlQXJlYXM6IGFxdWFjdWx0dXJlQXJlYXMubGVuZ3RoXG4gICAgICBhcXVhY3VsdHVyZUFyZWFzOiBhcXVhY3VsdHVyZUFyZWFzLmxlbmd0aCA+IDBcbiAgICAgIGFxdWFjdWx0dXJlQXJlYXNQbHVyYWw6IGFxdWFjdWx0dXJlQXJlYXMubGVuZ3RoID4gMVxuXG4gICAgICBub05ldFpvbmVzUGVyY2VudDogbm9OZXRab25lc1BlcmNlbnRcbiAgICAgIG51bU5vTmV0Wm9uZXM6IG5vTmV0Wm9uZXMubGVuZ3RoXG4gICAgICBoYXNOb05ldFpvbmVzOiBub05ldFpvbmVzLmxlbmd0aCA+IDBcbiAgICAgIG5vTmV0Wm9uZXNQbHVyYWw6IG5vTmV0Wm9uZXMubGVuZ3RoID4gMVxuXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgdGVtcGxhdGVzKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBBcnJheUZpc2hpbmdWYWx1ZVRhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5pZHMgPSByZXF1aXJlICcuL2lkcy5jb2ZmZWUnXG5mb3Iga2V5LCB2YWx1ZSBvZiBpZHNcbiAgd2luZG93W2tleV0gPSB2YWx1ZVxuXG5cbmNsYXNzIEFycmF5SGFiaXRhdFRhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnSGFiaXRhdCdcbiAgY2xhc3NOYW1lOiAnaGFiaXRhdCdcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5hcnJheUhhYml0YXRzXG4gIGRlcGVuZGVuY2llczogWydCYXJidWRhSGFiaXRhdCddXG4gIHRpbWVvdXQ6IDI0MDAwMFxuICBcbiAgcmVuZGVyOiAoKSAtPlxuICAgIHNhbmN0dWFyaWVzID0gQGdldENoaWxkcmVuIFNBTkNUVUFSWV9JRFxuICAgIGlmIHNhbmN0dWFyaWVzLmxlbmd0aFxuICAgICAgc2FuY3R1YXJ5ID0gQHJlY29yZFNldCgnQmFyYnVkYUhhYml0YXQnLCAnSGFiaXRhdHMnLCBTQU5DVFVBUllfSUQpXG4gICAgICAgIC50b0FycmF5KClcbiAgICAgIGZvciByb3cgaW4gc2FuY3R1YXJ5XG4gICAgICAgIGlmIHBhcnNlRmxvYXQocm93LlBlcmNlbnQpID49IDMzXG4gICAgICAgICAgcm93Lm1lZXRzR29hbCA9IHRydWVcblxuICAgIGFxdWFjdWx0dXJlQXJlYXMgPSBAZ2V0Q2hpbGRyZW4gQVFVQUNVTFRVUkVfSURcbiAgICBpZiBhcXVhY3VsdHVyZUFyZWFzLmxlbmd0aFxuICAgICAgYXF1YWN1bHR1cmUgPSBAcmVjb3JkU2V0KCdCYXJidWRhSGFiaXRhdCcsICdIYWJpdGF0cycsIEFRVUFDVUxUVVJFX0lEKVxuICAgICAgICAudG9BcnJheSgpXG5cbiAgICBtb29yaW5ncyA9IEBnZXRDaGlsZHJlbiBNT09SSU5HX0lEXG4gICAgaWYgbW9vcmluZ3MubGVuZ3RoXG4gICAgICBtb29yaW5nRGF0YSA9IEByZWNvcmRTZXQoJ0JhcmJ1ZGFIYWJpdGF0JywgJ0hhYml0YXRzJywgTU9PUklOR19JRClcbiAgICAgICAgLnRvQXJyYXkoKVxuXG4gICAgZmlzaGluZ0FyZWFzID0gQGdldENoaWxkcmVuIEZJU0hJTkdfUFJJT1JJVFlfQVJFQV9JRFxuICAgIGlmIGZpc2hpbmdBcmVhcy5sZW5ndGhcbiAgICAgIGZpc2hpbmdBcmVhRGF0YSA9IEByZWNvcmRTZXQoJ0JhcmJ1ZGFIYWJpdGF0JywgJ0hhYml0YXRzJywgXG4gICAgICAgIEZJU0hJTkdfUFJJT1JJVFlfQVJFQV9JRCkudG9BcnJheSgpXG5cbiAgICBub05ldFpvbmVzID0gQGdldENoaWxkcmVuIE5PX05FVF9aT05FU19JRFxuICAgIGNvbnNvbGUubG9nKFwibm8gbmV0IHpvbmVzISEhISEhISEhXCIsIG5vTmV0Wm9uZXMpXG4gICAgaWYgbm9OZXRab25lcy5sZW5ndGhcbiAgICAgIG5vTmV0Wm9uZXNEYXRhID0gQHJlY29yZFNldCgnQmFyYnVkYUhhYml0YXQnLCAnSGFiaXRhdHMnLCBcbiAgICAgICAgTk9fTkVUX1pPTkVTX0lEKS50b0FycmF5KClcblxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgbnVtU2FuY3R1YXJpZXM6IHNhbmN0dWFyaWVzLmxlbmd0aFxuICAgICAgc2FuY3R1YXJpZXM6IHNhbmN0dWFyaWVzLmxlbmd0aCA+IDBcbiAgICAgIHNhbmN0dWFyeUhhYml0YXQ6IHNhbmN0dWFyeVxuICAgICAgc2FuY3R1YXJ5UGx1cmFsOiBzYW5jdHVhcmllcy5sZW5ndGggPiAxXG4gICAgICBudW1BcXVhY3VsdHVyZTogYXF1YWN1bHR1cmVBcmVhcy5sZW5ndGhcbiAgICAgIGFxdWFjdWx0dXJlQXJlYXM6IGFxdWFjdWx0dXJlQXJlYXMubGVuZ3RoID4gMFxuICAgICAgYXF1YVBsdXJhbDogYXF1YWN1bHR1cmVBcmVhcy5sZW5ndGggPiAxXG4gICAgICBhcXVhY3VsdHVyZUhhYml0YXQ6IGFxdWFjdWx0dXJlXG4gICAgICBtb29yaW5nczogbW9vcmluZ3MubGVuZ3RoID4gMFxuICAgICAgbnVtTW9vcmluZ3M6IG1vb3JpbmdzLmxlbmd0aFxuICAgICAgbW9vcmluZ0RhdGE6IG1vb3JpbmdEYXRhXG4gICAgICBtb29yaW5nUGx1cmFsOiBtb29yaW5ncy5sZW5ndGggPiAxXG5cbiAgICAgIGZpc2hpbmdBcmVhczogZmlzaGluZ0FyZWFzLmxlbmd0aCA+IDBcbiAgICAgIG51bUZpc2hpbmdBcmVhczogZmlzaGluZ0FyZWFzLmxlbmd0aFxuICAgICAgZmlzaGluZ0FyZWFEYXRhOiBmaXNoaW5nQXJlYURhdGFcbiAgICAgIGZpc2hpbmdBcmVhUGx1cmFsOiBmaXNoaW5nQXJlYXMubGVuZ3RoID4gMVxuXG4gICAgICBoYXNOb05ldFpvbmVzOiBub05ldFpvbmVzLmxlbmd0aCA+IDBcbiAgICAgIG51bU5vTmV0Wm9uZXM6IG5vTmV0Wm9uZXMubGVuZ3RoXG4gICAgICBub05ldFpvbmVzRGF0YTogbm9OZXRab25lc0RhdGFcbiAgICAgIG5vTmV0Wm9uZXNQbHVyYWw6IG5vTmV0Wm9uZXMubGVuZ3RoID4gMVxuXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgdGVtcGxhdGVzKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG5cbm1vZHVsZS5leHBvcnRzID0gQXJyYXlIYWJpdGF0VGFiIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbmlkcyA9IHJlcXVpcmUgJy4vaWRzLmNvZmZlZSdcbmZvciBrZXksIHZhbHVlIG9mIGlkc1xuICB3aW5kb3dba2V5XSA9IHZhbHVlXG5cbnJvdW5kID0gcmVxdWlyZSgnYXBpL3V0aWxzJykucm91bmRcblRPVEFMX0FSRUEgPSAxNjQuOCAjIHNxIG1pbGVzXG5UT1RBTF9MQUdPT05fQVJFQSA9IDExLjFcbl9wYXJ0aWFscyA9IHJlcXVpcmUgJ2FwaS90ZW1wbGF0ZXMnXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuXG5jbGFzcyBBcnJheU92ZXJ2aWV3VGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdPdmVydmlldydcbiAgY2xhc3NOYW1lOiAnb3ZlcnZpZXcnXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMuYXJyYXlPdmVydmlld1xuICBkZXBlbmRlbmNpZXM6IFsnRGlhbWV0ZXInXVxuICB0aW1lb3V0OiAxMjAwMDBcblxuICByZW5kZXI6ICgpIC0+XG4gICAgI09DRUFOX0FSRUEgPSBAcmVjb3JkU2V0KCdEaWFtZXRlcicsICdEaWFtZXRlcicpLmZsb2F0KCdPQ0VBTl9BUkVBJylcbiAgICAjTEFHT09OX0FSRUEgPSBAcmVjb3JkU2V0KCdEaWFtZXRlcicsICdEaWFtZXRlcicpLmZsb2F0KCdMQUdPT05fQVJFQScpXG4gICAgI09DRUFOX1BFUkNFTlQgPSAoT0NFQU5fQVJFQSAvIFRPVEFMX0FSRUEpICogMTAwLjBcbiAgICAjTEFHT09OX1BFUkNFTlQgPSAoTEFHT09OX0FSRUEgLyBUT1RBTF9MQUdPT05fQVJFQSkgKiAxMDAuMFxuICAgIHNhbmN0dWFyaWVzID0gW11cbiAgICBhcXVhY3VsdHVyZUFyZWFzID0gW11cbiAgICBtb29yaW5ncyA9IFtdXG4gICAgbm9OZXRab25lcyA9IFtdXG4gICAgZmlzaGluZ0FyZWFzID0gW11cblxuICAgIHNhbmN0dWFyaWVzID0gXy5maWx0ZXIgQGNoaWxkcmVuLCAoYykgLT4gXG4gICAgICBjLmdldCgnc2tldGNoY2xhc3MnKSBpcyBTQU5DVFVBUllfSURcbiAgICBudW1TYW5jdHVhcmllcyA9IHNhbmN0dWFyaWVzLmxlbmd0aFxuICAgIGlmIG51bVNhbmN0dWFyaWVzID4gMFxuICAgICAgc2FuY3R1YXJ5T2NlYW5BcmVhID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBTQU5DVFVBUllfSURcbiAgICAgICkuZmxvYXQoJ09DRUFOX0FSRUEnLCAxKVxuICAgICAgc2FuY3R1YXJ5TGFnb29uQXJlYSA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgU0FOQ1RVQVJZX0lEXG4gICAgICApLmZsb2F0KCdMQUdPT05fQVJFQScsIDEpXG4gICAgICBzYW5jdHVhcnlPY2VhblBlcmNlbnQgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIFNBTkNUVUFSWV9JRFxuICAgICAgKS5mbG9hdCgnT0NFQU5fUEVSQ0VOVCcsIDEpXG4gICAgICBzYW5jdHVhcnlMYWdvb25QZXJjZW50ID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBTQU5DVFVBUllfSURcbiAgICAgICkuZmxvYXQoJ0xBR09PTl9QRVJDRU5UJywgMSlcbiAgICBlbHNlXG4gICAgICBzYW5jdHVhcnlPY2VhbkFyZWEgPSAwXG4gICAgICBzYW5jdHVhcnlPY2VhblBlcmNlbnQgPSAwLjBcbiAgICAgIHNhbmN0dWFyeUxhZ29vbkFyZWEgPSAwXG4gICAgICBzYW5jdHVhcnlMYWdvb25QZXJjZW50ID0gMC4wXG5cbiAgICBhcXVhY3VsdHVyZUFyZWFzID0gXy5maWx0ZXIgQGNoaWxkcmVuLCAoYykgLT4gXG4gICAgICBjLmdldCgnc2tldGNoY2xhc3MnKSBpcyBBUVVBQ1VMVFVSRV9JRFxuICAgIG51bUFxdWFjdWx0dXJlQXJlYXMgPSBhcXVhY3VsdHVyZUFyZWFzLmxlbmd0aFxuICAgIGlmIG51bUFxdWFjdWx0dXJlQXJlYXMgPiAwXG4gICAgICBhcXVhY3VsdHVyZU9jZWFuQXJlYSA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgQVFVQUNVTFRVUkVfSURcbiAgICAgICkuZmxvYXQoJ09DRUFOX0FSRUEnLCAxKVxuICAgICAgYXF1YWN1bHR1cmVMYWdvb25BcmVhID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBBUVVBQ1VMVFVSRV9JRFxuICAgICAgKS5mbG9hdCgnTEFHT09OX0FSRUEnLCAxKVxuICAgICAgYXF1YWN1bHR1cmVPY2VhblBlcmNlbnQgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIEFRVUFDVUxUVVJFX0lEXG4gICAgICApLmZsb2F0KCdPQ0VBTl9QRVJDRU5UJywgMSlcbiAgICAgIGFxdWFjdWx0dXJlTGFnb29uUGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgQVFVQUNVTFRVUkVfSURcbiAgICAgICkuZmxvYXQoJ0xBR09PTl9QRVJDRU5UJywgMSlcbiAgICBlbHNlXG4gICAgICBhcXVhY3VsdHVyZU9jZWFuQXJlYSA9IDBcbiAgICAgIGFxdWFjdWx0dXJlT2NlYW5QZXJjZW50ID0gMC4wXG4gICAgICBhcXVhY3VsdHVyZUxhZ29vbkFyZWEgPSAwXG4gICAgICBhcXVhY3VsdHVyZUxhZ29vblBlcmNlbnQgPSAwLjBcblxuICAgIG1vb3JpbmdzID0gIF8uZmlsdGVyIEBjaGlsZHJlbiwgKGMpIC0+IFxuICAgICAgYy5nZXQoJ3NrZXRjaGNsYXNzJykgaXMgTU9PUklOR19JRFxuICAgIG51bU1vb3JpbmdzID0gbW9vcmluZ3MubGVuZ3RoXG4gICAgaWYgbnVtTW9vcmluZ3MgPiAwXG4gICAgICBtb29yaW5nc09jZWFuQXJlYSA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgTU9PUklOR19JRFxuICAgICAgKS5mbG9hdCgnT0NFQU5fQVJFQScsIDEpXG4gICAgICBtb29yaW5nc0xhZ29vbkFyZWEgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIE1PT1JJTkdfSURcbiAgICAgICkuZmxvYXQoJ0xBR09PTl9BUkVBJywgMSlcbiAgICAgIG1vb3JpbmdzT2NlYW5QZXJjZW50ID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBNT09SSU5HX0lEXG4gICAgICApLmZsb2F0KCdPQ0VBTl9QRVJDRU5UJywgMSlcbiAgICAgIG1vb3JpbmdzTGFnb29uUGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgTU9PUklOR19JRFxuICAgICAgKS5mbG9hdCgnTEFHT09OX1BFUkNFTlQnLCAxKVxuICAgIGVsc2VcbiAgICAgIG1vb3JpbmdzT2NlYW5BcmVhID0gMFxuICAgICAgbW9vcmluZ3NPY2VhblBlcmNlbnQgPSAwLjBcbiAgICAgIG1vb3JpbmdzTGFnb29uQXJlYSA9IDBcbiAgICAgIG1vb3JpbmdzTGFnb29uUGVyY2VudCA9IDAuMFxuXG4gICAgbm9OZXRab25lcyA9IF8uZmlsdGVyIEBjaGlsZHJlbiwgKGMpIC0+IFxuICAgICAgYy5nZXQoJ3NrZXRjaGNsYXNzJykgaXMgTk9fTkVUX1pPTkVTX0lEXG4gICAgbnVtTm9OZXRab25lcyA9IG5vTmV0Wm9uZXMubGVuZ3RoXG4gICAgaWYgbnVtTm9OZXRab25lcyA+IDBcbiAgICAgIG5vTmV0Wm9uZXNPY2VhbkFyZWEgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIE5PX05FVF9aT05FU19JRFxuICAgICAgKS5mbG9hdCgnT0NFQU5fQVJFQScsIDEpXG4gICAgICBub05ldFpvbmVzTGFnb29uQXJlYSA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgTk9fTkVUX1pPTkVTX0lEXG4gICAgICApLmZsb2F0KCdMQUdPT05fQVJFQScsIDEpIFxuICAgICAgbm9OZXRab25lc09jZWFuUGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgTk9fTkVUX1pPTkVTX0lEXG4gICAgICApLmZsb2F0KCdPQ0VBTl9QRVJDRU5UJywgMSlcbiAgICAgIG5vTmV0Wm9uZXNMYWdvb25QZXJjZW50ID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBOT19ORVRfWk9ORVNfSURcbiAgICAgICkuZmxvYXQoJ0xBR09PTl9QRVJDRU5UJywgMSkgXG4gICAgZWxzZVxuICAgICAgbm9OZXRab25lc09jZWFuQXJlYSA9IDBcbiAgICAgIG5vTmV0Wm9uZXNPY2VhblBlcmNlbnQgPSAwLjBcbiAgICAgIG5vTmV0Wm9uZXNMYWdvb25BcmVhID0gMFxuICAgICAgbm9OZXRab25lc0xhZ29vblBlcmNlbnQgPSAwLjBcblxuICAgIGZpc2hpbmdBcmVhcyA9IF8uZmlsdGVyIEBjaGlsZHJlbiwgKGMpIC0+IFxuICAgICAgYy5nZXQoJ3NrZXRjaGNsYXNzJykgaXMgRklTSElOR19QUklPUklUWV9BUkVBX0lEXG5cbiAgICBudW1GaXNoaW5nQXJlYXMgPSBmaXNoaW5nQXJlYXMubGVuZ3RoXG4gICAgaWYgbnVtRmlzaGluZ0FyZWFzID4gMFxuICAgICAgZmlzaGluZ0FyZWFzT2NlYW5BcmVhID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBGSVNISU5HX1BSSU9SSVRZX0FSRUFfSURcbiAgICAgICkuZmxvYXQoJ09DRUFOX0FSRUEnLCAwKVxuICAgICAgZmlzaGluZ0FyZWFzTGFnb29uQXJlYSA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgRklTSElOR19QUklPUklUWV9BUkVBX0lEXG4gICAgICApLmZsb2F0KCdMQUdPT05fQVJFQScsIDApXG4gICAgICBmaXNoaW5nQXJlYXNPY2VhblBlcmNlbnQgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIEZJU0hJTkdfUFJJT1JJVFlfQVJFQV9JRFxuICAgICAgKS5mbG9hdCgnT0NFQU5fUEVSQ0VOVCcsIDApXG4gICAgICBmaXNoaW5nQXJlYXNMYWdvb25QZXJjZW50ID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBGSVNISU5HX1BSSU9SSVRZX0FSRUFfSURcbiAgICAgICkuZmxvYXQoJ0xBR09PTl9QRVJDRU5UJywgMClcbiAgICBlbHNlXG4gICAgICBmaXNoaW5nQXJlYXNPY2VhbkFyZWEgPSAwXG4gICAgICBmaXNoaW5nQXJlYXNPY2VhblBlcmNlbnQgPSAwLjBcbiAgICAgIGZpc2hpbmdBcmVhc0xhZ29vbkFyZWEgPSAwXG4gICAgICBmaXNoaW5nQXJlYXNMYWdvb25QZXJjZW50ID0gMC4wXG5cbiAgICBudW1Ub3RhbFpvbmVzID0gbnVtU2FuY3R1YXJpZXMrbnVtTm9OZXRab25lcytudW1BcXVhY3VsdHVyZUFyZWFzK251bU1vb3JpbmdzK251bUZpc2hpbmdBcmVhc1xuICAgIHN1bU9jZWFuQXJlYSA9IHNhbmN0dWFyeU9jZWFuQXJlYStub05ldFpvbmVzT2NlYW5BcmVhK2FxdWFjdWx0dXJlT2NlYW5BcmVhK21vb3JpbmdzT2NlYW5BcmVhK2Zpc2hpbmdBcmVhc09jZWFuQXJlYVxuICAgIHN1bU9jZWFuUGVyY2VudCA9IHNhbmN0dWFyeU9jZWFuUGVyY2VudCtub05ldFpvbmVzT2NlYW5QZXJjZW50K2FxdWFjdWx0dXJlT2NlYW5QZXJjZW50K21vb3JpbmdzT2NlYW5QZXJjZW50K2Zpc2hpbmdBcmVhc09jZWFuUGVyY2VudFxuICAgIHN1bUxhZ29vbkFyZWEgPSBzYW5jdHVhcnlMYWdvb25BcmVhK25vTmV0Wm9uZXNMYWdvb25BcmVhK2FxdWFjdWx0dXJlTGFnb29uQXJlYSttb29yaW5nc0xhZ29vbkFyZWErZmlzaGluZ0FyZWFzTGFnb29uQXJlYVxuICAgIHN1bUxhZ29vblBlcmNlbnQgPSBzYW5jdHVhcnlMYWdvb25QZXJjZW50K25vTmV0Wm9uZXNMYWdvb25QZXJjZW50K2FxdWFjdWx0dXJlTGFnb29uUGVyY2VudCttb29yaW5nc0xhZ29vblBlcmNlbnQrZmlzaGluZ0FyZWFzTGFnb29uUGVyY2VudFxuICAgIGhhc1NrZXRjaGVzID0gbnVtVG90YWxab25lcyA+IDBcbiAgICBjb25zb2xlLmxvZyhcIm51bSBzYW5jdHNcIiwgbnVtU2FuY3R1YXJpZXMpXG4gICAgY29uc29sZS5sb2coXCJudW0gbm8gbmV0XCIsIG51bU5vTmV0Wm9uZXMpXG4gICAgY29uc29sZS5sb2coXCJudW0gYXFcIiwgbnVtQXF1YWN1bHR1cmVBcmVhcylcbiAgICBjb25zb2xlLmxvZyhcIm51bSBtb29yaW5nc1wiLCBudW1Nb29yaW5ncylcbiAgICBjb25zb2xlLmxvZyhcIm51bUZpc2hpbmcgXCIsIG51bUZpc2hpbmdBcmVhcylcbiAgICBjb25zb2xlLmxvZyhcIm51bSB0b3RhbCB6b25lc1wiLCBudW1Ub3RhbFpvbmVzKVxuICAgIGNvbnNvbGUubG9nKFwiaGFzIHNrZXRjaGVzOiBcIiwgaGFzU2tldGNoZXMpXG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFueUF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKCkubGVuZ3RoID4gMFxuICAgICAgYWRtaW46IEBwcm9qZWN0LmlzQWRtaW4gd2luZG93LnVzZXJcblxuICAgICAgbnVtU2FuY3R1YXJpZXM6IHNhbmN0dWFyaWVzLmxlbmd0aFxuICAgICAgaGFzU2FuY3R1YXJpZXM6IHNhbmN0dWFyaWVzLmxlbmd0aCA+IDBcbiAgICAgIHNhbmN0dWFyaWVzUGx1cmFsOiBzYW5jdHVhcmllcy5sZW5ndGggPiAxXG4gICAgICBzYW5jdHVhcnlPY2VhblBlcmNlbnQ6IHJvdW5kKHNhbmN0dWFyeU9jZWFuUGVyY2VudCwgMilcbiAgICAgIHNhbmN0dWFyeU9jZWFuQXJlYTogcm91bmQoc2FuY3R1YXJ5T2NlYW5BcmVhLCAxKVxuICAgICAgc2FuY3R1YXJ5TGFnb29uQXJlYTogcm91bmQoc2FuY3R1YXJ5TGFnb29uQXJlYSwgMilcbiAgICAgIHNhbmN0dWFyeUxhZ29vblBlcmNlbnQ6IHJvdW5kKHNhbmN0dWFyeUxhZ29vblBlcmNlbnQsIDEpXG4gICAgICBcbiAgICAgIG51bU5vTmV0Wm9uZXM6IG5vTmV0Wm9uZXMubGVuZ3RoXG4gICAgICBoYXNOb05ldFpvbmVzOiBub05ldFpvbmVzLmxlbmd0aCA+IDBcbiAgICAgIG5vTmV0Wm9uZXNQbHVyYWw6IG5vTmV0Wm9uZXMubGVuZ3RoID4gMVxuICAgICAgbm9OZXRab25lc09jZWFuUGVyY2VudDogcm91bmQobm9OZXRab25lc09jZWFuUGVyY2VudCwgMilcbiAgICAgIG5vTmV0Wm9uZXNPY2VhbkFyZWE6IHJvdW5kKG5vTmV0Wm9uZXNPY2VhbkFyZWEsIDEpXG4gICAgICBub05ldFpvbmVzTGFnb29uQXJlYTogcm91bmQobm9OZXRab25lc0xhZ29vbkFyZWEsIDIpXG4gICAgICBub05ldFpvbmVzTGFnb29uUGVyY2VudDogcm91bmQobm9OZXRab25lc0xhZ29vblBlcmNlbnQsIDEpXG5cbiAgICAgIG51bUFxdWFjdWx0dXJlOiBhcXVhY3VsdHVyZUFyZWFzLmxlbmd0aFxuICAgICAgaGFzQXF1YWN1bHR1cmU6IGFxdWFjdWx0dXJlQXJlYXMubGVuZ3RoID4gMFxuICAgICAgYXF1YWN1bHR1cmVQbHVyYWw6IGFxdWFjdWx0dXJlQXJlYXMubGVuZ3RoID4gMVxuICAgICAgYXF1YWN1bHR1cmVPY2VhblBlcmNlbnQ6IHJvdW5kKGFxdWFjdWx0dXJlT2NlYW5QZXJjZW50LCAyKVxuICAgICAgYXF1YWN1bHR1cmVPY2VhbkFyZWE6IHJvdW5kKGFxdWFjdWx0dXJlT2NlYW5BcmVhLCAxKVxuICAgICAgYXF1YWN1bHR1cmVMYWdvb25BcmVhOiByb3VuZChhcXVhY3VsdHVyZUxhZ29vbkFyZWEsIDIpXG4gICAgICBhcXVhY3VsdHVyZUxhZ29vblBlcmNlbnQ6IHJvdW5kKGFxdWFjdWx0dXJlTGFnb29uUGVyY2VudCwgMSlcblxuICAgICAgbnVtTW9vcmluZ3M6IG1vb3JpbmdzLmxlbmd0aFxuICAgICAgaGFzTW9vcmluZ3M6IG1vb3JpbmdzLmxlbmd0aCA+IDBcbiAgICAgIG1vb3JpbmdzUGx1cmFsOiBtb29yaW5ncy5sZW5ndGggPiAxXG4gICAgICBtb29yaW5nc09jZWFuUGVyY2VudDogcm91bmQobW9vcmluZ3NPY2VhblBlcmNlbnQsIDIpXG4gICAgICBtb29yaW5nc09jZWFuQXJlYTogcm91bmQobW9vcmluZ3NPY2VhbkFyZWEsIDEpXG4gICAgICBtb29yaW5nc0xhZ29vbkFyZWE6IHJvdW5kKG1vb3JpbmdzTGFnb29uQXJlYSwgMilcbiAgICAgIG1vb3JpbmdzTGFnb29uUGVyY2VudDogcm91bmQobW9vcmluZ3NMYWdvb25QZXJjZW50LCAxKVxuICAgICAgXG4gICAgICBudW1GaXNoaW5nQXJlYXM6IGZpc2hpbmdBcmVhcy5sZW5ndGhcbiAgICAgIGhhc0Zpc2hpbmdBcmVhczogZmlzaGluZ0FyZWFzLmxlbmd0aCA+IDBcbiAgICAgIGZpc2hpbmdBcmVhc1BsdXJhbDogZmlzaGluZ0FyZWFzLmxlbmd0aCA+IDFcbiAgICAgIGZpc2hpbmdBcmVhc09jZWFuUGVyY2VudDogcm91bmQoZmlzaGluZ0FyZWFzT2NlYW5QZXJjZW50LCAyKVxuICAgICAgZmlzaGluZ0FyZWFzT2NlYW5BcmVhOiByb3VuZChmaXNoaW5nQXJlYXNPY2VhbkFyZWEsIDEpXG4gICAgICBmaXNoaW5nQXJlYXNMYWdvb25BcmVhOiByb3VuZChmaXNoaW5nQXJlYXNMYWdvb25BcmVhLCAyKVxuICAgICAgZmlzaGluZ0FyZWFzTGFnb29uUGVyY2VudDogcm91bmQoZmlzaGluZ0FyZWFzTGFnb29uUGVyY2VudCwgMSlcblxuICAgICAgaGFzU2tldGNoZXM6IGhhc1NrZXRjaGVzXG4gICAgICBza2V0Y2hlc1BsdXJhbDogbnVtVG90YWxab25lcyA+IDFcbiAgICAgIG51bVNrZXRjaGVzOiBudW1Ub3RhbFpvbmVzXG4gICAgICBzdW1PY2VhbkFyZWE6IHN1bU9jZWFuQXJlYVxuICAgICAgc3VtT2NlYW5QZXJjZW50OiBzdW1PY2VhblBlcmNlbnRcbiAgICAgIHN1bUxhZ29vblBlcmNlbnQ6IHN1bUxhZ29vblBlcmNlbnRcbiAgICAgIHN1bUxhZ29vbkFyZWE6IHN1bUxhZ29vbkFyZWFcbiAgICBcbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBwYXJ0aWFscylcblxuICAgICMgbm9kZXMgPSBbQG1vZGVsXVxuICAgICMgQG1vZGVsLnNldCAnb3BlbicsIHRydWVcbiAgICAjIG5vZGVzID0gbm9kZXMuY29uY2F0IEBjaGlsZHJlblxuICAgICMgY29uc29sZS5sb2cgJ25vZGVzJywgbm9kZXMsICdjaGlsZHJlbicsIEBjaGlsZHJlblxuICAgICMgZm9yIG5vZGUgaW4gbm9kZXNcbiAgICAjICAgbm9kZS5zZXQgJ3NlbGVjdGVkJywgZmFsc2VcbiAgICAjIFRhYmxlT2ZDb250ZW50cyA9IHdpbmRvdy5yZXF1aXJlKCd2aWV3cy90YWJsZU9mQ29udGVudHMnKVxuICAgICMgQHRvYyA9IG5ldyBUYWJsZU9mQ29udGVudHMobm9kZXMpXG4gICAgIyBAJCgnLnRvY0NvbnRhaW5lcicpLmFwcGVuZCBAdG9jLmVsXG4gICAgIyBAdG9jLnJlbmRlcigpXG5cbiAgcmVtb3ZlOiAoKSAtPlxuICAgIEB0b2M/LnJlbW92ZSgpXG4gICAgc3VwZXIoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5T3ZlcnZpZXdUYWIiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xucm91bmQgPSByZXF1aXJlKCdhcGkvdXRpbHMnKS5yb3VuZFxuVE9UQUxfQVJFQSA9IDE2NC44ICMgc3EgbWlsZXNcblRPVEFMX0xBR09PTl9BUkVBID0gMTEuMVxuX3BhcnRpYWxzID0gcmVxdWlyZSAnYXBpL3RlbXBsYXRlcydcbnBhcnRpYWxzID0gW11cbmZvciBrZXksIHZhbCBvZiBfcGFydGlhbHNcbiAgcGFydGlhbHNba2V5LnJlcGxhY2UoJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS8nLCAnJyldID0gdmFsXG5cbmNsYXNzIEFycmF5VHJhZGVvZmZzVGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdUcmFkZW9mZnMnXG4gIGNsYXNzTmFtZTogJ3RyYWRlb2ZmcydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5hcnJheVRyYWRlb2Zmc1xuICBkZXBlbmRlbmNpZXM6IFsnVHJhZGVvZmZzUHJvcElkJ11cbiAgdGltZW91dDogMTIwMDAwXG5cblxuICByZW5kZXI6ICgpIC0+XG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgcGFydGlhbHMpXG5cblxuICAgIHRyYWRlb2ZmX2RhdGEgPSBAcmVjb3JkU2V0KCdUcmFkZW9mZnNQcm9wSWQnLCAnVHJhZGVvZmZzUHJvcElkJykudG9BcnJheSgpXG5cbiAgICBoID0gMzgwXG4gICAgdyA9IDM4MFxuICAgIG1hcmdpbiA9IHtsZWZ0OjQwLCB0b3A6NSwgcmlnaHQ6NDAsIGJvdHRvbTogNDAsIGlubmVyOjV9XG4gICAgaGFsZmggPSAoaCttYXJnaW4udG9wK21hcmdpbi5ib3R0b20pXG4gICAgdG90YWxoID0gaGFsZmgqMlxuICAgIGhhbGZ3ID0gKHcrbWFyZ2luLmxlZnQrbWFyZ2luLnJpZ2h0KVxuICAgIHRvdGFsdyA9IGhhbGZ3KjJcblxuICAgICNtYWtlIHN1cmUgaXRzIEBzY2F0dGVycGxvdCB0byBwYXNzIGluIHRoZSByaWdodCBjb250ZXh0ICh0YWIpIGZvciBkM1xuICAgIG15Y2hhcnQgPSBAc2NhdHRlcnBsb3QoKS54dmFyKDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAueXZhcigxKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLnhsYWIoXCJGaXNoaW5nIFZhbHVlXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAueWxhYihcIkVjb2xvZ2ljYWwgVmFsdWVcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC5oZWlnaHQoaClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC53aWR0aCh3KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcmdpbihtYXJnaW4pXG5cbiAgICBcbiAgICBjaCA9IGQzLnNlbGVjdChAJCgnLnRyYWRlb2ZmLWNoYXJ0JykpXG4gICAgY2guZGF0dW0odHJhZGVvZmZfZGF0YSlcbiAgICAgIC5jYWxsKG15Y2hhcnQpXG5cbiAgICB0b29sdGlwID0gZDMuc2VsZWN0KFwiYm9keVwiKVxuICAgICAgLmFwcGVuZChcImRpdlwiKVxuICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImNoYXJ0LXRvb2x0aXBcIilcbiAgICAgIC5hdHRyKFwiaWRcIiwgXCJjaGFydC10b29sdGlwXCIpXG4gICAgICAudGV4dChcImRhdGFcIilcblxuICAgIG15Y2hhcnQucG9pbnRzU2VsZWN0KClcbiAgICAgIC5vbiBcIm1vdXNlb3ZlclwiLCAoZCkgLT4gcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwidmlzaWJsZVwiKS5odG1sKFwiPHVsPjxzdHJvbmc+UHJvcG9zYWw6IFwiK2QuUFJPUE9TQUwrXCI8L3N0cm9uZz48bGk+IEZpc2hpbmcgdmFsdWU6IFwiK2QuRklTSF9WQUwrXCI8L2xpPjxsaT4gQ29uc2VydmF0aW9uIHZhbHVlOiBcIitkLkVDT19WQUwrXCI8L2xpPjwvdWw+XCIpXG5cbiAgICBteWNoYXJ0LnBvaW50c1NlbGVjdCgpXG4gICAgICAub24gXCJtb3VzZW1vdmVcIiwgKGQpIC0+IHJldHVybiB0b29sdGlwLnN0eWxlKFwidG9wXCIsIChldmVudC5wYWdlWS0xMCkrXCJweFwiKS5zdHlsZShcImxlZnRcIiwoY2FsY190dGlwKGV2ZW50LnBhZ2VYLCBkLCB0b29sdGlwKSkrXCJweFwiKVxuXG4gICAgbXljaGFydC5wb2ludHNTZWxlY3QoKVxuICAgICAgLm9uIFwibW91c2VvdXRcIiwgKGQpIC0+IHJldHVybiB0b29sdGlwLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKVxuICAgICAgICAgICAgXG4gICAgbXljaGFydC5sYWJlbHNTZWxlY3QoKVxuICAgICAgLm9uIFwibW91c2VvdmVyXCIsIChkKSAtPiByZXR1cm4gdG9vbHRpcC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpLmh0bWwoXCI8dWw+PHN0cm9uZz5Qcm9wb3NhbDogXCIrZC5QUk9QT1NBTCtcIjwvc3Ryb25nPjxsaT4gRmlzaGluZyB2YWx1ZTogXCIrZC5GSVNIX1ZBTCtcIjwvbGk+PGxpPiBDb25zZXJ2YXRpb24gdmFsdWU6IFwiK2QuRUNPX1ZBTCtcIjwvbGk+PC91bD5cIilcblxuICAgIG15Y2hhcnQubGFiZWxzU2VsZWN0KClcbiAgICAgIC5vbiBcIm1vdXNlbW92ZVwiLCAoZCkgLT4gcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ0b3BcIiwgKGV2ZW50LnBhZ2VZLTEwKStcInB4XCIpLnN0eWxlKFwibGVmdFwiLChjYWxjX3R0aXAoZXZlbnQucGFnZVgsIGQsIHRvb2x0aXApKStcInB4XCIpXG5cbiAgICBteWNoYXJ0LmxhYmVsc1NlbGVjdCgpXG4gICAgICAub24gXCJtb3VzZW91dFwiLCAoZCkgLT4gcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpXG5cbiAgY2FsY190dGlwID0gKHhsb2MsIGRhdGEsIHRvb2x0aXApIC0+XG4gICAgdGRpdiA9IHRvb2x0aXBbMF1bMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICB0bGVmdCA9IHRkaXYubGVmdFxuICAgIHR3ID0gdGRpdi53aWR0aFxuICAgIHJldHVybiB4bG9jLSh0dysxMCkgaWYgKHhsb2MrdHcgPiB0bGVmdCt0dylcbiAgICByZXR1cm4geGxvYysxMFxuXG5cbiAgc2NhdHRlcnBsb3Q6ICgpID0+XG4gICAgdmlldyA9IEBcbiAgICB3aWR0aCA9IDM4MFxuICAgIGhlaWdodCA9IDYwMFxuICAgIG1hcmdpbiA9IHtsZWZ0OjQwLCB0b3A6NSwgcmlnaHQ6NDAsIGJvdHRvbTogNDAsIGlubmVyOjV9XG4gICAgYXhpc3BvcyA9IHt4dGl0bGU6MjUsIHl0aXRsZTozMCwgeGxhYmVsOjUsIHlsYWJlbDo1fVxuICAgIHhsaW0gPSBudWxsXG4gICAgeWxpbSA9IG51bGxcbiAgICBueHRpY2tzID0gNVxuICAgIHh0aWNrcyA9IG51bGxcbiAgICBueXRpY2tzID0gNVxuICAgIHl0aWNrcyA9IG51bGxcbiAgICAjcmVjdGNvbG9yID0gZDMucmdiKDIzMCwgMjMwLCAyMzApXG4gICAgcmVjdGNvbG9yID0gXCIjZGJlNGVlXCJcbiAgICBwb2ludHNpemUgPSA1ICMgZGVmYXVsdCA9IG5vIHZpc2libGUgcG9pbnRzIGF0IG1hcmtlcnNcbiAgICB4bGFiID0gXCJYXCJcbiAgICB5bGFiID0gXCJZIHNjb3JlXCJcbiAgICB5c2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgIHhzY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgbGVnZW5kaGVpZ2h0ID0gMzAwXG4gICAgcG9pbnRzU2VsZWN0ID0gbnVsbFxuICAgIGxhYmVsc1NlbGVjdCA9IG51bGxcbiAgICBsZWdlbmRTZWxlY3QgPSBudWxsXG4gICAgaWYgd2luZG93LmQzXG4gICAgICAjY2xlYXIgb3V0IHRoZSBvbGQgdmFsdWVzXG4gICAgICB2aWV3LiQoJy50cmFkZW9mZi1jaGFydCcpLmh0bWwoJycpXG4gICAgICBlbCA9IHZpZXcuJCgnLnRyYWRlb2ZmLWNoYXJ0JylbMF1cblxuICAgICMjIHRoZSBtYWluIGZ1bmN0aW9uXG4gICAgY2hhcnQgPSAoc2VsZWN0aW9uKSAtPlxuICAgICAgc2VsZWN0aW9uLmVhY2ggKGRhdGEpIC0+XG4gICAgICAgIHggPSBkYXRhLm1hcCAoZCkgLT4gcGFyc2VGbG9hdChkLkZJU0hfVkFMKVxuICAgICAgICB5ID0gZGF0YS5tYXAgKGQpIC0+IHBhcnNlRmxvYXQoZC5FQ09fVkFMKVxuXG5cbiAgICAgICAgcGFuZWxvZmZzZXQgPSAwXG4gICAgICAgIHBhbmVsd2lkdGggPSB3aWR0aFxuXG4gICAgICAgIHBhbmVsaGVpZ2h0ID0gaGVpZ2h0XG5cbiAgICAgICAgeGxpbSA9IFtkMy5taW4oeCktMiwgcGFyc2VGbG9hdChkMy5tYXgoeCkrMildIGlmICEoeGxpbT8pXG5cbiAgICAgICAgeWxpbSA9IFtkMy5taW4oeSktMiwgcGFyc2VGbG9hdChkMy5tYXgoeSkrMildIGlmICEoeWxpbT8pXG5cbiAgICAgICAgIyBJJ2xsIHJlcGxhY2UgbWlzc2luZyB2YWx1ZXMgc29tZXRoaW5nIHNtYWxsZXIgdGhhbiB3aGF0J3Mgb2JzZXJ2ZWRcbiAgICAgICAgbmFfdmFsdWUgPSBkMy5taW4oeC5jb25jYXQgeSkgLSAxMDBcbiAgICAgICAgY3VycmVsZW0gPSBkMy5zZWxlY3Qodmlldy4kKCcudHJhZGVvZmYtY2hhcnQnKVswXSlcbiAgICAgICAgc3ZnID0gZDMuc2VsZWN0KHZpZXcuJCgnLnRyYWRlb2ZmLWNoYXJ0JylbMF0pLmFwcGVuZChcInN2Z1wiKS5kYXRhKFtkYXRhXSlcbiAgICAgICAgc3ZnLmFwcGVuZChcImdcIilcblxuICAgICAgICAjIFVwZGF0ZSB0aGUgb3V0ZXIgZGltZW5zaW9ucy5cbiAgICAgICAgc3ZnLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCttYXJnaW4ubGVmdCttYXJnaW4ucmlnaHQpXG4gICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCttYXJnaW4udG9wK21hcmdpbi5ib3R0b20rZGF0YS5sZW5ndGgqMzUpXG5cbiAgICAgICAgZyA9IHN2Zy5zZWxlY3QoXCJnXCIpXG5cbiAgICAgICAgIyBib3hcbiAgICAgICAgZy5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAgICAuYXR0cihcInhcIiwgcGFuZWxvZmZzZXQrbWFyZ2luLmxlZnQpXG4gICAgICAgICAuYXR0cihcInlcIiwgbWFyZ2luLnRvcClcbiAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIHBhbmVsaGVpZ2h0KVxuICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBwYW5lbHdpZHRoKVxuICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIHJlY3Rjb2xvcilcbiAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwibm9uZVwiKVxuXG5cbiAgICAgICAgIyBzaW1wbGUgc2NhbGVzIChpZ25vcmUgTkEgYnVzaW5lc3MpXG4gICAgICAgIHhyYW5nZSA9IFttYXJnaW4ubGVmdCtwYW5lbG9mZnNldCttYXJnaW4uaW5uZXIsIG1hcmdpbi5sZWZ0K3BhbmVsb2Zmc2V0K3BhbmVsd2lkdGgtbWFyZ2luLmlubmVyXVxuICAgICAgICB5cmFuZ2UgPSBbbWFyZ2luLnRvcCtwYW5lbGhlaWdodC1tYXJnaW4uaW5uZXIsIG1hcmdpbi50b3ArbWFyZ2luLmlubmVyXVxuICAgICAgICB4c2NhbGUuZG9tYWluKHhsaW0pLnJhbmdlKHhyYW5nZSlcbiAgICAgICAgeXNjYWxlLmRvbWFpbih5bGltKS5yYW5nZSh5cmFuZ2UpXG4gICAgICAgIHhzID0gZDMuc2NhbGUubGluZWFyKCkuZG9tYWluKHhsaW0pLnJhbmdlKHhyYW5nZSlcbiAgICAgICAgeXMgPSBkMy5zY2FsZS5saW5lYXIoKS5kb21haW4oeWxpbSkucmFuZ2UoeXJhbmdlKVxuXG5cbiAgICAgICAgIyBpZiB5dGlja3Mgbm90IHByb3ZpZGVkLCB1c2Ugbnl0aWNrcyB0byBjaG9vc2UgcHJldHR5IG9uZXNcbiAgICAgICAgeXRpY2tzID0geXMudGlja3Mobnl0aWNrcykgaWYgISh5dGlja3M/KVxuICAgICAgICB4dGlja3MgPSB4cy50aWNrcyhueHRpY2tzKSBpZiAhKHh0aWNrcz8pXG5cbiAgICAgICAgIyB4LWF4aXNcbiAgICAgICAgeGF4aXMgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwieCBheGlzXCIpXG4gICAgICAgIHhheGlzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgLmRhdGEoeHRpY2tzKVxuICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgLmFwcGVuZChcImxpbmVcIilcbiAgICAgICAgICAgICAuYXR0cihcIngxXCIsIChkKSAtPiB4c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4MlwiLCAoZCkgLT4geHNjYWxlKGQpKVxuICAgICAgICAgICAgIC5hdHRyKFwieTFcIiwgbWFyZ2luLnRvcClcbiAgICAgICAgICAgICAuYXR0cihcInkyXCIsIG1hcmdpbi50b3AraGVpZ2h0KVxuICAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBcIm5vbmVcIilcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBcIndoaXRlXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgMSlcbiAgICAgICAgICAgICAuc3R5bGUoXCJwb2ludGVyLWV2ZW50c1wiLCBcIm5vbmVcIilcbiAgICAgICAgeGF4aXMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAuZGF0YSh4dGlja3MpXG4gICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4geHNjYWxlKGQpKVxuICAgICAgICAgICAgIC5hdHRyKFwieVwiLCBtYXJnaW4udG9wK2hlaWdodCtheGlzcG9zLnhsYWJlbClcbiAgICAgICAgICAgICAudGV4dCgoZCkgLT4gZm9ybWF0QXhpcyh4dGlja3MpKGQpKVxuICAgICAgICB4YXhpcy5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcInhheGlzLXRpdGxlXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIG1hcmdpbi5sZWZ0K3dpZHRoLzIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIG1hcmdpbi50b3AraGVpZ2h0K2F4aXNwb3MueHRpdGxlKVxuICAgICAgICAgICAgIC50ZXh0KHhsYWIpXG4gICAgICAgIHhheGlzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgLmRhdGEoZGF0YSlcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgICAgICAuYXR0cihcImN4XCIsIChkLGkpIC0+IG1hcmdpbi5sZWZ0KVxuICAgICAgICAgICAgIC5hdHRyKFwiY3lcIiwgKGQsaSkgLT4gbWFyZ2luLnRvcCtoZWlnaHQrYXhpc3Bvcy54dGl0bGUrKChpKzEpKjMwKSs2KVxuICAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgKGQsaSkgLT4gXCJwdCN7aX1cIilcbiAgICAgICAgICAgICAuYXR0cihcInJcIiwgcG9pbnRzaXplKVxuICAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCAoZCxpKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSBpICUgMTdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sID0gZ2V0Q29sb3JzKHZhbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbFxuICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgKGQsIGkpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IE1hdGguZmxvb3IoaS8xNykgJSA1XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbCA9IGdldFN0cm9rZUNvbG9yKHZhbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbFxuICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgXCIxXCIpXG5cbiAgICAgICAgeGF4aXMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAuZGF0YShkYXRhKVxuICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGVnZW5kLXRleHRcIilcblxuICAgICAgICAgICAgIC5hdHRyKFwieFwiLCAoZCxpKSAtPlxuICAgICAgICAgICAgICAgIHJldHVybiBtYXJnaW4ubGVmdCsyMClcbiAgICAgICAgICAgICAuYXR0cihcInlcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICBtYXJnaW4udG9wK2hlaWdodCtheGlzcG9zLnh0aXRsZSsoKGkrMSkqMzApKVxuICAgICAgICAgICAgIC50ZXh0KChkKSAtPiByZXR1cm4gZC5QUk9QT1NBTClcblxuICAgICAgICAjIHktYXhpc1xuICAgICAgICB5YXhpcyA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJ5IGF4aXNcIilcbiAgICAgICAgeWF4aXMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAuZGF0YSh5dGlja3MpXG4gICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwieTFcIiwgKGQpIC0+IHlzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcInkyXCIsIChkKSAtPiB5c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4MVwiLCBtYXJnaW4ubGVmdClcbiAgICAgICAgICAgICAuYXR0cihcIngyXCIsIG1hcmdpbi5sZWZ0K3dpZHRoKVxuICAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBcIm5vbmVcIilcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBcIndoaXRlXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgMSlcbiAgICAgICAgICAgICAuc3R5bGUoXCJwb2ludGVyLWV2ZW50c1wiLCBcIm5vbmVcIilcbiAgICAgICAgeWF4aXMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAuZGF0YSh5dGlja3MpXG4gICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4geXNjYWxlKGQpKVxuICAgICAgICAgICAgIC5hdHRyKFwieFwiLCBtYXJnaW4ubGVmdC1heGlzcG9zLnlsYWJlbClcbiAgICAgICAgICAgICAudGV4dCgoZCkgLT4gZm9ybWF0QXhpcyh5dGlja3MpKGQpKVxuICAgICAgICB5YXhpcy5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpdGxlXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIG1hcmdpbi50b3AraGVpZ2h0LzIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIG1hcmdpbi5sZWZ0LWF4aXNwb3MueXRpdGxlKVxuICAgICAgICAgICAgIC50ZXh0KHlsYWIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoMjcwLCN7bWFyZ2luLmxlZnQtYXhpc3Bvcy55dGl0bGV9LCN7bWFyZ2luLnRvcCtoZWlnaHQvMn0pXCIpXG5cblxuICAgICAgICBsYWJlbHMgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImlkXCIsIFwibGFiZWxzXCIpXG4gICAgICAgIGxhYmVsc1NlbGVjdCA9XG4gICAgICAgICAgbGFiZWxzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgICAgLmRhdGEoZGF0YSlcbiAgICAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgICAgLnRleHQoKGQpLT4gcmV0dXJuIGQuUFJPUE9TQUwpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIChkLGkpIC0+IFxuICAgICAgICAgICAgICAgICAgeHBvcyA9IHhzY2FsZSh4W2ldKVxuICAgICAgICAgICAgICAgICAgc3RyaW5nX2VuZCA9IHhwb3MrdGhpcy5nZXRDb21wdXRlZFRleHRMZW5ndGgoKVxuICAgICAgICAgICAgICAgICAgb3ZlcmxhcF94c3RhcnQgPSB4cG9zLSh0aGlzLmdldENvbXB1dGVkVGV4dExlbmd0aCgpKzUpXG4gICAgICAgICAgICAgICAgICByZXR1cm4gb3ZlcmxhcF94c3RhcnQgaWYgc3RyaW5nX2VuZCA+IHdpZHRoIFxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHhwb3MrNVxuICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwieVwiLCAoZCxpKSAtPiAgICAgICBcbiAgICAgICAgICAgICAgICAgIHlwb3MgPSB5c2NhbGUoeVtpXSlcbiAgICAgICAgICAgICAgICAgIHJldHVybiB5cG9zKzEwIGlmICh5cG9zIDwgNTApXG4gICAgICAgICAgICAgICAgICByZXR1cm4geXBvcy01XG4gICAgICAgICAgICAgICAgICApXG5cblxuXG4gICAgICAgIHBvaW50cyA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiaWRcIiwgXCJwb2ludHNcIilcbiAgICAgICAgcG9pbnRzU2VsZWN0ID1cbiAgICAgICAgICBwb2ludHMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAgICAuZGF0YShkYXRhKVxuICAgICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcImNpcmNsZVwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiY3hcIiwgKGQsaSkgLT4geHNjYWxlKHhbaV0pKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiY3lcIiwgKGQsaSkgLT4geXNjYWxlKHlbaV0pKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgKGQsaSkgLT4gXCJwdCN7aX1cIilcbiAgICAgICAgICAgICAgICAuYXR0cihcInJcIiwgcG9pbnRzaXplKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCAoZCxpKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSBpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbCA9IGdldENvbG9ycyhbdmFsXSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbFxuICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgKGQsIGkpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IE1hdGguZmxvb3IoaS8xNykgJSA1XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbCA9IGdldFN0cm9rZUNvbG9yKHZhbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbFxuICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgXCIxXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJvcGFjaXR5XCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgICAgICByZXR1cm4gMSBpZiAoeFtpXT8gb3IgeE5BLmhhbmRsZSkgYW5kICh5W2ldPyBvciB5TkEuaGFuZGxlKVxuICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDApXG5cbiAgICAgICAgIyBib3hcbiAgICAgICAgZy5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAgICAgICAgICAuYXR0cihcInhcIiwgbWFyZ2luLmxlZnQrcGFuZWxvZmZzZXQpXG4gICAgICAgICAgICAgICAuYXR0cihcInlcIiwgbWFyZ2luLnRvcClcbiAgICAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIHBhbmVsaGVpZ2h0KVxuICAgICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBwYW5lbHdpZHRoKVxuICAgICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKVxuICAgICAgICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgXCJibGFja1wiKVxuICAgICAgICAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgXCJub25lXCIpXG5cblxuXG4gICAgIyMgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzXG5cblxuICAgIGNoYXJ0LndpZHRoID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHdpZHRoIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB3aWR0aCA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQuaGVpZ2h0ID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIGhlaWdodCBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgaGVpZ2h0ID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5tYXJnaW4gPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gbWFyZ2luIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICBtYXJnaW4gPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LmF4aXNwb3MgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gYXhpc3BvcyBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgYXhpc3BvcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueGxpbSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB4bGltIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB4bGltID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5ueHRpY2tzID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIG54dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIG54dGlja3MgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lnh0aWNrcyA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB4dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHh0aWNrcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueWxpbSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB5bGltIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB5bGltID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5ueXRpY2tzID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIG55dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIG55dGlja3MgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lnl0aWNrcyA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB5dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHl0aWNrcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQucmVjdGNvbG9yID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHJlY3Rjb2xvciBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgcmVjdGNvbG9yID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5wb2ludGNvbG9yID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHBvaW50Y29sb3IgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHBvaW50Y29sb3IgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnBvaW50c2l6ZSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiBwb2ludHNpemUgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHBvaW50c2l6ZSA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQucG9pbnRzdHJva2UgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gcG9pbnRzdHJva2UgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHBvaW50c3Ryb2tlID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC54bGFiID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHhsYWIgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHhsYWIgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnlsYWIgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4geWxhYiBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeWxhYiA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueHZhciA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB4dmFyIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB4dmFyID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC55dmFyID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHl2YXIgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHl2YXIgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnlzY2FsZSA9ICgpIC0+XG4gICAgICByZXR1cm4geXNjYWxlXG5cbiAgICBjaGFydC54c2NhbGUgPSAoKSAtPlxuICAgICAgcmV0dXJuIHhzY2FsZVxuXG4gICAgY2hhcnQucG9pbnRzU2VsZWN0ID0gKCkgLT5cbiAgICAgIHJldHVybiBwb2ludHNTZWxlY3RcblxuICAgIGNoYXJ0LmxhYmVsc1NlbGVjdCA9ICgpIC0+XG4gICAgICByZXR1cm4gbGFiZWxzU2VsZWN0XG5cbiAgICBjaGFydC5sZWdlbmRTZWxlY3QgPSAoKSAtPlxuICAgICAgcmV0dXJuIGxlZ2VuZFNlbGVjdFxuXG4gICAgIyByZXR1cm4gdGhlIGNoYXJ0IGZ1bmN0aW9uXG4gICAgY2hhcnRcblxuICBnZXRDb2xvcnMgPSAoaSkgLT5cbiAgICBjb2xvcnMgPSBbXCJMaWdodEdyZWVuXCIsIFwiTGlnaHRQaW5rXCIsIFwiTGlnaHRTa3lCbHVlXCIsIFwiTW9jY2FzaW5cIiwgXCJCbHVlVmlvbGV0XCIsIFwiR2FpbnNib3JvXCIsIFwiRGFya0dyZWVuXCIsIFwiRGFya1R1cnF1b2lzZVwiLCBcIm1hcm9vblwiLCBcIm5hdnlcIiwgXCJMZW1vbkNoaWZmb25cIiwgXCJvcmFuZ2VcIiwgIFwicmVkXCIsIFwic2lsdmVyXCIsIFwidGVhbFwiLCBcIndoaXRlXCIsIFwiYmxhY2tcIl1cbiAgICByZXR1cm4gY29sb3JzW2ldXG5cbiAgZ2V0U3Ryb2tlQ29sb3IgPSAoaSkgLT5cbiAgICBzY29sb3JzID0gW1wiYmxhY2tcIiwgXCJ3aGl0ZVwiLCBcImdyYXlcIiwgXCJicm93blwiLCBcIk5hdnlcIl1cbiAgICByZXR1cm4gc2NvbG9yc1tpXVxuXG4gICMgZnVuY3Rpb24gdG8gZGV0ZXJtaW5lIHJvdW5kaW5nIG9mIGF4aXMgbGFiZWxzXG4gIGZvcm1hdEF4aXMgPSAoZCkgLT5cbiAgICBkID0gZFsxXSAtIGRbMF1cbiAgICBuZGlnID0gTWF0aC5mbG9vciggTWF0aC5sb2coZCAlIDEwKSAvIE1hdGgubG9nKDEwKSApXG4gICAgbmRpZyA9IDAgaWYgbmRpZyA+IDBcbiAgICBuZGlnID0gTWF0aC5hYnMobmRpZylcbiAgICBkMy5mb3JtYXQoXCIuI3tuZGlnfWZcIilcblxubW9kdWxlLmV4cG9ydHMgPSBBcnJheVRyYWRlb2Zmc1RhYiIsIm1vZHVsZS5leHBvcnRzID0gXG4gIFNBTkNUVUFSWV9JRDogJzUxZmFlYmVmOGZhYTMwOWI3YzA1ZGUwMidcbiAgQVFVQUNVTFRVUkVfSUQ6ICc1MjBiYjFjMDBiZDIyYzliMjE0N2I5OWInXG4gIE1PT1JJTkdfSUQ6ICc1MjBkM2RjNDY3NDY1OWNiN2IzNDgwZjUnXG4gIEZJU0hJTkdfUFJJT1JJVFlfQVJFQV9JRDogJzUyMGJiMWQwMGJkMjJjOWIyMTQ3YjlkMCdcbiAgTk9fTkVUX1pPTkVTX0lEOiAnNTI0YzViYzIyZmJkNzI2MTE3MDAwMDM0J1xuIiwidGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbkFycmF5T3ZlcnZpZXdUYWIgPSByZXF1aXJlICcuL2FycmF5T3ZlcnZpZXdUYWIuY29mZmVlJ1xuQXJyYXlIYWJpdGF0VGFiID0gcmVxdWlyZSAnLi9hcnJheUhhYml0YXRUYWIuY29mZmVlJ1xuQXJyYXlGaXNoaW5nVmFsdWVUYWIgPSByZXF1aXJlICcuL2FycmF5RmlzaGluZ1ZhbHVlVGFiLmNvZmZlZSdcbkFycmF5VHJhZGVvZmZzVGFiID0gcmVxdWlyZSAnLi9hcnJheVRyYWRlb2Zmcy5jb2ZmZWUnXG4jT3ZlcnZpZXdUYWIgPSByZXF1aXJlICcuL292ZXJ2aWV3VGFiLmNvZmZlZSdcbndpbmRvdy5hcHAucmVnaXN0ZXJSZXBvcnQgKHJlcG9ydCkgLT5cbiAgcmVwb3J0LnRhYnMgW0FycmF5T3ZlcnZpZXdUYWIsIEFycmF5SGFiaXRhdFRhYiwgQXJyYXlGaXNoaW5nVmFsdWVUYWIsIEFycmF5VHJhZGVvZmZzVGFiXVxuICAjcmVwb3J0LnRhYnMgW092ZXJ2aWV3VGFiXVxuICAjIHBhdGggbXVzdCBiZSByZWxhdGl2ZSB0byBkaXN0L1xuICByZXBvcnQuc3R5bGVzaGVldHMgWycuL3Byb3Bvc2FsLmNzcyddIiwidGhpc1tcIlRlbXBsYXRlc1wiXSA9IHRoaXNbXCJUZW1wbGF0ZXNcIl0gfHwge307XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJhcXVhY3VsdHVyZUZpc2hpbmdWYWx1ZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5GaXNoaW5nIFZhbHVlPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgYXF1YWN1bHR1cmUgYXJlYSBkaXNwbGFjZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJwZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgb2YgdGhlIGZpc2hpbmcgdmFsdWUgd2l0aGluIEJhcmJ1ZGHigJlzIHdhdGVycywgYmFzZWQgb24gdXNlciByZXBvcnRlZFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICB2YWx1ZXMgb2YgZmlzaGluZyBncm91bmRzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTI0MWVhN2RlMGZiYTExZjNkMDEwMDExXFxcIj5zaG93IGZpc2hpbmcgdmFsdWVzIGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJhcnJheUZpc2hpbmdWYWx1ZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5EaXNwbGFjZWQgRmlzaGluZyBWYWx1ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJzYW5jdHVhcmllc1wiLGMscCwxKSxjLHAsMCwxMDMsMzg5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtpZihfLnMoXy5mKFwiYXF1YWN1bHR1cmVBcmVhc1wiLGMscCwxKSxjLHAsMCwxMjksMzYzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgVGhpcyBwcm9wb3NhbCBpbmNsdWRlcyBib3RoIFNhbmN0dWFyeSBhbmQgQXF1YWN1bHR1cmUgYXJlYXMsIGRpc3BsYWNpbmdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzYW5jdHVhcnlQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBhbmQgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJhcXVhY3VsdHVyZUFyZWFQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgb2YgZmlzaGluZyB2YWx1ZSB3aXRoaW4gQmFyYnVkYSdzIHdhdGVycywgcmVzcGVjdGl2ZWx5LlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcInNhbmN0dWFyaWVzXCIsYyxwLDEpLGMscCwwLDQyNiw3NjUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe2lmKCFfLnMoXy5mKFwiYXF1YWN1bHR1cmVBcmVhc1wiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICBUaGlzIHByb3Bvc2FsIGluY2x1ZGVzIFwiKTtfLmIoXy52KF8uZihcIm51bVNhbmN0dWFyaWVzXCIsYyxwLDApKSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXCIpO2lmKF8ucyhfLmYoXCJzYW5jUGx1cmFsXCIsYyxwLDEpLGMscCwwLDUxOCw1MjksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIlNhbmN0dWFyaWVzXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwic2FuY1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIlNhbmN0dWFyeVwiKTt9O18uYihcIixcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgZGlzcGxhY2luZyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNhbmN0dWFyeVBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIGZpc2hpbmcgdmFsdWUgd2l0aGluIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBCYXJidWRhJ3Mgd2F0ZXJzIGJhc2VkIG9uIHVzZXIgcmVwb3J0ZWQgdmFsdWVzIG9mIGZpc2hpbmcgZ3JvdW5kcy5cIik7Xy5iKFwiXFxuXCIpO307fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJzYW5jdHVhcmllc1wiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe2lmKF8ucyhfLmYoXCJhcXVhY3VsdHVyZUFyZWFzXCIsYyxwLDEpLGMscCwwLDgyOCwxMTM1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPGJyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8YnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgcHJvcG9zYWwgaW5jbHVkZXMgXCIpO18uYihfLnYoXy5mKFwibnVtQXF1YWN1bHR1cmVBcmVhc1wiLGMscCwwKSkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEFxdWFjdWx0dXJlIEFyZWFcIik7aWYoXy5zKF8uZihcImFxdWFjdWx0dXJlQXJlYXNQbHVyYWxcIixjLHAsMSksYyxwLDAsOTQ1LDk0NixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCIsXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGRpc3BsYWNpbmcgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJhcXVhY3VsdHVyZUFyZWFQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBmaXNoaW5nIHZhbHVlIHdpdGhpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQmFyYnVkYSdzIHdhdGVycyBiYXNlZCBvbiB1c2VyIHJlcG9ydGVkIHZhbHVlcyBvZiBmaXNoaW5nIGdyb3VuZHMuXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO319O2lmKF8ucyhfLmYoXCJtb29yaW5nc1wiLGMscCwxKSxjLHAsMCwxMTk1LDE1MjUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8YnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxicj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXCIpO18uYihfLnYoXy5mKFwibnVtTW9vcmluZ3NcIixjLHAsMCkpKTtfLmIoXCIgTW9vcmluZyBBcmVhXCIpO2lmKF8ucyhfLmYoXCJtb29yaW5nc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwxMjY1LDEyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInMgYXJlXCIpO30pO2MucG9wKCk7fV8uYihcIiBcIik7aWYoIV8ucyhfLmYoXCJtb29yaW5nc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcImlzXCIpO307Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgYWxzbyBpbmNsdWRlZCwgd2hpY2ggY292ZXJcIik7aWYoIV8ucyhfLmYoXCJtb29yaW5nc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNcIik7fTtfLmIoXCIgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJtb29yaW5nQXJlYVBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICByZWdpb25hbCBmaXNoaW5nIHZhbHVlLiBNb29yaW5nIGFyZWFzIG1heSBkaXNwbGFjZSBmaXNoaW5nIGFjdGl2aXRpZXMuXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzTm9OZXRab25lc1wiLGMscCwxKSxjLHAsMCwxNTYxLDE5MDMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8YnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxicj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXCIpO18uYihfLnYoXy5mKFwibnVtTm9OZXRab25lc1wiLGMscCwwKSkpO18uYihcIiBOb3QgTmV0IFpvbmVcIik7aWYoXy5zKF8uZihcIm5vTmV0Wm9uZXNQbHVyYWxcIixjLHAsMSksYyxwLDAsMTYzNSwxNjQwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzIGFyZVwiKTt9KTtjLnBvcCgpO31fLmIoXCIgXCIpO2lmKCFfLnMoXy5mKFwibm9OZXRab25lc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcImlzXCIpO307Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgYWxzbyBpbmNsdWRlZCwgd2hpY2ggY292ZXJcIik7aWYoIV8ucyhfLmYoXCJub05ldFpvbmVzUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic1wiKTt9O18uYihcIiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm5vTmV0Wm9uZXNQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgcmVnaW9uYWwgZmlzaGluZyB2YWx1ZS4gTm8gTmV0IFpvbmVzIG1heSBkaXNwbGFjZSBmaXNoaW5nIGFjdGl2aXRpZXMuXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUyNDFlYTdkZTBmYmExMWYzZDAxMDAxMVxcXCI+c2hvdyBmaXNoaW5nIHZhbHVlcyBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJmaXNoaW5nQXJlYXNcIixjLHAsMSksYyxwLDAsMjA0MiwyNDE0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5Qcmlvcml0eSBGaXNoaW5nIEFyZWFzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgcHJvcG9zYWwgaW5jbHVkZXMgXCIpO18uYihfLnYoXy5mKFwibnVtRmlzaGluZ0FyZWFzXCIsYyxwLDApKSk7Xy5iKFwiIEZpc2hpbmcgUHJpb3JpdHkgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEFyZWFcIik7aWYoXy5zKF8uZihcImZpc2hpbmdBcmVhUHVyYWxcIixjLHAsMSksYyxwLDAsMjIxOSwyMjIwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIiwgcmVwcmVzZW50aW5nXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiZmlzaGluZ0FyZWFQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiB0aGUgZmlzaGluZyB2YWx1ZSB3aXRoaW4gQmFyYnVkYSdzIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICB3YXRlcnMgYmFzZWQgb24gdXNlciByZXBvcnRlZCB2YWx1ZXMgb2YgZmlzaGluZyBncm91bmRzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31yZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFycmF5SGFiaXRhdHNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZihcInNhbmN0dWFyaWVzXCIsYyxwLDEpLGMscCwwLDE2LDkxOSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+SGFiaXRhdHMgd2l0aGluIFwiKTtfLmIoXy52KF8uZihcIm51bVNhbmN0dWFyaWVzXCIsYyxwLDApKSk7Xy5iKFwiIFwiKTtpZighXy5zKF8uZihcInNhbmN0dWFyeVBsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIlNhbmN0dWFyeVwiKTt9O2lmKF8ucyhfLmYoXCJzYW5jdHVhcnlQbHVyYWxcIixjLHAsMSksYyxwLDAsMTcwLDE4MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiU2FuY3R1YXJpZXNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5QZXJjZW50IG9mIFRvdGFsIEhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk1lZXRzIDMzJSBnb2FsPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInNhbmN0dWFyeUhhYml0YXRcIixjLHAsMSksYyxwLDAsNDAzLDYxNixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyIGNsYXNzPVxcXCJcIik7aWYoXy5zKF8uZihcIm1lZXRzR29hbFwiLGMscCwxKSxjLHAsMCw0MzUsNDQyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJtZXRHb2FsXCIpO30pO2MucG9wKCk7fV8uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSGFiVHlwZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiAlPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7aWYoXy5zKF8uZihcIm1lZXRzR29hbFwiLGMscCwxKSxjLHAsMCw1NDUsNTQ4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ5ZXNcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJtZWV0c0dvYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJub1wiKTt9O18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBQZXJjZW50YWdlcyBzaG93biByZXByZXNlbnQgdGhlIHByb3BvcnRpb24gb2YgaGFiaXRhdHMgYXZhaWxhYmxlIGluIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBCYXJidWRhJ3MgZW50aXJlIDMgbmF1dGljYWwgbWlsZSBib3VuZGFyeSBjYXB0dXJlZCB3aXRoaW4gc2FuY3R1YXJpZXMuIDxicj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmNTU0NWMwOGRjNGY1ZjJkMjE2MTQ2XFxcIj5zaG93IGhhYml0YXRzIGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXF1YWN1bHR1cmVBcmVhc1wiLGMscCwxKSxjLHAsMCw5NTgsMTU4OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+SGFiaXRhdHMgd2l0aGluIFwiKTtfLmIoXy52KF8uZihcIm51bUFxdWFjdWx0dXJlXCIsYyxwLDApKSk7Xy5iKFwiIEFxdWFjdWx0dXJlIEFyZWFcIik7aWYoXy5zKF8uZihcImFxdWFQbHVyYWxcIixjLHAsMSksYyxwLDAsMTA3NCwxMDc1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UGVyY2VudCBvZiBUb3RhbCBIYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImFxdWFjdWx0dXJlSGFiaXRhdFwiLGMscCwxKSxjLHAsMCwxMjYyLDEzNTIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIYWJUeXBlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiICU8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPCEtLSAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBQZXJjZW50YWdlcyBzaG93biByZXByZXNlbnQgdGhlIHByb3BvcnRpb24gb2YgaGFiaXRhdHMgYXZhaWxhYmxlIGluIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBCYXJidWRhJ3MgZW50aXJlIDMgbmF1dGljYWwgbWlsZSBib3VuZGFyeSBjYXB0dXJlZCB3aXRoaW4gYXF1YWN1bHR1cmUgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGFyZWFzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm1vb3JpbmdzXCIsYyxwLDEpLGMscCwwLDE2MjQsMjIzNSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+SGFiaXRhdHMgd2l0aGluIFwiKTtfLmIoXy52KF8uZihcIm51bU1vb3JpbmdzXCIsYyxwLDApKSk7Xy5iKFwiIE1vb3JpbmcgQXJlYVwiKTtpZihfLnMoXy5mKFwibW9vcmluZ1BsdXJhbFwiLGMscCwxKSxjLHAsMCwxNzM2LDE3MzcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5QZXJjZW50IG9mIFRvdGFsIEhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibW9vcmluZ0RhdGFcIixjLHAsMSksYyxwLDAsMTkyMCwyMDEwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSGFiVHlwZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiAlPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwhLS0gICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgUGVyY2VudGFnZXMgc2hvd24gcmVwcmVzZW50IHRoZSBwcm9wb3J0aW9uIG9mIGhhYml0YXRzIGF2YWlsYWJsZSBpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQmFyYnVkYSdzIGVudGlyZSAzIG5hdXRpY2FsIG1pbGUgYm91bmRhcnkgY2FwdHVyZWQgd2l0aGluIG1vb3JpbmcgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGFyZWFzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImZpc2hpbmdBcmVhc1wiLGMscCwxKSxjLHAsMCwyMjY3LDI5MTYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXRzIHdpdGhpbiBcIik7Xy5iKF8udihfLmYoXCJudW1GaXNoaW5nQXJlYXNcIixjLHAsMCkpKTtfLmIoXCIgRmlzaGluZyBQcmlvcml0eSBBcmVhXCIpO2lmKF8ucyhfLmYoXCJmaXNoaW5nQXJlYVBsdXJhbFwiLGMscCwxKSxjLHAsMCwyMzk2LDIzOTcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5QZXJjZW50IG9mIFRvdGFsIEhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiZmlzaGluZ0FyZWFEYXRhXCIsYyxwLDEpLGMscCwwLDI1ODgsMjY3OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhhYlR5cGVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIgJTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFBlcmNlbnRhZ2VzIHNob3duIHJlcHJlc2VudCB0aGUgcHJvcG9ydGlvbiBvZiBoYWJpdGF0cyBhdmFpbGFibGUgaW4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEJhcmJ1ZGEncyBlbnRpcmUgMyBuYXV0aWNhbCBtaWxlIGJvdW5kYXJ5IGNhcHR1cmVkIHdpdGhpbiBmaXNoaW5nIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBwcmlvcml0eSBhcmVhcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNOb05ldFpvbmVzXCIsYyxwLDEpLGMscCwwLDI5NTMsMzU3MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+SGFiaXRhdHMgd2l0aGluIFwiKTtfLmIoXy52KF8uZihcIm51bU5vTmV0Wm9uZXNcIixjLHAsMCkpKTtfLmIoXCIgTm8gTmV0IFpvbmVcIik7aWYoXy5zKF8uZihcIm5vTmV0Wm9uZXNQbHVyYWxcIixjLHAsMSksYyxwLDAsMzA2OSwzMDcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UGVyY2VudCBvZiBUb3RhbCBIYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm5vTmV0Wm9uZXNEYXRhXCIsYyxwLDEpLGMscCwwLDMyNTksMzM0OSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhhYlR5cGVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIgJTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFBlcmNlbnRhZ2VzIHNob3duIHJlcHJlc2VudCB0aGUgcHJvcG9ydGlvbiBvZiBoYWJpdGF0cyBhdmFpbGFibGUgaW4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEJhcmJ1ZGEncyBlbnRpcmUgMyBuYXV0aWNhbCBtaWxlIGJvdW5kYXJ5IGNhcHR1cmVkIHdpdGhpbiBubyBuZXQgem9uZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJhcnJheU92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBzaXplXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TaXplPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzU2tldGNoZXNcIixjLHAsMSksYyxwLDAsMzYzLDg3NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgY29sbGVjdGlvbiBpcyBjb21wb3NlZCBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bVNrZXRjaGVzXCIsYyxwLDApKSk7Xy5iKFwiIHpvbmVcIik7aWYoXy5zKF8uZihcInNrZXRjaGVzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDQ2OCw0NjksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9zdHJvbmc+IGluIGJvdGggb2NlYW4gYW5kIGxhZ29vbiB3YXRlcnMuIFRoZSBjb2xsZWN0aW9uIGluY2x1ZGVzIGEgdG90YWwgPGVtPm9jZWFuaWM8L2VtPiBhcmVhIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic3VtT2NlYW5BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInN1bU9jZWFuUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgQmFyYnVkYSdzIHdhdGVycy4gSXQgYWxzbyBpbmNvcnBvcmF0ZXMgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic3VtTGFnb29uQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIG9yIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic3VtTGFnb29uUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4sIG9mIHRoZSB0b3RhbCA8ZW0+bGFnb29uIGFyZWE8L2VtPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNTYW5jdHVhcmllc1wiLGMscCwxKSxjLHAsMCw5MTQsMTY1MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBjb2xsZWN0aW9uIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibnVtU2FuY3R1YXJpZXNcIixjLHAsMCkpKTtfLmIoXCIgXCIpO2lmKCFfLnMoXy5mKFwic2FuY3R1YXJpZXNQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzYW5jdHVhcnlcIik7fTtpZihfLnMoXy5mKFwic2FuY3R1YXJpZXNQbHVyYWxcIixjLHAsMSksYyxwLDAsMTA2NywxMDc4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzYW5jdHVhcmllc1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L3N0cm9uZz4gaW4gYm90aCBvY2VhbiBhbmQgbGFnb29uIHdhdGVycy4gVGhlIFwiKTtpZighXy5zKF8uZihcInNhbmN0dWFyaWVzUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic2FuY3R1YXJ5XCIpO307aWYoXy5zKF8uZihcInNhbmN0dWFyaWVzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDEyMjIsMTIzMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic2FuY3R1YXJpZXNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiIGNvbnRhaW5cIik7aWYoIV8ucyhfLmYoXCJzYW5jdHVhcmllc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNcIik7fTtfLmIoXCIgYSB0b3RhbCA8ZW0+b2NlYW5pYzwvZW0+IGFyZWEgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzYW5jdHVhcnlPY2VhbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNhbmN0dWFyeU9jZWFuUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgQmFyYnVkYSdzIHdhdGVycy4gSXQgYWxzbyBpbmNsdWRlcyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzYW5jdHVhcnlMYWdvb25BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgb3IgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzYW5jdHVhcnlMYWdvb25QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiwgb2YgdGhlIHRvdGFsIDxlbT5sYWdvb24gYXJlYTwvZW0+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc05vTmV0Wm9uZXNcIixjLHAsMSksYyxwLDAsMTY5MywyMzI5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIGNvbGxlY3Rpb24gaW5jbHVkZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJudW1Ob05ldFpvbmVzXCIsYyxwLDApKSk7Xy5iKFwiIE5vIE5ldCBab25lXCIpO2lmKF8ucyhfLmYoXCJub05ldFpvbmVzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDE4MDIsMTgwMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L3N0cm9uZz4gaW4gYm90aCBvY2VhbiBhbmQgbGFnb29uIHdhdGVycy4gVGhlIE5vIE5ldCBab25lXCIpO2lmKF8ucyhfLmYoXCJub05ldFpvbmVzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDE5MDMsMTkwNCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L3N0cm9uZz4gY29udGFpblwiKTtpZighXy5zKF8uZihcIm5vTmV0Wm9uZXNQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzXCIpO307Xy5iKFwiIGEgdG90YWwgPGVtPm9jZWFuaWM8L2VtPiBhcmVhIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibm9OZXRab25lc09jZWFuQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIHdoaWNoIHJlcHJlc2VudHMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJub05ldFpvbmVzT2NlYW5QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBCYXJidWRhJ3Mgd2F0ZXJzLiBJdCBhbHNvIGluY2x1ZGVzIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm5vTmV0Wm9uZXNMYWdvb25BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgb3IgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJub05ldFpvbmVzTGFnb29uUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4sIG9mIHRoZSB0b3RhbCA8ZW0+bGFnb29uIGFyZWE8L2VtPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNNb29yaW5nc1wiLGMscCwxKSxjLHAsMCwyMzY2LDI5NzgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgY29sbGVjdGlvbiBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bU1vb3JpbmdzXCIsYyxwLDApKSk7Xy5iKFwiIE1vb3JpbmcgQXJlYVwiKTtpZihfLnMoXy5mKFwibW9vcmluZ3NQbHVyYWxcIixjLHAsMSksYyxwLDAsMjQ3MiwyNDczLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvc3Ryb25nPiBpbiBib3RoIG9jZWFuIGFuZCBsYWdvb24gd2F0ZXJzLiBUaGUgTW9vcmluZyBBcmVhXCIpO2lmKF8ucyhfLmYoXCJtb29yaW5nc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwyNTcwLDI1NzEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiIGNvbnRhaW5cIik7aWYoIV8ucyhfLmYoXCJtb29yaW5nc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNcIik7fTtfLmIoXCIgYSB0b3RhbCA8ZW0+b2NlYW5pYzwvZW0+IGFyZWEgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJtb29yaW5nc09jZWFuQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICB3aGljaCByZXByZXNlbnRzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibW9vcmluZ3NPY2VhblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIEJhcmJ1ZGEncyB3YXRlcnMuIEl0IGFsc28gaW5jbHVkZXMgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibW9vcmluZ3NMYWdvb25BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgb3IgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJtb29yaW5nc0xhZ29vblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+LCBvZiB0aGUgdG90YWwgPGVtPmxhZ29vbiBhcmVhPC9lbT4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzQXF1YWN1bHR1cmVcIixjLHAsMSksYyxwLDAsMzAxNiwzNjY0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIGNvbGxlY3Rpb24gaW5jbHVkZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJudW1BcXVhY3VsdHVyZVwiLGMscCwwKSkpO18uYihcIiBBcXVhY3VsdHVyZSBBcmVhXCIpO2lmKF8ucyhfLmYoXCJhcXVhY3VsdHVyZVBsdXJhbFwiLGMscCwxKSxjLHAsMCwzMTMyLDMxMzMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9zdHJvbmc+IGluIGJvdGggb2NlYW4gYW5kIGxhZ29vbiB3YXRlcnMuIFRoZSBBcXVhY3VsdHVyZSBBcmVhXCIpO2lmKF8ucyhfLmYoXCJhcXVhY3VsdHVyZVBsdXJhbFwiLGMscCwxKSxjLHAsMCwzMjQwLDMyNDEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiIGNvbnRhaW5cIik7aWYoIV8ucyhfLmYoXCJhcXVhY3VsdHVyZVBsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNcIik7fTtfLmIoXCIgYSB0b3RhbCA8ZW0+b2NlYW5pYzwvZW0+IGFyZWEgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJhcXVhY3VsdHVyZU9jZWFuQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIHdoaWNoIHJlcHJlc2VudHMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJhcXVhY3VsdHVyZU9jZWFuUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgQmFyYnVkYSdzIHdhdGVycy4gSXQgYWxzbyBpbmNsdWRlcyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJhcXVhY3VsdHVyZUxhZ29vbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCBvciA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImFxdWFjdWx0dXJlTGFnb29uUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4sIG9mIHRoZSB0b3RhbCA8ZW0+bGFnb29uIGFyZWE8L2VtPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNGaXNoaW5nQXJlYXNcIixjLHAsMSksYyxwLDAsMzcwNiw0Mzc1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIGNvbGxlY3Rpb24gaW5jbHVkZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJudW1GaXNoaW5nQXJlYXNcIixjLHAsMCkpKTtfLmIoXCIgRmlzaGluZyBQcmlvcml0eSBBcmVhXCIpO2lmKF8ucyhfLmYoXCJmaXNoaW5nQXJlYXNQbHVyYWxcIixjLHAsMSksYyxwLDAsMzgyOSwzODMwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvc3Ryb25nPiBpbiBib3RoIG9jZWFuIGFuZCBsYWdvb24gd2F0ZXJzLiBUaGUgRmlzaGluZyBQcmlvcml0eSBBcmVhXCIpO2lmKF8ucyhfLmYoXCJmaXNoaW5nQXJlYXNQbHVyYWxcIixjLHAsMSksYyxwLDAsMzk0NCwzOTQ1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIiBjb250YWluXCIpO2lmKCFfLnMoXy5mKFwiZmlzaGluZ0FyZWFzUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic1wiKTt9O18uYihcIiBhIHRvdGFsIDxlbT5vY2VhbmljPC9lbT4gYXJlYSBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImZpc2hpbmdBcmVhc09jZWFuQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIHdoaWNoIHJlcHJlc2VudHMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJmaXNoaW5nQXJlYXNPY2VhblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIEJhcmJ1ZGEncyB3YXRlcnMuIEl0IGFsc28gaW5jbHVkZXMgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiZmlzaGluZ0FyZWFzTGFnb29uQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIG9yIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiZmlzaGluZ0FyZWFzTGFnb29uUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4sIG9mIHRoZSB0b3RhbCA8ZW0+bGFnb29uIGFyZWE8L2VtPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwhLS1cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5ab25lcyBpbiB0aGlzIFByb3Bvc2FsPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInRvY0NvbnRhaW5lclxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiLS0+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImFueUF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsNDUzNCw0NjU4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5cIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIEF0dHJpYnV0ZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIixjLHAsXCIgIFwiKSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJhcnJheVRyYWRlb2Zmc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5UcmFkZW9mZnM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0PHAgY2xhc3M9XFxcInNtYWxsIHR0aXAtdGlwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgIFRpcDogaG92ZXIgb3ZlciBhIHByb3Bvc2FsIHRvIHNlZSBkZXRhaWxzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQ8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDxkaXYgIGlkPVxcXCJ0cmFkZW9mZi1jaGFydFxcXCIgY2xhc3M9XFxcInRyYWRlb2ZmLWNoYXJ0XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJkZW1vXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlJlcG9ydCBTZWN0aW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5Vc2UgcmVwb3J0IHNlY3Rpb25zIHRvIGdyb3VwIGluZm9ybWF0aW9uIGludG8gbWVhbmluZ2Z1bCBjYXRlZ29yaWVzPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RDMgVmlzdWFsaXphdGlvbnM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHVsIGNsYXNzPVxcXCJuYXYgbmF2LXBpbGxzXFxcIiBpZD1cXFwidGFiczJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8bGkgY2xhc3M9XFxcImFjdGl2ZVxcXCI+PGEgaHJlZj1cXFwiI2NoYXJ0XFxcIj5DaGFydDwvYT48L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8bGk+PGEgaHJlZj1cXFwiI2RhdGFUYWJsZVxcXCI+VGFibGU8L2E+PC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdWw+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJ0YWItY29udGVudFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcInRhYi1wYW5lIGFjdGl2ZVxcXCIgaWQ9XFxcImNoYXJ0XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8IS0tW2lmIElFIDhdPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwIGNsYXNzPVxcXCJ1bnN1cHBvcnRlZFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgVGhpcyB2aXN1YWxpemF0aW9uIGlzIG5vdCBjb21wYXRpYmxlIHdpdGggSW50ZXJuZXQgRXhwbG9yZXIgOC4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgUGxlYXNlIHVwZ3JhZGUgeW91ciBicm93c2VyLCBvciB2aWV3IHJlc3VsdHMgaW4gdGhlIHRhYmxlIHRhYi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+ICAgICAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPCFbZW5kaWZdLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBTZWUgPGNvZGU+c3JjL3NjcmlwdHMvZGVtby5jb2ZmZWU8L2NvZGU+IGZvciBhbiBleGFtcGxlIG9mIGhvdyB0byBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIHVzZSBkMy5qcyB0byByZW5kZXIgdmlzdWFsaXphdGlvbnMuIFByb3ZpZGUgYSB0YWJsZS1iYXNlZCB2aWV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBhbmQgdXNlIGNvbmRpdGlvbmFsIGNvbW1lbnRzIHRvIHByb3ZpZGUgYSBmYWxsYmFjayBmb3IgSUU4IHVzZXJzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGJyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGEgaHJlZj1cXFwiaHR0cDovL3R3aXR0ZXIuZ2l0aHViLmlvL2Jvb3RzdHJhcC8yLjMuMi9cXFwiPkJvb3RzdHJhcCAyLng8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBpcyBsb2FkZWQgd2l0aGluIFNlYVNrZXRjaCBzbyB5b3UgY2FuIHVzZSBpdCB0byBjcmVhdGUgdGFicyBhbmQgb3RoZXIgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBpbnRlcmZhY2UgY29tcG9uZW50cy4galF1ZXJ5IGFuZCB1bmRlcnNjb3JlIGFyZSBhbHNvIGF2YWlsYWJsZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJ0YWItcGFuZVxcXCIgaWQ9XFxcImRhdGFUYWJsZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPmluZGV4PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+dmFsdWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiY2hhcnREYXRhXCIsYyxwLDEpLGMscCwwLDEzNTEsMTQxOCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj48dGQ+XCIpO18uYihfLnYoXy5mKFwiaW5kZXhcIixjLHAsMCkpKTtfLmIoXCI8L3RkPjx0ZD5cIik7Xy5iKF8udihfLmYoXCJ2YWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+PC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBlbXBoYXNpc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RW1waGFzaXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+R2l2ZSByZXBvcnQgc2VjdGlvbnMgYW4gPGNvZGU+ZW1waGFzaXM8L2NvZGU+IGNsYXNzIHRvIGhpZ2hsaWdodCBpbXBvcnRhbnQgaW5mb3JtYXRpb24uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB3YXJuaW5nXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5XYXJuaW5nPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPk9yIDxjb2RlPndhcm48L2NvZGU+IG9mIHBvdGVudGlhbCBwcm9ibGVtcy48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIGRhbmdlclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RGFuZ2VyPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPjxjb2RlPmRhbmdlcjwvY29kZT4gY2FuIGFsc28gYmUgdXNlZC4uLiBzcGFyaW5nbHkuPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImZpc2hpbmdQcmlvcml0eUFyZWFcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RmlzaGluZyBWYWx1ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIGZpc2hpbmcgcHJpb3JpdHkgYXJlYSBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIHRoZSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgZmlzaGluZyB2YWx1ZSB3aXRoaW4gQmFyYnVkYSdzIHdhdGVycywgYmFzZWQgb24gdXNlciByZXBvcnRlZCB2YWx1ZXMgb2YgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGZpc2hpbmcgZ3JvdW5kc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTI0MWVhN2RlMGZiYTExZjNkMDEwMDExXFxcIj5zaG93IGZpc2hpbmcgdmFsdWVzIGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJmaXNoaW5nVmFsdWVcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RmlzaGluZyBWYWx1ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIFwiKTtfLmIoXy52KF8uZihcImFyZWFMYWJlbFwiLGMscCwwKSkpO18uYihcIiBkaXNwbGFjZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJwZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgb2YgdGhlIGZpc2hpbmcgdmFsdWUgd2l0aGluIEJhcmJ1ZGHigJlzIHdhdGVycywgYmFzZWQgb24gdXNlciByZXBvcnRlZFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICB2YWx1ZXMgb2YgZmlzaGluZyBncm91bmRzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTI0MWVhN2RlMGZiYTExZjNkMDEwMDExXFxcIj5zaG93IGZpc2hpbmcgdmFsdWVzIGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJoYWJpdGF0XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZihcImhlYWRpbmdcIixjLHAsMCkpKTtfLmIoXCI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPiUgb2YgVG90YWwgSGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYWJpdGF0c1wiLGMscCwxKSxjLHAsMCwyMTYsMjc5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+PHRkPlwiKTtfLmIoXy52KF8uZihcIkhhYlR5cGVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPjx0ZD5cIik7Xy5iKF8udihfLmYoXCJQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFBlcmNlbnRhZ2VzIHNob3duIHJlcHJlc2VudCB0aGUgcHJvcG9ydGlvbiBvZiBoYWJpdGF0cyBhdmFpbGFibGUgaW4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEJhcmJ1ZGEncyBlbnRpcmUgMyBuYXV0aWNhbCBtaWxlIGJvdW5kYXJ5IGNhcHR1cmVkIHdpdGhpbiB0aGlzIHpvbmUuIDxicj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmNTU0NWMwOGRjNGY1ZjJkMjE2MTQ2XFxcIj5zaG93IGhhYml0YXRzIGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJvdmVydmlld1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gc2l6ZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+U2l6ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIGFyZWEgaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJTUV9NSUxFU1wiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIHdoaWNoIHJlcHJlc2VudHMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJQRVJDRU5UXCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBCYXJidWRhJ3Mgd2F0ZXJzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInJlbmRlck1pbmltdW1XaWR0aFwiLGMscCwxKSxjLHAsMCw1MzYsMTE3OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBkaWFtZXRlciBcIik7aWYoIV8ucyhfLmYoXCJESUFNX09LXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwid2FybmluZ1wiKTt9O18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+TWluaW11bSBXaWR0aDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgbWluaW11bSB3aWR0aCBvZiBhIHpvbmUgc2lnbmlmaWNhbnRseSBpbXBhY3RzICBpdHMgY29uc2VydmF0aW9uIHZhbHVlLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIHJlY29tbWVuZGVkIHNtYWxsZXN0IGRpYW1ldGVyIGlzIGJldHdlZW4gMiBhbmQgMyBtaWxlcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZighXy5zKF8uZihcIkRJQU1fT0tcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgVGhpcyBkZXNpZ24gZmFsbHMgb3V0c2lkZSB0aGUgcmVjb21tZW5kYXRpb24gYXQgXCIpO18uYihfLnYoXy5mKFwiRElBTVwiLGMscCwwKSkpO18uYihcIiBtaWxlcy5cIik7Xy5iKFwiXFxuXCIpO307aWYoXy5zKF8uZihcIkRJQU1fT0tcIixjLHAsMSksYyxwLDAsOTI2LDk5NyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIFRoaXMgZGVzaWduIGZpdHMgd2l0aGluIHRoZSByZWNvbW1lbmRhdGlvbiBhdCBcIik7Xy5iKF8udihfLmYoXCJESUFNXCIsYyxwLDApKSk7Xy5iKFwiIG1pbGVzLlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvc3Ryb25nPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwidml6XFxcIiBzdHlsZT1cXFwicG9zaXRpb246cmVsYXRpdmU7XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxpbWcgc3JjPVxcXCJodHRwOi8vczMuYW1hem9uYXdzLmNvbS9TZWFTa2V0Y2gvcHJvamVjdHMvYmFyYnVkYS9taW5fd2lkdGhfZXhhbXBsZS5wbmdcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYW55QXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCwxMjIxLDEzNDUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgQXR0cmlidXRlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiLGMscCxcIiAgXCIpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31yZXR1cm4gXy5mbCgpOzt9KTtcblxubW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdOyJdfQ==
;