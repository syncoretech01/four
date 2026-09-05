/**
 * The scroll-reveal runtime, injected into <head> by app/layout.tsx.
 *
 * It is an inline string rather than a React effect on purpose. The CSS in
 * components.css only hides `[data-reveal]` while `[data-reveal-js]` is set on
 * <html>, and this script is the only thing that sets it — so the gate and the
 * observer that clears it can never come apart. If the gate were added here and
 * the observer wired by a React effect, any error in the window between them
 * would hide content permanently; that is the failure this whole design exists
 * to remove.
 *
 * Every failure path lands on "visible": JS off (script never runs), an old
 * browser (early return), a thrown exception (catch removes the gate), a late
 * script (below-the-fold content hides off-screen, unseen).
 */
export const REVEAL_RUNTIME = `(function(){try{
var d=document,r=d.documentElement;
if(!('IntersectionObserver' in window))return;
r.setAttribute('data-reveal-js','');
var io=new IntersectionObserver(function(es){
for(var i=0;i<es.length;i++){if(es[i].isIntersecting){
es[i].target.setAttribute('data-reveal-shown','');io.unobserve(es[i].target);}}
},{rootMargin:'0px 0px -10% 0px',threshold:0});
var S='[data-reveal]:not([data-reveal-shown])';
function arm(n){
if(n.nodeType!==1)return;
if(n.matches&&n.matches(S))io.observe(n);
var l=n.querySelectorAll(S);for(var i=0;i<l.length;i++)io.observe(l[i]);}
function start(){
arm(d.body);
new MutationObserver(function(ms){
for(var i=0;i<ms.length;i++){var a=ms[i].addedNodes;
for(var j=0;j<a.length;j++)arm(a[j]);}
}).observe(d.body,{childList:true,subtree:true});}
d.readyState==='loading'?d.addEventListener('DOMContentLoaded',start):start();
}catch(e){document.documentElement.removeAttribute('data-reveal-js');}})();`;
