import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import bs58 from 'bs58';
import {Keypair,PublicKey} from '@solana/web3.js';
import {PGlite} from '@electric-sql/pglite';
import {appFactory} from '../src/app.mjs';
import {oneClick} from '../src/bridge.mjs';
import {zcashTAddress,seal,unseal} from '../src/security.mjs';
import {tick} from '../src/worker.mjs';

function transparentAddress(){const data=Buffer.concat([Buffer.from([0x1c,0xb8]),Buffer.alloc(20,9)]);const hash=createHash('sha256').update(createHash('sha256').update(data).digest()).digest();return bs58.encode(Buffer.concat([data,hash.subarray(0,4)]))}
const mint='A7bdiYdS5GjqGFtxf17ppRHtDKPkkRqbKtR27dxvQXaS';
const config={origin:'http://localhost:5173',quoteMint:mint,cluster:'mainnet-beta',rpc:'http://127.0.0.1:8899',database:'test',encryptionKey:'a-secret-kept-out-of-git-over-32-characters',launchesEnabled:true,collectionsEnabled:true,nativePayoutsEnabled:true,treasurySecret:'test',operatorSecret:'test',oneClickApiKey:'test'};

test('Zcash recipient checksum and encryption reject accidental changes',()=>{const address=transparentAddress();assert.ok(zcashTAddress(address));assert.equal(zcashTAddress(address.slice(0,-1)+'2'),false);assert.equal(zcashTAddress(Keypair.generate().publicKey.toBase58()),false);const encrypted=seal(Buffer.from('sensitive'),config.encryptionKey,'test:a');assert.equal(unseal(encrypted,config.encryptionKey,'test:a').toString(),'sensitive');assert.throws(()=>unseal(encrypted,config.encryptionKey,'test:b'))});

test('creator and holder launches are stored independently; public totals are finalized only',async()=>{
 const db=new PGlite();await db.exec(readFileSync(fileURLToPath(new URL('../schema.sql',import.meta.url)),'utf8'));
 const fakeChain={prepare:async()=>({message:'message',wire:'wire',lastValidHeight:99}),connection:{getBlockHeight:async()=>1},verifyWalletWire:()=>{},send:async()=>{}};
 const app=await appFactory({db,config,chain:fakeChain});
 const wallet=Keypair.generate().publicKey.toBase58(),image='data:image/png;base64,'+Buffer.from('fake-small-test-image').toString('base64');
 const input={name:'ZEC Fox',symbol:'FOX',description:'A ZEC pair',wallet,image,rewardMode:'creator',zecAddress:transparentAddress(),creatorFeeBps:100,initialBuyRaw:'0',website:null,twitter:null,telegram:null};
 const post=body=>app.inject({method:'POST',url:'/api/launch/prepare',headers:{origin:config.origin},payload:body});
 const first=await post(input);assert.equal(first.statusCode,200,first.body);const creator=first.json();
 const holder=await post({...input,name:'Holder Fox',rewardMode:'holder',zecAddress:null,creatorFeeBps:null});assert.equal(holder.statusCode,200,holder.body);
 const third=await post({...input,name:'Too many'});assert.equal(third.statusCode,429);
 const invalid=await post({...input,wallet:Keypair.generate().publicKey.toBase58(),zecAddress:'t1BAD'});assert.equal(invalid.statusCode,400);
 const byOwner=await db.query('SELECT reward_mode,creator,owner_wallet FROM launches ORDER BY created_at');assert.equal(byOwner.rows.length,2);assert.notEqual(byOwner.rows[0].creator,byOwner.rows[1].creator);
 assert.equal((await app.inject('/api/tokens')).json().tokens.length,0);
 await db.query("UPDATE launches SET status='confirmed',confirmed_at=now() WHERE id=$1",[creator.id]);const publicList=(await app.inject('/api/tokens')).json().tokens;assert.equal(publicList.length,1);assert.equal(publicList[0].reward_mode,'creator');assert.equal(publicList[0].collected_raw,'0');assert.equal(publicList[0].paid_raw,'0');
 await app.close();await db.close();
});

