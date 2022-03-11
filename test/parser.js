"use strict";

const rewire    = require('rewire');
const chai      = require('chai');
const expect    = chai.expect;

const Parser    = require('../src/parser.ts').default;
const p         = rewire('../src/parser.ts');
const AwokenRef = require('../src/index.ts').default;

describe("parser internals", () => {
	it("pBookId", () => {
		let pBookId = p.__get__("pBookId");
		expect(      pBookId.tryParse("GEN")).to.equal("GEN");
		expect(      pBookId.tryParse("Gen")).to.equal("GEN");
		expect(      pBookId.tryParse("gen")).to.equal("GEN");
		expect(      pBookId.tryParse("REV")).to.equal("REV");
		expect(() => pBookId.tryParse("123")).to.throw();
	});

	it("pBookPrefixNumber", () => {
		let pBookId = p.__get__("pBookPrefixNumber");
		expect(      pBookId.tryParse(  "1")).to.equal(1);
		expect(      pBookId.tryParse(  "2")).to.equal(2);
		expect(      pBookId.tryParse(  "3")).to.equal(3);
		expect(      pBookId.tryParse(  "I")).to.equal(1);
		expect(      pBookId.tryParse( "II")).to.equal(2);
		expect(      pBookId.tryParse("III")).to.equal(3);

		expect(() => pBookId.tryParse("" )).to.throw();
		expect(() => pBookId.tryParse("a")).to.throw();
		expect(() => pBookId.tryParse("4")).to.throw();
	});

	it("pBookName", () => {
		let pBookName = p.__get__("pBookName");
		expect(      pBookName.tryParse("Genesis"        )).to.equal("GEN");
		expect(      pBookName.tryParse("genesis"        )).to.equal("GEN");
		expect(      pBookName.tryParse("GENESIS"        )).to.equal("GEN");
		expect(      pBookName.tryParse("Exodus"         )).to.equal("EXO");
		expect(      pBookName.tryParse("exod"           )).to.equal("EXO");
		expect(      pBookName.tryParse("Mark"           )).to.equal("MRK");
		expect(      pBookName.tryParse("Psalm"          )).to.equal("PSA");
		expect(      pBookName.tryParse("Psalms"         )).to.equal("PSA");
		expect(      pBookName.tryParse("Ps"             )).to.equal("PSA");
		expect(      pBookName.tryParse("1Kings"         )).to.equal("1KI");
		expect(      pBookName.tryParse("2 Kgs"          )).to.equal("2KI");
		expect(      pBookName.tryParse("2 Kings"        )).to.equal("2KI");
		expect(      pBookName.tryParse("John"           )).to.equal("JHN");
		expect(      pBookName.tryParse("I John"         )).to.equal("1JN");
		expect(      pBookName.tryParse("1 John"         )).to.equal("1JN");
		expect(      pBookName.tryParse("1st John"       )).to.equal("1JN");
		expect(      pBookName.tryParse("First John"     )).to.equal("1JN");
		expect(      pBookName.tryParse("II John"        )).to.equal("2JN");
		expect(      pBookName.tryParse("2 John"         )).to.equal("2JN");
		expect(      pBookName.tryParse("III John"       )).to.equal("3JN");
		expect(      pBookName.tryParse("2 THESS"        )).to.equal("2TH");
		expect(      pBookName.tryParse("II THESS"       )).to.equal("2TH");
		expect(      pBookName.tryParse("3 John"         )).to.equal("3JN");
		expect(      pBookName.tryParse("3rd John"       )).to.equal("3JN");
		expect(      pBookName.tryParse("Third John"     )).to.equal("3JN");
		expect(      pBookName.tryParse("2nd Samuel"     )).to.equal("2SA");
		expect(      pBookName.tryParse("2nd Sam"        )).to.equal("2SA");
		expect(      pBookName.tryParse("Second Sam"     )).to.equal("2SA");
		expect(      pBookName.tryParse("song of solomon")).to.equal("SNG");
		expect(      pBookName.tryParse("Song of Solomon")).to.equal("SNG");
		expect(      pBookName.tryParse("song of songs"  )).to.equal("SNG");
		expect(      pBookName.tryParse("Song of Songs"  )).to.equal("SNG");
		expect(      pBookName.tryParse("SongofSolomon"  )).to.equal("SNG");
		expect(      pBookName.tryParse("sos"            )).to.equal("SNG");

		expect(() => pBookName.tryParse(""       )).to.throw();
		expect(() => pBookName.tryParse("hello"  )).to.throw();
		expect(() => pBookName.tryParse("3 Kings")).to.throw();
	});
});


