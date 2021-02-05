import { createSlice, Draft, PayloadAction } from '@reduxjs/toolkit';
import { isNil } from 'ramda';

import { DEFAULT_SLIPPAGE, Pool, SerializablePool } from 'api/pool/Pool';
import { Token } from 'api/token/Token';
import { SerializableTokenAccount, TokenAccount } from 'api/token/TokenAccount';
import { SYSTEM_PROGRAM_ID, WRAPPED_SOL_MINT } from 'constants/solana/bufferLayouts';
import { TokenPairState } from 'utils/types';

import { getPools, updatePool } from '../pool/PoolSlice';
import { getTokenAccounts, updateAccount } from '../wallet/WalletSlice';
import {
  getToAmount,
  selectPoolForTokenPair,
  selectTokenAccount,
  syncPools,
  syncTokenAccount,
  syncTokenAccounts,
  updateEntityArray,
} from './utils/tokenPair';

const initialSwapState = {
  firstAmount: 0,
  secondAmount: 0,
  firstToken: undefined,
  secondToken: undefined,
  firstTokenAccount: undefined,
  secondTokenAccount: undefined,
};

const initialState: TokenPairState = {
  ...initialSwapState,
  tokenAccounts: [],
  availablePools: [],
  slippage: DEFAULT_SLIPPAGE,
};

export const TOKEN_PAIR_SLICE_NAME = 'tokenPair';

const normalize = (
  oldState: TokenPairState,
  updatedState: Partial<TokenPairState>,
): TokenPairState => {
  const newState = {
    ...oldState,
    ...updatedState,
  };

  const firstTokenAccount = syncTokenAccount(newState.tokenAccounts, newState.firstTokenAccount);
  const secondTokenAccount = syncTokenAccount(newState.tokenAccounts, newState.secondTokenAccount);

  const selectedPool = selectPoolForTokenPair(
    newState.availablePools,
    newState.firstToken,
    newState.secondToken,
  );

  const poolTokenAccount = selectedPool
    ? selectTokenAccount(
        Token.from(selectedPool.poolToken),
        newState.tokenAccounts.map((account) => TokenAccount.from(account)),
        false,
      )
    : undefined;

  if (!isNil(updatedState.firstAmount) || updatedState.secondToken) {
    newState.secondAmount = getToAmount(newState.firstAmount, newState.firstToken, selectedPool);
  } else if (!isNil(updatedState.secondAmount) || updatedState.firstToken) {
    newState.firstAmount = getToAmount(newState.secondAmount, newState.secondToken, selectedPool);
  }

  return {
    ...newState,
    selectedPool,
    firstTokenAccount,
    secondTokenAccount,
    poolTokenAccount: poolTokenAccount?.serialize(),
  };
};

const updateAccountReducer = (
  state: Draft<TokenPairState>,
  action: PayloadAction<SerializableTokenAccount>,
) => {
  let serializedTokenAccount = action.payload;

  // Change SOL to WSOL in token pair
  if (serializedTokenAccount.mint.address === SYSTEM_PROGRAM_ID.toBase58()) {
    serializedTokenAccount = {
      ...serializedTokenAccount,
      mint: {
        ...serializedTokenAccount.mint,
        symbol: 'WSOL',
        address: WRAPPED_SOL_MINT.toBase58(),
        isSimulated: true,
      },
    };
  }

  // find and replace the pool in the list with the pool in the action
  const updatedAccounts = updateEntityArray(
    TokenAccount.from(serializedTokenAccount),
    state.tokenAccounts.map((account) => TokenAccount.from(account)),
  );

  return normalize(state, {
    tokenAccounts: updatedAccounts.map((account) => account.serialize()),
  });
};

const updatePoolReducer = (
  state: Draft<TokenPairState>,
  action: PayloadAction<SerializablePool>,
) => {
  const updatedPools = updateEntityArray(
    Pool.from(action.payload),
    state.availablePools.map((pool) => Pool.from(pool)),
  );
  return normalize(state, {
    availablePools: updatedPools.map((pool) => pool.serialize()),
  });
};

const tokenPairSlice = createSlice({
  name: TOKEN_PAIR_SLICE_NAME,
  initialState,
  reducers: {
    updateTokenPairState: (state, action: PayloadAction<Partial<TokenPairState>>) =>
      normalize(state, action.payload),
    clearTokenPairState: (state) => ({ ...state, ...initialSwapState }),
  },
  extraReducers: (builder) => {
    builder.addCase(getTokenAccounts.fulfilled, (state, action) =>
      syncTokenAccounts(state, action.payload),
    );
    builder.addCase(getPools.fulfilled, (state, action) => syncPools(state, action.payload));

    builder.addCase(updatePool, updatePoolReducer);
    builder.addCase(updateAccount, updateAccountReducer);
  },
});

export const { updateTokenPairState, clearTokenPairState } = tokenPairSlice.actions;
// eslint-disable-next-line import/no-default-export
export default tokenPairSlice.reducer;
