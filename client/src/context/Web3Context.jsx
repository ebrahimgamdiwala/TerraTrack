import React, { createContext, useContext, useState, useEffect } from 'react';
import { blockchainService } from '../services/blockchainService';
import { toast } from 'react-hot-toast';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if already connected
    checkConnection();

    // Listen to account changes
    blockchainService.onAccountsChanged((accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setIsConnected(false);
        toast.error('Wallet disconnected');
      } else {
        setAccount(accounts[0]);
        toast.success('Account changed');
      }
    });

    // Listen to chain changes
    blockchainService.onChainChanged((chainId) => {
      console.log('Chain changed to:', chainId);
    });
  }, []);

  const checkConnection = async () => {
    if (blockchainService.isMetaMaskInstalled()) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const connectedAccount = await blockchainService.connectWallet();
      setAccount(connectedAccount);
      setIsConnected(true);
      toast.success(`Connected: ${connectedAccount.substring(0, 6)}...${connectedAccount.substring(38)}`);
      return connectedAccount;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    blockchainService.disconnect();
    setAccount(null);
    setIsConnected(false);
    toast.success('Wallet disconnected');
  };

  const value = {
    account,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    blockchainService
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
