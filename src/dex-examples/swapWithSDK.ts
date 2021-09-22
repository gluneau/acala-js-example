import { FixedPointNumber, Token } from "@acala-network/sdk-core";
import { SwapPromise } from "@acala-network/sdk-swap";
import { WalletPromise } from "@acala-network/sdk-wallet";
import getPolkadotApi from "../utils/getPolkadotApi";
import getSigner from "../utils/getSigner";

const swapWithSDK = async () => {
  const api = await getPolkadotApi();

  const signer = getSigner();

  const wallet = new WalletPromise(api);

  const karToken = wallet.getToken("KAR");
  const kusdToken = wallet.getToken("KUSD");

  const path = [karToken, kusdToken] as [Token, Token];
  const supplyAmount = new FixedPointNumber(1, karToken.decimal);
  // set slippage 1%
  const slippage = new FixedPointNumber(0.01);

  // min: 0; max: 0.03; default: 0;
  const apiFee = new FixedPointNumber(0.01);
  const apiAddress = '5HnEvdDPSjsM3iiQT4AL4sBnYogHdWLeNCUDhc2mspSPi2xU';
  
  // min: 0; max: 0.03; default: 0;
  const referrerFee = new FixedPointNumber(0.01);
  const referrerAddress = '5DqipgPwUTGJgEBfSpmiC7tnC1SCeTZ5on3jJNoq8mhoHhJr';
  
  const swapPromise = new SwapPromise(api);

  const parameters = await swapPromise.swap(path, supplyAmount, "EXACT_INPUT");

  console.log(`estimate target amount ${parameters.output.balance.toString()}`);

  const beforeKARBalance = await wallet.queryBalance(signer.address, karToken);
  const beforeKUSDBalance = await wallet.queryBalance(
    signer.address,
    kusdToken
  );

  console.log(`
KAR BEFOER: ${beforeKARBalance.freeBalance.toString()}
KUSD BEFOER: ${beforeKUSDBalance.freeBalance.toString()}
  `);

  await api.tx.dex
    .swapWithExactSupply(
      path.map((item) => item.toChainData()),
      supplyAmount.toChainData(),
      parameters.output.balance.mul(slippage, apiFee, apiAddress, referrerFee, referrerAddress).toChainData()
    )
    .signAndSend(signer, async (result) => {
      if (result.isInBlock) {
        const afterKARBalance = await wallet.queryBalance(
          signer.address,
          karToken
        );
        const afterKUSDBalance = await wallet.queryBalance(
          signer.address,
          kusdToken
        );

        console.log(`
KAR AFTER: ${afterKARBalance.freeBalance.toString()}
KAR AFTER: ${afterKUSDBalance.freeBalance.toString()}
RECEIVE: ${afterKUSDBalance.freeBalance
          .sub(beforeKUSDBalance.freeBalance)
          .toString()}
      `);
      }
    });
};

swapWithSDK();
