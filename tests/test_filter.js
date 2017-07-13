"use strict";


var unit = require("heya-unit");

var Parser   = require("../Parser");
var Streamer = require("../Streamer");
var Combo    = require("../Combo");
var Filter   = require("../Filter");

var Asm = require("../utils/Assembler");

var ReadString = require("./ReadString");


unit.add(module, [
	function test_filter(t){
		var async = t.startAsync("test_filter");

		var input = '{"a": 1, "b": true, "c": ["d"]}',
			pipeline = new ReadString(input).pipe(new Parser()).pipe(new Streamer()).
				pipe(new Filter({filter: /^(|a|c)$/})),
			result = [];

		pipeline.on("data", function(chunk){
			result.push({name: chunk.name, val: chunk.value});
		});
		pipeline.on("end", function(){
			eval(t.ASSERT("result.length === 15"));
			eval(t.TEST("result[0].name === 'startObject'"));
			eval(t.TEST("result[1].name === 'startKey'"));
			eval(t.TEST("result[2].name === 'stringChunk' && result[2].val === 'a'"));
			eval(t.TEST("result[3].name === 'endKey'"));
			eval(t.TEST("result[4].name === 'keyValue' && result[4].val === 'a'"));
			eval(t.TEST("result[5].name === 'startNumber'"));
			eval(t.TEST("result[6].name === 'numberChunk' && result[6].val === '1'"));
			eval(t.TEST("result[7].name === 'endNumber'"));
			eval(t.TEST("result[8].name === 'startKey'"));
			eval(t.TEST("result[9].name === 'stringChunk' && result[9].val === 'c'"));
			eval(t.TEST("result[10].name === 'endKey'"));
			eval(t.TEST("result[11].name === 'keyValue' && result[11].val === 'c'"));
			eval(t.TEST("result[12].name === 'startArray'"));
			eval(t.TEST("result[13].name === 'endArray'"));
			eval(t.TEST("result[14].name === 'endObject'"));
			async.done();
		});
	},
	function test_filter_deep(t){
		var async = t.startAsync("test_filter");

		var data = {a: {b: {c: 1}}, b: {b: {c: 2}}, c: {b: {c: 3}}};

		const pipeline = new ReadString(JSON.stringify(data)).
		    pipe(new Combo({packKeys: true, packStrings: true, packNumbers: true})).
		    pipe(new Filter({filter: /^(?:a|c)\.b\b/}));

		const asm = new Asm();

		pipeline.on('data', function (chunk) {
		    asm[chunk.name] && asm[chunk.name](chunk.value);
		});

		pipeline.on('end', function () {
		    eval(t.TEST("t.unify(asm.current, {a: {b: {c: 1}}, c: {b: {c: 3}}})"));
			async.done();
		});

	}
]);
