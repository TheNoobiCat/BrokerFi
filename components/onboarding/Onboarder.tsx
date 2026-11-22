"use client";

import { useEffect, useState, useCallback } from "react";
import { FaTimes } from "react-icons/fa";
import Portal from "../ui/Portal";
import { useAccount, useWalletClient } from "wagmi";
import { getBalance } from "wagmi/actions";
import { config } from "@/app/providers";
import { createChannelTxn, createChannelGasless, generateReconnectSignature, getChannelList } from "@/services/channel";
import { arbitrumSepolia } from "viem/chains";
import { formatEther, parseEther } from "viem";
import publicClient from "@/blockchain/publicClient";
import { generatePrivateKey } from "viem/accounts";
import {
  SessionRelayerClient,
  createSessionCreationData,
  type SessionCreateResponse,
  type SessionCreateProgress,
  type SessionCreateError,
  type SessionCreateResult,
} from "@/services/sessionRelayer";
import { useSession } from "@/store/SessionContext";
import { useUI } from "@/store/UIContext";
import SessionConnected from "../SessionConnected";
import { setSessionKey, getSessionAddress, signTypedData } from "@/services/keyVault";

import BridgeStep from "./BridgeStep";
import ChannelList from "./ChannelList";
import RelayerSelection from "./RelayerSelection";
import Turnstile from "react-turnstile";

import SessionConfig from "./SessionConfig";
import { GhostSquare } from "../ui/GhostSquare";
export { GhostSquare } from "../ui/GhostSquare";

type ChannelState =
  | { status: "notcreated" }
  | { status: "creating" }
  | { status: "relayer_accepted" }
  | { status: "pending_block" }
  | { status: "batch_processing"; timing?: any }
  | { status: "deployed"; txHash?: string }
  | { status: "error"; message: string }
  | { status: "loading" };

interface CreateResult {
  success: boolean;
  txHash?: string;
  channelAddress?: string;
  error?: string;
}

interface OnboarderProps {
  isOpen: boolean;
  onClose: () => void;
  createChannel?: () => Promise<CreateResult>;
  mode?: 'default' | 'channelSelector';
}

