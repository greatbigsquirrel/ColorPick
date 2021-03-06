var storage = chrome.storage.sync;
var pOptions=[];
var pAdvOptions=[];
var pSyncItems=[];
//pOptions["maxhistory"]={def:15,ind:0,name:'Max History per Window '};
//pOptions["dothumbs"]={def:false,ind:0,name:'Collect Thumbnails'};
//pOptions["hqthumbs"]={def:false,ind:1,name:'HQ Thumbnails (more ram) '};

//WARNIGN you have to set defaults two places for now...
pOptions["pickEveryTime"]={def:true,ind:0}; //default false in popup.html
pOptions["pixelatedPreview"]={def:true,ind:0};
pOptions["allowWebGl"]={def:false,ind:1};
pOptions["fishEye"]={def:5,ind:1,select:{1:'1 '+chrome.i18n.getMessage('off'),2:2,3:3,4:4,5:'5 '+chrome.i18n.getMessage('default'),6:6,7:7,8:8,9:'9 '+chrome.i18n.getMessage('full'),10:10,11:11,12:12,13:13,14:14,15:'15 '+chrome.i18n.getMessage('maxZoom')}};
pOptions["EnableRGB"]={def:true,ind:0,css:'display:inline-block;'};
pOptions["EnableHSL"]={def:true,ind:0,css:'display:inline-block;margin-left:38px;'};
pOptions["showPreviewInContentS"]={def:false,ind:0};
pOptions["ShowRGBHSL"]={def:false,ind:1};
pOptions["contSprevZoomd"]={def:true,ind:1};
pOptions["autocopyhex"]={def:false,ind:0};

//pAdvOptions["customCalibration"]={def:false,ind:0,name:'Enable the defunct calibration link above.'};
pAdvOptions["usePNG"]={def:true,ind:0};
pAdvOptions["useCSSValues"]={def:true,ind:0};
pAdvOptions["iconIsPreview"]={def:false,ind:0,img:'img/opt_badge.png'};
pAdvOptions["appleIcon"]={def:false,ind:0,img:'img/apple/icon16.png'};
pAdvOptions["iconIsBitmap"]={def:false,ind:0,img:'img/icon_pixel.png'};
pAdvOptions["resetIcon"]={def:true,ind:1,name:'Back to normal icon when done'};
pAdvOptions["bbackgroundColor"]={def:'#FFF',ind:0};
pAdvOptions["usePrevColorBG"]={def:false,ind:1};
pAdvOptions["showPreviousClr"]={def:true,ind:0};
pAdvOptions["borderValue"]={def:'1px solid grey',ind:0};
//pOptions["localflScalePix"]={def:false,ind:1,name:'Local Flash Scale Pixel? (read help)'};
pAdvOptions["showActualPickTarget"]={def:true,ind:0,name:'ShowActualPickTarget - Freeze Screen when Picking.  Also useful when ColorAccuracyOverPrecision checked, you see the image you\'re picking from instead of the webpage.'};
//pAdvOptions["clrAccuracyOverPrecision"]={def:false,ind:0,name:'ColorAccuracyOverPrecision - Never scale screenshot.  Improves color accuracy sometimes (rarely) but decreases location accuracy.  Negative: possibly inaccessible page locations.'};
//pAdvOptions["autoRedirectPickable"]={def:false,ind:0,name:'Automatically redirect to a pickable version when unavailable (no longer useful!)'};
//pAdvOptions["redirectSameWindow"]={def:false,ind:1,name:'Use the same window (warning: you may lose form data)'};
pOptions["hasAgreedToLicense"]={def:false,ind:0,css:'display:none;'};
pOptions["disableRewriting"]={def:false,ind:0};
pOptions["usageStatistics"]={def:false,ind:0};
pOptions["shareClors"]={def:false,ind:0};
pSyncItems["reg_chk"]={def:false};
pSyncItems["reg_hash"]={def:""};
pSyncItems["reg_name"]={def:""};
pSyncItems["reg_inapp"]={def:false};

function sendReloadPrefs(cb){
	var cbf=cb;
	if(typeof(cbf)!='function')cbf=function(){};
	chrome.runtime.sendMessage({reloadprefs: true}, function(response) {cbf()});
}

function chromeStorageSaveALocalStor(tosave){
	storage.set(tosave, function() {
		if(chrome.runtime.lastError && chrome.runtime.lastError.message.indexOf('MAX_WRITE_OPERATIONS_PER_HOUR') > 0){
			console.log(chrome.runtime.lastError);
		}
	});
}

function saveSyncItemsToChromeSyncStorage(){
	var tosave={};
	for(var i in pSyncItems){
		tosave[i]=localStorage[i];
	}
	chromeStorageSaveALocalStor(tosave);
}
function saveToChromeSyncStorage(){
	var tosave={};
	for(var i in pOptions){
		tosave[i]=localStorage[i];
	}
	for(var i in pAdvOptions){
		tosave[i]=localStorage[i];
	}
	for(var i in pSyncItems){				//temporary
		tosave[i]=localStorage[i];		//temporary
	}																//temporary
	chromeStorageSaveALocalStor(tosave);
	
	//prints potential pSyncItems items we may not yet save....
//	for(var i in localStorage){
//		if(pOptions[i] || pAdvOptions[i] || pSyncItems[i])continue;
//		var tosave={};
//		tosave[i]=localStorage[i];
//		console.log(tosave);
//		//storage.set(tosave, function() {});
//	}
	
}

function loadSettingsFromChromeSyncStorage(cbf){
	
	storage.get(null, function(obj) {
		for(i in obj){
			if(pOptions[i] || pAdvOptions[i] || pSyncItems[i]){
				localStorage[i] = obj[i];
			}
		}
		sendReloadPrefs();
		if(typeof(cbf)=='function')cbf();
	});
}

//document.addEventListener('DOMContentLoaded', function () {
//
//		//storage.clear(function(){});//clears all storage
//		//saveToChromeSyncStorage()
//		
//		//temporary...? except on background page.... see order of items for background page in manifest.json
//		loadSettingsFromChromeSyncStorage();
//		saveToChromeSyncStorage();
//
//});

