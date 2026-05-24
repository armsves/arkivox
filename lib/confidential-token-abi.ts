/**
 * ERC-7984 confidential token ABI (iExec-Nox/demo-ctoken).
 * @see https://github.com/iExec-Nox/demo-ctoken/blob/main/lib/confidential-token-abi.ts
 */
export const confidentialTokenAbi = [
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "underlying",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "confidentialBalanceOf",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "wrap",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "encryptedAmount", type: "bytes32" },
      { name: "inputProof", type: "bytes" },
    ],
    name: "unwrap",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "unwrapAmount", type: "bytes32" },
      { name: "decryptionProof", type: "bytes" },
    ],
    name: "finalizeUnwrap",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "encryptedAmount", type: "bytes32" },
      { name: "inputProof", type: "bytes" },
    ],
    name: "confidentialTransfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "amount", type: "bytes32", indexed: true },
    ],
    name: "ConfidentialTransfer",
    type: "event",
  },
  {
    inputs: [
      { name: "receiver", type: "address", indexed: true },
      { name: "amount", type: "bytes32", indexed: false },
    ],
    name: "UnwrapRequested",
    type: "event",
  },
] as const;
