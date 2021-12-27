import type { FC } from 'react';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import type { ConnectedWallet } from '@p2p-wallet-web/core';
import {
  NETWORK_CONFIGS,
  SeedProvider,
  SolanaProvider,
  TokenAccountsProvider,
} from '@p2p-wallet-web/core';
import { SailProvider } from '@p2p-wallet-web/sail';

import {
  BlockchainProvider,
  ModalsProvider,
  NameServiceProvider,
  RatesProvider,
  SettingsProvider,
} from 'app/contexts';
import { ToastManager } from 'components/common/ToastManager';
import { Providers as SwapProviders } from 'components/pages/swap/Providers';
import { LockAndMintProvider } from 'utils/providers/LockAndMintProvider';

const onConnect = (wallet: ConnectedWallet) => {
  const walletPublicKey = wallet.publicKey.toBase58();
  const keyToDisplay =
    walletPublicKey.length > 20
      ? `${walletPublicKey.substring(0, 7)}.....${walletPublicKey.substring(
          walletPublicKey.length - 7,
          walletPublicKey.length,
        )}`
      : walletPublicKey;

  ToastManager.info('Wallet update', 'Connected to wallet ' + keyToDisplay);
};

const onDisconnect = () => {
  ToastManager.info('Wallet disconnected');
};

const CoreProviders: FC = ({ children }) => {
  return (
    <SeedProvider>
      <SolanaProvider
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        networkConfigs={NETWORK_CONFIGS}
      >
        <SailProvider>
          <TokenAccountsProvider>{children}</TokenAccountsProvider>
        </SailProvider>
      </SolanaProvider>
    </SeedProvider>
  );
};

const queryClient = new QueryClient();

export const Providers: FC = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <CoreProviders>
        <RatesProvider>
          <NameServiceProvider>
            <SettingsProvider>
              <BlockchainProvider>
                <LockAndMintProvider>
                  <SwapProviders>
                    <ModalsProvider>{children}</ModalsProvider>
                  </SwapProviders>
                </LockAndMintProvider>
              </BlockchainProvider>
            </SettingsProvider>
          </NameServiceProvider>
        </RatesProvider>
      </CoreProviders>
    </QueryClientProvider>
  );
};
