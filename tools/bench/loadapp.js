// Load the app's anatomy and imaging data from index.html in a sandbox (no DOM needed for data)
const fs=require("fs"),vm=require("vm");
const H=fs.readFileSync(process.env.APPHTML||require("path").join(__dirname,"../../app/src/main/assets/www/index.html"),"utf8");
const s=H.indexOf("<script>")+8,e=H.indexOf("</script>",s);const code=H.slice(s,e);
const any=new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>"":k==="length"?0:any,apply:()=>any,construct:()=>any,set:()=>true});
const ctx={console,setTimeout:()=>0,clearTimeout(){},requestAnimationFrame:()=>0,matchMedia:()=>({matches:false,addEventListener(){}}),localStorage:{getItem:()=>null,setItem(){}},navigator:{},location:{href:"",hash:"",search:""},history:any,document:any,addEventListener(){},innerHeight:800,innerWidth:400,getComputedStyle:()=>any,ResizeObserver:function(){return any},IntersectionObserver:function(){return any},MutationObserver:function(){return any},performance:{now:()=>0},Image:function(){return any},fetch:()=>new Promise(()=>{})};
ctx.window=ctx;ctx.self=ctx;vm.createContext(ctx);
let err=null;try{vm.runInContext(code,ctx,{timeout:20000})}catch(x){err=x}
const get=n=>{try{return vm.runInContext(n,ctx)}catch(x){return undefined}};
module.exports={ctx,get,err};
if(require.main===module){console.log("err:",err&&String(err).slice(0,200));for(const n of ["REGIONS","SECTIONS","CONDS","TABLES","MNEM","CARDS","QUIZ","DISC","SERIES","OPS","FIG"]){const v=get(n);console.log(n,v?(Array.isArray(v)?v.length:Object.keys(v).length):v)}}
