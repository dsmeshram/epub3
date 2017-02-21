var rootFile = "";
var chapters = [];
var courrentpage = 0;
var countis = 0;
var myVar;
var readerObj;
var readermode = true;
var bookMarkData;
var highlightwithnote;
var pages = [];

var counting = 1;
var counter = 3;
var font_size = 100;
var font_type = "";
var readerverticlemode = false;
var pages;

function pageItem(mpageno, pageframe) {
	this.pageno = mpageno;
	this.frame = pageframe;
}

function reader(reader, book) {
	this.readerObj = reader;
	this.bookObj = book;
}

function reader() {

}

function toc(tocid, tocplayOrder, tocnavLabel, toccontentsrc) {
	this.id = tocid;
	this.playOrder = tocplayOrder;
	this.navLabel = tocnavLabel;
	this.contentsrc = toccontentsrc;
}

epub3 = function(bookpath, callback) {

	var containerfile = 'container.xml';
	var containtfile = '';
	var containerfilepath = bookpath + "/META-INF/" + containerfile;
	var spine = [];
	var manifist = [];
	var mbook;

	function book(dc_title, dc_date, dc_auther, dc_identifier, dc_language) {
		this.booktittle = dc_title;
		this.bookauther = dc_auther;
		this.bookidentifier = dc_identifier;
		this.bookcreateddate = dc_date;
		this.booklanguage = dc_language;
	}

	if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp = new XMLHttpRequest();
	} else {// code for IE6, IE5
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	var pathfirst;
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			if (xmlhttp.responseURL.includes('container.xml')) {
				var xmlDoc = new DOMParser().parseFromString(
						xmlhttp.responseText, 'text/xml');
				var rootfiletag = xmlDoc.getElementsByTagName("rootfile");

				for (i = 0; i < rootfiletag.length; i++) {
					rootfile = rootfiletag[i].getAttribute('full-path');
					containtfile = bookpath + "/" + rootfile;
				}
				pathfirst = rootfile.split("/");
				console.log(rootfile);
				
				xmlhttp.open("GET", containtfile, true);

				xmlhttp.send(null);

			} else if (xmlhttp.responseURL.includes('.opf')) {
				var xmlDoc = new DOMParser().parseFromString(
						xmlhttp.responseText, 'text/xml');
				var spines = xmlDoc.getElementsByTagName("spine");
				var packageele = xmlDoc.getElementsByTagName("package");
				var manifest = xmlDoc.getElementsByTagName("manifest");
				var toc;
				// parse bookinfo
				var metadata = xmlDoc.getElementsByTagName("metadata");
				var dc_title = '', dc_date = '', dc_language = '', dc_auther = '', dc_identifier = '';

				// toc for epub 3 parse xhtml and for older version parse ncx
				var ncxpath;
				if (spines[0].hasAttribute('toc')) {
					ncxpath = spines[0].getAttribute('toc');
				}

				for (i = 0; i < metadata[0].childElementCount; i++) {
					var item = metadata[0].children[i];
					if (metadata[0].children[i].tagName == "dc:title") {
						dc_title = metadata[0].children[i].textContent;
					}
					if (metadata[0].children[i].tagName == "dc:date") {
						dc_date = metadata[0].children[i].textContent;
					}
					if (metadata[0].children[i].tagName == "dc:language") {
						dc_language = metadata[0].children[i].textContent;
					}
					if (metadata[0].children[i].tagName == "toc") {
						toc = metadata[0].children[i].getAttribute('href');
					}

				}

				mbook = new book(dc_title, dc_date, dc_auther, dc_identifier,
						dc_language);
				var vr = packageele[0].getAttribute('version');
				var tocfilepath;
				if (vr == "3.0") {
					tocfilepath = "OPS/TOC.xhtml";
				} else {
					tocfilepath = "OPS/toc.ncx";
				}
				loadTOC(bookpath + "/" + tocfilepath, mbook);

				readerObj.bookObj = mbook;
				callback.call(readerObj);

				for (i = 0; i < spines[0].childElementCount; i++) {
					var itemref = spines[0].children[i];
					if (itemref.getAttribute('linear') != "no") {
						spine[i] = itemref.getAttribute('idref');
					}
				}
				var count = 0;
				for (i = 0; i < manifest[0].childElementCount; i++) {
					var itemref = manifest[0].children[i];
					for (j = 0; j < spine.length; j++) {
						if (itemref.getAttribute('id') == spine[j]) {

							chapters[count] = bookpath + "/" + pathfirst[0]
									+ "/" + itemref.getAttribute('href');
							count = count + 1;
						}
					}
				}
				addPagesnation();
			}
		}
	};
	xmlhttp.open("GET", containerfilepath, true);
	xmlhttp.send(null);

	

	readerObj = new reader(new reader(), mbook);
	return readerObj;

}

