'use strict';

var prime = require('prime'),
	$ = require('elements'),
	indexOf = require('mout/array/indexOf'),
	informal = require('informal'),
	FieldBase = informal.fields.base;

var FieldNavBuilder = prime({
	inherits: FieldBase,
	nodeIds: {},
	nodeId: 0,

	constructor: function(spec, value){
		if (!(this instanceof FieldNavBuilder)){
			return new FieldNavBuilder(spec, value);
		}
		FieldBase.call(this, spec, value);
	},

	build: function(){
		if (this.wrap) return;

		var li = document.createElement('li');
		li.innerHTML = '<div class="nav-builder">' +
			'<div class="nav-builder--new">' +
				'<input class="nav-builder--new-label" placeholder="Label">' +
				'<button class="nav-builder--new-add">Add node</button>' +
			'</div>' +
			'<ul class="nav-builder--nodes"></ul>' +
		'</div>';

		this.wrap = $(li);

		this.placeholder = document.createElement('li');
		this.placeholder.classList.add('nav-builder--placeholder');

		this.nodes = li.querySelector('.nav-builder--nodes');

		var newLabel = li.querySelector('.nav-builder--new-label'),
			addButton = li.querySelector('.nav-builder--new-add'),
			self = this;

		addButton.addEventListener('click', function(e){
			e.preventDefault();
			self.addNode(self.nodes, { label: newLabel.value });
			newLabel.value = '';
			newLabel.focus();
		});

		this.applyValue(this.value, this.nodes);
		this.setEvents();
	},

	setEvents: function(){
		var self = this, isDrag;

		this.nodes.addEventListener('mousedown', function(e){
			var target = e.target || e.srcElement;
			if (target.classList.contains('drag')){
				isDrag = true;
			}
		});

		this.nodes.addEventListener('dragover', function(e){
			e.preventDefault(); // required for anything to be droppable at all
		});

		this.nodes.addEventListener('dragstart', function(e){
			if (!isDrag){
				e.preventDefault();
				return;
			}
			var target = e.target || e.srcElement;
			e.dataTransfer.setData('text', ''); // needed for drag to work in FF
			isDrag = false;
			self.dragBlock = target;

			// this delay is needed cause the dragImage won't be created properly otherwise
			setTimeout(function(){
				var rect = self.dragBlock.getBoundingClientRect();
				self.placeholder.style.height = (rect.bottom - rect.top) + 'px';
				self.dragBlock.parentNode.insertBefore(self.placeholder, self.dragBlock);
				self.dragBlock.style.display = 'none';
			}, 1);
		});

		this.nodes.addEventListener('dragenter', function(e){
			var target = e.target || e.srcElement,
				nodes = self.getNodes(target),
				wrap = self.getNodeWrap(target),
				node = self.getNode(target);

			if (node){
				var placeholderIndex = indexOf(nodes.childNodes, self.placeholder),
					wrapIndex = indexOf(nodes.childNodes, wrap),
					method = 'after';

				if (placeholderIndex == -1 || placeholderIndex > wrapIndex){
					method = 'before';
				}
				$(self.placeholder)[method](wrap);
			}

			if (target.classList.contains('nav-builder--nodes')){
				target.appendChild(self.placeholder);
			}
		});

		document.body.addEventListener('dragend', function(e){
			self.dragEnd();
		});
	},

	dragEnd: function(){
		this.placeholder.parentNode.insertBefore(this.dragBlock, this.placeholder);
		this.dragBlock.style.display = 'block';
		this.placeholder.parentNode.removeChild(this.placeholder);
		this.placeholder.style.height = '';
	},

	getNode: function(el){
		if (el.classList.contains('nav-builder--node')) return el;

		var parent = $(el).parent('.nav-builder--node');
		if (parent) return parent[0];
	},

	getNodeWrap: function(el){
		if (el.classList.contains('nav-builder--node-wrap')) return el;

		var parent = $(el).parent('.nav-builder--node-wrap');
		if (parent) return parent[0];
	},

	getNodes: function(el){
		if (el.classList.contains('nav-builder--nodes')) return el;

		var parent = $(el).parent('.nav-builder--nodes');
		if (parent) return parent[0];
	},

	applyValue: function(nodes, parent){
		if (!nodes || !nodes.length || !parent) return;

		var i, node;
		for (i = 0; i < nodes.length; i++){
			node = this.addNode(parent, nodes[i]);
			this.applyValue(nodes[i].children, node.querySelector('.nav-builder--nodes'));
		}
	},

	addNode: function(parent, data){
		var nodeId = this.nodeId++,
			li = document.createElement('li');

		li.classList.add('nav-builder--node-wrap');
		li.setAttribute('data-node-id', nodeId);
		li.setAttribute('draggable', true);
		li.innerHTML = '<div class="nav-builder--node">' +
				'<span class="drag"></span>' +
			'</div>' +
			'<ul class="nav-builder--nodes"></ul>';

		var form = new informal.Form({
			pages: [{ groups: ['group1'] }],
			groups: { group1: { fields: ['label', 'slug', 'type']}
			},
			fields: {
				label: { type: 'text' },
				slug: { type: 'text' },
				type: { type: 'single_option', options: [{ value: 'page' }] }
			}
		}, data);

		form.attach(li.querySelector('.nav-builder--node'));

		this.nodeIds[nodeId] = form;
		parent.appendChild(li);
		return li;
	},

	serialize: function(){
		var self = this;
		var readNodes = function(nodes){
			if (!nodes || !nodes.length) return;

			var i, node, nodeData, childData, data = [];
			for (i = 0; i < nodes.length; i++){
				node = nodes[i];
				nodeData = self.nodeIds[node.getAttribute('data-node-id')].serialize();
				childData = readNodes(node.querySelector('.nav-builder--nodes').children);

				if (childData){
					nodeData.children = childData;
				}

				data.push(nodeData);
			}

			return data;
		};

		return readNodes(this.nodes.children) || [];
	}
});

module.exports = FieldNavBuilder;
