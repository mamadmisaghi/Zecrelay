import {readFileSync} from 'node:fs';
import {PublicKey} from '@solana/web3.js';
const read=(name)=>process.env[`${name}_FILE`]?readFileSync(process.env[`${name}_FILE`],'utf8').trim():process.env[name]||'';
const zecMint='A7bdiYdS5GjqGFtxf17ppRHtDKPkkRqbKtR27dxvQXaS';
export function configuration(){
 const cluster=process.env.SOLANA_CLUSTER||'mainnet-beta';
 if(!['mainnet-beta','devnet'].includes(cluster))throw Error('Unsupported Solana cluster');
 const quoteMint=process.env.ZEC_SOLANA_MINT||zecMint;
 new PublicKey(quoteMint);
 if(cluster==='mainnet-beta'&&quoteMint!==zecMint)throw Error('Only the Pump-supported ZEC mint may be used on mainnet');
 const origin=process.env.PUBLIC_ORIGIN||'http://localhost:5173';
 if(new URL(origin).origin!==origin)throw Error('PUBLIC_ORIGIN must contain only the scheme and host');
 if(process.env.NODE_ENV==='production'&&!origin.startsWith('https://'))throw Error('Production PUBLIC_ORIGIN must use HTTPS');
 const oneClickUrl=process.env.ONECLICK_URL||'https://1click.chaindefuser.com';
 if(oneClickUrl!=='https://1click.chaindefuser.com')throw Error('Use the official 1Click API host');
 return {origin,cluster,quoteMint,rpc:read('SOLANA_RPC_URL'),database:read('DATABASE_URL'),encryptionKey:read('KEY_ENCRYPTION_KEY'),operatorSecret:read('OPERATOR_KEYPAIR'),treasurySecret:read('TREASURY_KEYPAIR'),launchesEnabled:process.env.LAUNCHES_ENABLED==='true',collectionsEnabled:process.env.COLLECTIONS_ENABLED==='true',nativePayoutsEnabled:process.env.NATIVE_PAYOUTS_ENABLED==='true',oneClickUrl,oneClickApiKey:read('ONECLICK_API_KEY'),minPayout:BigInt(process.env.MIN_NATIVE_PAYOUT_RAW||'100000'),maxPayout:BigInt(process.env.MAX_NATIVE_PAYOUT_RAW||'50000000'),port:Number(process.env.PORT||3001)};
}