function loadTOC(path, object) {
	var xobj = new XMLHttpRequest();
	var returnarray = new Array();
	xobj.overrideMimeType("application/json");
	xobj.open('GET', path, true);
	xobj.onreadystatechange = function() {
		if (xobj.readyState == 4 && xobj.status == "200") {
			var xmlDoc = new DOMParser().parseFromString(xobj.responseText,
					'text/xml');

			var navmap = xmlDoc.getElementsByTagName("navMap");
			for (var count = 0; count < navmap[0].childElementCount; count++) {
				if (navmap[0].children[count].tagName == "navPoint") {
					var tocitem = parsenavPoint(navmap[0].children[count]);
					toclist.push(tocitem);
				}
			}
		}
	};
	xobj.send(null);
}
var toclist = [];

function parsenavPoint(navpointnode) {

	var id = "";
	var tocplayOrder = "";
	var label = "";
	var contentsrc = "";
	if (navpointnode.hasAttribute('id')) {
		id = navpointnode.getAttribute('id');
	}
	if (navpointnode.hasAttribute('playOrder')) {
		tocplayOrder = navpointnode.getAttribute('playOrder');
	}
	for (var i = 0; i < navpointnode.children.length; i++) {
		if (navpointnode.children[i].tagName == "navLabel") {
			{
				label = navpointnode.children[i].textContent;
			}
		}
		if (navpointnode.children[i].tagName == "content") {
			{
				contentsrc = navpointnode.children[i].getAttribute('src');
			}
		}
	}

	var tocitem = new toc(id, tocplayOrder, label, contentsrc);

	return tocitem;
}

function addWrapper(page) {
	var div = document.createElement("div");
	div.id = "wrap";
	var styleis = "padding-bottom : 0px;padding-top : 0px;padding-left : 50px;background:#808080;	padding-right : 50px;position: relative; margin-left: 100px;";

	if (readerverticlemode) {
		styleis = "padding-bottom : 0px;padding-top : 0px;	padding-right : 50px;position: relative;";

	}

	div.setAttribute('style', styleis);
	page.contentWindow.document
	// Move the body's children into this wrapper
	while (page.contentWindow.document.body.firstChild) {
		div.appendChild(page.contentWindow.document.body.firstChild);
	}
	page.contentWindow.document.body.appendChild(div);
}

var indexchapter = 0;
function addPagesnation() {
	if (readerverticlemode) {
		verticleView();
	} else {
		horizontal(indexchapter);
	}
}

var scrollwidth;
var scrollheight;
var totalpages;
horizontal = function(index, nextorprivious) {
	if (document.getElementById('page') == undefined) {

		var divparent = document.createElement('div');
		divparent.setAttribute("scrolling", "no");
		divparent.setAttribute("id", "view");
		var page = document.createElement('iframe');
		page.setAttribute("id", "page");
		var chaptername = chapters[index];
		var chapter = chaptername.substring(chaptername.lastIndexOf('/') + 1,
				chaptername.length);
		page.setAttribute("src", chaptername);
		page.setAttribute("scrolling", "no");
		page.setAttribute("style", "margin:5px 0px 5px 0px;border:none");
		divparent.appendChild(page);
		document.getElementById("epubviewer").appendChild(divparent);

		page.onload = function() {
			scrollheight = document.getElementById("epubviewer").offsetHeight;
			scrollwidth = document.getElementById("epubviewer").offsetWidth;
			page.style.height = '100%';
			page.style.width = scrollwidth + 'px';
			addjs(page);
			if (nextorprivious == "previous") {
				var iframes = document.getElementsByTagName('iframe');
				var doc = iframes[0].contentWindow;
				doc.scrollBy(scrollwidth * totalpages, 0);
			}

		};
	} else {

		var page = document.getElementById('page');
		page.setAttribute("id", "page");
		var chaptername = chapters[index];
		var chapter = chaptername.substring(chaptername.lastIndexOf('/') + 1,
				chaptername.length);
		page.setAttribute("src", chaptername);

		page.onload = function() {
			scrollheight = document.getElementById("epubviewer").offsetHeight;
			scrollwidth = document.getElementById("epubviewer").offsetWidth;
			page.style.height = '100%';
			page.style.width = scrollwidth + 'px';
			addWrapper(page);
			addjs(page);
			if (nextorprivious == "previous") {
				var iframes = document.getElementsByTagName('iframe');
				var doc = iframes[0].contentWindow;
				doc.scrollBy(scrollwidth * totalpages, 0);
			}
		};
	}

}

