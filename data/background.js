function RGBtoHex(R,G,B) {return toHex(R)+toHex(G)+toHex(B)}
function toHex(N) {//http://www.javascripter.net/faq/rgbtohex.htm
 if (N==null) return "00";
 N=parseInt(N); if (N==0 || isNaN(N)) return "00";
 N=Math.max(0,N); N=Math.min(N,255); N=Math.round(N);
 return "0123456789ABCDEF".charAt((N-N%16)/16)
      + "0123456789ABCDEF".charAt(N%16);
}
function rgb2hsl(r, g, b){//http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      v: Math.round(l * 100)
    };
}

var iconPath = '';

function fromPrefs(){

	//remove defunct options
	localStorage.removeItem("autoRedirectPickable");
	localStorage.removeItem("redirectSameWindow");
	localStorage.removeItem("customCalibration");
	localStorage.removeItem("cpScaleOffset");
	localStorage.removeItem("flashScalePix");
	localStorage.removeItem("postAutoOptin");

	//future additions -
	//storage.remove(['','',''], function(){})

	for(var i in pOptions){
		if(typeof(pOptions[i].def)=='boolean')
			window[i] = ((localStorage[i]=='true')?true:((localStorage[i]=='false')?false:pOptions[i].def));
		else
			window[i] = ((localStorage[i])?localStorage[i]:pOptions[i].def);
	}

	for(var i in pAdvOptions){
		if(typeof(pAdvOptions[i].def)=='boolean')
			window[i] = ((localStorage[i]=='true')?true:((localStorage[i]=='false')?false:pAdvOptions[i].def));
		else
			window[i] = ((localStorage[i])?localStorage[i]:pAdvOptions[i].def);
	}

	if(typeof(localStorage["usageStatistics"])=='undefined'){
		//if(!navigator.doNotTrack) localStorage["usageStatistics"]=true;
		//else
		localStorage["usageStatistics"]=false;
	}

	if(localStorage["usageStatistics"]=='true' && !navigator.doNotTrack){
		localStorage.removeItem("feedbackOptOut");
	}else{
		localStorage.feedbackOptOut = "true";
	}
	
	defaultIcon();
	feedbackParticipationOversight();
}

function defaultIcon(){
	var iconPath='img/';
	if(appleIcon)iconPath+='apple/';
	if(resetIcon)chrome.browserAction.setIcon({path:chrome.extension.getURL(iconPath+'icon19.png')});//update icon (to be configurable)
}

var d=new Date();

function getWeek(d){
	var onejan = new Date(d.getFullYear(),0,1);
	return Math.ceil((((d - onejan) / 86400000) + onejan.getDay()+1)/7);
}

function feedbackParticipationOversight(){
	if(localStorage["hasAgreedToLicense"]=='true' && localStorage.feedbackOptOut!='true' && localStorage["usageStatistics"]=='true'){
		var d=new Date();
		if( localStorage["participation"]!=d.getFullYear()+'_'+getWeek(d) ){
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange=function(){if(xhr.readyState == 4){
				if(xhr.status==200){
					if(xhr.responseText == 'SOK'){
						var d=new Date();
						localStorage["participation"]=d.getFullYear()+'_'+getWeek(d)
					}
				}
			}};
			xhr.open('GET', "http://vidzbigger.com/feedback.php?app=1", true);
			xhr.send();
		}
	}
}

//on change visible tab, is cp active on this tab, if so, resnapshot..?
//888888888888888888888888888888888888888888888888888888888888888888888

//globals
var cvs,ctx;
var x,y,tabid=0,winid=0; //current pixel
var curentHex=0,lastHex='FFF',lastLastHex='FFF';
var lastPreviewURI=''; //potentially needs to be cleaned up an not "jump" across sites, if exit triggered from content script the message does not reach us here... (they do now)
//var fullScreenImageData=[];//potentially huge array of raw image data
var imageDataIsRendered=false;
var clrgb={r:0,g:0,b:0}
var clhsv={h:0,s:0,v:0}
var isCurrentEnableReady=false;
var wid, hei;

function attemptReinitPicker(tabid){
	var tid=tabid;
	chrome.tabs.get(tabid, function(tab) {
		if(tab.status=='complete'){
			chrome.runtime.sendMessage({greeting: "re_init_picker"}, function(response) {
				//console.log('enabled!');
			});
		}else{
			setTimeout(function(){attemptReinitPicker(tid)},200);
		}
	})
	
}

