import {PublicKey} from '@solana/web3.js';
import {keypair,requireThat} from './security.mjs';

// 1Click is an external bridge. Verify its exact input mint, native output,
// quote amount, recipient, refund address, and final destination receipt.
export function oneClick(config,fetcher=fetch){
 const headers={'Content-Type':'application/json',...(config.oneClickApiKey?{'X-API-Key':config.oneClickApiKey}:{})};
 async function request(path,options={}){const res=await fetcher(`${config.oneClickUrl}${path}`,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(22000)});if(!res.ok)throw Error(`Bridge returned ${res.status}`);return res.json()}
 async function quote(amount,destination){requireThat(config.cluster==='mainnet-beta',503,'Native ZEC transfers require Solana mainnet');requireThat(config.oneClickApiKey,503,'Bridge API key has not been configured');const treasury=keypair(config.treasurySecret).publicKey.toBase58();
  const tokens=await request('/v0/tokens');requireThat(Array.isArray(tokens),503,'Bridge asset list unavailable');
  const origin=tokens.find(t=>t.contractAddress===config.quoteMint&&['sol','solana'].includes(String(t.blockchain).toLowerCase())&&t.decimals===8);
  const native=tokens.find(t=>t.blockchain==='zec'&&t.symbol==='ZEC'&&!t.contractAddress&&t.decimals===8);
  requireThat(origin&&native,503,'The bridge does not currently list the exact Solana ZEC mint and native Zcash ZEC pair');
  const payload={dry:false,swapType:'EXACT_INPUT',slippageTolerance:100,originAsset:origin.assetId,depositType:'ORIGIN_CHAIN',destinationAsset:native.assetId,amount:String(amount),recipient:destination,recipientType:'DESTINATION_CHAIN',refundTo:treasury,refundType:'ORIGIN_CHAIN',deadline:new Date(Date.now()+5*60000).toISOString()};
  const result=await request('/v0/quote',{method:'POST',body:JSON.stringify(payload)});
  requireThat(result?.quote?.amountIn===String(amount)&&result?.quote?.depositAddress,503,'Bridge quote did not match the requested amount');
  requireThat(result.quote.deadline&&Date.parse(result.quote.deadline)>Date.now()+45000,503,'Bridge quote expires too soon');
  requireThat(!result.quote.depositMemo,503,'Bridge requires a deposit memo; deposit handling is not configured');
  new PublicKey(result.quote.depositAddress);
  requireThat(result.quote.minAmountOut&&BigInt(result.quote.minAmountOut)>0n,503,'Native ZEC quote is below the bridge minimum');
  return {result,payload,depositAddress:result.quote.depositAddress,minAmountOut:result.quote.minAmountOut};
 }
 async function status(depositAddress,depositMemo){const query=new URLSearchParams({depositAddress,...(depositMemo?{depositMemo}:{})});return request(`/v0/status?${query}`)}
 return {quote,status};
}
