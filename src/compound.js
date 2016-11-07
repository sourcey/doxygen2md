/**
 * Copyright (c) 2016 Philippe FERDINAND
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 **/
'use strict';
var log = require('winston');

function Compound(parent, name) {
  this.parent = parent;
  this.name = name;
  this.compounds = {};
  this.members = [];
  this.basecompoundref = [];
  this.filtered = {};
}

Compound.prototype.find = function (fullname, create) {

  var name = fullname.join('::');
  var compound = this.compounds[name];

  if (!compound && create) {
    compound = this.compounds[name] = new Compound(this, name);
  }

  // var name = fullname; //[0];
  // var compound = this.compounds[name];
  //
  // if (!compound && create) {
  //   if (!name || name.length == 0)
  //     throw ('Cannot create compound without name');
  //   compound = this.compounds[name] = new Compound(name);
  // }
  //
  // // if (compound && fullname.length > 1) {
  // //   compound = compound.find(fullname, true);
  // // }
  //
  // if (!compound)
  //   throw ('Cannot find or create compound');

  return compound;
}

Compound.prototype.reparent = function (newparent) {

  if (this.parent)
      delete this.parent.compounds[this.name];
  newparent.compounds[this.name] = this;
  this.parent = newparent;
}

Compound.prototype.toArray = function (type) {

  var arr = Object.keys(this[type]).map(function(key) {
    return this[key];
  }.bind(this[type]));

  if (type == 'compounds') {
    var all = new Array();
    arr.forEach(function (compound) {
      if (compound) { // undefined's creaping in
        all.push(compound);
        all = all.concat(compound.toArray(type));
      }
    }.bind(this));
    arr = all;
  }

  return arr;
}

Compound.prototype.getAll = function (type, filtered, group) {

  var all = [];

  if (filtered) {
    (this.filtered[type] || []).forEach(function (item) {
      var children = item.getAll(type, filtered, group);

      // skip unwanted items
      // if (item.kind == 'namespace') {
      //   if (!children.length) {
      //     log.verbose('skip empty namespace', item.name);
      //     return;
      //   }
      // }
      // else if (group && item.groupid != group.id) {
      //   log.verbose('skip foreign group', item.kind, item.name, item.groupid, group.id);
      //   return;
      // }

      all.push(item);
      all = all.concat(children);
    }.bind(this));
  }

  return all;
}

Compound.prototype.assignGroup = function (groupid) {
  this.groupid = groupid;
  this.members.forEach(function (member) {
    member.groupid = groupid;
  });

  for (var refid in this.compounds) {
    var compound = this.compounds[refid];
    member.groupid = groupid;
  }
}

Compound.prototype.filter = function (collection, key, filter, group) {

  var categories = {};
  var result = [];

  Object.keys(collection).forEach(function (name) {
    var item = collection[name];
    if (item) {
      // skip unwanted items
      if (item.kind == 'namespace') {
        if ((!item.filtered.compounds || !item.filtered.compounds.length) &&
          (!item.filtered.members || !item.filtered.members.length)) {
          log.verbose('skip empty namespace', item.name);
          return;
        }
      }
      else if (group && item.groupid != group.id) {
        log.verbose('skip foreign group', item.kind, item.name, item.groupid, group.id);
        return;
      }
      (categories[item[key]] || (categories[item[key]] = [])).push(item);
    }
  }.bind(this));

  filter.forEach(function (category) {
    result = result.concat(categories[category] || []);
  });

  return result;
}

Compound.prototype.toMarkdown = function (templates) {

  var template;

  switch (this.kind) {
    case 'namespace':
      if (Object.keys(this.compounds).length === 1
        && this.compounds[Object.keys(this.compounds)[0]].kind == 'namespace') {
        return undefined;
      }
      template = 'namespace';
      break;
    case 'group':
      template = 'group';
      break;
    case 'class':
    case 'struct':
      template = 'class';
      break;
    default:
      return undefined;
  }

  log.verbose('Rendering ' + this.kind + ' ' + this.fullname);

  return templates[template](this);
}

module.exports = Compound;
