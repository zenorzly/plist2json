var fs = require('fs');
var plist2sprite = require('./parse.js');
var readDir = fs.readdirSync("./");

for (let i = 0; i < readDir.length; i++) {
	const dirFileName = readDir[i];
	if(dirFileName.indexOf('.plist')>=0){
		var file = fs.readFileSync("./"+dirFileName, "utf8");
		let result = plist2sprite.parse(file);
		fs.writeFileSync("./"+dirFileName.split('.')[0]+".json" , JSON.stringify(result,"","\t"));
		console.error('转换文件：'+dirFileName);
	}
}