test('native bridge checks asset identity, exact amount, destination and refund before transfer',async()=>{
 const treasury=Keypair.generate(),address=transparentAddress(),deposit=Keypair.generate().publicKey.toBase58();
 const mock={...config,treasurySecret:bs58.encode(treasury.secretKey),oneClickApiKey:'test',oneClickUrl:'https://1click.chaindefuser.com'};
 let payload;const fetcher=async(url,options)=>({ok:true,json:async()=>url.endsWith('/v0/tokens')?[{assetId:'sol-asset',contractAddress:mint,blockchain:'sol',decimals:8,symbol:'ZEC'},{assetId:'native-asset',contractAddress:null,blockchain:'zec',decimals:8,symbol:'ZEC'}]:url.endsWith('/v0/quote')?(payload=JSON.parse(options.body),{quote:{amountIn:'12345678',amountOut:'12000000',minAmountOut:'11000000',depositAddress:deposit,deadline:new Date(Date.now()+180000).toISOString()}}):{status:'PENDING_DEPOSIT'}});
 const bridge=oneClick(mock,fetcher),quote=await bridge.quote('12345678',address);assert.equal(quote.depositAddress,deposit);assert.equal(payload.recipient,address);assert.equal(payload.refundTo,treasury.publicKey.toBase58());assert.equal(payload.originAsset,'sol-asset');assert.equal(payload.destinationAsset,'native-asset');
 const wrong=oneClick(mock,async(url)=>({ok:true,json:async()=>url.endsWith('/v0/tokens')?[{assetId:'fake',contractAddress:'not-our-mint',blockchain:'sol',decimals:8,symbol:'ZEC'},{assetId:'native-asset',contractAddress:null,blockchain:'zec',decimals:8,symbol:'ZEC'}]:{}}));await assert.rejects(()=>wrong.quote('123',address),/exact Solana ZEC mint/);
});

test('one shared treasury keeps finalized fees attributable to each separate token',async()=>{
 const db=new PGlite();await db.exec(readFileSync(fileURLToPath(new URL('../schema.sql',import.meta.url)),'utf8'));
 const treasury=Keypair.generate(),operator=Keypair.generate(),launches=[];
 for(const [id,amount] of [['first',100000],['second',200000]]){
  const creator=Keypair.generate(),mintKey=Keypair.generate(),owner=Keypair.generate();
  await db.query("INSERT INTO launches(id,owner_wallet,name,symbol,mint,mint_secret,creator,creator_secret,image_type,image_bytes,reward_mode,zec_address,quote_mint,status,confirmed_at) VALUES($1,$2,$3,'TEST',$4,'encrypted',$5,$6,'image/png',$7,'creator',$8,$9,'confirmed',now())",[id,owner.publicKey.toBase58(),id,mintKey.publicKey.toBase58(),creator.publicKey.toBase58(),seal(creator.secretKey,config.encryptionKey,`creator:${id}`),Buffer.from([137,80,78,71]),transparentAddress(),mint]);launches.push({id,amount});
 }
 const recorded=new Map(),mockChain={quoteMint:new PublicKey(mint),quoteProgram:()=>new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),state:async()=> 'confirmed',due:async row=>BigInt(launches.find(l=>l.id===row.id).amount),collect:async row=>({signature:`collection-${row.id}`,wire:`collection-wire-${row.id}`,lastValidHeight:500}),received:async signature=>signature.startsWith('collection-')?BigInt(launches.find(l=>l.id===signature.slice(11)).amount):BigInt(recorded.get(signature)),move:async ({source,destination,amount})=>{assert.ok(source instanceof Uint8Array);assert.equal(destination,treasury.publicKey.toBase58());const id=launches.find(l=>BigInt(l.amount)===amount).id,signature=`sweep-${id}`;recorded.set(signature,amount);return {signature,wire:signature,lastValidHeight:500}},send:async()=>{}};
 const c={...config,collectionsEnabled:true,nativePayoutsEnabled:false,treasurySecret:bs58.encode(treasury.secretKey),operatorSecret:bs58.encode(operator.secretKey),minPayout:10000n};
 await tick({db,config:c,chain:mockChain,bridge:{}});
 const {rows}=await db.query("SELECT launch_id,amount_raw::text,status FROM fee_sweeps ORDER BY launch_id");assert.deepEqual(rows.map(r=>[r.launch_id,r.amount_raw,r.status]),[['first','100000','confirmed'],['second','200000','confirmed']]);
 await db.close();
});
