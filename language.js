/* Shared language selection for the website and app. No API key required. */
(function(){
'use strict';
const names={fr:'Français',en:'English',de:'Deutsch',es:'Español',it:'Italiano',pt:'Português',ar:'العربية'};
const valid=value=>typeof value==='string'&&Object.prototype.hasOwnProperty.call(names,value);
const read=(store,key)=>{try{return window[store].getItem(key)}catch{return null}};
const write=(store,key,value)=>{try{window[store].setItem(key,value)}catch{}};
const preferred=(navigator.languages||[navigator.language||'en']).map(x=>String(x).toLowerCase().split(/[-_]/)[0]);
const browser=preferred.find(valid)||'en';
const query=new URLSearchParams(location.search).get('lang');
const saved=read('localStorage','pingbuyer-language');
const legacy=read('localStorage','pingbuyer-app-language');
let locked=valid(query)||valid(saved)||valid(legacy);
let current=valid(query)?query:valid(saved)?saved:valid(legacy)?legacy:browser;
const listeners=[];
function persist(value){write('localStorage','pingbuyer-language',value);write('localStorage','pingbuyer-app-language',value)}
function notify(value){if(!valid(value))return;current=value;listeners.forEach(fn=>fn(value))}
function choose(value){if(!valid(value))return;locked=true;persist(value);notify(value);try{const url=new URL(location.href);if(url.searchParams.has('lang')){url.searchParams.set('lang',value);history.replaceState(null,'',url)}}catch{}}
if(locked)persist(current);
window.PingbuyerLocale={names,get current(){return current},choose,subscribe(fn){listeners.push(fn);fn(current)}};
window.addEventListener('storage',e=>{if(e.key==='pingbuyer-language'&&valid(e.newValue)){locked=true;notify(e.newValue)}});
const groups={
fr:'FR MC BJ BF BI CD CG CI GA GN ML NE SN TG GF GP MQ RE YT NC PF',
en:'US GB IE AU NZ NG GH KE UG ZM ZW BW LR SL GM',
de:'DE AT LI',
es:'ES MX AR BO CL CO CR CU DO EC GT HN NI PA PE PR PY SV UY VE',
it:'IT SM VA',
pt:'PT BR AO MZ CV GW ST TL',
ar:'SA AE BH KW OM QA IQ JO LB SY PS YE EG LY SD SO DJ'
};
const countryLanguages={BE:['fr','de'],CH:['de','fr','it'],CA:['en','fr'],LU:['fr','de'],DZ:['ar','fr'],MA:['ar','fr'],TN:['ar','fr'],MR:['ar','fr'],CM:['fr','en'],MG:['fr'],HT:['fr'],MU:['en','fr'],SC:['en','fr'],KM:['ar','fr'],GQ:['es','fr','pt'],MT:['en'],ZA:['en'],IN:['en'],PK:['en'],SG:['en'],PH:['en']};
Object.entries(groups).forEach(([lang,countries])=>countries.split(' ').forEach(c=>countryLanguages[c]=[lang]));
function fromCountry(country){const options=countryLanguages[country];return options?(preferred.find(x=>options.includes(x))||options[0]):browser}
async function detect(){
 if(locked)return;
 let cached;try{cached=JSON.parse(read('sessionStorage','pingbuyer-country')||'null')}catch{}
 if(cached&&Number.isFinite(cached.at)&&Date.now()-cached.at<86400000){
   if(/^[A-Z]{2}$/.test(cached.country||''))notify(fromCountry(cached.country));return;
 }
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),2200);
 try{
  const response=await fetch('https://ipwho.is/?fields=success,country_code',{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'});
  if(!response.ok)throw Error('Country lookup unavailable');
  const result=await response.json();
  if(result.success!==true||!(/^[A-Z]{2}$/.test(result.country_code||'')))throw Error('Invalid country');
  write('sessionStorage','pingbuyer-country',JSON.stringify({country:result.country_code,at:Date.now()}));
  if(!locked)notify(fromCountry(result.country_code));
 }catch{write('sessionStorage','pingbuyer-country',JSON.stringify({country:null,at:Date.now()}))}
 finally{clearTimeout(timer)}
}
detect();
})();
