import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID, SEPOLIA_CHAIN_ID_DECIMAL } from '../contracts/CrowdFunding';

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
  }

  // Check if MetaMask is installed
  isMetaMaskInstalled() {
    return typeof window.ethereum !== 'undefined';
  }

  // Connect wallet
  async connectWallet() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('Please install MetaMask to use blockchain features');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      // Check if connected to Sepolia
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (chainId !== SEPOLIA_CHAIN_ID) {
        await this.switchToSepolia();
      }

      // Set up provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.account = accounts[0];

      // Initialize contract
      this.contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        this.signer
      );

      return this.account;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  // Switch to Sepolia network
  async switchToSepolia() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID,
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'SepoliaETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
        } catch (addError) {
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  }

  // Get connected account
  getAccount() {
    return this.account;
  }

  // Disconnect wallet
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
  }

  // Create a new campaign
  async createCampaign(campaignData) {
    if (!this.contract) {
      throw new Error('Wallet not connected');
    }

    try {
      const { title, description, target, deadline, image } = campaignData;
      
      // Convert target to Wei (assuming target is in ETH)
      const targetInWei = ethers.parseEther(target.toString());
      
      // Convert deadline to Unix timestamp (if not already)
      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);

      const tx = await this.contract.createCampaign(
        this.account, // owner
        title,
        description,
        targetInWei,
        deadlineTimestamp,
        image
      );

      const receipt = await tx.wait();
      console.log('Campaign created:', receipt);
      
      return receipt;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  // Get all campaigns
  async getCampaigns() {
    if (!this.contract) {
      // If wallet not connected, use read-only provider
      const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_INFURA_KEY');
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      try {
        const campaigns = await contract.getCampaigns();
        return this.formatCampaigns(campaigns);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        throw error;
      }
    }

    try {
      const campaigns = await this.contract.getCampaigns();
      return this.formatCampaigns(campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  }

  // Format campaigns data
  formatCampaigns(campaigns) {
    return campaigns.map((campaign, index) => ({
      id: index,
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: ethers.formatEther(campaign.target),
      deadline: new Date(Number(campaign.deadline) * 1000).toISOString(),
      amountCollected: ethers.formatEther(campaign.amountCollected),
      image: campaign.image,
      donators: campaign.donators,
      donations: campaign.donations.map(d => ethers.formatEther(d)),
      progress: (Number(ethers.formatEther(campaign.amountCollected)) / Number(ethers.formatEther(campaign.target))) * 100,
      status: Date.now() > Number(campaign.deadline) * 1000 ? 'expired' : 'active'
    }));
  }

  // Donate to a campaign
  async donateToCampaign(campaignId, amount) {
    if (!this.contract) {
      throw new Error('Wallet not connected');
    }

    try {
      const amountInWei = ethers.parseEther(amount.toString());
      
      const tx = await this.contract.donateToCampaign(campaignId, {
        value: amountInWei
      });

      const receipt = await tx.wait();
      console.log('Donation successful:', receipt);
      
      return receipt;
    } catch (error) {
      console.error('Error donating to campaign:', error);
      throw error;
    }
  }

  // Get donators for a specific campaign
  async getDonators(campaignId) {
    if (!this.contract) {
      throw new Error('Wallet not connected');
    }

    try {
      const [addresses, donations] = await this.contract.getDonators(campaignId);
      
      return addresses.map((address, index) => ({
        address,
        amount: ethers.formatEther(donations[index])
      }));
    } catch (error) {
      console.error('Error fetching donators:', error);
      throw error;
    }
  }

  // Get number of campaigns
  async getNumberOfCampaigns() {
    if (!this.contract) {
      throw new Error('Wallet not connected');
    }

    try {
      const count = await this.contract.numberOfCampaigns();
      return Number(count);
    } catch (error) {
      console.error('Error fetching campaign count:', error);
      throw error;
    }
  }

  // Listen to account changes
  onAccountsChanged(callback) {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else {
          this.account = accounts[0];
        }
        callback(accounts);
      });
    }
  }

  // Listen to chain changes
  onChainChanged(callback) {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', (chainId) => {
        callback(chainId);
        // Reload page when chain changes
        window.location.reload();
      });
    }
  }
}

export const blockchainService = new BlockchainService();