function getCurrentClrData(){
	var dobj={hex:curentHex}
	if(ShowRGBHSL){
		if(EnableRGB)dobj.rgb={r:clrgb.r,g:clrgb.g,b:clrgb.b}
		if(EnableHSL)dobj.hsv={h:clhsv.h,s:clhsv.s,v:clhsv.v}
	}
	return dobj;
}

chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse) {
		if(sender.tab && sender.tab.id >= 0){
			tabid=sender.tab.id;
			winid=sender.tab.windowId;
		}
		if(request.tabi){
			tabid=request.tabi;
		}
		if(request.setPreview){
			 sendResponse({});//not handled by this listener
		}else if (request.newImage){
			wid=request._x;
			hei=request._y;
			var cbf=function(dataUrl){
				imageDataIsRendered=false;
				cvs = mcan;
//				pim.onload = function() {
//					cvs.width = pim.width;
//					cvs.height = pim.height;
//					ctx = cvs.getContext("2d");
//					ctx.clearRect(0,0,pim.width,pim.height);
//					handleRendering();
//				};
				pim.src=dataUrl;
				cvs.width = wid;
				cvs.height = hei;
				ctx = cvs.getContext("2d");
				ctx.clearRect(0,0,wid,hei);
			}
			
			if(usePNG)chrome.tabs.captureVisibleTab(winid, {format:'png'}, cbf);
			else chrome.tabs.captureVisibleTab(winid, {format:'jpeg',quality:100}, cbf);
			sendResponse({});
		}else if (request.movePixel){
			x+=(request._x);//or otherwise use the current scale
			y+=(request._y);
			handleRendering()
			dobj=getCurrentClrData();
			dobj.movedPixel=true;
			dobj.msg='Press Enter to Pick Color';
			chrome.tabs.sendMessage(tabid,dobj,function(r){});
			sendResponse({});
		}else if (request.getPixel){
			x=request._x;
			y=request._y;
			handleRendering()
			sendResponse(getCurrentClrData());
		}else if (request.setColor){
			if(showPreviousClr){lastLastHex=lastHex;lastHex=curentHex;}
			else lastHex='none';
			//user clicked, optionally store color to database...
			if(shareClors){
				var xhr = new XMLHttpRequest();
				xhr.onreadystatechange=function(){if(xhr.readyState == 4){ }};
				xhr.open('GET', 'http://vidzbigger.com/vcolors.php?colorhex='+curentHex, true);
				xhr.send();
			}
			//store colors
			localStorage['colorPickHistory']+="#"+curentHex;
			chrome.runtime.sendMessage({historypush: true}, function(response) {
					//console.log('disabled!');
			});		
			sendResponse({docopy:autocopyhex});
		}else if(request.reportingIn){
			isCurrentEnableReady=true;
			 
		}else if (request.enableColorPicker){
			
			chrome.tabs.getSelected(null, function(tab) {
				var tabId=tab.id;
				if(request.tabi>0 && request.tabi!=tabId){
					sendResponse({});//in the case of a popup, the currently selected "tab" is not the one we need to initialize
					return;
				}
				
				isCurrentEnableReady=false;
				var tabURL=tab.url;
				
				
			  chrome.tabs.sendMessage(tab.id, {enableColorPicker:true,borders:borderValue}, function(response) {
			  });
			  
			  if(tabURL.indexOf('https://chrome.google.com/extensions/')==0 ||tabURL.indexOf('chrome')==0 ||tabURL.indexOf('about')==0 ){
						//console.log( 'Unsupported page type :/');
						chrome.runtime.sendMessage({greeting: "error_picker",errno:0}, function(response) {
								//console.log('disabled!');
						});
				}else if(tabURL.indexOf('http://vidzbigger.com/anypage.php')!=0){
  				window.setTimeout(function(){
  					if(!isCurrentEnableReady){
  						//console.log('detecting image or non supported page '+tabURL)

							chrome.runtime.sendMessage({greeting: "error_picker",errno:1}, function(response) {
  								//console.log('disabled!');
  						});
  					}
  				},560);//we expect to hear back from the content script by this time or something is wrong... and we need to use an iframe
			  }
			});
			sendResponse({hex:curentHex,lhex:lastLastHex,previewURI:lastPreviewURI,cr:clrgb.r,cg:clrgb.g,cb:clrgb.b});
		}else if (request.disableColorPicker){
			lastPreviewURI='';
			defaultIcon();
			chrome.browserAction.setBadgeText({text:''});
//	  			chrome.tabs.getSelected(null, function(tab) {
//					  chrome.tabs.sendMessage(tab.id, {disableColorPicker:true}, function(response) {});
//					});'
			if(!imageDataIsRendered){//cleans up the image src
				if(pim.complete){
					//ctx.putImageData(getImageDataFromImage(pim).data, 0, 0);
					if(clrAccuracyOverPrecision)
						ctx.drawImage(pim,0,0);
					else
						ctx.drawImage(pim,0,0,wid,hei);
					pim.src='';
					imageDataIsRendered=true;
				}
			}
			chrome.tabs.sendMessage(tabid, {disableColorPicker:true}, function(response) {});
			sendResponse({});
    }else if(request.reloadprefs){
    	fromPrefs();sendResponse({});
    }else
    	sendResponse({});
  
});
function handleRendering(){
	cvs = mcan;
	ctx = cvs.getContext("2d");

	//repainting hte image should not be necessary... but wahtever
		if(!imageDataIsRendered){
			if(pim.complete){
				//ctx.putImageData(getImageDataFromImage(pim), 0, 0);
				if(clrAccuracyOverPrecision)
					ctx.drawImage(pim,0,0);
				else
					ctx.drawImage(pim,0,0,wid,hei);
				pim.src='';
				if(showActualPickTarget){
					setTimeout(function(){
						chrome.tabs.sendMessage(tabid, {setPickerImage:true,pickerImage:cvs.toDataURL()}, function(response) {});
					},10);
				}
				imageDataIsRendered=true;
			}else{
				//image not ready to render...
				//sendResponse({}); //hourglass
				return false;
			}
		}else{
			//ctx.putImageData(fullScreenImageData, 0, 0);	
		}
	//page paint is either ready or finalized

	

	var icvs = document.createElement('canvas');//icon canvas
	var sx,sy;
	var totalWidth = 150;//750
	icvs.width=totalWidth
	icvs.height=totalWidth
	var ictx = icvs.getContext("2d");
	var startPoint=Math.floor(totalWidth/2);
	
	//strangest thing, the image clientWidth is different size on background page
	var ox=x;//(x/wid)*(wid-16);
	var oy=y;//(y/hei)*(hei-16);
	sx=ox-startPoint;
	sy=oy-startPoint;
	var data = ctx.getImageData(ox, oy, 1, 1).data;
	
	//var img=ctx.getImageData(sx, sy, totalWidth, totalWidth);
	if(!pixelatedPreview){
		ictx.scale(2,2);
		ictx.drawImage(cvs,-ox+(startPoint/2),-oy+(startPoint/2));//application of scale
		ictx.scale(0.5,0.5);
		
		ictx.fillStyle = "rgba(0,0,0,0.3)";//croshair
		//ictx.globalAlpha = 1.0;
		
		ictx.fillRect(startPoint, 0, 1, totalWidth);
		ictx.fillRect(0,startPoint, totalWidth, 1);
		
	}else{
		ictx.drawImage(cvs,-ox+(startPoint),-oy+(startPoint));
		var smi,spi,mp=fishEye;
		//xx,yy
		for(var i=0;i<startPoint;i+=2){
			smi=startPoint-i;
			spi=startPoint+i;
			////drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) //CANVAS
			ictx.drawImage(icvs,spi,0,smi,totalWidth,//total width really??
													spi+1,0,smi,totalWidth);

			ictx.drawImage(icvs,0,0,smi+1,totalWidth,
													-1,0,smi+1,totalWidth);

			ictx.drawImage(icvs,0,spi,totalWidth,smi,
													0,spi+1,totalWidth,smi);

			ictx.drawImage(icvs,0,0,totalWidth,smi+1,
													0,-1,totalWidth,smi+1);

			if(i==0){
				var data = ictx.getImageData(startPoint, startPoint, 1, 1).data;//notarget
//				ictx.fillStyle = "rgba("+(255-data[0])+","+(255-data[1])+","+(255-data[2])+",0.9)";
				var d=data[0]+data[1]+data[2];
				if(d > 192) ictx.fillStyle = "rgba(30,30,30,0.8)";
				else ictx.fillStyle = "rgba(225,225,225,0.8)";
			}else ictx.fillStyle = "rgba(255,255,255,0.4)";
				
			for(var c=0;c<mp;c++){
				++i;
				smi=startPoint-i;
				spi=startPoint+i;
				ictx.drawImage(icvs,spi,0,smi,totalWidth,
														spi+1,0,smi,totalWidth);

				ictx.drawImage(icvs,0,0,smi+1,totalWidth,
														-1,0,smi+1,totalWidth);

				ictx.drawImage(icvs,0,spi,totalWidth,smi,
														0,spi+1,totalWidth,smi);

				ictx.drawImage(icvs,0,0,totalWidth,smi+1,
														0,-1,totalWidth,smi+1);
			}
			mp--;
			if(mp<1)mp=1;
			ictx.fillRect(spi+1, 0, 1, totalWidth);
			ictx.fillRect(smi-1, 0, 1, totalWidth);
			ictx.fillRect(0, spi+1, totalWidth, 1);
			ictx.fillRect(0,smi-1,totalWidth,1);
		}
	}
	
	lastPreviewURI = icvs.toDataURL();//the last one, large size, is cached for revisiting the menu

		if(iconIsBitmap)
		chrome.browserAction.setIcon({imageData:ictx.getImageData(startPoint-9, startPoint-9, 19, 19)});//update icon (to be configurable)
		
		if(iconIsPreview){
			if(data[0]||data[1]||data[2]){
				chrome.browserAction.setBadgeBackgroundColor({color:[data[0],data[1],data[2],255]})
				chrome.browserAction.setBadgeText({text:'  '});
			}else{
				chrome.browserAction.setBadgeText({text:''});
			}
		}else{
			chrome.browserAction.setBadgeText({text:''});
		}

		//couls also jsut send this back with the hex code later, not sure! (rather not slow that down but who gets there first?/)
		if(showPreviewInContentS){
//					chrome.tabs.getSelected(null, function(tab) {
//					  chrome.tabs.sendMessage(tab.id, {setPixelPreview:true,previewURI:lastPreviewURI,zoomed:contSprevZoomd,hex:curentHex,lhex:lastHex}, function(response) {
//				  		//preview has been sent to the contentscript in case its showing...
//						});
//					});
			
			chrome.tabs.sendMessage(tabid, {setPixelPreview:true,previewURI:lastPreviewURI,zoomed:contSprevZoomd,hex:curentHex,lhex:lastHex}, function(response) {});

		}

	ictx=null;icvs=null;

	//console.log('requesting:'+x+','+y + ' '+"#"+data[0]+" "+data[1]+" "+data[2]);
	curentHex=RGBtoHex(data[0],data[1],data[2]);
	clhsv=rgb2hsl(data[0],data[1],data[2]);
	clrgb.r=data[0],clrgb.g=data[1],clrgb.b=data[2];
	chrome.runtime.sendMessage({setPreview:true,tabi:tabid,previewURI:lastPreviewURI,hex:curentHex,lhex:lastHex,cr:clrgb.r,cg:clrgb.g,cb:clrgb.b}, function(response) {
		//preview has been sent to the popup in case its showing...
	});
}
function getImageDataFromImage(idOrElement){
	var theImg = (typeof(idOrElement)=='string')? document.getElementById(idOrElement):idOrElement;
	var tcvs = document.createElement('canvas');
	tcvs.width = theImg.width;
	tcvs.height = theImg.height;
	var tctx = tcvs.getContext("2d");
	tctx.drawImage(theImg,0,0);
	var theData = tctx.getImageData(0, 0, tcvs.width, tcvs.height);
	tctx=null;tcvs=null;
	return theData;
}

var pim = document.createElement('img');
var mcan = document.createElement('canvas');

document.addEventListener('DOMContentLoaded', function () {
	//difficult to say when best time to do this is.... chrome running at 2 locations with different settings may produce odd results!
	loadSettingsFromChromeSyncStorage(function(){
		fromPrefs();
	});

	saveToChromeSyncStorage(); //temporary... but may help cover some users who haven't pressed the save button in preferences but use sync
});