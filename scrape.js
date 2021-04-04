const fetch = require('node-fetch');

var currentDate = new Date(Date.now());
var itemMenu = [];



function getMenuFromHTML(html) {


	var sections = html.match(/(?<=<div role='button'>)(.*?)(?=<)/g);
	var splHTML = html.split(new RegExp(sections.join('|'), 'g'));


	for(var s = 0; s < sections.length; s++){
		var items = splHTML[s + 1].match(/(?<=cbo_nn_itemHover'>)(.*?)(?=<)/g);
		itemMenu.push({ section: sections[s], items: items })
	}

	console.log(itemMenu);
}

function requestMenu(cookieID, menuID) {
	fetch("https://menu.bates.edu/NetNutrition/1/Menu/SelecUnitAndtMenu", {
	    "credentials": "include",
	    "headers": {
	    	"Host": "menu.bates.edu",
	        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:85.0) Gecko/20100101 Firefox/85.0",
	        "Accept": "*/*",
	        "Accept-Language": "en-US,en;q=0.5",
	        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
	        "X-Requested-With": "XMLHttpRequest",
	        "Origin": "https://menu.bates.edu",
	        "DNT": "1",
	        "Connection": "keep-alive",
	        "Referer": "https://menu.bates.edu/NetNutrition/1",
	        "Cookie": "ASP.NET_SessionId=" + cookieID + "; CBORD.netnutrition2=NNexternalID=1",
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
		// console.log(data.success);
		for(var p = 0; p < data.panels.length; p++){
			if(data.panels[p].id == "itemPanel"){
				let dataHTML = data.panels[p].html;
				getMenuFromHTML(dataHTML);
			}
		}

	});
}

function initRequest() {
	var cookie_asp_ID;

	fetch("https://menu.bates.edu/NetNutrition/1", {
		"credentials": "include",
	    "headers": {
	    	"Host": "menu.bates.edu",
	        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:85.0) Gecko/20100101 Firefox/85.0",
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
	        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:85.0) Gecko/20100101 Firefox/85.0",
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
	        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:85.0) Gecko/20100101 Firefox/85.0",
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
	    "body": "unit=-1&meal=-1&date=" + currentDate.toLocaleDateString().replace("\/g","%2F") +"&typeChange=DT",
	    "method": "POST",
	    "mode": "cors"
	})).then(response => response.json())
	.then(data => {
		var menuToUse = 0;

		for(var p = 0; p < data.panels.length; p++){
			if(data.panels[p].id == "navBarResults"){
				let dataHTML = data.panels[p].html;
				var menus = dataHTML.match(/(?<=menuListSelectUnitAndMenu\(1, )(.*?)(?=\))/g);

				let nowMin = currentDate.getMinutes()
				let nowHour = currentDate.getHours();
				let nowDay = currentDate.getDay();

				if(nowDay == 0 || nowDay == 6){
					if(nowHour < 10){
						menuToUse = menus[0];
					} else if(nowHour < 16 && nowMin < 30){
						menuToUse = menus[2];
					} else {
						menuToUse = menus[1];
					}
				} else {
					if(nowHour < 11){
						menuToUse = menus[0];
					} else if(nowHour < 16 && nowMin < 30){
						menuToUse = menus[1];
					} else {
						menuToUse = menus[2];
					}
				}
			}
		}
		// console.log("Menu: " + menuToUse);
		requestMenu(cookie_asp_ID, menuToUse);
	});

}

initRequest();
