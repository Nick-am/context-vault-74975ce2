import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";

export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const isWrongNetwork = isConnected && chain?.id !== sepolia.id;

  function handleConnect() {
    const injected = connectors.find((c) => c.id === "injected");
    if (injected) {
      connect({ connector: injected });
    }
  }

  function switchToSepolia() {
    switchChain({ chainId: sepolia.id });
  }

  return {
    address: address as `0x${string}` | undefined,
    isConnected,
    isWrongNetwork,
    connect: handleConnect,
    disconnect,
    switchToSepolia,
  };
}
