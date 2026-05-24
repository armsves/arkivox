/** NoxCompute on Arbitrum Sepolia (from iExec-Nox/demo-ctoken) */
export const NOX_COMPUTE_ADDRESS =
  "0xd464B198f06756a1d00be223634b85E0a731c229" as const;

/** Canonical Multicall3 — batches Nox validateInputProof + addViewer in one tx. */
export const MULTICALL3_ADDRESS =
  "0xcA11bde05977b3631167028862bE2a173976CA11" as const;

export const ARBITRUM_SEPOLIA_EXPLORER = "https://sepolia.arbiscan.io";

export const TEE_COOLDOWN_MS = 2_000;

export const noxComputeAbi = [
  {
    inputs: [
      { name: "handle", type: "bytes32" },
      { name: "owner", type: "address" },
      { name: "proof", type: "bytes" },
      { name: "teeType", type: "uint8" },
    ],
    name: "validateInputProof",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "handle", type: "bytes32" },
      { name: "viewer", type: "address" },
    ],
    name: "addViewer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "handle", type: "bytes32" },
      { name: "viewer", type: "address" },
    ],
    name: "removeViewer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "handle", type: "bytes32" },
      { name: "viewer", type: "address" },
    ],
    name: "isViewer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
