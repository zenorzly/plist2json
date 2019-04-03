const parser = require("xml-parser");

function walk(node) {
	if (node.name === "dict") {
        let ret = {};
		for (var i = 0; i < node.children.length; i++) {
			const child = node.children[i];
			i++;
			const child2 = node.children[i];

			const childContentArr = child.content.split(".");
			if(childContentArr[1] ==="png" && child2.name === "dict"){
                ret[childContentArr[0]+"_png"]=walk(child2);
			}else
			if(child.content === "frames" ||child.content === "key"){
                return ret["frames"] = walk(child2);
			}else
			if (child.content === "offset") {
				let matchArr = child2.content.match(/{(-?\d+),(-?\d+)}/);
				ret["offX"]=parseInt(matchArr[1]);
				ret['offY']=parseInt(matchArr[2]);
			} else if (child.content === "sourceSize") {
				let matchArr = child2.content.match(/{(-?\d+),(-?\d+)}/);
				ret["sourceW"]=parseInt(matchArr[1]);
				ret['sourceH']=parseInt(matchArr[2]);
			} else if(child.content === "frame"){
				let p_s = getPositionAndSize(child2.content);
				ret["x"] = p_s.x;
				ret["y"] = p_s.y;
				ret["w"] = p_s.w;
				ret["h"] = p_s.h;
			}else ret[child.content] = walk(child2);
		}
		return ret;
	} else if (node.name === "plist") {
		return walk(node.children[0]);
	} else if (node.name === "string") {
		return getPositionAndSize(node.content);
	} else if (node.name === "integer") {
		return parseInt(node.content);
	} else if (node.name === "false") {
		return false;
	} else if (node.name === "true") {
		return true;
	} else {
		console.log("unknown", node);
	}
}

function parse(xml, fileName) {
	const doc = parser(
		xml.replace(
			'<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
			""
		)
	);
	const ret = rewriteMeta(walk(doc.root),fileName);
	return ret;
}

function rewriteMeta(doc,fileName) {
	let result = {}
    result.file = (fileName||"")+".png";
    result.frames = doc;
	return result;
}

function checkOffset(string) {
	let matchArr = string.match(/{(-?\d+),(-?\d+)}/);
	return true;
}

function getPositionAndSize(string) {
	let regexGlobal = /{(-?\d+),(-?\d+)}/g;
	let regex = /{(-?\d+),(-?\d+)}/;
	let matchArr = string.match(regexGlobal);
	let result = {};
	if (!matchArr) {
		return string;
	}
	if (matchArr.length === 2) {
		let position = matchArr[0].match(regex);
		let size = matchArr[1].match(regex);
		result.x = parseInt(position[1]);
		result.y = parseInt(position[2]);
		result.w = parseInt(size[1]);
		result.h = parseInt(size[2]);
	} else {
		let size = string.match(regex);
		result.w = parseInt(size[1]);
		result.h = parseInt(size[2]);
	}
	return result;
}
module.exports = {
	parse
};
