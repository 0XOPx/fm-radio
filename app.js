const fallbackStations=[{name:"Radio 357",freq:"ONLINE",stream:"https://stream.rcs.revma.com/ye5kghkgcm0uv"},{name:"TOK FM",freq:"ONLINE",stream:"https://radiostream.pl/tuba10-1.mp3"},{name:"ESKA ROCK",freq:"ONLINE",stream:"https://ic2.smcdn.pl/5380-1.mp3"}];
let stations=[...fallbackStations];
const audio=document.getElementById("audio"),play=document.getElementById("play"),progress=document.getElementById("progress"),volume=document.getElementById("volume"),freq=document.getElementById("freq"),station=document.getElementById("station"),status=document.getElementById("status"),country=document.getElementById("country"),countryStatus=document.getElementById("countryStatus"),detect=document.getElementById("detect");
const api="https://de1.api.radio-browser.info";

function tune(s){audio.src=s.stream;freq.textContent=s.freq||"ONLINE";station.textContent=s.name;status.textContent="Station selected";document.querySelectorAll(".card").forEach((x,i)=>x.classList.toggle("active",stations[i]===s));play.textContent="▶"}

function render(){document.querySelector(".cards").innerHTML=stations.map((s,i)=>'<button class="card '+(i===0?"active":"")+'" data-i="'+i+'"><b>'+((s.freq&&s.freq!=="ONLINE")?s.freq:"LIVE")+'</b><span>'+s.name+'</span><small>LIVE RADIO</small></button>').join("");document.querySelectorAll(".card").forEach(c=>c.onclick=()=>tune(stations[Number(c.dataset.i)]))}

async function loadCountry(code,name){
country.textContent=name+" ("+code+")";
countryStatus.textContent="Finding live stations from this country…";
try{
const r=await fetch(api+"/json/stations/bycountrycodeexact/"+encodeURIComponent(code)+"?limit=18&hidebroken=true&order=votes&reverse=true");
if(!r.ok)throw new Error("station request failed");
const data=await r.json();
const live=data.filter(s=>s.url_resolved&&s.url_resolved.startsWith("http://")||s.url_resolved.startsWith("https://")).map(s=>({name:s.name,freq:s.tags&&s.tags.includes("fm")?"FM":"ONLINE",stream:s.url_resolved})).filter(s=>s.stream).slice(0,9);
if(live.length){stations=live;render();tune(stations[0]);countryStatus.textContent=live.length+" live stations found for your country."}
else{stations=[...fallbackStations];render();tune(stations[0]);countryStatus.textContent="No browser-ready stations found; using FMOnline defaults."}
}catch(e){stations=[...fallbackStations];render();tune(stations[0]);countryStatus.textContent="Country detected, but the station directory is unavailable right now."}
}

async function detectCountry(){
country.textContent="Detecting country…";
countryStatus.textContent="Checking your approximate internet location.";
try{
const r=await fetch("https://ipapi.co/json/");
if(!r.ok)throw new Error("location request failed");
const data=await r.json();
if(!data.country_code)throw new Error("no country");
await loadCountry(data.country_code,data.country_name||data.country_code);
}catch(e){
const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||"";
const guess=tz.split("/")[0]==="Europe"?"European region":"Unknown region";
country.textContent=guess;
countryStatus.textContent="Automatic country lookup was unavailable. Click Detect again to retry.";
stations=[...fallbackStations];render();tune(stations[0]);
}
}

play.onclick=async()=>{if(audio.paused){try{await audio.play();play.textContent="Ⅱ";status.textContent="On air"}catch(e){status.textContent="Stream unavailable in this browser"}}else{audio.pause();play.textContent="▶";status.textContent="Paused"}};
volume.oninput=()=>audio.volume=volume.value;
audio.volume=.8;
audio.ontimeupdate=()=>{if(audio.duration)progress.value=audio.currentTime/audio.duration*100};
progress.oninput=()=>{if(audio.duration)audio.currentTime=progress.value/100*audio.duration};
detect.onclick=detectCountry;
render();
tune(stations[0]);
detectCountry();
