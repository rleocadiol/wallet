import * as React from 'react';
import { Suspense, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { styled } from '@linaria/react';
import type { LoadableComponent } from '@loadable/component';
import loadable from '@loadable/component';
import { zIndexes } from '@p2p-wallet-web/ui';
import classNames from 'classnames';

import type { ModalPropsType } from 'app/contexts/general/modals/types';
import { ModalType } from 'app/contexts/general/modals/types';

const Wrapper = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: ${zIndexes.modal};

  display: flex;
  flex-direction: column;

  background-color: rgba(0, 0, 0, 0.6);

  user-select: none;

  &.nav {
    bottom: 57px;
  }
`;

const ModalWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

type ModalState = { modalType: ModalType; modalId: number; props: any };
type GetPresetFn = (modal?: ModalType) => Preset;
type Preset = 'nav' | 'regular';

const modalsMap = new Map<ModalType, LoadableComponent<ModalPropsType & any>>([
  // [SHOW_MODAL_ADD_COIN, loadable(() => import('components/modals/__AddCoinModal'))],
  [
    ModalType.SHOW_MODAL_ACTIONS_MOBILE,
    loadable(() => import('components/modals/ActionsMobileModal')),
  ],
  [
    ModalType.SHOW_MODAL_RECEIVE_BITCOIN,
    loadable(() => import('components/modals/ReceiveBitcoinModal')),
  ],
  [
    ModalType.SHOW_MODAL_TRANSACTION_CONFIRM,
    loadable(() => import('components/modals/TransactionConfirmModal')),
  ],
  [
    ModalType.SHOW_MODAL_TRANSACTION_DETAILS,
    loadable(() => import('components/modals/TransactionInfoModals/TransactionDetailsModal')),
  ],
  [
    ModalType.SHOW_MODAL_TRANSACTION_STATUS_SEND,
    loadable(() => import('components/modals/TransactionInfoModals/TransactionStatusSendModal')),
  ],
  [
    ModalType.SHOW_MODAL_TRANSACTION_STATUS_SWAP,
    loadable(() => import('components/modals/TransactionInfoModals/TransactionStatusSwapModal')),
  ],
  [
    ModalType.SHOW_MODAL_CLOSE_TOKEN_ACCOUNT,
    loadable(() => import('components/modals/CloseTokenAccountModal')),
  ],
  [
    ModalType.SHOW_MODAL_PROCEED_USERNAME,
    loadable(() => import('components/modals/ProceedUsernameModal')),
  ],
  [
    ModalType.SHOW_MODAL_CHOOSE_BUY_TOKEN_MOBILE,
    loadable(() => import('components/modals/ChooseBuyTokenMobileModal')),
  ],
  [
    ModalType.SHOW_MODAL_SELECT_LIST_MOBILE,
    loadable(() => import('components/modals/SelectListMobileModal')),
  ],
  [ModalType.SHOW_MODAL_ERROR, loadable(() => import('components/modals/ErrorModal'))],
]);

const promises = new Map();
let modalIdCounter = 0;

const getPreset: GetPresetFn = (modal) => {
  switch (modal) {
    case ModalType.SHOW_MODAL_ACTIONS_MOBILE:
      return 'nav';
    default:
      return 'regular';
  }
};

const ModalsContext = React.createContext<{
  openModal: <T, S extends {}>(modalType: ModalType, props?: S) => Promise<T | void>;
  closeModal: (modalId: number) => void;
  closeTopModal: () => void;
}>({
  openModal: () => Promise.resolve(),
  closeModal: () => {},
  closeTopModal: () => {},
});

export function ModalsProvider({ children = null as any }) {
  const [modals, setModals] = useState<ModalState[]>([]);

  const setPageScroll = (overflow: 'hidden' | 'scroll') =>
    (document.documentElement.style.overflow = overflow);

  useEffect(() => {
    setPageScroll(modals.length ? 'hidden' : 'scroll');
  }, [modals.length]);

  const openModal = useCallback((modalType: ModalType, props?: any) => {
    ++modalIdCounter;

    setModals((state) => [
      ...state,
      {
        modalType,
        modalId: modalIdCounter,
        props,
      },
    ]);

    const promise = new Promise((resolve) => {
      promises.set(modalIdCounter, {
        modalId: modalIdCounter,
        resolve,
      });
    });

    promise.modalId = modalIdCounter;

    return promise;
  }, []);

  const closeModal = useCallback((modalId: number, result?: any) => {
    setModals((state) => state.filter((modal) => modal.modalId !== modalId));

    const dialogInfo = promises.get(modalId);
    if (dialogInfo) {
      dialogInfo.resolve(result);
      promises.delete(modalId);
    }

    return result;
  }, []);

  const closeTopModal = useCallback(() => {
    if (!modals.length) {
      return;
    }

    closeModal(modals[modals.length - 1].modalId);
  }, [modals]);

  const handleWrapperClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // handle click only on element
      if (e.target !== e.currentTarget) {
        return;
      }

      closeTopModal();
    },
    [closeTopModal],
  );

  const preparedModals = useMemo(() => {
    return modals.map((modal) => {
      const ModalComponent = modalsMap.get(modal.modalType);

      if (!ModalComponent) {
        return null;
      }

      return (
        <Suspense fallback={null} key={modal.modalId}>
          <ModalWrapper onMouseDown={handleWrapperClick}>
            <ModalComponent
              {...modal.props}
              key={modal.modalId}
              close={(result?: any) => closeModal(modal.modalId, result)}
            />
          </ModalWrapper>
        </Suspense>
      );
    });
  }, [modals, handleWrapperClick, closeModal]);

  const preset = getPreset(modals.at(-1)?.modalType);

  return (
    <ModalsContext.Provider
      value={{
        openModal,
        closeModal,
        closeTopModal,
      }}
    >
      {children}
      {preparedModals.length > 0 ? (
        <Wrapper className={classNames(preset)}>{preparedModals}</Wrapper>
      ) : undefined}
    </ModalsContext.Provider>
  );
}

export function useModals() {
  const { openModal, closeModal, closeTopModal } = useContext(ModalsContext);
  return { openModal, closeModal, closeTopModal };
}