function addWrapper(page) {
	var div = document.createElement("div");
	div.id = "wrap";
	var styleis = "margin-left: 40px;margin-right: 40px;";
	div.setAttribute('style', styleis);
	page.contentWindow.document
	// Move the body's children into this wrapper
	while (page.contentWindow.document.body.firstChild) {
		div.appendChild(page.contentWindow.document.body.firstChild);
	}

	page.contentWindow.document.body.appendChild(div);
}

var twopage = true;
togglepages = function() {
	if (!twopage) {
		var width = document.getElementById("epubviewer").offsetWidth / 2;
		addmode(width, scrollheight - 20);
		twopage = true;
	} else {
		var width = document.getElementById("epubviewer").offsetWidth;
		addmode(width, scrollheight - 20);
		twopage = false;
	}

}

verticlemode =  function()
{
	addmode(0,0);

}

pre = function() {
	scrollwidth = document.getElementById("epubviewer").offsetWidth;
	var iframes = document.getElementsByTagName('iframe');
	var doc = iframes[0].contentWindow;
	if (doc.scrollX == 0) {
		loadprech()
	} else
	{
		doc.scrollBy(-scrollwidth, 0);
	}

}

next = function() {
	scrollwidth = document.getElementById("epubviewer").offsetWidth;
	if (scrollwidth == scrollwidth * totalpages) {
		loadnextch()
	} else {
		totalpages = totalpages - 1;
		var iframes = document.getElementsByTagName('iframe');
		var doc = iframes[0].contentWindow;
		doc.scrollBy(scrollwidth, 0);
	}
}

loadnextch = function() {
	if (indexchapter <= chapters.length) {

		indexchapter = indexchapter + 1;
		horizontal(indexchapter, "next");
	}
}

loadprech = function() {
	if (indexchapter > 0) {
		indexchapter = indexchapter - 1;
		horizontal(indexchapter, "previous");
	}

}
var myVar;
var mySheet;
addjs = function(iframe) {
	var win = iframe.contentWindow;
	var doc = iframe.contentWindow.document;
	mySheet = doc.styleSheets[0];
	var width = document.getElementById("epubviewer").offsetWidth / 2;

	if(!twopage)
	{
		width = document.getElementById("epubviewer").offsetWidth;
	}
	
	addmode(width, scrollheight - 10);

}

function addmode(width, height) {
	var iframes = document.getElementsByTagName('iframe');
	var doc = iframes[0].contentWindow;
	if (mySheet.addRule) {
		mySheet
				.addRule(
						'html',
						'height: '
								+ height
								+ 'px; -webkit-column-gap: 0px;-moz-column-fill: auto; column-fill: auto; -webkit-column-width: '
								+ width
								+ 'px;-moz-column-width: '+width+'px; -epub-writing-mode:horizontal-tb;-webkit-wrting-mode:horizontal-tb; -webkit-column-rule: 0px outset #f1f1f1; -moz-column-rule: 0px outset #f1f1f1; column-rule: 0px outset #f1f1f1;');
	} else {
		ruleIndex = mySheet.cssRules.length;
		mySheet
				.insertRule(
						'html',
						'height: '
								+ height
								+ 'px; -webkit-column-gap: 0px;-moz-column-fill: auto;margin:0px; column-fill: auto; -webkit-column-width: '
								+ width
								+ 'px;-moz-column-width: '+width+'px; -epub-writing-mode:horizontal-tb;-webkit-wrting-mode:horizontal-tb; -webkit-column-rule: 0px outset #f1f1f1; -moz-column-rule: 0px outset #f1f1f1; column-rule: 0px outset #f1f1f1;');
	}
	var pagewidth = doc.document.body.scrollWidth;
	totalpages = Math.round(pagewidth
			/ document.getElementById("epubviewer").offsetWidth);
}

function getDocHeight(doc) {
	doc = doc || document;
	// stackoverflow.com/questions/1145850/
	var body = doc.body, html = doc.documentElement;
	var height = body.scrollHeight;
	return height;
}

function getDocWidth(doc) {
	doc = doc || document;
	var body = doc.body, html = doc.documentElement;
	var width = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth,
			html.scrollWidth, html.offsetWidth);
	return width;
}

function iResize(id) {
	var wrap = id.contentWindow.document.getElementById('wrap');
	var height = wrap.offsetHeight;

	var width = getDocWidth(id.contentWindow.document);
	if (height > window.outerHeight) {
		id.style.height = (height + 50) + 'px';

	} else {
		id.style.height = '101%';

	}

	if (width > window.outerWidth) {
		id.style.width = width + 'px';
	} else {
		id.style.width = '80%';
	}

	id.setAttribute("onscroll", event);

	return id.style.height;
}
