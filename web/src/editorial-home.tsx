import React from 'react';
import {ArrowRight, ArrowUpRight, Coins, Layers3, Search, ShieldCheck, Sparkles} from 'lucide-react';
import type {Token, Payout} from './main';

type Sort = 'recent' | 'fees' | 'name';
type Props = {
  tokens: Token[];
  filtered: Token[];
  payouts: Payout[];
  sort: Sort;
  setSort: (sort: Sort) => void;
  search: string;
  setSearch: (search: string) => void;
  go: (route: 'home' | 'explore' | 'launch' | 'rewards' | 'docs' | 'token', id?: string) => void;
};

const examples = [
  {name:'ZECAT', code:'CAT', image:'/art/explorer-cat.webp'},
  {name:'SHIELDOG', code:'DOG', image:'/art/shield-dog.webp'},
  {name:'ZECMOON', code:'MOON', image:'/art/moon-ridge.webp'},
  {name:'PRIVIUS', code:'ART', image:'/art/veiled-statue.webp'},
  {name:'ROUTE', code:'NET', image:'/art/wireframe-mind.webp'},
];

function RouteArtwork(){
  return <div className="route-art" aria-hidden="true">
    <img className="route-rock" src="/art/volcanic-ridge.webp" alt=""/>
    <svg className="route-lines" viewBox="0 0 800 490" fill="none" role="presentation" preserveAspectRatio="xMidYMid meet">
      <defs><linearGradient id="route-gold" x1="175" y1="80" x2="650" y2="430" gradientUnits="userSpaceOnUse"><stop stopColor="#74603f"/><stop offset=".45" stopColor="#ffca83"/><stop offset="1" stopColor="#775633"/></linearGradient></defs>
      <circle cx="325" cy="242" r="190" stroke="#f1bb78" strokeOpacity=".23" strokeWidth=".8"/>
      <circle cx="325" cy="242" r="138" stroke="#eeb979" strokeOpacity=".23" strokeWidth=".8"/>
      <circle cx="325" cy="242" r="111" stroke="url(#route-gold)" strokeOpacity=".8" strokeWidth="1.6"/>
      <circle cx="591" cy="316" r="132" stroke="#e5a764" strokeOpacity=".32" strokeWidth=".9"/>
      {Array.from({length:11},(_,i)=><circle key={'l'+i} cx="325" cy="242" r={112+i*3.7} stroke="url(#route-gold)" strokeOpacity={.22+i*.027} strokeWidth=".7"/>)}
      {Array.from({length:10},(_,i)=><circle key={'r'+i} cx="591" cy="316" r={89+i*3.6} stroke="url(#route-gold)" strokeOpacity={.26+i*.033} strokeWidth=".85"/>)}
      {Array.from({length:12},(_,i)=><path key={'p'+i} d={`M ${400+i*2} ${137+i*4} C ${466+i*4} ${91+i*9}, ${491+i*6} ${255+i*3}, ${539+i*3} ${218+i*2}`} stroke="url(#route-gold)" strokeOpacity={.09+i*.035} strokeWidth=".9"/>)}
      <path d="M 94 212 H 705 M 325 42 V 447 M 591 150 V 461" stroke="#c9a06a" strokeOpacity=".22" strokeWidth=".7"/>
      <path d="M 191 345 H 734 M 392 159 H 733" stroke="#c9a06a" strokeOpacity=".17" strokeWidth=".8"/>
      {[ [325,52],[325,153],[325,354],[591,183],[591,449],[710,345],[448,212],[191,345] ].map(([x,y],i)=><circle key={'d'+i} cx={x} cy={y} r={i%3===0?3.2:2.2} fill="#ffca84"/>)}
      <g transform="translate(280 209) skewY(-12)" fill="#e9d9c6"><path d="M0 0H74L61 12H-13z"/><path d="M0 22H74L61 34H-13z"/><path d="M0 44H74L61 56H-13z"/></g>
      <text x="591" y="346" textAnchor="middle" fill="#f4be78" fontFamily="Georgia,serif" fontSize="78" fontWeight="bold">Ƶ</text>
    </svg>
    <span className="route-aside route-aside-top">DIFFERENT<br/>COMMUNITIES.<br/>A BRIGHTER<br/>ROUTE.</span>
    <span className="route-aside route-aside-bottom">SOLANA<br/>LIQUIDITY.<br/>ZCASH<br/>PAYOUTS.</span>
  </div>;
}

function ConceptCard({item}:{item:(typeof examples)[number]}){
  return <article className="editorial-card concept-card">
    <div className="editorial-cover"><img src={item.image} alt="" loading="lazy"/></div>
    <div className="editorial-card-body"><div className="editorial-card-name"><strong>{item.name}</strong><span className="sample-mark">CONCEPT</span></div><span className="editorial-symbol">${item.code}</span><div className="editorial-card-rule"/><p>Artwork preview <span>·</span> Not launched</p></div>
  </article>;
}

