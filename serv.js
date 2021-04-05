// content of index.js
const fetch = require('node-fetch');
const http = require('http');
const fs = require('fs');
const port = 3000;

var cookie_asp_ID;

// Returns date now
function getCurrentDate(){
	return new Date(Date.now());
}

// Holder for the day's current menu
// so it doesn't have to be loaded on each page request
var daily_menu = {
	obtainedDate: false,
	menus: []
};


// Handle a page request
const requestHandler = (request, response) => {
  console.log(request.url)


  // Return only the JSON
  if(request.url == "//data/menus.json" || request.url == "//data/menus.json"){
  	getCurrentMenu().then(data => {
	  	response.end(JSON.stringify(data));
	  });

  // otherwise return the menu in HTML
  } else if(request.url == "/" || request.url == "//"){
  	getCurrentMenu().then(data => {
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

// Determine the meal being served at this current time and return it.
function getCurrentMeal() {

	var menuToUse;

	let nowMin = getCurrentDate().getUTCMinutes();
	let nowHour = getCurrentDate().getUTCHours();
	let nowDay = getCurrentDate().getUTCDay();
	// Also correct to EST 
	let nowTime = ((24 + nowHour - 4) % 24) + (nowMin / 60);
	if(nowHour < 5){
		nowDay --;
	}

	console.log("Date: (" + nowDay + ") - " + nowHour + ":" + nowMin + "[" + nowTime + "]");

	// If only two meals are served a day
	if(daily_menu.menus.length == 2){
		if(nowTime < 16.5 ){
			menuToUse = daily_menu.menus[1];
		} else {
			menuToUse = daily_menu.menus[0];
		}
	// otherwise, probably a normal schedule
	} else {
		// If a weekend day
		if(nowDay == 0 || nowDay == 6){
			if(nowTime < 10){
				menuToUse = daily_menu.menus[0]; // Breakfast
			} else if(nowTime < 16 ){
				menuToUse = daily_menu.menus[2]; // Brunch
			} else {
				menuToUse = daily_menu.menus[1]; // Dinner
			}
		} else {
			if(nowTime < 11){
				menuToUse = daily_menu.menus[0]; // Breakfast
			} else if(nowTime < 16.5){
				menuToUse = daily_menu.menus[1]; // Lunch
			} else {
				menuToUse = daily_menu.menus[2]; // Dinner
			}
		}
	}

	return menuToUse;

}

// Determine if current day's menu is loaded, is so return it
async function getCurrentMenu(){
	var dateRightNow = getCurrentDate();

	// Check if the menu has been updated today
	var isSameDay =  ( daily_menu.obtainedDate 
					&& daily_menu.obtainedDate.getDate() === dateRightNow.getDate() 
     				&& daily_menu.obtainedDate.getMonth() === dateRightNow.getMonth()
                    && daily_menu.obtainedDate.getFullYear() === dateRightNow.getFullYear() );

	// If not, retrieve the menu through JSON
	if(!isSameDay){
		daily_menu.obtainedDate = dateRightNow;
		return dailyMenuRequest().then(() => getCurrentMeal());
	// otherwise good to go
	} else {
		return getCurrentMeal();
	}

}

// Take the awful mess of HTML we were given from the request and extract the menu values from it
function extractMenuFromHTML(html) {
	var itemMenu = [];
	// It seemed that all the section names had role="button"
	// Not the best but it works :/
	var sections = html.match(/(?<=<div role='button'>)(.*?)(?=<)/g);
	var splHTML = html.split(new RegExp(sections.join('|'), 'g'));

	for(var s = 0; s < sections.length; s++){
		// All menu items have cbo_nn_itemHover, use that to find them
		var items = splHTML[s + 1].match(/(?<=cbo_nn_itemHover'>)(.*?)(?=<)/g);
		itemMenu.push({ section: sections[s], items: items })
	}
	return itemMenu;
}

// Initiate request and get menu IDs
async function dailyMenuRequest() {

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
	.then(async data => {

		for(var p = 0; p < data.panels.length; p++){
			if(data.panels[p].id == "navBarResults"){
				let dataHTML = data.panels[p].html;
				// Search html and get array of menus
				var menus = dataHTML.match(/(?<=menuListSelectUnitAndMenu\(1, )(.*?)(?=\))/g);

				daily_menu.menus = [];
				for(var m = 0; m < menus.length; m++) {
					// Send request for each menu
					daily_menu.menus[m] = await mealMenuRequest( menus[m] );
				}
			}
		}
	});

	return Promise.all(daily_menu.menus);
}

// Use meal ID to request menu listing
async function mealMenuRequest(menuID){

	var menuData = await fetch("https://menu.bates.edu/NetNutrition/1/Menu/SelecUnitAndtMenu", {
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
				return extractMenuFromHTML(dataHTML);
			}
		}
	});

	return menuData;

}


const server = http.createServer(requestHandler)
server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})