
import type { FunctionComponent } from 'react';

import { styled } from '@linaria/react';
import type { TokenAccount } from '@p2p-wallet-web/core';
import { up } from '@p2p-wallet-web/ui';

import { LoaderBlock } from 'components/common/LoaderBlock';
import { useSortedTokens } from 'components/pages/home/TokensWidget/TokenAccountList/hooks/useSortedTokens';

import { TokenAccountRow } from './TokenAccountRow';

// import { Connection, PublicKey } from "@solana/web3.js";
// import { deprecated } from "@metaplex-foundation/mpl-token-metadata";


const Wrapper = styled.div`
  display: grid;
  grid-gap: 8px;

  ${up.tablet} {
    grid-gap: 16px;
    margin: initial;
  }
`;

type Props = {
  items: TokenAccount[];
  isHidden?: boolean;
};

export const TokenAccountList: FunctionComponent<Props> = ({ items = [], isHidden = false }) => {
  const tokenAccounts = useSortedTokens(items);
  return (
    <Wrapper>
      {tokenAccounts.map(
        (item) =>
          item.key && (
            <TokenAccountRow key={item.key.toBase58()} tokenAccount={item} isHidden={isHidden} />
          ),
      )}
    </Wrapper>
  );
};