describe("parse", () => {
	function parse(str){ return AwokenRef.parse(str); }
	function parseErr(str){
		let out = AwokenRef.parse(str);
		delete out.expected;
		return out;
	}

	it("Single Verse", () => {
		expect(parse('Malachi 10:8')).to.deep.equal({
			status: true,
			value: [{ book: 'MAL', chapter: 10, verse:  8 }]
		});
	});

	it("Error Objects", () => {
		expect(parseErr('XYZ 1:1')).to.deep.equal({
			status : false,
			input  : 'XYZ 1:1',
			index  : { column: 4, line: 1, offset: 3 },
		});

		expect(parseErr('GEN a:1')).to.deep.equal({
			status : false,
			input  : 'GEN a:1',
			index  : { column: 5, line: 1, offset: 4 },
		});

		expect(parseErr('GEN 1a1')).to.deep.equal({
			status : false,
			input  : 'GEN 1a1',
			index  : { column: 6, line: 1, offset: 5 },
		});

		expect(parseErr('GEN 1:a')).to.deep.equal({
			status : false,
			input  : 'GEN 1:a',
			index  : { column: 7, line: 1, offset: 6 },
		});
	});

	it("Verse Range", () => {
		expect(parse('Job 8:3-6')).to.deep.equal({
			status: true,
			value: [{
				is_range: true,
				start : { book: 'JOB', chapter: 8, verse:  3 },
				end   : { book: 'JOB', chapter: 8, verse:  6 },
			}]
		});

		expect(parse('Esther 7 v 5 - 10')).to.deep.equal({
			status: true,
			value: [{
				is_range: true,
				start : { book: 'EST', chapter: 7, verse:	 5 },
				end		: { book: 'EST', chapter: 7, verse: 10 },
			}]
		});
	});

	it("Full Chapters", () => {
		expect(parse('Mark 8')).to.deep.equal({
			status: true,
			value: [{
				is_range: true,
				start : { book: 'MRK', chapter:	8, verse:	1 },
				end		: { book: 'MRK', chapter:	8, verse: 38 },
			}]
		});
	});

	it("Chapter Range", () => {
		expect(parse('Mark 8-10')).to.deep.equal({
			status: true,
			value: [{
				is_range: true,
				start : { book: 'MRK', chapter:	 8, verse:	1 },
				end		: { book: 'MRK', chapter: 10, verse: 52 },
			}]
		});

		expect(parse('Mark 8:5-10:15')).to.deep.equal({
			status: true,
			value: [{
				is_range: true,
				start : { book: 'MRK', chapter:  8, verse:  5 },
				end   : { book: 'MRK', chapter: 10, verse: 15 },
			}]
		});
	});

	it("Full Books", () => {
		expect(parse('Genesis')).to.deep.equal({
			status: true,
			value: [{
				is_range: true,
				start : { book: 'GEN', chapter:  1, verse:  1 },
				end   : { book: 'GEN', chapter: 50, verse: 26 },
			}]
		});

		expect(parse('Ruth')).to.deep.equal({
			status: true,
			value: [{
				is_range: true,
				start : { book: 'RUT', chapter: 1, verse:  1 },
				end   : { book: 'RUT', chapter: 4, verse: 22 },
			}]
		});
	});

	it("Book Range", () => {
		expect(parse('Genesis - Leviticus')).to.deep.equal({
			status: true,
			value: [{
				is_range: true,
				start : { book: 'GEN', chapter:  1, verse:  1 },
				end   : { book: 'LEV', chapter: 27, verse: 34 },
			}]
		});

		expect(parse('Genesis - Leviticus 2:3')).to.deep.equal({
			status: true,
			value: [{
				is_range: true,
				start : { book: 'GEN', chapter: 1, verse: 1 },
				end   : { book: 'LEV', chapter: 2, verse: 3 },
			}]
		});

		expect(parse('Mat 5:10 - Mk.')).to.deep.equal({
			status: true,
			value: [{
				is_range: true,
				start : { book: 'MAT', chapter:  5, verse: 10 },
				end   : { book: 'MRK', chapter: 16, verse: 20 },
			}]
		});
	});

	it("Comma separated", () => {
		expect(parse('GEN 3:12,15')).to.deep.equal({
			status: true,
			value: [
				{ book: 'GEN', chapter: 3, verse: 12 },
				{ book: 'GEN', chapter: 3, verse: 15 },
			],
		});

		expect(parse('GEN 3:12-15,18')).to.deep.equal({
			status: true,
			value: [
				{ is_range: true,
					start : { book: 'GEN', chapter: 3, verse: 12 },
					end   : { book: 'GEN', chapter: 3, verse: 15 },
				},
				{ book: 'GEN', chapter: 3, verse: 18 },
			],
		});

		expect(parse('GEN 3:12,4:15')).to.deep.equal({
			status: true,
			value: [
				{ book: 'GEN', chapter: 3, verse: 12 },
				{ book: 'GEN', chapter: 4, verse: 15 },
			],
		});

		expect(parse('GEN 2,6')).to.deep.equal({
			status: true,
			value: [
				{ is_range: true,
					start : { book: 'GEN', chapter: 2, verse:  1 },
					end   : { book: 'GEN', chapter: 2, verse: 25 },
				},
				{ is_range: true,
					start : { book: 'GEN', chapter: 6, verse:  1 },
					end   : { book: 'GEN', chapter: 6, verse: 22 },
				}
			],
		});
	});


	it("Cross Book Range", () => {
		expect(parse('Exo 39:10 - Lev 2:6')).to.deep.equal({
			status: true,
			value: [
				{ is_range: true,
					start : { book: 'EXO', chapter: 39, verse: 10 },
					end   : { book: 'LEV', chapter:  2, verse:  6 },
				},
			],
		});

		expect(parse('Exo 39 - Lev 2')).to.deep.equal({
			status: true,
			value: [
				{ is_range: true,
					start : { book: 'EXO', chapter: 39, verse:  1 },
					end   : { book: 'LEV', chapter:  2, verse: 16 },
				},
			],
		});

		expect(parse('Exo 39:10 - Lev 2')).to.deep.equal({
			status: true,
			value: [
				{ is_range: true,
					start : { book: 'EXO', chapter: 39, verse: 10 },
					end   : { book: 'LEV', chapter:  2, verse: 16 },
				},
			],
		});

		expect(parse('GEN3:8-EXO3:10')).to.deep.equal({
			status: true,
			value: [
				{ is_range: true,
					start : { book: 'GEN', chapter: 3, verse:  8 },
					end   : { book: 'EXO', chapter: 3, verse: 10 },
				},
			],
		});
	});

	it("Seperated by ;", () => {
		expect(parse('Matthew 1:1; John 3:16')).to.deep.equal({
			status: true,
			value: [
				{ book: 'MAT', chapter: 1, verse:  1 },
				{ book: 'JHN', chapter: 3, verse: 16 }
			]
		});
	});

	it("All features simultaniosuly", () => {
		expect(parse('Genesis 2, 4:3,8, 6:9-12,18-20,27 ; ECC 7')).to.deep.equal({
			status: true,
			value: [{ is_range: true,
								start: { book: 'GEN', chapter: 2, verse:  1 },
								end  : { book: 'GEN', chapter: 2, verse: 25 },
							},
							{ book: 'GEN', chapter: 4, verse: 3 },
							{ book: 'GEN', chapter: 4, verse: 8 },
							{ is_range: true,
								start: { book: 'GEN', chapter: 6, verse:  9 },
								end  : { book: 'GEN', chapter: 6, verse: 12 },
							},
							{ is_range: true,
								start: { book: 'GEN', chapter: 6, verse: 18 },
								end  : { book: 'GEN', chapter: 6, verse: 20 },
							},
							{ book: 'GEN', chapter: 6, verse: 27 },
							{ is_range: true,
								start: { book: 'ECC', chapter: 7, verse:  1 },
								end  : { book: 'ECC', chapter: 7, verse: 29 },
							},
						 ]
		});
	});

	it("John edge cases", () => {
		// This nasty since the "1-2" could be a range of verses inside
		// 1 john, and then the second part could be a new bible referenmce
		// to "John 4:5" - however since there is no ; seperator we should
		// be parsing this in its entirety
		let res_a = {
			status: true,
			value: [
				{ is_range: true,
					start: { book: '1JN', chapter: 10, verse: 1 },
					end  : { book: '2JN', chapter:  4, verse: 5 },
				},
			],
		};
		expect(parse('1 John 10:1 - 2 John 4:5')).to.deep.equal(res_a);

		let res_b = {
			status: true,
			value: [
				{ is_range: true,
					start: { book: '1JN', chapter: 10, verse: 1 },
					end  : { book: '1JN', chapter: 10, verse: 2 },
				},
				{ book: 'JHN', chapter: 4, verse: 5 }
			],
		};
		expect(parse('1 John 10:1 - 2 ; John 4:5')).to.deep.equal(res_b);

		// We also want to be able to parse this without whitespace if it were
		// included in a URL
		expect(parse('1JN 10:1 - 2JN 4:5')).to.deep.equal(res_a);
		expect(parse('1JN10:1-2JN4:5')).to.deep.equal(res_a);

		expect(parse('1JN 10:1-2 ; JHN 4:5')).to.deep.equal(res_b);
		expect(parse('1JN10:1-2;JHN4:5')).to.deep.equal(res_b);
	});

	it("Invalid look alikes", () => {
		expect(parse("Gen 1-2-3" ).status).to.deep.equal(false);
		expect(parse("Gen 1:2:3" ).status).to.deep.equal(false);
		expect(parse("Gen 1:2,3,").status).to.deep.equal(false);
		expect(parse("Gen 1 a"   ).status).to.deep.equal(false);
		expect(parse("Gen 1 -"   ).status).to.deep.equal(false); // incomplete
		expect(parse("Gen 1:"    ).status).to.deep.equal(false); // incomplete
		expect(parse("Gen\n1"    ).status).to.deep.equal(false); // dont allow \n
		expect(parse("Gen 9 - 9" ).status).to.deep.equal(false); // invalid range
		expect(parse("Gen 9 - 5" ).status).to.deep.equal(false); // invalid range

		// We could choose to parse these:
		// 1 - 2:3 :: Chapter 1 verse 1 --- Chapter 2 verse 3
		// 1:2 - 3 :: Chapter 1 verse 2 --- end of chapter 3
		// However the second is already used to mean "chapter 1 verse 2 - 3"
		// Hence the first option should fail to parse as it makes the language
		// semantics confusingly ambiogious
		expect(parse("Gen 1 - 2:3" ).status).to.deep.equal(false);
	});

	it("Out of range values don't crash", () => {
		// The numbers in these strings are higher than really exist, but these
		// shouldn't crash - user is expected to call validate() to ensure its
		// a valid reference
		expect(parse('Ruth 12'	).value)
			.to.deep.equal([ { is_range: true,
												 start: { book: 'RUT', chapter: 12, verse: 1 },
												 end  : { book: 'RUT', chapter: 12, verse: 1 }
											 } ]);
		expect(parse('Ruth 2:50').value)
			.to.deep.equal([ { book: 'RUT', chapter: 2, verse: 50 } ]);
	});

	// These are the sorts of strings produced by formatter with url: true option
	it("URL", () => {
		const run = (str, expected) => {
			let main = parse(str).value;
			if(expected) {
				expect(main).to.deep.equal(expected);
			}
			expect(AwokenRef.parseUrlEncoded(str)).to.deep.equal(main);
		};

		// Comma after v retains context of the chapter
		run('gen3v2,3,4', [
			{ book: 'GEN', chapter: 3, verse: 2 },
			{ book: 'GEN', chapter: 3, verse: 3 },
			{ book: 'GEN', chapter: 3, verse: 4 },
		]);

		// ranges after v make a verse range within the chapter context
		run('gen3v2-4', [
			{ is_range: true,
				start: { book: 'GEN', chapter: 3, verse: 2 },
				end	: { book: 'GEN', chapter: 3, verse: 4 },
			}
		]);

		// range without v makes a full chapter range
		run('gen3-4', [{
			is_range: true,
			start: { book: 'GEN', chapter: 3, verse:  1 },
			end  : { book: 'GEN', chapter: 4, verse: 26 },
		}]);

		// can split groups with _, and we can have a range between two exact verses
		run('gen1v2-10_exo5v3-6v4', [
			{ is_range: true,
				start: { book: 'GEN', chapter: 1, verse:	 2 },
				end	: { book: 'GEN', chapter: 1, verse: 10 },
			},
			{ is_range: true,
				start: { book: 'EXO', chapter: 5, verse: 3 },
				end	: { book: 'EXO', chapter: 6, verse: 4 },
			}
		]);

		// cross book ranges are complex - check they work as for the normal parser
		// in the url dedicated parser
		run('gen-exo', [{
			is_range: true,
			start : { book: 'GEN', chapter: 1, verse: 1 },
			end   : { book: 'EXO', chapter: 40, verse: 38 },
		}]);
		run('gen5-exo', [{
			is_range: true,
			start: { book: 'GEN', chapter:  5, verse:  1 },
			end  : { book: 'EXO', chapter: 40, verse: 38 },
		}]);
		run('gen5v3-exo', [{
			is_range: true,
			start: { book: 'GEN', chapter:  5, verse:  3 },
			end  : { book: 'EXO', chapter: 40, verse: 38 },
		}]);
		run('gen5v3-exo', [{
			is_range: true,
			start: { book: 'GEN', chapter:  5, verse:  3 },
			end  : { book: 'EXO', chapter: 40, verse: 38 },
		}]);
		run('gen-exo3', [{
			is_range: true,
			start : { book: 'GEN', chapter: 1, verse: 1 },
			end   : { book: 'EXO', chapter: 3, verse: 22 },
		}]);
		run('gen-exo3v4', [{
			is_range: true,
			start : { book: 'GEN', chapter: 1, verse: 1 },
			end   : { book: 'EXO', chapter: 3, verse: 4 },
		}]);
		run('gen5-exo3', [{
			is_range: true,
			start : { book: 'GEN', chapter: 5, verse: 1 },
			end   : { book: 'EXO', chapter: 3, verse: 22 },
		}]);
		run('gen5v6-exo3v7', [{
			is_range: true,
			start : { book: 'GEN', chapter: 5, verse: 6 },
			end   : { book: 'EXO', chapter: 3, verse: 7 },
		}]);

		// test for consistancy between parse and parseUrlEncode on large inputs
		run('gen-exo_rev');
		run('1ki-2ki');
		run('gen-deu_job_psa90');
		run('gen1_exo2-3_deu1-3,4v2,5,8-10,6v9,10');
		run('gen49v10_num24v17_deu18v15_1ch17v13_psa2v7,12,16v10,110v1,5_isa7v14,8v8,9v6,11v1,40v3,49v7_jer33v15_dan7v13,9v25_zec6v12,9v9_mal3v1,4v2_mat1v1,16-18,21-23,1v25-2v1,2v4,15,3v3,13,3v15-4v1,4v3,6-7,10,12,17-18,23,5v33,7v21-7v22,7v28,8v2-8v8,8v10,13-14,18,20-22,25,29,34,9v2,4,6,9-10,12,15,19,22-23,27-28,30,35,38,10v5,23,11v1-11v2,11v4,7,19,25,27,12v1,8,15,23,25,32,40,13v1,34,36-37,41,51,53,57,14v1,12-14,16,22,25,27-31,33,15v1,16,21-22,25,27-30,32,34,16v6,8,13,16-17,20-22,24,16v27-17v1,17v4-17v5,17v7-17v9,17v11-17v12,17v15,17-20,22,24-26,18v1-18v2,18v11,21-22,26,19v1,14,17-18,21,23,26,28,20v17-20v18,20v22,25,28,20v30-21v1,21v3,6,9,11-12,15-16,21,24,27-28,31,42,22v1,16,18,29,37,41-42,44-45,23v1,8,10,23v39-24v2,24v4-24v5,24v23,27,30,37,39,42,44,25v11,13,20,22,24,31,37,44,26v1-26v2,26v4,6,10,17,19,22,24,26,31,34,36,45,49-52,55,57,59,63-64,68-69,71,26v75-27v1,27v10-27v11,27v17,20,22,26-27,37,40,43,46,50,54-55,57-58,28v2,5-6,9-10,16,18-19_mrk1v1,3,9,11,14,17,24-25,41,45,2v5,8,10,15,17,19,28,3v7,11,5v6-5v7,5v13,15,19-21,24,27,30,36,6v3-6v4,6v30,34,7v27-7v28,8v1,17,27,29,31,38,9v2,4-5,7-9,12,23-25,27,31,39,41,10v5,14,18,21,23-24,27,29,32-33,38-39,42,45,47-52,11v3,6-7,9-11,14-15,22,29,33,12v17,24,29-30,34-36,41,13v2,5-6,20-21,26,32,34,14v6,18,21-22,27,30,41,45,48,53,55,60-62,67,14v72-15v1,15v5,15,32,34,37,39,43,16v6,19-20_luk1v9,17,28,31-32,35,38,43,45,47,58,2v7,11,21-23,26-27,29,37,43,48,52,3v4,15,21-23,4v1,3-4,8-9,12,14,19,34-35,41,5v8,10,12,17,19,22,24,31,6v3,5,9,11,22,46,7v3-7v4,7v6,9,13,19,22,31,34,40,8v24,28,30,35,38-41,45-46,50,9v20,22,26,33,35-36,41-44,47,50,54,9v56-10v2,10v17,21-22,27,29-30,37,39-41,11v1,30,39,12v8,10,40-42,13v2,8,12,14-15,23,25,35,14v3,22,15v31,16v25,17v5-17v6,17v13,17,22,24,26,30,37,18v6,8,16,19,22,24,31,37-42,19v3,5,8-10,16,18,20,25,31,34-35,38,20v8,34,37,41-42,21v8,27,36,22v22,31,33,38,47-49,51-52,61,63,67,69-70,23v2,8,20,25-26,28,34-35,39,42-43,46,52,24v3,7,15,19,26,34,36,46_jhn1v1,7-9,14,17-18,20,23,25,29,34,36-38,41-43,45,1v47-2v4,2v7,11,13,19,22,24,3v2-3v3,3v5,10,13-14,16-18,22,28,3v35-4v2,4v6-4v7,4v10,13,16-17,21,24-26,29,34,42,44,46-48,50,4v53-5v1,5v6,8,13-17,19-23,25-27,6v1,3,5,10-11,14-15,17,19,22-24,26-27,29,32,34-35,40,42-43,53,61-64,67-70,7v1,6,14,16,21,26-28,31,33,37,39,41-42,50,8v1,6,9-12,14,19-21,25,28,31,34-36,39,42,49,54,58-59,9v3,11,14,22,35-39,41,10v6-10v7,10v23-10v25,10v32,34,36,11v2-11v5,11v9,12-14,17,20-21,23,25,27,30,32-35,38-41,44-46,51,54,56,12v1,3,7,9,11-14,16,21-23,30,34-36,38,44,13v1,3,6-10,13-14,21,23,25-27,29,31,36-38,14v5-14v6,14v8-14v9,14v13,22-23,16v19,31,17v1,3,18v1-18v2,18v4-18v5,18v7-18v8,18v11-18v12,18v15,19-20,22-23,28,32-34,36-37,19v1,5,7,9,11,13,16,18-20,23,25-26,28,30,33,38-40,42,20v2,12-21,24-26,20v28-21v1,21v4-21v5,21v7,10,12-17,20-23,25_act1v1,6,11,14,16,21,24,2v20-2v22,2v25,27,30-32,34,36,38-39,47,3v6,13-14,18-20,22-23,26,4v2,10,13,18,24,26-27,29-30,33,5v9,14,19,30-31,40,42,6v14,7v30-7v31,7v33,37,49,55-56,59-60,8v5,12,16,24-26,35,37,39,9v1,5-6,10-11,13,15,17,20,22,27,29,31,34-35,42,10v4,14,36,38,48,11v8,16-17,20-21,23-24,12v7,11,17,23,13v2,10-12,23,33,35,47-49,14v3,23,15v11,26,35-36,16v10,14-15,18,31-32,17v3,7,18,24,27,18v5,8-9,25,28,19v4-19v5,19v10,13,15,17,20v19,21,24,35,21v13-21v14,21v20,22v8,10,16,19,23v11,24v24,25v19,26v9,15,23,28v23,31_rom1v1,3-4,6-9,16,2v16,3v22,24,26,4v8,24,5v1,6,8,10-11,15,17,21,6v3-6v4,6v8-6v9,6v11,23,7v4,7v25-8v3,8v9-8v11,8v17,29,32,34-35,8v39-9v1,9v3,5,29,10v4,6-7,9,12-13,16,11v3,34,12v5,11,19,13v14,14v6,8-11,14-15,18,15v3,5-8,11,16-20,29-30,16v2-16v3,16v5,7-13,16,18,20,22,24-25,27_1co1v1-4,6-10,12-13,17,23-24,30-31,2v2,8,2v16-3v1,3v5,11,20,3v23-4v1,4v4-4v5,4v10,15,17,19,5v4-5v5,5v7,6v11,13-15,17,7v10,12,17,22,25,32,34-35,39,8v6,11-12,9v1-9v2,9v5,12,14,18,21,10v4,9,16,21-22,11v1,3,11,23,27,32,12v3,5,12,27,14v21,37,15v3,12-20,22-23,28,31,47,57-58,16v2,7,10,19,22-24_2co1v1-3,5,14,19,21,2v10,12,14-15,17,3v3-3v4,3v14,16-18,4v4-4v6,4v10-4v11,4v14,5v6,8,10-11,14,16-20,6v15,17,8v5,9,19,21,23,9v13,10v1,5,8,14,17-18,11v2-11v4,11v10,13,17,23,31,12v1-12v2,12v8-12v9,12v19,13v3,5,10,14_gal1v1,3,6-7,10,12,16,22,2v4,16-17,2v20-3v1,3v13-3v14,3v16-3v17,3v22,24,26-28,4v4,6-7,14,19,5v1-5v2,5v4,6,10,6v2,12,14-15,17-18_eph1v1-3,5,10,12-13,15,17,20,2v5-2v7,2v10,12-13,20-21,3v1,4,6,8-9,11,14,17,19,3v21-4v1,4v5,7,12-13,15,17,20-21,30,5v2,5,8,10,14,17,19-20,22-25,29,32,6v1,4-8,10,21,23-24_php1v1-2,6,8,10-11,13-16,18-21,23,26-27,29,2v1,5,10-11,16,19,21,24,2v29-3v1,3v3,7-9,12,14,18,20,4v1-4v2,4v4-4v5,4v7,10,13,19,21,23_col1v1-4,7,10,13,24,27-28,2v2,5-6,8,11,17,20,3v1,3-4,11,13,16-18,20,23-24,4v3,7,12,17_1th1v1,3,6,8,10,2v6,14-15,19,3v2,8,3v11-4v2,4v6,14-17,5v2,9,12,18,23,27-28_2th1v1-2,7-9,1v12-2v2,2v8,13-14,16,3v1,3-6,12,16,18_1ti1v1-2,12,14-16,2v3,5,7,3v13,4v6,10,5v11,21,6v3,13-15_2ti1v1-2,8-10,13,16,1v18-2v1,2v3,7-8,10,14,19,22,24,3v11-3v12,3v15,4v1,8,14,17-18,22_tit1v1,3-4,2v10,13,3v4,6_phm1v1,3,5-6,8-9,16,20,23,25_heb1v2,5,8-10,2v3,9,3v1,6,14,4v8,14,5v5,8,6v1,6,20,7v3,14,21-22,28,8v2,8-11,9v11,14,24,28,10v10,16,19,29-30,11v26,12v2,5-6,14,24,13v6,8,12,20-21_jas1v1,7,12,2v1,4v10,15,5v4,7-8,10-11,14-15_1pe1v1-3,7,11,13,19,25,2v3,5,21,3v12,16,18,21,4v1,11,14,5v1,3,10,14_2pe1v1-2,8,11,14,16-17,2v1,9,11,20,3v2,8-10,15,18_1jn1v1,3,7,2v1,20,22-24,3v8,23,4v2-4v3,4v9-4v10,4v14-4v15,5v1,5-7,9-13,20_2jn1v3,7,9_jud1v1,4-5,9,14,17,21,25_rev1v1-2,5,8-9,13,2v18,4v2,11,5v6,8,12-13,6v1,10,16,7v9-7v10,7v14,17,11v8,15,12v10-12v11,12v17,13v8,14v1,4,10,12-14,15v3-15v4,16v5,17v3,6,14,19v1,7,9-10,13,20v4,6,21v9-21v10,21v14,22-23,21v27-22v1,22v3,16,20-21');
	});

	// I've seen this "dots only" style in various places online, so we should make sure we can parse
	it("Dotted Style", () => {
		expect(parse('Luke 1.1').value).to.deep.equal([{
			book: 'LUK', chapter: 1, verse: 1
		}]);
		expect(parse('Luke.1.1').value).to.deep.equal([{
			book: 'LUK', chapter: 1, verse: 1
		}]);
		expect(parse('Luke.1.1-Luke.1.5').value).to.deep.equal([{
			is_range : true,
			start		 : { book: 'LUK', chapter: 1, verse: 1 },
			end			 : { book: 'LUK', chapter: 1, verse: 5 },
		}]);
		expect(parse('Luke.1.1-1.5').value).to.deep.equal([{
			is_range : true,
			start		 : { book: 'LUK', chapter: 1, verse: 1 },
			end			 : { book: 'LUK', chapter: 1, verse: 5 },
		}]);
		expect(parse('Luke.1').value).to.deep.equal([{
			is_range : true,
			start		 : { book: 'LUK', chapter: 1, verse:	1 },
			end			 : { book: 'LUK', chapter: 1, verse: 80 },
		}]);
		expect(parse('Luke.').value).to.deep.equal([{
			is_range : true,
			start		 : { book: 'LUK', chapter:	1, verse:	 1 },
			end			 : { book: 'LUK', chapter: 24, verse: 53 },
		}]);
		expect(parse('Lk.1.1').value).to.deep.equal([{
			book: 'LUK', chapter: 1, verse: 1
		}]);
	});

	describe("Book Abbreviation Styles", () => {
		it("Chicago Book Abbreviation", () => {
			// Old testemant: https://hbl.gcc.libguides.com/ld.php?content_id=13822328
			expect(parse('Am       1:1').value).to.deep.equal([ { book: 'AMO', chapter: 1, verse: 1 } ]);
			expect(parse('1 Chron. 1:1').value).to.deep.equal([ { book: '1CH', chapter: 1, verse: 1 } ]);
			expect(parse('1 Chr    1:1').value).to.deep.equal([ { book: '1CH', chapter: 1, verse: 1 } ]);
			expect(parse('2 Chron. 1:1').value).to.deep.equal([ { book: '2CH', chapter: 1, verse: 1 } ]);
			expect(parse('2 Chr    1:1').value).to.deep.equal([ { book: '2CH', chapter: 1, verse: 1 } ]);
			expect(parse('Dan.     1:1').value).to.deep.equal([ { book: 'DAN', chapter: 1, verse: 1 } ]);
			expect(parse('Dn       1:1').value).to.deep.equal([ { book: 'DAN', chapter: 1, verse: 1 } ]);
			expect(parse('Deut.    1:1').value).to.deep.equal([ { book: 'DEU', chapter: 1, verse: 1 } ]);
			expect(parse('Dt       1:1').value).to.deep.equal([ { book: 'DEU', chapter: 1, verse: 1 } ]);
			expect(parse('Eccles.  1:1').value).to.deep.equal([ { book: 'ECC', chapter: 1, verse: 1 } ]);
			expect(parse('Eccl     1:1').value).to.deep.equal([ { book: 'ECC', chapter: 1, verse: 1 } ]);
			expect(parse('Est      1:1').value).to.deep.equal([ { book: 'EST', chapter: 1, verse: 1 } ]);
			expect(parse('Exod.    1:1').value).to.deep.equal([ { book: 'EXO', chapter: 1, verse: 1 } ]);
			expect(parse('Ex       1:1').value).to.deep.equal([ { book: 'EXO', chapter: 1, verse: 1 } ]);
			expect(parse('Ezek.    1:1').value).to.deep.equal([ { book: 'EZK', chapter: 1, verse: 1 } ]);
			expect(parse('Ez       1:1').value).to.deep.equal([ { book: 'EZK', chapter: 1, verse: 1 } ]);
			expect(parse('Ezr      1:1').value).to.deep.equal([ { book: 'EZR', chapter: 1, verse: 1 } ]);
			expect(parse('Gen.     1:1').value).to.deep.equal([ { book: 'GEN', chapter: 1, verse: 1 } ]);
			expect(parse('Gn       1:1').value).to.deep.equal([ { book: 'GEN', chapter: 1, verse: 1 } ]);
			expect(parse('Hab.     1:1').value).to.deep.equal([ { book: 'HAB', chapter: 1, verse: 1 } ]);
			expect(parse('Hb       1:1').value).to.deep.equal([ { book: 'HAB', chapter: 1, verse: 1 } ]);
			expect(parse('Hag.     1:1').value).to.deep.equal([ { book: 'HAG', chapter: 1, verse: 1 } ]);
			expect(parse('Hg       1:1').value).to.deep.equal([ { book: 'HAG', chapter: 1, verse: 1 } ]);
			expect(parse('Hos      1:1').value).to.deep.equal([ { book: 'HOS', chapter: 1, verse: 1 } ]);
			expect(parse('Isa.     1:1').value).to.deep.equal([ { book: 'ISA', chapter: 1, verse: 1 } ]);
			expect(parse('Is       1:1').value).to.deep.equal([ { book: 'ISA', chapter: 1, verse: 1 } ]);
			expect(parse('Jer.     1:1').value).to.deep.equal([ { book: 'JER', chapter: 1, verse: 1 } ]);
			expect(parse('Jer      1:1').value).to.deep.equal([ { book: 'JER', chapter: 1, verse: 1 } ]);
			expect(parse('Job      1:1').value).to.deep.equal([ { book: 'JOB', chapter: 1, verse: 1 } ]);
			expect(parse('Jb       1:1').value).to.deep.equal([ { book: 'JOB', chapter: 1, verse: 1 } ]);
			expect(parse('Jl       1:1').value).to.deep.equal([ { book: 'JOL', chapter: 1, verse: 1 } ]);
			expect(parse('Jon.     1:1').value).to.deep.equal([ { book: 'JON', chapter: 1, verse: 1 } ]);
			expect(parse('Jon      1:1').value).to.deep.equal([ { book: 'JON', chapter: 1, verse: 1 } ]);
			expect(parse('Josh.    1:1').value).to.deep.equal([ { book: 'JOS', chapter: 1, verse: 1 } ]);
			expect(parse('Jo       1:1').value).to.deep.equal([ { book: 'JOS', chapter: 1, verse: 1 } ]);
			expect(parse('Judg.    1:1').value).to.deep.equal([ { book: 'JDG', chapter: 1, verse: 1 } ]);
			expect(parse('Jgs      1:1').value).to.deep.equal([ { book: 'JDG', chapter: 1, verse: 1 } ]);
			expect(parse('1 Kgs    1:1').value).to.deep.equal([ { book: '1KI', chapter: 1, verse: 1 } ]);
			expect(parse('2 Kgs    1:1').value).to.deep.equal([ { book: '2KI', chapter: 1, verse: 1 } ]);
			expect(parse('Lam.     1:1').value).to.deep.equal([ { book: 'LAM', chapter: 1, verse: 1 } ]);
			expect(parse('Lam      1:1').value).to.deep.equal([ { book: 'LAM', chapter: 1, verse: 1 } ]);
			expect(parse('Lev.     1:1').value).to.deep.equal([ { book: 'LEV', chapter: 1, verse: 1 } ]);
			expect(parse('Lv       1:1').value).to.deep.equal([ { book: 'LEV', chapter: 1, verse: 1 } ]);
			expect(parse('Mal.     1:1').value).to.deep.equal([ { book: 'MAL', chapter: 1, verse: 1 } ]);
			expect(parse('Mal      1:1').value).to.deep.equal([ { book: 'MAL', chapter: 1, verse: 1 } ]);
			expect(parse('Mic.     1:1').value).to.deep.equal([ { book: 'MIC', chapter: 1, verse: 1 } ]);
			expect(parse('Mi       1:1').value).to.deep.equal([ { book: 'MIC', chapter: 1, verse: 1 } ]);
			expect(parse('Nah.     1:1').value).to.deep.equal([ { book: 'NAM', chapter: 1, verse: 1 } ]);
			expect(parse('Na       1:1').value).to.deep.equal([ { book: 'NAM', chapter: 1, verse: 1 } ]);
			expect(parse('Neh.     1:1').value).to.deep.equal([ { book: 'NEH', chapter: 1, verse: 1 } ]);
			expect(parse('Neh      1:1').value).to.deep.equal([ { book: 'NEH', chapter: 1, verse: 1 } ]);
			expect(parse('Num.     1:1').value).to.deep.equal([ { book: 'NUM', chapter: 1, verse: 1 } ]);
			expect(parse('Nm       1:1').value).to.deep.equal([ { book: 'NUM', chapter: 1, verse: 1 } ]);
			expect(parse('Obad.    1:1').value).to.deep.equal([ { book: 'OBA', chapter: 1, verse: 1 } ]);
			expect(parse('Ob       1:1').value).to.deep.equal([ { book: 'OBA', chapter: 1, verse: 1 } ]);
			expect(parse('Prov.    1:1').value).to.deep.equal([ { book: 'PRO', chapter: 1, verse: 1 } ]);
			expect(parse('Prv      1:1').value).to.deep.equal([ { book: 'PRO', chapter: 1, verse: 1 } ]);
			expect(parse('Ps.      1:1').value).to.deep.equal([ { book: 'PSA', chapter: 1, verse: 1 } ]);
			expect(parse('Pss.     1:1').value).to.deep.equal([ { book: 'PSA', chapter: 1, verse: 1 } ]);
			expect(parse('Ps       1:1').value).to.deep.equal([ { book: 'PSA', chapter: 1, verse: 1 } ]);
			expect(parse('Pss      1:1').value).to.deep.equal([ { book: 'PSA', chapter: 1, verse: 1 } ]);
			expect(parse('Ru       1:1').value).to.deep.equal([ { book: 'RUT', chapter: 1, verse: 1 } ]);
			expect(parse('1 Sam.   1:1').value).to.deep.equal([ { book: '1SA', chapter: 1, verse: 1 } ]);
			expect(parse('1 Sm     1:1').value).to.deep.equal([ { book: '1SA', chapter: 1, verse: 1 } ]);
			expect(parse('2 Sam.   1:1').value).to.deep.equal([ { book: '2SA', chapter: 1, verse: 1 } ]);
			expect(parse('2 Sm     1:1').value).to.deep.equal([ { book: '2SA', chapter: 1, verse: 1 } ]);
			expect(parse('Song of Sol. 1:1').value).to.deep.equal([ { book: 'SNG', chapter: 1, verse: 1 } ]);
			expect(parse('Sg       1:1').value).to.deep.equal([ { book: 'SNG', chapter: 1, verse: 1 } ]);
			expect(parse('Zech.    1:1').value).to.deep.equal([ { book: 'ZEC', chapter: 1, verse: 1 } ]);
			expect(parse('Zec      1:1').value).to.deep.equal([ { book: 'ZEC', chapter: 1, verse: 1 } ]);
			expect(parse('Zeph.    1:1').value).to.deep.equal([ { book: 'ZEP', chapter: 1, verse: 1 } ]);
			expect(parse('Zep      1:1').value).to.deep.equal([ { book: 'ZEP', chapter: 1, verse: 1 } ]);


			// New testemant: http://hbl.gcc.libguides.com/ld.php?content_id=13822330
			expect(parse('Acts     1:1').value).to.deep.equal([ { book: 'ACT', chapter: 1, verse: 1 } ]);
			expect(parse('Apoc.    1:1').value).to.deep.equal([ { book: 'REV', chapter: 1, verse: 1 } ]);
			expect(parse('Col.     1:1').value).to.deep.equal([ { book: 'COL', chapter: 1, verse: 1 } ]);
			expect(parse('Col      1:1').value).to.deep.equal([ { book: 'COL', chapter: 1, verse: 1 } ]);
			expect(parse('1 Cor.   1:1').value).to.deep.equal([ { book: '1CO', chapter: 1, verse: 1 } ]);
			expect(parse('1 Cor    1:1').value).to.deep.equal([ { book: '1CO', chapter: 1, verse: 1 } ]);
			expect(parse('2 Cor.   1:1').value).to.deep.equal([ { book: '2CO', chapter: 1, verse: 1 } ]);
			expect(parse('2 Cor    1:1').value).to.deep.equal([ { book: '2CO', chapter: 1, verse: 1 } ]);
			expect(parse('Eph.     1:1').value).to.deep.equal([ { book: 'EPH', chapter: 1, verse: 1 } ]);
			expect(parse('Eph      1:1').value).to.deep.equal([ { book: 'EPH', chapter: 1, verse: 1 } ]);
			expect(parse('Gal.     1:1').value).to.deep.equal([ { book: 'GAL', chapter: 1, verse: 1 } ]);
			expect(parse('Gal      1:1').value).to.deep.equal([ { book: 'GAL', chapter: 1, verse: 1 } ]);
			expect(parse('Heb.     1:1').value).to.deep.equal([ { book: 'HEB', chapter: 1, verse: 1 } ]);
			expect(parse('Heb      1:1').value).to.deep.equal([ { book: 'HEB', chapter: 1, verse: 1 } ]);
			expect(parse('Jas      1:1').value).to.deep.equal([ { book: 'JAS', chapter: 1, verse: 1 } ]);
			expect(parse('Jn       1:1').value).to.deep.equal([ { book: 'JHN', chapter: 1, verse: 1 } ]);
			expect(parse('1 Jn     1:1').value).to.deep.equal([ { book: '1JN', chapter: 1, verse: 1 } ]);
			expect(parse('2 Jn     1:1').value).to.deep.equal([ { book: '2JN', chapter: 1, verse: 1 } ]);
			expect(parse('3 Jn     1:1').value).to.deep.equal([ { book: '3JN', chapter: 1, verse: 1 } ]);
			expect(parse('Lk       1:1').value).to.deep.equal([ { book: 'LUK', chapter: 1, verse: 1 } ]);
			expect(parse('Mk       1:1').value).to.deep.equal([ { book: 'MRK', chapter: 1, verse: 1 } ]);
			expect(parse('Mt       1:1').value).to.deep.equal([ { book: 'MAT', chapter: 1, verse: 1 } ]);
			expect(parse('1 Pet.   1:1').value).to.deep.equal([ { book: '1PE', chapter: 1, verse: 1 } ]);
			expect(parse('1 Pt     1:1').value).to.deep.equal([ { book: '1PE', chapter: 1, verse: 1 } ]);
			expect(parse('2 Pet.   1:1').value).to.deep.equal([ { book: '2PE', chapter: 1, verse: 1 } ]);
			expect(parse('2 Pt     1:1').value).to.deep.equal([ { book: '2PE', chapter: 1, verse: 1 } ]);
			expect(parse('Philem.  1:1').value).to.deep.equal([ { book: 'PHM', chapter: 1, verse: 1 } ]);
			expect(parse('Phlm.    1:1').value).to.deep.equal([ { book: 'PHM', chapter: 1, verse: 1 } ]);
			expect(parse('Phil.    1:1').value).to.deep.equal([ { book: 'PHP', chapter: 1, verse: 1 } ]);
			expect(parse('Phil     1:1').value).to.deep.equal([ { book: 'PHP', chapter: 1, verse: 1 } ]);
			expect(parse('Rev.     1:1').value).to.deep.equal([ { book: 'REV', chapter: 1, verse: 1 } ]);
			expect(parse('Rv       1:1').value).to.deep.equal([ { book: 'REV', chapter: 1, verse: 1 } ]);
			expect(parse('Rom.     1:1').value).to.deep.equal([ { book: 'ROM', chapter: 1, verse: 1 } ]);
			expect(parse('Rom      1:1').value).to.deep.equal([ { book: 'ROM', chapter: 1, verse: 1 } ]);
			expect(parse('1 Thess. 1:1').value).to.deep.equal([ { book: '1TH', chapter: 1, verse: 1 } ]);
			expect(parse('1 Thes   1:1').value).to.deep.equal([ { book: '1TH', chapter: 1, verse: 1 } ]);
			expect(parse('2 Thess. 1:1').value).to.deep.equal([ { book: '2TH', chapter: 1, verse: 1 } ]);
			expect(parse('2 Thes   1:1').value).to.deep.equal([ { book: '2TH', chapter: 1, verse: 1 } ]);
			expect(parse('1 Tim.   1:1').value).to.deep.equal([ { book: '1TI', chapter: 1, verse: 1 } ]);
			expect(parse('1 Tm     1:1').value).to.deep.equal([ { book: '1TI', chapter: 1, verse: 1 } ]);
			expect(parse('2 Tim.   1:1').value).to.deep.equal([ { book: '2TI', chapter: 1, verse: 1 } ]);
			expect(parse('2 Tm     1:1').value).to.deep.equal([ { book: '2TI', chapter: 1, verse: 1 } ]);
			expect(parse('Ti       1:1').value).to.deep.equal([ { book: 'TIT', chapter: 1, verse: 1 } ]);
		});

		it("Blue Letter Bible", () => {
			expect(parse('Gen').value[0].start).to.deep.equal({ book: 'GEN', chapter: 1, verse: 1 });
			expect(parse('Exo').value[0].start).to.deep.equal({ book: 'EXO', chapter: 1, verse: 1 });
			expect(parse('Lev').value[0].start).to.deep.equal({ book: 'LEV', chapter: 1, verse: 1 });
			expect(parse('Num').value[0].start).to.deep.equal({ book: 'NUM', chapter: 1, verse: 1 });
			expect(parse('Deu').value[0].start).to.deep.equal({ book: 'DEU', chapter: 1, verse: 1 });
			expect(parse('Jos').value[0].start).to.deep.equal({ book: 'JOS', chapter: 1, verse: 1 });
			expect(parse('Jdg').value[0].start).to.deep.equal({ book: 'JDG', chapter: 1, verse: 1 });
			expect(parse('Rth').value[0].start).to.deep.equal({ book: 'RUT', chapter: 1, verse: 1 });
			expect(parse('1Sa').value[0].start).to.deep.equal({ book: '1SA', chapter: 1, verse: 1 });
			expect(parse('2Sa').value[0].start).to.deep.equal({ book: '2SA', chapter: 1, verse: 1 });
			expect(parse('1Ki').value[0].start).to.deep.equal({ book: '1KI', chapter: 1, verse: 1 });
			expect(parse('2Ki').value[0].start).to.deep.equal({ book: '2KI', chapter: 1, verse: 1 });
			expect(parse('1Ch').value[0].start).to.deep.equal({ book: '1CH', chapter: 1, verse: 1 });
			expect(parse('2Ch').value[0].start).to.deep.equal({ book: '2CH', chapter: 1, verse: 1 });
			expect(parse('Ezr').value[0].start).to.deep.equal({ book: 'EZR', chapter: 1, verse: 1 });
			expect(parse('Neh').value[0].start).to.deep.equal({ book: 'NEH', chapter: 1, verse: 1 });
			expect(parse('Est').value[0].start).to.deep.equal({ book: 'EST', chapter: 1, verse: 1 });
			expect(parse('Job').value[0].start).to.deep.equal({ book: 'JOB', chapter: 1, verse: 1 });
			expect(parse('Psa').value[0].start).to.deep.equal({ book: 'PSA', chapter: 1, verse: 1 });
			expect(parse('Pro').value[0].start).to.deep.equal({ book: 'PRO', chapter: 1, verse: 1 });
			expect(parse('Ecc').value[0].start).to.deep.equal({ book: 'ECC', chapter: 1, verse: 1 });
			expect(parse('Sng').value[0].start).to.deep.equal({ book: 'SNG', chapter: 1, verse: 1 });
			expect(parse('Isa').value[0].start).to.deep.equal({ book: 'ISA', chapter: 1, verse: 1 });
			expect(parse('Jer').value[0].start).to.deep.equal({ book: 'JER', chapter: 1, verse: 1 });
			expect(parse('Eze').value[0].start).to.deep.equal({ book: 'EZK', chapter: 1, verse: 1 });
			expect(parse('Dan').value[0].start).to.deep.equal({ book: 'DAN', chapter: 1, verse: 1 });
			expect(parse('Hos').value[0].start).to.deep.equal({ book: 'HOS', chapter: 1, verse: 1 });
			expect(parse('Joe').value[0].start).to.deep.equal({ book: 'JOL', chapter: 1, verse: 1 });
			expect(parse('Amo').value[0].start).to.deep.equal({ book: 'AMO', chapter: 1, verse: 1 });
			expect(parse('Oba').value[0].start).to.deep.equal({ book: 'OBA', chapter: 1, verse: 1 });
			expect(parse('Jon').value[0].start).to.deep.equal({ book: 'JON', chapter: 1, verse: 1 });
			expect(parse('Mic').value[0].start).to.deep.equal({ book: 'MIC', chapter: 1, verse: 1 });
			expect(parse('Nah').value[0].start).to.deep.equal({ book: 'NAM', chapter: 1, verse: 1 });
			expect(parse('Hab').value[0].start).to.deep.equal({ book: 'HAB', chapter: 1, verse: 1 });
			expect(parse('Zep').value[0].start).to.deep.equal({ book: 'ZEP', chapter: 1, verse: 1 });
			expect(parse('Hag').value[0].start).to.deep.equal({ book: 'HAG', chapter: 1, verse: 1 });
			expect(parse('Zec').value[0].start).to.deep.equal({ book: 'ZEC', chapter: 1, verse: 1 });
			expect(parse('Mal').value[0].start).to.deep.equal({ book: 'MAL', chapter: 1, verse: 1 });

			expect(parse('Mat').value[0].start).to.deep.equal({ book: 'MAT', chapter: 1, verse: 1 });
			expect(parse('Mar').value[0].start).to.deep.equal({ book: 'MRK', chapter: 1, verse: 1 });
			expect(parse('Luk').value[0].start).to.deep.equal({ book: 'LUK', chapter: 1, verse: 1 });
			expect(parse('Jhn').value[0].start).to.deep.equal({ book: 'JHN', chapter: 1, verse: 1 });
			expect(parse('Act').value[0].start).to.deep.equal({ book: 'ACT', chapter: 1, verse: 1 });
			expect(parse('Rom').value[0].start).to.deep.equal({ book: 'ROM', chapter: 1, verse: 1 });
			expect(parse('1Co').value[0].start).to.deep.equal({ book: '1CO', chapter: 1, verse: 1 });
			expect(parse('2Co').value[0].start).to.deep.equal({ book: '2CO', chapter: 1, verse: 1 });
			expect(parse('Gal').value[0].start).to.deep.equal({ book: 'GAL', chapter: 1, verse: 1 });
			expect(parse('Eph').value[0].start).to.deep.equal({ book: 'EPH', chapter: 1, verse: 1 });
			expect(parse('Phl').value[0].start).to.deep.equal({ book: 'PHP', chapter: 1, verse: 1 });
			expect(parse('Col').value[0].start).to.deep.equal({ book: 'COL', chapter: 1, verse: 1 });
			expect(parse('1Th').value[0].start).to.deep.equal({ book: '1TH', chapter: 1, verse: 1 });
			expect(parse('2Th').value[0].start).to.deep.equal({ book: '2TH', chapter: 1, verse: 1 });
			expect(parse('1Ti').value[0].start).to.deep.equal({ book: '1TI', chapter: 1, verse: 1 });
			expect(parse('2Ti').value[0].start).to.deep.equal({ book: '2TI', chapter: 1, verse: 1 });
			expect(parse('Tit').value[0].start).to.deep.equal({ book: 'TIT', chapter: 1, verse: 1 });
			expect(parse('Phm').value[0].start).to.deep.equal({ book: 'PHM', chapter: 1, verse: 1 });
			expect(parse('Heb').value[0].start).to.deep.equal({ book: 'HEB', chapter: 1, verse: 1 });
			expect(parse('Jas').value[0].start).to.deep.equal({ book: 'JAS', chapter: 1, verse: 1 });
			expect(parse('1Pe').value[0].start).to.deep.equal({ book: '1PE', chapter: 1, verse: 1 });
			expect(parse('2Pe').value[0].start).to.deep.equal({ book: '2PE', chapter: 1, verse: 1 });
			expect(parse('1Jo').value[0].start).to.deep.equal({ book: '1JN', chapter: 1, verse: 1 });
			expect(parse('2Jo').value[0].start).to.deep.equal({ book: '2JN', chapter: 1, verse: 1 });
			expect(parse('3Jo').value[0].start).to.deep.equal({ book: '3JN', chapter: 1, verse: 1 });
			expect(parse('Jde').value[0].start).to.deep.equal({ book: 'JUD', chapter: 1, verse: 1 });
			expect(parse('Rev').value[0].start).to.deep.equal({ book: 'REV', chapter: 1, verse: 1 });
		});

		describe("OSIS References", () => {
			it('Book Ids', () => {
				// https://wiki.crosswire.org/OSIS_Book_Abbreviations

				expect(parse('Gen.1.1'   ).value).to.deep.equal([ { book: 'GEN', chapter: 1, verse: 1 } ]);
				expect(parse('Exod.1.1'  ).value).to.deep.equal([ { book: 'EXO', chapter: 1, verse: 1 } ]);
				expect(parse('Lev.1.1'   ).value).to.deep.equal([ { book: 'LEV', chapter: 1, verse: 1 } ]);
				expect(parse('Num.1.1'   ).value).to.deep.equal([ { book: 'NUM', chapter: 1, verse: 1 } ]);
				expect(parse('Deut.1.1'  ).value).to.deep.equal([ { book: 'DEU', chapter: 1, verse: 1 } ]);
				expect(parse('Josh.1.1'  ).value).to.deep.equal([ { book: 'JOS', chapter: 1, verse: 1 } ]);
				expect(parse('Judg.1.1'  ).value).to.deep.equal([ { book: 'JDG', chapter: 1, verse: 1 } ]);
				expect(parse('Ruth.1.1'  ).value).to.deep.equal([ { book: 'RUT', chapter: 1, verse: 1 } ]);
				expect(parse('1Sam.1.1'  ).value).to.deep.equal([ { book: '1SA', chapter: 1, verse: 1 } ]);
				expect(parse('2Sam.1.1'  ).value).to.deep.equal([ { book: '2SA', chapter: 1, verse: 1 } ]);
				expect(parse('1Kgs.1.1'  ).value).to.deep.equal([ { book: '1KI', chapter: 1, verse: 1 } ]);
				expect(parse('2Kgs.1.1'  ).value).to.deep.equal([ { book: '2KI', chapter: 1, verse: 1 } ]);
				expect(parse('1Chr.1.1'  ).value).to.deep.equal([ { book: '1CH', chapter: 1, verse: 1 } ]);
				expect(parse('2Chr.1.1'  ).value).to.deep.equal([ { book: '2CH', chapter: 1, verse: 1 } ]);
				expect(parse('Ezra.1.1'  ).value).to.deep.equal([ { book: 'EZR', chapter: 1, verse: 1 } ]);
				expect(parse('Neh.1.1'   ).value).to.deep.equal([ { book: 'NEH', chapter: 1, verse: 1 } ]);
				expect(parse('Esth.1.1'  ).value).to.deep.equal([ { book: 'EST', chapter: 1, verse: 1 } ]);
				expect(parse('Job.1.1'   ).value).to.deep.equal([ { book: 'JOB', chapter: 1, verse: 1 } ]);
				expect(parse('Ps.1.1'    ).value).to.deep.equal([ { book: 'PSA', chapter: 1, verse: 1 } ]);
				expect(parse('Prov.1.1'  ).value).to.deep.equal([ { book: 'PRO', chapter: 1, verse: 1 } ]);
				expect(parse('Eccl.1.1'  ).value).to.deep.equal([ { book: 'ECC', chapter: 1, verse: 1 } ]);
				expect(parse('Song.1.1'  ).value).to.deep.equal([ { book: 'SNG', chapter: 1, verse: 1 } ]);
				expect(parse('Isa.1.1'   ).value).to.deep.equal([ { book: 'ISA', chapter: 1, verse: 1 } ]);
				expect(parse('Jer.1.1'   ).value).to.deep.equal([ { book: 'JER', chapter: 1, verse: 1 } ]);
				expect(parse('Ezek.1.1'  ).value).to.deep.equal([ { book: 'EZK', chapter: 1, verse: 1 } ]);
				expect(parse('Dan.1.1'   ).value).to.deep.equal([ { book: 'DAN', chapter: 1, verse: 1 } ]);
				expect(parse('Hos.1.1'   ).value).to.deep.equal([ { book: 'HOS', chapter: 1, verse: 1 } ]);
				expect(parse('Joel.1.1'  ).value).to.deep.equal([ { book: 'JOL', chapter: 1, verse: 1 } ]);
				expect(parse('Amos.1.1'  ).value).to.deep.equal([ { book: 'AMO', chapter: 1, verse: 1 } ]);
				expect(parse('Obad.1.1'  ).value).to.deep.equal([ { book: 'OBA', chapter: 1, verse: 1 } ]);
				expect(parse('Jonah.1.1' ).value).to.deep.equal([ { book: 'JON', chapter: 1, verse: 1 } ]);
				expect(parse('Mic.1.1'   ).value).to.deep.equal([ { book: 'MIC', chapter: 1, verse: 1 } ]);
				expect(parse('Nah.1.1'   ).value).to.deep.equal([ { book: 'NAM', chapter: 1, verse: 1 } ]);
				expect(parse('Hab.1.1'   ).value).to.deep.equal([ { book: 'HAB', chapter: 1, verse: 1 } ]);
				expect(parse('Zeph.1.1'  ).value).to.deep.equal([ { book: 'ZEP', chapter: 1, verse: 1 } ]);
				expect(parse('Hag.1.1'   ).value).to.deep.equal([ { book: 'HAG', chapter: 1, verse: 1 } ]);
				expect(parse('Zech.1.1'  ).value).to.deep.equal([ { book: 'ZEC', chapter: 1, verse: 1 } ]);
				expect(parse('Mal.1.1'   ).value).to.deep.equal([ { book: 'MAL', chapter: 1, verse: 1 } ]);

				expect(parse('Matt.1.1'   ).value).to.deep.equal([ { book: 'MAT', chapter: 1, verse: 1 } ]);
				expect(parse('Mark.1.1'   ).value).to.deep.equal([ { book: 'MRK', chapter: 1, verse: 1 } ]);
				expect(parse('Luke.1.1'   ).value).to.deep.equal([ { book: 'LUK', chapter: 1, verse: 1 } ]);
				expect(parse('John.1.1'   ).value).to.deep.equal([ { book: 'JHN', chapter: 1, verse: 1 } ]);
				expect(parse('Acts.1.1'   ).value).to.deep.equal([ { book: 'ACT', chapter: 1, verse: 1 } ]);
				expect(parse('Rom.1.1'    ).value).to.deep.equal([ { book: 'ROM', chapter: 1, verse: 1 } ]);
				expect(parse('1Cor.1.1'   ).value).to.deep.equal([ { book: '1CO', chapter: 1, verse: 1 } ]);
				expect(parse('2Cor.1.1'   ).value).to.deep.equal([ { book: '2CO', chapter: 1, verse: 1 } ]);
				expect(parse('Gal.1.1'    ).value).to.deep.equal([ { book: 'GAL', chapter: 1, verse: 1 } ]);
				expect(parse('Eph.1.1'    ).value).to.deep.equal([ { book: 'EPH', chapter: 1, verse: 1 } ]);
				expect(parse('Phil.1.1'   ).value).to.deep.equal([ { book: 'PHP', chapter: 1, verse: 1 } ]);
				expect(parse('Col.1.1'    ).value).to.deep.equal([ { book: 'COL', chapter: 1, verse: 1 } ]);
				expect(parse('1Thess.1.1' ).value).to.deep.equal([ { book: '1TH', chapter: 1, verse: 1 } ]);
				expect(parse('2Thess.1.1' ).value).to.deep.equal([ { book: '2TH', chapter: 1, verse: 1 } ]);
				expect(parse('1Tim.1.1'   ).value).to.deep.equal([ { book: '1TI', chapter: 1, verse: 1 } ]);
				expect(parse('2Tim.1.1'   ).value).to.deep.equal([ { book: '2TI', chapter: 1, verse: 1 } ]);
				expect(parse('Titus.1.1'  ).value).to.deep.equal([ { book: 'TIT', chapter: 1, verse: 1 } ]);
				expect(parse('Phlm.1.1'   ).value).to.deep.equal([ { book: 'PHM', chapter: 1, verse: 1 } ]);
				expect(parse('Heb.1.1'    ).value).to.deep.equal([ { book: 'HEB', chapter: 1, verse: 1 } ]);

				expect(parse('Jas.1.1'    ).value).to.deep.equal([ { book: 'JAS', chapter: 1, verse: 1 } ]);
				expect(parse('1Pet.1.1'   ).value).to.deep.equal([ { book: '1PE', chapter: 1, verse: 1 } ]);
				expect(parse('2Pet.1.1'   ).value).to.deep.equal([ { book: '2PE', chapter: 1, verse: 1 } ]);
				expect(parse('1John.1.1'  ).value).to.deep.equal([ { book: '1JN', chapter: 1, verse: 1 } ]);
				expect(parse('2John.1.1'  ).value).to.deep.equal([ { book: '2JN', chapter: 1, verse: 1 } ]);
				expect(parse('3John.1.1'  ).value).to.deep.equal([ { book: '3JN', chapter: 1, verse: 1 } ]);
				expect(parse('Jude.1.1'   ).value).to.deep.equal([ { book: 'JUD', chapter: 1, verse: 1 } ]);
				expect(parse('Rev.1.1'    ).value).to.deep.equal([ { book: 'REV', chapter: 1, verse: 1 } ]);
			});

			it('Ranges', () => {
				expect(parse('Gen.3.2, Gen.3.3, Gen.3.4').value).to.deep.equal([
					{ book: 'GEN', chapter: 3, verse:  2 },
					{ book: 'GEN', chapter: 3, verse:  3 },
					{ book: 'GEN', chapter: 3, verse:  4 },
				]);

				expect(parse('Gen.3.2-Gen.3.4').value).to.deep.equal([
					{ is_range : true,
						start    : { book: 'GEN', chapter: 3, verse: 2 },
						end      : { book: 'GEN', chapter: 3, verse: 4 },
					},
				]);

				expect(parse('Gen.1.2-Gen.1.10, Exod.5.3-Exod.6.4').value).to.deep.equal([
					{ is_range : true,
						start    : { book: 'GEN', chapter: 1, verse:  2 },
						end      : { book: 'GEN', chapter: 1, verse: 10 },
					},
					{ is_range : true,
						start    : { book: 'EXO', chapter: 5, verse:  3 },
						end      : { book: 'EXO', chapter: 6, verse:  4 },
					},
				]);
			});
		});
	});
});