export default function Onboarder({
  isOpen,
  onClose,
  createChannel,
  mode = 'default',
}: OnboarderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [needBalanceNotice, setNeedBalanceNotice] = useState(false);
  const [showFiatIframe, setShowFiatIframe] = useState(false);
  const [channel, setChannel] = useState<ChannelState>({ status: "loading" });
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [balance, setBalance] = useState<string | null>(null);
  const [availableChannels, setAvailableChannels] = useState<`0x${string}`[]>([]);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Session context
  const { setSession, channelAddress: activeChannel } = useSession();
  const { bridgeRequest, closeBridge, setBridgeChannel, bridgeChannel, depositOptionsOpen, depositOptionsChannel, closeDepositOptions, openDepositOptions } = useUI();
  
  // Success screen state
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [successData, setSuccessData] = useState<{
    channelAddress: string;
    txHash: string;
    sessionWalletAddress: string;
    expiry: bigint;
    spendingLimit: bigint;
  } | null>(null);

  const [initialChannelCount, setInitialChannelCount] = useState<number>(0);

  // New state to support channel balances
  const [channelBalances, setChannelBalances] = useState<Record<string, string>>({});

  useEffect(() => {
    if (bridgeRequest) {
      // move to the Bridge step
      setCurrentStep(1);
      // clear the request so it doesn't repeatedly trigger
      closeBridge();
    }
  }, [bridgeRequest, closeBridge]);

  // State for session configuration modal
  const [sessionConfigChannel, setSessionConfigChannel] = useState<`0x${string}` | null>(null);
  const [sessionLength, setSessionLength] = useState<number>(480); // 8 hours default
  const [sessionConnecting, setSessionConnecting] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState(false);
  const [networkFeeInfoOpen, setNetworkFeeInfoOpen] = useState(false);
  
  // Relayer selection state
  const [showRelayerSelection, setShowRelayerSelection] = useState(false);
  const [selectedRelayer, setSelectedRelayer] = useState<string>("default");
  const [pendingChannelAddress, setPendingChannelAddress] = useState<`0x${string}` | null>(null);

  // Captcha state for gasless channel creation
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  // WebSocket session creation state
  const [relayerClient, setRelayerClient] = useState<SessionRelayerClient | null>(null);
  
  // Additional channel creation loading state
  const [creatingAdditionalChannel, setCreatingAdditionalChannel] = useState(false);
  const [roadmapDone, setRoadmapDone] = useState(false);

  const checkChannelCreation = useCallback(async () => {
    if (!address) return;
    
    try {
      const channels = await getChannelList(address, publicClient);
      if (channels.success && channels.channels) {
        const currentCount = channels.channels.length;
        // For additional channels, wait for the count to increase
        // For initial channels, wait for at least one channel
        const expectedCount = initialChannelCount > 0 ? initialChannelCount + 1 : 1;
        
        if (currentCount >= expectedCount) {
          // Channel was created, update status and reload channel list
          setChannel({ status: "deployed" });
          setAvailableChannels(channels.channels!);
          // Automatically proceed to channel connection for the newest channel
          setTimeout(() => {
            const channelList = channels.channels!;
            const newChannel = channelList[channelList.length - 1]; // Get the last (newest) channel
            setPendingChannelAddress(newChannel);
            setShowRelayerSelection(true);
          }, 1000);
        } else {
          // Still not created, continue polling
          setTimeout(checkChannelCreation, 2000); // Check again in 2 seconds
        }
      } else {
        // Still not created, continue polling
        setTimeout(checkChannelCreation, 2000);
      }
    } catch (error) {
      // On error, continue polling
      setTimeout(checkChannelCreation, 2000);
    }
  }, [address, publicClient, initialChannelCount, setChannel, setAvailableChannels, setPendingChannelAddress, setShowRelayerSelection]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) return;
      const balance = await getBalance(config, {
        chainId: arbitrumSepolia.id,
        address,
      });
      setBalance(Number(formatEther(balance.value)).toFixed(5).toString());
    };
    fetchBalance();
  }, [address]);

  // If the user has any ETH on the target chain, skip the bridge step entirely
  useEffect(() => {
    // If the user already has ETH on the target chain, stay on the channel step
    // (channel creation is now the first step). Previously this skipped the
    // bridge step when bridge was first.
    if (balance !== null && Number(balance) > 0) {
      const t = setTimeout(() => setCurrentStep(0), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [balance]);

  useEffect(() => {
    // clear notice if balance becomes available or channel discovered
    if ((balance !== null && Number(balance) > 0) || channel.status === "deployed") {
      // defer to avoid sync setState within render/effect warnings
      const t = setTimeout(() => setNeedBalanceNotice(false), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [balance, channel.status]);

  const next = () => {
    // When channel creation is the first step, advancing to the bridge step
    // should be allowed freely from the channel list. Only protect advancing
    // beyond the bridge in future multi-step flows (not used here). So simply
    // advance one step if possible.
    const nextStep = currentStep + 1;
    if (nextStep < 2) setCurrentStep(nextStep);
  };


  useEffect(() => {
    const loadChannelStatus = async () => {
      if (publicClient && address) {
        getChannelList(address, publicClient).then((res) => {
          if (res.success) {
            if (res.channels && res.channels.length > 0) {
              setChannel({ status: "deployed" });
              setAvailableChannels(res.channels);
            } else {
              setChannel({ status: "notcreated" });
            }
          } else {
            setChannel({ status: "error", message: res.error ?? "Unknown error" });
          }
        });
      }
    };
    loadChannelStatus();
  }, [address]);

  // When availableChannels are set, fetch each channel's balance for display
  useEffect(() => {
    if (!availableChannels || availableChannels.length === 0) {
      setChannelBalances({});
      return;
    }
    let mounted = true;
    const loadBalances = async () => {
      const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x4b1fACeF3553C0c7A67D6AB240394E9aad566c2d';
      const map: Record<string, string> = {};
      await Promise.all(
        availableChannels.map(async (addr) => {
          try {
            const bal = await publicClient.readContract({
              address: usdcAddress as `0x${string}`,
              abi: [
                {
                  inputs: [{ name: 'account', type: 'address' }],
                  name: 'balanceOf',
                  outputs: [{ name: '', type: 'uint256' }],
                  stateMutability: 'view',
                  type: 'function',
                },
              ],
              functionName: 'balanceOf',
              args: [addr],
            });
            map[addr] = (Number(bal) / 1e6).toFixed(2).toString();
          } catch {
            map[addr] = "0.00";
          }
        })
      );
      if (mounted) setChannelBalances(map);
    };
    loadBalances();
    return () => {
      mounted = false;
    };
  }, [availableChannels]);

  // Cleanup WebSocket connection when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (relayerClient) {
        relayerClient.disconnect();
      }
    };
  }, [relayerClient]);

  // Cleanup when session config modal is closed
  useEffect(() => {
    if (!sessionConfigChannel && relayerClient) {
    // Delay disconnect to allow any pending messages to be processed
    setTimeout(() => {
      relayerClient.disconnect();
      setRelayerClient(null);
    }, 1000);  }
}, [sessionConfigChannel, relayerClient]);  const handleCreateChannel = async () => {
    let isAdditionalCreation = false;
    const impl =
      createChannel ??
      (async () => {
        if (!walletClient)
          return { success: false, error: "No wallet connected" };

        // Use gasless creation if captcha is available, otherwise fall back to direct transaction
        if (captchaToken) {
          const relayerUrl = process.env.NEXT_PUBLIC_RELAYER_WS_URL || 'ws://localhost:4001/ws';
          return await createChannelGasless(walletClient, captchaToken, relayerUrl, (status, data) => {
            if (status === 'relayer_accepted') {
              setChannel({ status: "relayer_accepted" });
            } else if (status === 'pending_block') {
              setChannel({ status: "batch_processing", timing: { remainingSeconds: 20 } });
            } else if (status === 'batch_timing') {
              setChannel({ status: "batch_processing", timing: data });
            } else if (status === 'channel_created') {
              setChannel({ status: "deployed", txHash: data.txHash });
              // Fetch updated channel list
              if (address) {
                getChannelList(address, publicClient).then((res) => {
                  if (res.success && res.channels) {
                    setAvailableChannels(res.channels);
                    if (!isAdditionalCreation) {
                      // For initial creation, reload the page
                      window.location.reload();
                    }
                  }
                });
              }
            }
          });
        } else {
          return await createChannelTxn(walletClient);
        }
      });

    // Set appropriate loading state based on current channel status
    if (channel.status === "deployed") {
      isAdditionalCreation = true;
      setCreatingAdditionalChannel(true);
      // For additional channels, remember the current count but don't change status yet
      setInitialChannelCount(availableChannels.length);
      // Status will be updated by the callback when relayer confirms
    } else {
      setChannel({ status: "creating" });
    }

    try {
      const res = await impl();
      if (res.success && res.channelAddress) {
        setChannel({ status: "deployed", txHash: res.txHash });
        // Reset captcha token after successful creation
        setCaptchaToken(null);
        setCaptchaError(null);
        onClose();
      } else if (res.success && !res.channelAddress) {
        // Batch processing mode - don't change status yet
        // Reset captcha token
        setCaptchaToken(null);
        setCaptchaError(null);
      } else {
        const errorMsg = res.error ?? "Unknown error";
        if (channel.status === "deployed") {
          // Don't overwrite deployed status for additional channel creation failure
          setSessionError(errorMsg);
        } else {
          setChannel({ status: "error", message: errorMsg });
        }
        // Reset captcha token on error
        setCaptchaToken(null);
      }
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message?: unknown }).message
        : undefined;

      const errorMsg = String(message ?? err);
      if (channel.status === "deployed") {
        // Don't overwrite deployed status for additional channel creation failure
        setSessionError(errorMsg);
      } else {
        setChannel({ status: "error", message: errorMsg });
      }
      // Reset captcha token on error
      setCaptchaToken(null);
    } finally {
      setCreatingAdditionalChannel(false);
    }
  };

  const openSessionConfig = (channelAddress: `0x${string}`) => {
    // Show relayer selection first
    setPendingChannelAddress(channelAddress);
    setShowRelayerSelection(true);
    setSelectedRelayer("default");
  };
  
  const proceedToChannelConfig = () => {
    if (pendingChannelAddress) {
      setSessionConfigChannel(pendingChannelAddress);
      setSessionLength(480); // Default 8 hours (480 minutes)
      setSessionError(null);
      setAdvancedOptionsOpen(false);
      setShowRelayerSelection(false);
    }
  };

  const connectToChannel = async () => {
    if (!sessionConfigChannel) return;
    setSessionError(null);
    setSessionConnecting(true);
    
    try {
      // Generate session key and store in service worker (encrypted, never leaves SW)
      const sessionPrivKey = generatePrivateKey();
      await setSessionKey(sessionPrivKey);

      // Get session address from service worker (without exposing private key)
      const sessionAddress = await getSessionAddress();
      if (!sessionAddress) throw new Error("Failed to get session address");

      if (!walletClient) throw new Error("No wallet connected");

      const durationInSeconds = sessionLength * 60; // Convert minutes to seconds
      const signedData = await generateReconnectSignature(
        walletClient,
        sessionConfigChannel,
        sessionAddress as `0x${string}`,
        durationInSeconds
      );

      // Connect to WebSocket relayer
      const wsUrl = process.env.NEXT_PUBLIC_RELAYER_WS_URL || 'ws://localhost:4001/ws';
      const client = new SessionRelayerClient(wsUrl);
      setRelayerClient(client);

      // Set up callbacks for WebSocket responses
      client.setCallbacks({
        onResponse: (response: SessionCreateResponse) => {
          if (response.status === 'error' && response.reason) {
            setSessionError(response.reason);
          }
        },
        onProgress: (progress: SessionCreateProgress) => {
        },
        onError: (error: SessionCreateError) => {
          setSessionError(`${error.step} error: ${error.detail}`);
        },
        onResult: (result: SessionCreateResult) => {
          console.log('onResult called with:', result);
          try {
            if (result.status === 'submitted' && result.txHash) {
              
              // Store session metadata in context (private key is already in service worker vault)
              setSession({
                sessionWallet: { address: sessionAddress, type: 'local' } as any,
                channelAddress: sessionConfigChannel,
                isConnected: true,
                connectionTxHash: result.txHash,
                expiry: BigInt(Math.floor(Date.now() / 1000 + Number(signedData.duration))),
              });

              // Show success screen and stop connecting
              setSuccessData({
                channelAddress: sessionConfigChannel,
                txHash: result.txHash,
                sessionWalletAddress: sessionAddress,
                expiry: BigInt(Math.floor(Date.now() / 1000 + Number(signedData.duration))),
                spendingLimit: BigInt(0),
              });
              setShowSuccessScreen(true);
              setSessionConnecting(false); // Stop loading on success
              setSessionConfigChannel(null);
            } else if (result.status === 'validated') {
              // For simulation-only mode
              setTimeout(() => {
                setSessionConfigChannel(null);
                setSessionConnecting(false); // Stop loading on validation
              }, 2000);
            }
          } catch (error) {
            console.error('Error in onResult callback:', error);
            setSessionError('Failed to process session creation result');
            setSessionConnecting(false);
          }
        },
        onConnectionError: (error) => {
          setSessionError("Failed to connect to relayer service");
          setSessionConnecting(false); // Stop loading on error
        },
        onConnectionClose: (event) => {
          if (event.code !== 1000) { // Not a normal close
            setSessionError("Connection to relayer was lost");
            setSessionConnecting(false); // Stop loading on connection close
          }
        }
      });

      // Connect to WebSocket
      await client.connect();

      // Create and send session creation request
      const sessionData = createSessionCreationData(
        sessionConfigChannel,
        signedData.sessionKey,
        signedData.duration,
        signedData.nonce,
        signedData.signature,
        arbitrumSepolia.id
      );

      await client.createSession(sessionData);

    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message?: unknown }).message
          : undefined;
      const text = String(message ?? err ?? "Unknown error");
      setSessionError(text);
      setSessionConnecting(false); // Stop loading on catch error
    }
    // Note: We don't use finally block here because we want to keep loading
    // until the relayer responds with success or error via callbacks
  }

  

  if (!isOpen) return null;

  const title = depositOptionsOpen ? "Deposit into BrokerFi" : mode === 'channelSelector' ? "Select Channel" : (currentStep === 0 ? (channel.status === "loading" || channel.status === "deployed" || channel.status === "batch_processing" || channel.status === "relayer_accepted" ? "Establish Connection" : "InstantExecution Setup") : "Deposit into BrokerFi");
  const content = depositOptionsOpen ? (
    <BridgeStep balance={balance} setShowFiatIframe={setShowFiatIframe} channelAddress={depositOptionsChannel} />
  ) : (currentStep === 0 ? (
    channel.status === "batch_processing" || channel.status === "relayer_accepted" ? (
      <BatchProcessingScreen 
        channel={channel} 
        onClose={onClose} 
        setChannel={setChannel}
        address={address}
        setPendingChannelAddress={setPendingChannelAddress}
        setShowRelayerSelection={setShowRelayerSelection}
      />
    ) : (
      <ChannelList
        channel={channel}
        availableChannels={availableChannels}
        channelBalances={channelBalances}
        activeChannel={activeChannel as `0x${string}` | null | undefined}
        openSessionConfig={openSessionConfig}
        creatingAdditionalChannel={creatingAdditionalChannel}
        handleCreateChannel={handleCreateChannel}
        sessionConnecting={sessionConnecting}
        sessionConfigChannel={sessionConfigChannel}
        onRoadmapComplete={(v: boolean) => setRoadmapDone(v)}
        captchaToken={captchaToken}
        setCaptchaToken={setCaptchaToken}
        captchaError={captchaError}
        setCaptchaError={setCaptchaError}
        onOpenDepositOptions={(channelAddr) => {
          if (channelAddr) {
            setBridgeChannel(channelAddr);
            // Update session state
            setSession({ isConnected: true, channelAddress: channelAddr });
          }
          openDepositOptions(channelAddr);
        }}
        connectError={connectError}
        setConnectError={setConnectError}
      />
    )
  ) : (
    <BridgeStep balance={balance} setShowFiatIframe={setShowFiatIframe} />
  ));

  const backdropClick = () => {
    if (channel.status === "creating") return;
    closeDepositOptions();
    setBridgeChannel(null);
    onClose();
  };

  return (
    <Portal>
      {/* Only show main onboarding modal when funding modal is not open and session config is not open and relayer selection is not open and success screen is not shown */}
      {!sessionConfigChannel && !showRelayerSelection && !showSuccessScreen && (
        <>
          <div
            className="fixed inset-0 z-10000 bg-black/80 backdrop-blur-sm"
            onClick={backdropClick}
          />

          <div className="fixed inset-0 z-10001 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-surface border border-white/20 rounded-lg shadow-2xl overflow-visible">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm font-sans">
                        {currentStep + 1}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white font-sans">
                        {title}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (channel.status === "creating") return;
                      closeDepositOptions();
                      setBridgeChannel(null);
                      onClose();
                    }}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Close onboarding"
                  >
                    <FaTimes className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {content}

                <div className="space-y-3">
                  {currentStep === 0 ? (
                    // Channel creation step UI
                    channel.status !== "loading" && channel.status !== "batch_processing" && channel.status !== "relayer_accepted" && channel.status !== "pending_block" ? (
                      channel.status === 'deployed' ? null : (
                        roadmapDone ? (
                          <>
                            {/* Captcha widget */}
                            <div className="w-full max-w-xs mx-auto mb-4">
                              <Turnstile
                                sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                                onVerify={setCaptchaToken}
                                onError={(error) => setCaptchaError(error.toString())}
                                onExpire={() => {
                                  setCaptchaToken(null);
                                  setCaptchaError(null);
                                }}
                                theme="dark"
                              />
                              {captchaError && (
                                <div className="mt-2 text-sm text-red-400 text-center">
                                  {captchaError}
                                </div>
                              )}
                            </div>

                            <button
                              onClick={handleCreateChannel}
                              disabled={channel.status === "creating" || !captchaToken}
                              className="w-full p-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-60"
                            >
                              {channel.status === "creating" ? "Creating channel..." :
                               "Create Channel Now"}
                            </button>
                          </>
                        ) : null
                      )
                    ) : null
                  ) : (
                    // Bridge step UI — Next button removed per request
                    (
                      needBalanceNotice ? (
                        <p className="text-xs text-yellow-300 text-center mt-1">
                          You need ETH on Arbitrum Sepolia to continue. Fund your wallet or use an existing channel.
                        </p>
                      ) : null
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Deposit modal removed (funding handled elsewhere) */}

      {/* Relayer Selection Modal */}
      {showRelayerSelection && (
        <RelayerSelection selectedRelayer={selectedRelayer} setSelectedRelayer={setSelectedRelayer} setShowRelayerSelection={setShowRelayerSelection} proceedToChannelConfig={proceedToChannelConfig} />
      )}

      {/* Session Configuration Modal */}
      {sessionConfigChannel && !showRelayerSelection && (
        <SessionConfig
          sessionConfigChannel={sessionConfigChannel}
          setSessionConfigChannel={setSessionConfigChannel}
          sessionLength={sessionLength}
          setSessionLength={setSessionLength}
          sessionConnecting={sessionConnecting}
          sessionError={sessionError}
          setSessionError={setSessionError}
          advancedOptionsOpen={advancedOptionsOpen}
          setAdvancedOptionsOpen={setAdvancedOptionsOpen}
          connectToChannel={connectToChannel}
        />
      )}

      {/* Success Screen */}
      {showSuccessScreen && successData && (
        <SessionConnected
          txHash={successData.txHash}
          expiry={successData.expiry}
          onContinue={() => {
            setShowSuccessScreen(false);
            setSuccessData(null);
            onClose();
          }}
        />
      )}
    </Portal>
  );
}

function BatchProcessingScreen({ 
  channel, 
  onClose, 
  setChannel,
  address,
  setPendingChannelAddress,
  setShowRelayerSelection
}: { 
  channel: ChannelState; 
  onClose: () => void;
  setChannel: (channel: ChannelState) => void;
  address: `0x${string}` | undefined;
  setPendingChannelAddress: (address: `0x${string}` | null) => void;
  setShowRelayerSelection: (show: boolean) => void;
}) {
  const [timeRemaining, setTimeRemaining] = useState<number>(20); // Default 20 seconds

  useEffect(() => {
    if (channel.status === "batch_processing" && channel.timing?.remainingSeconds) {
      setTimeRemaining(channel.timing.remainingSeconds);
    } else if (channel.status !== "batch_processing") {
      // Clear countdown when not in batch processing
      setTimeRemaining(0);
    }

    // Start polling immediately when entering batch processing
    // if (channel.status === "batch_processing") {
    //   checkChannelCreation();
    // }

    // Only start countdown when actually in batch processing
    if (channel.status === "batch_processing") {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          // Reset to 20 when it reaches 0, creating a continuous countdown
          if (prev <= 1) {
            return 20;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [channel]);

  const progress = Math.max(0, Math.min(100, ((20 - timeRemaining) / 20) * 100));

  const isBatchProcessing = channel.status === "batch_processing";
  const isRelayerAccepted = channel.status === "relayer_accepted";

  return (
    <div className="p-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="text-xl font-bold text-white font-sans mb-2">
          {isRelayerAccepted ? "Request Accepted" : "Processing Channel Creation"}
        </h3>
        <p className="text-white/60 text-sm font-sans">
          {isRelayerAccepted 
            ? "Your channel creation request has been accepted and is waiting to be batched."
            : "Your channel creation request has been added to a batch that will process shortly."
          }
        </p>
      </div>

      {isBatchProcessing && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white/60 font-sans">Batch Processing</span>
            <span className="text-sm text-white font-mono">{timeRemaining}s remaining</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="text-center">
        <p className="text-xs text-white/40 font-sans mb-4">
          {isRelayerAccepted 
            ? "Please wait while your request is queued for processing."
            : "The relayer batches channel creation requests to optimize gas usage."
          }
        </p>
      </div>
    </div>
  );
}