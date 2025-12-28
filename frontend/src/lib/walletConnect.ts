import { createAppKit } from '@reown/appkit'
import {
  mainnet,
  arbitrum,
  polygon,
  bsc,
  optimism,
  base,
  avalanche,
  sepolia,
  polygonAmoy,
  bscTestnet,
  arbitrumSepolia,
  optimismSepolia,
  baseSepolia,
  avalancheFuji,
  holesky,
} from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import type { AppKitNetwork } from '@reown/appkit/networks'

// 1. Get a project ID at https://dashboard.reown.com
const projectId = '1649ecdee1654b6127cd176b192a21d2'

// Environment variable to switch between mainnet and testnet
const USE_TESTNET = import.meta.env.VITE_USE_TESTNET === 'true' || false

// Define all mainnet networks
export const mainnetNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet,
  polygon,
  bsc,
  arbitrum,
  optimism,
  base,
  avalanche,
]

// Define all testnet networks
export const testnetNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [
  sepolia,
  holesky,
  polygonAmoy,
  bscTestnet,
  arbitrumSepolia,
  optimismSepolia,
  baseSepolia,
  avalancheFuji,
]

// Combine all networks for wallet support
const allNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [
  ...mainnetNetworks,
  ...testnetNetworks,
]

// Select networks based on environment
export const networks = USE_TESTNET ? testnetNetworks : mainnetNetworks

// 2. Set up Wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: allNetworks,
})

// 3. Configure the metadata
const metadata = {
  name: 'ChainExplorer',
  description: 'Multi-Chain Blockchain Explorer with Wallet Integration',
  url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
}

// 4. Create and export the modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: allNetworks,
  metadata,
  projectId,
  features: { analytics: true },
})

// Export functions to open modal programmatically
export const openConnectModal = () => modal.open()
export const openNetworkModal = () => modal.open({ view: 'Networks' })

// Export current mode
export const isTestnetMode = USE_TESTNET

export default modal

// Attempt to disconnect any adapters/connectors we can reach.
export const disconnect = async (): Promise<void> => {
  try {
    const adapters = (modal as any).adapters || [wagmiAdapter]
    for (const adapter of adapters) {
      try {
        if (typeof (adapter as any).disconnect === 'function') {
          await (adapter as any).disconnect()
          continue
        }

        // Some adapters expose a connector with disconnect method
        if (adapter?.connector && typeof adapter.connector.disconnect === 'function') {
          await adapter.connector.disconnect()
          continue
        }
      } catch (err) {
        // swallow per-adapter errors and try the next
        // eslint-disable-next-line no-console
        console.warn('adapter disconnect error', err)
      }
    }

    // Clear common possible stored keys from wallets/adapters
    try {
      const keys = ['wagmi.wallet', 'reown.session', 'reown__session', 'connected_wallet']
      keys.forEach((k) => localStorage.removeItem(k))
    } catch {}

    // Emit a window event so app state managers can react
    try {
      window.dispatchEvent(new CustomEvent('wallet:disconnected'))
    } catch {}
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('disconnect failed', e)
  }
}
