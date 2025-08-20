import { sellIx } from './sellIx';
import { buyIx } from './buyIx';
import { createMint } from './create-mint';

const main = async (): Promise<void> => {
  await buyIx();
  await sellIx();
  await createMint();
};

main().catch(console.error);
