// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ArkivoxHandleRegistry
/// @notice On-chain store for Nox bytes32 handles that wrap the AES encryption keys
///         referenced by Arkiv Braga ciphertext (notes + confidential ledger rows).
///         Amount handles from cToken live on the ERC-7984 contracts; this registry
///         holds the DEK handles from NoxCompute.
contract ArkivoxHandleRegistry {
    struct HandleRecord {
        address owner;
        bytes32 contentHash;
        string kind;
        uint64 committedAt;
        bool exists;
    }

    /// handle => committed record (immutable once set)
    mapping(bytes32 handle => HandleRecord) public records;

    mapping(address owner => bytes32[]) private _handlesByOwner;

    event HandleCommitted(
        address indexed owner,
        bytes32 indexed handle,
        bytes32 indexed contentHash,
        string kind
    );

    error HandleAlreadyCommitted();
    error ZeroHandle();

    /// @param handle Nox bytes32 (DEK wrap on NoxCompute for Arkiv payloads)
    /// @param contentHash keccak256 of the Arkiv JSON payload that references this handle
    /// @param kind e.g. "encrypted_note" | "token_transaction"
    function commitHandle(
        bytes32 handle,
        bytes32 contentHash,
        string calldata kind
    ) external {
        if (handle == bytes32(0)) revert ZeroHandle();
        if (records[handle].exists) revert HandleAlreadyCommitted();

        records[handle] = HandleRecord({
            owner: msg.sender,
            contentHash: contentHash,
            kind: kind,
            committedAt: uint64(block.timestamp),
            exists: true
        });
        _handlesByOwner[msg.sender].push(handle);

        emit HandleCommitted(msg.sender, handle, contentHash, kind);
    }

    function getRecord(bytes32 handle)
        external
        view
        returns (
            address owner,
            bytes32 contentHash,
            string memory kind,
            uint64 committedAt,
            bool exists
        )
    {
        HandleRecord storage r = records[handle];
        return (r.owner, r.contentHash, r.kind, r.committedAt, r.exists);
    }

    function handlesOf(address owner) external view returns (bytes32[] memory) {
        return _handlesByOwner[owner];
    }

    function handleCount(address owner) external view returns (uint256) {
        return _handlesByOwner[owner].length;
    }
}
