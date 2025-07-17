import type { ReactNode } from 'react';
import { memo, useState } from 'react';

import { StyleSheet } from 'react-native';

import {
  Button,
  Page,
  ScrollView,
  SizableText,
  Stack,
  TextArea,
  YStack,
  Dialog,
} from '@onekeyhq/components';
import type { IPageNavigationProp } from '@onekeyhq/components/src/layouts/Navigation';
import platformEnv from '@onekeyhq/shared/src/platformEnv';
import type { ITabDeveloperParamList } from '@onekeyhq/shared/src/routes';
import { ETabDeveloperRoutes } from '@onekeyhq/shared/src/routes';
import appStorage from '@onekeyhq/shared/src/storage/appStorage';
import { EAppSyncStorageKeys } from '@onekeyhq/shared/src/storage/syncStorage';
import { EAccountSelectorSceneName } from '@onekeyhq/shared/types';

import backgroundApiProxy from '../../../background/instance/backgroundApiProxy';
import { AccountSelectorProviderMirror } from '../../../components/AccountSelector';
import useAppNavigation from '../../../hooks/useAppNavigation';
import useCookie from '../../../hooks/useCookie';
import { useActiveAccount } from '../../../states/jotai/contexts/accountSelector';
import { presetNetworksMap } from '@onekeyhq/shared/src/config/presetNetworks';

const useStorage = platformEnv.isNative
  ? (key: EAppSyncStorageKeys, initialValue?: boolean) => {
      const [data, setData] = useState(
        initialValue || appStorage.syncStorage.getBoolean(key),
      );
      const setNewData = (value: boolean) => {
        appStorage.syncStorage.set(key, value);
        setData(value);
      };
      return [data, setNewData];
    }
  : useCookie;

function PartContainer({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <YStack>
      <Stack paddingTop="$5" paddingBottom="$2.5">
        <SizableText size="$headingMd">{title}</SizableText>
      </Stack>

      <YStack
        padding="$2.5"
        gap="$5"
        borderColor="$border"
        borderWidth={StyleSheet.hairlineWidth}
        borderRadius="$2"
      >
        {children}
      </YStack>
    </YStack>
  );
}

function ConnectWalletConnectDapp() {
  const [val, setVal] = useState('');
  return (
    <PartContainer title="WalletConnect connect to Dapp">
      <TextArea
        placeholder="walletconnect dapp qrcode uri"
        value={val}
        onChangeText={setVal}
      />
      <Button
        onPress={async () => {
          if (val) {
            await backgroundApiProxy.walletConnect.connectToDapp(val);
            setVal('');
          }
        }}
      >
        Connect
      </Button>
    </PartContainer>
  );
}

function TestRefreshCmp() {
  const {
    activeAccount: { accountName },
  } = useActiveAccount({ num: 0 });
  console.log('TestRefresh refresh', accountName);
  return <Button>TestRefresh: {accountName}</Button>;
}
const TestRefresh = memo(TestRefreshCmp);
const TabDeveloper = () => {
  const navigation =
    useAppNavigation<IPageNavigationProp<ITabDeveloperParamList>>();

  // @ts-expect-error
  const [rrtStatus, changeRRTStatus] = useStorage(EAppSyncStorageKeys.rrt);

  const { activeAccount } = useActiveAccount({
    num: 0,
  });
  const walletId = activeAccount.wallet?.id;

  return (
    <ScrollView
      flex={1}
      width="100%"
      paddingHorizontal="$5"
      contentContainerStyle={{ paddingBottom: '$5' }}
      gap="$5"
    >
      <PartContainer title="Components">
        <Button
          onPress={async () => {
            if (!walletId) {
              console.warn('No active walletId found');
              return;
            }
            const batchCreateAccounts =
              await backgroundApiProxy.serviceBatchCreateAccount.previewBatchBuildAccounts(
                {
                  walletId,
                  networkId: presetNetworksMap.ckb.id,
                  deriveType: 'default',
                  indexes: new Array(100).fill(null).map((_, i) => i),
                  showOnOneKey: false,
                  saveToCache: false,
                  isVerifyAddressAction: false,
                },
              );
            const newCkbAddresses = batchCreateAccounts.accountsForCreate.map(
              (account) => account.address,
            );

            Dialog.show({
              title: 'Ckb Addresses',
              description: (
                <div style={{ maxHeight: 500, fontSize: 10, overflow: 'auto' }}>
                  {newCkbAddresses.map((address, idx) => (
                    <div key={address}>
                      {idx + 1}. {address}
                    </div>
                  ))}
                </div>
              ),
            });
          }}
        >
          show ckb addresses
        </Button>
      </PartContainer>

      <PartContainer title="Components">
        <Button
          onPress={() => {
            navigation.push(ETabDeveloperRoutes.ComponentsGallery);
          }}
        >
          Gallery
        </Button>
      </PartContainer>

      <PartContainer title="Debug Router & Tabs & List">
        <Button
          onPress={() => {
            navigation.push(ETabDeveloperRoutes.DevHome);
          }}
        >
          DevHome Page
        </Button>
      </PartContainer>

      <PartContainer title="Debugger Signature Records">
        <Button
          onPress={() => {
            navigation.push(ETabDeveloperRoutes.SignatureRecord);
          }}
        >
          Signature Records
        </Button>
      </PartContainer>

      <PartContainer title="Debug Tools">
        <Button
          onPress={() => {
            if (platformEnv.isNative) {
              (changeRRTStatus as (value: boolean) => void)(!rrtStatus);
              alert('Please manually restart the app.');
            } else {
              const status = rrtStatus === '1' ? '0' : '1';
              (changeRRTStatus as (value: string) => void)(status);
              if (platformEnv.isRuntimeBrowser) {
                if (status === '0') {
                  localStorage.removeItem('$$OnekeyReactRenderTrackerEnabled');
                } else {
                  localStorage.setItem(
                    '$$OnekeyReactRenderTrackerEnabled',
                    'true',
                  );
                }
              }
              globalThis.location.reload();
            }
          }}
        >
          {platformEnv.isNative ? (
            <>
              {rrtStatus
                ? 'Disabled react-render-tracker'
                : 'Enabled react-render-tracker'}
            </>
          ) : (
            <>
              {rrtStatus === '1'
                ? 'Disabled react-render-tracker'
                : 'Enabled react-render-tracker'}
            </>
          )}
        </Button>
      </PartContainer>

      {platformEnv.isNative ? (
        <PartContainer title="NetworkLogger">
          <Button
            onPress={() => {
              navigation.push(ETabDeveloperRoutes.NetworkLogger);
            }}
          >
            NetworkLogger
          </Button>
        </PartContainer>
      ) : null}

      <PartContainer title="Async Import Test">
        <Button
          onPress={async () => {
            const { test } = await import('./asyncImportTest');
            test();
          }}
        >
          Async Import Test
        </Button>
      </PartContainer>
      <ConnectWalletConnectDapp />
      <TestRefresh />
      {/* <WalletConnectModalNative2 /> */}
    </ScrollView>
  );
};

const TabDeveloperContainer = (): React.JSX.Element => {
  return (
    <AccountSelectorProviderMirror
      config={{
        sceneName: EAccountSelectorSceneName.home,
      }}
      enabledNum={[0]}
    >
      <Page>
        <Page.Body>
          <TabDeveloper />
        </Page.Body>
      </Page>
    </AccountSelectorProviderMirror>
  );
};

export default TabDeveloperContainer;
