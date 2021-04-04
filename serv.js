// content of index.js
const fetch = require('node-fetch');
const http = require('http');
const fs = require('fs');
const port = 3000;

const requestHandler = (request, response) => {
  console.log(request.url)


  if(request.url == "//data/menus.json" || request.url == "//data/menus.json"){
  	menuRequest().then(data => {
	  	response.end(JSON.stringify(data));
	  });
  } else if(request.url == "/" || request.url == "//"){
  	menuRequest().then(data => {
	  	response.writeHead(200, { 'Content-Type':'text/html'});
  		// let html = fs.readFileSync('./index.html', {root: __dirname });
  		let html = "";

  		for(var s = 0; s < data.length; s++){
  			html += "<h2>" + data[s].section + "</h2>";
  			html += "<ul>";
  			for(var i = 0; i < data[s].items.length; i++){
  				html += "<li>" + data[s].items[i] + "</li>";
  			}
  			html += "</ul>"; 
  		}

    	response.end(html);
	  });
  } else {
  	response.end("404 error");
  }
  

}

const server = http.createServer(requestHandler)

function getCurrentDate(){
	return new Date(Date.now());
}

function getMenuFromHTML(html) {

	var itemMenu = [];
	var sections = html.match(/(?<=<div role='button'>)(.*?)(?=<)/g);
	var splHTML = html.split(new RegExp(sections.join('|'), 'g'));

	for(var s = 0; s < sections.length; s++){
		var items = splHTML[s + 1].match(/(?<=cbo_nn_itemHover'>)(.*?)(?=<)/g);
		itemMenu.push({ section: sections[s], items: items })
	}

	return itemMenu;
}


async function menuRequest() {
	var cookie_asp_ID;

	var menuData = await fetch("https://menu.bates.edu/NetNutrition/1", {
		"credentials": "include",
	    "headers": {
	    	"Host": "menu.bates.edu",
	        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
	        "Accept-Language": "en-US,en;q=0.5",
	        "Upgrade-Insecure-Requests": "1",
	        "Pragma": "no-cache",
	        "Cache-Control": "no-cache",
	        "DNT": "1",
	        "Connection": "keep-alive"
	    },
	    "method": "GET",
	    "mode": "cors",
	    redirect: "manual"
	})
	.then(response => {
		cookie_asp_ID = response.headers.get('set-cookie').split(";")[0].split("=")[1];
		// console.log("cookie ASP_ID:  " + cookie_asp_ID);
		return true

	}).then(go => fetch("https://menu.bates.edu/NetNutrition/1", {
		"credentials": "include",
	    "headers": {
	    	"Host": "menu.bates.edu",
	        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
	        "Accept-Language": "en-US,en;q=0.5",
	        "Upgrade-Insecure-Requests": "1",
	        "Pragma": "no-cache",
	        "Cache-Control": "no-cache",
	        "DNT": "1",
	        "Connection": "keep-alive",
	        "Cookie": "ASP.NET_SessionId=" + cookie_asp_ID + "; CBORD.netnutrition2=NNexternalID=1"
	    },
		    "method": "GET",
		    "mode": "cors",
	    	redirect: "manual"
	})).then(response => {
		return true;

	}).then(go => fetch("https://menu.bates.edu/NetNutrition/1/Home/HandleNavBarSelection", {
		"credentials": "include",
	    "headers": {
	    	"Host": "menu.bates.edu",
	        "Accept": "*/*",
	        "Accept-Language": "en-US,en;q=0.5",
	        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
	        "X-Requested-With": "XMLHttpRequest",
	        "Content-Length": "13",
	        "Origin": "https://menu.bates.edu",
	        "DNT": "1",
	        "Connection": "keep-alive",
	        "Referer": "https://menu.bates.edu/NetNutrition/1",
	        "Cookie": "ASP.NET_SessionId=" + cookie_asp_ID + "; CBORD.netnutrition2=NNexternalID=1",
	        "Pragma": "no-cache",
	        "Cache-Control": "no-cache"
	    },
	    "referrer": "https://menu.bates.edu/NetNutrition/1",
	    "body": "unit=-1&meal=-1&date=" + getCurrentDate().toLocaleDateString('en-US', { timeZone: 'America/New_York' }).replace("\/g","%2F") +"&typeChange=DT",
	    "method": "POST",
	    "mode": "cors"
	})).then(response => response.json())
	.then(data => {
		var menuToUse = 0;

		for(var p = 0; p < data.panels.length; p++){
			if(data.panels[p].id == "navBarResults"){
				let dataHTML = data.panels[p].html;
				var menus = dataHTML.match(/(?<=menuListSelectUnitAndMenu\(1, )(.*?)(?=\))/g);

				let nowMin = getCurrentDate().getMinutes();
				let nowHour = getCurrentDate().getHours();
				let nowDay = getCurrentDate().getDay();
				// Also correct to EST
				let nowTime = ((24 + nowHour - 4) % 24) + (nowMin / 60);

				if(nowHour < 5){
					nowDay --;
				}

				console.log("Date: (" + nowDay + ") - " + nowHour + ":" + nowMin + "[" + nowTime + "]");

				if(nowDay == 0 || nowDay == 6){
					if(nowTime < 10){
						menuToUse = menus[0];
					} else if(nowTime < 16.5 ){
						menuToUse = menus[2];
					} else {
						menuToUse = menus[1];
					}
				} else {
					if(nowTime < 11){
						menuToUse = menus[0];
					} else if(nowTime < 16.5){
						menuToUse = menus[1];
					} else {
						menuToUse = menus[2];
					}
				}
			}
		}
		return menuToUse;

	}).then(menuID => fetch("https://menu.bates.edu/NetNutrition/1/Menu/SelecUnitAndtMenu", {
	    "credentials": "include",
	    "headers": {
	    	"Host": "menu.bates.edu",
	        "Accept": "*/*",
	        "Accept-Language": "en-US,en;q=0.5",
	        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
	        "X-Requested-With": "XMLHttpRequest",
	        "Origin": "https://menu.bates.edu",
	        "DNT": "1",
	        "Connection": "keep-alive",
	        "Referer": "https://menu.bates.edu/NetNutrition/1",
	        "Cookie": "ASP.NET_SessionId=" + cookie_asp_ID + "; CBORD.netnutrition2=NNexternalID=1",
	        "Pragma": "no-cache",
	        "Cache-Control": "no-cache"
	    },
	    "referrer": "https://menu.bates.edu/NetNutrition/1",
	    "body": "unitOid=1&menuOid=" + menuID,
	    "method": "POST",
	    "mode": "cors"
	})
	.then(response => response.json())
	.then(data => {
		for(var p = 0; p < data.panels.length; p++){
			if(data.panels[p].id == "itemPanel"){
				let dataHTML = data.panels[p].html;
				return getMenuFromHTML(dataHTML);
			}
		}

	}));

	return menuData;

}

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})