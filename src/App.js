import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import sampleDeveloper from './assets/sample-developer.svg';
import mintingAnimation from './assets/pick-axe.svg';

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import stickFigureDevelopersNFT from './utils/StickFigureDevelopersNFT.json';

// Constants
const TWITTER_HANDLE = 'jovanjester';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = 'https://testnets.opensea.io/assets/';
const TOTAL_MINT_COUNT = 50;

//const CONTRACT_ADDRESS = "0xE6DDc9b40FbA5f8643F6b4080EBE2C08516e915C";
//const CONTRACT_ADDRESS = "0xe7c1dCb0bA5C2e3e1061150C387Ff2534258639C"; // removed hardhat console, testing errors and events
const CONTRACT_ADDRESS = "0xD27a248980C427B80Ae8a794684C4280B3af0269";

const App = () => {

  /*
    * Just a state variable we use to store our user's public wallet. Don't forget to import useState.
    */
  const [currentAccount, setCurrentAccount] = useState("");
  const [message, setMessage] = useState("");

  const [isMinting, setIsMinting] = useState(false); // state variable for minting/mining animation
  const [lastMintedNFT, setLastMintedNFT] = useState("");
  const [mintedCount, setMintedCount] = useState(0);
  const [maxSupply, setMaxSupply] = useState(0);
  


  const checkIfWalletIsConnected = async () => {
    /*
    * First make sure we have access to window.ethereum
    */
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    /*
     * Check if we're authorized to access the user's wallet
     */
    const accounts = await ethereum.request({ method: 'eth_accounts' });

    /*
    * User can have multiple authorized accounts, we grab the first one if its there!
    */
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
      setupEventListener();
      getMaxNFTs();
      getMintedCount();
    } else {
      setMessage("Not connected to wallet")
      console.log("No authorized account found")
    }
  }

  /*
    * Implement your connectWallet method here
    */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      /*
      * Fancy method to request access to account.
      */
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      let chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log("Connected to chain " + chainId);
      // String, hex code of the chainId of the Rinkebey test network
      const rinkebyChainId = "0x4";
      if (chainId !== rinkebyChainId) {
        alert("You are not connected to the Rinkeby Test Network!");
      }
      /*
      * Boom! This should print out public address once we authorize Metamask.
      */
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      
      getMaxNFTs();
      getMintedCount();
      setMessage("Connected to your wallet successfully!")

      setupEventListener();
    } catch (error) {
      console.log(error)
    }
  }

  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, stickFigureDevelopersNFT.abi, signer);

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewDeveloper", (from, tokenId) => {
          setLastMintedNFT(`https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`);
          console.log(from, tokenId.toNumber());
          getMintedCount();
          setMessage("We've minted your NFT and sent it to your wallet. It may be blank right now. It can take up to 10 minutes to show up on OpenSea.");
          
        });

        console.log("Setup event listener!")

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }



  const askContractToMintNft = async () => {

    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, stickFigureDevelopersNFT.abi, signer);

        console.log("going to pop wallet now to pay gas, whales aren't afraid of gas fees!")
        let nftTxn = await connectedContract.createDeveloper();

        console.log("Mining... please wait.");
        setMessage("Minting in progress");
        setIsMinting(true);
        await nftTxn.wait();
        setIsMinting(false);
        setMessage("");

        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);

      } else {
        console.log("ethereum object doesn't exist");
      }
    } catch (error) {
      setIsMinting(false);
      setMessage("Something went wrong 😢, please try minting again");

      setLastMintedNFT("");
      console.log(error)
    }
  }



  // Render Methods
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  const renderMintingAnimation = () => {
    if (isMinting) {
      return (
        <div className="mint-animation-container">
          <img alt="Minting animation" className="pick-axe" src={mintingAnimation} />
        </div>
      );
    } else {
      return ("");
    }
  };

  const renderLastNftLink = () => {
    if (lastMintedNFT !== "") {
      return (
        <a target="_blank" href={lastMintedNFT}>Click here to view your NFT on OpenSea</a>
      );
    }

    return "";
  };
  
  const getMintedCount = async () => {
      try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, stickFigureDevelopersNFT.abi, signer);

        let devCount = await connectedContract.getDeveloperCount();

        console.log("Checking nft count...");

        console.log(`got this as devCount: ${devCount}`);
        setMintedCount(devCount.toNumber());
      } else {
        console.log("ethereum object doesn't exist");
      }
    } catch (error) {
      console.log(error)
    }  
  };

  const getMaxNFTs = async () => {
    //if (maxSupply != 0) return;
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, stickFigureDevelopersNFT.abi, signer);

        let max = await connectedContract.getMaxSupply();

        console.log("Checking max supply...");
        //await max.wait();

        console.log("got max supply> %d", max.toNumber());
        setMaxSupply(max.toNumber());
      } else {
        console.log("ethereum object doesn't exist");
      }
    } catch (error) {
      console.log("got error inside getMaxSupply");
      //console.log(error)
    }
  
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    getMaxNFTs();
    getMintedCount();
  }, []);

//   useEffect(() => {
// //    getMintedCount();

//   }, []);

  
  
  

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">Stick Figure Developer NFTs</p>
          <p className="sub-text">
            Your Stick Figure Developer NFT will be minted
            with a random facial expression, colorful clothing,
            and a programming language. On rare occasions, you will get a mythical <em>10x developer</em>.
          </p>
          <p className="counter">
            A total of <span>{mintedCount}</span> out of <span>{maxSupply}</span> have been minted
          </p>
          <p className="last-nft">{renderLastNftLink()}</p>
          <p className="message">{message}</p>
          {currentAccount === "" ? (
            renderNotConnectedContainer()
          ) : (
            <button onClick={askContractToMintNft} className="cta-button connect-wallet-button">
              Mint NFT
            </button>
          )}
          {renderMintingAnimation()}
          
          <img className="sample" alt="sample Stick Figure Developer NFT" src={sampleDeveloper} />
        </div>
        
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
          <button onClick={()=>{window.open('https://testnets.opensea.io/collection/stick-figure-developers-test-aosv2enpjs');}} className="opensea-button">
            🌊 View Collection on OpenSea
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
