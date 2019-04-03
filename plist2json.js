
let defalutResJson = "{\n" +
	"\t\"groups\": [\n" +
	"\t\t{\n" +
	"\t\t\t\"keys\": \"\",\n" +
	"\t\t\t\"name\": \"preload\"\n" +
	"\t\t}\n" +
	"\t],\n" +
	"\t\"resources\": [\n" +
	"\t]\n" +
	"}";
var fs = require('fs');
// var plist2sprite = require('./parse.js');
var readDir = fs.readdirSync("./");
const parser = require("xml-parser");
const defaultResDir = "assets/ui/";//在工程中res的相对位置，将会在 default.res.json 中resources每个项的url
const addGroupName = "preload";//如果没有这个名字的组，会创建一个group

let group_keys="",groupKeyCount = 0,resourceMap = {};
//*********把plist文件洗成egret json
for (let i = 0; i < readDir.length; i++) {
	const dirFileName = readDir[i];
	let fileNameList=[];
	if(dirFileName.indexOf('.plist')>=0){
		var file = fs.readFileSync("./"+dirFileName, "utf8");
		let dirName = dirFileName.split(".")[0];
		let result = parse(file, dirName, fileNameList);
		fs.writeFileSync("./"+dirName+".json" , JSON.stringify(result,"","\t"));
		console.error('转换文件：'+dirFileName);
		if(groupKeyCount!==0)group_keys +=",";
		group_keys = group_keys + dirName + "_json";
		group_keys +=",";
		group_keys = group_keys + dirName + "_png";
		groupKeyCount+=2;
		let locSubKeys = "";
		for(let y=0;y<fileNameList.length;y++)locSubKeys = fileNameList[y]+((fileNameList.length-1)===y?"":",");
		resourceMap[dirName] = {url:defaultResDir+dirName+".json",type:"sheet",name:dirName+"_json",subkeys:locSubKeys}
		resourceMap[dirName+"|png"] = {url:defaultResDir+dirName+".png",type:"image",name:dirName+"_png"}
	}
}
//**********把文件名添加到default.res.json中的group
let drj = defalutResJson;
 fs.exists("./default.res.json",(exists)=>{
	 if(exists)drj = fs.readFileSync("./default.res.json", "utf8");
	 else console.error('default.res.json文件不存在, 创建');
	 let drjJson = JSON.parse(drj);
	 let drjGroups = drjJson.groups;
	 for (let t = 0; t < drjGroups.length; t++) {
		 const drjGroup = drjGroups[t];
		 if(drjGroup.name === addGroupName){
			 drjGroup.keys = drjGroup.keys.trim();
			 if(drjGroup.keys.length > 0)drjGroup.keys +=",";
			 drjGroup.keys = drjGroup.keys + group_keys;
			 break;
		 }
		 if(t===(drjGroups.length-1))drjGroups.push({keys:group_keys,name:addGroupName});
	 }
//******把文件注册到default.res.json中的resources
	 for(let kk in resourceMap){
		 drjJson.resources.push(resourceMap[kk]);
	 }
	 fs.writeFileSync("./default.res.json", JSON.stringify(drjJson,"","\t"));
 });


//------------------------------------------------------------------fun---------------------------------------------//
function walk(node, fileNameList) {
	if (node.name === "dict") {
		let ret = {};
		for (var i = 0; i < node.children.length; i++) {
			const child = node.children[i];
			i++;
			const child2 = node.children[i];

			const childContentArr = child.content.split(".");
			if(childContentArr[1] ==="png" && child2.name === "dict"){
				let pngName = childContentArr[0]+"_png";
				ret[pngName]=walk(child2);
				if( fileNameList)fileNameList.push(pngName);
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

function parse(xml, fileName, fileNameList) {
	const doc = parser(
		xml.replace(
			'<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
			""
		)
	);

	const ret = rewriteMeta(walk(doc.root, fileNameList),fileName,);
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
