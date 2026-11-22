export const factoryAbi = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "FailedDeployment",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "balance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "InsufficientBalance",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "channel",
				"type": "address"
			}
		],
		"name": "ChannelCreated",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "channelImplementation",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "createChannel",
		"outputs": [
			{
				"internalType": "address",
				"name": "channel",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "getUserChannels",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

export const channelAbi = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "ECDSAInvalidSignature",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "length",
				"type": "uint256"
			}
		],
		"name": "ECDSAInvalidSignatureLength",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "s",
				"type": "bytes32"
			}
		],
		"name": "ECDSAInvalidSignatureS",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidInitialization",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidShortString",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NotInitializing",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "str",
				"type": "string"
			}
		],
		"name": "StringTooLong",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [],
		"name": "ChannelDisconnected",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "sessionKey",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "expiry",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "spendingLimit",
				"type": "uint256"
			}
		],
		"name": "ChannelReconnected",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [],
		"name": "EIP712DomainChanged",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "ETHReceived",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint64",
				"name": "version",
				"type": "uint64"
			}
		],
		"name": "Initialized",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "target",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bytes",
				"name": "data",
				"type": "bytes"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "executor",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "relayerFee",
				"type": "uint256"
			}
		],
		"name": "InstantExecuted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "channelSpendingLimit",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "channelSpent",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "disconnectChannel",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "eip712Domain",
		"outputs": [
			{
				"internalType": "bytes1",
				"name": "fields",
				"type": "bytes1"
			},
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "version",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "chainId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "verifyingContract",
				"type": "address"
			},
			{
				"internalType": "bytes32",
				"name": "salt",
				"type": "bytes32"
			},
			{
				"internalType": "uint256[]",
				"name": "extensions",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "target",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "data",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "nonce",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "relayerFee",
				"type": "uint256"
			}
		],
		"name": "getInstantExecuteHash",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_sessionKey",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_expiry",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_spendingLimit",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_nonce",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_deadline",
				"type": "uint256"
			}
		],
		"name": "getReconnectHash",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_owner",
				"type": "address"
			}
		],
		"name": "initialize",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "target",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "data",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "_nonce",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_relayerFee",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "_signature",
				"type": "bytes"
			}
		],
		"name": "instantExecuteWithSignature",
		"outputs": [
			{
				"internalType": "bytes",
				"name": "",
				"type": "bytes"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "isChannelActive",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_sessionKey",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "duration",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "spendingLimit",
				"type": "uint256"
			}
		],
		"name": "reconnect",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_sessionKey",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_expiry",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_spendingLimit",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_nonce",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_deadline",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "_signature",
				"type": "bytes"
			}
		],
		"name": "reconnectWithSignature",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "sessionExpiry",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "sessionKey",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "positions",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "trader",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "collateral",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "collateralUsd",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "size",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "sizeUsd",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "entryPrice",
						"type": "uint256"
					},
					{
						"internalType": "int256",
						"name": "lastFundingSnapshot",
						"type": "int256"
					},
					{
						"internalType": "uint256",
						"name": "openTime",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "isLong",
						"type": "bool"
					}
				],
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
},
{
	"inputs": [
		{
			"internalType": "uint256",
			"name": "",
			"type": "uint256"
		}
	],
	"name": "usedNonces",
	"outputs": [
		{
			"internalType": "bool",
			"name": "",
			"type": "bool"
		}
	],
	"stateMutability": "view",
	"type": "function"
},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "withdrawETH",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	}
]

export const perpTradingAbi = [
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "collateral",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "leverage",
					"type": "uint256"
				},
				{
					"internalType": "bool",
					"name": "isLong",
					"type": "bool"
				},
				{
					"internalType": "bytes[]",
					"name": "priceUpdateData",
					"type": "bytes[]"
				},
				{
					"internalType": "uint256",
					"name": "expectedPrice",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "maxSlippageBps",
					"type": "uint256"
				}
			],
			"name": "openPosition",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				}
			],
			"name": "positions",
			"outputs": [
				{
					"components": [
						{
							"internalType": "address",
							"name": "trader",
							"type": "address"
						},
						{
							"internalType": "uint256",
							"name": "collateral",
							"type": "uint256"
						},
						{
							"internalType": "uint256",
							"name": "collateralUsd",
							"type": "uint256"
						},
						{
							"internalType": "uint256",
							"name": "size",
							"type": "uint256"
						},
						{
							"internalType": "uint256",
							"name": "sizeUsd",
							"type": "uint256"
						},
						{
							"internalType": "uint256",
							"name": "entryPrice",
							"type": "uint256"
						},
						{
							"internalType": "int256",
							"name": "lastFundingSnapshot",
							"type": "int256"
						},
						{
							"internalType": "uint256",
							"name": "openTime",
							"type": "uint256"
						},
						{
							"internalType": "bool",
							"name": "isLong",
							"type": "bool"
						},
						{
							"internalType": "uint256",
							"name": "stopLossPrice",
							"type": "uint256"
						},
						{
							"internalType": "uint256",
							"name": "takeProfitPrice",
							"type": "uint256"
						}
					],
					"internalType": "struct PerpetualTrading.Position",
					"name": "",
					"type": "tuple"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "getOrders",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "trader",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "size",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "collateral",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "isLong",
						"type": "bool"
					},
					{
						"internalType": "uint256",
						"name": "triggerPrice",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "isStopLoss",
						"type": "bool"
					},
					{
						"internalType": "bool",
						"name": "isTakeProfit",
						"type": "bool"
					},
					{
						"internalType": "uint256",
						"name": "expiryTime",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "createdTime",
						"type": "uint256"
					}
				],
				"internalType": "struct PerpetualTrading.Order[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "positionId",
				"type": "uint256"
			}
		],
		"name": "getPosition",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "collateral",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "size",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "leverage",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "openPrice",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "isLong",
						"type": "bool"
					},
					{
						"internalType": "uint256",
						"name": "openTime",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "takeProfit",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "stopLoss",
						"type": "uint256"
					}
				],
				"internalType": "struct Position",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "size",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "collateral",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isLong",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "triggerPrice",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isStopLoss",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "isTakeProfit",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "expiryTime",
				"type": "uint256"
			}
		],
		"name": "createLimitOrder",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes[]",
				"name": "priceUpdateData",
				"type": "bytes[]"
			},
			{
				"internalType": "uint256",
				"name": "expectedPrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "maxSlippageBps",
				"type": "uint256"
			}
		],
		"name": "closePosition",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "stopLossPrice",
				"type": "uint256"
			}
		],
		"name": "setStopLoss",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "takeProfitPrice",
				"type": "uint256"
			}
		],
		"name": "setTakeProfit",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "stopLossPrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "takeProfitPrice",
				"type": "uint256"
			}
		],
		"name": "setStopLossAndTakeProfit",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "sizeUsd",
				"type": "uint256"
			}
		],
		"name": "getMaxLeverage",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
] as const
