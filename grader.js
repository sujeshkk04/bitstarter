#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_URL_DEFAULT = "http://www.google.com";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1);
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var performCheck = function(htmlfile, checksfile) {
    var out = {};
    if( htmlfile != "") {
	assertFileExists(htmlfile);
	$ = cheerioHtmlFile(htmlfile);
	var checks = loadChecks(checksfile).sort();
	for(var ii in checks) {
	    var present = $(checks[ii]).length > 0;
	    out[checks[ii]] = present;
	}
    	var outJson = JSON.stringify(out, null, 4);
	console.log(outJson);
    }
}

var buildfn = function(checksfile) {
	var writefile = function(result, response) {
	    if(result instanceof Error) {
		console.error('Error: ' + util.format(response.message));
		process.exit(1);
	    } else {
		fs.writeFileSync("/tmp/tmp.html", result);
		performCheck("/tmp/tmp.html", checksfile);
	    }
	}
	return writefile;
}

var checkHtmlFile = function(htmlfile_url, checksfile) {
    	var writefile = buildfn(checksfile);
	rest.get(htmlfile_url).on('complete', writefile);
};

var clone = function(fn) {
    return fn.bind({});
};

if(require.main == module) {
    program
    .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
    .option('-u, --url <html_file_url>', 'URL to index.html', HTMLFILE_URL_DEFAULT)
    .parse(process.argv);
    checkHtmlFile(program.url, program.checks);
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
