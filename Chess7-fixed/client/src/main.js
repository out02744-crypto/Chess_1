import {createStore} from './store/store.js';
import {createRouter} from './router/router.js';
import {Navbar} from './components/Navbar.js';
import {authModal} from './views/Auth.js';
import {Tasks} from './views/Tasks.js';
import {Puzzle} from './views/Puzzle.js';
import {Daily} from './views/Daily.js';
import {Library} from './views/Library.js';
import {Stats} from './views/Stats.js';
import {Profile} from './views/Profile.js';
import {Storm} from './views/Storm.js';

const store=createStore({user:JSON.parse(localStorage.getItem('user')||'null'),token:localStorage.getItem('token')});
const app=document.querySelector('#app');
app.innerHTML='<div class="shell"><div id="nav"></div><main class="main" id="app-root"></main><div class="bottomnav"></div></div>';
const root=document.querySelector('#app-root');

async function api(url,opt={}){const o={...opt,headers:{'Content-Type':'application/json',...(opt.headers||{})}};if(store.getState().token)o.headers.Authorization='Bearer '+store.getState().token;const r=await fetch(url,o);if(!r.ok)throw new Error((await r.json().catch(()=>({}))).error||'Ошибка');return r.json()}
let router;
function renderNav(){const s=store.getState();document.querySelector('#nav').innerHTML=Navbar({state:s,navigate:p=>router.go(p),openAuth:()=>{}});document.querySelectorAll('[data-nav]').forEach(x=>x.onclick=()=>router.go(x.dataset.nav));document.querySelectorAll('[data-auth]').forEach(x=>x.onclick=()=>openAuth(x.dataset.auth));document.querySelector('.bottomnav').innerHTML=['/tasks','/daily','/storm','/stats','/profile'].map((p,i)=>`<button class="${location.pathname===p?'active':''}" data-nav="${p}">${['♟','★','⚡','▥','♙'][i]}<span>${['Задания','Дня','Шторм','Статистика','Профиль'][i]}</span></button>`).join('');document.querySelectorAll('.bottomnav [data-nav]').forEach(x=>x.onclick=()=>router.go(x.dataset.nav))}
store.subscribe(renderNav);
function openAuth(mode){const wrap=document.createElement('div');wrap.innerHTML=authModal(mode);document.body.append(wrap.firstElementChild);const m=document.querySelector('#authModal');m.querySelector('[data-close]').onclick=()=>m.remove();m.onclick=e=>{if(e.target===m)m.remove()};m.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{const data=await api('/api/auth/'+mode,{method:'POST',body:JSON.stringify(Object.fromEntries(f))});localStorage.setItem('token',data.token);localStorage.setItem('user',JSON.stringify(data.user));store.dispatch({token:data.token,user:data.user});m.remove();router.go('/tasks')}catch(err){m.querySelector('#authError').textContent=err.message}}}

router=createRouter({
 '/tasks':()=>Tasks({api,navigate:p=>router.go(p),store}),
 '/tasks/:id':()=>Puzzle({api,root,navigate:p=>router.go(p),id:location.pathname.split('/')[2],store}),
 '/daily':()=>Daily({api,navigate:p=>router.go(p),store}),
 '/library':()=>Library({api}),
 '/stats':()=>Stats({api}),
 '/profile':()=>Profile({store}),
 '/storm':()=>Storm({api,navigate:p=>router.go(p)})
});
renderNav();router.start();
