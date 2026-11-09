const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.join(__dirname,'..'),html=fs.readFileSync(path.join(dir,'index.html'),'utf8'),js=fs.readFileSync(path.join(dir,'site.js'),'utf8');
test('all public copy exists in seven languages; site keeps contact/privacy and no fictional dashboard or public demo',()=>{
 const messages=JSON.parse(js.match(/const messages=({[\s\S]*?});\nfunction apply/)[1]);
 const used=[...html.matchAll(/data-i18n="([^"]+)"/g)].map(m=>m[1]);
 for(const lang of ['fr','en','de','es','it','pt','ar'])for(const key of used)assert.ok(messages[lang][key],lang+': '+key);
 assert.doesNotMatch(html,/<table\b|demo=1|test\/test|INV-04|PO-04/);
 assert.match(html,/mailto:contact@pingbuyer.com/);assert.match(html,/hits\.sh/);assert.match(html,/id="privacy"/);
 assert.equal([...html.matchAll(/<main>/g)].length,1);assert.equal([...html.matchAll(/<\/main>/g)].length,1);
 for(const lang of Object.keys(messages)){
  const nodes=used.map(key=>({dataset:{i18n:key},innerHTML:''})),elements=new Map();
  const node=key=>{if(!elements.has(key))elements.set(key,{setAttribute(){},addEventListener(){},showModal(){},close(){}});return elements.get(key)};
  const document={documentElement:{},querySelectorAll:()=>nodes,querySelector:node,getElementById:node};
  vm.runInNewContext(js,{document,PingbuyerLocale:{subscribe(fn){fn(lang)},choose(){}},encodeURIComponent});
  assert.ok(nodes.every(n=>n.innerHTML&&!n.innerHTML.includes('undefined')),lang);
  assert.equal(document.documentElement.dir,lang==='ar'?'rtl':'ltr');
  assert.equal(node('.login-link').href,'https://app.pingbuyer.com/?lang='+lang);
 }
});