function MarketCard({token,go}:{token:Token;go:Props['go']}){
  return <button className="editorial-card live-card" onClick={()=>go('token',token.id)} aria-label={`View ${token.name}`}>
    <div className="editorial-cover">{token.image_url?<img src={token.image_url} alt="" loading="lazy"/>:<span className="empty-cover">{token.symbol.slice(0,1)}</span>}<span className="card-open"><ArrowUpRight size={13}/></span></div>
    <div className="editorial-card-body"><div className="editorial-card-name"><strong>{token.name}</strong><span className="real-market-dot"/></div><span className="editorial-symbol">${token.symbol}</span><div className="editorial-card-rule"/><div className="editorial-card-values"><span>Fees collected</span><strong>{(Number(BigInt(token.collected_raw))/1e8).toLocaleString('en-US',{maximumFractionDigits:4})} ZEC</strong></div><p>{token.reward_mode==='holder'?'Holder rewards on Solana':'Creator payout to Zcash'}</p></div>
  </button>;
}

export function EditorialHome({tokens,filtered,payouts,sort,setSort,search,setSearch,go}:Props){
  return <div className="editorial-home">
    <section className="editorial-hero">
      <div className="editorial-hero-top"><span>SOLANA <b>×</b> ZCASH <b>×</b> CREATORS</span><label className="hero-search"><Search size={15}/><input aria-label="Search markets" placeholder="Search tokens, symbols or contracts…" value={search} onChange={event=>setSearch(event.target.value)} onKeyDown={event=>{if(event.key==='Enter')go('explore')}}/></label></div>
      <RouteArtwork/>
      <div className="editorial-hero-main"><h1>Launch on<br/>Solana.<br/><em>Reward in ZEC.</em></h1><p>Build a token on Pump.fun, paired with ZEC. Choose holder rewards on Solana or creator rewards paid to your native Zcash address after fees are collected and bridged.</p><div className="editorial-actions"><button className="button primary" onClick={()=>go('explore')}>Explore tokens <ArrowRight size={17}/></button><button className="button ghost" onClick={()=>go('launch')}>Create token</button></div></div>
      <div className="editorial-capabilities"><div><Coins size={25}/><span>Pump.fun launch<br/>with ZEC pair</span></div><div><Layers3 size={25}/><span>Holder rewards<br/>on Solana</span></div><div><ShieldCheck size={25}/><span>Creator payout<br/>to native t-address</span></div></div>
    </section>
    <section className="editorial-markets"><div className="market-heading"><div><span className="market-kicker">MARKETS</span><div className="market-heading-line"><h2>Explore tokens</h2><p>{tokens.length?'Markets paired with ZEC. Discover how rewards are routed.':'A visual preview of the markets that can live here.'}</p></div></div><button className="inline-link" onClick={()=>go('explore')}>View all <ArrowRight size={15}/></button></div>
      {tokens.length?<><div className="editorial-sort"><span>{filtered.length} live market{filtered.length===1?'':'s'}</span><div role="group" aria-label="Sort markets">{(['recent','fees','name'] as const).map(value=><button key={value} className={value===sort?'active':''} onClick={()=>setSort(value)}>{value==='recent'?'Recent':value==='fees'?'Top fees':'Name'}</button>)}</div></div><div className="editorial-grid">{filtered.slice(0,5).map(token=><MarketCard key={token.id} token={token} go={go}/>)}</div></>:<><p className="gallery-disclosure"><Sparkles size={13}/> Illustrative artwork only · no token has launched on ZecRelay yet.</p><div className="editorial-grid">{examples.map(item=><ConceptCard key={item.name} item={item}/>)}</div></>}
    </section>
    <div className="editorial-ticker"><strong>{tokens.length?'NEW MARKETS':'LAUNCH STATUS'}</strong>{tokens.length?tokens.slice(0,5).map((token,i)=><button key={token.id} onClick={()=>go('token',token.id)}><span>{String(i+1).padStart(2,'0')}</span>{token.name}<span className="ticker-reward">{token.reward_mode==='holder'?'HOLDER':'CREATOR'}</span></button>):<span className="ticker-empty">Your first confirmed token will appear here, with its real rewards and market details.</span>}</div>
    <section className="editorial-lower"><div><h3>Fee collections</h3>{tokens.some(token=>BigInt(token.collected_raw)>0n)?tokens.filter(token=>BigInt(token.collected_raw)>0n).slice(0,3).map(token=><button key={token.id} onClick={()=>go('token',token.id)}><span>{token.name}</span><strong>{(Number(BigInt(token.collected_raw))/1e8).toFixed(4)} ZEC</strong></button>):<p>Collections appear after confirmed trades and settlement.</p>}</div><div><h3>Native payouts</h3>{payouts.length?payouts.slice(0,3).map(payout=><div key={payout.id}><span>{payout.token_name}</span><strong>{payout.status.replaceAll('_',' ')}</strong></div>):<p>Native ZEC payouts appear after bridge confirmation.</p>}</div></section>
  </div>;
}
